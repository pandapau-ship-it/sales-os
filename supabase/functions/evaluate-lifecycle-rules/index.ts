// evaluate-lifecycle-rules — Lifecycle-Trigger-Auswerter (L-2a).
//
// Verkettung (C): wird am ENDE der letzten Score-Function (score-upsell) per net.http_post angestoßen
// → läuft IMMER direkt nach frischen churn/heat/upsell/stagnation-Werten, unabhängig von der Uhrzeit.
// Sicherheitsnetz (B): prüft zu Beginn in cron_runs, ob die heutigen Score-Läufe wirklich durch sind;
// sonst Alarm (system_alerts) + Skip (kein Rechnen auf veralteten Daten). cron_expectations (089) +
// Watchdog (069) alarmieren, falls die Kette reißt.
//
// Ablauf je Org: aktive Regeln → je Regel Match-Menge (compileToPostgrest je Gruppe + FK-Mapping →
// combineAnchorSets, Option B) → computePlan (Rangfolge/terminal + Einmal-Feuer + Batch) → rearm +
// fire (notify). Batch-Limit vertagt Überschuss (matched-Flag = Cursor), Alarm bei Rückstau/Zeitbudget.
// Fehler je Handler strukturiert in lifecycle_rule_runs.action_result ([D54]), Auswertung läuft weiter.
//
// deploy: supabase functions deploy evaluate-lifecycle-rules
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compileToPostgrest } from "../_shared/filter/compile.ts";
import type { FilterNode } from "../_shared/filter/types.ts";
import { combineAnchorSets, computePlan, type AnchorEntity, type RuleInput } from "../_shared/lifecycle/eval.ts";

// Infra-Konstanten (Betriebs-Sicherheitsnetze, kein User-Verhalten → [D51] n.a.).
const PREREQUISITE_JOBS = [
  "score-deal-health-daily", "score-heat-status-daily", "score-churn-risk-daily", "score-upsell-daily",
];
const MAX_FIRED_PER_RUN = 500; // Batch-Sicherheitsnetz je Lauf (Rest wird vertagt, nicht verworfen)
const TIME_BUDGET_MS = 25_000; // user-triggered Edge-Timeout-Puffer

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const errMsg = (e: unknown) => (e instanceof Error ? e.message : (e && typeof e === "object" ? JSON.stringify(e) : String(e)));

interface Group { entity: AnchorEntity; where: FilterNode }
interface RuleRow extends RuleInput { name: string; created_by: string | null; conditions: { logic: "AND" | "OR"; groups: Group[] } }

async function raiseAlert(sb: SupabaseClient, severity: string, type: string, message: string, context: unknown) {
  await sb.from("system_alerts").insert({ severity, type, message, context });
}

/** Sicherheitsnetz B: liefen die heutigen Score-Crons erfolgreich? */
async function prerequisitesReady(sb: SupabaseClient): Promise<{ ok: boolean; missing: string[] }> {
  const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
  const missing: string[] = [];
  for (const job of PREREQUISITE_JOBS) {
    const { count } = await sb.from("cron_runs").select("id", { count: "exact", head: true })
      .eq("job_name", job).eq("status", "success").gte("finished_at", todayStart.toISOString());
    if (!count) missing.push(job);
  }
  return { ok: missing.length === 0, missing };
}

async function activeOrgs(sb: SupabaseClient): Promise<string[]> {
  const { data } = await sb.from("lifecycle_rules").select("organization_id").eq("is_active", true);
  return [...new Set((data ?? []).map((r) => r.organization_id as string))];
}

