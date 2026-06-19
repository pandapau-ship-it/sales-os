/**
 * DealSetup — Deal-Kennzahlen-Grid (Master-Card-Stil) für die Übersicht.
 * Datengetrieben über den zentralen Deal-Resolver (`DealView` aus hunterMappers) —
 * KEINE hardcodierten Werte. Honesty: jedes Feld ohne Wert wird ausgeblendet (kein
 * Platzhalter/0). MRR/ARR sind berechnet (erscheinen nur, wenn term_months gesetzt).
 * Hover → Bearbeiten-Stift (führt in den Deal-Tab, `onEdit`). Mehrere Deals: Count-Badge
 * neben der Überschrift → `onOpenDeals` (Deal-Tab). „In Stage seit" bleibt vorerst weg
 * (Stagnation ist deferred).
 */
import { Briefcase, Pencil } from "lucide-react";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";
import type { DealView } from "@/lib/hunterMappers";

const money = (v: number, currency: string) =>
  currency === "EUR" ? `${Math.round(v).toLocaleString("de-DE")} €` : `${currency} ${Math.round(v).toLocaleString("de-DE")}`;
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });

export default function DealSetup({
  deal, count = 0, onEdit, onOpenDeals,
}: { deal?: DealView; count?: number; onEdit?: () => void; onOpenDeals?: () => void }) {
  // Nur echte Werte (Honesty) — fehlt der Wert, fällt die Zelle ganz weg.
  const cells: { label: string; value: string; accent?: boolean }[] = deal
    ? [
        deal.product ? { label: "Produkt", value: deal.product } : null,
        deal.stageLabel ? { label: "Stage", value: deal.stageLabel } : null,
        deal.owner ? { label: "Owner", value: deal.owner } : null, // Name aus dealToView; fehlt → ausgeblendet (kein Fake)
        deal.probability != null ? { label: "Probability", value: `${deal.probability}%` } : null,
        deal.arr != null ? { label: "ARR", value: money(deal.arr, deal.currency), accent: true } : null,
        deal.mrr != null ? { label: "MRR", value: money(deal.mrr, deal.currency) } : null,
        deal.termMonths != null ? { label: "Laufzeit", value: `${deal.termMonths} Monate` } : null,
        deal.noticePeriodDays != null ? { label: "Kündigungsfrist", value: `${deal.noticePeriodDays} Tage` } : null,
        deal.expectedCloseDate ? { label: "Erw. Abschluss", value: dateLabel(deal.expectedCloseDate) } : null,
      ].filter(Boolean) as { label: string; value: string; accent?: boolean }[]
    : [];

  return (
    <div className="group bg-app-surface rounded-[12px] p-5 border border-border shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 typo-section-label text-text-muted">
          <Briefcase className="w-4 h-4" /> Deal Setup
          {count > 1 && (
            <button
              onClick={onOpenDeals}
              data-tip="Alle Deals ansehen"
              className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[10px] font-extrabold cursor-pointer hover:opacity-80 transition-opacity"
            >
              {count}
            </button>
          )}
        </div>
        {deal && onEdit && (
          <button
            onClick={onEdit}
            aria-label="Deal bearbeiten" data-tip="Deal bearbeiten"
            className={`w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-bg transition-colors cursor-pointer ${HOVER_ACTIONS}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!deal ? (
        <p className="text-[12px] text-text-muted">Kein Deal</p>
      ) : (
        <>
          {deal.name && <p className="typo-card-title text-text-primary -mt-1 mb-3 truncate">{deal.name}</p>}
          {cells.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[12px]">
              {cells.map((c) => (
                <div key={c.label} className="flex flex-col gap-1">
                  <span className="typo-field-label text-text-muted">{c.label}</span>
                  <span className={`typo-field-value truncate ${c.accent ? "text-[var(--sherloq-primary)]" : "text-text-primary"}`}>{c.value}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
