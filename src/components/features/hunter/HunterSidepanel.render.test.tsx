// @vitest-environment jsdom
/**
 * Render-Test (jsdom + Testing Library): beweist den TATSÄCHLICHEN Zustand des Details-Tabs,
 * nicht nur die DB. Fängt genau die Bug-Klasse „Header zeigt Name, Details-Felder leer".
 */
import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// i18n: t(key) → key (Labels sind ohnehin literale Strings im Panel).
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock("@/hooks/useCurrentOrg", () => ({ useCurrentOrg: () => ({ organizationId: "org1", role: "member", loading: false }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" }, session: null, loading: false }) }));
vi.mock("@/components/shared/toastContext", () => ({ useToast: () => ({ toast: vi.fn() }) }));

// Echte importierte Kontaktzeile (wie GrünStrom/Jürgen aus der DB-Abfrage).
const JUERGEN = {
  id: "jid", first_name: "Jürgen", last_name: "Müller-Schäfer", job_title: "Leiter Einkauf",
  seniority: null, department: null, salutation: null, language: null, twitter_handle: null,
  contact_status: "ohne_campaign", icp_score: null, tags: null, notes: null, assigned_to: "u1",
  email: null, linkedin_url: "linkedin.com/in/juergen", company_id: "c1", heat_status: "heiss",
  // System-Felder: echt gesetzt (lead_source) bzw. NULL (last_contacted/reply, enrichment, crm) → Honesty.
  lead_source: "csv_upload", created_at: "2026-07-18T13:23:47Z",
  last_contacted_at: null, last_reply_at: null, enrichment_sources: null,
  import_batch: { filename: "test_import_kontakte.csv" },
  company: { name: "GrünStrom Energie" },
};

const getContactDetail = vi.fn((..._args: unknown[]) => Promise.resolve(JUERGEN));

vi.mock("@/lib/db", () => {
  const arr = () => Promise.resolve([]);
  return {
    getContactDetail: (...a: unknown[]) => getContactDetail(...a),
    getPipelineSettings: vi.fn(arr), getTasksByContact: vi.fn(arr), getNotesByContact: vi.fn(arr),
    getDealsByContact: vi.fn(arr), getActivityByContact: vi.fn(arr), getContactCommunications: vi.fn(arr),
    getProducts: vi.fn(arr), getOrgUsers: vi.fn(() => Promise.resolve([{ id: "u1", full_name: "Test User" }])),
    createTask: vi.fn(), updateTask: vi.fn(), completeTask: vi.fn(), softDeleteTask: vi.fn(),
    createNote: vi.fn(), updateNote: vi.fn(), softDeleteNote: vi.fn(), createCommunication: vi.fn(),
    updateContact: vi.fn(), updateCompany: vi.fn(), createDeal: vi.fn(), updateDeal: vi.fn(),
    updateDealStage: vi.fn(), updateDealWon: vi.fn(), updateDealLost: vi.fn(), softDeleteDeal: vi.fn(),
    softDeleteContacts: vi.fn(), createContactPhone: vi.fn(), updateContactPhone: vi.fn(),
    setContactPhonePrimary: vi.fn(), deleteContactPhone: vi.fn(),
  };
});

import HunterSidepanel from "./HunterSidepanel";

function renderPanel(opts: { preseed?: boolean } = {}) {
  // Bei Preseed staleTime Infinity → KEIN Refetch → contactRow ist beim Mount da UND stabil
  // (exakt der reale Hover-Prefetch-Fall: Detail schon frisch im Cache).
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: opts.preseed ? Infinity : 0 } } });
  if (opts.preseed) qc.setQueryData(["contactDetail", "org1", "jid"], JUERGEN);
  return render(
    // StrictMode wie die echte App (main.tsx) — doppelt-invokte Render decken render-phase-Bugs auf.
    <StrictMode>
      <QueryClientProvider client={qc}>
        {/* mirror ScreenKontakte: conditional mount, stabile person-Prop, variant full */}
        <HunterSidepanel person={{ id: "jid" } as never} variant="full" onClose={() => {}} onExit={() => {}} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

describe("HunterSidepanel Details-Tab — gerenderter Zustand", () => {
  beforeEach(() => getContactDetail.mockClear());

  it("seedet getContactDetail mit der Kontakt-id", async () => {
    renderPanel();
    await waitFor(() => expect(getContactDetail).toHaveBeenCalledWith("org1", "jid"));
  });

  it("zeigt echte Werte auch bei frischem Query (Cache leer beim Öffnen)", async () => {
    renderPanel();
    await waitFor(() => expect(getContactDetail).toHaveBeenCalled());
    await waitFor(() => expect(screen.getAllByText("Müller-Schäfer").length).toBeGreaterThan(0), { timeout: 2000 });
  });

  it("zeigt echte Werte auch wenn der Detail BEIM ÖFFNEN schon gecacht ist (Hover-Prefetch, Regel C)", async () => {
    renderPanel({ preseed: true });
    await waitFor(() => expect(screen.getAllByText("Müller-Schäfer").length).toBeGreaterThan(0), { timeout: 2000 });
  });

  it("System-Sektion zeigt echte Werte, KEINE Fakes (Manuell/Surfe/HS-48213/12. März 2026)", async () => {
    renderPanel();
    await waitFor(() => expect(screen.getAllByText("Müller-Schäfer").length).toBeGreaterThan(0), { timeout: 2000 });
    // System-Sektion aufklappen (collapsible defaultCollapsed).
    fireEvent.click(screen.getAllByText("System")[0]);
    // Echte Lead-Quelle inkl. Dateiname (lead_source='csv_upload' + import_batch.filename):
    await waitFor(() => expect(screen.getAllByText("Import (CSV) — test_import_kontakte.csv").length).toBeGreaterThan(0), { timeout: 2000 });
    // Konsistenz: der WERT wird kräftig (text-text-primary) dargestellt wie andere Wert-Felder, nicht blass.
    expect(screen.getAllByText("Import (CSV) — test_import_kontakte.csv")[0].className).toContain("text-text-primary");
    // Und die alten Fake-Werte tauchen NIRGENDS mehr auf:
    expect(screen.queryByText("HS-48213")).toBeNull();
    expect(screen.queryByText("Surfe")).toBeNull();
    expect(screen.queryByText("12. März 2026")).toBeNull();
    expect(screen.queryByText("vor 2 Tagen · E-Mail")).toBeNull();
  });

  it("hält die echten Werte, wenn die person-Prop nach dem Seed neu referenziert wird (Reset-nach-Seed-Bug)", async () => {
    // Deterministische Reproduktion: nach dem Seed wird mit einer NEUEN person-Objektreferenz
    // (gleiche id) neu gerendert. Der frühere Block-1-Reset (setDetails EMPTY) feuerte dann ERNEUT,
    // contactRow blieb gleich → Seed lief nicht nach → Details wurden LEER. Ohne Reset bleiben sie.
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = (p: { id: string }) => (
      <StrictMode>
        <QueryClientProvider client={qc}>
          <HunterSidepanel person={p as never} variant="full" onClose={() => {}} onExit={() => {}} />
        </QueryClientProvider>
      </StrictMode>
    );
    const { rerender } = render(tree({ id: "jid" }));
    await waitFor(() => expect(screen.getAllByText("Müller-Schäfer").length).toBeGreaterThan(0), { timeout: 2000 });
    // Neue Objektreferenz, gleiche id → Block-1-Guard (prevOpenKey.personProp !== personProp) feuert.
    rerender(tree({ id: "jid" }));
    await new Promise((r) => setTimeout(r, 50));
    // Ohne den Reset müssen die echten Werte STEHEN bleiben:
    expect(screen.getAllByText("Müller-Schäfer").length).toBeGreaterThan(0);
  });
});
