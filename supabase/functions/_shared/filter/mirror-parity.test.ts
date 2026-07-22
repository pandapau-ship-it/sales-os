/**
 * mirror-parity.test.ts — erzwingt, dass der Deno-Edge-Mirror (_shared/filter) exakt der
 * Quelle (src/lib/filter) entspricht. Drift (z.B. neues Feld nur in src) lässt diesen Test scheitern.
 */
import { describe, it, expect } from "vitest";
import { compileToPostgrest as srcCompile, FILTER_SCHEMA as srcSchema } from "@/lib/filter";
import type { FilterDefinition } from "@/lib/filter";
import { compileToPostgrest as mirCompile } from "./compile.ts";
import { FILTER_SCHEMA as mirSchema } from "./schema.ts";

describe("filter-Mirror ↔ Quelle: Parität", () => {
  it("FILTER_SCHEMA (Entitäten · Felder · Typen) identisch", () => {
    expect(JSON.stringify(mirSchema)).toEqual(JSON.stringify(srcSchema));
  });

  it("compileToPostgrest liefert für gültige Definitionen identische Ausdrücke", () => {
    const battery: FilterDefinition[] = [
      { entity: "contacts", where: { field: "churn_score", operator: "gte", value: 61 } },
      { entity: "contacts", where: { field: "heat_status", operator: "in", value: ["kalt", "tot"] } },
      { entity: "contacts", where: { field: "tags", operator: "has_any", value: ["VIP", "Messe"] } },
      { entity: "contacts", where: { field: "email", operator: "is_empty" } },
      { entity: "contacts", where: { field: "city", operator: "contains", value: "Ber,lin" } }, // Sonderzeichen
      { entity: "contacts", where: { field: "last_contacted_at", operator: "gt", value: "2026-01-01" } },
      {
        entity: "contacts",
        where: {
          logic: "AND",
          rules: [
            { field: "churn_score", operator: "gte", value: 61 },
            { logic: "OR", rules: [{ field: "heat_status", operator: "eq", value: "kalt" }, { field: "tags", operator: "has_any", value: ["x"] }] },
          ],
        },
      },
      { entity: "companies", where: { field: "subscription_status", operator: "eq", value: "active" } },
      { entity: "companies", where: { field: "size_range", operator: "in", value: ["51-200", "201-500"] } },
      { entity: "deals", where: { field: "value", operator: "gt", value: 5_000_000 } },
      { entity: "deals", where: { field: "stagnation_days", operator: "gte", value: 7 } },
      { entity: "deals", where: { field: "stage", operator: "eq", value: "backlog" } },
    ];
    for (const def of battery) {
      expect(mirCompile(def), JSON.stringify(def)).toEqual(srcCompile(def));
    }
  });
});
