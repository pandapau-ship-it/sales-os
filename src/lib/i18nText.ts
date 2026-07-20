/**
 * i18nText — Lese-/Schreib-Helfer für mehrsprach-FÄHIGE Textfelder ("Mein Unternehmen").
 *
 * Entscheidung 5 (20.07.2026): Texte, die später je Sprache abweichen könnten (Produkt-Nutzen,
 * Zielgruppe, USPs, Wettbewerber-Begründung …), liegen als `jsonb` in der DB — NICHT als
 * `text`-Spalte. Ein jsonb-Wert darf ein reiner String sein, deshalb kostet das heute nichts:
 *
 *   heute:  "Hilft Sales-Teams …"
 *   später: { "de": "Hilft Sales-Teams …", "en": "Helps sales teams …" }
 *
 * Beide Formen versteht `textOf()`. So wird aus einsprachig → mehrsprachig eine reine
 * Datenänderung, ohne Migration und ohne dass Seiten angefasst werden müssen.
 * KEIN UI in diesem Slice: die Seiten schreiben schlicht Strings.
 */

/** Ein mehrsprach-fähiger Textwert: heute String, später Sprach-Map. */
export type I18nText = string | Record<string, string> | null | undefined;

/**
 * Liest den anzuzeigenden Text. String → unverändert. Sprach-Map → bevorzugte Sprache,
 * sonst der erste vorhandene Eintrag (lieber ein Text in anderer Sprache als gar keiner).
 */
export function textOf(value: I18nText, lang = "de"): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "";
  const exact = value[lang];
  if (typeof exact === "string" && exact.length > 0) return exact;
  const first = Object.values(value).find((v) => typeof v === "string" && v.length > 0);
  return first ?? "";
}

/** Ist das Feld inhaltlich leer? (Grundlage der Vollständigkeits-Anzeige.) */
export function isEmptyText(value: I18nText): boolean {
  return textOf(value).trim().length === 0;
}
