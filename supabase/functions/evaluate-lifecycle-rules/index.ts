// evaluate-lifecycle-rules — Lifecycle-Trigger-Auswerter (L-2a/L-2b/L-2c).
//
// L-2c: (1) BÜNDELUNG — notify/notify_urgent erzeugen EINE Meldung je Regel/Lauf mit der Zahl der NEUEN
// Treffer (nicht eine je Datensatz); per-record-Aktionen (create_task/add_tag/add_to_list) bleiben je Datensatz.
// (2) DRY-RUN — read-only Auswertung ohne Feuern/Zustandsänderung (Live-Trefferzahl + „jetzt prüfen"),
// eigener Auth-Pfad; echter Lauf nur mit Service-Rolle. ([D57]/[D54])
//
// ⚠ KEY-ROTATION: Der Service-Role-Guard (isServiceRole) hängt am EXAKTEN Wert von SUPABASE_SERVICE_ROLE_KEY.
// Der einzige echte Aufrufer (Verkettung score-upsell → hier) sendet `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` aus
// DERSELBEN Env-Variable. Wird der Service-Key rotiert, ziehen beide Seiten automatisch denselben neuen Env-Wert
// → weiter konsistent. Der Guard prüft KEIN JWT-Claim (der Projekt-Key ist der neue opake `sb_secret_…`-Key, kein
// JWT) — er vergleicht das Secret direkt. Wer die Funktion von SQL/Vault aus aufruft, MUSS denselben Env-Wert als
// Bearer nutzen (Vault-Secret `app_service_role_key` = derselbe Service-Key). Weichen Vault und Env voneinander ab,
// bricht ein Vault-basierter Aufruf mit 403 ab (Produktion via Env==Env bleibt unberührt).
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
import { actionApplies, bundleSourceId, combineAnchorSets, computePlan, type AnchorEntity, type RuleInput } from "../_shared/lifecycle/eval.ts";
import { groupAnchorIds, resolveOwner, type Group } from "../_shared/lifecycle/anchors.ts";

// Infra-Konstanten (Betriebs-Sicherheitsnetze, kein User-Verhalten → [D51] n.a.).
const PREREQUISITE_JOBS = [
  "score-deal-health-daily", "score-heat-status-daily", "score-churn-risk-daily", "score-upsell-daily",
];
const MAX_FIRED_PER_RUN = 500; // Batch-Sicherheitsnetz je Lauf (Rest wird vertagt, nicht verworfen)
const TIME_BUDGET_MS = 25_000; // user-triggered Edge-Timeout-Puffer

// CORS (FUND 1): der Browser ruft den Dry-Run per functions.invoke direkt auf (Cross-Origin). Ohne diese
// Header wird die Antwort/der Preflight geblockt → im Builder „Trefferzahl konnte nicht geladen werden".
// Der Cron-Pfad (net.http_post, server-zu-server) brauchte das nie — daher fiel es erst im Browser auf.
// WICHTIG: Diese Function MUSS mit `--no-verify-jwt` deployt werden (sie macht ihre Auth selbst:
// isServiceRole für den echten Lauf · getUser+automation.manage für den User-Dry-Run). Sonst weist die
// Plattform den Preflight-OPTIONS (ohne Auth-Header) ab, bevor der OPTIONS-Handler unten greift.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const errMsg = (e: unknown) => (e instanceof Error ? e.message : (e && typeof e === "object" ? JSON.stringify(e) : String(e)));

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

/** action_types-Registry (key → applies_to), einmal je Lauf geladen — Auswerter-defensiver applies_to-Check (D2). */
async function loadAppliesTo(sb: SupabaseClient): Promise<Map<string, string[]>> {
  const { data } = await sb.from("action_types").select("key, applies_to");
  return new Map((data ?? []).map((r) => [r.key as string, (r.applies_to as string[] | null) ?? []]));
}

// Feuer-INSTANZ-ID (rule:entity:fired_count+1): legitime Re-Fires bleiben distinkt (fired_count wächst),
// ein Crash-Retry DERSELBEN Instanz (mark_fired schlug fehl → fired_count unverändert) erzeugt dieselbe ID
// → die Dedup der Ziel-Tabelle greift (2. Idempotenz-Ebene, strikt auch bei Fehl-Lauf): notify on-conflict,
// tasks.source_ref Unique. Genau daher tragen create_task/notify dieselbe fireInstance.
const fireInstanceId = (ruleId: string, entityId: string, firedCount: number) => `${ruleId}:${entityId}:${firedCount + 1}`;

