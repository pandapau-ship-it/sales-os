// @vitest-environment jsdom
/**
 * RuleEditor (L-3d) — 3-Schritt-Gating, Template-Vorbefüllung, coming_soon disabled, [D57]-Sammelhinweis,
 * Listen-Picker (nur statisch), Edit-Save mit optimistischem Sperr-Guard, Verwerfen-Guard.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o ? `${k}:${JSON.stringify(o)}` : k) }),
}));

const ACTIONS = [
  { key: "notify", labelKey: "lifecycle.action.notify", status: "active", paramsSchema: { message: "optional" }, appliesTo: ["contacts", "companies", "deals"], requires: null },
  { key: "create_task", labelKey: "lifecycle.action.create_task", status: "active", paramsSchema: { title: "required", due_in_days: "optional" }, appliesTo: ["contacts", "deals"], requires: null },
  { key: "add_to_list", labelKey: "lifecycle.action.add_to_list", status: "active", paramsSchema: { list_id: "required" }, appliesTo: ["contacts"], requires: null },
  { key: "set_contact_status", labelKey: "lifecycle.action.set_contact_status", status: "coming_soon", paramsSchema: { status: "required" }, appliesTo: ["contacts"], requires: "governance" },
];
const LISTS = [
  { id: "l-static", name: "VIP-Kunden", type: "static" },
  { id: "l-dyn", name: "Dynamisch-ICP", type: "dynamic" },
];
const upsertLifecycleRule = vi.fn((..._a: unknown[]) => Promise.resolve("new-id"));
vi.mock("@/lib/db", () => ({
  getActionTypes: () => Promise.resolve(ACTIONS),
  getLists: () => Promise.resolve(LISTS),
  upsertLifecycleRule: (...a: unknown[]) => upsertLifecycleRule(...a),
  dryRunLifecycleRule: () => Promise.resolve(3),
}));

import RuleEditor, { type EditorInit } from "./RuleEditor";
import { TEMPLATES } from "@/lib/lifecycle/templates";
import type { LifecycleRuleView } from "@/lib/db";

beforeAll(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} };
  const P = Element.prototype as unknown as Record<string, unknown>;
  P.hasPointerCapture ||= () => false; P.setPointerCapture ||= () => {}; P.releasePointerCapture ||= () => {}; P.scrollIntoView ||= () => {};
});
const onClose = vi.fn(); const onSaved = vi.fn();
beforeEach(() => { upsertLifecycleRule.mockClear(); onClose.mockClear(); onSaved.mockClear(); });
afterEach(cleanup);

function renderEditor(init: EditorInit) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <RuleEditor orgId="org1" init={init} onClose={onClose} onSaved={onSaved} />
    </QueryClientProvider>,
  );
}

const editRule: LifecycleRuleView = {
  id: "r1", name: "Bestehende Regel", anchorEntity: "contacts" as const,
  conditions: { logic: "AND" as const, groups: [{ entity: "contacts" as const, where: { logic: "AND" as const, rules: [{ field: "icp_score", operator: "gte", value: 80 }] } }] },
  action: { type: "create_task", params: { title: "Prüfen" } },
  priority: 100, isActive: true, isTerminal: false, triggerEvent: "schedule",
  updatedAt: "2026-07-20T10:00:00Z", lastFiredAt: null, firedForCount: 0,
};

describe("RuleEditor", () => {
  it("Schritt 1: ohne Namen blockiert „Weiter“ + zeigt einen Hinweis (kein stiller Sprung)", () => {
    renderEditor({ mode: "new" });
    expect(screen.getByText("lifecycle.ui.editor.titleNew")).toBeTruthy();
    fireEvent.click(screen.getByText("lifecycle.ui.editor.next"));
    expect(screen.getByText("lifecycle.ui.editor.nameRequired")).toBeTruthy();
    // Bedingungs-Heading (Schritt 2) darf NICHT erscheinen
    expect(screen.queryByText("lifecycle.ui.editor.conditionsHeading")).toBeNull();
  });

  it("Template füllt Name + Anker vor und die Klartext-Zeile nennt die Aktion", async () => {
    const tpl = TEMPLATES.find((x) => x.id === "churn_warning")!;
    renderEditor({ mode: "template", tpl });
    expect((screen.getByLabelText("lifecycle.ui.editor.nameLabel") as HTMLInputElement).value).toBe(tpl.name);
    // Live-Summary (mock-t serialisiert Params) enthält das Aktions-Label — nach Laden der Aktions-Registry
    expect(await screen.findByText(/lifecycle\.action\.create_task/)).toBeTruthy();
  });

  it("Schritt 3: coming_soon-Aktion ist disabled, [D57]-Sammelhinweis erscheint bei notify", async () => {
    renderEditor({ mode: "edit", rule: editRule });
    fireEvent.click(screen.getByText("lifecycle.ui.editor.next")); // 1→2
    fireEvent.click(screen.getByText("lifecycle.ui.editor.next")); // 2→3
    // coming_soon disabled
    const soon = (await screen.findByText("lifecycle.action.set_contact_status")).closest("button") as HTMLButtonElement;
    expect(soon.disabled).toBe(true);
    // notify wählen → Bundle-Hinweis
    fireEvent.click(screen.getByText("lifecycle.action.notify").closest("button")!);
    expect(await screen.findByText("lifecycle.ui.bundleHint")).toBeTruthy();
  });

  it("add_to_list zeigt den Listen-Picker mit Dynamik-Hinweis (nur statische Listen)", async () => {
    renderEditor({ mode: "edit", rule: editRule });
    fireEvent.click(screen.getByText("lifecycle.ui.editor.next"));
    fireEvent.click(screen.getByText("lifecycle.ui.editor.next"));
    fireEvent.click((await screen.findByText("lifecycle.action.add_to_list")).closest("button")!);
    expect(await screen.findByText("lifecycle.actionParam.list_id.label")).toBeTruthy();
    expect(screen.getByText("lifecycle.ui.dynamicListReason")).toBeTruthy();
    expect(screen.queryByText("lifecycle.ui.editor.listEmpty")).toBeNull(); // es gibt eine statische Liste
  });

  it("Edit-Save schickt EINEN Patch inkl. optimistischem Sperr-Guard (updatedAt)", async () => {
    renderEditor({ mode: "edit", rule: editRule });
    fireEvent.click(screen.getByText("lifecycle.ui.editor.next"));
    fireEvent.click(screen.getByText("lifecycle.ui.editor.next"));
    await screen.findByText("lifecycle.action.create_task"); // Aktions-Registry geladen
    fireEvent.click(screen.getByText("lifecycle.ui.editor.save"));
    await waitFor(() => expect(upsertLifecycleRule).toHaveBeenCalled());
    const [id, patch, expected] = upsertLifecycleRule.mock.calls[0] as unknown as [string, Record<string, unknown>, string];
    expect(id).toBe("r1");
    expect((patch.action as { type: string }).type).toBe("create_task");
    expect(expected).toBe("2026-07-20T10:00:00Z");
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("Verwerfen-Guard: nach Änderung öffnet „Abbrechen“ den Bestätigungsdialog statt sofort zu schließen", () => {
    renderEditor({ mode: "new" });
    fireEvent.change(screen.getByLabelText("lifecycle.ui.editor.nameLabel"), { target: { value: "Neu" } });
    fireEvent.click(screen.getByText("lifecycle.ui.editor.cancel"));
    expect(screen.getByText("lifecycle.ui.editor.discardTitle")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
