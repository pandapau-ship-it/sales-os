/**
 * anchors.test.ts (Fix FUND 4) — sichert ab, dass JEDE Anker-/Quell-Lesestelle des Evaluators
 * `deleted_at IS NULL` filtert (058-Muster). Fake-`sb` schreibt die Query-Kette mit; für jede
 * Anker×Gruppe-Kombination wird geprüft: (a) alle Reads deleted_at-gefiltert, (b) korrektes FK-Mapping.
 */
import { describe, it, expect } from "vitest";
import { groupAnchorIds, resolveOwner, type Group } from "./anchors.ts";
import type { AnchorEntity } from "./eval.ts";

interface Call { table: string; select: string; deletedAtFiltered: boolean; terminal: "or" | "in" | "single" }

// Chainbarer Recorder: bildet .from().select().eq().is().or()/.in()/.maybeSingle() nach.
function fakeSb() {
  const calls: Call[] = [];
  const ROW = { id: "id1", contact_id: "c1", primary_company_id: "co1", company_id: "co1", assigned_to: "u1", owner_id: "u1" };
  const make = () => {
    const rec: Call = { table: "", select: "", deletedAtFiltered: false, terminal: "or" };
    const done = () => { calls.push(rec); return Promise.resolve({ data: [ROW], error: null }); };
    const b = {
      from(t: string) { rec.table = t; return b; },
      select(c: string) { rec.select = c; return b; },
      eq(_k: string, _v: unknown) { return b; },
      is(k: string, v: unknown) { if (k === "deleted_at" && v === null) rec.deletedAtFiltered = true; return b; },
      or(_expr: string) { rec.terminal = "or"; return done(); },
      in(_col: string, _ids: string[]) { rec.terminal = "in"; return done(); },
      maybeSingle() { rec.terminal = "single"; calls.push(rec); return Promise.resolve({ data: ROW, error: null }); },
    };
    return b;
  };
  // deno-lint/ts: der echte Client-Typ ist irrelevant für den Test → any.
  return { sb: { from: (t: string) => make().from(t) } as never, calls };
}

const whereFor = (entity: AnchorEntity) =>
  entity === "contacts" ? { logic: "AND" as const, rules: [{ field: "churn_score", operator: "gte" as const, value: 61 }] }
  : entity === "deals" ? { logic: "AND" as const, rules: [{ field: "stagnation_days", operator: "gt" as const, value: 14 }] }
  : { logic: "AND" as const, rules: [{ field: "subscription_status", operator: "eq" as const, value: "trial" }] };
const group = (entity: AnchorEntity): Group => ({ entity, where: whereFor(entity) });

const COMBOS: Array<{ anchor: AnchorEntity; g: AnchorEntity; tables: string[] }> = [
  { anchor: "contacts",  g: "contacts",  tables: ["contacts"] },
  { anchor: "contacts",  g: "deals",     tables: ["deals"] },
  { anchor: "contacts",  g: "companies", tables: ["companies", "contacts"] }, // rows(companies) + via(contacts)
  { anchor: "deals",     g: "deals",     tables: ["deals"] },
  { anchor: "deals",     g: "contacts",  tables: ["contacts", "deals"] },     // rows(contacts) + via(deals)
  { anchor: "deals",     g: "companies", tables: ["companies", "deals"] },
  { anchor: "companies", g: "companies", tables: ["companies"] },
  { anchor: "companies", g: "contacts",  tables: ["contacts"] },
  { anchor: "companies", g: "deals",     tables: ["deals"] },
];

describe("groupAnchorIds — jede Lesestelle filtert deleted_at (Fix FUND 4)", () => {
  for (const c of COMBOS) {
    it(`anchor=${c.anchor} · group=${c.g} → Reads ${c.tables.join("+")} alle deleted_at-gefiltert`, async () => {
      const { sb, calls } = fakeSb();
      await groupAnchorIds(sb, "org1", c.anchor, group(c.g));
      expect(calls.map((x) => x.table)).toEqual(c.tables);            // korrektes FK-Mapping
      expect(calls.every((x) => x.deletedAtFiltered)).toBe(true);     // KERN: kein Read ohne deleted_at
    });
  }
});

describe("resolveOwner — deleted_at-gefiltert (defensiv)", () => {
  it("contacts liest contacts.assigned_to mit deleted_at-Filter", async () => {
    const { sb, calls } = fakeSb();
    await resolveOwner(sb, "org1", "contacts", "e1");
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe("contacts");
    expect(calls[0].deletedAtFiltered).toBe(true);
  });
  it("deals liest deals.owner_id mit deleted_at-Filter", async () => {
    const { sb, calls } = fakeSb();
    await resolveOwner(sb, "org1", "deals", "e1");
    expect(calls[0].table).toBe("deals");
    expect(calls[0].deletedAtFiltered).toBe(true);
  });
  it("companies → kein Read (kein Owner)", async () => {
    const { sb, calls } = fakeSb();
    const r = await resolveOwner(sb, "org1", "companies", "e1");
    expect(r).toBeNull();
    expect(calls).toHaveLength(0);
  });
});
