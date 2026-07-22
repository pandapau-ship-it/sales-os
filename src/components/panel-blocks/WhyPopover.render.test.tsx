// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

import WhyPopover from "./WhyPopover";

beforeAll(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} };
  const P = Element.prototype as unknown as Record<string, unknown>;
  P.hasPointerCapture ||= () => false; P.setPointerCapture ||= () => {}; P.releasePointerCapture ||= () => {};
  P.scrollIntoView ||= () => {};
});
afterEach(cleanup);

describe("WhyPopover", () => {
  it("Trigger trägt aria-label; Klick zeigt Titel, Beschreibung und ECHTE Funktion (usedBy)", () => {
    render(<WhyPopover title="Churn-Warnung" description="Ab diesem Score gilt der Kunde als Risiko." usedBy="score-churn-risk" />);
    const trigger = screen.getByLabelText("settings.rules.why");
    expect(trigger).toBeTruthy();
    fireEvent.click(trigger);
    expect(screen.getByText("Churn-Warnung")).toBeTruthy();
    expect(screen.getByText("Ab diesem Score gilt der Kunde als Risiko.")).toBeTruthy();
    expect(screen.getByText("score-churn-risk")).toBeTruthy(); // echte Funktion, kein erfundener Name
    expect(screen.getByText("settings.rules.usedBy")).toBeTruthy();
  });
});
