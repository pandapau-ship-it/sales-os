/**
 * import/mapping.ts — Schicht 2 (Wörterbuch-Mapping) der Smart-Import-Engine (K-5).
 *
 * Deterministisch, ohne AI: bekannte Header-Synonyme (de/en) → Ziel-Feld. Unbekannte Header
 * bleiben `null` (später optional ein AI-Call `import_mapping_v1`, C27 — hier NICHT enthalten).
 * Rein + testbar. Die Vorlagen-Erkennung (`headerSignature`) speist `import_templates`
 * (K-1b): gleiche Signatur → gespeichertes Mapping wiederverwenden.
 */

import type { ColumnMapping, ImportField, MappedRecord, MappingPlan, ParsedFile } from "./types";

/** Header normalisieren: lowercase, Diakritika/Umlaute vereinheitlicht, nur alphanumerisch. */
export function normalizeHeader(h: string): string {
  return (h ?? "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

// Synonym-Wörterbuch: normalisierter Header → Ziel-Feld. Quelle: crm_felder-Doku.
// Erweiterbar (eine Quelle) — neue Schreibweise hier ergänzen, nie am Resolver vorbei.
const SYNONYMS: Record<string, ImportField> = {};
const register = (field: ImportField, variants: string[]) => {
  for (const v of variants) SYNONYMS[normalizeHeader(v)] = field;
};

register("first_name", ["first name", "firstname", "vorname", "given name", "vname"]);
register("last_name", ["last name", "lastname", "nachname", "surname", "family name", "nname"]);
register("email", ["email", "e-mail", "mail", "email address", "e-mail-adresse", "emailadresse", "mailadresse"]);
register("linkedin_url", ["linkedin", "linkedin url", "linkedin-url", "linkedin profil", "linkedin profile", "li url"]);
register("phone", ["phone", "telefon", "tel", "telephone", "phone number", "telefonnummer", "mobil", "mobile", "handy"]);
register("job_title", ["job title", "jobtitle", "jobtitel", "title", "titel", "position", "rolle", "role"]);
register("seniority", ["seniority", "senioritaet", "level", "ebene"]);
register("company_name", ["company", "company name", "firma", "unternehmen", "firmenname", "organization", "organisation", "account"]);
register("city", ["city", "stadt", "ort", "standort", "location"]);
register("country", ["country", "land", "staat"]);
register("tags", ["tags", "tag", "labels", "schlagworte", "schlagwoerter"]);
register("notes", ["notes", "note", "notiz", "notizen", "bemerkung", "bemerkungen", "kommentar"]);

/** Einen einzelnen Header auf ein Feld auflösen (oder null, wenn unbekannt). */
export function resolveHeader(header: string): ImportField | null {
  return SYNONYMS[normalizeHeader(header)] ?? null;
}

/**
 * Mapping-Plan für eine Datei bauen. Bei Kollision (zwei Header → dasselbe Feld) gewinnt der
 * ERSTE; die weiteren bleiben unmapped (nie still zwei Spalten auf ein Feld — der User
 * korrigiert im Mapping-Schritt).
 */
export function buildMappingPlan(headers: string[]): MappingPlan {
  const used = new Set<ImportField>();
  const columns: ColumnMapping[] = headers.map((header) => {
    const field = resolveHeader(header);
    if (field && !used.has(field)) {
      used.add(field);
      return { header, field, source: "dictionary" };
    }
    return { header, field: null, source: "none" };
  });
  const unmapped = columns.filter((c) => c.field === null).map((c) => c.header);
  return { columns, unmapped };
}

/**
 * Header-Signatur zur Vorlagen-Erkennung (import_templates.source_signature): normalisierte,
 * SORTIERTE Header — spalten-reihenfolge-unabhängig, damit „derselbe Export-Typ" wiedererkannt wird.
 */
export function headerSignature(headers: string[]): string {
  return headers.map(normalizeHeader).filter(Boolean).sort().join("|");
}

/** Zeilen anhand des Mapping-Plans auf Ziel-Felder abbilden (nur gemappte Spalten). */
export function applyMapping(file: ParsedFile, plan: MappingPlan): MappedRecord[] {
  const active = plan.columns.filter((c): c is ColumnMapping & { field: ImportField } => c.field !== null);
  return file.rows.map((row) => {
    const rec: MappedRecord = {};
    for (const col of active) {
      const val = (row[col.header] ?? "").trim();
      if (val) rec[col.field] = val;
    }
    return rec;
  });
}
