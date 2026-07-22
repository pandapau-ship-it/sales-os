// MIRROR von src/lib/filter/validate.ts — Deno-Edge kann src/ nicht importieren (Präzedenz terminalStages.ts).
// EXAKT in Sync halten mit der Quelle; erzwungen durch den Parity-Test (mirror-parity.test.ts).
/**
 * filter/validate.ts — Filter-Definition gegen das Whitelist-Schema prüfen.
 *
 * Nichts wird ausgewertet oder in eine Query übersetzt, bevor es hier durchläuft:
 *  - Feld unbekannt (nicht im Schema) → Fehler (verhindert beliebige Spaltennamen)
 *  - Operator für den Feldtyp nicht erlaubt → Fehler
 *  - Werttyp passt nicht zum Feldtyp / Operator → Fehler
 *  - enum-Wert außerhalb der erlaubten Menge → Fehler
 *  - unbekannter/zu tiefer Baum → Fehler
 *
 * So können Nutzer-Werte NIE zu Spaltennamen/Operatoren/SQL werden — sie sind reine Daten,
 * die erst nach der Validierung parametrisiert (Compiler) oder verglichen (Evaluator) werden.
 */

import {
  type FilterDefinition,
  type FilterEntity,
  type FilterNode,
  type FilterOperator,
  type FilterValue,
  isGroup,
  isRule,
} from "./types.ts";
import { getFieldSpec, operatorAllowed, type FieldSpec } from "./schema.ts";

export class FilterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FilterValidationError";
  }
}

// Operatoren, die KEINEN Wert tragen (dürfen).
const VALUELESS: ReadonlySet<FilterOperator> = new Set(["is_empty", "is_not_empty"]);
// Operatoren, die eine LISTE als Wert erwarten.
const LIST_OPS: ReadonlySet<FilterOperator> = new Set(["in", "not_in", "has_any"]);

// Schutz gegen entartete/böswillige Bäume (Stack/CPU).
const MAX_DEPTH = 8;
const MAX_RULES = 100;

function checkValueType(spec: FieldSpec, operator: FilterOperator, value: FilterValue): void {
  if (VALUELESS.has(operator)) {
    if (value !== undefined && value !== null) {
      throw new FilterValidationError(`Operator '${operator}' erwartet keinen Wert`);
    }
    return;
  }

  if (LIST_OPS.has(operator)) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new FilterValidationError(`Operator '${operator}' erwartet eine nicht-leere Liste`);
    }
    for (const v of value) assertScalarType(spec, v);
    return;
  }

  if (value === undefined || value === null || Array.isArray(value)) {
    throw new FilterValidationError(`Operator '${operator}' erwartet einen einzelnen Wert`);
  }
  assertScalarType(spec, value);
}

function assertScalarType(spec: FieldSpec, value: string | number | boolean): void {
  switch (spec.type) {
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new FilterValidationError("Zahl erwartet");
      }
      break;
    case "boolean":
      if (typeof value !== "boolean") throw new FilterValidationError("Boolean erwartet");
      break;
    case "enum":
      if (typeof value !== "string" || !spec.enumValues?.includes(value)) {
        throw new FilterValidationError(`Unzulässiger Wert für enum: ${String(value)}`);
      }
      break;
    // text, date, text[]-Elemente: als String führen (Datum als ISO-String).
    default:
      if (typeof value !== "string") throw new FilterValidationError("Text erwartet");
  }
}

function validateNode(entity: FilterEntity, node: FilterNode, depth: number, count: { n: number }): void {
  if (depth > MAX_DEPTH) throw new FilterValidationError("Filter zu tief verschachtelt");

  if (isGroup(node)) {
    if (node.logic !== "AND" && node.logic !== "OR") {
      throw new FilterValidationError(`Unbekannte Verknüpfung: ${String(node.logic)}`);
    }
    if (!Array.isArray(node.rules) || node.rules.length === 0) {
      throw new FilterValidationError("Gruppe braucht mindestens eine Regel");
    }
    for (const child of node.rules) validateNode(entity, child, depth + 1, count);
    return;
  }

  if (!isRule(node)) throw new FilterValidationError("Ungültiger Filter-Knoten");

  if (++count.n > MAX_RULES) throw new FilterValidationError("Zu viele Regeln");

  const spec = getFieldSpec(entity, node.field);
  if (!spec) throw new FilterValidationError(`Unbekanntes Feld: ${node.field}`);
  if (!operatorAllowed(spec.type, node.operator)) {
    throw new FilterValidationError(`Operator '${node.operator}' nicht erlaubt für ${node.field}`);
  }
  checkValueType(spec, node.operator, node.value ?? null);
}

/** Wirft FilterValidationError bei jedem Verstoß; kehrt normal zurück, wenn gültig. */
export function validateFilter(def: FilterDefinition): void {
  if (!def || !def.entity || !getFieldSpecEntity(def.entity)) {
    throw new FilterValidationError(`Unbekannte Entität: ${String(def?.entity)}`);
  }
  if (!def.where) throw new FilterValidationError("Filter ohne Bedingung");
  validateNode(def.entity, def.where, 0, { n: 0 });
}

/** Bequeme Boolean-Variante (ok/nicht ok) ohne Grund. */
export function isValidFilter(def: FilterDefinition): boolean {
  try {
    validateFilter(def);
    return true;
  } catch {
    return false;
  }
}

function getFieldSpecEntity(entity: string): boolean {
  return entity === "contacts" || entity === "companies" || entity === "deals";
}
