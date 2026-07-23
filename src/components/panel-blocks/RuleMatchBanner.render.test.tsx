// @vitest-environment jsdom
/**
 * RuleMatchBanner (L-3e) — alle Deeplink-Zustände rendern die richtige Meldung:
 * laden · Ladefehler · Regel weg · keine Treffer mehr · Treffer (inkl. Hinweis auf inzwischen gelöschte).
 * i18n wird auf den Key gemappt (t gibt den Key zurück; Interpolation über einfaches Ersetzen).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// t gibt den Key zurück; count wählt _one/_other, damit die Plural-Keys sichtbar werden.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => {
      if (o && typeof o.count === "number") return `${k}${o.count === 1 ? "_one" : "_other"}:${o.count}`;
      if (o && o.name != null) return `${k}:${o.name}`;
      if (o && o.entity != null) return `${k}:${o.entity}`;
      return k;
    },
  }),
}));

import { RuleMatchBanner } from "./RuleMatchBanner";
import type { RuleMatchTargets } from "@/lib/db";

afterEach(cleanup);

const base = (o: Partial<RuleMatchTargets>): RuleMatchTargets => ({
  exists: true, name: "R", targetEntity: "contact", ids: [], matchedTotal: 0, unavailable: 0, ...o,
});

describe("RuleMatchBanner — Deeplink-Zustände (L-3e)", () => {
  it("laden → Ladehinweis", () => {
    render(<RuleMatchBanner loading error={false} state={null} entityLabelPlural="Kontakte" onClear={() => {}} />);
    expect(screen.getByText("lifecycle.deeplink.loading")).toBeTruthy();
  });

  it("Ladefehler → Fehlermeldung (kein technischer Grund)", () => {
    render(<RuleMatchBanner loading={false} error state={null} entityLabelPlural="Kontakte" onClear={() => {}} />);
    expect(screen.getByText("lifecycle.deeplink.error")).toBeTruthy();
  });

  it("Regel existiert nicht mehr → goneTitle + volle Liste (entity im Body)", () => {
    render(<RuleMatchBanner loading={false} error={false} state={base({ exists: false, name: null })} entityLabelPlural="Kontakte" onClear={() => {}} />);
    expect(screen.getByText("lifecycle.deeplink.goneTitle")).toBeTruthy();
    expect(screen.getByText("lifecycle.deeplink.goneBody:Kontakte")).toBeTruthy();
  });

  it("existiert, aber keine Treffer mehr → noMatchTitle (nicht leeres Nichts)", () => {
    render(<RuleMatchBanner loading={false} error={false} state={base({ matchedTotal: 0, ids: [] })} entityLabelPlural="Firmen" onClear={() => {}} />);
    expect(screen.getByText("lifecycle.deeplink.noMatchTitle")).toBeTruthy();
    expect(screen.getByText("lifecycle.deeplink.noMatchBody:Firmen")).toBeTruthy();
  });

  it("Treffer → matchTitle mit Name + Anzahl", () => {
    render(<RuleMatchBanner loading={false} error={false} state={base({ name: "Churn", ids: ["a", "b"], matchedTotal: 2 })} entityLabelPlural="Kontakte" onClear={() => {}} />);
    expect(screen.getByText("lifecycle.deeplink.matchTitle:Churn")).toBeTruthy();
    expect(screen.getByText(/lifecycle\.deeplink\.matchBody_other:2/)).toBeTruthy();
  });

  it("Treffer mit gelöschten → unavailable-Hinweis erscheint", () => {
    render(<RuleMatchBanner loading={false} error={false} state={base({ ids: ["a"], matchedTotal: 3, unavailable: 2 })} entityLabelPlural="Kontakte" onClear={() => {}} />);
    expect(screen.getByText(/lifecycle\.deeplink\.unavailable_other:2/)).toBeTruthy();
  });

  it("X → onClear", () => {
    const onClear = vi.fn();
    render(<RuleMatchBanner loading={false} error={false} state={base({ ids: ["a"], matchedTotal: 1 })} entityLabelPlural="Kontakte" onClear={onClear} />);
    fireEvent.click(screen.getByLabelText("lifecycle.deeplink.clear"));
    expect(onClear).toHaveBeenCalled();
  });
});