/** notify / notify_urgent — Benachrichtigung an Owner (Fallback: Regel-Ersteller). */
async function notifyHandler(sb: SupabaseClient, org: string, rule: RuleRow, entityId: string, firedCount: number, at: string): Promise<Record<string, unknown>> {
  const type = rule.action.type;
  const message = (rule.action.params?.message as string) ?? rule.name;
  const severity = type === "notify_urgent" ? "high" : "normal";
  const recipient = (await resolveOwner(sb, org, rule.anchor_entity, entityId)) ?? rule.created_by;
  if (!recipient) return { ok: false, handler: type, error_code: "no_recipient", message: "Kein Empfänger auflösbar", at };
  // [D56]/D5: Deeplink-Routing existiert noch nicht (keine /kontakte/:id- bzw. Deal-Route) → bewusst null,
  // NIE ein toter Link. Echte Sprungziele (+ Bündeln/Highlight) baut L-3 ([D57]).
  const link = null;
  try {
    const { error } = await sb.rpc("notify", {
      p_org: org, p_category: "rule", p_severity: severity, p_title: rule.name, p_body: message,
      p_link: link, p_source_type: "lifecycle_rule", p_source_id: fireInstanceId(rule.id, entityId, firedCount),
      p_user_ids: [recipient],
    });
    if (error) throw error;
    return { ok: true, handler: type, recipient, at };
  } catch (e) {
    return { ok: false, handler: type, error_code: "notify_failed", message: errMsg(e), at };
  }
}

/** create_task — idempotent über tasks.source_ref (= Feuer-Instanz, D1). Anker löst contact_id/deal_id/assigned_to auf. */
async function createTaskHandler(sb: SupabaseClient, org: string, rule: RuleRow, entityId: string, firedCount: number, at: string): Promise<Record<string, unknown>> {
  const p = rule.action.params ?? {};
  const title = (p.title as string) ?? rule.name;
  const priority = (p.priority as string) ?? "medium";
  const dueDays = p.due_in_days != null ? Number(p.due_in_days) : null;
  const due_at = dueDays != null && Number.isFinite(dueDays) ? new Date(Date.now() + dueDays * 86_400_000).toISOString() : null;
  const sourceRef = fireInstanceId(rule.id, entityId, firedCount);

  let contact_id: string | null = null, deal_id: string | null = null, assigned_to: string | null = null;
  if (rule.anchor_entity === "contacts") {
    contact_id = entityId;
    assigned_to = await resolveOwner(sb, org, "contacts", entityId);
  } else if (rule.anchor_entity === "deals") {
    deal_id = entityId;
    const { data } = await sb.from("deals").select("contact_id, owner_id").eq("organization_id", org).is("deleted_at", null).eq("id", entityId).maybeSingle();
    contact_id = (data?.contact_id as string | null) ?? null;
    assigned_to = (data?.owner_id as string | null) ?? null;
  }
  assigned_to = assigned_to ?? rule.created_by; // Owner-Fallback: Regel-Ersteller
  try {
    const { error } = await sb.rpc("lifecycle_create_task", {
      p_org: org, p_source_ref: sourceRef, p_contact_id: contact_id, p_deal_id: deal_id,
      p_assigned_to: assigned_to, p_title: title, p_due_at: due_at, p_priority: priority,
    });
    if (error) throw error;
    return { ok: true, handler: "create_task", source_ref: sourceRef, contact_id, deal_id, assigned_to, at };
  } catch (e) {
    return { ok: false, handler: "create_task", error_code: "create_task_failed", message: errMsg(e), at };
  }
}

/** add_tag — Tag an contacts/companies anhängen (idempotent, append-only). */
async function addTagHandler(sb: SupabaseClient, org: string, rule: RuleRow, entityId: string, at: string): Promise<Record<string, unknown>> {
  const tag = rule.action.params?.tag as string | undefined;
  if (!tag) return { ok: false, handler: "add_tag", error_code: "missing_tag", message: "params.tag fehlt", at };
  try {
    const { error } = await sb.rpc("lifecycle_add_tag", { p_org: org, p_entity: entityId, p_entity_type: rule.anchor_entity, p_tag: tag });
    if (error) throw error;
    return { ok: true, handler: "add_tag", tag, at };
  } catch (e) {
    return { ok: false, handler: "add_tag", error_code: "add_tag_failed", message: errMsg(e), at };
  }
}

