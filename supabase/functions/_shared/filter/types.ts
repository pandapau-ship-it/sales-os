// MIRROR von src/lib/filter/types.ts — Deno-Edge kann src/ nicht importieren (Präzedenz terminalStages.ts).
// EXAKT in Sync halten mit der Quelle; erzwungen durch den Parity-Test (mirror-parity.test.ts).
/**
 * filter/types.ts — Die gemeinsame Filter-Sprache (Weiche 1, Masterplan Abschnitt 5).
 *
 * EINE Sprache für: dynamische Listen (K-6/Smart Lists), Lifecycle-Trigger (conditions[])
 * und den Analyse-Katalog. NIE eine zweite bauen, NIE freies SQL.
 *
 * Aufbau (bewusst schmal + erweiterbar):
 *  - `FilterRule`   = eine Bedingung (Feld · Operator · Wert)
 *  - `FilterGroup`  = UND/ODER-Verknüpfung beliebig geschachtelter Regeln/Gruppen
 *  - `FilterNode`   = Regel ODER Gruppe (rekursiv)
 *
 * Der Baum ist reine Daten (JSON-serialisierbar → passt in `lists.filter_config`,
 * `sequence_rules.condition` usw.). Validierung + Auswertung liegen in eigenen Dateien.
 */

/** Unterstützte Entitäten. Erweiterbar über das Schema (schema.ts), nicht hier. */
export type FilterEntity = "contacts" | "companies" | "deals";

/**
 * Operator-Kanon. Bewusst geschlossen (Whitelist) — ein Operator existiert nur, wenn er
 * hier steht UND das Schema ihn für den Feldtyp erlaubt. Kein freitextiger Operator.
 */
export type FilterOperator =
  | "eq" // gleich
  | "neq" // ungleich
  | "gt" // >
  | "gte" // >=
  | "lt" // <
  | "lte" // <=
  | "contains" // Text enthält (case-insensitive)
  | "starts_with" // Text beginnt mit (case-insensitive)
  | "in" // Wert ∈ Liste
  | "not_in" // Wert ∉ Liste
  | "is_empty" // NULL oder leer
  | "is_not_empty" // gesetzt
  | "has_any"; // Array-Feld (tags) enthält mind. einen der Werte

/** Zulässige Werttypen einer Regel. `is_empty`/`is_not_empty` tragen keinen Wert. */
export type FilterValue = string | number | boolean | Array<string | number> | null;

export interface FilterRule {
  field: string;
  operator: FilterOperator;
  value?: FilterValue;
}

export interface FilterGroup {
  logic: "AND" | "OR";
  rules: FilterNode[];
}

export type FilterNode = FilterRule | FilterGroup;

/** Wurzel einer gespeicherten Filter-Definition (das, was in der DB liegt). */
export interface FilterDefinition {
  entity: FilterEntity;
  where: FilterNode;
}

// ── Typ-Guards ───────────────────────────────────────────────────────────────
export function isGroup(node: FilterNode): node is FilterGroup {
  return (node as FilterGroup).logic !== undefined;
}
export function isRule(node: FilterNode): node is FilterRule {
  return (node as FilterRule).field !== undefined;
}
