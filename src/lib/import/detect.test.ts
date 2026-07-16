import { describe, it, expect } from "vitest";
import { detectEncoding, stripBom, detectDelimiter } from "./detect";

describe("detectEncoding (BOM)", () => {
  it("UTF-8 BOM", () => {
    expect(detectEncoding(new Uint8Array([0xef, 0xbb, 0xbf, 0x41]))).toBe("utf-8");
  });
  it("UTF-16LE / BE BOM", () => {
    expect(detectEncoding(new Uint8Array([0xff, 0xfe]))).toBe("utf-16le");
    expect(detectEncoding(new Uint8Array([0xfe, 0xff]))).toBe("utf-16be");
  });
  it("kein BOM → utf-8", () => {
    expect(detectEncoding(new Uint8Array([0x41, 0x42]))).toBe("utf-8");
  });
});

describe("stripBom", () => {
  it("entfernt führendes UTF-8-BOM", () => {
    expect(stripBom("﻿Vorname")).toBe("Vorname");
    expect(stripBom("Vorname")).toBe("Vorname");
  });
});

describe("detectDelimiter", () => {
  it("deutsches Excel = Semikolon", () => {
    expect(detectDelimiter("Vorname;Nachname;E-Mail\nMax;Muster;max@x.io")).toBe(";");
  });
  it("Komma", () => {
    expect(detectDelimiter("first,last,email")).toBe(",");
  });
  it("Tab", () => {
    expect(detectDelimiter("first\tlast\temail")).toBe("\t");
  });
  it("Trennzeichen in Quotes zählt nicht", () => {
    // Nur EIN echtes Semikolon außerhalb Quotes; die Kommas stecken im gequoteten Feld.
    expect(detectDelimiter('"Muster, Max";"a,b,c"')).toBe(";");
  });
  it("keins erkennbar → Komma (Default)", () => {
    expect(detectDelimiter("nureinespalte")).toBe(",");
  });
  it("überspringt führende Leerzeilen", () => {
    expect(detectDelimiter("\n\na;b;c")).toBe(";");
  });
});
