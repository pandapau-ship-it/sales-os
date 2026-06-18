/**
 * DealsListe — Deal-Tab (820px-Panel + Vollansicht).
 * Panel-Modus (`dealRows`): **P5a nur lesen** — echte Deals des Kontakts (Name/Produkt/
 * Stage/Wert/Owner/Abschluss); arr/mrr entfallen (kein DB-Pendant); leer → ruhiger Hinweis.
 * Anlegen/Bearbeiten/Löschen kommen später (P5b/P8).
 * Ohne `dealRows`: Mock (Standalone, `NewDealCard`-Formular, on-hover Edit/Löschen). Tokens-only.
 */
import { useEffect, useState } from "react";
import { Plus, Briefcase, Pencil, Trash2, Check } from "lucide-react";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";
import StageBadge from "./StageBadge";
import NewDealCard, { type DealDraft } from "./NewDealCard";

interface DealItem extends DealDraft { id: string; stage: string; }

const OWNERS = ["Oliver Sand", "Lena Brandt", "Marc Vogel"];

// ── P5a Read-Modus: echte Deals des Kontakts (nur lesen) ──────────────────────
/** Eine Read-Deal-Ansicht — nur echte DB-Felder; fehlende → undefined (unsichtbar). */
type DealView = {
  id: string;
  name: string;
  product?: string;
  stageLabel: string;     // Slug → Anzeigename (im Screen aufgelöst)
  valueEur?: number;      // deals.value (Cent) / 100
  currency: string;
  owner?: string;         // owner_id → users.full_name
  closeDate?: string;     // closed_at ?? end_date
};

function rowToDealView(row: Record<string, any>, stageNameBySlug: Record<string, string>): DealView {
  return {
    id: row.id,
    name: row.name ?? "",
    product: row.product || undefined,
    stageLabel: stageNameBySlug[row.stage] ?? row.stage ?? "",
    valueEur: typeof row.value === "number" ? row.value / 100 : undefined,
    currency: row.currency ?? "EUR",
    owner: row.owner?.full_name || undefined,
    closeDate: row.closed_at ?? row.end_date ?? undefined,
  };
}

const money = (v: number, currency: string) =>
  currency === "EUR" ? `€ ${v.toLocaleString("de-DE")}` : `${currency} ${v.toLocaleString("de-DE")}`;
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });

