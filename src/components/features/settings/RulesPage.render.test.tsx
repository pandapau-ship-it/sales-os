// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o ? `${k}:${JSON.stringify(o)}` : k) }),
}));

let PERMS: (p: string) => boolean = () => true;
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "owner", loading: false }) }));
vi.mock("@/hooks/usePermissions", () => ({ useEffectivePermissions: () => ({ has: (p: string) => PERMS(p), permissions: new Set(), loading: false }) }));
vi.mock("@/hooks/useSaveState", () => ({ useSaveState: () => ({ state: null, run: (p: Promise<unknown>) => p }) }));
vi.mock("@/components/shared/toastContext", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const updateSettings = vi.fn((_p: unknown) => Promise.resolve());
const SETTINGS = {
  thresholds: {
    heat_status: { heiss_max_days: 3, warm_max_days: 7, lauwarm_max_days: 14, kalt_max_days: 30 },
    churn_risk_threshold: 61, upsell_threshold: 70, signal_fresh_hours: 24,
    churn_weights: { last_contact: 25, no_reply: 20, inactive_days: 20, heat_cold: 20, overdue_tasks: 0 },
    upsell_weights: { reply_rate: 20, recent_contact: 15, heat_hot: 20, active_deal: 10 },
    churn_suppresses_upsell: true,
  },
  automation_defaults: { followup_first_days: 3, followup_second_days: 7, max_auto_followups: 2, max_ai_adjustments_per_lead: 3, icp_score_threshold: 65 },
  pipeline_stages: [
    { slug: "backlog", name: "Backlog", stagnation_days: 7 },
    { slug: "gewonnen", name: "Gewonnen", stagnation_days: null },
    { slug: "verloren", name: "Verloren", stagnation_days: null },
  ],
};
let getSettingsImpl: () => Promise<unknown> = () => Promise.resolve(SETTINGS);
vi.mock("@/lib/db", () => ({ getSettings: () => getSettingsImpl(), updateSettings: (p: unknown) => updateSettings(p) }));

import RulesPage from "./RulesPage";

beforeAll(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} };
  const P = Element.prototype as unknown as Record<string, unknown>;
  P.hasPointerCapture ||= () => false; P.setPointerCapture ||= () => {}; P.releasePointerCapture ||= () => {};
  P.scrollIntoView ||= () => {};
});
beforeEach(() => { PERMS = () => true; getSettingsImpl = () => Promise.resolve(SETTINGS); });
afterEach(() => { cleanup(); updateSettings.mockClear(); });

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><RulesPage /></QueryClientProvider>);
}

describe("RulesPage", () => {
  it("zeigt die fünf Gruppen + Layout-Reserve", async () => {
    renderPage();
    expect(await screen.findByText("settings.rules.g.heat.title")).toBeTruthy();
    for (const g of ["pipeline", "churn", "signals", "meinTag"]) {
      expect(screen.getByText(`settings.rules.g.${g}.title`)).toBeTruthy();
    }
    expect(screen.getByText("settings.rules.g.custom.note")).toBeTruthy(); // Eigene Actions (leer)
  });

  it("Churn-Schwelle speichern läuft über EINEN Schreibweg updateSettings({thresholds:{churn_risk_threshold}})", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "settings.rules.churn.threshold" }));
    const input = await screen.findByRole("spinbutton");
    fireEvent.change(input, { target: { value: "55" } });
    fireEvent.click(screen.getByText("common.save"));
    await waitFor(() => expect(updateSettings).toHaveBeenCalledWith({ thresholds: { churn_risk_threshold: 55 } }));
  });

  it("Heat-Kachel (Gruppe 1) speichert die gekettete Tages-Schwelle über updateSettings", async () => {
    renderPage();
    // Cold-Kachel (Caption als aria-label), Wert 30 → 40
    fireEvent.click(await screen.findByRole("button", { name: "settings.rules.heat.tile.cold.caption" }));
    const input = await screen.findByRole("spinbutton");
    fireEvent.change(input, { target: { value: "40" } });
    fireEvent.click(screen.getByText("common.save"));
    await waitFor(() => {
      const call = updateSettings.mock.calls.find(([p]) => (p as { thresholds?: { heat_status?: unknown } }).thresholds?.heat_status); // single-source-ok: settings.thresholds.heat_status = Config
      expect((call![0] as { thresholds: { heat_status: Record<string, number> } }).thresholds.heat_status.kalt_max_days).toBe(40); // single-source-ok: settings-Config, kein Kontakt-Heat
    });
  });

  it("Upsell-Unterdrückung-Schalter → updateSettings({thresholds:{churn_suppresses_upsell:false}})", async () => {
    renderPage();
    fireEvent.click(await screen.findByLabelText("settings.rules.churn.suppress"));
    await waitFor(() => expect(updateSettings).toHaveBeenCalledWith({ thresholds: { churn_suppresses_upsell: false } }));
  });

  it("Signal-An/Aus schreibt churn_weights_active (per-Signal-Flag, SET-4a)", async () => {
    renderPage();
    await screen.findByText("settings.rules.g.churn.title");
    const first = screen.getAllByRole("switch")[0]; // erstes Churn-Signal (last_contact), Default aktiv
    fireEvent.click(first);
    await waitFor(() => {
      const call = updateSettings.mock.calls.find(([p]) => (p as { thresholds?: { churn_weights_active?: unknown } }).thresholds?.churn_weights_active);
      expect(call).toBeTruthy();
      expect((call![0] as { thresholds: { churn_weights_active: Record<string, boolean> } }).thresholds.churn_weights_active.last_contact).toBe(false);
    });
  });

  it("terminale Stufen (gewonnen/verloren) haben KEINEN Stagnations-Timer", async () => {
    renderPage();
    await screen.findByText("settings.rules.g.pipeline.title");
    // Backlog (nicht-terminal) als Zeile da; Gewonnen = read-only „kein Timer"; Verloren NICHT gelistet.
    expect(screen.getByText("Backlog")).toBeTruthy();
    expect(screen.getByText("settings.rules.pipeline.wonNoTimer")).toBeTruthy();
    expect(screen.queryByText("Verloren")).toBeNull();
  });

  it("Lese-Fehler wird SICHTBAR (kein stummer Degrade auf Empfehlungswerte, [D51])", async () => {
    getSettingsImpl = () => Promise.reject(new Error("boom"));
    renderPage();
    expect(await screen.findByText("settings.rules.loadError")).toBeTruthy();
    // Kein Editor-Inhalt (Empfehlungswerte werden NICHT als echte Werte gezeigt).
    expect(screen.queryByText("settings.rules.g.churn.title")).toBeNull();
  });

  it("ohne Recht → Werte read-only (kein Bearbeiten-Button); Server erzwingt zusätzlich", async () => {
    PERMS = () => false;
    renderPage();
    await screen.findByText("settings.rules.g.churn.title");
    expect(screen.queryByRole("button", { name: "settings.rules.churn.threshold" })).toBeNull(); // Churn-Schwelle nur statisch
  });
});
