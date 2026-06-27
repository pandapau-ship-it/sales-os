import type { MouseEvent, ComponentType, ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flame, Sparkles, Clock, RotateCcw, AlertTriangle, X } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import HunterCard, { type HunterCardData } from './HunterCard';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { SignalActionData } from '@/lib/hunterMappers';
import { ACTION_ROW } from "@/lib/componentBehavior";
import { SNOOZE_MAX, SNOOZE_OPTIONS } from "@/lib/constants"; // Single Source (1:1 FollowUpKaltCard)
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
  channelIcon?: ComponentType<{ className?: string }>;
  /** Additiver Badge-Slot statt STAGE (z.B. Farmer SUBSCRIPTION) — wird an HunterCard durchgereicht. */
  statusBadge?: { label: string; node: ReactNode };
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
  /** Signal ignorieren → Aufrufer entfernt die Kachel aus der Liste (kein Backend, kein Toast). */
  onIgnore?: () => void;
  /** Optionaler Start-Snooze-Zustand (Mock/Demo) — analog FollowUpKaltCard. */
  initialSnooze?: { count: number; activeDays: number | null };
  /** Aufgeklappter Inhalt statt Default-`ExpandedCardContent` (Farmer: nur ScreenFarming reicht ihn
   *  durch → Hunter-Nutzung bleibt undefined → behält die Hunter-Kurzansicht). */
  expandedSlot?: ReactNode;
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
  contactId,
  name,
  role,
  avatarUrl,
  companyName,
  stage,
  icpScore,
  heatStatus,
  channelLabelKey = "hunter.common.linkedinSignal",
  channelIcon: ChannelIcon = LinkedinIcon,
  statusBadge,
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
  onIgnore,
  initialSnooze,
  expandedSlot,
}: LinkedinSignalCardProps) {
  const { t } = useTranslation();
  const timeProgress = windowHours > 0 ? Math.max(0, 100 - (timeLeftHours / windowHours) * 100) : 100;

  // Snooze-Mechanik 1:1 von FollowUpKaltCard (lokaler State, kein Backend). Nur im Signals-Tab (!showUrgency).
  const [snooze, setSnooze] = useState<{ count: number; activeDays: number | null }>(initialSnooze ?? { count: 0, activeDays: null });
  const isSnoozed = snooze.activeDays !== null;
  const isLimit = !isSnoozed && snooze.count >= SNOOZE_MAX;
  const doSnooze = (days: number) => setSnooze((s) => ({ count: s.count + 1, activeDays: days }));
  const reactivate = () => setSnooze((s) => ({ ...s, activeDays: null }));

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

  // Linker Block: Kanal-Badge + Aktionstext (Normalzustand, Übersicht + Signals-Tab).
  const signalLead = (
    <div className="flex items-center gap-3 min-w-0">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
        <ChannelIcon className="w-[11px] h-[11px]" />
        {t(channelLabelKey)}
      </span>
      <span className={`${ACTION_ROW.strongText} truncate`}>{actionText}</span>
    </div>
  );

  // Signal-spezifische Action-Row. showUrgency (Übersicht-Tab) UNVERÄNDERT. Signals-Tab (!showUrgency):
  // 3 Snooze-Zustände (1:1 FollowUpKaltCard) + Ignorieren.
  const actionRow = showUrgency ? (
    <>
      {signalLead}
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
        <button onClick={(e) => { e.stopPropagation(); onActNow?.(buildSignal()); }} className={ACTION_ROW.ctaPrimary}>
          {t("hunter.signals.actNow")}
        </button>
      </div>
    </>
  ) : isSnoozed ? (
    /* Zustand 2 — gesnoozed (1:1 FollowUpKaltCard) */
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
      {onOpenAction && (
        <button onClick={(e) => { e.stopPropagation(); onOpenAction(); }} className={ACTION_ROW.ctaPrimary}>
          {t("hunter.signals.openAction")}
        </button>
      )}
    </>
  ) : (
    /* Zustand 1 — Normal: Antworten + Snooze-Dropdown + Ignorieren */
    <>
      {signalLead}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenAction && (
          <button onClick={(e) => { e.stopPropagation(); onOpenAction(); }} className={`${ACTION_ROW.ctaSecondary} inline-flex items-center gap-1.5`}>
            <Sparkles className="w-3.5 h-3.5" /> {t("hunter.signals.openAction")}
          </button>
        )}
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
        {onIgnore && (
          <button onClick={(e) => { e.stopPropagation(); onIgnore(); }} aria-label="Ignorieren" data-tip="Ignorieren" className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className={`transition-opacity duration-300 ${isSnoozed ? "opacity-60" : ""}`}>
    <HunterCard
      data={data}
      contactId={contactId}
      onOpenInfo={onOpenInfo ? () => onOpenInfo(buildLead()) : undefined}
      actionRow={actionRow}
      statusBadge={statusBadge}
      selected={selected}
      onToggleSelect={onToggleSelect}
      expandedSlot={expandedSlot}
    />
    </div>
  );
}
