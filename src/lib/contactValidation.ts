/**
 * contactValidation.ts — K1: EINE zentrale Pflichtfeld-Validierung für Kontakte & Companies.
 *
 * Bauplan-Regel (K1, Falle #1): dieselbe Function gilt ÜBERALL identisch — manuelles Anlegen,
 * Import, Sherloq-Webhook, spätere API/Chat. Keine Kopien, keine abweichende Zweitlogik.
 *
 * Bewusst rein (keine DB, keine Netzwerkaufrufe) → in vitest voll testbar und sowohl im
 * Frontend als auch später in Edge Functions nutzbar (Spiegel-Muster wie terminalStages).
 * Duplikat-Erkennung ist NICHT hier, sondern in dedup.ts (K2) — getrennte Verantwortung.
 */

export type ContactInput = {
  first_name?: string | null;
  last_name?: string | null;
  linkedin_url?: string | null;
};

export type CompanyInput = {
  name?: string | null;
};

export type ValidationResult = {
  ok: boolean;
  /** Feld → Fehlergrund. Leer wenn ok. Feldnamen matchen die Formular-/DB-Felder. */
  errors: Record<string, string>;
};

const has = (v: string | null | undefined): boolean => (v ?? "").trim().length > 0;

/**
 * K1 Kontakt: (Vorname UND Nachname) ODER LinkedIn-URL — eines von beiden reicht.
 * Email ist bewusst KEIN Pflichtfeld (wird via Enrichment nachgefüllt).
 */
export function validateContactRequired(input: ContactInput): ValidationResult {
  const hasName = has(input.first_name) && has(input.last_name);
  const hasLinkedin = has(input.linkedin_url);

  if (hasName || hasLinkedin) return { ok: true, errors: {} };

  // Kein Identitäts-Minimum erfüllt → beide Wege als fehlend markieren, damit die UI
  // an Vor-/Nachname UND LinkedIn den amber-Hinweis zeigen kann (§13-Pflichtfeld-Verhalten).
  return {
    ok: false,
    errors: {
      first_name: "Vor- und Nachname ODER LinkedIn-URL angeben",
      last_name: "Vor- und Nachname ODER LinkedIn-URL angeben",
      linkedin_url: "Vor- und Nachname ODER LinkedIn-URL angeben",
    },
  };
}

/** K1 Company: nur Name ist Pflicht. */
export function validateCompanyRequired(input: CompanyInput): ValidationResult {
  if (has(input.name)) return { ok: true, errors: {} };
  return { ok: false, errors: { name: "Firmenname ist Pflicht" } };
}
