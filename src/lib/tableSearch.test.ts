import { describe, it, expect } from "vitest";
import { buildSearchText, matchesQuery } from "./tableSearch";

describe("buildSearchText", () => {
  it("fügt vorhandene Felder mit Leerzeichen zusammen, leere weg", () => {
    expect(buildSearchText(["Acme Corp", "acme.com"])).toBe("Acme Corp acme.com");
    expect(buildSearchText(["Anna", undefined, null, "", "Meyer"])).toBe("Anna Meyer");
    expect(buildSearchText([])).toBe("");
  });
});

describe("matchesQuery", () => {
  const text = buildSearchText(["Anna Meyer", "anna@acme.com", "Acme Corp"]);

  it("leere/whitespace Query → alles matcht", () => {
    expect(matchesQuery(text, "")).toBe(true);
    expect(matchesQuery(text, "   ")).toBe(true);
  });

  it("case-insensitiver Teilstring über alle Felder", () => {
    expect(matchesQuery(text, "anna")).toBe(true);   // Name
    expect(matchesQuery(text, "ACME")).toBe(true);    // Firma (Groß/klein egal)
    expect(matchesQuery(text, "@acme.com")).toBe(true); // E-Mail-Teil
    expect(matchesQuery(text, "corp")).toBe(true);
  });

  it("kein Treffer → false", () => {
    expect(matchesQuery(text, "zzz")).toBe(false);
    expect(matchesQuery(text, "berlin")).toBe(false);
  });

  it("trimmt die Query vor dem Vergleich", () => {
    expect(matchesQuery(text, "  meyer  ")).toBe(true);
  });
});
