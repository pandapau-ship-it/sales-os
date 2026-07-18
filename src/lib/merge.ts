/**
 * merge.ts — K-6a: reine (DB-freie) Bausteine für den Duplikat-Merge von Kontakten & Companies.
 *
 * Semantik (Entscheidung 18.07.2026, kanonisch — löst den §13 ↔ CLAUDE-#4-Widerspruch auf):
 *   „Auto-Default + Pro-Feld-Override" — der befülltere Datensatz gewinnt automatisch (Bestand),
 *   fehlende Felder werden aus dem Verlierer aufgefüllt (nie überschrieben), UND der User kann pro
 *   Feld übersteuern. `resolveMergeFields` bildet genau das ab: overrides > Gewinner-Wert > Verlierer-Wert.
 *
 * Die eigentlichen DB-Writes (FK-Kaskade, Soft-Delete des Verlierers) macht db.ts `mergeContacts`/
 * `mergeCompanies` — diese Datei liefert nur die reinen, in vitest testbaren Regeln + die FK-Tabellenliste.
 */

import { classifyDuplicate, classifyCompanyDuplicate, normalizeCompanyName, type ContactCandidate, type ExistingContact } from "@/lib/dedup";

/** Beim Contact-Merge zu übernehmende Stammfelder (Telefon = eigene Tabelle, nicht hier). */
export const MERGEABLE_CONTACT_FIELDS = [
  "first_name", "last_name", "email", "linkedin_url", "salutation", "language",
  "job_title", "seniority", "department", "twitter_handle", "city", "country",
  "notes", "icp_score", "company_id", "primary_company_id",
] as const;

/** Beim Company-Merge zu übernehmende Stammfelder. */
export const MERGEABLE_COMPANY_FIELDS = [
  "name", "domain", "website", "linkedin_url", "industry", "size_range", "city", "country",
  "annual_revenue", "notes",
] as const;

/**
 * FK-Tabellen, deren `contact_id` beim Contact-Merge auf den Gewinner umgehängt wird.
 * `simple` = geradliniges UPDATE. list_members/contact_phones brauchen Sonderbehandlung (Konflikte)
 * — deshalb hier NICHT als simple, sondern in db.ts explizit (UNIQUE(list_id,contact_id) bzw. is_primary).
 */
export const CONTACT_FK_SIMPLE = ["communications", "deals", "leads", "messages", "notes", "signals", "tasks"] as const;
export const CONTACT_FK_SPECIAL = ["list_members", "contact_phones"] as const;

/** FK-Spalten, die beim Company-Merge auf den Gewinner zeigen. */
export const COMPANY_FK = [
  { table: "contacts", column: "company_id" },
  { table: "contacts", column: "primary_company_id" },
  { table: "deals", column: "company_id" },
  { table: "notes", column: "company_id" },
  { table: "signals", column: "company_id" },
] as const;

type Rec = Record<string, unknown>;
const filled = (v: unknown): boolean => v != null && v !== "" && !(Array.isArray(v) && v.length === 0);

/** Anzahl befüllter Felder eines Datensatzes (für die „wer ist der befülltere = Primär"-Vorauswahl). */
export function countFilled(record: Rec, fields: readonly string[]): number {
  return fields.reduce((n, f) => (filled(record[f]) ? n + 1 : n), 0);
}

/**
 * Vorauswahl des Gewinners (Primär): der befülltere Datensatz. Gleichstand → der ÄLTERE
 * (created_at), da bewusster gepflegt. Gibt die id des vorgeschlagenen Gewinners zurück.
 */
export function pickPrimaryId(a: Rec, b: Rec, fields: readonly string[]): string {
  const fa = countFilled(a, fields);
  const fb = countFilled(b, fields);
  if (fa !== fb) return (fa > fb ? a.id : b.id) as string;
  const ca = String(a.created_at ?? ""), cb = String(b.created_at ?? "");
  return ((ca && cb ? (ca <= cb ? a.id : b.id) : a.id)) as string;
}

/**
 * Feld-Auflösung: für jedes Merge-Feld gilt override > Gewinner-Wert > Verlierer-Wert
 * (Auto-Default „Bestand gewinnt, Lücken füllen" + Pro-Feld-Override). Liefert NUR die Felder,
 * deren Ergebnis vom aktuellen Gewinner-Wert abweicht (minimaler Update-Patch).
 */
export function resolveMergeFields(
  winner: Rec, loser: Rec, fields: readonly string[], overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const f of fields) {
    const resolved = f in overrides ? overrides[f] : (filled(winner[f]) ? winner[f] : loser[f]);
    if (resolved !== winner[f] && (filled(resolved) || filled(winner[f]))) patch[f] = resolved ?? null;
  }
  return patch;
}

/**
 * Feld-Vergleich zweier Datensätze für den Merge-Dialog (K-6b): welche Felder weichen ab, welche
 * sind identisch. Vergleich case-insensitiv/getrimmt (leer == leer). Rein + testbar.
 */
