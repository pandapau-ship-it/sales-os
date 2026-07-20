// @vitest-environment jsdom
/**
 * PublicPlaceholder: reservierte öffentliche Routen ([D21]) sind ehrlich leer, aber NIE eine
 * Sackgasse — es führt immer ein Weg zurück zur Anmeldung (Live-Test-Befund 20.07.2026).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-i18next", () => {
  const t = (k: string) => k;
  return { useTranslation: () => ({ t }) };
});

import PublicPlaceholder from "./PublicPlaceholder";

describe("PublicPlaceholder", () => {
  it("zeigt einen Weg zurück zur Anmeldung (kein Feststecken auf /invite/:token)", () => {
    render(
      <MemoryRouter initialEntries={["/invite/abc"]}>
        <PublicPlaceholder titleKey="auth.invitePlaceholderTitle" bodyKey="auth.invitePlaceholderBody" />
      </MemoryRouter>,
    );
    const link = screen.getByText("auth.toLogin").closest("a") as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/");
  });
});
