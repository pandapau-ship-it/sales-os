/**
 * VollTasksKompakt — kompakte „Tasks"-Karte der Vollansicht (Übersicht, rechte Spalte).
 * Extrahiert aus features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Check, Square, TriangleAlert } from "lucide-react";

export default function VollTasksKompakt() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
          <Check className="w-4 h-4 text-[var(--icon-muted)]" /> TASKS
        </h2>
        <button className="flex items-center gap-1.5 text-[var(--sherloq-primary)] text-[13px] font-semibold hover:opacity-80">
          <Square className="w-3.5 h-3.5" /> Neue Task
        </button>
      </div>
      <div className="flex items-center gap-3 p-3 bg-[var(--app-bg)] rounded-xl border border-[var(--signal-urgent-bg)] hover:bg-app-surface transition-colors cursor-pointer">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--icon-muted)] shrink-0"></div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-[var(--text-primary)]">Enterprise Upgrade ansprechen</p>
          <p className="text-[12px] text-[var(--text-muted)]">LinkedIn · AI-Nachricht bereit</p>
        </div>
        <div className="text-[var(--signal-urgent-text)] text-[12px] font-semibold flex items-center gap-1 mr-2 shrink-0">
          Heute <TriangleAlert className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
