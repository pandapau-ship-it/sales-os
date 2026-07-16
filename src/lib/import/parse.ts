/**
 * import/parse.ts — Schicht 1 (Datei-Toleranz): CSV + Excel → `ParsedFile`.
 *
 * „Frisst alles": Encoding-Erkennung (BOM + UTF-8-Fallback auf Windows-1252 für ISO-Umlaute
 * ohne BOM), Trennzeichen (Komma/Semikolon/Tab — deutsches Excel = Semikolon), Quotes/
 * Zeilenumbrüche in Zellen (papaparse), leere Zeilen/Spalten übersprungen. Excel via xlsx
 * (erstes Sheet, Hinweis bei mehreren).
 *
 * Deps papaparse + xlsx sind bewusste, dokumentierte >50-kb-Ausnahmen (CLAUDE.md → Tech Stack).
 * Selbst-Parsen ist ein Sonderfall-Sumpf (Encodings/Quotes/Datumsformate) — hier NICHT nachgebaut.
 *
 * Rein testbar: nimmt Bytes, nicht das Browser-`File`-Objekt (der Aufrufer liest die Datei).
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { detectDelimiter, stripBom } from "./detect";
import type { ParsedFile } from "./types";

/** Grenzen — Defaults spiegeln system_config (20 MB / 50.000 Zeilen). Aufrufer reicht die Org-Werte durch. */
export interface ParseLimits {
  maxBytes?: number;
  maxRows?: number;
}
const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;
const DEFAULT_MAX_ROWS = 50_000;

export class ImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportParseError";
  }
}

/** Bytes → Text: UTF-8 bevorzugt; schlägt es fehl (ISO-Umlaute ohne BOM), Fallback Windows-1252. */
function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // „kaputte Umlaute": deutsche Exporte sind oft Windows-1252/ISO-8859-1 ohne BOM.
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

function isExcel(fileName: string): boolean {
  return /\.xlsx?$/i.test(fileName.trim());
}

/** Leere Zeilen (alle Zellen leer) raus + auf leere Header-Spalten trimmen. */
function cleanRows(headers: string[], rows: Record<string, string>[]): Record<string, string>[] {
  const realHeaders = headers.filter((h) => h.trim() !== "");
  return rows
    .map((r) => {
      const out: Record<string, string> = {};
      for (const h of realHeaders) out[h] = String(r[h] ?? "").trim();
      return out;
    })
    .filter((r) => Object.values(r).some((v) => v !== ""));
}

/**
 * Datei parsen. Erkennt CSV vs. Excel an der Endung; liefert `ParsedFile` (headers + rows).
 * Wirft `ImportParseError` bei Größen-/Zeilen-Überschreitung oder leerer Datei (ehrliche Meldung).
 */
export function parseImportFile(fileName: string, bytes: Uint8Array, limits: ParseLimits = {}): ParsedFile {
  const maxBytes = limits.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRows = limits.maxRows ?? DEFAULT_MAX_ROWS;

  if (bytes.byteLength > maxBytes) {
    throw new ImportParseError(`Datei zu groß (${Math.round(bytes.byteLength / 1024 / 1024)} MB, max ${Math.round(maxBytes / 1024 / 1024)} MB).`);
  }

  const notices: string[] = [];
  let headers: string[];
  let rawRows: Record<string, string>[];

  if (isExcel(fileName)) {
    const wb = XLSX.read(bytes, { type: "array" });
    if (wb.SheetNames.length === 0) throw new ImportParseError("Excel-Datei ohne Tabellenblatt.");
    if (wb.SheetNames.length > 1) notices.push(`Mehrere Tabellenblätter — „${wb.SheetNames[0]}" verwendet.`);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
    rawRows = json.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")])));
    headers = rawRows.length ? Object.keys(rawRows[0]) : [];
  } else {
    const text = stripBom(decodeText(bytes));
    const delimiter = detectDelimiter(text);
    const res = Papa.parse<Record<string, string>>(text, {
      header: true,
      delimiter,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
    });
    headers = (res.meta.fields ?? []).filter((h) => h.trim() !== "");
    rawRows = res.data;
  }

  const rows = cleanRows(headers, rawRows);
  if (headers.length === 0 || rows.length === 0) {
    throw new ImportParseError("Keine Datenzeilen gefunden.");
  }
  if (rows.length > maxRows) {
    throw new ImportParseError(`Zu viele Zeilen (${rows.length}, max ${maxRows}).`);
  }

  return { headers, rows, notices: notices.length ? notices : undefined };
}
