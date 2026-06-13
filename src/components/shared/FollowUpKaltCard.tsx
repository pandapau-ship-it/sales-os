import { AlertTriangle, Snowflake } from "lucide-react";
import HunterCard, { type HunterCardData } from "@/components/shared/HunterCard";
import { ACTION_ROW } from "@/lib/componentBehavior";
import type { Lead } from "@/types";

interface FollowUpKaltCardProps {
  name: string;
  role: string;
  avatarInitials: string;
  companyInitials: string;
  companyName: string;
  companyBg: string;
  icpScore: number;
  stage: string;
  daysInStage: number;
  timeAgoLabel: string;
  aiRecommendation: string;
  generatedMessage: string;
  onOutreachClick?: () => void;
  /** Grüner Pfeil → 820px Info-Panel. */
  onSelectLead?: (lead: Lead) => void;
}

/**
 * FollowUpKaltCard — Follow-ups-Tab. Nutzt die geteilte HunterCard (einheitliche
 * Top-Row + Chevron-Kurzansicht + grüner Pfeil → Info-Panel) und liefert nur die
 * „Kalt"-Action-Row (Badge + Text + Start Outreach/Snooze) im Neu-in-Pipeline-Stil.
 */
export function FollowUpKaltCard({
  name,
  role,
  avatarInitials,
  companyName,
  icpScore,
  stage,
  daysInStage,
  timeAgoLabel,
  aiRecommendation,
  onOutreachClick,
  onSelectLead,
}: FollowUpKaltCardProps) {
  // role enthält bereits "Titel, Firma" → Firmen-Suffix entfernen (HunterCard hängt Firma selbst an).
  const jobTitle = role.includes(",") ? role.split(",").slice(0, -1).join(",").trim() : role;

  const buildLead = (): Lead => ({
    id: `followup-${name}`,
    person: { id: `followup-${name}`, name, jobTitle, company: companyName, initials: avatarInitials },
    kurzakte: aiRecommendation ?? "",
    fullTimeline: [],
    engagementChain: [],
    lastTouchpoints: [],
    heatStatus: "COLD",
    heatScore: 1,
    icpScore,
    lastActivity: timeAgoLabel,
    pipelineStage: "sequence",
    signalsCount: 1,
    contactEmail: "",
  });

  const data: HunterCardData = {
    id: `followup-${name}`,
    name,
    jobTitle,
    company: companyName,
    icpScore,
    stageLabel: stage,
    heat: {
      bgClass: "bg-[var(--signal-info-bg)]",
      textClass: "text-[var(--signal-info-text)] border-[var(--signal-info-bg)]",
      label: "Kalt",
    },
    timeLabel: timeAgoLabel,
    timeSubLabel: (
      <>
        {daysInStage}T in Stage <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
      </>
    ),
  };

  const actionRow = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
          <Snowflake className="w-[11px] h-[11px]" /> Kalt
        </span>
        <span className={ACTION_ROW.strongText}>
          Kontakt wird kalt. Letzter Kanal Email ohne Response. AI empfiehlt Kanalwechsel zu LinkedIn.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onOutreachClick?.(); }} className={ACTION_ROW.ctaSecondary}>
          Start Outreach
        </button>
        <button onClick={(e) => e.stopPropagation()} className={ACTION_ROW.ctaSecondary}>
          Snooze
        </button>
      </div>
    </>
  );

  return (
    <HunterCard
      data={data}
      onOpenInfo={onSelectLead ? () => onSelectLead(buildLead()) : undefined}
      actionRow={actionRow}
    />
  );
}
