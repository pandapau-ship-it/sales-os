/**
 * OffeneTasks — offene Aufgaben des Kontakts (mit Checkbox + Kanal/Fälligkeit).
 * Extrahiert aus shared/HunterSidepanel.tsx.
 */
import { AlertTriangle, Mail, Phone } from "lucide-react";

export default function OffeneTasks({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Offene Tasks</span>
        <button onClick={onAdd} className="text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">+ Task hinzufügen</button>
      </div>
      <div className="space-y-3">
        <div className="p-4 rounded-[12px] flex items-center justify-between bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] shadow-sm">
          <div className="flex items-center gap-3">
            <input type="checkbox" className="accent-[var(--sherloq-primary)] w-4 h-4 cursor-pointer" />
            <div>
              <p className="text-xs font-bold text-[var(--signal-urgent-text)]">ROI-Dokument senden</p>
              <span className="text-[10px] font-semibold flex items-center gap-1.5 mt-1 text-[var(--signal-urgent-text)]"><AlertTriangle className="w-[10px] h-[10px]" /> Heute fällig · <Mail className="w-[11px] h-[11px]" /> Email</span>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-[12px] flex items-center justify-between bg-app-surface border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <input type="checkbox" className="accent-[var(--sherloq-primary)] w-4 h-4 cursor-pointer" />
            <div>
              <p className="text-xs font-bold text-text-primary">Follow-up Call buchen</p>
              <span className="text-[10px] font-semibold flex items-center gap-1.5 mt-1 text-text-muted">In 3 Tagen · <Phone className="w-[11px] h-[11px]" /> Telefon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
