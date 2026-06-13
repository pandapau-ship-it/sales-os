/**
 * DealSetup — Deal-Kennzahlen-Grid (Master-Card-Stil). Extrahiert aus shared/HunterSidepanel.tsx.
 */
import { AlertTriangle, Briefcase } from "lucide-react";

export default function DealSetup({ stage = "Demo vereinbart" }: { stage?: string }) {
  return (
    <div className="bg-app-surface rounded-[12px] p-5 border border-border shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-text-muted uppercase tracking-wider mb-4">
        <Briefcase className="w-4 h-4" /> Deal Setup
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
