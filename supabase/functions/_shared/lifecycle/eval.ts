/**
 * _shared/lifecycle/eval.ts — REINE Auswerte-Logik des Lifecycle-Baukastens (L-2a).
 *
 * Kein DB/IO, keine Deno-/Node-Abhängigkeit → nutzbar von der Edge Function (Deno) UND von vitest.
 * Die Edge holt die Match-Mengen je Regel/Gruppe aus der DB (compileToPostgrest + FK-Mapping) und
 * gibt sie hier hinein; diese Datei entscheidet WAS feuert (Mengen-Algebra · Einmal-Feuer · Rangfolge/
 * terminal · Batching). Single Source der Auswerte-Entscheidung — testbar isoliert.
 */

export type AnchorEntity = "contacts" | "companies" | "deals";

export interface RuleCore {
  id: string;
  anchor_entity: AnchorEntity;
  priority: number;       // größer = wichtiger (feuert zuerst, gewinnt bei is_terminal)
  is_terminal: boolean;   // schneidet rangniedrigere Regeln für DENSELBEN Datensatz ab
  created_at: string;     // ISO — stabiler Tiebreaker
}

// ── Mengen-Algebra: Gruppen-Anker-IDs → Anker-Match-Menge (Option B) ─────────
/** AND = Schnittmenge · OR = Vereinigung über die je-Gruppe gemappten Anker-ID-Mengen. */
export function combineAnchorSets(logic: "AND" | "OR", groupSets: string[][]): string[] {
  if (groupSets.length === 0) return [];
  if (logic === "OR") {
    const u = new Set<string>();
    for (const g of groupSets) for (const id of g) u.add(id);
    return [...u];
  }
  // AND: fortlaufende Schnittmenge (leere Gruppe → leeres Ergebnis).
  let acc = new Set(groupSets[0]);
  for (let i = 1; i < groupSets.length; i++) {
    const s = new Set(groupSets[i]);
    acc = new Set([...acc].filter((x) => s.has(x)));
  }
  return [...acc];
}

// ── Einmal-Feuer (Edge-Trigger): nicht-match→match feuert; match→nicht-match rüstet nach ──
export function diffFire(current: string[], prevMatched: string[]): { toFire: string[]; toRearm: string[] } {
  const cur = new Set(current);
  const prev = new Set(prevMatched);
  return {
    toFire: current.filter((id) => !prev.has(id)),   // neu zutreffend
    toRearm: prevMatched.filter((id) => !cur.has(id)), // matcht nicht mehr → matched=false
  };
}

// ── Rangfolge: priority DESC · Gleichstand terminal zuerst · dann created_at ASC ──
export function orderRules<T extends RuleCore>(rules: T[]): T[] {
  return [...rules].sort(
    (a, b) =>
      b.priority - a.priority ||
      (Number(b.is_terminal) - Number(a.is_terminal)) ||
      (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0),
  );
}

/** Aktiver Präfix bis EINSCHLIESSLICH der ersten terminalen Regel; der Rest ist unterdrückt. */
export function activePrefix<T extends RuleCore>(orderedMatching: T[]): { active: T[]; suppressed: T[] } {
  const idx = orderedMatching.findIndex((r) => r.is_terminal);
  if (idx === -1) return { active: orderedMatching, suppressed: [] };
  return { active: orderedMatching.slice(0, idx + 1), suppressed: orderedMatching.slice(idx + 1) };
}

// ── Gesamt-Plan (eine Org): was feuert, was wird nachgerüstet, was unterdrückt/vertagt ──
export interface RuleInput extends RuleCore {
  organization_id: string;
  action: { type: string; params?: Record<string, unknown> };
}
export interface PlanInput {
  rules: RuleInput[];                            // aktive Regeln EINER Org
  matchByRule: Record<string, string[]>;         // ruleId → aktuell matchende Anker-IDs
  prevMatchedByRule: Record<string, string[]>;   // ruleId → zuvor matched=true (aus lifecycle_rule_runs)
  maxFired: number;                              // Sicherheitsnetz: max Aktions-Feuer je Lauf
}
export interface FireItem { ruleId: string; entityId: string; }
export interface Plan {
  fires: FireItem[];    // Aktion ausführen + matched=true, fired_count+1
  rearms: FireItem[];   // matched=false (matcht nicht mehr)
  suppressed: number;   // durch terminal abgeschnittene (Regel,Datensatz)-Paare
  carried: number;      // neu zutreffend, aber durch Batch-Limit vertagt (nächster Lauf holt nach)
  candidates: number;   // gesamte neu-zutreffend-Kandidaten vor Batch-Limit
}

/**
 * Reine Orchestrierung: Rangfolge + terminal + Einmal-Feuer + Batch-Limit.
 * `matchByRule` ist die schon fertige Anker-Match-Menge je Regel (Edge: compileToPostgrest je Gruppe →
 * FK-Mapping → combineAnchorSets). Batching: über das Match-Limit hinausgehende Feuer werden VERTAGT
 * (nicht als matched markiert) → sie bleiben „neu zutreffend" und werden im nächsten Lauf gefeuert
 * (vollständige Abarbeitung, kein Cutoff). Der matched-Zustand ist der Fortschritts-Cursor.
 */
export function computePlan(input: PlanInput): Plan {
  const { rules, matchByRule, prevMatchedByRule, maxFired } = input;
  const ordered = orderRules(rules);
  const idxOf = new Map(ordered.map((r, i) => [r.id, i] as const));

  // 1) Nachrüsten (rearm) — je Regel unabhängig von terminal/Batch (billig): prev \ current.
  const rearms: FireItem[] = [];
  for (const r of ordered) {
    const cur = new Set(matchByRule[r.id] ?? []);
    for (const id of prevMatchedByRule[r.id] ?? []) if (!cur.has(id)) rearms.push({ ruleId: r.id, entityId: id });
  }

  // 2) Kandidaten je Anker-Datensatz bestimmen (terminal-Abschnitt + Einmal-Feuer).
  const candidates: Array<FireItem & { rank: number }> = [];
  let suppressed = 0;
  for (const anchor of ["contacts", "companies", "deals"] as AnchorEntity[]) {
    const anchorRules = ordered.filter((r) => r.anchor_entity === anchor);
    if (anchorRules.length === 0) continue;
    // entityId → matchende Regeln (in globaler Reihenfolge)
    const byEntity = new Map<string, RuleInput[]>();
    for (const r of anchorRules) {
      for (const id of matchByRule[r.id] ?? []) {
        (byEntity.get(id) ?? byEntity.set(id, []).get(id)!).push(r);
      }
    }
    for (const [entityId, matching] of byEntity) {
      const { active, suppressed: sup } = activePrefix(matching);
      suppressed += sup.length;
      for (const r of active) {
        const prev = new Set(prevMatchedByRule[r.id] ?? []);
        if (!prev.has(entityId)) candidates.push({ ruleId: r.id, entityId, rank: idxOf.get(r.id)! }); // neu zutreffend
        // bereits matched → schon gefeuert, nichts tun
      }
    }
  }

  // 3) Batch-Limit: deterministische Reihenfolge (Rang, dann entityId), Rest vertagen.
  candidates.sort((a, b) => a.rank - b.rank || (a.entityId < b.entityId ? -1 : a.entityId > b.entityId ? 1 : 0));
  const cap = Math.max(0, maxFired);
  const fires = candidates.slice(0, cap).map(({ ruleId, entityId }) => ({ ruleId, entityId }));
  return { fires, rearms, suppressed, carried: candidates.length - fires.length, candidates: candidates.length };
}
