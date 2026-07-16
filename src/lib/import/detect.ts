/**
 * import/detect.ts — Schicht 1 (Datei-Toleranz), DEP-FREIER Teil: Encoding- + Trennzeichen-
 * Erkennung. Rein + testbar. Das eigentliche Parsen (CSV via papaparse, Excel via xlsx/SheetJS)
 * folgt in parse.ts NACH Dep-Freigabe (xlsx > 50 kb → CLAUDE-Absprache-Regel).
 *
 * Warum eigenständig: „deutsches Excel = Semikolon", kaputte Umlaute durch falsches Encoding
 * (BOM), Tab-getrennte Exporte — diese Heuristiken entscheiden, wie überhaupt geparst wird.
 */

export type Encoding = "utf-8" | "utf-16le" | "utf-16be" | "iso-8859-1";
export type Delimiter = "," | ";" | "\t";

/**
 * Encoding aus den ersten Bytes (BOM) erkennen. Kein BOM → utf-8 annehmen (häufigster Fall);
 * die Latin-1-Heuristik für BOM-lose ISO-Dateien lebt bewusst im echten Parser (Byte-Analyse
 * der gesamten Datei), nicht hier.
 */
export function detectEncoding(bytes: Uint8Array): Encoding {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return "utf-8";
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return "utf-16le";
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return "utf-16be";
  return "utf-8";
}

/** Ein führendes UTF-8-BOM vom Text entfernen (sonst steckt es im ersten Header). */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Trennzeichen aus der ersten (nicht-leeren) Zeile erkennen: das Zeichen mit den meisten
 * Vorkommen außerhalb von Anführungszeichen gewinnt. Gleichstand/keins → Komma (Standard).
 * Zählt quote-bewusst, damit ein „a;b" in einem Feld die Erkennung nicht verfälscht.
 */
export function detectDelimiter(sample: string): Delimiter {
  const firstLine = stripBom(sample).split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const counts: Record<Delimiter, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (const ch of firstLine) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (inQuotes) continue;
    if (ch === "," || ch === ";" || ch === "\t") counts[ch]++;
  }
  const best = (Object.keys(counts) as Delimiter[]).reduce((a, b) => (counts[b] > counts[a] ? b : a), ",");
  return counts[best] > 0 ? best : ",";
}
