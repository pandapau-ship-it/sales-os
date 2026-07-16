/**
 * dedup.ts — K2: EINE zentrale Duplikat-Erkennung (Normalisierung + Match-Kaskade).
 *
 * Bauplan-Regel (K2, Falle #1): `find_duplicates(candidate)` ist die einzige Quelle —
 * genutzt von manuellem Anlegen (§13-Banner), Import (Review-Spalte), Sherloq-Intake,
 * API/Chat. NIEMALS zwei Implementierungen.
 *
 * Aufteilung nach dem Projekt-Muster (pure Lib + dünne DB-Schicht, vgl. hunterMappers):
 *  - HIER (rein, in vitest voll testbar): Normalisierung + `classifyDuplicate(candidate,
 *    existing[])` = die Match-Kaskade und Ähnlichkeitslogik.
 *  - db.ts / Edge (`findDuplicates`): lädt die Vergleichs-Kandidaten (org-gescoped) und
 *    ruft `classifyDuplicate`. Kein DB-Zugriff in dieser Datei.
 *
 * Match-Kaskade (stärkstes Signal gewinnt):
 *  1. E-Mail exakt (normalisiert)            → 'sicher'
 *  2. LinkedIn-URL exakt (normalisiert)      → 'sicher'
 *  3. Name + Company unscharf (normalisiert) → 'moeglich'
 * Companies analog: Domain exakt → 'sicher', Name unscharf → 'moeglich'.
 */

export type DuplicateLevel = "sicher" | "moeglich";
export type ContactMatchType = "email" | "linkedin" | "name_company";
export type CompanyMatchType = "domain" | "name";

export type DuplicateHit<T extends string> = {
  level: DuplicateLevel;
  matchType: T;
  matchedId: string;
  /** 0–1; bei exakten Treffern 1. Für „möglich" die Ähnlichkeit. */
  score: number;
};

// Ab dieser kombinierten Ähnlichkeit (Name × Company) gilt ein Kontakt als „möglich".
// Bewusst hoch: „möglich" legt dem User etwas vor — lieber einmal fragen als zwei getrennte
// Datensätze fälschlich als Duplikat markieren. (Nicht verhaltenssteuernd i.S. [D51] — reine
// Erkennungsheuristik; falls doch org-tunebar gewünscht, später nach settings.)
export const NAME_COMPANY_MATCH_MIN = 0.82;
export const COMPANY_NAME_MATCH_MIN = 0.85;

// ── Normalisierung ───────────────────────────────────────────────────────────

