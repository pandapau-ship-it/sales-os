// @vitest-environment jsdom
/**
 * Team & Rechte — Mitglieder-Zeile: die drei Verbesserungen am gerenderten UI.
 * (1) Zeile hat Hover-Hintergrund · (2) expliziter „Rechte anzeigen"-Knopf je Zeile ·
 * (3) Rollen-Badge NUR bei „Owner" farbig (info-Token), alle anderen neutral/grau (muted).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => {
  const t = (k: string, o?: unknown) =>
    o && typeof o === "object" ? `${k}:${JSON.stringify(o)}` : k;
  return { useTranslation: () => ({ t }) };
});
vi.mock("@/hooks/useCurrentOrg", () => ({
  useCurrentOrg: () => ({ organizationId: "org1", role: "member", loading: false, provisioningError: false }),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u-self" }, session: null, loading: false }) }));
vi.mock("@/hooks/usePermissions", () => ({
  useEffectivePermissions: () => ({ has: () => false, permissions: new Set(), loading: false }),
}));
vi.mock("@/hooks/useHoverPrefetch", () => ({ useHoverPrefetch: () => () => ({}) }));
vi.mock("@/lib/prefetch", () => ({ prefetchMemberPanel: vi.fn() }));
vi.mock("@/components/shared/toastContext", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const MEMBERS = [
  { id: "u-owner", full_name: "Olivia Owner", email: "owner@x.io", role: "owner", created_at: "2026-01-01", status: "active", last_seen_at: null },
  { id: "u-member", full_name: "Max Member", email: "member@x.io", role: "member", created_at: "2026-01-01", status: "active", last_seen_at: null },
];

vi.mock("@/lib/db", () => ({
  getTeamMembers: () => Promise.resolve(MEMBERS),
  getInvitations: () => Promise.resolve([]),
  createInvitation: vi.fn(), deleteInvitation: vi.fn(), updateUserRole: vi.fn(),
  deactivateMember: vi.fn(), reactivateMember: vi.fn(), removeMember: vi.fn(),
}));

import TeamMembersPage from "./TeamMembersPage";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TeamMembersPage />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);
beforeEach(() => {});

describe("TeamMembersPage — Mitglieder-Zeile", () => {
  it("jede Zeile hat einen expliziten Rechte-anzeigen-Knopf (Klickbarkeit sichtbar)", async () => {
    renderPage();
    const btns = await screen.findAllByLabelText("settings.members.viewPermissions");
    expect(btns).toHaveLength(2); // je Mitglied ein Knopf
  });

  it("Mitglieder-Zeilen tragen den bestehenden Hover-Hintergrund (hover:bg-app-bg)", async () => {
    renderPage();
    const btn = (await screen.findAllByLabelText("settings.members.viewPermissions"))[0];
    const row = btn.closest("div.flex.items-center") as HTMLElement;
    expect(row.className).toContain("hover:bg-app-bg");
  });

  it("NUR Owner bekommt einen farbigen Badge (info-Token); andere Rollen neutral/grau", async () => {
    renderPage();
    const owner = await screen.findByText("settings.team.roleOwner");
    const member = screen.getByText("settings.team.roleMember");
    const ownerBg = owner.getAttribute("style") ?? "";
    const memberBg = member.getAttribute("style") ?? "";
    expect(ownerBg).toContain("signal-info");        // dezent farbig, wiederverwendetes Token
    expect(memberBg).not.toContain("signal-info");   // neutral/grau, nicht farbig
    expect(ownerBg).not.toEqual(memberBg);
  });
});
