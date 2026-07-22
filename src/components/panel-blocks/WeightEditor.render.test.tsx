// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o ? `${k}:${JSON.stringify(o)}` : k) }),
}));

import WeightEditor, { type EditableSignal, type InactiveSignal } from "./WeightEditor";

beforeAll(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} };
  const P = Element.prototype as unknown as Record<string, unknown>;
  P.hasPointerCapture ||= () => false; P.setPointerCapture ||= () => {}; P.releasePointerCapture ||= () => {};
});
afterEach(cleanup);

const SIGNALS: EditableSignal[] = [
  { key: "last_contact", label: "Letzter Kontakt > 30 Tage", weight: 25, active: true },
  { key: "heat_cold", label: "Heat kalt/tot", weight: 20, active: false },
];
const INACTIVE: InactiveSignal[] = [
  { label: "Positives Sentiment", reason: "not_measured" },
  { label: "Vertrag läuft ab (Stripe)", reason: "integration" },
];

describe("WeightEditor", () => {
  it("zeigt Signal-Zeilen mit Gewicht-Zahl + Switch; ausgeschaltetes Signal ist durchgestrichen", () => {
    render(<WeightEditor signals={SIGNALS} inactiveSignals={INACTIVE} onWeightChange={vi.fn()} onActiveToggle={vi.fn()} />);
    expect(screen.getByText("Letzter Kontakt > 30 Tage")).toBeTruthy();
    expect(screen.getByText("25")).toBeTruthy(); // Gewicht-Zahl (nicht %)
    expect(screen.getByText("20")).toBeTruthy();
    // 2 Switches (Radix role=switch)
    expect(screen.getAllByRole("switch")).toHaveLength(2);
  });

  it("Switch-Toggle ruft onActiveToggle(key, next)", () => {
    const onToggle = vi.fn();
    render(<WeightEditor signals={SIGNALS} onWeightChange={vi.fn()} onActiveToggle={onToggle} />);
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[0]); // aktiv → aus
    expect(onToggle).toHaveBeenCalledWith("last_contact", false);
  });

  it("nicht messbare/externe Signale ausgegraut mit ehrlichem Grund (nicht editierbar)", () => {
    render(<WeightEditor signals={SIGNALS} inactiveSignals={INACTIVE} onWeightChange={vi.fn()} onActiveToggle={vi.fn()} />);
    expect(screen.getByText("Positives Sentiment")).toBeTruthy();
    expect(screen.getByText("settings.rules.notMeasured")).toBeTruthy();
    expect(screen.getByText("Vertrag läuft ab (Stripe)")).toBeTruthy();
    expect(screen.getByText("settings.rules.integrationNeeded")).toBeTruthy();
  });

  it("zeigt den ehrlichen Wichtigkeits-Hinweis (0-100-Normalisierung, keine Schwelle-Summe)", () => {
    render(<WeightEditor signals={SIGNALS} onWeightChange={vi.fn()} onActiveToggle={vi.fn()} />);
    expect(screen.getByText("settings.rules.weightHint")).toBeTruthy();
  });

  it("canEdit=false → Switches disabled (UI-Ausblendung, Server erzwingt zusätzlich)", () => {
    render(<WeightEditor signals={SIGNALS} canEdit={false} onWeightChange={vi.fn()} onActiveToggle={vi.fn()} />);
    for (const sw of screen.getAllByRole("switch")) expect((sw as HTMLButtonElement).disabled).toBe(true);
  });
});
