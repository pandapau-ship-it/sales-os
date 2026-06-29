// score-churn-risk — berechnet contacts.churn_score (+ score_drivers, data_sources) für Bestandskunden.
//
// Aufbau 1:1 wie score-heat-status (Vorlage):
//  1. Body { organizationId (Pflicht), contactId? } — Cron: nur org · Trigger: + contactId.
//  2. Gewichte + Schwelle FRISCH aus settings.thresholds (churn_weights + churn_risk_threshold) — nie
//     hardcodiert; Default-Fallback = Spiegel des 048-Seeds.
//  3. Kunden laden (contact_status='kunde', nicht soft-gelöscht; mit contactId → nur dieser).
//  4. Progressive Data Logic — nur VERFÜGBARE Datenpunkte zählen; Score 0–100 nach verfügbaren Punkten
//     normalisiert. Kein einziger Datenpunkt (brandneuer Kunde) → SKIP (kein Score, nie 0 erfinden).
//  5. Update churn_score/score_drivers/data_sources NUR bei echter Änderung — kein unnötiger Write.
//     audit_log entsteht automatisch über den DB-Trigger trg_contacts_audit (audit_write).
//  6. Return { updated, skipped, org_id }.
//
// Basis-Signale (immer aus Sales OS): last_contact >30T · kein Reply auf letzte Mail · überfällige offene
// Tasks · Inaktivität >14T · Heat kalt/tot. Erweiterte Signale (Sherloq/Stripe/Support/intent) existieren
// nicht → per Progressive Data Logic weggelassen. Tag-Schwellen (30/14) sind Teil der Signal-Definition.
//
// deploy: supabase functions deploy score-churn-risk
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAY_MS = 86_400_000;
const LAST_CONTACT_DAYS = 30; // „Letzter Kontakt > 30T"
const INACTIVE_DAYS = 14;     // „Tage ohne Aktivität > 14T"

// Default-Gewichte (nur Fallback, falls settings.thresholds.churn_weights fehlt) — Spiegel Seed 048 + Fix 052.
const DEFAULT_CHURN_WEIGHTS = {
  last_contact: 25,
  no_reply: 20,
  overdue_tasks: 0,  // SCORE-FIX (052): misst AM-To-do-Disziplin, nicht Kundengesundheit → 0 bis D49-Usage da ist
  inactive_days: 20,
  heat_cold: 20,
};
type ChurnWeights = typeof DEFAULT_CHURN_WEIGHTS;

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
    const w: ChurnWeights = { ...DEFAULT_CHURN_WEIGHTS, ...(settings?.thresholds?.churn_weights ?? {}) };

    // 3. Bestandskunden laden (contact_status='kunde'). contacts hat KEIN Soft-Delete (deleted_at) —
    //    Inaktive laufen über contact_status='archiviert', also reicht der kunde-Filter.
    let cq = supabase
      .from("contacts")
      .select("id, last_contacted_at, last_reply_at, heat_status, churn_score, score_drivers, data_sources")
      .eq("organization_id", organizationId)
      .eq("contact_status", "kunde");
    if (contactId) cq = cq.eq("id", contactId);
    const { data: contacts, error: cErr } = await cq;
    if (cErr) throw cErr;

    const ids = (contacts ?? []).map((c: { id: string }) => c.id);

    // Offene Tasks dieser Kunden (completed_at NULL, deleted_at NULL) → hasOpenTask + overdue (due_at < now).
    const nowIso = new Date().toISOString();
    const hasOpenTask = new Set<string>();
    const overdueTask = new Set<string>();
    if (ids.length) {
      const { data: tasks, error: tErr } = await supabase
        .from("tasks")
        .select("contact_id, due_at")
        .eq("organization_id", organizationId)
        .in("contact_id", ids)
        .is("completed_at", null)
        .is("deleted_at", null);
      if (tErr) throw tErr;
      for (const tk of (tasks ?? []) as Array<{ contact_id: string | null; due_at: string | null }>) {
        if (!tk.contact_id) continue;
        hasOpenTask.add(tk.contact_id);
        if (tk.due_at && tk.due_at < nowIso) overdueTask.add(tk.contact_id);
      }
    }

    const now = Date.now();
    let updated = 0;
    let skipped = 0;

    for (const c of (contacts ?? []) as Array<{
      id: string; last_contacted_at: string | null; last_reply_at: string | null;
      heat_status: string | null; churn_score: number | null;
      score_drivers: Driver[] | null; data_sources: string[] | null;
    }>) {
      let available = 0;
      let earned = 0;
      const drivers: Driver[] = [];
      const sources = new Set<string>();

      // ── Kommunikations-Signale (Basis: last_contacted_at vorhanden) ──
      if (c.last_contacted_at) {
        sources.add("messages");
        const days = Math.max(0, Math.floor((now - new Date(c.last_contacted_at).getTime()) / DAY_MS));

        available += w.last_contact;
        if (days > LAST_CONTACT_DAYS) { earned += w.last_contact; if (w.last_contact > 0) drivers.push({ signal: "last_contact", points: w.last_contact, source: "messages" }); }

        available += w.inactive_days;
        if (days > INACTIVE_DAYS) { earned += w.inactive_days; if (w.inactive_days > 0) drivers.push({ signal: "inactive_days", points: w.inactive_days, source: "activity" }); }

        available += w.no_reply;
        const noReply = !c.last_reply_at || new Date(c.last_reply_at).getTime() < new Date(c.last_contacted_at).getTime();
        if (noReply) { earned += w.no_reply; if (w.no_reply > 0) drivers.push({ signal: "no_reply", points: w.no_reply, source: "messages" }); }
      }

      // ── Aktivitäts-Signal: überfällige offene Tasks (nur verfügbar wenn ≥1 offene Task) ──
      if (hasOpenTask.has(c.id)) {
        sources.add("activity");
        available += w.overdue_tasks;
        // 0-Punkte-Treiber NICHT listen (Gewicht aktuell 0, [052]/[D49]) — sonst "Überfällige Tasks +0" im Tooltip.
        if (overdueTask.has(c.id)) { earned += w.overdue_tasks; if (w.overdue_tasks > 0) drivers.push({ signal: "overdue_tasks", points: w.overdue_tasks, source: "activity" }); }
      }

      // ── Heat-Signal (verfügbar wenn heat_status berechnet) ──
      if (c.heat_status) {
        sources.add("activity");
        available += w.heat_cold;
        if (c.heat_status === "kalt" || c.heat_status === "tot") { earned += w.heat_cold; if (w.heat_cold > 0) drivers.push({ signal: "heat_cold", points: w.heat_cold, source: "activity" }); }
      }

      // 4. Keine Datenbasis → SKIP (Honesty: kein Score, nicht 0).
      if (available === 0) { skipped++; continue; }

      const churn = Math.round((earned / available) * 100);
      const dataSources = [...sources];

      // 5. Nur bei echter Änderung schreiben (Score ODER Treiber/Quellen verändert).
      const sameScore = churn === c.churn_score;
      const sameDrivers = JSON.stringify(drivers) === JSON.stringify(c.score_drivers ?? []);
      const sameSources = JSON.stringify(dataSources) === JSON.stringify(c.data_sources ?? []);
      if (sameScore && sameDrivers && sameSources) continue;

      const { error: uErr } = await supabase
        .from("contacts")
        .update({ churn_score: churn, score_drivers: drivers, data_sources: dataSources })
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
