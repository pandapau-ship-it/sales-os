import { describe, it, expect } from "vitest";
import {
  actionApplies, combineAnchorSets, diffFire, orderRules, activePrefix, computePlan,
  type RuleInput,
} from "./eval.ts";

const rule = (o: Partial<RuleInput> & { id: string }): RuleInput => ({
  anchor_entity: "contacts", priority: 100, is_terminal: false, created_at: "2026-01-01",
  organization_id: "org", action: { type: "notify" }, ...o,
});

describe("actionApplies (L-2b applies_to-Gate)", () => {
  it("Anker in applies_to → true", () => {
    expect(actionApplies("contacts", ["contacts", "deals"])).toBe(true);
    expect(actionApplies("deals", ["contacts", "deals"])).toBe(true);
  });
  it("Anker NICHT in applies_to → false (z.B. add_tag auf deals)", () => {
    expect(actionApplies("deals", ["contacts", "companies"])).toBe(false);
    expect(actionApplies("companies", ["contacts"])).toBe(false);
  });
  it("fehlende/leere Registry-Angabe → false (defensiv)", () => {
    expect(actionApplies("contacts", undefined)).toBe(false);
    expect(actionApplies("contacts", [])).toBe(false);
  });
});

describe("combineAnchorSets (Mengen-Algebra, Option B)", () => {
  it("AND = Schnittmenge über Gruppen (Cross-Entity)", () => {
    // Gruppe contacts→{a,b,c}, Gruppe deals→{b,c,d} (schon auf Anker gemappt)
    expect(combineAnchorSets("AND", [["a", "b", "c"], ["b", "c", "d"]]).sort()).toEqual(["b", "c"]);
  });
  it("OR = Vereinigung", () => {
    expect(combineAnchorSets("OR", [["a", "b"], ["b", "d"]]).sort()).toEqual(["a", "b", "d"]);
  });
  it("AND mit leerer Gruppe → leer; 3 Gruppen", () => {
    expect(combineAnchorSets("AND", [["a"], []])).toEqual([]);
    expect(combineAnchorSets("AND", [["a", "b", "c"], ["a", "b"], ["b", "z"]])).toEqual(["b"]);
  });
});

describe("diffFire (Einmal-Feuer)", () => {
  it("neu zutreffend feuert; schon-matched nicht", () => {
    const { toFire, toRearm } = diffFire(["a", "b"], ["a"]);
    expect(toFire).toEqual(["b"]); expect(toRearm).toEqual([]);
  });
  it("Doppel-Lauf ohne Änderung → nichts feuert (idempotent)", () => {
    expect(diffFire(["a", "b"], ["a", "b"]).toFire).toEqual([]);
  });
  it("nicht mehr matchend → rearm (matched=false)", () => {
    expect(diffFire(["a"], ["a", "b"]).toRearm).toEqual(["b"]);
  });
  it("Re-Fire nach zwischenzeitlichem nicht-match", () => {
    // Lauf1: a neu → matched. Lauf2: a weg → rearm. Lauf3: a wieder da, prev leer → feuert erneut.
    expect(diffFire(["a"], []).toFire).toEqual(["a"]);       // Lauf1
    expect(diffFire([], ["a"]).toRearm).toEqual(["a"]);      // Lauf2
    expect(diffFire(["a"], []).toFire).toEqual(["a"]);       // Lauf3 (prev wurde in Lauf2 auf false gesetzt)
  });
});

describe("orderRules + activePrefix (Rangfolge/terminal/Gleichstand)", () => {
  it("priority DESC, Gleichstand terminal zuerst, dann created_at ASC", () => {
    const r = orderRules([
      rule({ id: "low", priority: 50 }),
      rule({ id: "hi-b", priority: 100, is_terminal: false, created_at: "2026-02-01" }),
      rule({ id: "hi-a", priority: 100, is_terminal: false, created_at: "2026-01-01" }),
      rule({ id: "hi-term", priority: 100, is_terminal: true }),
    ]).map((x) => x.id);
    expect(r).toEqual(["hi-term", "hi-a", "hi-b", "low"]); // terminal zuerst bei Gleichstand 100, dann created_at
  });
  it("terminal schneidet rangniedrigere ab (Präfix inkl. terminal)", () => {
    const ordered = orderRules([
      rule({ id: "a", priority: 100 }),
      rule({ id: "t", priority: 90, is_terminal: true }),
      rule({ id: "b", priority: 80 }),
    ]);
    const { active, suppressed } = activePrefix(ordered);
    expect(active.map((x) => x.id)).toEqual(["a", "t"]);
    expect(suppressed.map((x) => x.id)).toEqual(["b"]);
  });
});

