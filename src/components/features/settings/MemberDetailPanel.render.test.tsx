// @vitest-environment jsdom
/**
 * MemberDetailPanel (SET-3): Einzelrechte sind DATENGETRIEBEN — jedes Recht aus dem Katalog
 * erscheint automatisch (kein hartkodiertes UI). Rollen-Rechte sind sichtbar aber fest;
 * ein echtes Einzelrecht ist schaltbar und schreibt über grant_permission.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PERMISSIONS } from "@/lib/permissions";

vi.mock("react-i18next", () => {
  const t = (k: string, d?: unknown) => (typeof d === "string" ? d : k);
  return { useTranslation: () => ({ t }) };
});
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "owner", loading: false, provisioningError: false }) }));
vi.mock("@/components/shared/toastContext", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const grantPermission = vi.fn((..._a: unknown[]) => Promise.resolve());
const revokePermission = vi.fn((..._a: unknown[]) => Promise.resolve());
vi.mock("@/lib/db", () => ({
  getEffectivePermissions: () => Promise.resolve(["team.invite"]), // Rollen-Recht eines Members
  grantPermission: (...a: unknown[]) => grantPermission(...(a as [])),
  revokePermission: (...a: unknown[]) => revokePermission(...(a as [])),
  getMemberAuditLog: () => Promise.resolve([]),
}));

// Schwere Shell-Bausteine leichtgewichtig stubben (Testziel ist die Rechte-Liste).
vi.mock("@/components", () => ({
  InfoPanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Avatar: () => <div />,
  SettingsCard: ({ title, children }: { title: string; children: React.ReactNode }) => <section><h3>{title}</h3>{children}</section>,
  StatusBadge: ({ label }: { label: string }) => <span>{label}</span>,
}));

import MemberDetailPanel from "./MemberDetailPanel";

const MEMBER = { id: "u2", full_name: "Erika Muster", email: "e@t.local", role: "member", status: "active" };

function renderPanel(role = "member") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemberDetailPanel member={{ ...MEMBER, role }} onClose={() => {}} />
    </QueryClientProvider>,
  );
}

afterEach(() => { cleanup(); grantPermission.mockClear(); revokePermission.mockClear(); });

describe("MemberDetailPanel — Einzelrechte datengetrieben", () => {
  it("rendert JEDES Recht aus dem Katalog (PERMISSIONS.map) — ohne UI-Code je Recht", async () => {
    renderPanel();
    // Genau ein Schalter pro Katalog-Recht → ein neues Recht erscheint automatisch mit.
    const switches = await screen.findAllByRole("switch");
    expect(switches.length).toBe(PERMISSIONS.length);
    // …und jedes Recht ist über sein Label auffindbar (aria-label = Klartext des Rechts).
    for (const p of PERMISSIONS) {
      expect(screen.getAllByRole("switch").some((s) => s.getAttribute("aria-label")), p).toBe(true);
    }
  });

  it("Owner-Ansicht: Rollen-Rechte sind disabled (v1 rein additiv)", async () => {
    renderPanel("owner"); // owner hat ALLE Rechte aus der Rolle
    const switches = await screen.findAllByRole("switch");
    expect(switches.every((s) => (s as HTMLButtonElement).disabled)).toBe(true);
  });

  it("echtes Einzelrecht schalten → grant_permission (danach invalidateQueries, kein Reload)", async () => {
    renderPanel("viewer"); // viewer hat keine Rollen-Rechte → alle Schalter frei
    const switches = await screen.findAllByRole("switch");
    fireEvent.click(switches[0]);
    await waitFor(() => expect(grantPermission).toHaveBeenCalled());
  });
});
