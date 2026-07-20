/**
 * Wichtigkeits-Registry + Vollständigkeit („Mein Unternehmen").
 * Kernzusage: EINE Quelle (`fieldImportance.ts`) treibt BEIDES — die Vollständigkeits-Anzeige
 * (heute) und die Frage „welche Pflichtangaben fehlen?" (später der AI Chat). Kein zweites System.
 */
import { describe, it, expect } from "vitest";
import { computeCompleteness, missingRequired } from "./companyKnowledge";
import { FIELD_IMPORTANCE, importanceOf, IMPORTANCE_ORDER, pathFor } from "./fieldImportance";

const product = (over: Partial<{ id: string; name: string; description: string; benefit: string; audience: string }> = {}) => ({
  id: "p1", name: "Sales OS", description: "", benefit: "", audience: "", ...over,
});
const full = (id = "p1") => product({ id, description: "d", benefit: "b", audience: "a" });

describe("fieldImportance — Registry", () => {
  it("jeder Eintrag hat Pfad, Einstufung, Begründung und Hinweis-Schlüssel", () => {
    for (const e of FIELD_IMPORTANCE) {
      expect(e.path.length, e.path).toBeGreaterThan(0);
      expect(["required", "recommended", "optional"]).toContain(e.importance);
      expect(e.reason.length, e.path).toBeGreaterThan(10); // echte Begründung, kein Platzhalter
      expect(e.hintKey.length, e.path).toBeGreaterThan(0);
    }
  });

  it("Reihenfolge: required vor recommended vor optional", () => {
    const rank = { required: 0, recommended: 1, optional: 2 };
    const seq = IMPORTANCE_ORDER.map((e) => rank[e.importance]);
    expect(seq).toEqual([...seq].sort((a, b) => a - b));
  });

  it("Feldpfade sind über konkrete id auflösbar und rückwärts nachschlagbar", () => {
    expect(pathFor("product.<id>.benefit", "abc")).toBe("product.abc.benefit");
    expect(importanceOf("product.abc.benefit")?.importance).toBe("required");
    expect(importanceOf("org.usps")?.importance).toBe("recommended");
    expect(importanceOf("gibt.es.nicht")).toBeUndefined(); // nie raten
  });
});

describe("computeCompleteness — von der Registry getrieben", () => {
  it("ohne Produkt: fordert zuerst ein Produkt", () => {
    expect(computeCompleteness({ products: [] }, "product").nextHint).toBe("noProducts");
  });

  it("Wirkungs-Reihenfolge folgt der Registry: Name → Nutzen → Zielgruppe → Beschreibung", () => {
    const h = (p: ReturnType<typeof product>) => computeCompleteness({ products: [p] }, "product").nextHint;
    expect(h(product({ name: "" }))).toBe("name");
    expect(h(product())).toBe("benefit");
    expect(h(product({ benefit: "b" }))).toBe("audience");
    expect(h(product({ benefit: "b", audience: "a" }))).toBe("description");
    expect(h(full())).toBeNull();
  });

  it("optional zählt NICHT in die Quote (kein Druck auf Preisfelder)", () => {
    const r = computeCompleteness({ products: [full()] }, "product");
    expect(r.total).toBe(4);          // name, benefit, audience, description
    expect(r.filled).toBe(4);
    expect(r.percent).toBe(100);
    // …taucht aber als offener (optionaler) Punkt auf, ohne die Quote zu drücken:
    expect(r.missing.some((m) => m.path === "product.p1.price")).toBe(true);
  });

  it("scope trennt Seiten: 'product' urteilt nie über org-Felder (kein Hinweis ins Leere)", () => {
    const r = computeCompleteness({ products: [full()] }, "product");
    expect(r.missing.some((m) => m.path.startsWith("org."))).toBe(false);
    const all = computeCompleteness({ products: [full()] }, "all");
    expect(all.missing.some((m) => m.path === "org.usps")).toBe(true);
  });

  it("mehrsprachige Werte zählen als gefüllt", () => {
    const r = computeCompleteness(
      { products: [{ id: "p", name: "P", description: { de: "d" }, benefit: { en: "b" }, audience: "a" }] },
      "product",
    );
    expect(r.filled).toBe(4);
  });

  it("zählt über mehrere Produkte hinweg", () => {
    const r = computeCompleteness({ products: [full("a"), product({ id: "b", name: "Zweites" })] }, "product");
    expect(r.total).toBe(8);
    expect(r.filled).toBe(5); // 4 + nur der Name des zweiten
  });
});

