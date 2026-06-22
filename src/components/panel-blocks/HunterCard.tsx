import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Check, ChevronDown, ChevronUp, ArrowRight, CheckSquare, FileText, Mail,
} from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import { ICPDonut } from "@/components/shared/ICPDonut";
import HeatBadge from './HeatBadge';
import StageBadge from './StageBadge';
import { type DealCardAction } from './DealKurzinfo';
import ExpandedCardContent from './ExpandedCardContent';
import { CARD, ACTION_ROW } from "@/lib/componentBehavior";
import type { HeatStatusKey } from "@/lib/constants";
import type { HeatStatus } from "@/types";

/** Einheitliche Kachel-Daten (Top-Row). */
export interface HunterCardData {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  avatarUrl?: string;
  /** ICP 0–100. undefined/null → ICP-Ring wird NICHT gerendert (kein 0/grau-Platzhalter). */
  icpScore?: number;
  stageLabel: string;
  /** Echter Heat-Status → zentrales HeatBadge. */
  heatStatus?: HeatStatusKey | HeatStatus;
  /** Legacy-/Sonder-Badge (z.B. Warnung „Stagniert") wenn kein echter Heat-Status. */
  heat?: { bgClass: string; textClass: string; label: string };
  timeLabel: string;
  timeSubLabel?: ReactNode;
}

interface HunterCardProps {
  data: HunterCardData;
  /** Echter Kontakt → lazy Queries (Deals/Kommunikation) beim Aufklappen. Fehlt → Expand ohne Daten. */
  contactId?: string;
  /** Grüner Pfeil → 820px Info-Panel. */
  onOpenInfo?: () => void;
  /** Karten-Aktion → öffnet das Kontakt-Panel mit Tab/Aktion (editDeal trägt die dealId). */
  onAction?: (action: DealCardAction, dealId?: string) => void;
  /** Optionale Action-Row unter dem Body (Signal/Follow-up/Neu-in-Pipeline). */
  actionRow?: ReactNode;
  /** Auswahl (Bulk). */
  selected?: boolean;
  onToggleSelect?: (e: MouseEvent) => void;
  /** Farbe des Status-Punkts am Avatar. */
  statusDotClass?: string;
}

/**
 * HunterCard — EINE Kachel-Komponente für alle Hunter-Tabs. Garantiert
 * einheitliche Top-Row (Typografie/Größen/Ausrichtung via componentBehavior.ts),
 * identische Chevron-Kurzansicht (KI Kurzakte + Deal Details + Aktionen +
 * Kommunikationskette) und identischen „grüner Pfeil → 820px Info-Panel".
 * Die Action-Row wird als Slot übergeben, der Container ist überall gleich.
 *
 * Hinweis: Expand-Inhalte sind aktuell Mock (kommen später aus der DB).
 */
