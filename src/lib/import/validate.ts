/**
 * import/validate.ts — Schicht 3 (Validierungs-Preview) der Smart-Import-Engine (K-5).
 *
 * Prüft jede gemappte Zeile VOR dem Schreiben — nutzt die bestehenden zentralen Functions
 * (keine Zweitlogik): Pflichtfelder K1 (`validateContactRequired`), Format (`isValidEmail`/
 * `isValidUrl`), Duplikat K2 (`classifyDuplicate`). Rein + testbar; die DB-Kandidaten für den
 * Duplikat-Check liefert der Aufrufer (db.ts/Edge), diese Datei greift nie selbst auf die DB zu.
 */

import { validateContactRequired } from "@/lib/contactValidation";
import { isValidEmail, isValidUrl } from "@/lib/validation";
import { classifyDuplicate, type ExistingContact } from "@/lib/dedup";
import type { ImportReport, MappedRecord, ValidatedRow } from "./types";

/**
 * Eine gemappte Zeile validieren. Reihenfolge: (1) Pflichtfelder/Format → `error` (blockt);
 * (2) sonst Duplikat-Klassifizierung → `duplicate` (User entscheidet später); (3) sonst `valid`.
 */
export function validateRow(
  index: number,
  record: MappedRecord,
  existing: ExistingContact[],
): ValidatedRow {
  const errors: Record<string, string> = {};

  // K1 — Pflichtfeld-Minimum (Vor+Nachname ODER LinkedIn).
  const req = validateContactRequired(record);
  if (!req.ok) Object.assign(errors, req.errors);

  // Format — nur prüfen, wenn ein Wert da ist (leer ist kein Fehler; Felder sind optional).
  if (record.email && !isValidEmail(record.email)) errors.email = "Ungültige E-Mail-Adresse";
  if (record.linkedin_url && !isValidUrl(record.linkedin_url)) errors.linkedin_url = "Ungültige LinkedIn-URL";

  if (Object.keys(errors).length > 0) {
    return { index, record, status: "error", errors };
  }

  // K2 — Duplikat gegen bestehende Kontakte (org-gescopt vom Aufrufer geladen).
  const hit = classifyDuplicate(
    {
      email: record.email ?? null,
      linkedin_url: record.linkedin_url ?? null,
      first_name: record.first_name ?? null,
      last_name: record.last_name ?? null,
      company_name: record.company_name ?? null,
    },
    existing,
  );
  if (hit) {
    return {
      index,
      record,
      status: "duplicate",
      duplicate: { level: hit.level, matchType: hit.matchType, matchedId: hit.matchedId },
    };
  }

  return { index, record, status: "valid" };
}

/**
 * Ganze Datei validieren. Erkennt zusätzlich INTRA-Datei-Duplikate (dieselbe E-Mail/LinkedIn
 * mehrfach in der Datei) — die zweite Vorkommnis wird `duplicate`, damit der Import nicht
 * zwei identische Kontakte anlegt (ehrlich, K8).
 */
export function validateImport(
  records: MappedRecord[],
  existing: ExistingContact[],
): ValidatedRow[] {
  const seen: ExistingContact[] = [...existing];
  return records.map((record, index) => {
    const result = validateRow(index, record, seen);
    // gültige Zeile in die „seen"-Menge aufnehmen → nächste identische Zeile = Duplikat.
    if (result.status === "valid") {
      seen.push({
        id: `__row_${index}`,
        email: record.email ?? null,
        linkedin_url: record.linkedin_url ?? null,
        first_name: record.first_name ?? null,
        last_name: record.last_name ?? null,
        company_name: record.company_name ?? null,
      });
    }
    return result;
  });
}

/** Echte Zahlen für den Import-Report (K8) — keine Rundungen. */
export function summarize(rows: ValidatedRow[]): ImportReport {
  const report: ImportReport = { total: rows.length, valid: 0, error: 0, duplicate: 0 };
  for (const r of rows) report[r.status]++;
  return report;
}
