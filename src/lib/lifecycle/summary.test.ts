import { describe, it, expect } from "vitest";
import type { TFunction } from "i18next";
import { summarizeRule, lastFiredText } from "./summary";
import type { LifecycleRuleConditions } from "@/lib/db";

// Stub-t: bekannte Keys → lesbar, interpolierte Sätze zusammensetzen, sonst Key durchreichen.
const labels: Record<string, string> = {
  "lifecycle.entity.contacts.label": "Kontakt",
  "lifecycle.field.churn_score": "Churn-Score",
  "lifecycle.field.icp_score": "ICP-Score",
  "lifecycle.op.gte": "≥",
  "lifecycle.op.gt": ">",
};
const t = ((key: string, opts?: Record<string, unknown>) => {
  switch (key) {
    case "lifecycle.ui.summary.sentence": return `Wenn ${opts!.anchor} ${opts!.cond}, dann ${opts!.action}.`;
    case "lifecycle.ui.summary.more": return `(+${opts!.count})`;
    case "lifecycle.ui.lastFired.never": return "Noch nicht gefeuert";
    case "lifecycle.ui.lastFired.today": return "heute";
    case "lifecycle.ui.lastFired.daysAgo": return `vor ${opts!.count} Tagen`;
    case "lifecycle.ui.lastFired.some": return `Zuletzt ${opts!.when} · ${opts!.count}`;
    default: return labels[key] ?? key;
  }
}) as unknown as TFunction;

const one: LifecycleRuleConditions = {
  logic: "AND",
  groups: [{ entity: "contacts", where: { logic: "AND", rules: [{ field: "churn_score", operator: "gte", value: 61 }] } }],
};
const two: LifecycleRuleConditions = {
  logic: "AND",
  groups: [{ entity: "contacts", where: { logic: "AND", rules: [
    { field: "churn_score", operator: "gte", value: 61 }, { field: "icp_score", operator: "gt", value: 80 },
  ] } }],
};

describe("summarizeRule", () => {
  it("eine Bedingung → ganzer Satz mit Anker, Feld/Operator/Wert, Aktion", () => {
    expect(summarizeRule("contacts", one, "Task anlegen", null, t)).toBe("Wenn Kontakt Churn-Score ≥ 61, dann Task anlegen.");
  });
  it("Payload wird angehängt", () => {
    expect(summarizeRule("contacts", one, "Tag hinzufügen", "Hot", t)).toBe("Wenn Kontakt Churn-Score ≥ 61, dann Tag hinzufügen: „Hot“.");
  });
  it("mehrere Bedingungen → nur die erste + „(+N)“", () => {
    expect(summarizeRule("contacts", two, "Benachrichtigen", null, t)).toBe("Wenn Kontakt Churn-Score ≥ 61 (+1), dann Benachrichtigen.");
  });
});

describe("lastFiredText", () => {
  const now = Date.parse("2026-07-23T12:00:00Z");
  it("nie gefeuert → Noch nicht gefeuert", () => {
    expect(lastFiredText(null, 0, t, now)).toBe("Noch nicht gefeuert");
  });
  it("heute", () => {
    expect(lastFiredText("2026-07-23T09:00:00Z", 3, t, now)).toBe("Zuletzt heute · 3");
  });
  it("vor X Tagen", () => {
    expect(lastFiredText("2026-07-18T09:00:00Z", 5, t, now)).toBe("Zuletzt vor 5 Tagen · 5");
  });
});
