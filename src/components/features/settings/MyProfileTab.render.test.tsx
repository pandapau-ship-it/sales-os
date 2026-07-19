// @vitest-environment jsdom
/**
 * MyProfileTab (SET-2 UI): zeigt ECHTE Profildaten, speichert über updateMyProfile,
 * enthält KEINE Personal-Voice-Karte.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "de" } }),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1", email: "a@b.de" }, session: null, loading: false }) }));
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "owner", loading: false, provisioningError: false }) }));
vi.mock("@/lib/i18n", () => ({ setLanguage: vi.fn() }));
vi.mock("@/lib/validation", () => ({ isValidUrl: () => true }));

const updateMyProfile = vi.fn((..._a: unknown[]) => Promise.resolve());
vi.mock("@/lib/db", () => ({
  getMyProfile: () => Promise.resolve({ full_name: "Erika Muster", avatar_url: null, booking_provider: null, booking_link: null, signature: null, role: "owner", email: "a@b.de" }),
  updateMyProfile: (patch: unknown) => updateMyProfile(patch),
  setUserPreference: () => Promise.resolve(),
}));

import MyProfileTab from "./MyProfileTab";

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MyProfileTab /></QueryClientProvider>);
}

afterEach(() => { cleanup(); updateMyProfile.mockClear(); });

describe("MyProfileTab", () => {
  it("zeigt echte Profildaten (Name aus getMyProfile)", async () => {
    renderTab();
    await waitFor(() => expect((screen.getByDisplayValue("Erika Muster") as HTMLInputElement)).toBeTruthy());
  });

  it("KEINE Personal-Voice-Karte", async () => {
    renderTab();
    await waitFor(() => expect(screen.getByDisplayValue("Erika Muster")).toBeTruthy());
    expect(screen.queryByText(/voice/i)).toBeNull();
    expect(screen.queryByText(/stimme/i)).toBeNull();
  });

  it("Name ändern + Blur → updateMyProfile mit echtem Patch", async () => {
    renderTab();
    const input = await waitFor(() => screen.getByDisplayValue("Erika Muster") as HTMLInputElement);
    fireEvent.change(input, { target: { value: "Neuer Name" } });
    fireEvent.blur(input);
    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledWith({ full_name: "Neuer Name" }));
  });
});
