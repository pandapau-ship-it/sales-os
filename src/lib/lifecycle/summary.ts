/**
 * lib/lifecycle/summary.ts — Klartext-Zusammenfassung + „zuletzt gefeuert"-Text für die Regel-Übersicht (L-3c).
 * Rein (die i18n-`t`-Funktion wird injiziert) → in vitest testbar. Labels aus `config` (→ FILTER_SCHEMA, Single Source).
 */
import type { TFunction } from "i18next";
import type { LifecycleRuleConditions } from "@/lib/db";
import type { FilterEntity, FilterGroup, FilterRule } from "@/lib/filter/types";
import { daysSinceIso } from "@/lib/hunterMappers";
import { getFields, entityLabelKey, fieldLabelKey, operatorLabelKey, enumValueLabelKey, operatorNeedsValue } from "./config";

function valueText(entity: FilterEntity, r: FilterRule, t: TFunction): string {
  if (!operatorNeedsValue(r.operator)) return "";
  const v = r.value;
  if (v === undefined || v === null || v === "") return "";
  const field = getFields(entity).find((f) => f.name === r.field);
  if (field?.type === "enum") {
    const vals = Array.isArray(v) ? v : [v];
    return vals.map((x) => t(enumValueLabelKey(field.name, String(x)))).join(", ");
  }
  return Array.isArray(v) ? v.join(", ") : String(v);
}

function ruleText(entity: FilterEntity, r: FilterRule, t: TFunction): string {
  if (!r.field || !r.operator) return "";
  return [t(fieldLabelKey(r.field)), t(operatorLabelKey(r.operator)), valueText(entity, r, t)].filter(Boolean).join(" ");
}

/** Ein-Satz-Zusammenfassung einer Regel: „Wenn <Anker> <erste Bedingung>[ +N weitere], dann <Aktion>[: Payload]". */
export function summarizeRule(
  anchor: FilterEntity,
  conditions: LifecycleRuleConditions,
  actionLabel: string,
  actionPayload: string | null,
  t: TFunction,
): string {
  const anchorLabel = t(entityLabelKey(anchor));
  const groups = conditions.groups ?? [];
  const total = groups.reduce((n, g) => n + ((g.where as FilterGroup).rules ?? []).length, 0);
  const first = groups[0];
  const rules = first ? ((first.where as FilterGroup).rules ?? []) as FilterRule[] : [];
  const firstText = rules[0] ? ruleText(first.entity, rules[0], t) : "";
  const cond = firstText + (total > 1 ? " " + t("lifecycle.ui.summary.more", { count: total - 1 }) : "");
  const action = actionLabel + (actionPayload ? `: „${actionPayload}“` : "");
  return t("lifecycle.ui.summary.sentence", { anchor: anchorLabel, cond, action });
}

/** „Zuletzt gefeuert vor X Tagen · N Datensätze" bzw. „Noch nicht gefeuert". `nowMs` aus useNowMs() (Purity). */
export function lastFiredText(
  lastFiredAt: string | null,
  firedForCount: number,
  t: TFunction,
  nowMs: number = Date.now(),
): string {
  if (!lastFiredAt) return t("lifecycle.ui.lastFired.never");
  const days = daysSinceIso(lastFiredAt, nowMs) ?? 0;
  const when = days === 0 ? t("lifecycle.ui.lastFired.today") : t("lifecycle.ui.lastFired.daysAgo", { count: days });
  return t("lifecycle.ui.lastFired.some", { when, count: firedForCount });
}
