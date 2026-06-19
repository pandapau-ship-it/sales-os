/**
 * validation.ts — zentrale Eingabe-Validierung (eine Quelle, wiederverwendbar).
 * Telefon ist ab PH3 verdrahtet; E-Mail/URL sind vorbereitet und werden mit P8
 * (echter Kontakt-Write) an die Inline-Edit-Felder gehängt.
 */

/** Telefon: nur + Ziffern Leerzeichen - ( ) und ≥ 5 Zeichen. */
export const PHONE_RE = /^[+\d\s\-().]+$/;
export function isValidPhone(value: string): boolean {
  const t = value.trim();
  return t.length >= 5 && PHONE_RE.test(t);
}

/** E-Mail (vorbereitet für P8). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** URL normalisieren: https:// voranstellen, wenn kein Schema vorhanden (vorbereitet für P8). */
export function normalizeUrl(value: string): string {
  const t = value.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** URL gültig nach Normalisierung (vorbereitet für P8). */
export function isValidUrl(value: string): boolean {
  return /^https?:\/\/.+\..+/.test(normalizeUrl(value));
}
