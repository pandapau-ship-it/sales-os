// @vitest-environment jsdom
/**
 * ConditionRow (FUND 2) — der Wert-Eingabe-Typ passt zum Operator:
 * enum + in/not_in → Mehrfachauswahl (string[]) · text/number in/not_in + tags has_any → Chip-Eingabe (Array) ·
 * enum + eq → Einzel-Select (Skalar). Plus: leere Liste + markInvalid → rote Markierung.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

import ConditionRow from "./ConditionRow";
import type { FilterRule } from "@/lib/filter/types";

beforeAll(() => {
  const P = Element.prototype as unknown as Record<string, unknown>;
  P.hasPointerCapture ||= () => false; P.setPointerCapture ||= () => {}; P.releasePointerCapture ||= () => {}; P.scrollIntoView ||= () => {};
});
afterEach(cleanup);

function row(rule: Partial<FilterRule>, extra: Record<string, unknown> = {}) {
  const onChange = vi.fn();
  render(<ConditionRow entity="contacts" rule={rule as FilterRule} isFirst groupLogic="AND" onChange={onChange} onRemove={() => {}} {...extra} />);
  return { onChange };
}

describe("ConditionRow — Wert-Eingabe passt zum Operator (FUND 2)", () => {
  it("enum + in → Mehrfachauswahl (kein Einzel-Select)", () => {
    row({ field: "heat_status", operator: "in", value: undefined });
    expect(screen.getByText("lifecycle.ui.multiSelectPlaceholder")).toBeTruthy();
    expect(screen.queryByText("lifecycle.ui.valuePlaceholder")).toBeNull();
  });

  it("enum + in → Auswahl speichert ein Array (string[])", () => {
    const { onChange } = row({ field: "heat_status", operator: "in", value: [] });
    fireEvent.click(screen.getByText("lifecycle.ui.multiSelectPlaceholder")); // Popover öffnen
    fireEvent.click(screen.getByText("lifecycle.enum.heat_status.kalt")); // single-source-ok: i18n-Key-String (enum-Label), kein Kontakt-Roh-Zugriff
    expect(onChange).toHaveBeenCalledWith({ value: ["kalt"] });
  });

  it("enum + eq → Einzel-Select (Skalar), keine Mehrfachauswahl", () => {
    row({ field: "heat_status", operator: "eq", value: undefined });
    expect(screen.getByText("lifecycle.ui.valuePlaceholder")).toBeTruthy();
    expect(screen.queryByText("lifecycle.ui.multiSelectPlaceholder")).toBeNull();
  });

  it("number + in → Chip-Eingabe speichert Zahl-Array", () => {
    const { onChange } = row({ field: "icp_score", operator: "in", value: [] });
    const input = screen.getByPlaceholderText("lifecycle.ui.chipPlaceholder");
    fireEvent.change(input, { target: { value: "61" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith({ value: [61] });
  });

  it("tags + has_any → Chip-Eingabe speichert String-Array", () => {
    const { onChange } = row({ field: "tags", operator: "has_any", value: [] });
    const input = screen.getByPlaceholderText("lifecycle.ui.chipPlaceholder");
    fireEvent.change(input, { target: { value: "vip" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith({ value: ["vip"] });
  });

  it("leere Liste + markInvalid → Wert-Eingabe rot markiert", () => {
    row({ field: "heat_status", operator: "in", value: [] }, { markInvalid: true });
    const trigger = screen.getByText("lifecycle.ui.multiSelectPlaceholder").closest("button")!;
    expect(trigger.className).toContain("border-signal-urgent");
  });
});
