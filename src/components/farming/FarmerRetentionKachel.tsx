/**
 * FarmerRetentionKachel — Kachel im Farmer-Retention-Tab. Dünner Wrapper um die geteilte
 * HunterCard (CLAUDE-PFLICHT: Profilkarten IMMER HunterCard) → identische Profilzeile,
 * Progressive Disclosure und „grüner Pfeil → Panel" wie FarmerKundenKachel. Unterschied:
 * SUBSCRIPTION-Badge (statt STAGE) + eine Signal-Row (grauer Hintergrund wie Hunter).
 *
 * Signal-Row je Typ:
 * - churn_risk / cancelled: getönte Badge (rot) + einzelner CTA.
 * - going_cold: **1:1 Hunter Cold-Row** (FollowUpKaltCard Zustand 1): blaue Snowflake-„Cold"-
 *   Badge + „Kontakt ist kalt …" + „Start Outreach" + „Snooze". Erscheint nur bei heat=COLD.
 * Mock bis Score-/Signal-Anbindung; CTAs = Platzhalter-Toast bis Action-Panel ([D34]).
 */
import { AlertTriangle, XCircle, Snowflake, Clock, type LucideIcon } from "lucide-react";
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

interface TintedMeta {
  icon: LucideIcon;
  badgeLabel: string;
  badgeBg: string;   // Token-Tint der Badge
  badgeText: string; // Token-Textfarbe der Badge
  cta: string;
  ctaClass: string;
}

// Badge = getönte Pille (rounded-full, kein Border, text-[12px]) auf grauer Row.
const TINTED_META: Record<"churn_risk" | "cancelled", TintedMeta> = {
  churn_risk: {
    icon: AlertTriangle,
    badgeLabel: "Churn Risk",
    badgeBg: "bg-[var(--signal-urgent-bg)]",
    badgeText: "text-signal-urgent",
    cta: "Retention sichern",
    ctaClass: CTA_URGENT,
  },
  cancelled: {
    icon: XCircle,
    badgeLabel: "Gekündigt",
    badgeBg: "bg-[var(--signal-urgent-bg)]",
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

  // going_cold: 1:1 Hunter Cold-Row (blaue Snowflake-„Cold"-Badge + Start Outreach + Snooze).
  const tinted = item.type !== "going_cold" ? TINTED_META[item.type] : null;
  const TintedIcon = tinted?.icon ?? AlertTriangle;

  const actionRow = tinted ? (
    <>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium shrink-0",
            tinted.badgeBg,
            tinted.badgeText,
          )}
        >
          <TintedIcon className="w-3 h-3" />
          {tinted.badgeLabel}
        </span>
        <span className={ACTION_ROW.strongText}>{item.text}</span>
      </div>
      <button onClick={onAction} className={tinted.ctaClass}>
        {tinted.cta}
      </button>
    </>
  ) : (
    /* going_cold — exakt wie Hunter FollowUpKaltCard (Zustand 1) */
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
          <Snowflake className="w-[11px] h-[11px]" /> Cold
        </span>
        <span className={ACTION_ROW.strongText}>{item.text}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onAction} className={ACTION_ROW.ctaSecondary}>
          Start Outreach
        </button>
        <button onClick={onAction} className={`${ACTION_ROW.ctaSecondary} inline-flex items-center gap-1.5`}>
          <Clock className="w-3 h-3" /> Snooze
        </button>
      </div>
    </>
  );

  return (
    <HunterCard
      data={data}
      onOpenInfo={onOpenPanel}
      actionRow={actionRow}
      statusBadge={statusBadge}
    />
  );
}
