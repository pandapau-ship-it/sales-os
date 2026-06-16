/**
 * DealSetup — Deal-Kennzahlen-Grid (Master-Card-Stil) für die Übersicht.
 * Hover → Bearbeiten-Stift (führt in den Deal-Tab mit offener Bearbeiten-Kachel, `onEdit`).
 * Bei mehreren Deals: Count-Badge neben der Überschrift → `onOpenDeals` (Deal-Tab).
 */
import { AlertTriangle, Briefcase, Pencil } from "lucide-react";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";

export default function DealSetup({
  stage = "Demo vereinbart", count = 1, onEdit, onOpenDeals,
}: { stage?: string; count?: number; onEdit?: () => void; onOpenDeals?: () => void }) {
  return (
    <div className="group bg-app-surface rounded-[12px] p-5 border border-border shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-text-muted uppercase tracking-wider">
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
        {onEdit && (
          <button
            onClick={onEdit}
            aria-label="Deal bearbeiten" data-tip="Deal bearbeiten"
            className={`w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-bg transition-colors cursor-pointer ${HOVER_ACTIONS}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[12px]">
        <div className="flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Stage</span>
          <span className="font-bold text-text-primary text-[14px]">{stage}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Probability</span>
          <span className="font-bold text-text-primary text-[14px]">100%</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">ARR</span>
          <span className="font-bold text-[var(--sherloq-primary)] text-[14px]">12.500 €</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">MRR</span>
          <span className="font-bold text-text-primary text-[14px]">1.041 €</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Laufzeit</span>
          <span className="font-bold text-text-primary text-[14px]">12 Monate</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">In Stage seit</span>
          <span className="font-bold text-[var(--icp-low)] text-[14px] flex items-center gap-1.5">8 Tage <AlertTriangle className="w-3 h-3" /></span>
        </div>
      </div>
    </div>
  );
}
