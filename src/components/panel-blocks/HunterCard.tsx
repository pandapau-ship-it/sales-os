import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Check, ChevronDown, ChevronUp, ArrowRight, Zap,
} from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import { ICPDonut } from "@/components/shared/ICPDonut";
import CommunicationChain from "@/components/shared/CommunicationChain";
import HeatBadge from './HeatBadge';
import StageBadge from './StageBadge';
import DealKurzinfo, { type DealCardAction } from './DealKurzinfo';
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
  icpScore: number;
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
  /** Grüner Pfeil → 820px Info-Panel. */
  onOpenInfo?: () => void;
  /** Karten-Aktion (Mail/Task/Chat) → öffnet das Kontakt-Panel mit der Aktion. */
  onAction?: (action: DealCardAction) => void;
  /** Für die Kommunikationskette in der Kurzansicht. */
  onSelectCommunication?: (personId: string, tpId: string) => void;
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
  onOpenInfo,
  onAction,
  onSelectCommunication,
  actionRow,
  selected = false,
  onToggleSelect,
}: HunterCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

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
              <ICPDonut score={data.icpScore} />
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
            <div className="flex items-center gap-3 relative w-[90px] justify-end">
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

        {/* CHEVRON-KURZANSICHT — überall identisch (Mock bis DB) */}
        {expanded && (
          <div className="flex flex-col gap-6 border-t border-[var(--border-subtle)] pt-5 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* KI Kurzakte */}
              <div className="md:col-span-7 bg-app-surface rounded-[12px] p-5 border border-[var(--border)]">
                <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--sherloq-primary)] uppercase tracking-wider mb-4">
                  <Zap className="w-4 h-4 text-[var(--sherloq-primary)]" /> {t("hunter.common.kiKurzakte")}
                </div>
                <ul className="flex flex-col gap-3 text-[13px] text-[var(--text-body)] leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
                    Hat Budget-Freeze bis Q3 bestätigt. Trotzdem starkes Interesse an Feature Y — fragte aktiv nach ROI-Zahlen.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
                    Persönlichkeit: Blau — analytisch, entscheidet auf Basis von Daten. Kein Smalltalk, direkt zum Punkt.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
                    Objection: Timing wegen Budget-Freeze. Echter Einwand — kein Vorwand. ROI-Argument ist der Schlüssel.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
                    Buying Signal: Demo sehr positiv, fragte nach Implementierungs-Zeitplan. Abschluss realistisch ab Q4.
                  </li>
                </ul>
              </div>

              {/* Deal Details & Aktionen — geteilter Block */}
              <div className="md:col-span-5 flex flex-col gap-5">
                <DealKurzinfo stage={data.stageLabel} company={data.company} onAction={onAction} onOpenInfo={onOpenInfo} />
              </div>
            </div>

            {/* Kommunikationskette */}
            <CommunicationChain personId={data.id} onSelectCommunication={onSelectCommunication} />
          </div>
        )}
      </div>

      {/* ACTION-ROW (Slot) — Container überall identisch */}
      {actionRow && <div className={ACTION_ROW.container}>{actionRow}</div>}
    </div>
  );
}
