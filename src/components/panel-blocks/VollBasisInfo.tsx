/**
 * VollBasisInfo — „Basis Info"-Karte der Vollansicht. Extrahiert aus
 * features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Edit2, FileText, Globe } from "lucide-react";

export default function VollBasisInfo() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--icon-muted)]" /> BASIS INFO
        </h2>
        <button className="flex items-center gap-1.5 text-[var(--text-muted)] text-[13px] font-semibold hover:text-[var(--sherloq-primary)]">
          <Edit2 className="w-3.5 h-3.5" /> Bearbeiten
        </button>
      </div>
      <div className="flex flex-col gap-6">
        <div>
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">QUELLE</div>
          <div className="text-[var(--signal-info-text)] font-semibold text-[14px] flex items-center gap-1.5">LinkedIn Signal</div>
        </div>
        <div>
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">CLUSTER</div>
          <div className="text-[var(--text-primary)] font-bold text-[12px] bg-[var(--app-bg)] px-2 py-0.5 rounded inline-block">Customer</div>
        </div>
        <div>
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">STANDORT</div>
          <div className="text-[var(--text-primary)] font-medium text-[14px] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--icon-muted)]" /> München, DE (80331)
          </div>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">UNIQUE ID</div>
        <div className="text-[var(--text-primary)] font-semibold text-[14px]">#CRM-4872</div>
      </div>
    </div>
  );
}
