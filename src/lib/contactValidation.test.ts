import { describe, it, expect } from "vitest";
import { validateContactRequired, validateCompanyRequired } from "./contactValidation";

describe("validateContactRequired (K1)", () => {
  it("akzeptiert Vor- + Nachname ohne LinkedIn", () => {
    expect(validateContactRequired({ first_name: "Max", last_name: "Muster" }).ok).toBe(true);
  });

  it("akzeptiert LinkedIn allein (ohne Namen)", () => {
    expect(validateContactRequired({ linkedin_url: "linkedin.com/in/max" }).ok).toBe(true);
  });

  it("akzeptiert beides gleichzeitig", () => {
    expect(
      validateContactRequired({ first_name: "Max", last_name: "Muster", linkedin_url: "x" }).ok,
    ).toBe(true);
  });

  it("lehnt nur Vorname (ohne Nachname, ohne LinkedIn) ab", () => {
    const r = validateContactRequired({ first_name: "Max" });
    expect(r.ok).toBe(false);
    expect(r.errors.last_name).toBeTruthy();
    expect(r.errors.linkedin_url).toBeTruthy();
  });

  it("lehnt komplett leer ab und markiert beide Wege", () => {
    const r = validateContactRequired({});
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors)).toEqual(
      expect.arrayContaining(["first_name", "last_name", "linkedin_url"]),
    );
  });

  it("behandelt Whitespace-only wie leer", () => {
    expect(validateContactRequired({ first_name: "  ", last_name: "  " }).ok).toBe(false);
  });

  it("verlangt NICHT die E-Mail (kein Pflichtfeld)", () => {
    expect(validateContactRequired({ first_name: "A", last_name: "B" }).ok).toBe(true);
  });
});

describe("validateCompanyRequired (K1)", () => {
  it("akzeptiert reinen Namen", () => {
    expect(validateCompanyRequired({ name: "Acme" }).ok).toBe(true);
  });
  it("lehnt leeren Namen ab", () => {
    const r = validateCompanyRequired({ name: "  " });
    expect(r.ok).toBe(false);
    expect(r.errors.name).toBeTruthy();
  });
});
