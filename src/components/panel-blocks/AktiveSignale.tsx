/**
 * AktiveSignale — nur REAL ableitbare Signale des Kontakts (Übersicht):
 *  - „Stagniert — XT in Stage Y" NUR wenn deals.stagnation_days > 0 (von der Edge Function
 *    score_deal_health gesetzt; bis die existiert, bleibt 0 → kein Signal — kein Fake).
 *  - „Keine Task hinterlegt" wenn ein aktiver Deal vorhanden ist, aber keine offene Task.
 * Kein Signal ableitbar → Sektion erscheint gar nicht. Externe/LinkedIn-Signale sind
 * deferred (Signal-Quelle fehlt → PROGRESS), darum hier bewusst NICHT mehr gerendert.
 */
import { AlertTriangle, Clock } from "lucide-react";

export default function AktiveSignale({
  stagnationDays, stageLabel, noOpenTask, onStagnant, onNoTask,
}: {
  stagnationDays?: number;
  stageLabel?: string;
  noOpenTask?: boolean;
  onStagnant?: () => void;
  onNoTask?: () => void;
}) {
  const stagnant = (stagnationDays ?? 0) > 0 && !!stageLabel;
  if (!stagnant && !noOpenTask) return null; // keine real ableitbaren Signale → Sektion komplett weg

  return (
    <div className="space-y-2">
      <span className="typo-section-label text-text-muted pl-1">Aktive Signale</span>
      <div className="space-y-3">
        {stagnant && (
          <div className="p-4 bg-[var(--signal-urgent-bg)] border border-[var(--border-card)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-urgent-text)] font-semibold">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Stagniert — {stagnationDays}T in Stage {stageLabel}</span>
            <button onClick={onStagnant} className="text-[var(--signal-urgent-text)] hover:underline font-bold">Next Step →</button>
          </div>
        )}
        {noOpenTask && (
          <div className="p-4 bg-[var(--signal-warn-bg)] border border-[var(--border-card)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-warn-text)] font-semibold">
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Keine Task hinterlegt</span>
            <button onClick={onNoTask} className="text-[var(--signal-warn-text)] hover:underline font-bold">Task anlegen →</button>
          </div>
        )}
      </div>
    </div>
  );
}
