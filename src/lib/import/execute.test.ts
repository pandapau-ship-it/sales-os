import { describe, it, expect } from "vitest";
import { buildImportPlan, extractEmailDomain, type RowDecision } from "./execute";
import type { ValidatedRow } from "./types";

// Kleine Helfer, um lesbare ValidatedRow-Fixtures zu bauen.
const valid = (index: number, record = { first_name: "A", last_name: "B" }): ValidatedRow => ({
  index, record, status: "valid",
});
const dup = (index: number, level: "sicher" | "moeglich" = "sicher"): ValidatedRow => ({
  index, record: { email: `x${index}@a.de` }, status: "duplicate",
  duplicate: { level, matchType: "email", matchedId: `id${index}` },
});
const err = (index: number): ValidatedRow => ({
  index, record: {}, status: "error", errors: { first_name: "Pflichtfeld" },
});

describe("buildImportPlan — Default-Politik", () => {
  it("legt gültige Zeilen an, überspringt Duplikate und Fehler", () => {
    const plan = buildImportPlan([valid(0), dup(1), err(2)]);
    expect(plan.createCount).toBe(1);
    expect(plan.skippedDuplicate).toBe(1);
    expect(plan.skippedError).toBe(1);
    expect(plan.total).toBe(3);
    expect(plan.toCreate).toEqual([{ first_name: "A", last_name: "B" }]);
  });

  it("erhält die Datei-Reihenfolge der anzulegenden Datensätze", () => {
    const plan = buildImportPlan([
      valid(0, { first_name: "Erste", last_name: "Zeile" }),
      dup(1),
      valid(2, { first_name: "Dritte", last_name: "Zeile" }),
    ]);
    expect(plan.toCreate.map((r) => r.first_name)).toEqual(["Erste", "Dritte"]);
  });
});

describe("buildImportPlan — Pro-Zeile-Overrides", () => {
  it("trotzdem-anlegen macht aus einem Duplikat eine Anlage", () => {
    const decisions: Record<number, RowDecision> = { 1: "create" };
    const plan = buildImportPlan([valid(0), dup(1)], decisions);
    expect(plan.createCount).toBe(2);
    expect(plan.skippedDuplicate).toBe(0);
  });

  it("eine bewusst abgewählte gültige Zeile wird nicht angelegt und zählt in keiner Skip-Kategorie", () => {
    const plan = buildImportPlan([valid(0), valid(1)], { 1: "skip" });
    expect(plan.createCount).toBe(1);
    expect(plan.skippedDuplicate).toBe(0);
    expect(plan.skippedError).toBe(0);
    expect(plan.total).toBe(2);
  });

  it("Fehler-Zeilen bleiben IMMER übersprungen — ein create-Override wird ignoriert", () => {
    const plan = buildImportPlan([err(0)], { 0: "create" });
    expect(plan.createCount).toBe(0);
    expect(plan.skippedError).toBe(1);
  });
});

describe("extractEmailDomain", () => {
  it("liefert die kleingeschriebene Domain", () => {
    expect(extractEmailDomain("Anna.Meier@PayGuard.IO")).toBe("payguard.io");
  });
  it("nimmt den Teil nach dem letzten @", () => {
    expect(extractEmailDomain("weird@name@firma.de")).toBe("firma.de");
  });
  it("gibt null bei fehlender/unplausibler Adresse", () => {
    expect(extractEmailDomain(null)).toBeNull();
    expect(extractEmailDomain("")).toBeNull();
    expect(extractEmailDomain("kein-at-zeichen")).toBeNull();
    expect(extractEmailDomain("a@b")).toBeNull(); // kein Punkt
    expect(extractEmailDomain("a@fir ma.de")).toBeNull(); // Leerzeichen in der Domain
  });
});
