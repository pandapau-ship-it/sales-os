/**
 * VollNotizen — „Notizen"-Karte der Vollansicht (Notizen-Tab).
 * Extrahiert aus features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Square } from "lucide-react";

export default function VollNotizen() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2">
          <Square className="w-4 h-4 text-[var(--icon-muted)]" /> NOTIZEN
        </h2>
        <button className="flex items-center gap-2 bg-[var(--sherloq-primary)] text-on-accent px-5 py-2.5 rounded-full font-bold text-[14px] hover:opacity-90 transition-colors shadow-sm">
          <Square className="w-4 h-4 opacity-80" /> Speichern
        </button>
      </div>

      <textarea
        className="w-full bg-app-surface border border-[var(--border)] rounded-[12px] p-5 text-[15px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--sherloq-primary)] focus:ring-1 focus:ring-[var(--sherloq-primary)] min-h-[120px] mb-8 placeholder-[var(--icon-muted)] resize-y shadow-sm"
        placeholder="Notiz hinzufügen..."
      ></textarea>

      <div className="flex flex-col gap-4">
        <div className="bg-[var(--app-bg)] rounded-xl p-4 text-[15px] text-[var(--text-body)] flex items-start gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sherloq-primary)] mt-2 shrink-0"></div>
          <div>
            <strong className="text-[var(--text-primary)]">28. Mai:</strong> Max möchte Enterprise-Demo bis Ende Juni. Board-Meeting am 15. Juni.
          </div>
        </div>
        <div className="bg-[var(--app-bg)] rounded-xl p-4 text-[15px] text-[var(--text-body)] flex items-start gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sherloq-primary)] mt-2 shrink-0"></div>
          <div>
            <strong className="text-[var(--text-primary)]">20. Mai:</strong> ROI-Dokument versendet. Max wirkte sehr interessiert, fragt nach Referenzkunden.
          </div>
        </div>
      </div>
    </div>
  );
}
