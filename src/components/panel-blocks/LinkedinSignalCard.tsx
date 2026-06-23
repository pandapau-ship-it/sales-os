import type { MouseEvent, ComponentType, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Flame, Sparkles } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import HunterCard, { type HunterCardData } from './HunterCard';
import type { SignalActionData } from '@/lib/hunterMappers';
import { ACTION_ROW } from "@/lib/componentBehavior";
import type { Lead, HeatStatus } from "@/types";

interface LinkedinSignalCardProps {
  /** Zugrundeliegender Kontakt (Panel-Fetch / Single-Source-Kopf). */
  contactId?: string;
  name: string;
  role: string;
  avatarUrl?: string;
  companyInitials?: string; // vestigial (HunterCard leitet Initiale selbst ab)
  companyName: string;
  stage?: string;
  labelType?: "STAGE" | "SUBSCRIPTION";
  icpScore?: number;
  /** Echter Heat aus dem Kontakt. undefined → kein Heat-Badge (kein Fake-„HOT"). */
  heatStatus?: HeatStatus;
  /** Kanal-Badge (i18n-Key + Icon) — prop-driven (S-0 signalMetaFor). Default: LinkedIn. */
  channelLabelKey?: string;
  /** Klartext-Label (Vorrang vor channelLabelKey) — für nicht-i18n-Screens (Farmer). */
  channelLabel?: string;
  channelIcon?: ComponentType<{ className?: string }>;
  /** Tönung des Kanal-Badges. Default 'info' (blau) = Hunter-Verhalten unverändert. */
  channelTone?: "info" | "urgent" | "success";
  /** Additiver Badge-Slot statt STAGE (z.B. Farmer SUBSCRIPTION) — wird an HunterCard durchgereicht. */
  statusBadge?: { label: string; node: ReactNode };
  /** Klartext-Label des Opener-CTA (Vorrang vor i18n). Default: hunter.signals.openAction. */
  actionLabel?: string;
  /** Deferred-Elemente gaten (S-2): Dringlichkeit/Restzeit/Act-now bzw. Stage. */
  showUrgency?: boolean;
  showStage?: boolean;
  timeAgo?: string;
  timeAgoLabel?: string;
  timeLeftHours?: number;
  windowHours?: number;
  actionText: string;
  commentText?: string;
  quoteText?: string;
  aiRecommendation?: string;
  onActNow?: (signal: SignalActionData) => void;
  /** Opener: öffnet den SignalActionDrawer (Antwort-Aktion). Aufrufer liefert die Daten. */
  onOpenAction?: () => void;
  selected?: boolean;
  onToggleSelect?: (e: MouseEvent) => void;
  onOpenInfo?: (lead: Lead) => void;
}

function deriveInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

// Kanal-Badge-Tönung (Token-only). 'info' = Default (Hunter LinkedIn, blau).
const CHANNEL_TONE: Record<"info" | "urgent" | "success", string> = {
  info: "bg-[var(--signal-info-bg)] text-[var(--signal-info-text)]",
  urgent: "bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]",
  success: "bg-[var(--signal-success-bg)] text-[var(--signal-success-text)]",
};

/**
 * LinkedinSignalCard — Signals-Tab. Nutzt die geteilte HunterCard (einheitliche
 * Top-Row + Chevron-Kurzansicht + grüner Pfeil → Info-Panel) und liefert nur die
 * signal-spezifische Action-Row (LinkedIn-Badge + Aktionstext + Timer + Act now).
 */
