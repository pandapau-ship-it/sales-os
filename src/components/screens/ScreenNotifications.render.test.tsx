// @vitest-environment jsdom
/**
 * Render-Test (jsdom): Mitteilungsseite N-S2 — Standardansicht zeigt Ungelesenes in korrekter Gruppe,
 * Klick markiert gelesen + navigiert, „Alle als gelesen" ruft die Mutation, leere Liste → EmptyState
 * (kein Fehler, deckt auch Demo-Modus ohne Session ab).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "member", loading: false }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" }, session: null, loading: false }) }));
vi.mock("@/lib/realtime", () => ({ subscribeToNotifications: () => () => {} }));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

// Steuerbarer Datensatz je Modus.
let unread: unknown[] = [];
const markRead = vi.fn((..._a: unknown[]) => Promise.resolve());
const markAll = vi.fn((..._a: unknown[]) => Promise.resolve());
vi.mock("@/lib/db", () => ({
  getNotifications: (_org: string, mode: string) => Promise.resolve(mode === "unread" ? unread : []),
  markNotificationRead: (...a: unknown[]) => markRead(...(a as [])),
  markAllNotificationsRead: (...a: unknown[]) => markAll(...(a as [])),
}));

import ScreenNotifications from "./ScreenNotifications";

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/app/notifications"]}>
        <ScreenNotifications />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const NOTIF = {
  id: "n1",
  category: "approval", // → Gruppe braucht_dich
  severity: "high",
  title: "Freigabe angefragt",
  body: "Bitte prüfen",
  link: "/app/x",
  source_type: "approval_requests",
  source_id: "req-1",
  read_at: null,
  created_at: new Date().toISOString(),
};

describe("ScreenNotifications — Live-DOM", () => {
  beforeEach(() => { unread = []; navigateMock.mockClear(); markRead.mockClear(); markAll.mockClear(); });
  afterEach(() => cleanup());

  it("leere Standardansicht → EmptyState (kein Fehler; deckt Demo-Modus ab)", async () => {
    renderScreen();
    await waitFor(() => expect(screen.getAllByText("notifications.empty").length).toBeGreaterThan(0));
  });

  it("ungelesene Mitteilung erscheint in korrekter Gruppe (braucht_dich)", async () => {
    unread = [NOTIF];
    renderScreen();
    await waitFor(() => expect(screen.getByText("Freigabe angefragt")).toBeTruthy());
    // Gruppen-Label der richtigen Gruppe.
    expect(screen.getByText("notifications.groups.braucht_dich")).toBeTruthy();
  });

  it("Klick auf Zeile → markiert gelesen + navigiert zum link", async () => {
    unread = [NOTIF];
    renderScreen();
    await waitFor(() => expect(screen.getByText("Freigabe angefragt")).toBeTruthy());
    fireEvent.click(screen.getByText("Freigabe angefragt"));
    await waitFor(() => expect(markRead).toHaveBeenCalledTimes(1));
    expect(markRead.mock.calls[0][0]).toBe("n1");
    expect(navigateMock).toHaveBeenCalledWith("/app/x");
  });

  it("Alle-als-gelesen ruft die Mutation", async () => {
    unread = [NOTIF];
    renderScreen();
    await waitFor(() => expect(screen.getByText("Freigabe angefragt")).toBeTruthy());
    fireEvent.click(screen.getByText("notifications.markAllRead"));
    await waitFor(() => expect(markAll).toHaveBeenCalledTimes(1));
  });
});