/** add_to_list — Kontakt in STATISCHE Liste (idempotent). Dynamische Liste → strukturierter Fehler (RPC raise). */
async function addToListHandler(sb: SupabaseClient, org: string, rule: RuleRow, entityId: string, at: string): Promise<Record<string, unknown>> {
  const listId = rule.action.params?.list_id as string | undefined;
  if (!listId) return { ok: false, handler: "add_to_list", error_code: "missing_list_id", message: "params.list_id fehlt", at };
  try {
    const { error } = await sb.rpc("lifecycle_add_to_list", { p_org: org, p_list_id: listId, p_contact: entityId });
    if (error) throw error;
    return { ok: true, handler: "add_to_list", list_id: listId, at };
  } catch (e) {
    return { ok: false, handler: "add_to_list", error_code: "add_to_list_failed", message: errMsg(e), at };
  }
}

/**
 * Aktions-Dispatch (L-2b): endet die frühere „immer notify"-Lücke — je action.type der passende Handler.
 * Auswerter-defensiver applies_to-Check (D2, 2. Ebene neben der Write-RPC): Anker ∉ applies_to → skip mit
 * strukturiertem Fehler, statt fälschlich zu feuern. Jeder Handler liefert action_result ([D54]); ein
 * Handler-Fehler bricht die Auswertung NICHT ab (Aufrufer schreibt das Ergebnis, macht weiter).
 */
async function runAction(sb: SupabaseClient, org: string, rule: RuleRow, entityId: string, firedCount: number, appliesTo: Map<string, string[]>): Promise<Record<string, unknown>> {
  const at = new Date().toISOString();
  const type = rule.action.type;
  if (!actionApplies(rule.anchor_entity, appliesTo.get(type))) {
    return { ok: false, handler: type, error_code: "anchor_not_applicable", message: `Aktion ${type} ist fuer Anker ${rule.anchor_entity} nicht anwendbar`, at };
  }
  switch (type) {
    case "notify":
    case "notify_urgent":
      return notifyHandler(sb, org, rule, entityId, firedCount, at);
    case "create_task":
      return createTaskHandler(sb, org, rule, entityId, firedCount, at);
    case "add_tag":
      return addTagHandler(sb, org, rule, entityId, at);
    case "add_to_list":
      return addToListHandler(sb, org, rule, entityId, at);
    default:
      return { ok: false, handler: type, error_code: "unknown_action", message: `Unbekannte Aktion ${type}`, at };
  }
}

const isNotifyType = (t: string) => t === "notify" || t === "notify_urgent";

/**
 * Gebündelte Benachrichtigung (L-2c, [D57]): EINE Meldung je Regel/Lauf mit der Zahl der NEUEN Treffer —
 * NICHT eine je Datensatz. Die per-Datensatz-Buchführung (mark_fired) bleibt beim Aufrufer. Empfänger =
 * Regel-Ersteller (die Regel ist „seine"; per-Datensatz-Owner-Routing entfällt mit der Bündelung bewusst).
 * source_id inhaltsbasiert (bundleSourceId): Crash-Retry desselben Laufs → Dedup; Re-Fire nach Rearm → neue Meldung.
 */
async function runBundledNotify(
  sb: SupabaseClient, org: string, rule: RuleRow, fires: Array<{ entityId: string; nextCount: number }>,
  appliesTo: Map<string, string[]>,
): Promise<Record<string, unknown>> {
  const at = new Date().toISOString();
  const type = rule.action.type;
  const count = fires.length;
  if (!actionApplies(rule.anchor_entity, appliesTo.get(type))) {
    return { ok: false, handler: type, bundled: true, count, error_code: "anchor_not_applicable",
      message: `Aktion ${type} ist fuer Anker ${rule.anchor_entity} nicht anwendbar`, at };
  }
  const recipient = rule.created_by;
  if (!recipient) return { ok: false, handler: type, bundled: true, count, error_code: "no_recipient", message: "Regel ohne Ersteller", at };
  const base = (rule.action.params?.message as string) ?? rule.name;
  const body = count === 1 ? `1 Datensatz erfuellt die Regel: ${base}` : `${count} Datensaetze erfuellen die Regel: ${base}`;
  const severity = type === "notify_urgent" ? "high" : "normal";
  const sourceId = bundleSourceId(rule.id, fires);
  try {
    const { error } = await sb.rpc("notify", {
      p_org: org, p_category: "rule", p_severity: severity, p_title: rule.name, p_body: body,
      p_link: null, p_source_type: "lifecycle_rule", p_source_id: sourceId, p_user_ids: [recipient],
    });
    if (error) throw error;
    return { ok: true, handler: type, bundled: true, count, notification_source_id: sourceId, recipient, at };
  } catch (e) {
    return { ok: false, handler: type, bundled: true, count, error_code: "notify_failed", message: errMsg(e), at };
  }
}