export function LinkedinSignalCard({
  contactId,
  name,
  role,
  avatarUrl,
  companyName,
  stage,
  icpScore,
  heatStatus,
  channelLabelKey = "hunter.common.linkedinSignal",
  channelLabel,
  channelIcon: ChannelIcon = LinkedinIcon,
  channelTone = "info",
  statusBadge,
  actionLabel,
  showUrgency = true,
  showStage = true,
  timeAgo = "2 Std.",
  timeAgoLabel,
  timeLeftHours = 46,
  windowHours = 48,
  actionText,
  commentText,
  aiRecommendation,
  onActNow,
  onOpenAction,
  selected = false,
  onToggleSelect,
  onOpenInfo,
}: LinkedinSignalCardProps) {
  const { t } = useTranslation();
  const timeProgress = windowHours > 0 ? Math.max(0, 100 - (timeLeftHours / windowHours) * 100) : 100;

  const buildLead = (): Lead => ({
    id: `signal-${name}`,
    // person.id = echte contact_id (Panel fetcht damit den Kontakt); kontaktloses Signal → leeres Panel
    person: { id: contactId ?? `signal-${name}`, name, jobTitle: role, company: companyName, avatarUrl, initials: deriveInitials(name) },
    kurzakte: aiRecommendation ?? "",
    fullTimeline: [],
    engagementChain: [],
    lastTouchpoints: [],
    heatStatus: heatStatus ?? "WARM",
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
    confidence: null, // echte Confidence kommt mit AI-Pipeline ([D5])
  });

  const data: HunterCardData = {
    id: name,
    name,
    jobTitle: role,
    company: companyName,
    avatarUrl,
    icpScore, // undefined → HunterCard rendert den ICP-Ring nicht (kein 0/grau)
    stageLabel: showStage && stage ? stage : "", // leer (kein aktiver Deal) → HunterCard zeigt keine Stage
    heatStatus, // echter Heat (oder undefined → kein Badge)
    timeLabel: timeAgoLabel || timeAgo,
    timeSubLabel: showUrgency ? t("hunter.common.hoursLeft", { hours: timeLeftHours }) : undefined,
  };

  // Signal-spezifische Action-Row (Container/Schrift/Farben = componentBehavior).
  const actionRow = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${CHANNEL_TONE[channelTone]} text-[10px] font-bold uppercase tracking-wider shrink-0`}>
          <ChannelIcon className="w-[11px] h-[11px]" />
          {channelLabel ?? t(channelLabelKey)}
        </span>
        <span className={`${ACTION_ROW.strongText} truncate`}>{actionText}</span>
      </div>

      {/* Deferred (S-2): Dringlichkeits-Flamme · Restzeit · Window-Balken · Act-now — gegated.
          Default true → Übersicht-Tab unverändert; Signals-Tab setzt showUrgency=false. */}
      {showUrgency && (
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col w-[200px]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="flex items-center gap-1 typo-field-value text-[var(--signal-urgent-text)]">
                <Flame className="w-3 h-3" /> {t("hunter.common.hot")}
              </span>
              <span className="typo-field-value text-[var(--signal-urgent-text)]">
                {t("hunter.common.hoursLeft", { hours: timeLeftHours })}
              </span>
            </div>
            <div className="w-full h-1.5 bg-app-bg rounded-full overflow-hidden">
              <div className="h-full bg-[var(--signal-urgent-text)] rounded-full" style={{ width: `${timeProgress}%` }} />
            </div>
            <span className="mt-1 typo-section-label text-[var(--icon-muted)] text-right">
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
      )}

      {/* Opener (Signals-Tab, ohne Urgency-Block): öffnet den SignalActionDrawer. */}
      {onOpenAction && !showUrgency && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenAction(); }}
          className={`${ACTION_ROW.ctaSecondary} inline-flex items-center gap-1.5 shrink-0`}
        >
          <Sparkles className="w-3.5 h-3.5" /> {actionLabel ?? t("hunter.signals.openAction")}
        </button>
      )}
    </>
  );

  return (
    <HunterCard
      data={data}
      contactId={contactId}
      onOpenInfo={onOpenInfo ? () => onOpenInfo(buildLead()) : undefined}
      actionRow={actionRow}
      statusBadge={statusBadge}
      selected={selected}
      onToggleSelect={onToggleSelect}
    />
  );
}