/** Anker-ID-Menge EINER Gruppe: compileToPostgrest (Single Source) + FK-Mapping auf den anchor. */
async function groupAnchorIds(sb: SupabaseClient, org: string, anchor: AnchorEntity, group: Group): Promise<string[]> {
  const expr = compileToPostgrest({ entity: group.entity, where: group.where }); // dieselbe Lib wie dyn. Listen
  const rows = async (table: string, col: string) => {
    const { data, error } = await sb.from(table).select(col).eq("organization_id", org).or(expr);
    if (error) throw error;
    return (data ?? []).map((r) => (r as Record<string, string | null>)[col]).filter((v): v is string => !!v);
  };
  const uniq = (a: string[]) => [...new Set(a)];
  const via = async (table: string, col: string, ids: string[]) => {
    if (ids.length === 0) return [];
    const { data, error } = await sb.from(table).select("id").eq("organization_id", org).in(col, ids);
    if (error) throw error;
    return (data ?? []).map((r) => (r as { id: string }).id);
  };

  if (group.entity === anchor) return uniq(await rows(anchor, "id"));
  if (anchor === "contacts") {
    if (group.entity === "deals") return uniq(await rows("deals", "contact_id"));
    return await via("contacts", "primary_company_id", uniq(await rows("companies", "id"))); // companies → contacts
  }
  if (anchor === "deals") {
    if (group.entity === "contacts") return await via("deals", "contact_id", uniq(await rows("contacts", "id")));
    return await via("deals", "company_id", uniq(await rows("companies", "id")));
  }
  // anchor === "companies"
  if (group.entity === "contacts") return uniq(await rows("contacts", "primary_company_id"));
  return uniq(await rows("deals", "company_id"));
}

async function resolveOwner(sb: SupabaseClient, org: string, anchor: AnchorEntity, entityId: string): Promise<string | null> {
  if (anchor === "contacts") {
    const { data } = await sb.from("contacts").select("assigned_to").eq("organization_id", org).eq("id", entityId).maybeSingle();
    return (data?.assigned_to as string | null) ?? null;
  }
  if (anchor === "deals") {
    const { data } = await sb.from("deals").select("owner_id").eq("organization_id", org).eq("id", entityId).maybeSingle();
    return (data?.owner_id as string | null) ?? null;
  }
  return null; // companies: kein Owner → Fallback Regel-Ersteller
}

/** Aktions-Handler (L-2a: nur notify/notify_urgent). Strukturiertes Ergebnis für action_result ([D54]). */
async function runAction(sb: SupabaseClient, org: string, rule: RuleRow, entityId: string): Promise<Record<string, unknown>> {
  const at = new Date().toISOString();
  const type = rule.action.type;
  const message = (rule.action.params?.message as string) ?? rule.name;
  const severity = type === "notify_urgent" ? "high" : "normal";
  const recipient = (await resolveOwner(sb, org, rule.anchor_entity, entityId)) ?? rule.created_by;
  if (!recipient) return { ok: false, handler: type, error_code: "no_recipient", message: "Kein Empfänger auflösbar", at };
  const link = rule.anchor_entity === "contacts" ? `/app/kontakte/${entityId}` : null;
  try {
    const { error } = await sb.rpc("notify", {
      p_org: org, p_category: "rule", p_severity: severity, p_title: rule.name, p_body: message,
      p_link: link, p_source_type: "lifecycle_rule", p_source_id: `${rule.id}:${entityId}:${at}`,
      p_user_ids: [recipient],
    });
    if (error) throw error;
    return { ok: true, handler: type, recipient, at };
  } catch (e) {
    return { ok: false, handler: type, error_code: "notify_failed", message: errMsg(e), at };
  }
}