async function evaluateOrg(sb: SupabaseClient, org: string, appliesTo: Map<string, string[]>) {
  const { data: rulesRaw, error } = await sb.from("lifecycle_rules")
    .select("id, anchor_entity, conditions, action, priority, is_terminal, created_at, created_by, name")
    .eq("organization_id", org).eq("is_active", true);
  if (error) throw error;
  const rules = (rulesRaw ?? []).map((r) => ({ ...r, organization_id: org })) as RuleRow[];
  if (rules.length === 0) return { fired: 0, rearmed: 0, suppressed: 0, carried: 0 };

  const matchByRule: Record<string, string[]> = {};
  const prevMatchedByRule: Record<string, string[]> = {};
  const firedCount = new Map<string, number>(); // `${ruleId}:${entityId}` → bisherige Feuer (für source_id-Instanz)
  for (const rule of rules) {
    const sets: string[][] = [];
    for (const g of rule.conditions.groups) sets.push(await groupAnchorIds(sb, org, rule.anchor_entity, g));
    matchByRule[rule.id] = combineAnchorSets(rule.conditions.logic, sets);
    // ALLE Run-Zeilen der Regel: matched=true → prevMatched (Einmal-Feuer); fired_count → source_id-Instanz.
    const { data: runs } = await sb.from("lifecycle_rule_runs").select("entity_id, matched, fired_count").eq("rule_id", rule.id);
    prevMatchedByRule[rule.id] = (runs ?? []).filter((r) => r.matched).map((r) => r.entity_id as string);
    for (const r of runs ?? []) firedCount.set(`${rule.id}:${r.entity_id}`, (r.fired_count as number) ?? 0);
  }

  const plan = computePlan({ rules, matchByRule, prevMatchedByRule, maxFired: MAX_FIRED_PER_RUN });
  const byId = new Map(rules.map((r) => [r.id, r] as const));

  // rearm (billig, kein Aktions-IO): matched=false, gebündelt je Regel.
  const rearmByRule = new Map<string, string[]>();
  for (const r of plan.rearms) (rearmByRule.get(r.ruleId) ?? rearmByRule.set(r.ruleId, []).get(r.ruleId)!).push(r.entityId);
  for (const [ruleId, ents] of rearmByRule) await sb.rpc("lifecycle_mark_rearmed", { p_rule: ruleId, p_entities: ents, p_org: org });

  // fire: gruppiert je Regel. notify/notify_urgent → EINE gebündelte Meldung je Regel/Lauf ([D57] Bündelung);
  // create_task/add_tag/add_to_list → PER Datensatz (jede Aktion wirkt auf genau einen Datensatz).
  // Buchführung (matched=true, fired_count++) bleibt IMMER per Datensatz (Einmal-Feuer + Ziel-Liste).
  const firesByRule = new Map<string, string[]>();
  for (const f of plan.fires) (firesByRule.get(f.ruleId) ?? firesByRule.set(f.ruleId, []).get(f.ruleId)!).push(f.entityId);
  for (const [ruleId, entityIds] of firesByRule) {
    const rule = byId.get(ruleId)!;
    if (isNotifyType(rule.action.type)) {
      const fires = entityIds.map((eid) => ({ entityId: eid, nextCount: (firedCount.get(`${ruleId}:${eid}`) ?? 0) + 1 }));
      const result = await runBundledNotify(sb, org, rule, fires, appliesTo);
      for (const eid of entityIds) {
        await sb.rpc("lifecycle_mark_fired", { p_rule: ruleId, p_entity: eid, p_org: org, p_result: result });
      }
    } else {
      for (const eid of entityIds) {
        const fc = firedCount.get(`${ruleId}:${eid}`) ?? 0;
        const result = await runAction(sb, org, rule, eid, fc, appliesTo);
        await sb.rpc("lifecycle_mark_fired", { p_rule: ruleId, p_entity: eid, p_org: org, p_result: result });
      }
    }
  }
  return { fired: plan.fires.length, rearmed: plan.rearms.length, suppressed: plan.suppressed, carried: plan.carried };
}