/** Read-only Deals-Liste (P5a): echte Felder, arr/mrr entfallen (kein DB-Pendant); leer → ruhiger Hinweis. */
function DealsListeReadonly({ items }: { items: DealView[] }) {
  if (items.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest px-1 block">Deals</span>
        <div className="text-[12px] text-text-muted px-1">Noch keine Deals.</div>
      </div>
    );
  }
  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest px-1 block">Deals</span>
      <div className="space-y-3">
        {items.map((d) => {
          const sub = [
            d.valueEur != null ? money(d.valueEur, d.currency) : null,
            d.owner ?? null,
            d.closeDate ? `Abschluss: ${dateLabel(d.closeDate)}` : null,
          ].filter(Boolean).join(" · ");
          return (
            <div key={d.id} className="p-4 bg-app-surface border border-border rounded-[12px] shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-[10px] shrink-0 inline-flex items-center justify-center bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-extrabold text-text-primary leading-tight truncate">{d.name}</p>
                    {sub && <p className="text-[11px] text-text-muted mt-0.5 truncate">{sub}</p>}
                  </div>
                </div>
                {d.stageLabel && <StageBadge stage={d.stageLabel} />}
              </div>
              {d.product && (
                <div className="flex items-center flex-wrap gap-1.5 mt-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[10px] font-bold">{d.product}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const DEFAULT_DEALS: DealItem[] = [
  { id: "d1", name: "LogixFlow — Enterprise", product: "Enterprise", value: "24000", owner: "Oliver Sand", arr: "24000", mrr: "2000", close: "2026-09-30", stage: "Demo vereinbart" },
  { id: "d2", name: "LogixFlow — Free Trial", product: "Growth", value: "8000", owner: "Lena Brandt", arr: "8000", mrr: "700", close: "2026-12-15", stage: "Free Trial" },
];

const emptyDraft = (): DealDraft => ({ name: "", product: "", value: "", owner: "", arr: "", mrr: "", close: "" });
const fmtEur = (v: string) => (v && !Number.isNaN(Number(v)) ? `€ ${Number(v).toLocaleString("de-DE")}` : "—");
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }) : "—");

let seq = 0;

export default function DealsListe({
  onToast, autoEdit = false, autoNew = false, onAutoEditConsumed, dealRows, stageNameBySlug,
}: {
  onToast?: (msg: string) => void;
  autoEdit?: boolean;
  autoNew?: boolean;
  onAutoEditConsumed?: () => void;
  /** Echte DB-Deal-Zeilen (P5a, nur Read). undefined → Mock (Standalone). */
  dealRows?: Record<string, any>[];
  stageNameBySlug?: Record<string, string>;
}) {
  // P5a — Panel-Modus: nur lesen (Anlegen/Bearbeiten/Löschen = P5b/P8). Dispatch, damit
  // die Mock-Hooks nicht hinter einem Early-Return liegen (Rules of Hooks).
  if (dealRows !== undefined) {
    return <DealsListeReadonly items={dealRows.map((r) => rowToDealView(r, stageNameBySlug ?? {}))} />;
  }
  return <DealsListeMock onToast={onToast} autoEdit={autoEdit} autoNew={autoNew} onAutoEditConsumed={onAutoEditConsumed} />;
}

function DealsListeMock({
  onToast, autoEdit = false, autoNew = false, onAutoEditConsumed,
}: { onToast?: (msg: string) => void; autoEdit?: boolean; autoNew?: boolean; onAutoEditConsumed?: () => void }) {
  const [deals, setDeals] = useState<DealItem[]>(DEFAULT_DEALS);
  // autoEdit (Übersicht): ersten Deal in Bearbeiten öffnen. autoNew (Footer): leeres Anlegen öffnen.
  const first = DEFAULT_DEALS[0];
  const [creating, setCreating] = useState<boolean>((autoEdit && !!first) || autoNew);
  const [editingId, setEditingId] = useState<string | null>(autoEdit && first ? first.id : null);
  const [draft, setDraft] = useState<DealDraft>(
    autoEdit && first ? { name: first.name, product: first.product, value: first.value, owner: first.owner, arr: first.arr, mrr: first.mrr, close: first.close } : emptyDraft(),
  );

  // autoEdit/autoNew nur beim Eintritt anwenden, dann im Parent zurücksetzen.
  useEffect(() => { if (autoEdit || autoNew) onAutoEditConsumed?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => { setEditingId(null); setDraft(emptyDraft()); setCreating(true); };
  const openEdit = (d: DealItem) => {
    setEditingId(d.id);
    setDraft({ name: d.name, product: d.product, value: d.value, owner: d.owner, arr: d.arr, mrr: d.mrr, close: d.close });
    setCreating(true);
  };
  const cancel = () => { setCreating(false); setEditingId(null); setDraft(emptyDraft()); };

  const save = () => {
    if (!draft.value.trim()) return; // Betrag ist Mindestangabe
    if (editingId) {
      setDeals((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...draft } : d)));
      onToast?.("Deal aktualisiert ✓");
    } else {
      setDeals((prev) => [{ ...draft, id: `new-${seq++}`, stage: "Demo vereinbart" }, ...prev]);
      onToast?.("Deal angelegt ✓");
    }
    cancel();
  };

  const remove = (id: string) => { setDeals((prev) => prev.filter((d) => d.id !== id)); onToast?.("Deal entfernt"); };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Deals</span>
        {!creating && (
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Neuer Deal
          </button>
        )}
      </div>

      {/* Anlegen / Bearbeiten — geteiltes NewDealCard-Formular */}
      {creating && (
        <div className="space-y-3 animate-fade-in">
          <NewDealCard deal={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} owners={OWNERS} onRemove={cancel} />
          <button onClick={save} className="w-full py-3 text-on-accent rounded-full text-[13px] font-extrabold shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 cursor-pointer" style={{ background: "var(--sherloq-gradient)" }}>
            <Check className="w-4 h-4" /> {editingId ? "Deal speichern" : "Deal anlegen"}
          </button>
        </div>
      )}

      {deals.length === 0 && !creating && (
        <div className="text-[12px] text-text-muted px-1">Noch kein Deal — „Neuer Deal" anlegen.</div>
      )}

      <div className="space-y-3">
        {deals.map((d) => (
          <div key={d.id} className="group p-4 bg-app-surface border border-border rounded-[12px] shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-[10px] shrink-0 inline-flex items-center justify-center bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]">
                  <Briefcase className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold text-text-primary leading-tight truncate">{d.name || fmtEur(d.value)}</p>
                  <p className="text-[11px] text-text-muted mt-0.5 truncate">{fmtEur(d.value)} · {d.owner || "Kein Owner"} · Abschluss: {fmtDate(d.close)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StageBadge stage={d.stage} />
                <div className={`flex items-center gap-1 ${HOVER_ACTIONS}`}>
                  <button onClick={() => openEdit(d)} aria-label="Bearbeiten" data-tip="Bearbeiten" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(d.id)} aria-label="Löschen" data-tip="Löschen" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-1.5 mt-3">
              {d.product && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[10px] font-bold">{d.product}</span>}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold">ARR: {fmtEur(d.arr)}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold">MRR: {fmtEur(d.mrr)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
