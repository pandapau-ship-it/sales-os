import { describe, it, expect } from "vitest";
import { evaluateFilter } from "./evaluate";
import { compileToPostgrest } from "./compile";
import type { FilterDefinition, FilterNode } from "./types";

const contacts = (where: FilterNode): FilterDefinition => ({ entity: "contacts", where });

/**
 * Semantik-Kontrakt zwischen evaluate.ts (in-memory) und compile.ts (DB/PostgREST).
 * Beide MÜSSEN dieselbe Treffermenge liefern (Weiche 1, Single Source). Diese Tests nageln
 * die kanonische SQL-Semantik fest: case-sensitiv, NULL matcht nie außer is_empty.
 */
describe("evaluate ↔ compile Semantik-Parität (K-2 Kern)", () => {
  it("eq/neq/in sind case-SENSITIV (wie SQL =)", () => {
    // in-memory
    expect(evaluateFilter(contacts({ field: "first_name", operator: "eq", value: "max" }), { first_name: "Max" })).toBe(false);
    expect(evaluateFilter(contacts({ field: "first_name", operator: "eq", value: "Max" }), { first_name: "Max" })).toBe(true);
    // DB: eq erzeugt case-sensitives PostgREST .eq. (kein ilike)
    expect(compileToPostgrest(contacts({ field: "first_name", operator: "eq", value: "Max" }))).toBe('first_name.eq."Max"');
  });

  it("NULL/fehlendes Feld matcht nie — auch nicht neq/not_in/Vergleich", () => {
    const empty = {}; // Feld fehlt
    expect(evaluateFilter(contacts({ field: "icp_score", operator: "eq", value: 5 }), empty)).toBe(false);
    expect(evaluateFilter(contacts({ field: "icp_score", operator: "neq", value: 5 }), empty)).toBe(false);
    expect(evaluateFilter(contacts({ field: "icp_score", operator: "gt", value: 5 }), empty)).toBe(false);
    expect(evaluateFilter(contacts({ field: "heat_status", operator: "not_in", value: ["kalt"] }), empty)).toBe(false);
    // is_empty ist die einzige Ausnahme
    expect(evaluateFilter(contacts({ field: "icp_score", operator: "is_empty" }), empty)).toBe(true);
  });

  it("is_empty = NULL oder leerer String (Skalar); Parität zu or(is.null,eq.\"\")", () => {
    expect(evaluateFilter(contacts({ field: "email", operator: "is_empty" }), { email: "" })).toBe(true);
    expect(evaluateFilter(contacts({ field: "email", operator: "is_empty" }), { email: "x@y.z" })).toBe(false);
    expect(compileToPostgrest(contacts({ field: "email", operator: "is_empty" }))).toBe('or(email.is.null,email.eq."")');
  });

  it("is_empty für text[] = NULL oder leeres Array; Parität zu .eq.{}", () => {
    expect(evaluateFilter(contacts({ field: "tags", operator: "is_empty" }), { tags: [] })).toBe(true);
    expect(evaluateFilter(contacts({ field: "tags", operator: "is_empty" }), { tags: ["vip"] })).toBe(false);
    expect(compileToPostgrest(contacts({ field: "tags", operator: "is_empty" }))).toBe("or(tags.is.null,tags.eq.{})");
  });

  it("contains/starts_with sind case-INSENSITIV (ilike) in beiden", () => {
    expect(evaluateFilter(contacts({ field: "email", operator: "contains", value: "ACME" }), { email: "max@acme.io" })).toBe(true);
    expect(compileToPostgrest(contacts({ field: "email", operator: "contains", value: "ACME" }))).toBe('email.ilike."*ACME*"');
  });
});
