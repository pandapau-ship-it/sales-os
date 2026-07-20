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

/** Kopfzeile eines Produkts. Bei offener Karte steht der Name zweimal im DOM (Kopf + Namensfeld) —
 *  der Kopf kommt zuerst. */
const headerOf = (name: string) => screen.getAllByText(name)[0].closest("[aria-expanded]") as HTMLElement;

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
    const box = await screen.findByDisplayValue("alt");
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.blur(box);
    await waitFor(() => expect(updateProduct).toHaveBeenCalledWith("p1", { benefit: "" }));
  });

  it("Felder sind BEIM LADEN als input/textarea da — nicht erst nach einem Klick", async () => {
    renderPage();
    await screen.findByLabelText("company.priceRelease");
    // Name + Preis als <input>, Kurzbeschreibung + Hauptnutzen + Zielgruppe … alle sofort vorhanden.
    expect(document.querySelectorAll("input, textarea").length).toBeGreaterThanOrEqual(5);
    expect(screen.getByLabelText("company.field.benefit").tagName.toLowerCase()).toBe("textarea");
    expect(screen.getByLabelText("company.field.name").tagName.toLowerCase()).toBe("input");
    // …und es gibt KEINEN Bearbeiten-Stift mehr (das Feld IST editierbar).
    expect(screen.queryAllByLabelText(/company\.editField/)).toHaveLength(0);
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

  it("Chevron des OFFENEN Produkts klappt es wirklich zu (auch beim ersten — kein toter Klick)", async () => {
    renderPage();
    await screen.findByLabelText("company.priceRelease");
    // Kopfzeile ist der Button mit aria-expanded (der Name steht auch im Feld darunter).
    const header = document.querySelector("[aria-expanded]") as HTMLButtonElement;
    expect(header.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(header);
    await waitFor(() => expect(screen.queryByLabelText("company.priceRelease")).toBeNull());
    expect(header.getAttribute("aria-expanded")).toBe("false");
  });

  it("nach dem Löschen des OFFENEN Produkts ist das verbleibende offen (nicht alles zu)", async () => {
    PRODUCTS = [{ ...PRODUCT }, { ...PRODUCT, id: "p2", name: "Zweites" }];
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText("company.priceRelease")).toHaveLength(1));

    // Auswahl EXPLIZIT auf p2 setzen — nur so entsteht der Fehlerzustand (openId zeigt auf p2).
    fireEvent.click(screen.getByText("Zweites"));
    await waitFor(() =>
      expect(document.querySelectorAll('[aria-expanded="true"]')).toHaveLength(1),
    );
    expect(headerOf("Zweites").getAttribute("aria-expanded")).toBe("true");

    // Genau dieses offene Produkt löschen; die Rest-Liste steht VOR dem Bestätigen bereit,
    // damit der Refetch nach invalidate() wirklich nur noch p1 liefert.
    fireEvent.click(screen.getAllByLabelText("company.removeProduct")[1]);
    PRODUCTS = [{ ...PRODUCT }];
    fireEvent.click(await screen.findByText("company.removeProduct", { selector: "button" }));
    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith("p2"));

    // p1 muss jetzt AUFGEKLAPPT sein — vorher stand die Seite komplett zu.
    await waitFor(() => expect(screen.queryByText("Zweites")).toBeNull());
    expect(headerOf("Sales OS").getAttribute("aria-expanded")).toBe("true");
  });

  it("Löschen einer ANDEREN Karte lässt die eigene Auswahl in Ruhe", async () => {
    PRODUCTS = [{ ...PRODUCT }, { ...PRODUCT, id: "p2", name: "Zweites" }, { ...PRODUCT, id: "p3", name: "Drittes" }];
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText("company.priceRelease")).toHaveLength(1));
    fireEvent.click(screen.getByText("Drittes")); // p3 offen
    await waitFor(() =>
      expect(headerOf("Drittes").getAttribute("aria-expanded")).toBe("true"),
    );

    fireEvent.click(screen.getAllByLabelText("company.removeProduct")[1]); // p2 löschen
    PRODUCTS = [{ ...PRODUCT }, { ...PRODUCT, id: "p3", name: "Drittes" }];
    fireEvent.click(await screen.findByText("company.removeProduct", { selector: "button" }));
    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith("p2"));

    // p3 bleibt offen — die Ansicht springt nicht ungefragt auf das erste Produkt.
    await waitFor(() =>
      expect(headerOf("Drittes").getAttribute("aria-expanded")).toBe("true"),
    );
  });

  it("Produkt-weiter KI-Knopf ist sichtbar, aber nicht bedienbar (Folgt)", async () => {
    renderPage();
    const btn = await screen.findByLabelText("company.aiFillProduct");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("Eingabefelder nutzen den grauen FIELD-Kanon, nicht den weißen shadcn-Default", async () => {
    renderPage();
    await screen.findByLabelText("company.priceRelease");
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
