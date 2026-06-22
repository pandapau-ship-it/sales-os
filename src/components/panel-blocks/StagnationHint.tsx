/**
 * StagnationHint — kleiner roter Stagnations-Hinweis (AlertTriangle + „Xt") direkt neben dem
 * Stage-Label. Erscheint überall, wo ein Deal angezeigt wird, sobald stagnation_days >= Schwelle
 * (Entscheidung trifft der Aufrufer via stagnationFlag). Token-Rot, kein Emoji.
 */
import { AlertTriangle } from "lucide-react";

export default function StagnationHint({ days }: { days: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--signal-urgent-text)] shrink-0"
      data-tip={`Stagniert seit ${days} Tagen`}
    >
      <AlertTriangle className="w-3 h-3" strokeWidth={2.5} /> {days}t
    </span>
  );
}
