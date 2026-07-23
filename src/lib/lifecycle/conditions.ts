/**
 * lib/lifecycle/conditions.ts — reine, immutable Manipulation des Bedingungs-Baums des Regel-Builders (L-3b).
 *
 * Modell = die gespeicherte Form (`LifecycleRuleConditions`, Option B): { logic, groups:[{entity, where}] }.
 * KONVENTION im Builder: `where` ist IMMER eine FilterGroup { logic, rules: FilterRule[] } — so ist die
 * Innerhalb-Gruppe-Logik (UND/ODER) schaltbar (unser Compiler kann das), und die Zwischen-Gruppen-Logik ist
 * der EINE `conditions.logic` (Option-B-Grenze: kein gemischtes je Paar). Kein IO, keine React — in vitest testbar.
 */
import type { LifecycleRuleConditions } from "@/lib/db";
import type { FilterEntity, FilterGroup, FilterRule, FilterOperator } from "@/lib/filter/types";

export type BuilderConditions = LifecycleRuleConditions;
export type Logic = "AND" | "OR";

/** Leere Bedingungen (noch keine Gruppe). */
export const emptyConditions = (): BuilderConditions => ({ logic: "AND", groups: [] });

/** Neue, noch unvollständige Bedingungs-Zeile (field/operator leer). */
export const newRule = (): FilterRule => ({ field: "", operator: "" as FilterOperator, value: undefined });

/** Neue Gruppe für eine Datenart (startet mit einer leeren Zeile). */
export const newGroup = (entity: FilterEntity): { entity: FilterEntity; where: FilterGroup } => ({
  entity,
  where: { logic: "AND", rules: [newRule()] },
});

// ── Interne Helfer ───────────────────────────────────────────────────────────
const asGroup = (where: FilterGroup | FilterRule): FilterGroup =>
  "rules" in where ? where : { logic: "AND", rules: [where] };

const mapGroupWhere = (
  c: BuilderConditions,
  gIdx: number,
  fn: (w: FilterGroup) => FilterGroup,
): BuilderConditions => ({
  ...c,
  groups: c.groups.map((g, i) => (i === gIdx ? { ...g, where: fn(asGroup(g.where as FilterGroup)) } : g)),
});

/** Regeln einer Gruppe (Convenience für die UI). */
export const rulesOf = (g: { where: FilterGroup | FilterRule }): FilterRule[] => asGroup(g.where).rules as FilterRule[];
/** Innerhalb-Gruppe-Logik. */
export const logicOf = (g: { where: FilterGroup | FilterRule }): Logic => asGroup(g.where).logic;

// ── Immutable Updater ────────────────────────────────────────────────────────
export const addGroup = (c: BuilderConditions, entity: FilterEntity): BuilderConditions => ({
  ...c,
  groups: [...c.groups, newGroup(entity)],
});
export const removeGroup = (c: BuilderConditions, gIdx: number): BuilderConditions => ({
  ...c,
  groups: c.groups.filter((_, i) => i !== gIdx),
});
export const setBetweenLogic = (c: BuilderConditions, logic: Logic): BuilderConditions => ({ ...c, logic });
export const setGroupLogic = (c: BuilderConditions, gIdx: number, logic: Logic): BuilderConditions =>
  mapGroupWhere(c, gIdx, (w) => ({ ...w, logic }));

export const addRule = (c: BuilderConditions, gIdx: number): BuilderConditions =>
  mapGroupWhere(c, gIdx, (w) => ({ ...w, rules: [...w.rules, newRule()] }));
export const removeRule = (c: BuilderConditions, gIdx: number, rIdx: number): BuilderConditions =>
  mapGroupWhere(c, gIdx, (w) => ({ ...w, rules: (w.rules as FilterRule[]).filter((_, i) => i !== rIdx) }));
export const updateRule = (
  c: BuilderConditions,
  gIdx: number,
  rIdx: number,
  patch: Partial<FilterRule>,
): BuilderConditions =>
  mapGroupWhere(c, gIdx, (w) => ({
    ...w,
    rules: (w.rules as FilterRule[]).map((r, i) => (i === rIdx ? { ...r, ...patch } : r)),
  }));

// ── Vollständigkeit (steuert „Speichern"-Freigabe + Live-Trefferzahl-Auslösung) ──
/** Operatoren ohne Wert. Spiegelt config.operatorNeedsValue, aber hier lokal (kein UI-Import). */
const noValueOp = (op: FilterOperator): boolean => op === "is_empty" || op === "is_not_empty";

export function isRuleComplete(r: FilterRule): boolean {
  if (!r.field || !r.operator) return false;
  if (noValueOp(r.operator)) return true;
  if (r.value === undefined || r.value === null || r.value === "") return false;
  if (Array.isArray(r.value) && r.value.length === 0) return false;
  return true;
}

/** Alle Gruppen ≥1 Zeile UND alle Zeilen vollständig → speicherbar / Live-Trefferzahl abfragbar. */
export function isConditionsComplete(c: BuilderConditions): boolean {
  if (c.groups.length === 0) return false;
  return c.groups.every((g) => {
    const rules = rulesOf(g);
    return rules.length > 0 && rules.every(isRuleComplete);
  });
}
