/**
 * OffeneTasks — offene Aufgaben des Kontakts (Übersicht). Klick auf eine Kachel → Tasks-Tab
 * (`onOpenTasks`). Hover: Farbwechsel + Aktionen (Bearbeiten/Löschen/Erledigt) erscheinen.
 * Keine Auswahl-Checkbox mehr. Extrahiert aus shared/HunterSidepanel.tsx.
 */
import { AlertTriangle, Mail, Phone, Pencil, Trash2, Check } from "lucide-react";
import { HOVER_ACTIONS } from "@/lib/componentBehavior";

export default function OffeneTasks({
  onAdd, onOpenTasks, onToast,
}: { onAdd?: () => void; onOpenTasks?: () => void; onToast?: (msg: string) => void }) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const Actions = () => (
    <div className={`flex items-center gap-1 shrink-0 ${HOVER_ACTIONS}`}>
      <button onClick={(e) => { stop(e); onOpenTasks?.(); }} aria-label="Bearbeiten" title="Bearbeiten" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-surface transition-colors cursor-pointer">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={(e) => { stop(e); onToast?.("Task gelöscht"); }} aria-label="Löschen" title="Löschen" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={(e) => { stop(e); onToast?.("Task erledigt ✓"); }} aria-label="Erledigt" title="Erledigt" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-success-text)] hover:bg-[var(--signal-success-bg)] transition-colors cursor-pointer">
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Offene Tasks</span>
        <button onClick={onAdd} className="text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">+ Task hinzufügen</button>
      </div>
      <div className="space-y-3">
        <div onClick={onOpenTasks} className="group p-4 rounded-[12px] flex items-center justify-between gap-3 bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--signal-urgent-text)]">ROI-Dokument senden</p>
            <span className="text-[10px] font-semibold flex items-center gap-1.5 mt-1 text-[var(--signal-urgent-text)]"><AlertTriangle className="w-[10px] h-[10px]" /> Heute fällig · <Mail className="w-[11px] h-[11px]" /> Email</span>
          </div>
          <Actions />
        </div>
        <div onClick={onOpenTasks} className="group p-4 rounded-[12px] flex items-center justify-between gap-3 bg-app-surface border border-border shadow-sm cursor-pointer transition-all hover:bg-app-bg hover:shadow-md hover:-translate-y-0.5">
          <div className="min-w-0">
            <p className="text-xs font-bold text-text-primary">Follow-up Call buchen</p>
            <span className="text-[10px] font-semibold flex items-center gap-1.5 mt-1 text-text-muted">In 3 Tagen · <Phone className="w-[11px] h-[11px]" /> Telefon</span>
          </div>
          <Actions />
        </div>
      </div>
    </div>
  );
}
