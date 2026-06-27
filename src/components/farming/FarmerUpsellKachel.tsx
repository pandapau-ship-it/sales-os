/**
 * FarmerUpsellKachel — Kachel im Farmer-Upsell-Tab. Struktur 1:1 wie FarmerRetentionKachel:
 * dünner Wrapper um HunterCard (CLAUDE-PFLICHT) → Profilzeile + Progressive Disclosure +
 * „grüner Pfeil → Panel". Unterschied: SUBSCRIPTION-Badge (statt STAGE) + Signal-Row mit
 * grüner „Upsell Potential"-Badge (Zap) auf grauer Row + „Action"-CTA.
 * Mock bis Score-/Signal-Anbindung; CTA = Platzhalter-Toast bis Action-Panel ([D34]).
 */
import type { ReactNode } from "react";
import { Zap } from "lucide-react";
import type { HeatStatus } from "@/types";
import { cn } from "@/lib/utils";
import { ACTION_ROW } from "@/lib/componentBehavior";
import HunterCard, { type HunterCardData } from "../panel-blocks/HunterCard";
import SubscriptionBadge from "./SubscriptionBadge";

export interface UpsellItem {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  avatarUrl?: string;
  icpScore?: number;
  heatStatus: HeatStatus; // → HeatBadge (kanonisches Label, Single Source)
  sherloqStatus: string;  // 'active' | 'cancelled' → SubscriptionBadge
  timeLabel: string;
  text: string;           // AI-Empfehlungstext (Mock)
}

interface FarmerUpsellKachelProps {
  item: UpsellItem;
  /** Pfeil-Icon → öffnet das Side Panel. */
  onOpenPanel: () => void;
  /** CTA-Klick → Platzhalter-Toast bis Action-Panel ([D34]). */
  onAction: () => void;
  /** Aufgeklappter Inhalt (FarmerExpandedCardContent) — von ScreenFarming durchgereicht. */
  expandedSlot?: ReactNode;
}

export default function FarmerUpsellKachel({ item, onOpenPanel, onAction, expandedSlot }: FarmerUpsellKachelProps) {
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
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium shrink-0",
            "bg-[var(--signal-success-bg)] text-signal-success",
          )}
        >
          <Zap className="w-3 h-3" />
          Upsell Potential
        </span>
        <span className={ACTION_ROW.strongText}>{item.text}</span>
      </div>
      <button onClick={onAction} className={`${ACTION_ROW.ctaSecondary} shrink-0`}>
        Action
      </button>
    </>
  );

  return (
    <HunterCard
      data={data}
      onOpenInfo={onOpenPanel}
      actionRow={actionRow}
      statusBadge={statusBadge}
      expandedSlot={expandedSlot}
    />
  );
}
