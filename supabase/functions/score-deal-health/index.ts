// score-deal-health — berechnet deals.stagnation_days und markiert stagnierende Deals.
//
// Ablauf:
//  1. organizationId (Pflicht) + optional dealId aus dem Body (Cron: nur org; Trigger: + dealId).
//  2. Schwellenwerte aus settings.pipeline_stages[].stagnation_days laden — NIE hardcodiert,
//     pro Org via AI-Chat änderbar → wird hier immer frisch gelesen.
//  3. Aktive (nicht-terminale, nicht soft-gelöschte) Deals laden.
//  4. Pro Deal: days_in_stage = floor(now - stage_updated_at). stagniert = days >= threshold(stage).
//  5. Update NUR bei Änderung (stagnation_days neu ODER erstmals „stagniert") — kein unnötiger Write.
//     audit_log entsteht automatisch über den DB-Trigger trg_deals_audit (audit_write) bei jedem Update.
//  6. Return { updated, stagnated, org_id }.
//
// Schwellenwert nur aus settings; Terminal-Slugs sind eine stabile Konstante (Deno kann die
// TS-Lib nicht importieren). heat_status='stagniert' ist Freitext (kein DB-Constraint), per CLAUDE.md-Spec.
//
// deploy: supabase functions deploy score-deal-health
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TERMINAL_STAGES = new Set(["gewonnen", "verloren"]);
const DAY_MS = 86_400_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  try {
    const { organizationId, dealId } = await req.json().catch(() => ({}));
    if (!organizationId) return json({ error: "organizationId required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 2. Schwellenwerte aus settings (eine Zeile pro Org).
    const { data: settings, error: sErr } = await supabase
      .from("settings")
      .select("pipeline_stages")
      .eq("organization_id", organizationId)
      .single();
    if (sErr) throw sErr;
    const threshold: Record<string, number | null> = {};
    for (const s of (settings?.pipeline_stages ?? []) as Array<{ slug: string; stagnation_days: number | null }>) {
      threshold[s.slug] = s.stagnation_days;
    }

    // 3. Aktive Deals (nicht-terminal, nicht soft-gelöscht).
    let q = supabase
      .from("deals")
      .select("id, stage, stage_updated_at, stagnation_days, heat_status")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .not("stage", "in", "(gewonnen,verloren)");
    if (dealId) q = q.eq("id", dealId);
    const { data: deals, error: dErr } = await q;
    if (dErr) throw dErr;

    const now = Date.now();
    let updated = 0;
    let stagnated = 0;

    for (const d of (deals ?? []) as Array<{ id: string; stage: string; stage_updated_at: string | null; stagnation_days: number | null; heat_status: string | null }>) {
      if (TERMINAL_STAGES.has(d.stage)) continue; // Sicherheitsnetz zusätzlich zum SQL-Filter
      const base = d.stage_updated_at ? new Date(d.stage_updated_at).getTime() : now;
      const days = Math.max(0, Math.floor((now - base) / DAY_MS));
      const thr = threshold[d.stage];
      const isStagnated = typeof thr === "number" && days >= thr;

      const patch: Record<string, unknown> = {};
      if (days !== (d.stagnation_days ?? 0)) patch.stagnation_days = days;
      if (isStagnated && d.heat_status !== "stagniert") patch.heat_status = "stagniert";
      if (Object.keys(patch).length === 0) continue; // kein unnötiger Write

      const { error: uErr } = await supabase
        .from("deals")
        .update(patch)
        .eq("organization_id", organizationId)
        .eq("id", d.id);
      if (uErr) throw uErr;
      updated++;
      if (isStagnated) stagnated++;
    }

    return json({ updated, stagnated, org_id: organizationId });
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
