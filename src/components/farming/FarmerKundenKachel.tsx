/**
 * FarmerKundenKachel — Kunden-Kachel im Farmer-Screen. Dünner Wrapper um die geteilte
 * HunterCard (CLAUDE-PFLICHT: Profilkarten IMMER HunterCard, nie von Hand bauen) → Profilzeile,
 * Progressive Disclosure (ExpandedCardContent) und „grüner Pfeil → Panel" sind 1:1 wie Hunter.
 * Einziger Unterschied: statt STAGE der SUBSCRIPTION-Badge (aus customerStatusConfig, flexibel).
 * Heat-Badge identisch zu Hunter. Zeit = lastContactedAt (echtes last_contacted_at im DB-Pfad).
 */
import type { ReactNode } from "react";
import type { Customer } from "@/types";
import { cn } from "@/lib/utils";
import HunterCard, { type HunterCardData } from "../panel-blocks/HunterCard";
import { resolveCustomerStatus } from "./customerStatusConfig";

interface FarmerKundenKachelProps {
  contact: Customer;
  /** Pfeil-Icon → öffnet das Side Panel. */
  onOpenPanel: () => void;
  /** Aufgeklappter Inhalt (FarmerExpandedCardContent) — von ScreenFarming durchgereicht. */
  expandedSlot?: ReactNode;
}

export default function FarmerKundenKachel({ contact, onOpenPanel, expandedSlot }: FarmerKundenKachelProps) {
  const status = resolveCustomerStatus(contact.sherloqStatus);
  const StatusIcon = status.icon;

  const data: HunterCardData = {
    id: contact.id,
    name: contact.person.name,
    jobTitle: contact.person.jobTitle,
    company: contact.person.company,
    icpScore: contact.icpScore,
    stageLabel: "", // Kunde hat keine Pipeline-Stage → SUBSCRIPTION-Slot wird genutzt
    heatStatus: contact.heatStatus,
    timeLabel: contact.lastContactedAt ?? "", // echtes last_contacted_at (customerRowToView.lastContactedLabel), Anzeige-Label
  };

  const statusBadge = {
    label: "SUBSCRIPTION",
    node: (
      <div
        className={cn(
          // Form 1:1 wie HeatBadge: rounded-full, kein Border, text-[12px] font-medium (HeatBadge.tsx:21).
          // Einziger Unterschied: Lucide-Icon (Vertragsstatus) statt Dot (Aktivitätslevel).
          "px-2.5 py-1 rounded-full text-[12px] font-medium flex items-center gap-1.5 w-fit whitespace-nowrap",
          status.bg,
          status.text,
        )}
      >
        <StatusIcon className="w-3 h-3" />
        {status.label}
      </div>
    ),
  };

  return (
    <HunterCard
      data={data}
      contactId={contact.id}
      onOpenInfo={onOpenPanel}
      statusBadge={statusBadge}
      expandedSlot={expandedSlot}
    />
  );
}
