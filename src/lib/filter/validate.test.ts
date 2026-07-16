import { describe, it, expect } from "vitest";
import { validateFilter, isValidFilter, FilterValidationError } from "./validate";
import type { FilterDefinition } from "./types";

const contacts = (where: FilterDefinition["where"]): FilterDefinition => ({ entity: "contacts", where });

describe("validateFilter — Whitelist (K-2 Sicherheitsgrenze)", () => {
  it("akzeptiert bekanntes Feld + erlaubten Operator + passenden Wert", () => {
    expect(isValidFilter(contacts({ field: "heat_status", operator: "eq", value: "kalt" }))).toBe(true);
  });

  it("lehnt UNBEKANNTES Feld ab (keine beliebigen Spaltennamen)", () => {
    expect(isValidFilter(contacts({ field: "password", operator: "eq", value: "x" }))).toBe(false);
    expect(() => validateFilter(contacts({ field: "password", operator: "eq", value: "x" }))).toThrow(
      FilterValidationError,
    );
  });

  it("lehnt SQL-artige Feldnamen ab", () => {
    expect(isValidFilter(contacts({ field: "id); drop table contacts;--", operator: "eq", value: "x" }))).toBe(false);
  });

  it("lehnt Operator ab, der für den Feldtyp nicht erlaubt ist", () => {
    // number-Feld mit contains → nicht erlaubt
    expect(isValidFilter(contacts({ field: "icp_score", operator: "contains", value: "5" }))).toBe(false);
    // enum mit gt → nicht erlaubt
    expect(isValidFilter(contacts({ field: "heat_status", operator: "gt", value: "kalt" }))).toBe(false);
  });

  it("lehnt enum-Wert außerhalb der erlaubten Menge ab", () => {
    expect(isValidFilter(contacts({ field: "heat_status", operator: "eq", value: "explodiert" }))).toBe(false);
  });

  it("prüft Werttyp: Zahl-Feld braucht Zahl", () => {
    expect(isValidFilter(contacts({ field: "icp_score", operator: "gt", value: "viele" }))).toBe(false);
    expect(isValidFilter(contacts({ field: "icp_score", operator: "gt", value: 80 }))).toBe(true);
  });

  it("in/not_in brauchen nicht-leere Liste", () => {
    expect(isValidFilter(contacts({ field: "heat_status", operator: "in", value: [] }))).toBe(false);
    expect(isValidFilter(contacts({ field: "heat_status", operator: "in", value: ["kalt", "warm"] }))).toBe(true);
  });

  it("is_empty/is_not_empty dürfen keinen Wert tragen", () => {
    expect(isValidFilter(contacts({ field: "email", operator: "is_empty" }))).toBe(true);
    expect(isValidFilter(contacts({ field: "email", operator: "is_empty", value: "x" }))).toBe(false);
  });

  it("has_any nur auf Array-Feld (tags)", () => {
    expect(isValidFilter(contacts({ field: "tags", operator: "has_any", value: ["vip"] }))).toBe(true);
    expect(isValidFilter(contacts({ field: "email", operator: "has_any", value: ["x"] }))).toBe(false);
  });

  it("verschachtelte AND/OR-Gruppen", () => {
    expect(
      isValidFilter(
        contacts({
          logic: "AND",
          rules: [
            { field: "heat_status", operator: "eq", value: "kalt" },
            { logic: "OR", rules: [
              { field: "icp_score", operator: "gte", value: 70 },
              { field: "contact_status", operator: "eq", value: "kunde" },
            ] },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("lehnt unbekannte Entität ab", () => {
    expect(isValidFilter({ entity: "secrets" as never, where: { field: "x", operator: "eq", value: "1" } })).toBe(false);
  });

  it("lehnt leere Gruppe + fehlende Bedingung ab", () => {
    expect(isValidFilter(contacts({ logic: "AND", rules: [] }))).toBe(false);
  });

  it("lehnt zu tiefe Verschachtelung ab (DoS-Schutz)", () => {
    let node: FilterDefinition["where"] = { field: "heat_status", operator: "eq", value: "kalt" };
    for (let i = 0; i < 12; i++) node = { logic: "AND", rules: [node] };
    expect(isValidFilter(contacts(node))).toBe(false);
  });
});
