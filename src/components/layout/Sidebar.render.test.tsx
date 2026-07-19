// @vitest-environment jsdom
/**
 * Sidebar (SET-2 Bugfix): liest die Ansicht-Prefs (user_preferences) — ausgeblendete Module
 * erscheinen NICHT, die Reihenfolge folgt der Pref. Reproduziert den Live-Bug (Toggle wirkte nicht).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn(), useLocation: () => ({ pathname: "/app/meintag" }) }));
vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }) }));
let activeModules = new Set(["ai_sdr", "hunter", "farmer"]);
vi.mock("@/hooks/useModules", () => ({ useModules: () => ({ hasModule: (m: string) => activeModules.has(m) }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1", email: "a@b.de" }, session: null, loading: false }) }));
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "owner", loading: false, provisioningError: false }) }));
vi.mock("@/lib/auth", () => ({ signOut: vi.fn() }));

let prefs = { hidden: [] as string[], order: ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] };
vi.mock("@/lib/db", () => ({ getNavPreferences: () => Promise.resolve(prefs) }));

import Sidebar from "./Sidebar";

function renderSidebar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><Sidebar /></QueryClientProvider>);
}

afterEach(() => {
  cleanup();
  prefs = { hidden: [], order: ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] };
  activeModules = new Set(["ai_sdr", "hunter", "farmer"]);
});

describe("Sidebar liest Ansicht-Prefs", () => {
  it("ausgeblendetes Modul (farmer) erscheint NICHT, sichtbare bleiben", async () => {
    prefs = { hidden: ["farmer"], order: ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] };
    renderSidebar();
    // Auf den aufgelösten Prefs-Query warten (farmer verschwindet).
    await waitFor(() => expect(screen.queryByLabelText("nav.farmer")).toBeNull());
    expect(screen.getByLabelText("nav.meintag")).toBeTruthy();
    expect(screen.getByLabelText("nav.hunter")).toBeTruthy();
  });

  it("ENTITLEMENT: Org OHNE Farmer-Modul + User schaltet Farmer sichtbar → Farmer erscheint TROTZDEM NICHT", async () => {
    activeModules = new Set(["ai_sdr", "hunter"]); // farmer NICHT gebucht
    prefs = { hidden: [], order: ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] }; // farmer NICHT ausgeblendet (User will es sehen)
    renderSidebar();
    await waitFor(() => expect(screen.getByLabelText("nav.hunter")).toBeTruthy());
    // Persönliche Präferenz „sichtbar" darf das fehlende Firmen-Entitlement NICHT überschreiben.
    expect(screen.queryByLabelText("nav.farmer")).toBeNull();
  });

  it("Reihenfolge folgt der Pref (companies vor meintag)", async () => {
    prefs = { hidden: [], order: ["companies", "meintag", "ai-sdr", "hunter", "farmer", "kontakte"] };
    renderSidebar();
    await waitFor(() => {
      const companies = screen.getByLabelText("nav.companies");
      const meintag = screen.getByLabelText("nav.meintag");
      expect(companies.compareDocumentPosition(meintag) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});
