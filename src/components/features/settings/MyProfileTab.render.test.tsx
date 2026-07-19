// @vitest-environment jsdom
/**
 * MyProfileTab (SET-2 UI): echte Profildaten, Speichern über updateMyProfile, KEINE Voice-Karte,
 * Statistik (get_profile_stats) + „Dabei seit", externer Booking-Link mit freiem Feld (E3).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// interpolierender t-Mock, damit count/date im Text prüfbar sind.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: { count?: number; date?: string }) =>
      o?.count !== undefined ? `${k}:${o.count}` : o?.date ? `${k}:${o.date}` : k,
    i18n: { language: "de" },
  }),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1", email: "a@b.de" }, session: null, loading: false }) }));
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "owner", loading: false, provisioningError: false }) }));
vi.mock("@/lib/i18n", () => ({ setLanguage: vi.fn() }));
vi.mock("@/lib/validation", () => ({ isValidUrl: () => true }));

let profile = { full_name: "Erika Muster", avatar_url: null, booking_provider: null as string | null, booking_link: null, signature: null, role: "owner", email: "a@b.de", created_at: "2026-01-15T10:00:00Z" };
const updateMyProfile = vi.fn((..._a: unknown[]) => Promise.resolve());
vi.mock("@/lib/db", () => ({
  getMyProfile: () => Promise.resolve(profile),
  updateMyProfile: (patch: unknown) => updateMyProfile(patch),
  setUserPreference: () => Promise.resolve(),
  getProfileStats: () => Promise.resolve({ contacts: 5, companies: 3 }),
}));

import MyProfileTab from "./MyProfileTab";

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MyProfileTab /></QueryClientProvider>);
}

afterEach(() => {
  cleanup(); updateMyProfile.mockClear();
  profile = { full_name: "Erika Muster", avatar_url: null, booking_provider: null, booking_link: null, signature: null, role: "owner", email: "a@b.de", created_at: "2026-01-15T10:00:00Z" };
});

describe("MyProfileTab", () => {
  it("zeigt echte Profildaten + KEINE Voice-Karte", async () => {
    renderTab();
    await waitFor(() => expect(screen.getByDisplayValue("Erika Muster")).toBeTruthy());
    expect(screen.queryByText(/voice/i)).toBeNull();
    expect(screen.queryByText(/stimme/i)).toBeNull();
  });

  it("Name ändern + Blur → updateMyProfile", async () => {
    renderTab();
    const input = await waitFor(() => screen.getByDisplayValue("Erika Muster") as HTMLInputElement);
    fireEvent.change(input, { target: { value: "Neuer Name" } });
    fireEvent.blur(input);
    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledWith({ full_name: "Neuer Name" }));
  });

  it("Statistik (Kontakte/Companies) + Dabei-seit werden angezeigt", async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText("personal.profile.statsContacts:5")).toBeTruthy());
    expect(screen.getByText("personal.profile.statsCompanies:3")).toBeTruthy();
    expect(screen.getByText(/personal\.profile\.memberSince:/)).toBeTruthy();
  });

  it("Booking-Provider 'external' → Link-Feld mit freiem Platzhalter (E3)", async () => {
    profile = { ...profile, booking_provider: "external" };
    renderTab();
    await waitFor(() =>
      expect(screen.getByPlaceholderText("personal.profile.bookingLinkExternalPlaceholder")).toBeTruthy(),
    );
  });
});