/**
 * Ist der Aufrufer die Service-Rolle? AUSSCHLIESSLICH exakter Vergleich gegen den Env-Service-Key
 * (dieses Projekt nutzt den opaken `sb_secret_…`-Key — KEIN JWT; die Verkettung score-upsell sendet
 * genau `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` aus derselben Env → match). Ein User-/Anon-Token besitzt das
 * Secret NICHT → 403.
 *
 * SICHERHEIT (kein JWT-Rollen-Fallback!): Ein früherer `decodeJwtRole`-Fallback las die JWT-`role` OHNE
 * Signaturprüfung. Solange die Plattform `verify_jwt` erzwang, war das gedeckt — aber diese Function wird
 * mit `--no-verify-jwt` deployt (nötig für den CORS-Preflight, FUND 1). Dann könnte ein gefälschter JWT
 * `{"role":"service_role"}` (beliebige Signatur) den Service-Pfad übernehmen. Deshalb NUR der Secret-Vergleich:
 * unfälschbar, weil er den echten Key-Wert verlangt (den nur Backend/Vault kennen).
 */
const isServiceRole = (authHeader: string | null): boolean => {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return !!key && authHeader === `Bearer ${key}`;
};

/**
 * Dry-Run (L-2c): wertet eine (auch ungespeicherte) Regel-Definition aus, OHNE zu feuern und OHNE Zustand
 * zu ändern → liefert Trefferzahl + Treffer-IDs (Live-Trefferzahl im Builder · „jetzt einmal prüfen").
 * Zwei Auth-Pfade: Service-Rolle (Chat/Backend/Test) → org aus dem Body (vertrauenswürdig) · sonst
 * Nutzer-Token → org aus dem eingeloggten User (RLS-gescoped) + Recht `automation.manage`. Cross-Entity
 * (Option B) über dieselbe Mengen-Algebra wie der echte Lauf (groupAnchorIds + combineAnchorSets) — Single Source.
 */
async function handleDryRun(req: Request, body: Record<string, unknown>): Promise<Response> {
  const authHeader = req.headers.get("Authorization");
  const rule = (body.rule ?? {}) as { anchor_entity?: AnchorEntity; conditions?: { logic: "AND" | "OR"; groups: Group[] } };
  const anchor = rule.anchor_entity;
  const conditions = rule.conditions;
  if (anchor !== "contacts" && anchor !== "companies" && anchor !== "deals") return json({ error: "invalid_anchor" }, 400);
  if (!conditions || !Array.isArray(conditions.groups)) return json({ error: "invalid_conditions" }, 400);

  let sb: SupabaseClient;
  let org: string | null;
  if (isServiceRole(authHeader)) {
    sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    org = (body.organizationId as string | null) ?? null;
    if (!org) return json({ error: "organizationId_required_for_service_dryrun" }, 400);
  } else {
    sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "unauthenticated" }, 401);
    const { data: perm } = await sb.rpc("has_permission", { p_user: u.user.id, p_permission: "automation.manage" });
    if (perm !== true) return json({ error: "permission_denied" }, 403);
    const { data: urow } = await sb.from("users").select("organization_id").eq("id", u.user.id).maybeSingle();
    org = (urow?.organization_id as string | null) ?? null;
    if (!org) return json({ error: "unknown_org" }, 403);
  }

  if (!org) return json({ error: "unknown_org" }, 403); // Narrowing + Sicherheitsnetz
  try {
    const sets: string[][] = [];
    for (const g of conditions.groups) sets.push(await groupAnchorIds(sb, org, anchor, g));
    const ids = combineAnchorSets(conditions.logic, sets);
    return json({ dryRun: true, matchCount: ids.length, matchIds: ids.slice(0, 500) });
  } catch (e) {
    return json({ dryRun: true, error: errMsg(e) }, 400);
  }
}

Deno.serve(async (req) => {
  const started = Date.now();
  // CORS-Preflight (FUND 1): vor jeder Auth/Body-Verarbeitung beantworten.
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  // Dry-Run: eigener, read-only Auth-Pfad — VOR jeder Zustandsänderung.
  if (body.dryRun === true) return await handleDryRun(req, body);
  // Echter Lauf nur mit Service-Rolle (Cron/Verkettung/Chat-Backend) — kein user-getriggertes echtes Feuern.
  if (!isServiceRole(req.headers.get("Authorization"))) return json({ error: "forbidden: service role required" }, 403);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let runId: string | null = null;
  try {
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

    const appliesTo = await loadAppliesTo(sb); // Registry einmal je Lauf (global) → Auswerter-defensiver Check
    const orgs = onlyOrg ? [onlyOrg] : await activeOrgs(sb);
    let fired = 0, rearmed = 0, suppressed = 0, carried = 0, budgetHit = false;
    for (const org of orgs) {
      if (Date.now() - started > TIME_BUDGET_MS) { budgetHit = true; break; }
      const r = await evaluateOrg(sb, org, appliesTo);
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
