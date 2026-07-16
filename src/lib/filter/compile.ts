/**
 * filter/compile.ts — validierten Filter in einen SICHEREN PostgREST-Logikausdruck übersetzen.
 *
 * Ergebnis ist der Ausdruck für supabase-js `query.or(expr)` (ein `or(x)` um einen einzelnen
 * Knoten ist semantisch = x, deshalb trägt jeder Baum). NIE roher SQL, NIE Nutzer-Werte als
 * Struktur: jeder Wert wird PostgREST-**double-quoted** (Sonderzeichen wie `,` `)` `(` landen
 * INNERHALB der Quotes → können die Bedingung nicht verlassen). Das ist die Injection-Grenze.
 *
 * Wird von der Listen-Query genutzt (K-3-Wiring). Der In-Memory-Evaluator (evaluate.ts) MUSS
 * dieselbe Treffermenge liefern — beide fahren denselben validierten Baum (Single Source).
 *
 * SEMANTIK-KONTRAKT (identisch zu evaluate.ts): `eq`/`neq`/`in`/`not_in` = SQL, also für
 * Text/Enum **case-sensitiv**; NULL matcht nie außer `is_empty`; `is_empty` = NULL ODER
 * leerer String (Skalar) bzw. NULL ODER leeres Array (`text[]`); `contains`/`starts_with` = ilike.
 */

import {
  type FilterDefinition,
  type FilterNode,
  type FilterRule,
  type FilterValue,
  isGroup,
} from "./types";
import { getFieldSpec } from "./schema";
import { validateFilter } from "./validate";
import type { FilterEntity } from "./types";

/** PostgREST-Value quoten: in "..." wrappen, `\` und `"` escapen. Sonderzeichen werden literal. */
function pgQuote(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Skalar → PostgREST-Token. Zahlen/Booleans bar, alles andere gequotet (Injection-sicher). */
function enc(entity: FilterEntity, field: string, value: string | number | boolean): string {
  const spec = getFieldSpec(entity, field);
  if (spec && (spec.type === "number" || spec.type === "boolean")) return String(value);
  return pgQuote(String(value));
}

function list(entity: FilterEntity, field: string, values: Array<string | number>): string {
  return values.map((v) => enc(entity, field, v)).join(",");
}

function compileRule(entity: FilterEntity, rule: FilterRule): string {
  const { field, operator, value } = rule;
  const v = value as FilterValue;

  switch (operator) {
    case "eq":
    case "neq":
    case "gt":
    case "gte":
    case "lt":
    case "lte":
      return `${field}.${operator}.${enc(entity, field, v as string | number | boolean)}`;
    case "contains":
      // Wildcards innerhalb der Quotes (Sicherheit vor Breakout). Wildcard-Semantik für
      // Werte mit Sonderzeichen wird beim Listen-DB-Wiring (K-3) gegen die Live-DB verifiziert.
      return `${field}.ilike.${pgQuote(`*${String(v)}*`)}`;
    case "starts_with":
      return `${field}.ilike.${pgQuote(`${String(v)}*`)}`;
    case "in":
      return `${field}.in.(${list(entity, field, v as Array<string | number>)})`;
    case "not_in":
      return `${field}.not.in.(${list(entity, field, v as Array<string | number>)})`;
    case "has_any":
      // Array-Overlap: text[] & Werte-Liste. Curly-Literal mit gequoteten Elementen.
      return `${field}.ov.{${(v as Array<string | number>).map((x) => pgQuote(String(x))).join(",")}}`;
    case "is_empty":
      // text[]: leeres Array `{}`; Skalar: leerer String. Parität mit evaluate.isEmpty.
      return getFieldSpec(entity, field)?.type === "text[]"
        ? `or(${field}.is.null,${field}.eq.{})`
        : `or(${field}.is.null,${field}.eq.${pgQuote("")})`;
    case "is_not_empty":
      return getFieldSpec(entity, field)?.type === "text[]"
        ? `and(${field}.not.is.null,${field}.neq.{})`
        : `and(${field}.not.is.null,${field}.neq.${pgQuote("")})`;
    default:
      // validate.ts hat unbekannte Operatoren längst ausgeschlossen — defensiv.
      throw new Error(`compile: unsupported operator ${operator}`);
  }
}

function compileNode(entity: FilterEntity, node: FilterNode): string {
  if (isGroup(node)) {
    const inner = node.rules.map((r) => compileNode(entity, r)).join(",");
    return `${node.logic.toLowerCase()}(${inner})`;
  }
  return compileRule(entity, node);
}

/**
 * Validiert den Filter und gibt den PostgREST-Ausdruck für `query.or(expr)` zurück.
 * Wirft FilterValidationError bei ungültigem Filter (nie stilles Fehlverhalten).
 */
export function compileToPostgrest(def: FilterDefinition): string {
  validateFilter(def);
  return compileNode(def.entity, def.where);
}
