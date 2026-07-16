import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseImportFile, ImportParseError } from "./parse";

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

describe("parseImportFile — CSV", () => {
  it("Komma-CSV mit Header + Zeilen", () => {
    const f = parseImportFile("k.csv", utf8("first,last,email\nMax,Muster,max@x.io\nEva,Beta,eva@y.io"));
    expect(f.headers).toEqual(["first", "last", "email"]);
    expect(f.rows).toHaveLength(2);
    expect(f.rows[0]).toEqual({ first: "Max", last: "Muster", email: "max@x.io" });
  });

  it("Quotes + Komma/Zeilenumbruch im Feld", () => {
    const f = parseImportFile("k.csv", utf8('name,note\n"Muster, Max","Zeile1\nZeile2"'));
    expect(f.rows[0]).toEqual({ name: "Muster, Max", note: "Zeile1\nZeile2" });
  });

  it("überspringt leere Zeilen", () => {
    const f = parseImportFile("k.csv", utf8("a,b\n1,2\n\n\n3,4"));
    expect(f.rows).toHaveLength(2);
  });

  it("UTF-8-BOM wird nicht Teil des ersten Headers", () => {
    const f = parseImportFile("k.csv", utf8("﻿Vorname,Email\nMax,max@x.io"));
    expect(f.headers[0]).toBe("Vorname");
  });

  // ── Bauplan-Akzeptanz: deutsches Excel-CSV (Semikolon + ISO-8859-1-Umlaute, kein BOM) ──
  it("AKZEPTANZ: Semikolon-Trennung + ISO-8859-1-Umlaute (kein BOM)", () => {
    // Latin-1-Bytes (wie deutsches Excel „CSV" speichert) — UTF-8-Decode scheitert → Windows-1252-Fallback.
    const bytes = new Uint8Array(Buffer.from("Vorname;Nachname;Straße\nMüller;Groß;Hauptstraße 5", "latin1"));
    const f = parseImportFile("de.csv", bytes);
    expect(f.headers).toEqual(["Vorname", "Nachname", "Straße"]);
    expect(f.rows[0]).toEqual({ Vorname: "Müller", Nachname: "Groß", Straße: "Hauptstraße 5" });
  });

  it("Tab-getrennt", () => {
    const f = parseImportFile("k.tsv", utf8("a\tb\tc\n1\t2\t3"));
    expect(f.headers).toEqual(["a", "b", "c"]);
    expect(f.rows[0]).toEqual({ a: "1", b: "2", c: "3" });
  });
});

describe("parseImportFile — Excel (.xlsx)", () => {
  const makeXlsx = (aoa: unknown[][], sheets = 1): Uint8Array => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Kontakte");
    for (let i = 1; i < sheets; i++) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["x"]]), `Sheet${i + 1}`);
    return new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
  };

  it("AKZEPTANZ: .xlsx erstes Sheet, Header + Umlaute", () => {
    const bytes = makeXlsx([["Vorname", "Größe"], ["Jörg", "groß"], ["Anna", "klein"]]);
    const f = parseImportFile("kontakte.xlsx", bytes);
    expect(f.headers).toEqual(["Vorname", "Größe"]);
    expect(f.rows).toHaveLength(2);
    expect(f.rows[0]).toEqual({ Vorname: "Jörg", Größe: "groß" });
  });

  it("mehrere Sheets → Hinweis, erstes verwendet", () => {
    const bytes = makeXlsx([["a"], ["1"]], 2);
    const f = parseImportFile("multi.xlsx", bytes);
    expect(f.notices?.[0]).toMatch(/Mehrere Tabellenblätter/);
  });
});

describe("parseImportFile — Fehlerfälle (ehrlich)", () => {
  it("leere Datei → ImportParseError", () => {
    expect(() => parseImportFile("leer.csv", utf8(""))).toThrow(ImportParseError);
  });
  it("nur Header, keine Datenzeilen → ImportParseError", () => {
    expect(() => parseImportFile("nur.csv", utf8("a,b,c"))).toThrow(/Keine Datenzeilen/);
  });
  it("zu viele Zeilen → ImportParseError (Limit)", () => {
    const many = "a\n" + Array.from({ length: 5 }, (_, i) => i).join("\n");
    expect(() => parseImportFile("big.csv", utf8(many), { maxRows: 3 })).toThrow(/Zu viele Zeilen/);
  });
  it("zu groß → ImportParseError (Byte-Limit)", () => {
    expect(() => parseImportFile("big.csv", utf8("a,b\n1,2"), { maxBytes: 3 })).toThrow(/zu groß/i);
  });
});
