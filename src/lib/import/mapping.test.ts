import { describe, it, expect } from "vitest";
import {
  normalizeHeader,
  resolveHeader,
  buildMappingPlan,
  headerSignature,
  applyMapping,
} from "./mapping";
import type { ParsedFile } from "./types";

describe("normalizeHeader", () => {
  it("lowercase + Umlaute + nur alphanumerisch", () => {
    expect(normalizeHeader("  E-Mail-Adresse ")).toBe("emailadresse");
    expect(normalizeHeader("Größe")).toBe("groesse");
  });
});

describe("resolveHeader — Wörterbuch (de/en)", () => {
  it("deutsche + englische Synonyme", () => {
    expect(resolveHeader("Vorname")).toBe("first_name");
    expect(resolveHeader("First Name")).toBe("first_name");
  });
  it("mappt korrekt", () => {
    expect(resolveHeader("Nachname")).toBe("last_name");
    expect(resolveHeader("Mailadresse")).toBe("email");
    expect(resolveHeader("Firma")).toBe("company_name");
    expect(resolveHeader("LinkedIn URL")).toBe("linkedin_url");
    expect(resolveHeader("Telefonnummer")).toBe("phone");
  });
  it("unbekannter Header → null", () => {
    expect(resolveHeader("Lieblingsfarbe")).toBeNull();
    expect(resolveHeader("")).toBeNull();
  });
});

describe("buildMappingPlan", () => {
  it("mappt bekannte, lässt unbekannte offen", () => {
    const plan = buildMappingPlan(["Vorname", "Mailadresse", "Lieblingsfarbe"]);
    expect(plan.columns[0]).toMatchObject({ field: "first_name", source: "dictionary" });
    expect(plan.columns[1]).toMatchObject({ field: "email", source: "dictionary" });
    expect(plan.columns[2]).toMatchObject({ field: null, source: "none" });
    expect(plan.unmapped).toEqual(["Lieblingsfarbe"]);
  });

  it("Kollision: zwei Header aufs selbe Feld → erster gewinnt, zweiter unmapped", () => {
    const plan = buildMappingPlan(["E-Mail", "email_address"]);
    expect(plan.columns[0].field).toBe("email");
    expect(plan.columns[1].field).toBeNull();
    expect(plan.unmapped).toEqual(["email_address"]);
  });
});

describe("headerSignature — Vorlagen-Erkennung", () => {
  it("reihenfolge-unabhängig (gleicher Export-Typ → gleiche Signatur)", () => {
    const a = headerSignature(["Vorname", "Nachname", "E-Mail"]);
    const b = headerSignature(["E-Mail", "Vorname", "Nachname"]);
    expect(a).toBe(b);
  });
  it("unterscheidet verschiedene Strukturen", () => {
    expect(headerSignature(["Vorname", "E-Mail"])).not.toBe(headerSignature(["Vorname", "Telefon"]));
  });
});

describe("applyMapping", () => {
  it("bildet nur gemappte Spalten ab, trimmt, lässt leere weg", () => {
    const file: ParsedFile = {
      headers: ["Vorname", "Mailadresse", "Lieblingsfarbe"],
      rows: [
        { Vorname: " Max ", Mailadresse: "max@acme.io", Lieblingsfarbe: "blau" },
        { Vorname: "Eva", Mailadresse: "", Lieblingsfarbe: "grün" },
      ],
    };
    const plan = buildMappingPlan(file.headers);
    const recs = applyMapping(file, plan);
    expect(recs[0]).toEqual({ first_name: "Max", email: "max@acme.io" }); // Lieblingsfarbe unmapped → weg
    expect(recs[1]).toEqual({ first_name: "Eva" }); // leere Mail weg
  });
});
