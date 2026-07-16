/**
 * import/types.ts — Smart-Import-Engine (K-5), gemeinsame Typen.
 *
 * Die Engine ist in reine, UI-/AI-freie Schichten geschnitten (K-1b/K-2-Muster):
 *  - Schicht 1 Parsing (parse.ts) liefert `ParsedFile` (headers + rows als Strings).
 *  - Schicht 2 Mapping (mapping.ts) ordnet Header → Ziel-Feld (Wörterbuch, deterministisch).
 *  - Schicht 3 Validierung (validate.ts) prüft je Zeile (Pflichtfelder K1, Format, Duplikat K2).
 * Alle drei sind rein + in vitest testbar; DB-Schreiben (Schicht 4) ist Edge/Server.
 */

/** Ziel-Felder eines Kontakt-Imports (Untermenge der contacts-Spalten; company als Name-String). */
export type ImportField =
  | "first_name"
  | "last_name"
  | "email"
  | "linkedin_url"
  | "phone"
  | "job_title"
  | "seniority"
  | "company_name"
  | "city"
  | "country"
  | "tags"
  | "notes";

/** Ergebnis der Parsing-Schicht: normalisierte Kopfzeile + Roh-Zeilen (Header → Zellwert). */
export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
  /** Hinweise der Parser-Schicht (z.B. „mehrere Sheets — erstes genutzt", erkanntes Encoding). */
  notices?: string[];
}

/** Mapping einer Quell-Spalte auf ein Ziel-Feld (oder bewusst nicht importiert). */
export interface ColumnMapping {
  header: string;
  /** null = nicht importieren (unbekannt oder abgewählt). */
  field: ImportField | null;
  /** Herkunft des Vorschlags — dictionary (sicher) · none (unerkannt) · manual (User) · ai (später). */
  source: "dictionary" | "none" | "manual" | "ai";
}

/** Vollständiger Mapping-Plan einer Datei. */
export interface MappingPlan {
  columns: ColumnMapping[];
  /** Header, die keinem Feld zugeordnet wurden (unmapped). */
  unmapped: string[];
}

/** Ein auf Ziel-Felder gemappter Datensatz (vor Validierung). */
export type MappedRecord = Partial<Record<ImportField, string>>;

/** Pro-Zeile-Status der Validierungs-Preview. */
export type RowStatus = "valid" | "error" | "duplicate";

export interface ValidatedRow {
  index: number; // 0-basierte Zeilennummer in der Datei (ohne Header)
  record: MappedRecord;
  status: RowStatus;
  /** bei error: Feld → Grund. */
  errors?: Record<string, string>;
  /** bei duplicate: Treffer-Details (aus dedup.ts). */
  duplicate?: { level: "sicher" | "moeglich"; matchType: string; matchedId: string };
}

/** Aggregierter Import-Report (K8, echte Zahlen). */
export interface ImportReport {
  total: number;
  valid: number;
  error: number;
  duplicate: number;
}
