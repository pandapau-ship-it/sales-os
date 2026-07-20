// @vitest-environment jsdom
/**
 * Produkte & Preise (Slice 1/3). Prüft die Zusagen dieses Slices am gerenderten UI:
 * kein Pflichtfeld-Zwang · Preisfreigabe standardmäßig AUS · KI-Knopf sichtbar aber tot ·
 * KEIN Herkunfts-Marker · mehrere USPs/Wettbewerber unabhängig · ein Schreibweg (RPC-Aufruf).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => {
  const t = (k: string, o?: Record<string, unknown>) =>
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

const updateProduct = vi.fn((_id: string, _patch: unknown) => Promise.resolve());
const updateOrgProfile = vi.fn((_patch: unknown) => Promise.resolve());
const createProduct = vi.fn(() => Promise.resolve("new"));
const deleteProduct = vi.fn((_id: string) => Promise.resolve());

let PRODUCTS: unknown[] = [];
let ORG: unknown = { usps: [], competitors: [] };

vi.mock("@/lib/db", () => ({
  getProductsFull: () => Promise.resolve(PRODUCTS),
  getOrgProfileLite: () => Promise.resolve(ORG),
  createProduct: () => createProduct(),
  updateProduct: (id: string, patch: unknown) => updateProduct(id, patch),
  deleteProduct: (id: string) => deleteProduct(id),
  updateOrgProfile: (patch: unknown) => updateOrgProfile(patch),
}));

import ProductPricingPage from "./ProductPricingPage";

const PRODUCT = {
  id: "p1", name: "Sales OS", description: "", benefit: "", audience: "",
  price: null, price_model: null, ai_may_reference_price: false,
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ProductPricingPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => { PRODUCTS = [{ ...PRODUCT }]; ORG = { usps: [], competitors: [] }; });
afterEach(() => {
  cleanup();
  [updateProduct, updateOrgProfile, createProduct, deleteProduct].forEach((m) => m.mockClear());
});

describe("ProductPricingPage", () => {
  it("Preisfreigabe ist standardmäßig AUS und schaltet über die zentrale Update-Funktion", async () => {
    renderPage();
    const sw = await screen.findByLabelText("company.priceRelease");
    expect(sw.getAttribute("data-state")).toBe("unchecked"); // sicherer Standard
    fireEvent.click(sw);
    await waitFor(() => expect(updateProduct).toHaveBeenCalledWith("p1", { ai_may_reference_price: true }));
  });

  it("jedes Feld hat einen KI-Knopf — sichtbar, aber nicht bedienbar (Folgt)", async () => {
    renderPage();
    await screen.findByLabelText("company.priceRelease");
    const aiButtons = screen.getAllByLabelText(/company\.aiSuggest/);
    expect(aiButtons.length).toBeGreaterThan(0);
    expect(aiButtons.every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });

  it("kein Herkunfts-Marker im UI (bewusst nicht gebaut)", async () => {
    renderPage();
    await screen.findByLabelText("company.priceRelease");
    for (const needle of ["field_meta", "manual", "crawl", "sherloq", "Herkunft"]) {
      expect(document.body.textContent).not.toContain(needle);
    }
  });

  it("leeres Feld lässt sich leer lassen UND leer speichern (kein Pflichtfeld-Zwang)", async () => {
    PRODUCTS = [{ ...PRODUCT, benefit: "alt" }];
    renderPage();
    const pencils = await screen.findAllByLabelText(/company\.editField/);
    // 2. Stift = Kurzbeschreibung … wir nehmen den Nutzen-Stift über sein Label.
    const benefitPencil = pencils.find((p) => p.getAttribute("aria-label")?.includes("benefit"))!;
    fireEvent.click(benefitPencil);
    const box = document.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.blur(box);
    await waitFor(() => expect(updateProduct).toHaveBeenCalledWith("p1", { benefit: "" }));
  });

  it("mehrere USPs unabhängig hinzufügbar und entfernbar", async () => {
    ORG = { usps: [{ id: "u1", text: "erster" }, { id: "u2", text: "zweiter" }], competitors: [] };
    renderPage();
    // Erst auf die geladenen USPs warten — sonst klickt der Test vor dem Query-Ergebnis.
    await waitFor(() => expect(screen.getAllByLabelText("company.removeUsp")).toHaveLength(2));
    fireEvent.click(screen.getByText("company.addUsp"));
    await waitFor(() => expect(updateOrgProfile).toHaveBeenCalled());
    expect((updateOrgProfile.mock.calls[0][0] as { usps: unknown[] }).usps).toHaveLength(3);

    updateOrgProfile.mockClear();
    fireEvent.click(screen.getAllByLabelText("company.removeUsp")[0]);
    await waitFor(() => expect(updateOrgProfile).toHaveBeenCalled());
    const left = (updateOrgProfile.mock.calls[0][0] as { usps: { id: string }[] }).usps;
    expect(left.map((u) => u.id)).toEqual(["u2"]); // nur der geklickte ist weg
  });

  it("Wettbewerber hinzufügen schreibt Name + leere Begründung (Begründung optional)", async () => {
    renderPage();
    const input = await screen.findByPlaceholderText("company.placeholder.competitor");
    fireEvent.change(input, { target: { value: "HubSpot" } });
    fireEvent.click(screen.getByText("company.addCompetitor"));
    await waitFor(() => expect(updateOrgProfile).toHaveBeenCalled());
    const list = (updateOrgProfile.mock.calls[0][0] as { competitors: { name: string; why_us: string }[] }).competitors;
    expect(list[0]).toMatchObject({ name: "HubSpot", why_us: "" });
  });

  it("Vollständigkeit zeigt den Wirkungshinweis auf das wichtigste leere Feld", async () => {
    renderPage();
    // Produkt ohne Nutzen → Hinweis „benefit" mit Produktnamen
    expect(await screen.findByText(/company\.hint\.benefit/)).toBeTruthy();
    expect(document.body.textContent).toContain("Sales OS");
  });
});