export default function HunterCard({
  data,
  contactId,
  onOpenInfo,
  onAction,
  actionRow,
  selected = false,
  onToggleSelect,
}: HunterCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Task/Notiz: echte Aktion wenn der Aufrufer onAction liefert, sonst Panel öffnen (onOpenInfo).
  const act = (a: DealCardAction) => (onAction ? onAction(a) : onOpenInfo?.());

  return (
    <div className={`${CARD.shell} ${selected ? "bg-[var(--signal-teal-bg)]" : "bg-app-surface"}`}>
      <div className={CARD.body}>
        {/* TOP ROW */}
        <div className={CARD.topRow}>
          {/* Auswahl-Checkbox */}
          {onToggleSelect && (
            <div
              onClick={(e) => onToggleSelect(e)}
              className={`${CARD.checkboxBase} ${
                selected
                  ? "bg-[var(--sherloq-primary)] opacity-100 border-[var(--sherloq-primary)]"
                  : "bg-app-surface border-2 border-[var(--border)] hover:border-[var(--text-muted)]"
              }`}
            >
              {selected && <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />}
            </div>
          )}

          {/* Avatar & Info */}
          <div className={`flex items-center gap-4 flex-1 min-w-0 transition-all duration-300 ${onToggleSelect ? "ml-0 group-hover:ml-8" : ""}`}>
            <div className="relative shrink-0">
              <Avatar name={data.name} src={data.avatarUrl} size={CARD.avatarSize} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={CARD.name}>{data.name}</span>
              <span className={CARD.jobTitle}>{data.jobTitle}, {data.company}</span>
            </div>
          </div>

          {/* ICP & Company */}
          <div className={`hidden md:flex items-center gap-4 px-4 ${CARD.divider} shrink-0`}>
            <div className={CARD.icpWrap}>
              {data.icpScore != null && <ICPDonut score={data.icpScore} />}
            </div>
            {data.company ? (
              <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
                <div className={CARD.companyBox}>{data.company.charAt(0).toUpperCase()}</div>
                <span className={CARD.companyName}>{data.company}</span>
              </div>
            ) : (
              <div className="w-[140px] xl:w-[180px]" aria-hidden />
            )}
          </div>

          {/* Stage & Heat */}
          <div className={`hidden lg:flex items-center gap-4 px-4 ${CARD.divider} shrink-0`}>
            <div className="flex flex-col items-center justify-center w-[80px] relative h-full">
              {data.stageLabel && (
                <>
                  <span className={CARD.miniLabel}>{t("hunter.common.stage")}</span>
                  <StageBadge stage={data.stageLabel} />
                </>
              )}
            </div>
            <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
              <span className={CARD.miniLabel}>{t("hunter.common.heat")}</span>
              {data.heatStatus ? (
                <HeatBadge status={data.heatStatus} />
              ) : data.heat ? (
                <div className={`${CARD.heatBadge} ${data.heat.bgClass} ${data.heat.textClass}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  {data.heat.label}
                </div>
              ) : null}
            </div>
          </div>

          {/* Zeit + Aktionen (Chevron + grüner Pfeil) */}
          <div className={`flex items-center gap-4 pl-4 ${CARD.divider} shrink-0 justify-between md:justify-end`}>
            <div className="flex flex-col items-end hidden sm:flex w-[130px]">
              <span className={CARD.timeMain}>{data.timeLabel}</span>
              {data.timeSubLabel && <div className={CARD.timeSub}>{data.timeSubLabel}</div>}
            </div>
            <div className="flex items-center gap-2 relative justify-end">
              {/* Quick-Actions nur im aufgeklappten Zustand — Icon-only, Tooltip on hover. */}
              {expanded && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); act('task'); }} aria-label={t("hunter.leadCard.task")} data-tip={t("hunter.leadCard.task")} className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors cursor-pointer">
                    <CheckSquare className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); act('note'); }} aria-label="Notiz" data-tip="Notiz" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors cursor-pointer">
                    <FileText className="w-5 h-5" />
                  </button>
                  <button disabled aria-label={t("hunter.leadCard.mail")} data-tip="Folgt mit Nango-Anbindung" className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted opacity-40 hover:bg-app-bg cursor-not-allowed">
                    <Mail className="w-5 h-5" />
                  </button>
                </>
              )}
              <button onClick={() => setExpanded(!expanded)} className={CARD.chevronBtn}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenInfo?.(); }}
                className={CARD.arrowBtn}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CHEVRON-KURZANSICHT — geteilter Inhalt (KI-Kurzakte · Deals · Kommunikation), lazy. */}
        {expanded && (
          <ExpandedCardContent
            contactId={contactId}
            onEditDeal={(dealId) => (onAction ? onAction('editDeal', dealId) : onOpenInfo?.())}
          />
        )}
      </div>

      {/* ACTION-ROW (Slot) — Container überall identisch */}
      {actionRow && <div className={ACTION_ROW.container}>{actionRow}</div>}
    </div>
  );
}
