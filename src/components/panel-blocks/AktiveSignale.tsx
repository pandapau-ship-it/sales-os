/**
 * AktiveSignale — Signal-Sektion der Übersicht (geteilt Hunter + Farmer).
 * HUNTER (real ableitbar):
 *  - „Stagniert — XT in Stage Y" NUR wenn deals.stagnation_days > 0 (Edge Function score_deal_health;
 *    bis die existiert bleibt 0 → kein Signal, kein Fake).
 *  - „Keine Task hinterlegt" wenn ein aktiver Deal vorhanden ist, aber keine offene Task.
 * FARMER ([D33], additiv — Hunter-Nutzung bleibt unverändert, wenn nicht gesetzt):
 *  - Churn Risk (rot) · Upsell Potential (grün) · Kunde wird kalt (blau). CTAs → Action-Panel [D34].
 *    (Slice 2: Flags als Mock; echte Score-/Signal-Logik kommt mit dem Farmer-DB-Wiring.)
 * Kein Signal aktiv → Sektion erscheint gar nicht.
 */
import { AlertTriangle, Clock, Zap, Snowflake, XCircle } from "lucide-react";

export default function AktiveSignale({
  stagnationDays, stageLabel, noOpenTask, onStagnant, onNoTask,
  churnRisk, upsell, goingCold, cancelled, onChurn, onUpsell, onCold, onCancelled,
}: {
  stagnationDays?: number;
  stageLabel?: string;
  noOpenTask?: boolean;
  onStagnant?: () => void;
  onNoTask?: () => void;
  // Farmer-Signale (additiv, [D33]/[D34])
  churnRisk?: boolean;
  upsell?: boolean;
  goingCold?: boolean;
  cancelled?: boolean;
  onChurn?: () => void;
  onUpsell?: () => void;
  onCold?: () => void;
  onCancelled?: () => void;
}) {
  const stagnant = (stagnationDays ?? 0) > 0 && !!stageLabel;
  if (!stagnant && !noOpenTask && !churnRisk && !upsell && !goingCold && !cancelled) return null; // kein Signal → Sektion komplett weg

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
        {/* Farmer-Signale [D33] — CTAs öffnen später das Action-Panel [D34] (Slice 2: Toast-Platzhalter). */}
        {churnRisk && (
          <div className="p-4 bg-[var(--signal-urgent-bg)] border border-[var(--border-card)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-urgent-text)] font-semibold">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Churn Risk</span>
            <button onClick={onChurn} className="text-[var(--signal-urgent-text)] hover:underline font-bold">Retention sichern →</button>
          </div>
        )}
        {upsell && (
          <div className="p-4 bg-[var(--signal-success-bg)] border border-[var(--border-card)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-success-text)] font-semibold">
            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Upsell Potential</span>
            <button onClick={onUpsell} className="text-[var(--signal-success-text)] hover:underline font-bold">Action →</button>
          </div>
        )}
        {goingCold && (
          <div className="p-4 bg-[var(--signal-info-bg)] border border-[var(--border-card)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-info-text)] font-semibold">
            <span className="flex items-center gap-2"><Snowflake className="w-4 h-4" /> Kunde wird kalt</span>
            <button onClick={onCold} className="text-[var(--signal-info-text)] hover:underline font-bold">Start Outreach →</button>
          </div>
        )}
        {cancelled && (
          <div className="p-4 bg-[var(--signal-urgent-bg)] border border-[var(--border-card)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-urgent-text)] font-semibold">
            <span className="flex items-center gap-2"><XCircle className="w-4 h-4" /> Gekündigt</span>
            <button onClick={onCancelled} className="text-[var(--signal-urgent-text)] hover:underline font-bold">Jetzt anrufen →</button>
          </div>
        )}
      </div>
    </div>
  );
}
