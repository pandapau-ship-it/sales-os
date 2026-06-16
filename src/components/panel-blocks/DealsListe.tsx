/**
 * DealsListe — Deal-Tab (820px-Panel + Vollansicht): listet die Deals des Kontakts
 * (Betrag/Stage/Owner/Abschluss/ARR/MRR) und legt über „Neuer Deal" neue an — mit dem
 * geteilten Formular `NewDealCard` (identisch zu „SDR Lead hinzufügen"). Bearbeiten/
 * Löschen on-hover (HOVER_ACTIONS). Datengetrieben (DealItem) + Default-Mock — das System
 * spielt echte Deals später 1:1 ein. Tokens-only.
 */
import { useState } from "react";
import { Plus, Briefcase, Pencil, Trash2, Check } from "lucide-react";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";
import StageBadge from "./StageBadge";
import NewDealCard, { type DealDraft } from "./NewDealCard";

interface DealItem extends DealDraft { id: string; stage: string; }

const OWNERS = ["Oliver Sand", "Lena Brandt", "Marc Vogel"];

const DEFAULT_DEALS: DealItem[] = [
  { id: "d1", value: "24000", owner: "Oliver Sand", arr: "24000", mrr: "2000", close: "2026-09-30", stage: "Demo vereinbart" },
];

const emptyDraft = (): DealDraft => ({ value: "", owner: "", arr: "", mrr: "", close: "" });
const fmtEur = (v: string) => (v && !Number.isNaN(Number(v)) ? `€ ${Number(v).toLocaleString("de-DE")}` : "—");
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }) : "—");

let seq = 0;

export default function DealsListe({ onToast }: { onToast?: (msg: string) => void }) {
  const [deals, setDeals] = useState<DealItem[]>(DEFAULT_DEALS);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DealDraft>(emptyDraft());

  const openNew = () => { setEditingId(null); setDraft(emptyDraft()); setCreating(true); };
  const openEdit = (d: DealItem) => {
    setEditingId(d.id);
    setDraft({ value: d.value, owner: d.owner, arr: d.arr, mrr: d.mrr, close: d.close });
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
                  <p className="text-[15px] font-extrabold text-text-primary leading-tight">{fmtEur(d.value)}</p>
                  <p className="text-[11px] text-text-muted mt-0.5 truncate">{d.owner || "Kein Owner"} · Abschluss: {fmtDate(d.close)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StageBadge stage={d.stage} />
                <div className={`flex items-center gap-1 ${HOVER_ACTIONS}`}>
                  <button onClick={() => openEdit(d)} aria-label="Bearbeiten" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(d.id)} aria-label="Löschen" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-1.5 mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold">ARR: {fmtEur(d.arr)}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold">MRR: {fmtEur(d.mrr)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
