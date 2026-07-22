// @vitest-environment jsdom
/** RuleRow — Klartext-Regel-Zeile: Satz + anklickbarer Wert, Popover-Editor mit Min/Max. */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
import RuleRow from "./RuleRow";

beforeAll(() => {
  // Radix braucht diese in jsdom:
  const p = Element.prototype as unknown as Record<string, unknown>;
  p.hasPointerCapture ??= () => false;
  p.setPointerCapture ??= () => {};
  p.releasePointerCapture ??= () => {};
  p.scrollIntoView ??= () => {};
});
afterEach(cleanup);

describe("RuleRow", () => {
  it("rendert den Satz + Wert (mit Einheit)", () => {
    render(<RuleRow before="Kontakt gilt als inaktiv nach" after="Tagen" value={14} unit="Tage" min={1} max={365} onSave={vi.fn()} />);
    expect(screen.getByText("Kontakt gilt als inaktiv nach")).toBeTruthy();
    expect(screen.getByText("Tagen")).toBeTruthy();
    // Chip = ValueChip-Button, per Kontext-aria-label (before+after) auffindbar; Wert sichtbar.
    expect(screen.getByRole("button", { name: "Kontakt gilt als inaktiv nach Tagen" })).toBeTruthy();
    expect(screen.getByText("14")).toBeTruthy();
  });

  it("valueFirst → Chip vor dem Satz-Teil", () => {
    render(<RuleRow valueFirst before="Stunden gilt ein Signal als frisch." value={24} min={1} max={168} onSave={vi.fn()} />);
    expect(screen.getByText("Stunden gilt ein Signal als frisch.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stunden gilt ein Signal als frisch." })).toBeTruthy();
    expect(screen.getByText("24")).toBeTruthy();
  });

  it("canEdit=false → statischer Wert, kein Button", () => {
    render(<RuleRow before="X" value={5} unit="%" min={0} max={100} canEdit={false} onSave={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("%")).toBeTruthy();
  });

  it("leerer Wert → Platzhalter", () => {
    render(<RuleRow before="X" value={null} min={1} max={10} canEdit={false} placeholder="—" onSave={vi.fn()} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("Klick öffnet Editor; ungültig (außer Bereich) speichert NICHT, gültig ruft onSave", async () => {
    const onSave = vi.fn();
    render(<RuleRow before="Inaktiv nach" after="Tagen" value={14} unit="Tage" min={1} max={365} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Inaktiv nach Tagen" }));
    const input = await screen.findByRole("spinbutton");
    // 999 > max → kein Save
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.click(screen.getByText("common.save"));
    expect(onSave).not.toHaveBeenCalled();
    // 20 gültig → Save
    fireEvent.change(input, { target: { value: "20" } });
    fireEvent.click(screen.getByText("common.save"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(20));
  });

  // ── SET-4a-Erweiterung: Reset-pro-Regel + Why-Slot ──
  it("recommended != value → Reset-Knopf da; Klick ruft onSave(recommended)", () => {
    const onSave = vi.fn();
    render(<RuleRow before="Warnung ab Score" value={70} min={10} max={100} recommended={61} onSave={onSave} />);
    fireEvent.click(screen.getByLabelText("settings.rules.reset"));
    expect(onSave).toHaveBeenCalledWith(61);
  });

  it("recommended == value → KEIN Reset-Knopf", () => {
    render(<RuleRow before="Warnung ab Score" value={61} min={10} max={100} recommended={61} onSave={vi.fn()} />);
    expect(screen.queryByLabelText("settings.rules.reset")).toBeNull();
  });

  it("canEdit=false → kein Reset (UI blendet aus; Server erzwingt)", () => {
    render(<RuleRow before="X" value={70} min={0} max={100} recommended={61} canEdit={false} onSave={vi.fn()} />);
    expect(screen.queryByLabelText("settings.rules.reset")).toBeNull();
  });

  it("why-Slot wird gerendert (z.B. WhyPopover)", () => {
    render(<RuleRow before="X" value={1} min={0} max={10} why={<span data-testid="why-slot">?</span>} onSave={vi.fn()} />);
    expect(screen.getByTestId("why-slot")).toBeTruthy();
  });
});