describe("computePlan (Integration)", () => {
  it("terminal unterdrückt rangniedrigere Regel für denselben Datensatz", () => {
    const rules = [
      rule({ id: "hi", priority: 100, is_terminal: true }),
      rule({ id: "lo", priority: 50 }),
    ];
    const plan = computePlan({
      rules,
      matchByRule: { hi: ["c1"], lo: ["c1"] },  // beide matchen c1
      prevMatchedByRule: {},
      maxFired: 100,
    });
    expect(plan.fires).toEqual([{ ruleId: "hi", entityId: "c1" }]); // nur hi feuert
    expect(plan.suppressed).toBe(1);                                 // lo für c1 unterdrückt
  });

  it("beide feuern (kein terminal), in priority-Reihenfolge", () => {
    const plan = computePlan({
      rules: [rule({ id: "hi", priority: 100 }), rule({ id: "lo", priority: 50 })],
      matchByRule: { hi: ["c1"], lo: ["c1"] },
      prevMatchedByRule: {},
      maxFired: 100,
    });
    expect(plan.fires).toEqual([{ ruleId: "hi", entityId: "c1" }, { ruleId: "lo", entityId: "c1" }]);
    expect(plan.suppressed).toBe(0);
  });

  it("Batch-Limit: Überschuss wird VERTAGT (nicht verworfen), nächster Lauf holt nach", () => {
    const rules = [rule({ id: "r", priority: 100 })];
    const match = { r: ["a", "b", "c"] };
    const run1 = computePlan({ rules, matchByRule: match, prevMatchedByRule: {}, maxFired: 2 });
    expect(run1.fires.length).toBe(2);
    expect(run1.carried).toBe(1);
    expect(run1.candidates).toBe(3);
    // Lauf2: die 2 gefeuerten sind jetzt matched=true → nur der vertagte feuert.
    const firedIds = run1.fires.map((f) => f.entityId);
    const run2 = computePlan({ rules, matchByRule: match, prevMatchedByRule: { r: firedIds }, maxFired: 2 });
    expect(run2.fires.length).toBe(1);
    expect(run2.carried).toBe(0);
    // Vollständigkeit: alle drei genau einmal über die zwei Läufe.
    expect([...firedIds, ...run2.fires.map((f) => f.entityId)].sort()).toEqual(["a", "b", "c"]);
  });

  it("Doppel-Lauf ohne Änderung → keine erneuten Fires (idempotent)", () => {
    const rules = [rule({ id: "r" })];
    const plan = computePlan({ rules, matchByRule: { r: ["a", "b"] }, prevMatchedByRule: { r: ["a", "b"] }, maxFired: 100 });
    expect(plan.fires).toEqual([]);
    expect(plan.rearms).toEqual([]);
  });

  it("rearm bei nicht mehr matchendem Datensatz", () => {
    const rules = [rule({ id: "r" })];
    const plan = computePlan({ rules, matchByRule: { r: ["a"] }, prevMatchedByRule: { r: ["a", "b"] }, maxFired: 100 });
    expect(plan.fires).toEqual([]);
    expect(plan.rearms).toEqual([{ ruleId: "r", entityId: "b" }]);
  });

  it("unterdrückte, nie gefeuerte Regel feuert, sobald die Unterdrückung wegfällt", () => {
    const rules = [rule({ id: "hi", priority: 100, is_terminal: true }), rule({ id: "lo", priority: 50 })];
    // Lauf A: hi terminal matcht c1 → lo unterdrückt (kein Bookkeeping für lo/c1)
    const a = computePlan({ rules, matchByRule: { hi: ["c1"], lo: ["c1"] }, prevMatchedByRule: { hi: ["c1"] }, maxFired: 100 });
    expect(a.fires).toEqual([]); // hi schon matched, lo unterdrückt
    // Lauf B: hi matcht c1 nicht mehr → lo nicht mehr unterdrückt, lo/c1 „neu" → feuert
    const b = computePlan({ rules, matchByRule: { hi: [], lo: ["c1"] }, prevMatchedByRule: { hi: ["c1"] }, maxFired: 100 });
    expect(b.fires).toEqual([{ ruleId: "lo", entityId: "c1" }]);
    expect(b.rearms).toEqual([{ ruleId: "hi", entityId: "c1" }]);
  });
});
