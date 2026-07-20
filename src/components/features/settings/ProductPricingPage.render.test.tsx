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
const createProduct = vi.fn(() => Promise.resolve("new"));
const deleteProduct = vi.fn((_id: string) => Promise.resolve());

let PRODUCTS: unknown[] = [];

vi.mock("@/lib/db", () => ({
  getProductsFull: () => Promise.resolve(PRODUCTS),
  createProduct: () => createProduct(),
  updateProduct: (id: string, patch: unknown) => updateProduct(id, patch),
  deleteProduct: (id: string) => deleteProduct(id),
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

beforeEach(() => { PRODUCTS = [{ ...PRODUCT }]; });
afterEach(() => {
  cleanup();
  [updateProduct, createProduct, deleteProduct].forEach((m) => m.mockClear());
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

  it("USP- und Wettbewerber-Sektion sind NICHT mehr auf dieser Seite (ziehen zu Slice 3 um)", async () => {
    renderPage();
    await screen.findByLabelText("company.priceRelease");
    for (const key of ["company.usps", "company.competitors", "company.addUsp", "company.addCompetitor"]) {
      expect(screen.queryByText(key), key).toBeNull();
    }
  });

  it("genau EIN Produkt ist aufgeklappt, der Rest zeigt nur Name + Status", async () => {
    PRODUCTS = [{ ...PRODUCT }, { ...PRODUCT, id: "p2", name: "Zweites" }];
    renderPage();
    // Nur die Felder des ersten Produkts sind da → ein Preis-Schalter, nicht zwei.
    await waitFor(() => expect(screen.getAllByLabelText("company.priceRelease")).toHaveLength(1));
    expect(screen.getByText("Zweites")).toBeTruthy();               // Kopfzeile sichtbar
    expect(screen.getAllByText(/company\.statusMissing/).length).toBe(1); // Status nur am zugeklappten
  });

  it("Klick auf eine zugeklappte Kopfzeile öffnet sie und schließt die andere", async () => {
    PRODUCTS = [{ ...PRODUCT }, { ...PRODUCT, id: "p2", name: "Zweites" }];
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText("company.priceRelease")).toHaveLength(1));
    fireEvent.click(screen.getByText("Zweites"));
    await waitFor(() => expect(screen.getAllByLabelText("company.priceRelease")).toHaveLength(1));
    // …und jetzt trägt das ERSTE die Status-Kurzinfo (ist also zu).
    expect(screen.getAllByText(/company\.statusMissing/).length).toBe(1);
  });

  it("Plus-Knopf legt an und klappt das neue Produkt auf", async () => {
    renderPage();
    await screen.findByLabelText("company.priceRelease");
    fireEvent.click(screen.getByText("company.addProduct"));
    await waitFor(() => expect(createProduct).toHaveBeenCalled());
  });

  it("Produkt-weiter KI-Knopf ist sichtbar, aber nicht bedienbar (Folgt)", async () => {
    renderPage();
    const btn = await screen.findByLabelText("company.aiFillProduct");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("Eingabefelder nutzen den grauen FIELD-Kanon, nicht den weißen shadcn-Default", async () => {
    renderPage();
    const pencils = await screen.findAllByLabelText(/company\.editField/);
    fireEvent.click(pencils[0]);
    const input = document.querySelector("input, textarea") as HTMLElement;
    expect(input.className).toContain("bg-app-bg");        // grauer Kanon
    expect(input.className).not.toContain("bg-app-surface"); // nicht weiß
    expect(input.className).toContain("rounded-[10px]");
  });

  it("Vollständigkeit zeigt den Wirkungshinweis auf das wichtigste leere Feld", async () => {
    renderPage();
    // Produkt ohne Nutzen → Hinweis „benefit" mit Produktnamen
    expect(await screen.findByText(/company\.hint\.benefit/)).toBeTruthy();
    expect(document.body.textContent).toContain("Sales OS");
  });
});
