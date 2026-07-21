// @vitest-environment jsdom
/**
 * Unternehmensprofil (Slice 3a). Prueft die Zusagen am gerenderten UI:
 * zwei Reiter (Overview/Offerings) · durchgehend sichtbare Felder · EIN Schreibweg
 * (updateOrgProfile) · Listen add/remove ueber KnowledgeListField · competitors direct/adjacent
 * mit kind · AI Context Builder = zwei disabled Buttons (Folgt) · Vollstaendigkeits-Ring.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => {
  const t = (k: string, o?: unknown) =>
    o && typeof o === "object" ? `${k}:${JSON.stringify(o)}` : k;
  return { useTranslation: () => ({ t }) };
});
vi.mock("@/hooks/useCurrentOrg", () => ({
  useCurrentOrg: () => ({ organizationId: "org1", role: "owner", loading: false, provisioningError: false }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  useEffectivePermissions: () => ({ has: () => true, permissions: new Set(), loading: false }),
}));
vi.mock("@/components/shared/toastContext", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const updateOrgProfile = vi.fn((_p: unknown) => Promise.resolve());
let ORG: Record<string, unknown> = {};

vi.mock("@/lib/db", () => ({
  getOrgProfile: () => Promise.resolve(ORG),
  updateOrgProfile: (p: unknown) => updateOrgProfile(p),
}));

import CompanyProfilePage from "./CompanyProfilePage";

const EMPTY = {
  summary: "", product_service_model: "", value_outcome: "",
  usps: [], problems_solved: [], business_outcomes: [], offerings: [], competitors: [],
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CompanyProfilePage />
    </QueryClientProvider>,
  );
}

beforeEach(() => { ORG = { ...EMPTY }; });
afterEach(() => { cleanup(); updateOrgProfile.mockClear(); });

describe("CompanyProfilePage", () => {
  it("zeigt zwei Reiter (Overview + Offerings)", async () => {
    renderPage();
    expect(await screen.findByText("company.profile.tab.overview")).toBeTruthy();
    expect(screen.getByText("company.profile.tab.offerings")).toBeTruthy();
  });

  it("Zusammenfassung ist sofort ein editierbares Feld; Speichern laeuft ueber updateOrgProfile", async () => {
    renderPage();
    const box = await screen.findByPlaceholderText("company.profile.summary.ph");
    expect(box.tagName.toLowerCase()).toBe("textarea");
    fireEvent.change(box, { target: { value: "Wir helfen Teams." } });
    fireEvent.blur(box);
    await waitFor(() => expect(updateOrgProfile).toHaveBeenCalledWith({ summary: "Wir helfen Teams." }));
  });

  it("USP hinzufuegen schreibt die volle usps-Liste (KnowledgeListField)", async () => {
    renderPage();
    fireEvent.click(await screen.findByText("company.profile.usps.add"));
    await waitFor(() =>
      expect(updateOrgProfile).toHaveBeenCalledWith({ usps: [expect.objectContaining({ text: "" })] }),
    );
  });

  it("Einzelfeld-Liste zeigt leer EINE leere Zeile (kein Hint-Text); Tippen legt den ersten Eintrag an", async () => {
    renderPage();
    // Leere USPS-Liste → direkt ein beschreibbares Feld, KEIN "Noch kein USP"-Hinweis
    const field = await screen.findByPlaceholderText("company.profile.usps.ph");
    expect(field).toBeTruthy();
    expect(screen.queryByText("company.profile.usps.empty")).toBeNull();
    // Tippen + Blur in der Draft-Zeile erzeugt den ersten echten Eintrag
    fireEvent.change(field, { target: { value: "Live in Minuten" } });
    fireEvent.blur(field);
    await waitFor(() =>
      expect(updateOrgProfile).toHaveBeenCalledWith({ usps: [expect.objectContaining({ text: "Live in Minuten" })] }),
    );
  });

  it("Mehrfeld-Liste (Wettbewerber) zeigt leer KEINE Draft-Zeile, sondern den Hint", async () => {
    renderPage();
    fireEvent.click(await screen.findByText("company.profile.tab.offerings"));
    // Direkte Wettbewerber leer → Hint sichtbar, kein leeres name-Feld
    expect(await screen.findAllByText("company.profile.competitors.empty")).toBeTruthy();
    expect(screen.queryByPlaceholderText("company.profile.competitors.namePh")).toBeNull();
  });

  it("Offerings-Reiter: Wettbewerber direkt hinzufuegen setzt kind='direct'", async () => {
    renderPage();
    fireEvent.click(await screen.findByText("company.profile.tab.offerings"));
    const addBtns = await screen.findAllByText("company.profile.competitors.add");
    fireEvent.click(addBtns[0]); // erste Liste = Direkt
    await waitFor(() =>
      expect(updateOrgProfile).toHaveBeenCalledWith({
        competitors: [expect.objectContaining({ kind: "direct", name: "", why_us: "" })],
      }),
    );
  });

  it("AI Context Builder: zwei echte Buttons, disabled/Folgt (Scan + Chat)", async () => {
    renderPage();
    const scan = await screen.findByLabelText("company.profile.scanCta");
    const chat = screen.getByLabelText("company.profile.chatCta");
    expect((scan as HTMLButtonElement).disabled).toBe(true);
    expect((chat as HTMLButtonElement).disabled).toBe(true);
    expect(scan.className).toContain("rounded-full");
  });

  it("Vollstaendigkeits-Ring vorhanden; leeres Profil weist auf das wirkungsvollste Feld hin (usps)", async () => {
    renderPage();
    // usps hat den niedrigsten order-Wert unter den org-Feldern → erster Wirkungshinweis.
    expect(await screen.findByText("company.hint.usps")).toBeTruthy();
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("Listen-Felder nutzen den grauen FIELD-Kanon (kein weisser shadcn-Default)", async () => {
    ORG = { ...EMPTY, usps: [{ id: "u1", text: "Schnell" }] };
    renderPage();
    const box = await screen.findByDisplayValue("Schnell");
    expect(box.className).toContain("bg-app-bg");
    expect(box.className).not.toContain("bg-app-surface");
  });
});
