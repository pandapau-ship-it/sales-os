import { useState } from "react";
import { AlertTriangle, Snowflake, Clock, RotateCcw } from "lucide-react";
import HunterCard, { type HunterCardData } from './HunterCard';
import { ACTION_ROW } from "@/lib/componentBehavior";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Lead, HeatStatus } from "@/types";

// Snooze-Limits — später aus system_config (snooze_max_count / snooze_max_days).
const SNOOZE_MAX = 3;
const SNOOZE_OPTIONS = [
  { label: "Morgen", days: 1 },
  { label: "In 3 Tagen", days: 3 },
  { label: "In 1 Woche", days: 7 },
];

interface FollowUpKaltCardProps {
  name: string;
  role: string;
  companyName: string;
  icpScore?: number;
  /** Echter Heat aus dem Kontakt (Cold/Gone). */
  heatStatus?: HeatStatus;
  stage?: string;
  /** Read-Slice: false blendet die (noch logiklose) Action-Row + Stagnations-/Zeit-Deko aus. */
  showActions?: boolean;
  avatarInitials?: string;
  companyInitials?: string;
  companyBg?: string;
  daysInStage?: number;
  timeAgoLabel?: string;
  aiRecommendation?: string;
  generatedMessage?: string;
  onOutreachClick?: () => void;
  /** Grüner Pfeil → 820px Info-Panel. */
  onSelectLead?: (lead: Lead) => void;
  /** Optionaler Start-Snooze-Zustand (Mock/Demo). */
  initialSnooze?: { count: number; activeDays: number | null };
}

/**
 * FollowUpKaltCard — Follow-ups-Tab. Nutzt die geteilte HunterCard (einheitliche
 * Top-Row + Chevron-Kurzansicht + grüner Pfeil → Info-Panel) und liefert nur die
 * Cold-Outreach-Action-Row (Badge + Text + Start Outreach/Snooze) im Neu-in-Pipeline-Stil.
 */
export function FollowUpKaltCard({
  name,
  role,
  avatarInitials,
  companyName,
  icpScore,
  heatStatus,
  stage,
  showActions = true,
  daysInStage,
  timeAgoLabel,
  aiRecommendation,
  onOutreachClick,
  onSelectLead,
  initialSnooze,
}: FollowUpKaltCardProps) {
  // Snooze-Zustand (Mock — später aus DB/system_config). activeDays=null → nicht gesnoozed.
  const [snooze, setSnooze] = useState<{ count: number; activeDays: number | null }>(initialSnooze ?? { count: 0, activeDays: null });
  const isSnoozed = snooze.activeDays !== null;
  const isLimit = !isSnoozed && snooze.count >= SNOOZE_MAX;
  const doSnooze = (days: number) => setSnooze((s) => ({ count: s.count + 1, activeDays: days }));
  const reactivate = () => setSnooze((s) => ({ ...s, activeDays: null }));

  // role enthält bereits "Titel, Firma" → Firmen-Suffix entfernen (HunterCard hängt Firma selbst an).
  const jobTitle = role.includes(",") ? role.split(",").slice(0, -1).join(",").trim() : role;

  const initials = avatarInitials ?? name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const buildLead = (): Lead => ({
    id: `followup-${name}`,
    person: { id: `followup-${name}`, name, jobTitle, company: companyName, initials },
    kurzakte: aiRecommendation ?? "",
    fullTimeline: [],
    engagementChain: [],
    lastTouchpoints: [],
    heatStatus: heatStatus ?? "COLD",
    heatScore: 1,
    icpScore,
    lastActivity: timeAgoLabel ?? "",
    pipelineStage: "sequence",
    signalsCount: 1,
    contactEmail: "",
  });

  const data: HunterCardData = {
    id: `followup-${name}`,
    name,
    jobTitle,
    company: companyName,
    icpScore, // fehlt → undefined → ICP-Ring unsichtbar
    stageLabel: stage ?? "", // kein aktiver Deal → keine Stage
    heatStatus, // echtes Heat (Cold/Gone); undefined → kein Badge
    timeLabel: timeAgoLabel ?? "", // „vor X" nur wenn vorhanden (last_contacted_at) — kein Fake
    // „XT in Stage" ist Stagnation (Berechnung fehlt) → nur im Mock-Modus (showActions).
    timeSubLabel:
      showActions && daysInStage != null ? (
        <>
          {daysInStage}T in Stage <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
        </>
      ) : undefined,
  };

  // Read-Slice (showActions=false): keine Action-Row — Snooze/Eskalation/Outreach/„Kontakt
  // wird kalt"-Text + AI-Empfehlung sind Logik/Writes, die noch nicht existieren ([D16]).
  const actionRow = !showActions ? undefined : isSnoozed ? (
    /* Zustand 2 — aktiv gesnoozed */
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[12.5px] italic text-text-muted">
          Snoozed · noch {snooze.activeDays} {snooze.activeDays === 1 ? "Tag" : "Tage"}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] text-text-muted">{snooze.count}/{SNOOZE_MAX} Snoozes genutzt</span>
        <button onClick={(e) => { e.stopPropagation(); reactivate(); }} className="px-3 py-1.5 bg-app-surface border border-border hover:bg-app-bg text-text-body rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
          <RotateCcw className="w-3 h-3" /> Reaktivieren
        </button>
      </div>
    </>
  ) : isLimit ? (
    /* Zustand 3 — Snooze-Limit erreicht → Eskalation */
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--signal-urgent-text)]">
          <AlertTriangle className="w-4 h-4" strokeWidth={2.5} /> Eskaliert — Aktion erforderlich
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onOutreachClick?.(); }} className={ACTION_ROW.ctaPrimary}>
          Start Outreach
        </button>
      </div>
    </>
  ) : (
    /* Zustand 1 — Normal */
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
          <Snowflake className="w-[11px] h-[11px]" /> Cold
        </span>
        <span className={ACTION_ROW.strongText}>
          Kontakt wird kalt. Letzter Kanal Email ohne Response. AI empfiehlt Kanalwechsel zu LinkedIn.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onOutreachClick?.(); }} className={ACTION_ROW.ctaSecondary}>
          Start Outreach
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button onClick={(e) => e.stopPropagation()} className={`${ACTION_ROW.ctaSecondary} inline-flex items-center gap-1.5`}>
              <Clock className="w-3 h-3" /> Snooze
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="min-w-[160px]">
            {SNOOZE_OPTIONS.map((o) => (
              <DropdownMenuItem key={o.days} onClick={(e) => { e.stopPropagation(); doSnooze(o.days); }}>
                {o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className={`transition-opacity duration-300 ${isSnoozed ? "opacity-60" : ""}`}>
      <HunterCard
        data={data}
        onOpenInfo={onSelectLead ? () => onSelectLead(buildLead()) : undefined}
        actionRow={actionRow}
      />
    </div>
  );
}
