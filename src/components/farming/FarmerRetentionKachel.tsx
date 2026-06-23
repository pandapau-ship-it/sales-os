/**
 * FarmerRetentionKachel — Kachel im Farmer-Retention-Tab. Dünner Wrapper um die geteilte
 * HunterCard (CLAUDE-PFLICHT: Profilkarten IMMER HunterCard) → identische Profilzeile,
 * Progressive Disclosure und „grüner Pfeil → Panel" wie FarmerKundenKachel.
 * Unterschied: SUBSCRIPTION-Badge (statt STAGE) + eine farbige **Signal-Row** (Action-Row mit
 * getöntem Hintergrund, Status-Badge, AI-Text, CTA). Typ-spezifisch über RETENTION_META.
 * Mock bis Score-/Signal-Anbindung; CTA = Platzhalter-Toast bis Action-Panel ([D34]).
 */
import { AlertTriangle, Thermometer, XCircle, type LucideIcon } from "lucide-react";
import type { HeatStatus } from "@/types";
import { cn } from "@/lib/utils";
import { ACTION_ROW } from "@/lib/componentBehavior";
import HunterCard, { type HunterCardData } from "../panel-blocks/HunterCard";
import SubscriptionBadge from "./SubscriptionBadge";

export type RetentionType = "churn_risk" | "going_cold" | "cancelled";

export interface RetentionItem {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  avatarUrl?: string;
  icpScore?: number;
  heatStatus: HeatStatus; // → HeatBadge (kanonisches Label, Single Source)
  sherloqStatus: string;  // 'active' | 'cancelled' → SubscriptionBadge
  timeLabel: string;
  type: RetentionType;
  text: string;           // AI-Empfehlungstext (Mock)
}

// Rote CTA (Churn/Gekündigt) — getöntes Rot, Button darf Rand tragen (Border-Hierarchie).
const CTA_URGENT =
  "px-4 py-1.5 rounded-full text-[11px] font-black bg-[var(--signal-urgent-bg)] text-signal-urgent border border-[var(--signal-urgent-text)]/15 hover:opacity-90 transition-opacity cursor-pointer shrink-0";

interface RetentionMeta {
  rowBg: string;        // Hintergrund der Signal-Row (subtiler Tint, via actionRowClassName)
  icon: LucideIcon;
  badgeLabel: string;
  badgeText: string;    // Token-Textfarbe der Badge
  cta: string;
  ctaClass: string;
}

// Badge sitzt als helle Pille (bg-app-surface) auf der getönten Row → Kontrast, rounded-full, kein Border.
const RETENTION_META: Record<RetentionType, RetentionMeta> = {
  churn_risk: {
    rowBg: "bg-[var(--signal-urgent-bg)]",
    icon: AlertTriangle,
    badgeLabel: "Churn Risk",
    badgeText: "text-signal-urgent",
    cta: "Retention sichern",
    ctaClass: CTA_URGENT,
  },
  going_cold: {
    rowBg: "bg-[var(--signal-warn-bg)]",
    icon: Thermometer,
    badgeLabel: "Wird kalt",
    badgeText: "text-signal-warn",
    cta: "Check-In starten",
    ctaClass: `${ACTION_ROW.ctaSecondary} shrink-0`,
  },
  cancelled: {
    rowBg: "bg-[var(--signal-urgent-bg)]",
    icon: XCircle,
    badgeLabel: "Gekündigt",
    badgeText: "text-signal-urgent",
    cta: "Jetzt anrufen",
    ctaClass: CTA_URGENT,
  },
};

interface FarmerRetentionKachelProps {
  item: RetentionItem;
  /** Pfeil-Icon → öffnet das Side Panel. */
  onOpenPanel: () => void;
  /** CTA-Klick → Platzhalter-Toast bis Action-Panel ([D34]). */
  onAction: () => void;
}

export default function FarmerRetentionKachel({ item, onOpenPanel, onAction }: FarmerRetentionKachelProps) {
  const meta = RETENTION_META[item.type];
  const Icon = meta.icon;

  const data: HunterCardData = {
    id: item.id,
    name: item.name,
    jobTitle: item.jobTitle,
    company: item.company,
    avatarUrl: item.avatarUrl,
    icpScore: item.icpScore,
    stageLabel: "", // Kunde hat keine Pipeline-Stage → SUBSCRIPTION-Slot
    heatStatus: item.heatStatus,
    timeLabel: item.timeLabel,
  };

  const statusBadge = {
    label: "SUBSCRIPTION",
    node: <SubscriptionBadge status={item.sherloqStatus} />,
  };

  const actionRow = (
    <>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-app-surface text-[12px] font-medium shrink-0",
            meta.badgeText,
          )}
        >
          <Icon className="w-3 h-3" />
          {meta.badgeLabel}
        </span>
        <span className={ACTION_ROW.strongText}>{item.text}</span>
      </div>
      <button onClick={onAction} className={meta.ctaClass}>
        {meta.cta}
      </button>
    </>
  );

  return (
    <HunterCard
      data={data}
      onOpenInfo={onOpenPanel}
      actionRow={actionRow}
      actionRowClassName={meta.rowBg}
      statusBadge={statusBadge}
    />
  );
}
