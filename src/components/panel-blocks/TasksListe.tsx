/**
 * TasksListe — alle Aufgaben des Kontakts (Tasks-Tab, 820px-Panel + Vollansicht).
 * Pro Task: Titel, Kontext, Detail-Pills (Kanal/Fälligkeit/Priorität/Stage) + Bearbeiten/Löschen.
 * Oben „Neue Task". Kanonischer Stand aus features/hunter/HunterSidepanel.tsx.
 * Prop-driven — Aktionen/Toasts liegen beim Aufrufer.
 */
import { Plus, Mail, Clock, Briefcase, Phone, Calendar, Pencil, Trash2 } from "lucide-react";

export default function TasksListe({
  onAdd, onEdit, onDelete,
}: { onAdd?: () => void; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Alle Aufgaben</span>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Neue Task
        </button>
      </div>

      <div className="space-y-3">
        {/* Task 1 — überfällig/heute, mit Detail-Infos + Aktionen */}
        <div className="p-4 bg-app-surface border border-border rounded-[12px] shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <input type="checkbox" className="accent-[var(--sherloq-primary)] w-4 h-4 mt-0.5 cursor-pointer shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-text-primary">ROI-Dokument senden</p>
                <p className="text-[11px] text-text-muted leading-relaxed mt-1">Demo war positiv — konkretes Angebot als nächsten Schritt senden.</p>
                <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold"><Mail className="w-3 h-3" /> Email</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)] text-[10px] font-bold"><Clock className="w-3 h-3" /> Heute fällig</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] text-[var(--signal-warn-text)] text-[10px] font-bold">Priorität: Hoch</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[10px] font-bold"><Briefcase className="w-3 h-3" /> Demo vereinbart</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onEdit} aria-label="Bearbeiten" className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} aria-label="Löschen" className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Task 2 — geplant */}
        <div className="p-4 bg-app-surface border border-border rounded-[12px] shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <input type="checkbox" className="accent-[var(--sherloq-primary)] w-4 h-4 mt-0.5 cursor-pointer shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-text-primary">Follow-up Call buchen</p>
                <p className="text-[11px] text-text-muted leading-relaxed mt-1">Nach dem Angebot kurzen Abschluss-Call zur Klärung offener Punkte vereinbaren.</p>
                <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-body text-[10px] font-bold"><Phone className="w-3 h-3" /> Telefon</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-muted text-[10px] font-bold"><Calendar className="w-3 h-3" /> In 3 Tagen</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-app-bg border border-border text-text-muted text-[10px] font-bold">Priorität: Mittel</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[10px] font-bold"><Briefcase className="w-3 h-3" /> Demo vereinbart</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onEdit} aria-label="Bearbeiten" className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} aria-label="Löschen" className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
