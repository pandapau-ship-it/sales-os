import { useState } from "react";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, ChevronUp, ArrowRight, Flame, Sparkles } from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import { ICPDonut } from "@/components/shared/ICPDonut";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
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
  /** Öffnet das 820px-Info-Panel für diesen Kontakt (wie der grüne Pfeil bei Leads). */
  onOpenInfo?: (lead: Lead) => void;
}

function deriveInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * LinkedinSignalCard — gleiche Kachel- UND Verhaltens-Struktur wie eine Leads-Kachel
 * (Hover-Lift + Checkbox, Chevron-Expand, grüner Pfeil → Info-Panel), plus eine
 * Signal-Row am unteren Rand (LinkedIn-Badge · Aktionstext · Timer · Act now).
 */
export function LinkedinSignalCard({
  name,
  role,
  avatarUrl,
  companyInitials,
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
  const [expanded, setExpanded] = useState(false);

  const timeProgress =
    windowHours > 0 ? Math.max(0, 100 - (timeLeftHours / windowHours) * 100) : 100;

  // Aus den Signal-Daten einen Lead bauen, damit das Info-Panel (CustomerDrawer) ihn rendern kann.
  const buildLead = (): Lead => ({
    id: `signal-${name}`,
    person: {
      id: `signal-${name}`,
      name,
      jobTitle: role,
      company: companyName,
      avatarUrl,
      initials: deriveInitials(name),
    },
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

  // Signal-Daten für das Action-Panel (Panel selbst hält keine eigenen Daten).
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

  return (
    <div className={`group relative rounded-[12px] shadow-[var(--shadow-card)] hover:shadow-md hover:-translate-y-0.5 border border-[var(--border-card)] flex flex-col font-sans transition-all duration-300 ${selected ? 'bg-[var(--signal-teal-bg)]' : 'bg-white'}`}>
      {/* TOP ROW — identisch zur Leads-Kachel */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          {/* Select Checkbox (Hover/Selected state) — 1:1 wie Leads-Kachel.
              Nur wenn Auswahl aktiv ist (onToggleSelect gesetzt). */}
          {onToggleSelect && (
            <div
              onClick={(e) => onToggleSelect(e)}
              className={`absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-[22px] h-[22px] rounded-md z-10 cursor-pointer ${
                selected ? 'bg-[var(--sherloq-primary)] opacity-100 border-[var(--sherloq-primary)]' : 'bg-white border-2 border-[var(--border)] hover:border-[var(--text-muted)]'
              }`}
            >
              {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
          )}

          {/* Avatar & Info */}
          <div className={`flex items-center gap-4 flex-1 min-w-0 transition-all duration-300 ${onToggleSelect ? 'ml-0 group-hover:ml-8' : ''}`}>
            <div className="relative shrink-0">
              <Avatar name={name} src={avatarUrl} size={40} />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--signal-info-text)] border-2 border-white rounded-full"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-bold text-[var(--text-primary)] font-sans">{name}</span>
              <span className="text-[12px] text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate">
                {role}, {companyName}
              </span>
            </div>
          </div>

          {/* ICP donut & Company Area */}
          <div className="hidden md:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
            <div className="w-[48px] flex items-center justify-center">
              <ICPDonut score={icpScore} />
            </div>

            <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
              <div className="bg-[var(--text-primary)] text-white text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0">
                {companyInitials}
              </div>
              <span className="text-[14px] text-[var(--sherloq-primary)] font-semibold w-[120px] truncate">{companyName}</span>
            </div>
          </div>

          {/* Stage & Heat */}
          <div className="hidden lg:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
            <div className="flex flex-col items-center justify-center w-[80px] relative h-full">
              <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">{t('hunter.common.stage')}</span>
              <div className="px-4 py-2 rounded-full bg-[var(--app-bg)] text-[var(--text-body)] text-[12px] font-semibold border border-[var(--border)]">
                {stage}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
              <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">{t('hunter.common.heat')}</span>
              <div className="px-4 py-2 rounded-full text-[12px] font-semibold border flex items-center gap-1.5 bg-[var(--signal-success-bg)] text-[var(--icp-high)] border-[var(--signal-success-bg)]">
                ● {t('hunter.heat.active')}
              </div>
            </div>
          </div>

          {/* Zeit + Aktionen (Chevron-Expand + grüner Pfeil → Info-Panel) — 1:1 wie Leads-Kachel */}
          <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-subtle)] shrink-0 justify-between md:justify-end">
            <div className="flex flex-col items-end hidden sm:flex w-[130px]">
              <span className="text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap">{timeAgoLabel || timeAgo}</span>
              <span className="mt-0.5 text-[var(--icp-low)] font-semibold text-[12px] whitespace-nowrap">
                {t('hunter.common.hoursLeft', { hours: timeLeftHours })}
              </span>
            </div>
            <div className="flex items-center gap-3 relative w-[90px] justify-end">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-8 h-8 flex items-center justify-center text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--app-bg)] cursor-pointer"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInfo?.(buildLead());
                }}
                className="w-10 h-10 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] hover:scale-105 transition-all flex items-center justify-center shadow-sm cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* EXPANDED — Kurzansicht inline (wie Leads-Kachel) */}
        {expanded && (
          <div className="flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-5 mt-4">
            {commentText && (
              <div className="bg-[var(--app-bg)] border border-[var(--border)] rounded-[12px] p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--sherloq-primary)] uppercase tracking-wider mb-2">
                  <LinkedinIcon className="w-3.5 h-3.5" /> {t('hunter.signals.signalDetails')}
                </div>
                <p className="text-[13px] text-[var(--text-body)] leading-relaxed italic">"{commentText}"</p>
              </div>
            )}
            {aiRecommendation && (
              <div className="bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] rounded-[12px] p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--sherloq-primary)] uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> {t('hunter.common.aiRecommends')}
                </div>
                <p className="text-[13px] text-[var(--text-body)] leading-relaxed">{aiRecommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SIGNAL-ROW — LinkedIn-Badge · Aktionstext · Timer · Act now */}
      <div className="bg-[var(--app-bg)] border-t border-[var(--border-card)] rounded-b-[12px] px-4 py-3 flex items-center justify-between gap-4">
        {/* Links: LinkedIn-Signal-Badge + Aktionstext */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
            <LinkedinIcon className="w-[11px] h-[11px]" />
            {t('hunter.common.linkedinSignal')}
          </span>
          <span className="text-[12px] font-medium text-[var(--text-body)] truncate">{actionText}</span>
        </div>

        {/* Rechts: Timer-Block + Act now */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col w-[200px]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="flex items-center gap-1 text-[13px] font-extrabold text-[var(--signal-urgent-text)]">
                <Flame className="w-3 h-3" /> {t('hunter.common.hot')}
              </span>
              <span className="text-[13px] font-extrabold text-[var(--signal-urgent-text)]">
                {t('hunter.common.hoursLeft', { hours: timeLeftHours })}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--signal-urgent-text)] rounded-full" style={{ width: `${timeProgress}%` }} />
            </div>
            <span className="mt-1 text-[10px] font-bold text-[var(--icon-muted)] uppercase tracking-widest text-right">
              {t('hunter.common.hoursWindow', { hours: windowHours })}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onActNow?.(buildSignal());
            }}
            className="bg-[var(--sherloq-primary)] text-white rounded-full px-4 py-2 text-[12px] font-bold cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          >
            {t('hunter.signals.actNow')}
          </button>
        </div>
      </div>
    </div>
  );
}
