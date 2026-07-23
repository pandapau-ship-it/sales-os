import { describe, it, expect } from "vitest";
import {
  ENTITY_ORDER, ENTITY_META, getFields, getOperators, operatorNeedsValue, operatorTakesList,
  fieldLabelKey, operatorLabelKey, enumValueLabelKey,
} from "./config";

describe("lifecycle config — Felder (aus FILTER_SCHEMA, Single Source)", () => {
  it("Kontakt-Felder enthalten echte Schema-Felder, NICHT das ausgeblendete assigned_to", () => {
    const names = getFields("contacts").map((f) => f.name);
    expect(names).toContain("churn_score");
    expect(names).toContain("heat_status");
    expect(names).not.toContain("assigned_to"); // bewusste Entscheidung
  });
  it("Enum-Feld trägt seine Werte + Typ durch", () => {
    const heat = getFields("contacts").find((f) => f.name === "heat_status");
    expect(heat?.type).toBe("enum");
    expect(heat?.enumValues).toContain("heiss");
  });
  it("Deal-/Firma-Felder kommen aus dem Schema", () => {
    expect(getFields("deals").map((f) => f.name)).toContain("stagnation_days");
    expect(getFields("companies").map((f) => f.name)).toContain("subscription_status");
  });
});

describe("lifecycle config — Operatoren", () => {
  it("number erlaubt Vergleiche, tags nur has_any/empty", () => {
    expect(getOperators("number")).toContain("gte");
    expect(getOperators("text[]")).toEqual(["has_any", "is_empty", "is_not_empty"]);
  });
  it("is_empty/is_not_empty brauchen keinen Wert; Rest schon", () => {
    expect(operatorNeedsValue("is_empty")).toBe(false);
    expect(operatorNeedsValue("is_not_empty")).toBe(false);
    expect(operatorNeedsValue("gte")).toBe(true);
  });
  it("in/not_in/has_any sind Listen-Operatoren", () => {
    expect(operatorTakesList("in")).toBe(true);
    expect(operatorTakesList("has_any")).toBe(true);
    expect(operatorTakesList("eq")).toBe(false);
  });
});

describe("lifecycle config — Entity-Meta + Key-Helfer", () => {
  it("drei Anker in fester Reihenfolge mit Token + Icon", () => {
    expect(ENTITY_ORDER).toEqual(["contacts", "deals", "companies"]);
    expect(ENTITY_META.contacts.colorVar).toBe("--entity-contact");
    expect(typeof ENTITY_META.deals.icon).toBe("object"); // Lucide-Komponente (forwardRef)
  });
  it("Key-Helfer bauen stabile i18n-Pfade", () => {
    expect(fieldLabelKey("churn_score")).toBe("lifecycle.field.churn_score");
    expect(operatorLabelKey("gte")).toBe("lifecycle.op.gte");
    expect(enumValueLabelKey("heat_status", "heiss")).toBe("lifecycle.enum.heat_status.heiss");
  });
});