/** E-Mail: lowercase + trim. Leer → "". */
export function normalizeEmail(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

/**
 * LinkedIn-URL: Schema/host vereinheitlichen, Tracking-Query + Trailing-Slash entfernen,
 * lowercase. `linkedin.com/in/max-muster/?utm=x` und `https://www.linkedin.com/in/Max-Muster`
 * kollabieren so auf denselben Schlüssel.
 */
export function normalizeLinkedin(v: string | null | undefined): string {
  let s = (v ?? "").trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.split(/[?#]/)[0]; // Query + Fragment (Tracking) abschneiden
  s = s.replace(/\/+$/, ""); // Trailing-Slashes
  return s;
}

/** Domain: host aus einer URL/Domain ziehen, www + Schema + Pfad weg, lowercase. */
export function normalizeDomain(v: string | null | undefined): string {
  let s = (v ?? "").trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.split(/[/?#]/)[0];
  return s;
}

// Rechtsform-TOKENS (nach Punkt-Entfernung, ein Wort): iterativ vom Ende abgezogen, damit
// zusammengesetzte Formen wie „GmbH & Co. KG" (→ Tokens gmbh · co · kg) vollständig fallen.
const LEGAL_TOKENS = new Set([
  "gmbh", "ag", "ug", "ek", "inc", "llc", "ltd", "corp", "co",
  "sa", "bv", "srl", "pty", "plc", "kg", "ohg", "co.kg",
]);

/**
 * Company-Name: lowercase, Punkte gelöscht (inc./co. → inc/co, e.k. → ek), übrige Satzzeichen
 * zu Space, dann alle abschließenden Rechtsform-Tokens entfernt. „Acme GmbH", „Acme, Inc." und
 * „Acme GmbH & Co. KG" → alle „acme". Ein Name, der NUR Rechtsform ist, bleibt erhalten.
 */
export function normalizeCompanyName(v: string | null | undefined): string {
  let s = (v ?? "").trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/\./g, "").replace(/[,&\-/]/g, " ").replace(/\s+/g, " ").trim();
  const tokens = s.split(" ");
  // Trailing-Rechtsform-Tokens abziehen, aber nie das letzte verbleibende Token (Name ≠ leer).
  while (tokens.length > 1 && LEGAL_TOKENS.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens.join(" ");
}

const NAME_TITLES = ["dr.", "dr", "prof.", "prof", "dipl.", "dipl", "mag.", "mag"];

/** Personen-Name: lowercase, Titel (Dr./Prof.) weg, Umlaute normalisiert, Space kollabiert. */
export function normalizeName(v: string | null | undefined): string {
  let s = (v ?? "").trim().toLowerCase();
  if (!s) return "";
  s = s
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  const parts = s.split(/\s+/).filter((p) => !NAME_TITLES.includes(p));
  return parts.join(" ").trim();
}

// ── Ähnlichkeit (Sørensen–Dice auf Zeichen-Bigrammen) ────────────────────────
// Deterministisch, ohne Abhängigkeit, gut für kurze Namen/Firmen. 1 = identisch.
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s: string): Map<string, number> => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const ma = bigrams(a);
  const mb = bigrams(b);
  let overlap = 0;
  let total = 0;
  for (const n of ma.values()) total += n;
  for (const n of mb.values()) total += n;
  for (const [g, na] of ma) {
    const nb = mb.get(g);
    if (nb) overlap += Math.min(na, nb);
  }
  return (2 * overlap) / total;
}

// ── Kontakt-Vergleich ────────────────────────────────────────────────────────

export type ContactCandidate = {
  email?: string | null;
  linkedin_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
};

export type ExistingContact = ContactCandidate & { id: string };

/**
 * Stärksten Duplikat-Treffer für einen Kontakt-Kandidaten finden (oder null).
 * `existing` sind bereits org-gescopte Vergleichszeilen (die DB-Schicht lädt sie).
 */
export function classifyDuplicate(
  candidate: ContactCandidate,
  existing: ExistingContact[],
): DuplicateHit<ContactMatchType> | null {
  const email = normalizeEmail(candidate.email);
  const linkedin = normalizeLinkedin(candidate.linkedin_url);
  const candName = normalizeName(`${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`);
  const candCompany = normalizeCompanyName(candidate.company_name);

  let fuzzyBest: DuplicateHit<ContactMatchType> | null = null;

  for (const row of existing) {
    // 1) E-Mail exakt → sicher (stärkstes Signal, sofort zurück)
    if (email && normalizeEmail(row.email) === email) {
      return { level: "sicher", matchType: "email", matchedId: row.id, score: 1 };
    }
    // 2) LinkedIn exakt → sicher
    if (linkedin && normalizeLinkedin(row.linkedin_url) === linkedin) {
      return { level: "sicher", matchType: "linkedin", matchedId: row.id, score: 1 };
    }
    // 3) Name + Company unscharf → möglich (schwächer, erst nach allen sicheren sammeln)
    if (candName && candCompany) {
      const rowName = normalizeName(`${row.first_name ?? ""} ${row.last_name ?? ""}`);
      const rowCompany = normalizeCompanyName(row.company_name);
      if (rowName && rowCompany) {
        const score = Math.min(similarity(candName, rowName), similarity(candCompany, rowCompany));
        if (score >= NAME_COMPANY_MATCH_MIN && (!fuzzyBest || score > fuzzyBest.score)) {
          fuzzyBest = { level: "moeglich", matchType: "name_company", matchedId: row.id, score };
        }
      }
    }
  }

  return fuzzyBest;
}

// ── Company-Vergleich ────────────────────────────────────────────────────────

export type CompanyCandidate = { domain?: string | null; name?: string | null };
export type ExistingCompany = CompanyCandidate & { id: string };

/** Stärksten Duplikat-Treffer für eine Company (Domain exakt → sicher, Name unscharf → möglich). */
export function classifyCompanyDuplicate(
  candidate: CompanyCandidate,
  existing: ExistingCompany[],
): DuplicateHit<CompanyMatchType> | null {
  const domain = normalizeDomain(candidate.domain);
  const name = normalizeCompanyName(candidate.name);

  let fuzzyBest: DuplicateHit<CompanyMatchType> | null = null;

  for (const row of existing) {
    if (domain && normalizeDomain(row.domain) === domain) {
      return { level: "sicher", matchType: "domain", matchedId: row.id, score: 1 };
    }
    if (name) {
      const rowName = normalizeCompanyName(row.name);
      if (rowName) {
        const score = similarity(name, rowName);
        if (score >= COMPANY_NAME_MATCH_MIN && (!fuzzyBest || score > fuzzyBest.score)) {
          fuzzyBest = { level: "moeglich", matchType: "name", matchedId: row.id, score };
        }
      }
    }
  }

  return fuzzyBest;
}
