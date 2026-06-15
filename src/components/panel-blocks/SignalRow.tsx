/**
 * SignalRow — Grundlayout einer Zeile im Signal-Feed (Phase 0: Struktur + Styling).
 * Muster: Signal → Interpretation → Empfehlung. Noch kein echter Inhalt/Logik.
 * Von Phase 2 an Basis für Hunter/Farmer/Mein-Tag Signal-Kacheln.
 */

import { ChevronRight } from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import Badge, { type BadgeVariant } from "@/components/shared/Badge";

export interface SignalRowData {
  id: string;
  name: string;
  company?: string;
  /** Signal-Interpretation als Handlungssatz (Signal, not data). */
  message: string;
  badge?: { variant: BadgeVariant; label: string; icon?: React.ReactNode };
  actionLabel?: string;
}

interface SignalRowProps {
  signal: SignalRowData;
  onAction?: (id: string) => void;
  onClick?: (id: string) => void;
}

export default function SignalRow({ signal, onAction, onClick }: SignalRowProps) {
  return (
    <div className="sherloq-card flex items-center gap-3 px-4 py-3">
      <button
        onClick={() => onClick?.(signal.id)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
      >
        <Avatar name={signal.name} size="md" />
        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-text-primary truncate">{signal.name}</span>
            {signal.company && (
              <span className="text-[12px] text-text-muted truncate">· {signal.company}</span>
            )}
          </div>
          <span className="text-[12px] text-text-body truncate">{signal.message}</span>
        </div>
      </button>

      {signal.badge && (
        <Badge variant={signal.badge.variant} icon={signal.badge.icon}>
          {signal.badge.label}
        </Badge>
      )}

      {signal.actionLabel && (
        <button onClick={() => onAction?.(signal.id)} className="sherloq-btn-primary shrink-0">
          {signal.actionLabel}
        </button>
      )}

      <button
        onClick={() => onClick?.(signal.id)}
        aria-label="Details"
        className="w-7 h-7 rounded-[9px] flex items-center justify-center text-text-muted hover:bg-app-bg hover:text-text-primary transition-colors shrink-0 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
