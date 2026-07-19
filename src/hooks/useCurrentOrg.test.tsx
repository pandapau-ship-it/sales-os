// @vitest-environment jsdom
/**
 * useCurrentOrg ([D21]): Provisioning-Fehler (eingeloggt, aber keine users-Row) wird sichtbar
 * gemacht statt still auf die Demo-Org auszuweichen. Kein User → kein Fehler (Demo-Fallback).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let mockUser: { id: string } | null = { id: "u1" };
vi.mock("./useAuth", () => ({ useAuth: () => ({ user: mockUser, session: null, loading: false }) }));

let orgRow: { organization_id: string; role: string } | null = null;
vi.mock("@/lib/db", () => ({ getUserOrgRole: () => Promise.resolve(orgRow) }));

import { useCurrentOrg } from "./useCurrentOrg";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

afterEach(() => { cleanup(); mockUser = { id: "u1" }; orgRow = null; });

describe("useCurrentOrg — provisioningError", () => {
  it("eingeloggt, KEINE users-Row → provisioningError true", async () => {
    orgRow = null;
    const { result } = renderHook(() => useCurrentOrg(), { wrapper });
    await waitFor(() => expect(result.current.provisioningError).toBe(true));
  });
  it("eingeloggt, users-Row vorhanden → kein Fehler, echte Org/Rolle", async () => {
    orgRow = { organization_id: "org-real", role: "owner" };
    const { result } = renderHook(() => useCurrentOrg(), { wrapper });
    await waitFor(() => expect(result.current.organizationId).toBe("org-real"));
    expect(result.current.provisioningError).toBe(false);
    expect(result.current.role).toBe("owner");
  });
  it("kein User (Demo) → kein Provisioning-Fehler", () => {
    mockUser = null;
    const { result } = renderHook(() => useCurrentOrg(), { wrapper });
    expect(result.current.provisioningError).toBe(false);
  });
});
