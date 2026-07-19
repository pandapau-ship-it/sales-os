// @vitest-environment jsdom
/**
 * TopBar (SET-2 Bugfix): die oberen Pills folgen — GENAU wie die Sidebar — beiden Ebenen:
 * Firmen-Entitlement (hasModule) UND persönliche Ansicht-Pref (hidden). Was links weg ist, ist oben weg.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// t MUSS stabil sein: TopBars Slider-useEffect hängt an t — ein neues t je Render → Endlosschleife.
vi.mock("react-i18next", () => { const t = (k: string) => k; return { useTranslation: () => ({ t }) }; });
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn(), useLocation: () => ({ pathname: "/app/meintag" }) }));
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "owner", loading: false, provisioningError: false }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" }, session: null, loading: false }) }));
let activeModules = new Set(["ai_sdr", "hunter", "farmer"]);
vi.mock("@/hooks/useModules", () => ({ useModules: () => ({ hasModule: (m: string) => activeModules.has(m) }) }));
vi.mock("@/lib/realtime", () => ({ subscribeToNotifications: () => () => {} }));

let prefs = { hidden: [] as string[], order: ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] };
vi.mock("@/lib/db", () => ({
  getUnreadNotificationCount: () => Promise.resolve(0),
  getNavPreferences: () => Promise.resolve(prefs),
}));

import TopBar from "./TopBar";

function renderTopBar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><TopBar onOpenCommandPalette={() => {}} /></QueryClientProvider>);
}

afterEach(() => {
  cleanup();
  prefs = { hidden: [], order: ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] };
  activeModules = new Set(["ai_sdr", "hunter", "farmer"]);
});

describe("TopBar folgt beiden Sichtbarkeits-Ebenen", () => {
  it("Alle vier Pills bei vollem Plan + nichts ausgeblendet", async () => {
    renderTopBar();
    await waitFor(() => expect(screen.getByText("nav.farmer")).toBeTruthy());
    expect(screen.getByText("nav.meintag")).toBeTruthy();
    expect(screen.getByText("nav.hunter")).toBeTruthy();
  });

  it("(a) ENTITLEMENT: Org OHNE Farmer + User schaltet Farmer sichtbar → Farmer-Pill erscheint NICHT", async () => {
    activeModules = new Set(["ai_sdr", "hunter"]); // farmer nicht gebucht
    prefs = { hidden: [], order: ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] }; // nicht ausgeblendet
    renderTopBar();
    await waitFor(() => expect(screen.getByText("nav.hunter")).toBeTruthy());
    expect(screen.queryByText("nav.farmer")).toBeNull();
  });

  it("(b) PERSÖNLICH: Farmer ausgeblendet → Farmer-Pill verschwindet auch oben", async () => {
    prefs = { hidden: ["farmer"], order: ["meintag", "ai-sdr", "hunter", "farmer", "kontakte", "companies"] };
    renderTopBar();
    await waitFor(() => expect(screen.queryByText("nav.farmer")).toBeNull());
    expect(screen.getByText("nav.meintag")).toBeTruthy();
  });
});