export function diffFields(a: Rec, b: Rec, fields: readonly string[]): { differing: string[]; identical: string[] } {
  const norm = (v: unknown) => (v == null ? "" : String(v).trim().toLowerCase());
  const differing: string[] = [];
  const identical: string[] = [];
  for (const f of fields) {
    if (norm(a[f]) === norm(b[f])) { if (filled(a[f])) identical.push(f); }
    else differing.push(f);
  }
  return { differing, identical };
}

/** Ein gefundenes Duplikat-Paar für den „Duplikate verwalten"-Screen. */
export interface DuplicatePair<T extends string = string> {
  aId: string;
  bId: string;
  level: "sicher" | "moeglich";
  matchType: T;
}

/**
 * Kontakt-Duplikat-PAARE finden — SICHER (E-Mail/LinkedIn exakt, O(n)-Buckets) UND MÖGLICH
 * (Name+Firma unscharf). Die möglich-Suche wird über den normalisierten FIRMENNAMEN gebucketet
 * (Kontakte derselben Firma) → nur innerhalb kleiner Buckets pairwise, kein globales O(n²).
 * `classifyDuplicate` (K2) ist die alleinige Wahrheit pro Paar (keine Zweitlogik). Ein Paar, das
 * schon „sicher" ist, wird NICHT zusätzlich als „möglich" gemeldet (seen-Set über beide Stufen).
 */
export function findDuplicatePairs(contacts: ExistingContact[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  const seen = new Set<string>();
  const emit = (a: ExistingContact, b: ExistingContact, onlyLevel?: "sicher" | "moeglich") => {
    if (a.id === b.id) return;
    const key = [a.id, b.id].sort().join("|");
    if (seen.has(key)) return;
    const hit = classifyDuplicate(a as ContactCandidate, [b]);
    if (hit && (!onlyLevel || hit.level === onlyLevel)) { seen.add(key); pairs.push({ aId: a.id, bId: b.id, level: hit.level, matchType: hit.matchType }); }
  };
  const bucketize = (pick: (c: ExistingContact) => string | null | undefined) => {
    const m = new Map<string, ExistingContact[]>();
    for (const c of contacts) { const k = (pick(c) ?? "").trim().toLowerCase(); if (k) (m.get(k) ?? m.set(k, []).get(k)!).push(c); }
    return m;
  };
  const scan = (m: Map<string, ExistingContact[]>, onlyLevel?: "sicher" | "moeglich") => {
    for (const bucket of m.values()) for (let i = 0; i < bucket.length; i++) for (let j = i + 1; j < bucket.length; j++) emit(bucket[i], bucket[j], onlyLevel);
  };
  // 1) sicher — exakte E-Mail bzw. LinkedIn.
  scan(bucketize((c) => c.email), "sicher");
  scan(bucketize((c) => c.linkedin_url), "sicher");
  // 2) möglich — Name+Firma unscharf, gebucketet über den normalisierten Firmennamen.
  scan(bucketize((c) => normalizeCompanyName(c.company_name)), "moeglich");
  return pairs;
}

/**
 * Company-Duplikat-PAARE — SICHER (Domain exakt) UND MÖGLICH (Name unscharf). Domain-Buckets für
 * sicher; die Name-Fuzzy-Suche ist pairwise über alle Companies (typisch << Kontakte). Ein Domain-
 * Paar wird nicht zusätzlich als möglich gemeldet.
 */
export function findCompanyDuplicatePairs(companies: { id: string; name?: string | null; domain?: string | null }[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  const seen = new Set<string>();
  const emit = (a: typeof companies[number], b: typeof companies[number], onlyLevel?: "sicher" | "moeglich") => {
    if (a.id === b.id) return;
    const key = [a.id, b.id].sort().join("|");
    if (seen.has(key)) return;
    const hit = classifyCompanyDuplicate({ domain: a.domain, name: a.name }, [{ id: b.id, domain: b.domain, name: b.name }]);
    if (hit && (!onlyLevel || hit.level === onlyLevel)) { seen.add(key); pairs.push({ aId: a.id, bId: b.id, level: hit.level, matchType: hit.matchType }); }
  };
  // 1) sicher — Domain-Buckets.
  const byDomain = new Map<string, typeof companies>();
  for (const c of companies) { const k = (c.domain ?? "").trim().toLowerCase(); if (k) (byDomain.get(k) ?? byDomain.set(k, []).get(k)!).push(c); }
  for (const bucket of byDomain.values()) for (let i = 0; i < bucket.length; i++) for (let j = i + 1; j < bucket.length; j++) emit(bucket[i], bucket[j], "sicher");
  // 2) möglich — Name unscharf (pairwise; Companies sind typischerweise wenige).
  for (let i = 0; i < companies.length; i++) for (let j = i + 1; j < companies.length; j++) emit(companies[i], companies[j], "moeglich");
  return pairs;
}