async function evaluateOrg(sb: SupabaseClient, org: string) {
  const { data: rulesRaw, error } = await sb.from("lifecycle_rules")
    .select("id, anchor_entity, conditions, action, priority, is_terminal, created_at, created_by, name")
    .eq("organization_id", org).eq("is_active", true);
  if (error) throw error;
  const rules = (rulesRaw ?? []).map((r) => ({ ...r, organization_id: org })) as RuleRow[];
  if (rules.length === 0) return { fired: 0, rearmed: 0, suppressed: 0, carried: 0 };

  const matchByRule: Record<string, string[]> = {};
  const prevMatchedByRule: Record<string, string[]> = {};
  for (const rule of rules) {
    const sets: string[][] = [];
    for (const g of rule.conditions.groups) sets.push(await groupAnchorIds(sb, org, rule.anchor_entity, g));
    matchByRule[rule.id] = combineAnchorSets(rule.conditions.logic, sets);
    const { data: prev } = await sb.from("lifecycle_rule_runs").select("entity_id").eq("rule_id", rule.id).eq("matched", true);
    prevMatchedByRule[rule.id] = (prev ?? []).map((r) => r.entity_id as string);
  }

  const plan = computePlan({ rules, matchByRule, prevMatchedByRule, maxFired: MAX_FIRED_PER_RUN });
  const byId = new Map(rules.map((r) => [r.id, r] as const));

  // rearm (billig, kein Aktions-IO): matched=false, gebündelt je Regel.
  const rearmByRule = new Map<string, string[]>();
  for (const r of plan.rearms) (rearmByRule.get(r.ruleId) ?? rearmByRule.set(r.ruleId, []).get(r.ruleId)!).push(r.entityId);
  for (const [ruleId, ents] of rearmByRule) await sb.rpc("lifecycle_mark_rearmed", { p_rule: ruleId, p_entities: ents, p_org: org });

  // fire: Aktion ausführen → matched=true (atomar, fired_count++). Fehler stoppt die Auswertung NICHT.
  for (const f of plan.fires) {
    const rule = byId.get(f.ruleId)!;
    const result = await runAction(sb, org, rule, f.entityId);
    await sb.rpc("lifecycle_mark_fired", { p_rule: f.ruleId, p_entity: f.entityId, p_org: org, p_result: result });
  }
  return { fired: plan.fires.length, rearmed: plan.rearms.length, suppressed: plan.suppressed, carried: plan.carried };
}

Deno.serve(async (req) => {
  const started = Date.now();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let runId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const force = body.force === true;              // Test/Manuell: Guard überspringen
    const onlyOrg: string | null = body.organizationId ?? null;

    if (!force) {
      const ready = await prerequisitesReady(sb);
      if (!ready.ok) {
        await raiseAlert(sb, "warning", "lifecycle_prereq_not_ready",
          `Lifecycle-Auswerter übersprungen: heutige Score-Läufe unvollständig (${ready.missing.join(", ")}).`,
          { missing: ready.missing });
        return json({ skipped: true, reason: "prerequisites_not_ready", missing: ready.missing });
      }
    }

    const { data: rid } = await sb.rpc("cron_run_start", { p_job: "evaluate-lifecycle-rules" });
    runId = rid as string | null;

    const orgs = onlyOrg ? [onlyOrg] : await activeOrgs(sb);
    let fired = 0, rearmed = 0, suppressed = 0, carried = 0, budgetHit = false;
    for (const org of orgs) {
      if (Date.now() - started > TIME_BUDGET_MS) { budgetHit = true; break; }
      const r = await evaluateOrg(sb, org);
      fired += r.fired; rearmed += r.rearmed; suppressed += r.suppressed; carried += r.carried;
    }
    if (carried > 0) await raiseAlert(sb, "info", "lifecycle_backlog",
      `Lifecycle-Batch-Limit erreicht: ${carried} Feuer vertagt (nächster Lauf holt nach).`, { carried });
    if (budgetHit) await raiseAlert(sb, "warning", "lifecycle_time_budget",
      "Lifecycle-Auswerter hat sein Zeitbudget erreicht — nicht alle Orgs verarbeitet.", { orgs: orgs.length });

    await sb.rpc("cron_run_finish", { p_run_id: runId, p_status: "success", p_items: fired });
    return json({ orgs: orgs.length, fired, rearmed, suppressed, carried, budgetHit });
  } catch (e) {
    if (runId) await sb.rpc("cron_run_finish", { p_run_id: runId, p_status: "failed", p_error: errMsg(e) });
    return json({ error: errMsg(e) }, 500);
  }
});
