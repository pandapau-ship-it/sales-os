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
  updated_at: new Date().toISOString(),
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
    // Polish 4: ruhiger Gruppen-Count-Chip.
    expect(screen.getByText("· 1")).toBeTruthy();
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

  it("erneut ausgelöste Mitteilung zeigt die NEUE Zeit (updated_at), nicht die alte Erstellung", async () => {
    const now = Date.now();
    unread = [{
      ...NOTIF,
      id: "n-updated",
      title: "1 Betriebs-Job(s) nicht durchgelaufen",
      created_at: new Date(now - 13 * 60 * 60 * 1000).toISOString(), // vor 13 Stunden erstmals erstellt
      updated_at: new Date(now - 2 * 60 * 1000).toISOString(),       // vor 2 Minuten erneut ausgelöst
    }];
    renderScreen();
    await waitFor(() => expect(screen.getByText("1 Betriebs-Job(s) nicht durchgelaufen")).toBeTruthy());
    // Frische Zeit (Minuten) — NICHT die 13 Stunden alte Erst-Erstellung.
    expect(screen.getByText("notifications.time.minutesAgo")).toBeTruthy();
    expect(screen.queryByText("notifications.time.hoursAgo")).toBeNull();
  });

  it("lange, mehrzeilige Beschreibung wird VOLLSTÄNDIG angezeigt — keine Kürzung (truncate)", async () => {
    const longBody =
      "• Der tägliche Check ist nicht durchgelaufen.\n  Vermutung: Die Datenbank war kurz nicht erreichbar.\n  Bedeutung: Die Hinweise könnten veraltet sein, bis der nächste Lauf erfolgreich ist.";
    unread = [{ ...NOTIF, id: "n-long", title: "7 Betriebs-Job(s) nicht durchgelaufen", body: longBody }];
    renderScreen();
    await waitFor(() => expect(screen.getByText("7 Betriebs-Job(s) nicht durchgelaufen")).toBeTruthy());
    // Der wichtige, zuvor abgeschnittene Teil (Vermutung + Bedeutung) ist tatsächlich im DOM.
    const bodyEl = screen.getByText(/Bedeutung: Die Hinweise könnten veraltet sein/);
    expect(bodyEl.textContent).toContain("Vermutung");
    // Die Beschreibungs-Zeile hat KEIN truncate mehr, sondern umbricht vollständig.
    expect(bodyEl.className).not.toContain("truncate");
    expect(bodyEl.className).toContain("break-words");
  });

  it("Alle-als-gelesen ruft die Mutation", async () => {
    unread = [NOTIF];
    renderScreen();
    await waitFor(() => expect(screen.getByText("Freigabe angefragt")).toBeTruthy());
    fireEvent.click(screen.getByText("notifications.markAllRead"));
    await waitFor(() => expect(markAll).toHaveBeenCalledTimes(1));
  });
});
