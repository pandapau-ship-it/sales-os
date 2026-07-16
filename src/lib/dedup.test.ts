import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  normalizeLinkedin,
  normalizeDomain,
  normalizeCompanyName,
  normalizeName,
  similarity,
  classifyDuplicate,
  classifyCompanyDuplicate,
  type ExistingContact,
  type ExistingCompany,
} from "./dedup";

describe("Normalisierung (K2)", () => {
  it("E-Mail: lowercase + trim", () => {
    expect(normalizeEmail("  Max.Muster@Acme.IO ")).toBe("max.muster@acme.io");
  });

  it("LinkedIn: Schema/www/Tracking/Trailing-Slash weg", () => {
    const a = normalizeLinkedin("https://www.linkedin.com/in/Max-Muster/?utm_source=x");
    const b = normalizeLinkedin("linkedin.com/in/max-muster");
    expect(a).toBe("linkedin.com/in/max-muster");
    expect(a).toBe(b);
  });

  it("Domain: host aus URL, www/Pfad weg", () => {
    expect(normalizeDomain("https://www.Acme.io/kontakt")).toBe("acme.io");
  });

  it("Company: Rechtsform-Suffix + Satzzeichen weg", () => {
    expect(normalizeCompanyName("Acme GmbH")).toBe("acme");
    expect(normalizeCompanyName("Acme, Inc.")).toBe("acme");
    expect(normalizeCompanyName("Acme GmbH & Co. KG")).toBe("acme");
  });

  it("Company: reiner Rechtsform-Name wird nicht geleert", () => {
    expect(normalizeCompanyName("GmbH")).toBe("gmbh");
  });

  it("Name: Titel weg, Umlaute normalisiert", () => {
    expect(normalizeName("Dr. Björn Müller")).toBe("bjoern mueller");
  });
});

describe("similarity", () => {
  it("identisch = 1", () => {
    expect(similarity("acme", "acme")).toBe(1);
  });
  it("völlig verschieden ~ niedrig", () => {
    expect(similarity("acme", "zzzzzz")).toBeLessThan(0.2);
  });
  it("Tippfehler = hoch", () => {
    expect(similarity("mueller", "muller")).toBeGreaterThan(0.6);
  });
});

describe("classifyDuplicate — Match-Kaskade (K2)", () => {
  const existing: ExistingContact[] = [
    { id: "c1", email: "max@acme.io", linkedin_url: "linkedin.com/in/max", first_name: "Max", last_name: "Muster", company_name: "Acme GmbH" },
    { id: "c2", email: "eva@beta.com", first_name: "Eva", last_name: "Beta", company_name: "Beta AG" },
  ];

  it("E-Mail exakt → sicher (auch bei abweichender Groß-/Kleinschreibung)", () => {
    const hit = classifyDuplicate({ email: "MAX@ACME.IO" }, existing);
    expect(hit).toMatchObject({ level: "sicher", matchType: "email", matchedId: "c1", score: 1 });
  });

  it("LinkedIn exakt → sicher (mit Tracking-Parametern)", () => {
    const hit = classifyDuplicate(
      { linkedin_url: "https://www.linkedin.com/in/max/?utm=y" },
      existing,
    );
    expect(hit).toMatchObject({ level: "sicher", matchType: "linkedin", matchedId: "c1" });
  });

  it("E-Mail schlägt Fuzzy: sicher gewinnt vor möglich", () => {
    const hit = classifyDuplicate(
      { email: "max@acme.io", first_name: "Eva", last_name: "Beta", company_name: "Beta AG" },
      existing,
    );
    expect(hit?.level).toBe("sicher");
    expect(hit?.matchType).toBe("email");
  });

  it("Name + Company unscharf → möglich", () => {
    const hit = classifyDuplicate(
      { first_name: "Max", last_name: "Muster", company_name: "Acme, Inc." },
      existing,
    );
    expect(hit?.level).toBe("moeglich");
    expect(hit?.matchType).toBe("name_company");
    expect(hit?.matchedId).toBe("c1");
  });

  it("Name gleich aber andere Company → KEIN Treffer", () => {
    const hit = classifyDuplicate(
      { first_name: "Max", last_name: "Muster", company_name: "Globex Ltd" },
      existing,
    );
    expect(hit).toBeNull();
  });

  it("nichts Vergleichbares → null", () => {
    expect(classifyDuplicate({ first_name: "Neu", last_name: "Person" }, existing)).toBeNull();
    expect(classifyDuplicate({}, existing)).toBeNull();
  });

  it("leere existing-Liste → null", () => {
    expect(classifyDuplicate({ email: "x@y.z" }, [])).toBeNull();
  });
});

describe("classifyCompanyDuplicate (K2)", () => {
  const existing: ExistingCompany[] = [
    { id: "co1", domain: "acme.io", name: "Acme GmbH" },
    { id: "co2", domain: "beta.com", name: "Beta AG" },
  ];

  it("Domain exakt → sicher", () => {
    const hit = classifyCompanyDuplicate({ domain: "https://www.acme.io" }, existing);
    expect(hit).toMatchObject({ level: "sicher", matchType: "domain", matchedId: "co1" });
  });

  it("Name unscharf → möglich (Rechtsform ignoriert)", () => {
    const hit = classifyCompanyDuplicate({ name: "Acme Inc." }, existing);
    expect(hit).toMatchObject({ level: "moeglich", matchType: "name", matchedId: "co1" });
  });

  it("kein Match → null", () => {
    expect(classifyCompanyDuplicate({ name: "Globex", domain: "globex.dev" }, existing)).toBeNull();
  });
});
