import { describe, it, expect } from "vitest";
import { compileToPostgrest } from "./compile";
import type { FilterDefinition } from "./types";

const contacts = (where: FilterDefinition["where"]): FilterDefinition => ({ entity: "contacts", where });

describe("compileToPostgrest — sichere Übersetzung (K-2)", () => {
  it("eq → gequoteter Text-Wert", () => {
    expect(compileToPostgrest(contacts({ field: "heat_status", operator: "eq", value: "kalt" })))
      .toBe('heat_status.eq."kalt"');
  });

  it("Zahl-Wert bleibt bar (nicht gequotet)", () => {
    expect(compileToPostgrest(contacts({ field: "icp_score", operator: "gte", value: 70 })))
      .toBe("icp_score.gte.70");
  });

  it("in → Liste gequoteter Werte", () => {
    expect(compileToPostgrest(contacts({ field: "heat_status", operator: "in", value: ["kalt", "tot"] })))
      .toBe('heat_status.in.("kalt","tot")');
  });

  it("contains → ilike mit Wildcards", () => {
    expect(compileToPostgrest(contacts({ field: "email", operator: "contains", value: "acme" })))
      .toBe('email.ilike."*acme*"');
  });

  it("is_empty → null ODER leer", () => {
    expect(compileToPostgrest(contacts({ field: "email", operator: "is_empty" })))
      .toBe('or(email.is.null,email.eq."")');
  });

  it("AND/OR-Baum → verschachtelter Ausdruck", () => {
    const expr = compileToPostgrest(contacts({ logic: "AND", rules: [
      { field: "heat_status", operator: "eq", value: "kalt" },
      { logic: "OR", rules: [
        { field: "icp_score", operator: "gte", value: 70 },
        { field: "contact_status", operator: "eq", value: "kunde" },
      ] },
    ] }));
    expect(expr).toBe('and(heat_status.eq."kalt",or(icp_score.gte.70,contact_status.eq."kunde"))');
  });

  // ── INJECTION-NACHWEIS (Kern-[AUTO]-Anforderung K-2) ───────────────────────
  describe("Injection über Filterwerte kann NICHT ausbrechen", () => {
    it("Komma + Klammer im Wert bleiben in Quotes (kein zweiter Condition-Breakout)", () => {
      // Böswilliger Wert versucht, eine zweite Bedingung anzuhängen.
      const expr = compileToPostgrest(contacts({
        field: "first_name",
        operator: "eq",
        value: 'x"),email.eq.(evil',
      }));
      // Der gesamte Wert steht gequotet hinter eq. — die Sonderzeichen sind escaped/literal.
      expect(expr).toBe('first_name.eq."x\\"),email.eq.(evil"');
      // Struktur-Check: genau EIN Top-Level-`eq.`, kein injiziertes `email.eq.` außerhalb der Quotes.
      const outsideQuotes = expr.replace(/"(\\.|[^"\\])*"/g, '""');
      expect(outsideQuotes).toBe('first_name.eq.""');
      expect(outsideQuotes.includes("email.eq")).toBe(false);
    });

    it("Backslash + Quote werden escaped", () => {
      const expr = compileToPostgrest(contacts({ field: "first_name", operator: "eq", value: 'a\\b"c' }));
      expect(expr).toBe('first_name.eq."a\\\\b\\"c"');
    });

    it("in-Liste: jeder Wert einzeln gequotet, Komma im Wert bricht nicht aus", () => {
      const expr = compileToPostgrest(contacts({ field: "first_name", operator: "in", value: ["a,b", "c)"] }));
      expect(expr).toBe('first_name.in.("a,b","c)")');
      const outsideQuotes = expr.replace(/"(\\.|[^"\\])*"/g, '""');
      // Nur die strukturellen Kommas/Klammern der in-Syntax bleiben außerhalb.
      expect(outsideQuotes).toBe('first_name.in.("","")');
    });

    it("Feldname aus Nutzerhand ist unmöglich (Whitelist wirft schon in validate)", () => {
      expect(() => compileToPostgrest(contacts({ field: "email); drop", operator: "eq", value: "x" }))).toThrow();
    });
  });
});
