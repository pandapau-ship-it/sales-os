// @vitest-environment jsdom
/**
 * Regressionstest N-S2: ScreenNotifications mit ECHTEM i18n (nicht Mock-t) + realistischen Daten
 * (alle 4 Kategorien, gemischte Severities, teils link:null, echter Timestamp — exakt wie live geseedet).
 * Fängt Render-Crashes ab, die der mock-i18n-Render-Test verdeckt (Interpolation/Plural/echte Keys).
 * (Der ursprüngliche weiße-Seite-Bug lag NICHT hier, sondern in der Realtime-Subscription —
 *  siehe realtime.test.ts. Dieser Test hält den Render-Pfad zusätzlich abgesichert.)
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// localStorage-Polyfill VOR dem i18n-Import (jsdom hat es in dieser Suite nicht; der Browser schon).
const store: Record<string, string> = {};
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  key: () => null,
  length: 0,
};
await import("@/lib/i18n"); // echtes i18n synchron initialisieren

vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "member", loading: false }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" }, session: null, loading: false }) }));
vi.mock("@/lib/realtime", () => ({ subscribeToNotifications: () => () => {} }));

const now = new Date().toISOString();
const FOUR = [
  { id: "1", category: "approval", severity: "high", title: "Freigabe", body: "b", link: "/app/kontakte", source_type: "approval_requests", source_id: "a", read_at: null, created_at: now },
  { id: "2", category: "system_alert", severity: "urgent", title: "Cron", body: "b", link: null, source_type: "system_alerts", source_id: "b", read_at: null, created_at: now },
  { id: "3", category: "report", severity: "normal", title: "Bericht", body: "b", link: "/app/hunter", source_type: "cron_runs", source_id: "c", read_at: null, created_at: now },
  { id: "4", category: "team", severity: "normal", title: "Team", body: null, link: null, source_type: "invitations", source_id: "d", read_at: null, created_at: now },
];
vi.mock("@/lib/db", () => ({
  getNotifications: (_o: string, mode: string) => Promise.resolve(mode === "unread" ? FOUR : []),
  markNotificationRead: () => Promise.resolve(),
  markAllNotificationsRead: () => Promise.resolve(),
}));

import ScreenNotifications from "./ScreenNotifications";

describe("ScreenNotifications — echte Daten + echtes i18n", () => {
  afterEach(() => cleanup());
  it("rendert 4 Items über 4 Gruppen ohne Crash", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={["/app/notifications"]}>
          <ScreenNotifications />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText("Freigabe")).toBeTruthy());
    expect(screen.getByText("Cron")).toBeTruthy();
    expect(screen.getByText("Bericht")).toBeTruthy(); // (nicht „Team": kollidiert mit dem Gruppen-Label „Team")
  });
});
