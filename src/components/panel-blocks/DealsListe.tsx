/**
 * DealsListe — Deal-Tab (820px-Panel + Vollansicht).
 * Panel-Modus (`dealRows`): **P5a nur lesen** — echte Deals des Kontakts (Name/Produkt/
 * Stage/Wert/Owner/Abschluss); arr/mrr entfallen (kein DB-Pendant); leer → ruhiger Hinweis.
 * Anlegen/Bearbeiten/Löschen kommen später (P5b/P8).
 * Ohne `dealRows`: Mock (Standalone, `NewDealCard`-Formular, on-hover Edit/Löschen). Tokens-only.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Briefcase, Pencil, Trash2, Check, X } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";
import { dealToView, type DealView } from "@/lib/hunterMappers";
import StageBadge from "./StageBadge";
import NewDealCard, { type DealDraft } from "./NewDealCard";

const LABEL = "text-[11px] font-semibold text-text-muted";
const FIELD = "w-full px-3.5 py-2.5 rounded-[10px] border outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] font-semibold";

interface DealItem extends DealDraft { id: string; stage: string; }

const OWNERS = ["Oliver Sand", "Lena Brandt", "Marc Vogel"];

// ── P5a Read-Modus: echte Deals des Kontakts (nur lesen) ──────────────────────
// Deal-Sicht kommt zentral aus dealToView (hunterMappers) — keine eigene Feldlogik mehr.
const money = (v: number, currency: string) =>
  currency === "EUR" ? `€ ${v.toLocaleString("de-DE")}` : `${currency} ${v.toLocaleString("de-DE")}`;
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });

/**
 * DealsListeReadonly — Panel-Deals: echte Felder lesen (arr/mrr entfallen) + Deal anlegen (P5b).
 * Anlege-Formular bewusst LEAN: nur persistierte Felder (Name/Produkt/Wert) — kein owner/arr/mrr/
 * close-Input, der ins Leere liefe. Produkt-Dropdown aus dem echten Katalog (productOptions).
 */
