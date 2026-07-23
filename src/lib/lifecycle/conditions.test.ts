import { describe, it, expect } from "vitest";
import {
  emptyConditions, addGroup, removeGroup, addRule, removeRule, updateRule,
  setGroupLogic, setBetweenLogic, rulesOf, logicOf, isRuleComplete, isConditionsComplete,
} from "./conditions";

describe("conditions — Bedingungs-Baum (immutable)", () => {
  it("emptyConditions: keine Gruppen, AND", () => {
    const c = emptyConditions();
    expect(c).toEqual({ logic: "AND", groups: [] });
    expect(isConditionsComplete(c)).toBe(false); // leer ist nicht speicherbar
  });

  it("addGroup legt eine Gruppe mit einer leeren Zeile an; Updater sind immutable", () => {
    const c0 = emptyConditions();
    const c1 = addGroup(c0, "contacts");
    expect(c0.groups).toHaveLength(0);        // Original unverändert
    expect(c1.groups).toHaveLength(1);
    expect(c1.groups[0].entity).toBe("contacts");
    expect(rulesOf(c1.groups[0])).toHaveLength(1);
    expect(logicOf(c1.groups[0])).toBe("AND");
  });

  it("addRule/removeRule/updateRule bearbeiten Zeilen einer Gruppe", () => {
    let c = addGroup(emptyConditions(), "contacts");
    c = updateRule(c, 0, 0, { field: "churn_score", operator: "gte", value: 61 });
    expect(rulesOf(c.groups[0])[0]).toEqual({ field: "churn_score", operator: "gte", value: 61 });
    c = addRule(c, 0);
    expect(rulesOf(c.groups[0])).toHaveLength(2);
    c = removeRule(c, 0, 1);
    expect(rulesOf(c.groups[0])).toHaveLength(1);
  });

  it("setGroupLogic (innerhalb) und setBetweenLogic (zwischen Gruppen) sind getrennt", () => {
    let c = addGroup(addGroup(emptyConditions(), "contacts"), "deals");
    c = setGroupLogic(c, 0, "OR");
    c = setBetweenLogic(c, "OR");
    expect(logicOf(c.groups[0])).toBe("OR");
    expect(c.logic).toBe("OR");
    expect(logicOf(c.groups[1])).toBe("AND"); // 2. Gruppe unberührt
  });

  it("removeGroup entfernt die richtige Gruppe", () => {
    let c = addGroup(addGroup(emptyConditions(), "contacts"), "deals");
    c = removeGroup(c, 0);
    expect(c.groups).toHaveLength(1);
    expect(c.groups[0].entity).toBe("deals");
  });
});

describe("conditions — Vollständigkeit", () => {
  it("Zeile: field+operator nötig; is_empty braucht keinen Wert; sonst Wert nötig", () => {
    expect(isRuleComplete({ field: "", operator: "gte", value: 1 })).toBe(false);
    expect(isRuleComplete({ field: "churn_score", operator: "gte", value: undefined })).toBe(false);
    expect(isRuleComplete({ field: "churn_score", operator: "gte", value: 61 })).toBe(true);
    expect(isRuleComplete({ field: "email", operator: "is_empty" })).toBe(true);
    expect(isRuleComplete({ field: "tags", operator: "has_any", value: [] })).toBe(false);
    expect(isRuleComplete({ field: "tags", operator: "has_any", value: ["a"] })).toBe(true);
  });

  it("Bedingungen komplett nur wenn jede Gruppe ≥1 vollständige Zeile hat", () => {
    let c = addGroup(emptyConditions(), "contacts");
    expect(isConditionsComplete(c)).toBe(false); // Zeile leer
    c = updateRule(c, 0, 0, { field: "churn_score", operator: "gte", value: 61 });
    expect(isConditionsComplete(c)).toBe(true);
    c = addGroup(c, "deals"); // neue Gruppe mit leerer Zeile
    expect(isConditionsComplete(c)).toBe(false);
  });
});
