/**
 * filter/ — Die gemeinsame Filter-Sprache (Weiche 1). EINE Quelle für dynamische Listen,
 * Lifecycle-Trigger und Analyse-Katalog. Consumer importieren nur aus diesem Barrel.
 */
export * from "./types";
export { FILTER_SCHEMA, getFieldSpec, operatorAllowed, OPERATORS_BY_TYPE } from "./schema";
export type { FieldType, FieldSpec } from "./schema";
export { validateFilter, isValidFilter, FilterValidationError } from "./validate";
export { evaluateFilter } from "./evaluate";
export { compileToPostgrest } from "./compile";
