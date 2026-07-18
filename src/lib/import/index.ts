/**
 * import/ — Smart-Import-Engine (K-5). Reine, UI-/AI-freie Schichten: Mapping (Wörterbuch) +
 * Validierung (nutzt K1/K2). Parsing (Schicht 1, papaparse/xlsx) und DB-Ausführung (Schicht 4,
 * Edge) folgen separat. Consumer importieren nur aus diesem Barrel.
 */
export * from "./types";
export {
  normalizeHeader,
  resolveHeader,
  buildMappingPlan,
  headerSignature,
  applyMapping,
} from "./mapping";
export { detectEncoding, stripBom, detectDelimiter } from "./detect";
export { parseImportFile, ImportParseError, type ParseLimits } from "./parse";
export { validateRow, validateImport, summarize } from "./validate";
export { buildImportPlan, extractEmailDomain, type RowDecision, type ImportPlan } from "./execute";
