// @vitest-environment jsdom
/**
 * AppearanceTab (SET-2 UI): Nav-Einträge aus echten Prefs, „Einstellungen"-Zeile fest (Switch disabled),
 * Toggle schreibt über setNavPreferences.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k, i18n: { language: "de" } }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" }, session: null, loading: false }) }));
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "owner", loading: false, provisioningError: false }) }));
let activeModules = new Set(["ai_sdr", "hunter", "farmer"]);
vi.mock("@/hooks/useModules", () => ({ useModules: () => ({ hasModule: (m: string) => activeModules.has(m) }) }));

const setNavPreferences = vi.fn((..._a: unknown[]) => Promise.resolve());
vi.mock("@/lib/db", () => ({
  getNavPreferences: () => Promise.resolve({ hidden: [], order: ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] }),
  setNavPreferences: (..._a: unknown[]) => setNavPreferences(..._a),
}));

import AppearanceTab from "./AppearanceTab";

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><AppearanceTab /></QueryClientProvider>);
}

afterEach(() => { cleanup(); setNavPreferences.mockClear(); activeModules = new Set(["ai_sdr", "hunter", "farmer"]); });

describe("AppearanceTab", () => {
  it("zeigt die Nav-Einträge + die feste Einstellungen-Zeile", async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText("nav.meintag")).toBeTruthy());
    expect(screen.getByText("nav.settings")).toBeTruthy();
  });

  it("Einstellungen-Switch ist disabled (nicht ausblendbar)", async () => {
    renderTab();
    const settingsSwitch = await waitFor(() => screen.getByLabelText("nav.settings"));
    expect((settingsSwitch as HTMLButtonElement).disabled).toBe(true);
  });

  it("Modul-Toggle schreibt über setNavPreferences", async () => {
    renderTab();
    const meintag = await waitFor(() => screen.getByLabelText("nav.meintag"));
    fireEvent.click(meintag);
    await waitFor(() => expect(setNavPreferences).toHaveBeenCalled());
  });

  it("ENTITLEMENT: nicht gebuchtes Modul (farmer) → Hinweis + deaktivierter Toggle (nicht bedienbar)", async () => {
    activeModules = new Set(["ai_sdr", "hunter"]); // farmer NICHT gebucht
    renderTab();
    await waitFor(() => expect(screen.getByText("personal.appearance.notInPlan")).toBeTruthy());
    const farmerSwitch = screen.getByLabelText("nav.farmer") as HTMLButtonElement;
    expect(farmerSwitch.disabled).toBe(true);
    // Klick auf den deaktivierten Toggle löst KEINE Speicherung aus.
    fireEvent.click(farmerSwitch);
    expect(setNavPreferences).not.toHaveBeenCalled();
  });
});
