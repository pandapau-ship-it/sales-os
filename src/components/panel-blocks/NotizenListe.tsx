/**
 * NotizenListe — Notizen-Tab (820px-Panel + Vollansicht): manuelle Notizen mit
 * Datum/Autor + Speichern/Bearbeiten/Löschen, oben „Neue Notiz".
 * Kanonischer Stand aus features/hunter/HunterSidepanel.tsx. Prop-driven (Toasts beim Aufrufer).
 */
import { Plus, Save, Pencil, Trash2 } from "lucide-react";

export default function NotizenListe({
  onAdd, onSave, onEdit, onDelete,
}: { onAdd?: () => void; onSave?: () => void; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Notizen</span>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--sherloq-primary)] text-on-accent text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Neue Notiz
        </button>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-app-surface border border-border rounded-[12px] shadow-sm group">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] text-text-muted font-bold">12. Mai 2026 · Oliver Prossi</span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onSave} aria-label="Speichern" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-bg transition-colors cursor-pointer">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={onEdit} aria-label="Ändern" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} aria-label="Löschen" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[12px] text-text-body font-medium leading-relaxed mt-1.5">Thomas hat angedeutet, dass das Q3-Budget freigegeben wird.</p>
        </div>

        <div className="p-4 bg-app-surface border border-border rounded-[12px] shadow-sm group">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] text-text-muted font-bold">03. April 2026 · Oliver Prossi</span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onSave} aria-label="Speichern" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-app-bg transition-colors cursor-pointer">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={onEdit} aria-label="Ändern" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} aria-label="Löschen" className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[12px] text-text-body font-medium leading-relaxed mt-1.5">Demo lief hervorragend, Thomas war sehr engagiert.</p>
        </div>
      </div>
    </div>
  );
}
