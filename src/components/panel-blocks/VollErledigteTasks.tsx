/**
 * VollErledigteTasks — „Erledigte Tasks"-Karte der Vollansicht (Tasks-Tab).
 * Extrahiert aus features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Square } from "lucide-react";

export default function VollErledigteTasks() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2">
          <Square className="w-4 h-4 text-[var(--icon-muted)]" /> ERLEDIGTE TASKS
        </h2>
      </div>
      <div className="flex flex-col gap-0 border-t border-[var(--border)]">
        <div className="flex items-center gap-4 py-4 border-b border-[var(--border)] -mx-8 px-8 opacity-60">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--icp-high)] bg-[var(--signal-success-bg)] flex items-center justify-center shrink-0">
            <Square className="w-2.5 h-2.5 text-[var(--icp-high)] fill-current" />
          </div>
          <div className="flex-1">
            <p className="text-[16px] font-bold text-[var(--text-muted)] line-through">Demo-Unterlagen vorbereiten</p>
            <p className="text-[14px] text-[var(--icon-muted)] mt-0.5">Erledigt am 22. Mai</p>
          </div>
        </div>
      </div>
    </div>
  );
}
