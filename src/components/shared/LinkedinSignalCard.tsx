import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import HunterCard, { type HunterCardData } from "@/components/shared/HunterCard";
import { ACTION_ROW } from "@/lib/componentBehavior";
import type { SignalActionData } from "@/components/shared/SignalActionDrawer";
import type { Lead } from "@/types";

interface LinkedinSignalCardProps {
  name: string;
  role: string;
  avatarUrl?: string;
  avatarInitials?: string;
  avatarBg?: string;
  companyInitials: string;
  companyName: string;
  stage?: string;
  labelType?: "STAGE" | "SUBSCRIPTION";
  icpScore?: number;
  timeAgo?: string;
  timeAgoLabel?: string;
  timeLeftHours?: number;
  windowHours?: number;
  actionText: string;
  commentText?: string;
  quoteText?: string;
  aiRecommendation?: string;
  onActNow?: (signal: SignalActionData) => void;
  selected?: boolean;
  onToggleSelect?: (e: MouseEvent) => void;
  onOpenInfo?: (lead: Lead) => void;
}

function deriveInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

/**
 * LinkedinSignalCard — Signals-Tab. Nutzt die geteilte HunterCard (einheitliche
 * Top-Row + Chevron-Kurzansicht + grüner Pfeil → Info-Panel) und liefert nur die
 * signal-spezifische Action-Row (LinkedIn-Badge + Aktionstext + Timer + Act now).
 */
export function LinkedinSignalCard({
  name,
  role,
  avatarUrl,
  companyName,
  stage = "Signal",
  icpScore = 80,
  timeAgo = "2 Std.",
  timeAgoLabel,
  timeLeftHours = 46,
  windowHours = 48,
  actionText,
  commentText,
  aiRecommendation,
  onActNow,
  selected = false,
  onToggleSelect,
  onOpenInfo,
}: LinkedinSignalCardProps) {
  const { t } = useTranslation();
  const timeProgress = windowHours > 0 ? Math.max(0, 100 - (timeLeftHours / windowHours) * 100) : 100;

  const buildLead = (): Lead => ({
    id: `signal-${name}`,
    person: { id: `signal-${name}`, name, jobTitle: role, company: companyName, avatarUrl, initials: deriveInitials(name) },
    kurzakte: aiRecommendation ?? "",
    fullTimeline: [],
    engagementChain: [],
    lastTouchpoints: [],
    heatStatus: "HOT",
    heatScore: 5,
    icpScore,
    lastActivity: timeAgoLabel ?? timeAgo,
    pipelineStage: "signal",
    signalsCount: 1,
    contactEmail: "",
  });

  const buildSignal = (): SignalActionData => ({
    name,
    company: companyName,
    avatarUrl,
    icpScore,
    actionText,
    timeAgoLabel: timeAgoLabel ?? timeAgo,
    timeLeftHours,
    windowHours,
    commentText,
    aiRecommendation: aiRecommendation ?? "",
    confidence: 91,
  });

  const data: HunterCardData = {
    id: name,
    name,
    jobTitle: role,
    company: companyName,
    avatarUrl,
    icpScore,
    stageLabel: stage,
    heat: {
      bgClass: "bg-[var(--signal-success-bg)]",
      textClass: "text-[var(--icp-high)] border-[var(--signal-success-bg)]",
      label: t("hunter.heat.active"),
    },
    timeLabel: timeAgoLabel || timeAgo,
    timeSubLabel: t("hunter.common.hoursLeft", { hours: timeLeftHours }),
  };

  // Signal-spezifische Action-Row (Container/Schrift/Farben = componentBehavior).
  const actionRow = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
          <LinkedinIcon className="w-[11px] h-[11px]" />
          {t("hunter.common.linkedinSignal")}
        </span>
        <span className={`${ACTION_ROW.strongText} truncate`}>{actionText}</span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex flex-col w-[200px]">
          <div className="flex justify-between items-center mb-1.5">
            <span className="flex items-center gap-1 text-[13px] font-extrabold text-[var(--signal-urgent-text)]">
              <Flame className="w-3 h-3" /> {t("hunter.common.hot")}
            </span>
            <span className="text-[13px] font-extrabold text-[var(--signal-urgent-text)]">
              {t("hunter.common.hoursLeft", { hours: timeLeftHours })}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--signal-urgent-text)] rounded-full" style={{ width: `${timeProgress}%` }} />
          </div>
          <span className="mt-1 text-[10px] font-bold text-[var(--icon-muted)] uppercase tracking-widest text-right">
            {t("hunter.common.hoursWindow", { hours: windowHours })}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onActNow?.(buildSignal()); }}
          className={ACTION_ROW.ctaPrimary}
        >
          {t("hunter.signals.actNow")}
        </button>
      </div>
    </>
  );

  return (
    <HunterCard
      data={data}
      onOpenInfo={onOpenInfo ? () => onOpenInfo(buildLead()) : undefined}
      actionRow={actionRow}
      selected={selected}
      onToggleSelect={onToggleSelect}
    />
  );
}
