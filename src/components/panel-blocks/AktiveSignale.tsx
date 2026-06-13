/**
 * AktiveSignale — Liste der aktiven Signale (verlinkt zu Action-Panels).
 * Extrahiert aus shared/HunterSidepanel.tsx. Zeigt künftig nur real vorhandene Signale.
 */
import { AlertTriangle, Clock } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

export default function AktiveSignale({ onAction }: { onAction?: (key: string) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest pl-1">Aktive Signale</span>
      <div className="space-y-3">
        <div className="p-4 bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-urgent-text)] font-semibold shadow-sm">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Stagniert — 8T in Stage Demo</span>
          <button onClick={() => onAction?.("stagniert")} className="text-[var(--signal-urgent-text)] hover:underline font-bold">Next Step →</button>
        </div>
        <div className="p-4 bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-warn-text)] font-semibold shadow-sm">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Keine Task hinterlegt</span>
          <button onClick={() => onAction?.("keine_task")} className="text-[var(--signal-warn-text)] hover:underline font-bold">Task anlegen →</button>
        </div>
        <div className="p-4 bg-[var(--signal-info-bg)] border border-[var(--signal-info-bg)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-info-text)] font-semibold shadow-sm">
          <span className="flex items-center gap-2"><LinkedinIcon className="w-4 h-4" /> LinkedIn Signal — vor 2h</span>
          <button onClick={() => onAction?.("signal")} className="text-[var(--signal-info-text)] hover:underline font-bold">Ansehen →</button>
        </div>
      </div>
    </div>
  );
}