describe("missingRequired — dieselbe Registry für den künftigen AI Chat", () => {
  it("nennt nur Pflichtangaben, mit Begründung und Bezug", () => {
    const missing = missingRequired({ products: [product({ name: "" })] }, "product");
    expect(missing.map((m) => m.path)).toEqual(["product.p1.name", "product.p1.benefit"]);
    expect(missing.every((m) => m.importance === "required")).toBe(true);
    expect(missing[0].reason.length).toBeGreaterThan(10); // Chat kann die Rückfrage begründen
  });

  it("nichts Pflichtiges offen → leer, obwohl Empfohlenes fehlt (Chat blockiert dafür NIE)", () => {
    const input = { products: [product({ name: "N", benefit: "B" })] }; // audience/description leer
    expect(missingRequired(input, "product")).toEqual([]);
    expect(computeCompleteness(input, "product").missing.length).toBeGreaterThan(0);
  });

  it("Bezug (subject) benennt das betroffene Produkt für die Rückfrage", () => {
    const missing = missingRequired({ products: [product({ name: "Sales OS" })] }, "product");
    expect(missing[0].subject).toBe("Sales OS");
  });
});

describe("Personal Voice — scope 'voice' (Slice 2/3)", () => {
  const ch = (o: Partial<{ samples: string; sentence_style: string; hooks: string; dos_donts: string }> = {}) =>
    ({ samples: "", sentence_style: "", hooks: "", dos_donts: "", ...o });
  const voice = (over: Partial<{ bio: string; themes: string; style: string; tone: string }> = {}) => ({
    overview: { bio: "", themes: "", style: "", tone: "", ...over },
    post: ch(), comment: ch(), dm: ch(), email: ch(),
  });
  const input = (v = voice()) => ({ products: [], voice: v });

  it("zählt NUR recommended Voice-Felder: 3 Overview + 2×4 Kanäle = 11 (optional zählt nicht)", () => {
    const r = computeCompleteness(input(), "voice");
    expect(r.total).toBe(11);
    expect(r.filled).toBe(0);
    expect(r.percent).toBe(0);
  });

  it("leeres Profil weist auf das wichtigste Feld hin (voiceBio), NICHT auf noProducts", () => {
    const r = computeCompleteness(input(), "voice");
    expect(r.nextHint).toBe("voiceBio"); // der noProducts-Zweig darf bei scope voice NIE greifen
  });

  it("gefüllte recommended Felder erhöhen die Quote; optional (themes) bleibt außen vor", () => {
    const v = voice({ bio: "x", style: "y", tone: "z", themes: "egal" });
    v.post = ch({ samples: "s", sentence_style: "ss", hooks: "h", dos_donts: "d" });
    const r = computeCompleteness(input(v), "voice");
    // 3 Overview-recommended + 2 Post-recommended = 5 gefüllt; themes/hooks/dos_donts zählen nicht.
    expect(r.filled).toBe(5);
    expect(r.total).toBe(11);
  });

  it("alles recommended gefüllt → 100 %, kein nächster Hinweis (done)", () => {
    const filledCh = ch({ samples: "s", sentence_style: "ss" });
    const v = { overview: { bio: "b", themes: "", style: "s", tone: "t" },
      post: filledCh, comment: filledCh, dm: filledCh, email: filledCh };
    const r = computeCompleteness(input(v), "voice");
    expect(r.filled).toBe(11);
    expect(r.percent).toBe(100);
    expect(r.nextHint).toBeNull();
  });

  it("scope 'voice' ignoriert Produkt-/Firmen-Felder vollständig", () => {
    const r = computeCompleteness(
      { products: [full()], usps: [{ text: "u" }], voice: voice() },
      "voice",
    );
    expect(r.total).toBe(11); // nur Voice-Felder, keine Produkt-/USP-Felder
    expect(r.missing.every((m) => m.path.startsWith("voice."))).toBe(true);
  });

  it("scope 'product' zählt keine Voice-Felder (Domänen sauber getrennt)", () => {
    const r = computeCompleteness({ products: [full()], voice: voice() }, "product");
    expect(r.missing.some((m) => m.path.startsWith("voice."))).toBe(false);
  });
});
