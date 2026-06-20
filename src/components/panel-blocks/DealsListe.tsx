/**
 * DealsListe — Deals im 820px-Panel. Zwei Darstellungen aus EINER Datenquelle (getDealsByContact):
 *  - variant="compact" (Übersicht): kompakte Karten ALLER Deals (primärer zuerst), ab >2 einklappbar,
 *    Edit-Affordanz je Karte → navigiert in den Deals-Tab + öffnet genau diesen Deal (onEditDeal).
 *  - variant="detail" (Deals-Tab): Liste, jede Karte AUFKLAPPBAR → aufgeklappt die detaillierte Box
 *    (DealSetup embedded) + Bearbeiten/Löschen; das Edit-Formular wandert in die aufgeklappte Karte.
 * Ohne `dealRows`: Mock (Standalone, `NewDealCard`-Formular). Tokens-only.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Briefcase, Pencil, Trash2, Check, X, CheckCircle2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";
import { dealToView, WON_STAGE_SLUG, LOST_STAGE_SLUG, type DealView } from "@/lib/hunterMappers";
import StageBadge from "./StageBadge";
import DealSetup from "./DealSetup";
import NewDealCard, { type DealDraft } from "./NewDealCard";

const LABEL = "text-[11px] font-semibold text-text-muted";
const FIELD = "w-full px-3.5 py-2.5 rounded-[10px] border outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] font-semibold";

interface DealItem extends DealDraft { id: string; stage: string; }

const OWNERS = ["Oliver Sand", "Lena Brandt", "Marc Vogel"];

// ── Read-Modus: echte Deals des Kontakts. Deal-Sicht zentral aus dealToView (hunterMappers). ──
const money = (v: number, currency: string) =>
  currency === "EUR" ? `€ ${v.toLocaleString("de-DE")}` : `${currency} ${v.toLocaleString("de-DE")}`;
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });

type CreateValues = { name: string; product: string; value: string; termMonths: string; noticePeriodDays: string; expectedCloseDate: string; ownerId: string; stage: string };

function DealsListeReadonly({
  items, productOptions, ownerOptions, stageOptions,
  variant = "detail", primaryDealId,
  onCreate, onUpdate, onDelete, onEditDeal,
  autoNew = false, autoEditId, onAutoConsumed,
  onChangeStage, stageChangePendingId,
}: {
  items: DealView[];
  productOptions?: string[];
  ownerOptions?: { id: string; name: string }[];
  stageOptions?: { slug: string; name: string }[];
  /** Stage-Badge klickbar machen: Auswahl → onChangeStage(dealId, newSlug). Fehlt → Badge bleibt dekorativ. */
  onChangeStage?: (dealId: string, newSlug: string) => void;
  /** dealId dessen Stage-Write gerade läuft → dessen Badge disabled. */
  stageChangePendingId?: string | null;
  /** compact = Übersicht (kompakte Karten, Edit navigiert) · detail = Deals-Tab (aufklappbar + editierbar). */
  variant?: "compact" | "detail";
  /** Primärer (aktiver) Deal — in der compact-Ansicht zuerst. */
  primaryDealId?: string;
  onCreate?: (v: CreateValues) => void;
  onUpdate?: (dealId: string, v: CreateValues) => void;
  onDelete?: (dealId: string) => void;
  /** compact: Edit-Affordanz → in den Deals-Tab wechseln + diesen Deal aufgeklappt/editierbar öffnen. */
  onEditDeal?: (dealId: string) => void;
  /** Footer „Deal" öffnet das Anlege-Formular (detail). */
  autoNew?: boolean;
  /** Von der Übersicht „Bearbeiten" navigiert → diesen Deal aufklappen + bearbeiten (detail). */
  autoEditId?: string;
  onAutoConsumed?: () => void;
}) {
  const { t } = useTranslation();
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false); // compact: alle anzeigen vs. erste 2
  const [name, setName] = useState("");
  const [product, setProduct] = useState<string>("");
  const [ownerId, setOwnerId] = useState<string>(""); // P5c-1: Default leer (kein Auto-Set, [D21])
  const [stage, setStage] = useState<string>("backlog"); // P5c-2b: Default erste Stage (Backlog)
  const [value, setValue] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [noticePeriodDays, setNoticePeriodDays] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [error, setError] = useState(false);
  const isEdit = editingId !== null;
  const formOpen = composerOpen || isEdit;
  const firstStageSlug = stageOptions?.[0]?.slug ?? "backlog"; // Default-Stage = erste (Backlog)

  const reset = () => {
    setName(""); setProduct(""); setOwnerId(""); setStage(firstStageSlug); setValue("");
    setTermMonths(""); setNoticePeriodDays(""); setExpectedCloseDate("");
    setError(false); setComposerOpen(false); setEditingId(null);
  };
  // Vorbefüllen aus dem Deal (Strings); fehlende Werte → leer. Edit klappt den Deal mit auf.
  const openEdit = (d: DealView) => {
    setComposerOpen(false);
    setName(d.name);
    setProduct(d.product ?? "");
    setOwnerId(d.ownerId ?? "");
    setValue(d.valueEur != null ? String(d.valueEur) : "");
    setTermMonths(d.termMonths != null ? String(d.termMonths) : "");
    setNoticePeriodDays(d.noticePeriodDays != null ? String(d.noticePeriodDays) : "");
    setExpectedCloseDate(d.expectedCloseDate ?? "");
    setStage(d.stageSlug || firstStageSlug);
    setError(false); setEditingId(d.id);
  };
  const save = () => {
    if (!name.trim()) { setError(true); return; }
    const v: CreateValues = { name: name.trim(), product, value, termMonths, noticePeriodDays, expectedCloseDate, ownerId, stage };
    if (isEdit && editingId) onUpdate?.(editingId, v);
    else onCreate?.(v); // Insert/Update + invalidate + Toast übernimmt das Panel
    reset();
  };

  // Footer „Deal" → Create-Formular öffnen (auch bei schon offenem Tab; Prop-Änderung, nicht nur Mount).
  useEffect(() => {
    if (autoNew) { setEditingId(null); setComposerOpen(true); onAutoConsumed?.(); }
  }, [autoNew]); // eslint-disable-line react-hooks/exhaustive-deps
  // Übersicht „Bearbeiten" → diesen Deal aufklappen + bearbeiten.
  useEffect(() => {
    if (!autoEditId) return;
    const d = items.find((x) => x.id === autoEditId);
    if (d) openEdit(d);
    onAutoConsumed?.();
  }, [autoEditId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subzeile (Wert · Owner · Abschluss) + Chips (Produkt/MRR/ARR, nur echte Werte — Honesty).
  // Chips (Produkt · MRR · ARR) für die kompakten Übersicht-Karten — nur echte Werte (Honesty).
  const meta = (d: DealView) => {
    const chips = [
      d.product ? { key: "product", label: d.product, accent: true } : null,
      d.mrr != null ? { key: "mrr", label: `MRR: ${money(Math.round(d.mrr), d.currency)}`, accent: false } : null,
      d.arr != null ? { key: "arr", label: `ARR: ${money(Math.round(d.arr), d.currency)}`, accent: false } : null,
    ].filter(Boolean) as { key: string; label: string; accent: boolean }[];
    return { chips };
  };
  // Dealbetrag prominent: hellteal Pill, immer rechts → bei mehreren Deals bündig untereinander, schnell erfassbar.
  const amountPill = (d: DealView) => d.valueEur != null ? (
    <span className="px-2.5 py-1 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[13px] font-extrabold whitespace-nowrap shrink-0">{money(d.valueEur, d.currency)}</span>
  ) : null;
  const chipsRow = (chips: { key: string; label: string; accent: boolean }[]) => chips.length > 0 ? (
    <div className="flex items-center flex-wrap gap-1.5 mt-3">
      {chips.map((c) => c.accent ? (
        <span key={c.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[10px] font-bold">{c.label}</span>
      ) : (
        <span key={c.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold">{c.label}</span>
      ))}
    </div>
  ) : null;
  const head = (d: DealView) => {
    const closeDate = d.closedAt ?? d.endDate;
    const metaText = [d.owner ?? null, closeDate ? `Abschluss: ${dateLabel(closeDate)}` : null].filter(Boolean).join(" · ");
    return (
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-10 rounded-[10px] shrink-0 inline-flex items-center justify-center bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]">
          <Briefcase className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="typo-card-title text-text-primary leading-tight truncate">{d.name}</p>
          {/* Abschluss-Vermerk (Won/Lost) NICHT mehr hier — eigener grauer Block unten (closeInfo). */}
          {/* Betrag = Leitzahl → prominent direkt unter dem Namen (links), daneben Owner · Abschluss.
              Stage-Badge sitzt allein oben rechts (Status-Konvention). */}
          <div className="flex items-center gap-2 mt-1 min-w-0">
            {amountPill(d)}
            {metaText && <span className="typo-subline text-text-muted truncate">{metaText}</span>}
          </div>
        </div>
      </div>
    );
  };

  // Geteiltes Formular (Anlegen + Bearbeiten) — Outer-Card setzt der Aufrufer (Create oben / Edit in der Karte).
  const renderForm = () => (
    <div className="space-y-3">
      {isEdit && <span className="typo-section-label text-text-muted">{t("hunter.panel.editDeal")}</span>}
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
      {/* Stage wählbar (Anlegen + Bearbeiten), ALLE Stages inkl. Gewonnen/Verloren. Wechsel beim Edit → updateDealStage. */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className={LABEL}>{t("hunter.common.stage")}</label>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className={`${FIELD} border-border bg-app-bg`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {(stageOptions ?? []).map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
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
          <label className={LABEL}>{t("hunter.panel.owner")}</label>
          <Select value={ownerId || undefined} onValueChange={setOwnerId}>
            <SelectTrigger className={`${FIELD} border-border bg-app-bg`}><SelectValue placeholder={t("hunter.panel.ownerPlaceholder")} /></SelectTrigger>
            <SelectContent>
              {(ownerOptions ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className={LABEL}>{t("hunter.panel.value")} (€)</label>
          <input type="number" min="0" step="100" value={value} onChange={(e) => setValue(e.target.value)} placeholder="25000" className={`${FIELD} border-border bg-app-bg`} />
          <span className="text-[10px] text-text-muted">{t("hunter.panel.valueHint")}</span>
        </div>
      </div>
      {/* Optionale Vertrags-/Forecast-Felder — leer lassen erlaubt (dann nicht geschrieben). */}
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
      {/* Probability ist KEIN Deal-Feld — Admin setzt sie pro Stage (Pipeline-Settings). */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={reset} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-text-muted hover:text-text-body text-[11px] font-bold transition-colors cursor-pointer">
          <X className="w-3.5 h-3.5" /> {t("hunter.common.cancel")}
        </button>
        <button onClick={save} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
          <Check className="w-3.5 h-3.5" /> {t("hunter.panel.save")}
        </button>
      </div>
    </div>
  );

  // Lösch-Bestätigung (soft delete) — abbrechbar (Muster wie Tasks/Notes).
  const confirmBar = (id: string) => (
    <div className="px-3 py-2.5 rounded-[10px] bg-[var(--signal-urgent-bg)] flex items-center justify-between gap-3 animate-fade-in">
      <span className="text-[12px] font-bold text-[var(--signal-urgent-text)]">{t("hunter.panel.confirmDeleteDeal")}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 rounded-[10px] border border-border bg-app-surface text-text-body text-[11px] font-bold hover:bg-app-bg transition-colors cursor-pointer">
          {t("hunter.common.cancel")}
        </button>
        <button onClick={() => { onDelete?.(id); setConfirmDeleteId(null); }} className="px-3 py-1.5 rounded-[10px] bg-[var(--signal-urgent-text)] text-on-accent text-[11px] font-bold hover:opacity-90 transition-opacity cursor-pointer">
          {t("hunter.panel.delete")}
        </button>
      </div>
    </div>
  );

  // Abschluss-Vermerk (Won/Lost) — eigene graue Box ganz UNTEN auf der Karte (letztes Ereignis).
  // Nur bei terminalem Deal + vorhandenem Grund/Notiz (Honesty: sonst nichts).
  const closeInfo = (d: DealView) => {
    const isLost = d.stageSlug === LOST_STAGE_SLUG;
    const isWon = d.stageSlug === WON_STAGE_SLUG;
    if (!isLost && !isWon) return null;
    const reason = isLost ? d.lostReason : d.wonReason;
    const note = isLost ? d.lostNote : d.wonNote;
    if (!reason && !note) return null;
    return (
      <div className="mt-3 bg-app-bg rounded-[10px] px-3.5 py-2.5">
        <span className="typo-section-label text-text-muted">{isLost ? "Verloren" : "Gewonnen"}</span>
        {reason && <div className="text-[12px] font-semibold text-text-body mt-1">{reason}</div>}
        {note && <div className="text-[11px] italic text-text-muted mt-0.5">„{note}"</div>}
      </div>
    );
  };

  // ── COMPACT (Übersicht): alle Deals kompakt, primärer zuerst, ab >2 einklappbar, Edit navigiert. ──
  // Karten-Klasse: gewonnene Deals bekommen einen dezenten grünen linken Rand (Status-Highlight).
  const cardCls = (d: DealView) =>
    `group p-4 bg-app-surface border border-border rounded-[12px] shadow-sm${d.stageSlug === WON_STAGE_SLUG ? " border-l-2 border-l-[var(--signal-success-text)]" : ""}`;

  // Stage-Badge: gewonnen → grünes „Gewonnen"-Badge (Lucide-Icon, kein Emoji); sonst dekorativ
  // (ohne onChangeStage) ODER klickbar (Wrapper + Inline-Dropdown). StageBadge selbst unangetastet.
  const stageControl = (d: DealView) => {
    if (d.stageSlug === WON_STAGE_SLUG) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium w-fit bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]">
          <CheckCircle2 className="w-3 h-3" /> Gewonnen
        </span>
      );
    }
    if (!d.stageLabel) return null;
    if (!onChangeStage) return <StageBadge stage={d.stageLabel} />;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={stageChangePendingId === d.id}>
          <button type="button" aria-label={t("hunter.common.edit")} data-tip="Stage ändern" className="cursor-pointer disabled:opacity-50 disabled:cursor-default rounded-full">
            <StageBadge stage={d.stageLabel} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(stageOptions ?? []).map((s) => (
            <DropdownMenuItem key={s.slug} disabled={s.slug === d.stageSlug} onSelect={() => onChangeStage(d.id, s.slug)}>
              {s.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (variant === "compact") {
    const primary = primaryDealId ? items.find((x) => x.id === primaryDealId) : undefined;
    const sorted = primary ? [primary, ...items.filter((x) => x.id !== primary.id)] : items;
    const visible = showAll ? sorted : sorted.slice(0, 2);
    const hidden = sorted.length - visible.length;
    return (
      <div className="space-y-3 animate-fade-in">
        <span className="typo-section-label text-text-muted">Deals</span>
        {sorted.length === 0 && <div className="text-[12px] text-text-muted px-1">{t("hunter.panel.noDeals")}</div>}
        {visible.map((d) => {
          const { chips } = meta(d);
          return (
            <div key={d.id} className={cardCls(d)}>
              <div className="flex items-start justify-between gap-3">
                {head(d)}
                {/* Oben rechts: nur Stage-Badge (Status) + Edit beim Hover. Betrag steht prominent unter dem Namen. */}
                <div className="flex items-center gap-2 shrink-0">
                  {stageControl(d)}
                  {onEditDeal && (
                    <button onClick={() => onEditDeal(d.id)} aria-label={t("hunter.common.edit")} data-tip={t("hunter.common.edit")} className={`w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer ${HOVER_ACTIONS}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {chipsRow(chips)}
              {closeInfo(d)}
            </div>
          );
        })}
        {sorted.length > 2 && (
          <button onClick={() => setShowAll((v) => !v)} className="px-1 text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">
            {showAll ? t("hunter.panel.showLessDeals") : t("hunter.panel.showMoreDeals", { n: hidden })}
          </button>
        )}
      </div>
    );
  }

  // ── DETAIL (Deals-Tab): jede Karte zeigt die detaillierte Box DIREKT (kein Aufklappen);
  //    Bearbeiten/Löschen erscheinen beim Hover. Im Edit ersetzt das Formular die Box. ──
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <span className="typo-section-label text-text-muted">Deals</span>
        {onCreate && !formOpen && (
          <button onClick={() => setComposerOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> {t("hunter.panel.newDeal")}
          </button>
        )}
      </div>

      {/* Anlege-Formular oben (eigene Karte) */}
      {composerOpen && (
        <div className="p-4 bg-app-surface border border-border rounded-[12px] shadow-sm animate-fade-in">
          {renderForm()}
        </div>
      )}

      {items.length === 0 && !composerOpen && (
        <div className="text-[12px] text-text-muted px-1">{t("hunter.panel.noDeals")}</div>
      )}

      <div className="space-y-3">
        {items.map((d) => {
          const editing = editingId === d.id;
          return (
            <div key={d.id} className={cardCls(d)}>
              <div className="flex items-start justify-between gap-3">
                {head(d)}
                {/* Oben rechts: nur Stage-Badge (Status) + Aktionen beim Hover. Betrag steht prominent unter dem Namen. */}
                <div className="flex items-center gap-2 shrink-0">
                  {stageControl(d)}
                  {(onUpdate || onDelete) && !editing && confirmDeleteId !== d.id && (
                    <div className={`flex items-center gap-1 ${HOVER_ACTIONS}`}>
                      {onUpdate && (
                        <button onClick={() => openEdit(d)} aria-label={t("hunter.common.edit")} data-tip={t("hunter.common.edit")} className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => setConfirmDeleteId(d.id)} aria-label={t("hunter.panel.delete")} data-tip={t("hunter.panel.delete")} className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Detail-Box direkt sichtbar; im Edit ersetzt das Formular sie. */}
              {editing ? (
                <div className="mt-3 pt-3 border-t border-border">{renderForm()}</div>
              ) : (
                <>
                  <div className="mt-3 pt-3 border-t border-border"><DealSetup deal={d} embedded /></div>
                  {closeInfo(d)}
                  {confirmDeleteId === d.id && <div className="mt-3">{confirmBar(d.id)}</div>}
                </>
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
  onToast, autoEdit = false, autoNew = false, onAutoEditConsumed, dealRows, stageNameBySlug, stageProbBySlug, productOptions, ownerOptions, stageOptions, variant, primaryDealId, onCreateDeal, onUpdateDeal, onDeleteDeal, onEditDeal, autoEditId, onChangeStage, stageChangePendingId,
}: {
  onToast?: (msg: string) => void;
  autoEdit?: boolean;
  autoNew?: boolean;
  onAutoEditConsumed?: () => void;
  /** Echte DB-Deal-Zeilen (Panel). undefined → Mock (Standalone). */
  dealRows?: Record<string, any>[];
  stageNameBySlug?: Record<string, string>;
  /** Stage→Probability (settings.pipeline_stages) — Probability wird daraus abgeleitet (P5c-2b). */
  stageProbBySlug?: Record<string, number>;
  /** Produkt-Katalog (Namen) fürs Dropdown (P5b). */
  productOptions?: string[];
  /** Owner-Auswahl (User der Org) fürs Dropdown (P5c-1). */
  ownerOptions?: { id: string; name: string }[];
  /** Pipeline-Stages (Slug+Name) fürs Stage-Dropdown beim Anlegen (P5c-2b). */
  stageOptions?: { slug: string; name: string }[];
  /** compact = Übersicht (kompakte Karten) · detail = Deals-Tab (aufklappbar). Default detail. */
  variant?: "compact" | "detail";
  /** Primärer (aktiver) Deal — compact zeigt ihn zuerst. */
  primaryDealId?: string;
  /** Deal anlegen (P5b/2b/5c-1/2b). value/term/notice/owner als String (Formular-Rohwerte); Stage gewählt (Slug). */
  onCreateDeal?: (v: CreateValues) => void;
  /** Deal bearbeiten (P5c-2/2b): dieselben Felder wie Create inkl. Stage (Probability ist kein Deal-Feld). */
  onUpdateDeal?: (dealId: string, v: CreateValues) => void;
  /** Deal soft-löschen (P5c-3). */
  onDeleteDeal?: (dealId: string) => void;
  /** compact: Edit-Affordanz → in den Deals-Tab navigieren + diesen Deal öffnen. */
  onEditDeal?: (dealId: string) => void;
  /** detail: von der Übersicht navigiert → diesen Deal aufklappen + bearbeiten. */
  autoEditId?: string;
  /** Stage-Badge klickbar (P8-2d): Auswahl → onChangeStage(dealId, newSlug). Fehlt → Badge dekorativ. */
  onChangeStage?: (dealId: string, newSlug: string) => void;
  /** dealId dessen Stage-Write läuft → dessen Badge disabled. */
  stageChangePendingId?: string | null;
}) {
  // Panel-Modus: lesen + anlegen/bearbeiten/löschen. Dispatch, damit die Mock-Hooks nicht hinter
  // einem Early-Return liegen (Rules of Hooks).
  if (dealRows !== undefined) {
    return (
      <DealsListeReadonly
        items={dealRows.map((r) => dealToView(r, stageNameBySlug ?? {}, stageProbBySlug ?? {}))}
        productOptions={productOptions}
        ownerOptions={ownerOptions}
        stageOptions={stageOptions}
        variant={variant}
        primaryDealId={primaryDealId}
        onCreate={onCreateDeal}
        onUpdate={onUpdateDeal}
        onDelete={onDeleteDeal}
        onEditDeal={onEditDeal}
        autoNew={autoNew}
        autoEditId={autoEditId}
        onAutoConsumed={onAutoEditConsumed}
        onChangeStage={onChangeStage}
        stageChangePendingId={stageChangePendingId}
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
