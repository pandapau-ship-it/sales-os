/**
 * lib/lifecycle/config.ts — Builder-Vokabular des Lifecycle-Regel-Builders (L-3a).
 *
 * Single Source: Felder + Typen + Operatoren kommen AUSSCHLIESSLICH aus `src/lib/filter`
 * (FILTER_SCHEMA / OPERATORS_BY_TYPE) — hier wird nichts dupliziert, nur um Entity-Meta (Icon/
 * Token/Label) und i18n-Key-Helfer angereichert. Anzeige-Labels liegen in `locales/*` (nie hier
 * hartkodiert). Reine Daten/Funktionen (die Icons sind Referenzen) → in vitest testbar.
 */
import { User, Briefcase, Building2, type LucideIcon } from "lucide-react";
import type { FilterEntity, FilterOperator } from "@/lib/filter/types";
import { FILTER_SCHEMA, OPERATORS_BY_TYPE, type FieldType } from "@/lib/filter/schema";

// ── i18n-Key-Helfer (flache Namensräume; gleiche Bedeutung = gleicher Key) ────
export const entityLabelKey = (entity: FilterEntity) => `lifecycle.entity.${entity}.label`;
export const entityDescKey = (entity: FilterEntity) => `lifecycle.entity.${entity}.desc`;
export const fieldLabelKey = (field: string) => `lifecycle.field.${field}`;
export const operatorLabelKey = (op: FilterOperator) => `lifecycle.op.${op}`;
export const enumValueLabelKey = (field: string, value: string) => `lifecycle.enum.${field}.${value}`;
export const boolValueLabelKey = (value: boolean) => `lifecycle.bool.${value}`;
export const actionParamLabelKey = (param: string) => `lifecycle.actionParam.${param}.label`;
export const actionParamPlaceholderKey = (param: string) => `lifecycle.actionParam.${param}.ph`;

// ── Anker / Entity-Meta ──────────────────────────────────────────────────────
/** Reihenfolge der Anker im Builder. */
export const ENTITY_ORDER: FilterEntity[] = ["contacts", "deals", "companies"];

export interface EntityMeta {
  labelKey: string;
  descKey: string;
  icon: LucideIcon;
  /** Entity-Farbe als CSS-Variable (in index.css definiert, L-3b) — NIE Hex im Code. */
  colorVar: string;
}

/** Entity-Meta: Icon + Farb-Token + i18n. Farben = dezente Tint-Chips zur Entity-Kennung. */
export const ENTITY_META: Record<FilterEntity, EntityMeta> = {
  contacts:  { labelKey: entityLabelKey("contacts"),  descKey: entityDescKey("contacts"),  icon: User,      colorVar: "--entity-contact" },
  deals:     { labelKey: entityLabelKey("deals"),     descKey: entityDescKey("deals"),     icon: Briefcase, colorVar: "--entity-deal" },
  companies: { labelKey: entityLabelKey("companies"), descKey: entityDescKey("companies"), icon: Building2, colorVar: "--entity-company" },
};

// ── Felder / Operatoren (aus der Filter-Lib, Single Source) ──────────────────
/**
 * Im Builder BEWUSST ausgeblendete Felder (dokumentierte Entscheidungen, siehe PROGRESS):
 * `assigned_to` (uuid) — im Regel-Builder nicht sinnvoll frei filterbar; bewusst weggelassen,
 * kein Versehen. Wird eine „Regel für meine zugewiesenen Kontakte" gebraucht → eigenes Feature.
 */
const HIDDEN_FIELDS: Partial<Record<FilterEntity, readonly string[]>> = {
  contacts: ["assigned_to"],
};

export interface FieldMeta {
  name: string;
  type: FieldType;
  enumValues?: readonly string[];
  labelKey: string;
}

/** Filterbare Felder einer Entität (aus FILTER_SCHEMA) — ohne bewusst ausgeblendete. */
export function getFields(entity: FilterEntity): FieldMeta[] {
  const hidden = HIDDEN_FIELDS[entity] ?? [];
  return Object.entries(FILTER_SCHEMA[entity])
    .filter(([name]) => !hidden.includes(name))
    .map(([name, spec]) => ({ name, type: spec.type, enumValues: spec.enumValues, labelKey: fieldLabelKey(name) }));
}

/** Erlaubte Operatoren für einen Feldtyp (aus OPERATORS_BY_TYPE). */
export function getOperators(type: FieldType): readonly FilterOperator[] {
  return OPERATORS_BY_TYPE[type];
}

/** Operatoren OHNE Wert-Eingabe → das Wertfeld wird ausgeblendet. */
export function operatorNeedsValue(op: FilterOperator): boolean {
  return op !== "is_empty" && op !== "is_not_empty";
}

/** Operatoren mit MEHREREN Werten (Liste) → Mehrfach-Eingabe im Wertfeld. */
export function operatorTakesList(op: FilterOperator): boolean {
  return op === "in" || op === "not_in" || op === "has_any";
}
