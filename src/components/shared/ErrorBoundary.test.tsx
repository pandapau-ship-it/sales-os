// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  afterEach(() => cleanup());

  it("zeigt Fallback-UI statt weißer Seite, wenn ein Kind wirft", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {}); // React-Fehler-Log unterdrücken
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("errors.boundary.title")).toBeTruthy();
    expect(screen.getByRole("button", { name: "errors.boundary.reload" })).toBeTruthy();
    spy.mockRestore();
  });

  it("rendert Kinder normal, wenn nichts wirft", () => {
    render(
      <ErrorBoundary>
        <div>ok-content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("ok-content")).toBeTruthy();
  });
});
