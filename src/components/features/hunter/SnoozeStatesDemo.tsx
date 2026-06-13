/**
 * SnoozeStatesDemo — visuelle Vorschau der drei Snooze-Zustände in Lead-Kacheln.
 * NUR Design / Mock — nicht verdrahtet (keine echte Snooze-Logik, kein system_config).
 * Nutzt die Pflicht-Komponente HunterCard + ACTION_ROW; variiert nur die Action-Row.
 * Regelwerk: CLAUDE.md → Feature-Spezifikationen → Snooze.
 */
import { AlertTriangle, Clock, RotateCcw, Flame } from "lucide-react";
import HunterCard, { type HunterCardData } from "@/components/shared/HunterCard";
import { ACTION_ROW } from "@/lib/componentBehavior";
import { getHeatColor } from "@/lib/heatUtils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { HeatStatus } from "@/types";

// Heat aus der kanonischen Quelle (getHeatColor → HEAT_STATUS).
const heat = (status: HeatStatus): HunterCardData["heat"] => {
  const h = getHeatColor(status);
  return { bgClass: h.bg, textClass: `${h.text} ${h.border}`, label: h.label };
};

const SIGNAL_BADGE =
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0";

// ─── Mock-Kacheln ──────────────────────────────────────────────────────────
const CARD_NORMAL: HunterCardData = {
  id: "snooze-normal", name: "Elena Rostova", jobTitle: "RevOps Specialist",
  company: "Quantum Dynamics", icpScore: 55, stageLabel: "Follow-up offen",
  heat: heat("LUKEWARM"), timeLabel: "vor 8 Tagen",
};
const CARD_SNOOZED: HunterCardData = {
  id: "snooze-active", name: "Marcus Müller", jobTitle: "Head of Business Development",
  company: "LogixFlow GmbH", icpScore: 68, stageLabel: "Demo vereinbart",
  heat: heat("WARM"), timeLabel: "vor 4 Tagen",
};
const CARD_LIMIT: HunterCardData = {
  id: "snooze-limit", name: "Sarah Jenkins", jobTitle: "VP Sales EMEA",
  company: "Atrium GmbH", icpScore: 82, stageLabel: "Backlog",
  heat: heat("COLD"), timeLabel: "vor 12 Tagen",
};

// ─── Zustand 1: Normal — Signal + Start Outreach + Snooze (Dropdown) ─────────
const rowNormal = (
  <>
    <div className="flex items-center gap-3 min-w-0">
      <span className={SIGNAL_BADGE}><Flame className="w-[11px] h-[11px]" /> Signal</span>
      <span className={ACTION_ROW.strongText}>
        Demo vor 8 Tagen, kein Next Step — AI empfiehlt eine konkrete Agenda.
      </span>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={(e) => e.stopPropagation()} className={ACTION_ROW.ctaSecondary}>
        Start Outreach
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button onClick={(e) => e.stopPropagation()} className={`${ACTION_ROW.ctaSecondary} inline-flex items-center gap-1.5`}>
            <Clock className="w-3 h-3" /> Snooze
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="min-w-[160px]">
          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Morgen</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>In 3 Tagen</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>In 1 Woche</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </>
);

// ─── Zustand 2: Aktiv gesnoozed — gedimmt, Countdown + Reaktivieren + Zähler ─
const rowSnoozed = (
  <>
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[12.5px] italic text-text-muted">Snoozed · noch 3 Tage</span>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-[10px] text-text-muted">2/3 Snoozes genutzt</span>
      <button onClick={(e) => e.stopPropagation()} className="px-3 py-1.5 bg-app-surface border border-border hover:bg-app-bg text-text-body rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
        <RotateCcw className="w-3 h-3" /> Reaktivieren
      </button>
    </div>
  </>
);

// ─── Zustand 3: Snooze-Limit erreicht — Eskalation (rot), nur Start Outreach ─
const rowLimit = (
  <>
    <div className="flex items-center gap-3 min-w-0">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--signal-urgent-text)]">
        <AlertTriangle className="w-4 h-4" strokeWidth={2.5} /> Eskaliert — Aktion erforderlich
      </span>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={(e) => e.stopPropagation()} className={ACTION_ROW.ctaPrimary}>
        Start Outreach
      </button>
    </div>
  </>
);

const STATE_LABEL = "text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2";

export default function SnoozeStatesDemo() {
  return (
    <div className="flex flex-col gap-6 font-sans">
      <div>
        <p className={STATE_LABEL}>Zustand 1 · Normal</p>
        <HunterCard data={CARD_NORMAL} actionRow={rowNormal} />
      </div>

      <div>
        <p className={STATE_LABEL}>Zustand 2 · Aktiv gesnoozed</p>
        <div className="opacity-60">
          <HunterCard data={CARD_SNOOZED} actionRow={rowSnoozed} />
        </div>
      </div>

      <div>
        <p className={STATE_LABEL}>Zustand 3 · Snooze-Limit erreicht</p>
        <HunterCard data={CARD_LIMIT} actionRow={rowLimit} />
      </div>
    </div>
  );
}