function DealsListeReadonly({ items, productOptions, onCreate, autoNew = false, onAutoConsumed }: {
  items: DealView[];
  productOptions?: string[];
  // Alle Felder als String (Formular-Rohwerte). Term/Notice/Close sind OPTIONAL — leer → nicht geschrieben.
  onCreate?: (v: { name: string; product: string; value: string; termMonths: string; noticePeriodDays: string; expectedCloseDate: string }) => void;
  /** Footer „Deal" öffnet das Anlege-Formular direkt (auch wenn der Tab schon offen ist). */
  autoNew?: boolean;
  onAutoConsumed?: () => void;
}) {
  const { t } = useTranslation();
  const [composerOpen, setComposerOpen] = useState(!!autoNew); // Remount-Fall (kein Flash)
  const [name, setName] = useState("");
  const [product, setProduct] = useState<string>("");
  const [value, setValue] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [noticePeriodDays, setNoticePeriodDays] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [error, setError] = useState(false);

  // Footer „Deal" → autoNew öffnet das Formular auch bei schon offenem Tab (Prop-Änderung, nicht nur Mount).
  useEffect(() => {
    if (autoNew) { setComposerOpen(true); onAutoConsumed?.(); }
  }, [autoNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setName(""); setProduct(""); setValue("");
    setTermMonths(""); setNoticePeriodDays(""); setExpectedCloseDate("");
    setError(false); setComposerOpen(false);
  };
  const save = () => {
    if (!name.trim()) { setError(true); return; }
    onCreate?.({ name: name.trim(), product, value, termMonths, noticePeriodDays, expectedCloseDate }); // Insert + invalidate + Toast übernimmt das Panel
    reset();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <span className="typo-section-label text-text-muted">Deals</span>
        {onCreate && !composerOpen && (
          <button onClick={() => setComposerOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> {t("hunter.panel.newDeal")}
          </button>
        )}
      </div>

      {/* Anlege-Formular (lean: Name Pflicht · Produkt aus Katalog · Wert in €) */}
      {composerOpen && (
        <div className="p-4 bg-app-surface border border-border rounded-[12px] shadow-sm animate-fade-in space-y-3">
          <div className="space-y-1.5">
            <label className={LABEL}>{t("hunter.panel.dealName")}</label>
            <input
              autoFocus type="text" value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(false); }}
              placeholder="z.B. LogixFlow — Growth"
              className={`${FIELD} ${error ? "border-[var(--signal-warn-text)] bg-[var(--signal-warn-bg)]" : "border-border bg-app-bg"}`}
            />
            {error && <span className="text-[11px] font-semibold text-[var(--signal-warn-text)]">{t("hunter.panel.nameRequired")}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.panel.product")}</label>
              <Select value={product || undefined} onValueChange={setProduct}>
                <SelectTrigger className={`${FIELD} border-border bg-app-bg`}><SelectValue placeholder={t("hunter.panel.productPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {(productOptions ?? []).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.panel.value")} (€)</label>
              <input type="number" min="0" step="100" value={value} onChange={(e) => setValue(e.target.value)} placeholder="25000" className={`${FIELD} border-border bg-app-bg`} />
              <span className="text-[10px] text-text-muted">{t("hunter.panel.valueHint")}</span>
            </div>
          </div>
          {/* Optionale Vertrags-/Forecast-Felder — alle leer lassen erlaubt (dann nicht geschrieben). */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.panel.termMonths")}</label>
              <input type="number" min="0" step="1" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} placeholder="12" className={`${FIELD} border-border bg-app-bg`} />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.panel.noticePeriodDays")}</label>
              <input type="number" min="0" step="1" value={noticePeriodDays} onChange={(e) => setNoticePeriodDays(e.target.value)} placeholder="30" className={`${FIELD} border-border bg-app-bg`} />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{t("hunter.panel.expectedCloseDate")}</label>
              <input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} className={`${FIELD} border-border bg-app-bg`} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={reset} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-text-muted hover:text-text-body text-[11px] font-bold transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" /> {t("hunter.common.cancel")}
            </button>
            <button onClick={save} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
              <Check className="w-3.5 h-3.5" /> {t("hunter.panel.save")}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !composerOpen && (
        <div className="text-[12px] text-text-muted px-1">{t("hunter.panel.noDeals")}</div>
      )}

      <div className="space-y-3">
        {items.map((d) => {
          const closeDate = d.closedAt ?? d.endDate; // tatsächlicher Abschluss, sonst Vertragsende
          const sub = [
            d.valueEur != null ? money(d.valueEur, d.currency) : null,
            d.owner ?? null,
            closeDate ? `Abschluss: ${dateLabel(closeDate)}` : null,
          ].filter(Boolean).join(" · ");
          // Chips nur mit echten Werten (Honesty): Produkt · MRR · ARR (berechnet, nur wenn term_months gesetzt).
          const chips = [
            d.product ? { key: "product", label: d.product, accent: true } : null,
            d.mrr != null ? { key: "mrr", label: `MRR: ${money(Math.round(d.mrr), d.currency)}`, accent: false } : null,
            d.arr != null ? { key: "arr", label: `ARR: ${money(Math.round(d.arr), d.currency)}`, accent: false } : null,
          ].filter(Boolean) as { key: string; label: string; accent: boolean }[];
          return (
            <div key={d.id} className="p-4 bg-app-surface border border-border rounded-[12px] shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-[10px] shrink-0 inline-flex items-center justify-center bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="typo-card-title text-text-primary leading-tight truncate">{d.name}</p>
                    {sub && <p className="typo-subline text-text-muted mt-0.5 truncate">{sub}</p>}
                  </div>
                </div>
                {d.stageLabel && <StageBadge stage={d.stageLabel} />}
              </div>
              {chips.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5 mt-3">
                  {chips.map((c) =>
                    c.accent ? (
                      <span key={c.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[10px] font-bold">{c.label}</span>
                    ) : (
                      <span key={c.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold">{c.label}</span>
                    ),
                  )}
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
  onToast, autoEdit = false, autoNew = false, onAutoEditConsumed, dealRows, stageNameBySlug, productOptions, onCreateDeal,
}: {
  onToast?: (msg: string) => void;
  autoEdit?: boolean;
  autoNew?: boolean;
  onAutoEditConsumed?: () => void;
  /** Echte DB-Deal-Zeilen (Panel). undefined → Mock (Standalone). */
  dealRows?: Record<string, any>[];
  stageNameBySlug?: Record<string, string>;
  /** Produkt-Katalog (Namen) fürs Dropdown (P5b). */
  productOptions?: string[];
  /** Deal anlegen (P5b/2b). value/term/notice als String (Formular-Rohwerte); term/notice/close optional. */
  onCreateDeal?: (v: { name: string; product: string; value: string; termMonths: string; noticePeriodDays: string; expectedCloseDate: string }) => void;
}) {
  // P5a/P5b — Panel-Modus: lesen + anlegen (Bearbeiten/Löschen = P5c, Stage = P8). Dispatch, damit
  // die Mock-Hooks nicht hinter einem Early-Return liegen (Rules of Hooks).
  if (dealRows !== undefined) {
    return (
      <DealsListeReadonly
        items={dealRows.map((r) => dealToView(r, stageNameBySlug ?? {}))}
        productOptions={productOptions}
        onCreate={onCreateDeal}
        autoNew={autoNew}
        onAutoConsumed={onAutoEditConsumed}
      />
    );
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
        <span className="typo-section-label text-text-muted">Deals</span>
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
                  <p className="typo-card-title text-text-primary leading-tight truncate">{d.name || fmtEur(d.value)}</p>
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
