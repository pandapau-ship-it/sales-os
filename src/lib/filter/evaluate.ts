/**
 * filter/evaluate.ts — Filter gegen EINEN Datensatz auswerten (in-memory Prädikat).
 *
 * Zweck: Lifecycle-Trigger prüfen bei einem Event „matcht dieser Kontakt die Bedingung?"
 * OHNE DB-Round-Trip. Gleiche validierte Sprache wie die Listen-Query (Single Source) —
 * dieses Prädikat und die DB-Übersetzung (compile.ts) MÜSSEN dieselbe Treffermenge liefern.
 *
 * KANONISCHER SEMANTIK-KONTRAKT (die DB/PostgREST ist die Wahrheit, weil Listen exakt der
 * Query entsprechen müssen — compile.ts hält denselben Kontrakt):
 *  - `eq`/`neq`/`in`/`not_in` sind für Text/Enum **case-SENSITIV** (SQL `=`). Für
 *    case-insensitiv → `contains`/`starts_with` (ilike) nutzen.
 *  - **NULL/fehlendes Feld matcht NIE** — außer `is_empty` (SQL-Unknown-Semantik: auch
 *    `neq`/`not_in`/Vergleiche liefern bei NULL `false`, nicht `true`).
 *  - `is_empty` = NULL ODER leerer String ODER leeres Array (exakt, kein Whitespace-Trim —
 *    entspricht `or(field.is.null, field.eq."")` bzw. `.eq.{}` in compile.ts).
 *  - `contains`/`starts_with` = ilike (case-insensitiv).
 *
 * Werte sind bereits validierte Daten (validate.ts) → hier nur noch vergleichen, nie eval'n.
 */

import {
  type FilterDefinition,
  type FilterNode,
  type FilterRule,
  type FilterValue,
  isGroup,
} from "./types";
import { validateFilter } from "./validate";

type Record_ = Record<string, unknown>;

const isNull = (v: unknown): boolean => v === null || v === undefined;
const ci = (v: unknown): string => String(v ?? "").toLowerCase(); // nur für ilike-Operatoren
/** Case-SENSITIVER Exact-Vergleich (SQL `=`); NULL matcht nie. */
const eqSensitive = (fieldVal: unknown, ruleVal: unknown): boolean =>
  !isNull(fieldVal) && String(fieldVal) === String(ruleVal);

function isEmpty(v: unknown): boolean {
  if (isNull(v)) return true;
  if (typeof v === "string") return v === ""; // exakt (kein trim) → Parität mit eq.""
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

// Vergleich für gt/lt: Zahlen numerisch, ISO-Daten via Date. NULL → wird vom Aufrufer abgefangen.
function num(v: unknown): number {
  if (typeof v === "number") return v;
  const t = Date.parse(String(v));
  if (!Number.isNaN(t)) return t;
  const n = Number(v);
  return Number.isNaN(n) ? Number.NEGATIVE_INFINITY : n;
}

function evalRule(rule: FilterRule, record: Record_): boolean {
  const fieldVal = record[rule.field];
  const { operator, value } = rule;

  switch (operator) {
    case "is_empty":
      return isEmpty(fieldVal);
    case "is_not_empty":
      return !isEmpty(fieldVal);
    case "eq":
      return eqSensitive(fieldVal, value);
    case "neq":
      return !isNull(fieldVal) && String(fieldVal) !== String(value);
    case "in":
      return !isNull(fieldVal) && Array.isArray(value) && value.some((v) => eqSensitive(fieldVal, v));
    case "not_in":
      return !isNull(fieldVal) && Array.isArray(value) && !value.some((v) => eqSensitive(fieldVal, v));
    case "has_any": {
      const arr = Array.isArray(fieldVal) ? fieldVal : [];
      return Array.isArray(value) && value.some((v) => arr.some((f) => String(f) === String(v)));
    }
    case "contains":
      return !isNull(fieldVal) && ci(fieldVal).includes(ci(value));
    case "starts_with":
      return !isNull(fieldVal) && ci(fieldVal).startsWith(ci(value));
    case "gt":
      return !isNull(fieldVal) && num(fieldVal) > num(value as FilterValue);
    case "gte":
      return !isNull(fieldVal) && num(fieldVal) >= num(value as FilterValue);
    case "lt":
      return !isNull(fieldVal) && num(fieldVal) < num(value as FilterValue);
    case "lte":
      return !isNull(fieldVal) && num(fieldVal) <= num(value as FilterValue);
    default:
      return false;
  }
}

function evalNode(node: FilterNode, record: Record_): boolean {
  if (isGroup(node)) {
    return node.logic === "AND"
      ? node.rules.every((r) => evalNode(r, record))
      : node.rules.some((r) => evalNode(r, record));
  }
  return evalRule(node, record);
}

/**
 * `true`, wenn der Datensatz die (zuvor validierte) Filter-Definition erfüllt.
 * Validiert defensiv erneut — ein ungültiger Filter wirft, statt still „false" zu liefern.
 */
export function evaluateFilter(def: FilterDefinition, record: Record_): boolean {
  validateFilter(def);
  return evalNode(def.where, record);
}
