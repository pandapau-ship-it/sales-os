// score-heat-status — berechnet contacts.heat_status aus contacts.last_contacted_at.
//
// Ablauf:
//  1. organizationId (Pflicht) + optional contactId aus dem Body (Cron: nur org; Trigger: + contactId).
//  2. Heat-Schwellen aus settings.thresholds.heat_status laden — NIE hardcodiert, pro Org via
//     Settings änderbar → wird hier immer frisch gelesen.
//  3. Kontakte laden (nicht soft-gelöscht; mit contactId → nur dieser eine).
//  4. Pro Kontakt: last_contacted_at NULL → ÜBERSPRINGEN (Honesty: kein Heat ohne Datenbasis,
//     nie auf 'kalt'/'tot' zwingen). Sonst days = floor(now - last_contacted_at) → Stufe.
//  5. Update contacts.heat_status NUR bei Änderung — kein unnötiger Write.
//     audit_log entsteht automatisch über den DB-Trigger trg_contacts_audit (audit_write).
//  6. Return { updated, skipped, org_id }.
//
// Trennung der Konzepte: heat_status gehört zu contacts (wie warm ist der Kontakt?) und basiert auf
// last_contacted_at — stagnation_days (deals) ist Aufgabe von score-deal-health. Schwellen nur aus
// settings; Heat-Slugs sind eine stabile Konstante (Deno kann die TS-Lib nicht importieren).
//
// deploy: supabase functions deploy score-heat-status
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAY_MS = 86_400_000;

// Default-Schwellen (nur Fallback, falls settings.thresholds.heat_status fehlt) — Spiegel des Seeds.
const DEFAULT_THRESHOLDS = {
  heiss_max_days: 3,
  warm_max_days: 7,
  lauwarm_max_days: 14,
  kalt_max_days: 30,
  tot_from_days: 31,
};

type HeatThresholds = typeof DEFAULT_THRESHOLDS;

// Tage seit letztem Kontakt → Heat-Slug (DB-Enum-Werte: heiss|warm|lauwarm|kalt|tot).
function heatForDays(days: number, t: HeatThresholds): string {
  if (days <= t.heiss_max_days) return "heiss";
  if (days <= t.warm_max_days) return "warm";
  if (days <= t.lauwarm_max_days) return "lauwarm";
  if (days < t.tot_from_days) return "kalt"; // (> kalt_max_days, aber noch nicht tot)
  return "tot";
}

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

    // 2. Heat-Schwellen aus settings (eine Zeile pro Org), frisch.
    const { data: settings, error: sErr } = await supabase
      .from("settings")
      .select("thresholds")
      .eq("organization_id", organizationId)
      .single();
    if (sErr) throw sErr;
    const t: HeatThresholds = { ...DEFAULT_THRESHOLDS, ...(settings?.thresholds?.heat_status ?? {}) };

    // 3. Kontakte laden (nicht soft-gelöscht).
    let q = supabase
      .from("contacts")
      .select("id, heat_status, last_contacted_at")
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    if (contactId) q = q.eq("id", contactId);
    const { data: contacts, error: cErr } = await q;
    if (cErr) throw cErr;

    const now = Date.now();
    let updated = 0;
    let skipped = 0;

    for (const c of (contacts ?? []) as Array<{ id: string; heat_status: string | null; last_contacted_at: string | null }>) {
      // 4. Ohne Datenbasis kein Heat — überspringen (nie 'kalt'/'tot' erfinden).
      if (!c.last_contacted_at) { skipped++; continue; }

      const days = Math.max(0, Math.floor((now - new Date(c.last_contacted_at).getTime()) / DAY_MS));
      const newHeat = heatForDays(days, t);

      // 6. Nur bei echter Änderung schreiben.
      if (newHeat === c.heat_status) continue;

      const { error: uErr } = await supabase
        .from("contacts")
        .update({ heat_status: newHeat })
        .eq("organization_id", organizationId)
        .eq("id", c.id);
      if (uErr) throw uErr;
      updated++;
    }

    return json({ updated, skipped, org_id: organizationId });
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
