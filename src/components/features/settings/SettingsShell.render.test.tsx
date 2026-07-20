// @vitest-environment jsdom
/**
 * SettingsShell (SET-3): Zurück-Button, vollständige Gruppen-Nav, ausgegraute Einträge
 * (nicht klickbar/fokussierbar), dezenter Verweis auf /app/profil statt „Persönlich"-Gruppe.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => { const t = (k: string) => k; return { useTranslation: () => ({ t }) }; });
const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "owner", loading: false, provisioningError: false }) }));
vi.mock("@/hooks/usePermissions", () => ({ useEffectivePermissions: () => ({ has: () => true, permissions: new Set(), loading: false }) }));
vi.mock("./TeamMembersPage", () => ({ default: () => <div>TEAM_PAGE</div> }));

import SettingsShell from "./SettingsShell";

afterEach(() => { cleanup(); navigateMock.mockClear(); });

describe("SettingsShell", () => {
  it("zeigt alle sechs Gruppen der Bauplan-IA (inkl. Mein Unternehmen, 8.B/8.E)", () => {
    render(<SettingsShell />);
    for (const g of ["organisation", "unternehmen", "arbeitsweise", "ai", "verbindungen", "system"]) {
      expect(screen.getByText(`settings.groups.${g}`), g).toBeTruthy();
    }
  });

  it("Zurück-Button führt zur vorherigen Ansicht (navigate(-1))", () => {
    render(<SettingsShell />);
    fireEvent.click(screen.getByLabelText("common.back"));
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it("Team & Rechte ist aktiv und rendert die Seite", () => {
    render(<SettingsShell />);
    expect(screen.getByText("TEAM_PAGE")).toBeTruthy();
    expect((screen.getByText("settings.nav.team") as HTMLButtonElement).disabled).toBe(false);
  });

  it("nicht gebaute Einträge sind ausgegraut: disabled UND nicht fokussierbar", () => {
    render(<SettingsShell />);
    for (const key of ["allgemein", "branding", "unternehmensprofil", "product-pricing", "regeln", "modelle", "integrationen", "status"]) {
      const btn = screen.getByText(`settings.nav.${key}`).closest("button") as HTMLButtonElement;
      expect(btn.disabled, key).toBe(true);
      expect(btn.getAttribute("tabindex"), key).toBe("-1");
    }
  });

  it("Klick auf einen ausgegrauten Eintrag wechselt die Seite NICHT", () => {
    render(<SettingsShell />);
    fireEvent.click(screen.getByText("settings.nav.allgemein").closest("button")!);
    expect(screen.getByText("TEAM_PAGE")).toBeTruthy(); // weiterhin Team-Seite
  });

  it("keine „Persönlich\"-Gruppe, aber ein Verweis auf /app/profil", () => {
    render(<SettingsShell />);
    expect(screen.queryByText("settings.groups.personal")).toBeNull();
    fireEvent.click(screen.getByText("settings.personalLink"));
    expect(navigateMock).toHaveBeenCalledWith("/app/profil");
  });
});
