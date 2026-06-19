/**
 * ActiveSequenceChain — Sequenz-Fortschritt als Kanal-Kette (Schritt X von Y).
 * Extrahiert aus shared/HunterSidepanel.tsx.
 */
import { Mail, Phone, Calendar } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

export default function ActiveSequenceChain() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="typo-section-label text-text-muted">Active Sequence</span>
        <span className="text-[11px] font-bold text-[var(--sherloq-primary)]">Schritt 3 von 5</span>
      </div>
      <div className="bg-app-surface rounded-[12px] p-6 border border-border shadow-sm flex items-start justify-between relative px-8">
        <div className="absolute left-12 right-12 top-[42px] h-px bg-border z-0"></div>
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--sherloq-primary)] text-on-accent shadow-sm"><Mail className="w-[14px] h-[14px]" /></div>
          <span className="text-[10px] font-bold text-text-muted">Mail</span>
        </div>
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--sherloq-primary)] text-on-accent shadow-sm"><LinkedinIcon className="w-[14px] h-[14px]" /></div>
          <span className="text-[10px] font-bold text-text-muted">LinkedIn</span>
        </div>
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-app-surface border-2 border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] shadow-sm"><Phone className="w-[14px] h-[14px]" /></div>
          <span className="text-[10px] font-bold text-[var(--sherloq-primary)]">Telefon</span>
        </div>
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-app-surface border-2 border-dashed border-border text-icon-muted"><Mail className="w-[14px] h-[14px]" /></div>
          <span className="text-[10px] font-bold text-text-muted">Mail</span>
        </div>
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-app-surface border-2 border-dashed border-border text-icon-muted"><Calendar className="w-[14px] h-[14px]" /></div>
          <span className="text-[10px] font-bold text-text-muted">Termin</span>
        </div>
      </div>
    </div>
  );
}
