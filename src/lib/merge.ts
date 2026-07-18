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

import { classifyDuplicate, classifyCompanyDuplicate, type ContactCandidate, type ExistingContact } from "@/lib/dedup";

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

/** Ein gefundenes Duplikat-Paar für den „Duplikate verwalten"-Screen. */
export interface DuplicatePair<T extends string = string> {
  aId: string;
  bId: string;
  level: "sicher" | "moeglich";
  matchType: T;
}

/**
 * Sichere Kontakt-Duplikat-PAARE finden (exakte E-Mail bzw. LinkedIn) — O(n) über Buckets, kein O(n²).
 * Die unscharfe Name+Company-Paarung (O(n²)) ist ein bewusster Folge-Punkt (siehe PROGRESS K-6).
 * Nutzt `classifyDuplicate` als Wahrheit pro Kandidatenpaar (keine Zweitlogik).
 */
export function findDuplicatePairs(contacts: ExistingContact[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  const seen = new Set<string>();
  const emit = (a: ExistingContact, b: ExistingContact) => {
    const key = [a.id, b.id].sort().join("|");
    if (seen.has(key)) return;
    const hit = classifyDuplicate(a as ContactCandidate, [b]);
    if (hit && hit.level === "sicher") { seen.add(key); pairs.push({ aId: a.id, bId: b.id, level: hit.level, matchType: hit.matchType }); }
  };
  const byKey = (pick: (c: ExistingContact) => string | null | undefined) => {
    const m = new Map<string, ExistingContact[]>();
    for (const c of contacts) { const k = (pick(c) ?? "").trim().toLowerCase(); if (k) (m.get(k) ?? m.set(k, []).get(k)!).push(c); }
    for (const bucket of m.values()) for (let i = 0; i < bucket.length; i++) for (let j = i + 1; j < bucket.length; j++) emit(bucket[i], bucket[j]);
  };
  byKey((c) => c.email);
  byKey((c) => c.linkedin_url);
  return pairs;
}

/** Company-Duplikat-Paare (exakte Domain) — Name-Fuzzy = Folge-Punkt. */
export function findCompanyDuplicatePairs(companies: { id: string; name?: string | null; domain?: string | null }[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  const m = new Map<string, typeof companies>();
  for (const c of companies) { const k = (c.domain ?? "").trim().toLowerCase(); if (k) (m.get(k) ?? m.set(k, []).get(k)!).push(c); }
  for (const bucket of m.values()) for (let i = 0; i < bucket.length; i++) for (let j = i + 1; j < bucket.length; j++) {
    const hit = classifyCompanyDuplicate({ domain: bucket[i].domain, name: bucket[i].name }, [{ id: bucket[j].id, domain: bucket[j].domain, name: bucket[j].name }]);
    if (hit && hit.level === "sicher") pairs.push({ aId: bucket[i].id, bId: bucket[j].id, level: hit.level, matchType: hit.matchType });
  }
  return pairs;
}
