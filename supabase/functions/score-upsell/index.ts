// score-upsell — berechnet contacts.upsell_score (+ upsell_drivers) für Bestandskunden.
//
// Aufbau 1:1 wie score-churn-risk:
//  1. Body { organizationId (Pflicht), contactId? }.
//  2. Gewichte FRISCH aus settings.thresholds.upsell_weights — Default-Fallback = 048-Seed-Spiegel.
//  3. Kunden laden (contact_status='kunde'). contacts hat KEIN deleted_at (Inaktive = 'archiviert').
//  4. Progressive Data Logic — nur VERFÜGBARE Datenpunkte; Score 0–100 nach verfügbaren Punkten
//     normalisiert. Keine Datenbasis → SKIP (nie 0 erfinden).
//  5. Update upsell_score/upsell_drivers NUR bei echter Änderung. audit via trg_contacts_audit.
//  6. Return { updated, skipped, org_id }.
//
// Basis-Trigger (immer aus Sales OS): hohe Antwortrate (last_reply_at > last_contacted_at) ·
// letzter Kontakt < 7T · Heat heiss/warm · aktiver (nicht-terminaler) Deal vorhanden.
// positive_sentiment + no_upsell_attempt: keine Datenbasis → per Progressive Data Logic weggelassen.
// Treiber landen in upsell_drivers (eigenes Feld; score_drivers gehört dem Churn-Score).
//
// deploy: supabase functions deploy score-upsell
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAY_MS = 86_400_000;
const RECENT_CONTACT_DAYS = 7; // „letzter Kontakt < 7T"
const TERMINAL_STAGES = ["gewonnen", "verloren"]; // nicht-terminal = aktiver Deal

// Default-Gewichte (Fallback, falls settings.thresholds.upsell_weights fehlt) — Spiegel Seed 048.
const DEFAULT_UPSELL_WEIGHTS = {
  reply_rate: 20,
  recent_contact: 15,
  heat_hot: 20,
  positive_sentiment: 25, // keine Datenbasis → nicht bewertet (Progressive Data Logic)
  no_upsell_attempt: 15,  // keine Datenbasis → nicht bewertet
  active_deal: 10,
};
type UpsellWeights = typeof DEFAULT_UPSELL_WEIGHTS;
type Driver = { signal: string; points: number; source: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  try {
    const { organizationId, contactId } = await req.json().catch(() => ({}));
    if (!organizationId) return json({ error: "organizationId required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 2. Gewichte aus settings (eine Zeile pro Org), frisch.
    const { data: settings, error: sErr } = await supabase
      .from("settings")
      .select("thresholds")
      .eq("organization_id", organizationId)
      .single();
    if (sErr) throw sErr;
    const w: UpsellWeights = { ...DEFAULT_UPSELL_WEIGHTS, ...(settings?.thresholds?.upsell_weights ?? {}) };

    // 3. Bestandskunden (contact_status='kunde'; contacts hat kein Soft-Delete).
    let cq = supabase
      .from("contacts")
      .select("id, last_contacted_at, last_reply_at, heat_status, upsell_score, upsell_drivers")
      .eq("organization_id", organizationId)
      .eq("contact_status", "kunde");
    if (contactId) cq = cq.eq("id", contactId);
    const { data: contacts, error: cErr } = await cq;
    if (cErr) throw cErr;

    const ids = (contacts ?? []).map((c: { id: string }) => c.id);

    // Deals dieser Kunden (nicht soft-gelöscht) → hasAnyDeal + hasActiveDeal (nicht-terminal).
    const hasAnyDeal = new Set<string>();
    const hasActiveDeal = new Set<string>();
    if (ids.length) {
      const { data: deals, error: dErr } = await supabase
        .from("deals")
        .select("contact_id, stage")
        .eq("organization_id", organizationId)
        .in("contact_id", ids)
        .is("deleted_at", null);
      if (dErr) throw dErr;
      for (const d of (deals ?? []) as Array<{ contact_id: string | null; stage: string | null }>) {
        if (!d.contact_id) continue;
        hasAnyDeal.add(d.contact_id);
        if (!TERMINAL_STAGES.includes(d.stage ?? "")) hasActiveDeal.add(d.contact_id);
      }
    }

    const now = Date.now();
    let updated = 0;
    let skipped = 0;

    for (const c of (contacts ?? []) as Array<{
      id: string; last_contacted_at: string | null; last_reply_at: string | null;
      heat_status: string | null; upsell_score: number | null; upsell_drivers: Driver[] | null;
    }>) {
      let available = 0;
      let earned = 0;
      const drivers: Driver[] = [];

      // ── Kommunikations-Signale (verfügbar wenn last_contacted_at vorhanden) ──
      if (c.last_contacted_at) {
        const days = Math.max(0, Math.floor((now - new Date(c.last_contacted_at).getTime()) / DAY_MS));

        available += w.reply_rate;
        const replied = !!c.last_reply_at && new Date(c.last_reply_at).getTime() > new Date(c.last_contacted_at).getTime();
        if (replied) { earned += w.reply_rate; drivers.push({ signal: "reply_rate", points: w.reply_rate, source: "messages" }); }

        available += w.recent_contact;
        if (days < RECENT_CONTACT_DAYS) { earned += w.recent_contact; drivers.push({ signal: "recent_contact", points: w.recent_contact, source: "messages" }); }
      }

      // ── Heat-Signal (verfügbar wenn heat_status gesetzt) ──
      if (c.heat_status) {
        available += w.heat_hot;
        if (c.heat_status === "heiss" || c.heat_status === "warm") { earned += w.heat_hot; drivers.push({ signal: "heat_hot", points: w.heat_hot, source: "activity" }); }
      }

      // ── Aktiver Deal (verfügbar wenn ≥1 Deal existiert) ──
      if (hasAnyDeal.has(c.id)) {
        available += w.active_deal;
        if (hasActiveDeal.has(c.id)) { earned += w.active_deal; drivers.push({ signal: "active_deal", points: w.active_deal, source: "activity" }); }
      }

      // 4. Keine Datenbasis → SKIP (Honesty).
      if (available === 0) { skipped++; continue; }

      const upsell = Math.round((earned / available) * 100);

      // 5. Nur bei echter Änderung (Score ODER Treiber verändert).
      const sameScore = upsell === c.upsell_score;
      const sameDrivers = JSON.stringify(drivers) === JSON.stringify(c.upsell_drivers ?? []);
      if (sameScore && sameDrivers) continue;

      const { error: uErr } = await supabase
        .from("contacts")
        .update({ upsell_score: upsell, upsell_drivers: drivers })
        .eq("organization_id", organizationId)
        .eq("id", c.id);
      if (uErr) throw uErr;
      updated++;
    }

    return json({ updated, skipped, org_id: organizationId });
  } catch (e) {
    // Supabase-Fehler sind oft Plain-Objects (PostgrestError) → nicht Error-Instanz. Voll serialisieren.
    const msg = e instanceof Error ? e.message
      : (e && typeof e === "object" ? JSON.stringify(e) : String(e));
    return json({ error: msg }, 500);
  }
});
