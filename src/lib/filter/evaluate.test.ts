import { describe, it, expect } from "vitest";
import { evaluateFilter } from "./evaluate";
import type { FilterDefinition } from "./types";

const contacts = (where: FilterDefinition["where"]): FilterDefinition => ({ entity: "contacts", where });

const rec = {
  first_name: "Max",
  last_name: "Muster",
  email: "max@acme.io",
  heat_status: "kalt",
  contact_status: "kunde",
  icp_score: 82,
  tags: ["vip", "dach"],
  last_contacted_at: "2026-06-01T10:00:00Z",
  email_verified: true,
};

describe("evaluateFilter — In-Memory-Prädikat (Lifecycle-Trigger)", () => {
  it("eq / neq", () => {
    expect(evaluateFilter(contacts({ field: "heat_status", operator: "eq", value: "kalt" }), rec)).toBe(true);
    expect(evaluateFilter(contacts({ field: "heat_status", operator: "neq", value: "warm" }), rec)).toBe(true);
    expect(evaluateFilter(contacts({ field: "heat_status", operator: "eq", value: "warm" }), rec)).toBe(false);
  });

  it("numerische Vergleiche", () => {
    expect(evaluateFilter(contacts({ field: "icp_score", operator: "gte", value: 80 }), rec)).toBe(true);
    expect(evaluateFilter(contacts({ field: "icp_score", operator: "lt", value: 80 }), rec)).toBe(false);
  });

  it("contains / starts_with (case-insensitive)", () => {
    expect(evaluateFilter(contacts({ field: "email", operator: "contains", value: "ACME" }), rec)).toBe(true);
    expect(evaluateFilter(contacts({ field: "first_name", operator: "starts_with", value: "ma" }), rec)).toBe(true);
    expect(evaluateFilter(contacts({ field: "first_name", operator: "starts_with", value: "xa" }), rec)).toBe(false);
  });

  it("in / not_in", () => {
    expect(evaluateFilter(contacts({ field: "heat_status", operator: "in", value: ["kalt", "tot"] }), rec)).toBe(true);
    expect(evaluateFilter(contacts({ field: "heat_status", operator: "not_in", value: ["warm", "heiss"] }), rec)).toBe(true);
  });

  it("has_any auf tags", () => {
    expect(evaluateFilter(contacts({ field: "tags", operator: "has_any", value: ["vip"] }), rec)).toBe(true);
    expect(evaluateFilter(contacts({ field: "tags", operator: "has_any", value: ["nope"] }), rec)).toBe(false);
  });

  it("is_empty / is_not_empty", () => {
    expect(evaluateFilter(contacts({ field: "email", operator: "is_not_empty" }), rec)).toBe(true);
    expect(evaluateFilter(contacts({ field: "email", operator: "is_empty" }), { ...rec, email: "" }), ).toBe(true);
    expect(evaluateFilter(contacts({ field: "job_title", operator: "is_empty" }), rec)).toBe(true); // Feld fehlt → leer
  });

  it("Datum-Vergleich (ISO)", () => {
    expect(evaluateFilter(contacts({ field: "last_contacted_at", operator: "lt", value: "2026-07-01T00:00:00Z" }), rec)).toBe(true);
    expect(evaluateFilter(contacts({ field: "last_contacted_at", operator: "gt", value: "2026-07-01T00:00:00Z" }), rec)).toBe(false);
  });

  it("AND-Gruppe: alle müssen zutreffen", () => {
    expect(
      evaluateFilter(contacts({ logic: "AND", rules: [
        { field: "heat_status", operator: "eq", value: "kalt" },
        { field: "icp_score", operator: "gte", value: 80 },
      ] }), rec),
    ).toBe(true);
    expect(
      evaluateFilter(contacts({ logic: "AND", rules: [
        { field: "heat_status", operator: "eq", value: "kalt" },
        { field: "icp_score", operator: "gte", value: 90 },
      ] }), rec),
    ).toBe(false);
  });

  it("OR-Gruppe: einer reicht", () => {
    expect(
      evaluateFilter(contacts({ logic: "OR", rules: [
        { field: "heat_status", operator: "eq", value: "warm" },
        { field: "contact_status", operator: "eq", value: "kunde" },
      ] }), rec),
    ).toBe(true);
  });

  it("verschachtelt AND(OR)", () => {
    expect(
      evaluateFilter(contacts({ logic: "AND", rules: [
        { field: "icp_score", operator: "gte", value: 80 },
        { logic: "OR", rules: [
          { field: "heat_status", operator: "eq", value: "tot" },
          { field: "contact_status", operator: "eq", value: "kunde" },
        ] },
      ] }), rec),
    ).toBe(true);
  });

  it("ungültiger Filter wirft (kein stilles false)", () => {
    expect(() => evaluateFilter(contacts({ field: "geheim", operator: "eq", value: "x" }), rec)).toThrow();
  });

  // Regression (Kontakte-Lagebild „Ohne Kontaktweg"): linkedin_url MUSS filterbar sein,
  // sonst wirft validateFilter im Render → weiße Seite. Exakt der buildFilterDef-Output.
  it("Ohne-Kontaktweg-Filter (email + linkedin_url is_empty) validiert & wertet aus, wirft nicht", () => {
    const def = contacts({ logic: "AND", rules: [
      { field: "email", operator: "is_empty" },
      { field: "linkedin_url", operator: "is_empty" },
    ] });
    expect(() => evaluateFilter(def, rec)).not.toThrow();
    // Kontakt mit Mail → nicht „ohne Kontaktweg".
    expect(evaluateFilter(def, rec)).toBe(false);
    // Kontakt ohne beides → Treffer.
    expect(evaluateFilter(def, { first_name: "Leer", email: null, linkedin_url: null })).toBe(true);
    // Nur LinkedIn vorhanden → kein Treffer.
    expect(evaluateFilter(def, { email: null, linkedin_url: "linkedin.com/in/x" })).toBe(false);
  });
});
