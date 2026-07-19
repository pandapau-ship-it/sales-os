// @vitest-environment jsdom
/**
 * SecurityTab (SET-2 UI): echte SSO-Anzeige (getUserIdentities), Passwort-Mismatch zeigt Fehler,
 * gültige Änderung verifiziert aktuelles PW (signInWithEmail) und ruft updatePassword.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k, i18n: { language: "de" } }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1", email: "a@b.de" }, session: null, loading: false }) }));

const signInWithEmail = vi.fn(() => Promise.resolve({ error: null }));
const updatePassword = vi.fn(() => Promise.resolve({ error: null }));
vi.mock("@/lib/auth", () => ({
  signInWithEmail: (...a: unknown[]) => signInWithEmail(...(a as [])),
  updatePassword: (...a: unknown[]) => updatePassword(...(a as [])),
  getUserIdentities: () => Promise.resolve(["google"]),
}));

import SecurityTab from "./SecurityTab";

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><SecurityTab /></QueryClientProvider>);
}
const pwInputs = (c: HTMLElement) => Array.from(c.querySelectorAll("input")) as HTMLInputElement[];

afterEach(() => { cleanup(); signInWithEmail.mockClear(); updatePassword.mockClear(); });

describe("SecurityTab", () => {
  it("zeigt verbundene SSO (Google) + nicht verbundene (Microsoft)", async () => {
    renderTab();
    // Erst warten, bis die Identities geladen sind (Google = verbunden), sonst sind beide „nicht verbunden".
    await waitFor(() => expect(screen.getByText("personal.security.connected")).toBeTruthy());
    expect(screen.getByText("Google Workspace")).toBeTruthy();
    expect(screen.getByText("Microsoft 365")).toBeTruthy();
    expect(screen.getByText("personal.security.notConnected")).toBeTruthy();
  });

  it("Passwörter ungleich → Fehler, kein Auth-Call", async () => {
    const { container } = renderTab();
    const [cur, nw, conf] = pwInputs(container);
    fireEvent.change(cur, { target: { value: "altpasswort" } });
    fireEvent.change(nw, { target: { value: "neuespasswort1" } });
    fireEvent.change(conf, { target: { value: "abweichend99" } });
    fireEvent.click(screen.getByText("personal.security.pwSave"));
    await waitFor(() => expect(screen.getByText("personal.security.pwMismatch")).toBeTruthy());
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("gültige Änderung → Re-Auth + updatePassword", async () => {
    const { container } = renderTab();
    const [cur, nw, conf] = pwInputs(container);
    fireEvent.change(cur, { target: { value: "altpasswort" } });
    fireEvent.change(nw, { target: { value: "neuespasswort1" } });
    fireEvent.change(conf, { target: { value: "neuespasswort1" } });
    fireEvent.click(screen.getByText("personal.security.pwSave"));
    await waitFor(() => expect(signInWithEmail).toHaveBeenCalledWith("a@b.de", "altpasswort"));
    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith("neuespasswort1"));
  });
});
