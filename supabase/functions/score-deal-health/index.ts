// score-deal-health — berechnet ausschließlich deals.stagnation_days.
//
// Ablauf:
//  1. organizationId (Pflicht) + optional dealId aus dem Body (Cron: nur org; Trigger: + dealId).
//  2. Aktive (nicht-terminale, nicht soft-gelöschte) Deals laden.
//  3. Pro Deal: days_in_stage = floor(now - stage_updated_at).
//  4. Update NUR bei Änderung von stagnation_days — kein unnötiger Write.
//     audit_log entsteht automatisch über den DB-Trigger trg_deals_audit (audit_write) bei jedem Update.
//  5. Return { updated, org_id }.
//
// Trennung der Konzepte: stagnation_days gehört zu deals (wie lange steckt der Deal in der Stage?).
// heat_status gehört zu contacts und basiert auf contacts.last_contacted_at — das ist Aufgabe von
// score_heat_status(), NICHT dieser Function. Hier wird KEIN heat_status geschrieben (weder deals
// noch contacts). Die Function liefert nur die rohe Tageszahl; die UI entscheidet anhand von
// stagnation_days vs. der Schwelle aus settings.pipeline_stages[].stagnation_days, ob ein Deal als
// „stagniert" gilt. Terminal-Slugs sind eine stabile Konstante (Deno kann die TS-Lib nicht importieren).
//
// deploy: supabase functions deploy score-deal-health
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Won/Lost-System-Anker: eine geteilte Quelle (spiegelt Frontend hunterMappers), kein dupliziertes Literal.
import { TERMINAL_STAGE_SLUGS, isTerminalStageSlug } from "../_shared/terminalStages.ts";

const DAY_MS = 86_400_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  let runId: string | null = null; // B-1: Cron-Lauf-Protokoll (nur Voll-Läufe, kein einzelner dealId)
  try {
    const { organizationId, dealId } = await req.json().catch(() => ({}));
    if (!organizationId) return json({ error: "organizationId required" }, 400);
    if (!dealId) {
      const { data } = await supabase.rpc("cron_run_start", { p_job: "score-deal-health-daily" });
      runId = data as string | null;
    }

    // 2. Aktive Deals (nicht-terminal, nicht soft-gelöscht).
    let q = supabase
      .from("deals")
      .select("id, stage, stage_updated_at, stagnation_days")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .not("stage", "in", `(${TERMINAL_STAGE_SLUGS.join(",")})`);
    if (dealId) q = q.eq("id", dealId);
    const { data: deals, error: dErr } = await q;
    if (dErr) throw dErr;

    const now = Date.now();
    let updated = 0;

    for (const d of (deals ?? []) as Array<{ id: string; stage: string; stage_updated_at: string | null; stagnation_days: number | null }>) {
      if (isTerminalStageSlug(d.stage)) continue; // Sicherheitsnetz zusätzlich zum SQL-Filter
      const base = d.stage_updated_at ? new Date(d.stage_updated_at).getTime() : now;
      const days = Math.max(0, Math.floor((now - base) / DAY_MS));

      // Nur stagnation_days schreiben — kein heat_status (gehört zu contacts / score_heat_status).
      if (days === (d.stagnation_days ?? 0)) continue; // kein unnötiger Write

      const { error: uErr } = await supabase
        .from("deals")
        .update({ stagnation_days: days })
        .eq("organization_id", organizationId)
        .eq("id", d.id);
      if (uErr) throw uErr;
      updated++;
    }

    if (runId) await supabase.rpc("cron_run_finish", { p_run_id: runId, p_status: "success", p_items: updated });
    return json({ updated, org_id: organizationId });
  } catch (e) {
    if (runId) await supabase.rpc("cron_run_finish", { p_run_id: runId, p_status: "failed", p_error: String(e) });
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
