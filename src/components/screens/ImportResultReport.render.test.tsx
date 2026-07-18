// @vitest-environment jsdom
/**
 * Render-Test (jsdom + Testing Library): beweist die In-Place-Transformation der Import-
 * Ergebnis-Karte nach erfolgreichem Undo — Headline/Subtext/Stat-Kachel/Button-Zustand.
 * Honesty-Kern: nach Undo darf „NEU ERSTELLT" nicht mehr den alten Wert als gültig zeigen.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";

// t(key) → key; interpolierte Werte sind hier egal (wir prüfen die Zustandslogik).
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

import { ImportResultReport } from "./ScreenKontakteImport";

const RESULT = { batchId: "b1", created: 1, skipped: 3, failed: 0 };

describe("ImportResultReport — Undo-Transformation (Live-DOM)", () => {
  afterEach(() => cleanup());

  it("Erfolgs-Zustand (undone=false): doneTitle, echter created-Wert, Undo-Button", () => {
    render(<ImportResultReport result={RESULT} undone={false} onExit={() => {}} onRequestUndo={() => {}} />);
    expect(screen.getByText("import.doneTitle")).toBeTruthy();
    expect(screen.getByText("import.doneDesc")).toBeTruthy();
    // created = 1 sichtbar, nicht durchgestrichen.
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.queryByText("import.undoneTitle")).toBeNull();
    // Undo-Aktion vorhanden, keine „erledigt"-Bestätigung.
    expect(screen.getByRole("button", { name: /import\.undo/ })).toBeTruthy();
    // Post-Import AI-Chat-CTA: Titel sichtbar, Button vorhanden ABER deaktiviert, Coming-soon-Tooltip.
    expect(screen.getByText("import.aichatCtaTitle")).toBeTruthy();
    const cta = screen.getByRole("button", { name: /import\.aichatCtaButton/ });
    expect((cta as HTMLButtonElement).disabled).toBe(true);
    expect(cta.closest("[data-tip]")?.getAttribute("data-tip")).toBe("import.aichatComingSoon");
  });

  it("Undo-Zustand (undone=true): undoneTitle, created durchgestrichen + 0, kein Undo-Button", () => {
    render(<ImportResultReport result={RESULT} undone={true} onExit={() => {}} onRequestUndo={() => {}} />);
    // 1) Headline + 2) Subtext transformiert.
    expect(screen.getByText("import.undoneTitle")).toBeTruthy();
    expect(screen.getByText("import.undoneDesc")).toBeTruthy();
    expect(screen.queryByText("import.doneTitle")).toBeNull();

    // 3) „NEU ERSTELLT"-Kachel: alter Wert 1 durchgestrichen (line-through) + „0" daneben.
    const oldVal = screen.getByText("1");
    expect(oldVal.className).toContain("line-through");
    const createdCell = oldVal.closest("div")!.parentElement!; // Kachel-Wrapper
    expect(within(createdCell).getByText("0")).toBeTruthy();
    // Übersprungen unverändert (Wert stimmt weiter).
    expect(screen.getByText("3")).toBeTruthy();

    // 4) Kein zweiter Undo möglich — Button verschwunden, statt dessen Bestätigung.
    expect(screen.queryByRole("button", { name: /import\.undo/ })).toBeNull();
    expect(screen.getByText("import.undoDone")).toBeTruthy();

    // 5) „Zu den Kontakten" bleibt einzige Aktion.
    expect(screen.getByRole("button", { name: "import.toContacts" })).toBeTruthy();
    // 6) Kein AI-Chat-CTA nach Undo (nur im Erfolgsfall).
    expect(screen.queryByText("import.aichatCtaTitle")).toBeNull();
    expect(screen.queryByRole("button", { name: /import\.aichatCtaButton/ })).toBeNull();
  });
});
