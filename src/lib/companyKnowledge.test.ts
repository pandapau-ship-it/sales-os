/**
 * Vollständigkeits-Anzeige (Slice 1 „Produkte & Preise"): regelbasiert, keine KI.
 * Prüft, dass der Wirkungshinweis wirklich das wichtigste LEERE Feld benennt — die Reihenfolge
 * ist eine Produktaussage, kein Detail: Nutzen > Zielgruppe > USP > Beschreibung > Wettbewerb.
 */
import { describe, it, expect } from "vitest";
import { computeCompleteness } from "./companyKnowledge";

const product = (over: Partial<{ id: string; name: string; description: string; benefit: string; audience: string }> = {}) => ({
  id: "p1", name: "Sales OS", description: "", benefit: "", audience: "", ...over,
});

describe("computeCompleteness", () => {
  it("ohne Produkt: fordert zuerst ein Produkt (ohne Produkt hat die AI nichts zu erzählen)", () => {
    const r = computeCompleteness({ products: [], usps: [], competitors: [] });
    expect(r.nextHint).toBe("noProducts");
    expect(r.total).toBe(2); // nur die beiden Firmen-Felder
  });

  it("Hauptnutzen schlägt alles andere — inkl. Produktname im Hinweis", () => {
    const r = computeCompleteness({ products: [product()], usps: [], competitors: [] });
    expect(r.nextHint).toBe("benefit");
    expect(r.productName).toBe("Sales OS");
  });

  it("danach Zielgruppe, dann USP, dann Kurzbeschreibung", () => {
    const base = { usps: [] as { text: string }[], competitors: [] as { name: string; why_us: string }[] };
    expect(computeCompleteness({ ...base, products: [product({ benefit: "x" })] }).nextHint).toBe("audience");
    expect(computeCompleteness({ ...base, products: [product({ benefit: "x", audience: "y" })] }).nextHint).toBe("usps");
    expect(
      computeCompleteness({
        products: [product({ benefit: "x", audience: "y" })],
        usps: [{ text: "schnell" }],
        competitors: [],
      }).nextHint,
    ).toBe("description");
  });

  it("Wettbewerber-Begründung nur, wenn es überhaupt Wettbewerber gibt", () => {
    const full = [product({ description: "d", benefit: "x", audience: "y" })];
    expect(computeCompleteness({ products: full, usps: [{ text: "u" }], competitors: [] }).nextHint).toBeNull();
    expect(
      computeCompleteness({ products: full, usps: [{ text: "u" }], competitors: [{ name: "HubSpot", why_us: "" }] })
        .nextHint,
    ).toBe("competitorWhy");
  });

  it("zählt gefüllte Felder korrekt und rechnet Prozent daraus", () => {
    const r = computeCompleteness({
      products: [product({ benefit: "x" })], // 1 von 3
      usps: [{ text: "u" }],                 // 1
      competitors: [],                       // 0
    });
    expect(r.filled).toBe(2);
    expect(r.total).toBe(5);
    expect(r.percent).toBe(40);
  });

  it("leere Produktnamen führen zu einem Hinweis OHNE Namen (kein „ \" im Text)", () => {
    const r = computeCompleteness({ products: [product({ name: "  " })], usps: [], competitors: [] });
    expect(r.productName).toBeNull();
  });

  it("mehrsprachige Werte zählen als gefüllt (Andock-Haken Entscheidung 5)", () => {
    const r = computeCompleteness({
      products: [{ id: "p", name: "P", description: { de: "d" }, benefit: { en: "b" }, audience: "a" }],
      usps: [], competitors: [],
    });
    expect(r.filled).toBe(3);
  });
});
