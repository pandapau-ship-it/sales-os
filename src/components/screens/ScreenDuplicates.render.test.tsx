// @vitest-environment jsdom
/**
 * Render-Test (jsdom + Testing Library): beweist den TATSÄCHLICHEN DOM-Zustand der
 * „Duplikate verwalten"-Seite — echte Paar-Namen (kein Fake), Merge-Dialog mit
 * Pro-Feld-A/B, Bestätigungs-alert-dialog VOR Ausführung, und dass die 3. Aktion
 * (Löschen) softDeleteContacts ruft, nicht mergeContacts.
 * (Kein jest-dom global → Assertions über getAllByText/queryByText wie im Hunter-Test.)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Radix (Dropdown/Dialog) braucht in jsdom ein paar fehlende DOM-APIs.
beforeEach(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.scrollIntoView = () => {};
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) =>
      o && (o.name || o.winner) ? `${k}:${o.name ?? o.winner}` : k,
  }),
}));
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "member", loading: false }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" }, session: null, loading: false }) }));
vi.mock("@/components/shared/toastContext", () => ({ useToast: () => ({ toast: vi.fn() }) }));

// Echtes Paar (sicher, gleiche E-Mail) — abweichendes Feld: job_title (A gefüllt, B leer).
const PAIR = {
  a: { id: "a1", first_name: "Anna", last_name: "Berg", email: "anna@acme.io", job_title: "CTO", linkedin_url: null, seniority: null, department: null, city: null, country: null, company: { name: "Acme GmbH" } }, // single-source-ok: Test-Fixture der DB-Rohzeile
  b: { id: "b1", first_name: "Anna", last_name: "Berg", email: "anna@acme.io", job_title: null, linkedin_url: null, seniority: null, department: null, city: null, country: null, company: { name: "Acme" } }, // single-source-ok: Test-Fixture der DB-Rohzeile
  level: "sicher" as const,
  matchType: "email",
};

// K-6a-Fix-Fixture: Paar-Reihenfolge = EMPTIER zuerst (e1), FÜLLER zweiter (f1).
// e1 befüllt: first/last/email/city (4). f1 befüllt: first/last/email/linkedin/job_title (5) → f1 ist Primär.
// Feld city: f1 (Gewinner) LEER, e1 (Verlierer) befüllt → Default muss e1-Wert „Hamburg" wählen.
const PAIR_FILL = {
  a: { id: "e1", first_name: "Tom", last_name: "Fischer", email: "tf@x.io", linkedin_url: null, job_title: null, seniority: null, department: null, city: "Hamburg", country: null, company: { name: "X" } }, // single-source-ok: Test-Fixture der DB-Rohzeile
  b: { id: "f1", first_name: "Thomas", last_name: "Fischer", email: "tf@x.io", linkedin_url: "https://linkedin.com/in/thomas", job_title: "CTO", seniority: null, department: null, city: null, country: null, company: { name: "X" } }, // single-source-ok: Test-Fixture der DB-Rohzeile
  level: "sicher" as const,
  matchType: "email",
};

let dupPairs: unknown[] = [PAIR];

const mergeContacts = vi.fn(() => Promise.resolve());
const softDeleteContacts = vi.fn(() => Promise.resolve());

vi.mock("@/lib/db", () => ({
  getDuplicatePairs: vi.fn(() => Promise.resolve(dupPairs)),
  getCompanyDuplicatePairs: vi.fn(() => Promise.resolve([])),
  mergeContacts: (...a: unknown[]) => mergeContacts(...(a as [])),
  mergeCompanies: vi.fn(() => Promise.resolve()),
  softDeleteContacts: (...a: unknown[]) => softDeleteContacts(...(a as [])),
  softDeleteCompanies: vi.fn(() => Promise.resolve()),
}));

import ScreenDuplicates from "./ScreenDuplicates";

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/app/kontakte/duplicates"]}>
        <ScreenDuplicates />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ScreenDuplicates — Live-DOM", () => {
  beforeEach(() => { mergeContacts.mockClear(); softDeleteContacts.mockClear(); dupPairs = [PAIR]; });
  afterEach(() => cleanup());

  it("zeigt das echte Paar (beide Namen + Grund), kein Fake", async () => {
    renderScreen();
    // Beide Datensätze der Paar-Karte sind echt gerendert (h4-Titel je Seite).
    await waitFor(() => expect(screen.getAllByText("Anna Berg").length).toBe(2));
    // Grund kommt aus matchType='email'.
    expect(screen.getAllByText("duplicates.reason.email").length).toBe(1);
    // Merge-Button vorhanden.
    expect(screen.getAllByRole("button", { name: /duplicates\.merge/ }).length).toBeGreaterThan(0);
  });

  it("Merge-Dialog zeigt nur das abweichende Feld (job_title) mit A/B, Merge erst nach Bestätigung", async () => {
    renderScreen();
    await waitFor(() => expect(screen.getAllByText("Anna Berg").length).toBe(2));

    fireEvent.click(screen.getByRole("button", { name: /duplicates\.merge/ }));
    const dialog = await screen.findByRole("dialog");
    // job_title abweichend → Feld-Label je Seite (A+B) = 2×; A-Wert "CTO" 1×.
    expect(within(dialog).getAllByText("duplicates.field.job_title").length).toBe(2);
    expect(within(dialog).getAllByText("CTO").length).toBe(1);
    // Identisches Feld (email) taucht NICHT als Klärungsfeld auf.
    expect(within(dialog).queryByText("duplicates.field.email")).toBeNull();

    // Merge-Klick im Dialog → NOCH kein DB-Aufruf, erst der alert-dialog.
    fireEvent.click(within(dialog).getByRole("button", { name: /duplicates\.merge/ }));
    const alert = await screen.findByRole("alertdialog");
    expect(within(alert).getAllByText("duplicates.confirmMergeTitle").length).toBe(1);
    expect(mergeContacts).not.toHaveBeenCalled();

    // Erst die Bestätigung führt aus.
    fireEvent.click(within(alert).getByRole("button", { name: "duplicates.merge" }));
    await waitFor(() => expect(mergeContacts).toHaveBeenCalledTimes(1));
    // winner=a1, loser=b1, override job_title = A-Wert "CTO".
    const call = mergeContacts.mock.calls[0] as unknown[];
    expect(call[1]).toBe("a1");
    expect(call[2]).toBe("b1");
    expect((call[3] as Record<string, unknown>).job_title).toBe("CTO");
  });

  it("K-6a-Default: Gewinner = befüllterer Datensatz (nicht Paar-Reihenfolge), leeres Feld erbt Verlierer-Wert", async () => {
    dupPairs = [PAIR_FILL];
    renderScreen();
    // Paar-Reihenfolge: e1 (Tom) zuerst, f1 (Thomas) zweiter.
    await waitFor(() => expect(screen.getByText("Tom Fischer")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: /duplicates\.merge/ }));
    const dialog = await screen.findByRole("dialog");
    // city ist ein abweichendes Feld (f1 leer / e1 "Hamburg") → als A/B sichtbar, "Hamburg" 1×.
    expect(within(dialog).getAllByText("duplicates.field.city").length).toBe(2);
    expect(within(dialog).getAllByText("Hamburg").length).toBe(1);

    fireEvent.click(within(dialog).getByRole("button", { name: /duplicates\.merge/ }));
    const alert = await screen.findByRole("alertdialog");
    fireEvent.click(within(alert).getByRole("button", { name: "duplicates.merge" }));
    await waitFor(() => expect(mergeContacts).toHaveBeenCalledTimes(1));

    const call = mergeContacts.mock.calls[0] as unknown[];
    // (1) Gewinner = f1 (befüllterer via pickPrimaryId), NICHT e1 (Paar-Reihenfolge).
    expect(call[1]).toBe("f1");
    expect(call[2]).toBe("e1");
    const overrides = call[3] as Record<string, unknown>;
    // (2) city am Gewinner (f1) leer → Vorauswahl erbt Verlierer-Wert "Hamburg" (kein Datenverlust).
    expect(overrides.city).toBe("Hamburg");
    // Gewinner-befülltes Feld bleibt Gewinner-Wert.
    expect(overrides.job_title).toBe("CTO");
  });

  it("3. Aktion Löschen ruft softDeleteContacts (kein Merge) nach Bestätigung", async () => {
    renderScreen();
    await waitFor(() => expect(screen.getAllByText("Anna Berg").length).toBe(2));

    // Radix-Menü per Tastatur öffnen (deterministisch in jsdom).
    const trigger = screen.getByRole("button", { name: "duplicates.moreActions" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    // Menü öffnet zwei „Löschen"-Items (A und B) — das erste (A) klicken.
    const delItems = await screen.findAllByText(/^duplicates\.deleteRecord/);
    fireEvent.click(delItems[0]);
    const alert = await screen.findByRole("alertdialog");
    fireEvent.click(within(alert).getByRole("button", { name: "common.delete" }));
    await waitFor(() => expect(softDeleteContacts).toHaveBeenCalledTimes(1));
    expect(mergeContacts).not.toHaveBeenCalled();
  });
});
