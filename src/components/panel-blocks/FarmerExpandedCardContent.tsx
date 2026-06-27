/**
 * FarmerExpandedCardContent — aufgeklappter Inhalt einer Farmer-Profilkachel.
 * Farmer-Pendant zu `ExpandedCardContent` (Hunter): Design/Abstände/Elevation 1:1 — nur der
 * RECHTS-Block ist Subscription/Usage (statt Deals), weil Kunden keine Pipeline-Deals haben.
 * Genutzt (via HunterCard `expandedSlot`) von: FarmerKundenKachel, FarmerRetentionKachel,
 * FarmerUpsellKachel, LinkedinSignalCard (Farmer) + Follow-ups (SequenceLeadCards/FollowUpKaltCard).
 *
 * Prop-driven aus dem Mock-`Customer` (Farmer ist Mock — KEINE eigenen Queries). Beim Farmer-DB-Wiring
 * werden daraus echte Lazy-Queries (gleicher Schnitt wie Hunter heute). Quick-Actions (Task/Notiz/Mail)
 * kommen automatisch aus HunterCard — hier bewusst NICHT eingebaut.
 *
 * `onOpenPanel(tab, section?)`: Deeplink — jeder Block öffnet das FarmerSidepanel direkt auf dem passenden
 * Tab und übergibt eine Sektions-ID, damit der Ziel-Block dort kurz aufleuchtet (Deeplink-Highlight):
 * KI-Kurzakte → ('overview','kiakte') · Subscription/Usage → ('subscription','subscription') ·
 * Kommunikation → ('communication','communication').
 * „Kein Hover ohne onClick": die Boxen tragen ihre Hover-Affordance nur mit funktionalem Handler.
 */
import CommunicationChain from "@/components/shared/CommunicationChain";
import KiKurzaktePlaceholder from "./KiKurzaktePlaceholder";
import SubscriptionBox, { type SubscriptionData } from "./SubscriptionBox";
import UsageBox, { type UsageData } from "./UsageBox";
import type { Customer } from "@/types";

export default function FarmerExpandedCardContent({
  customer,
  onOpenPanel,
}: {
  customer: Customer;
  onOpenPanel?: (tab: string, section?: string) => void;
}) {
  // MOCK — Schnitt identisch zu FarmerSidepanel (Single Source der Mock-Felder bis DB-Wiring).
  // HONESTY: SubscriptionBox/UsageBox blenden fehlende Werte selbst aus.
  const subscription: SubscriptionData = {
    plan: customer.subscriptionPlan,
    status: customer.sherloqStatus,
    mrr: "2.000 €",
    nextPayment: "01.07.2026",
  };
  const usage: UsageData = {
    lastLogin: customer.lastLogin,
    onboarding: "Abgeschlossen",
    enrichments: { used: 8500, limit: 10000 },
  };

  return (
    <div className="flex flex-col gap-5 border-t border-[var(--border-subtle)] pt-5 mt-2" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* LINKS — KI-Kurzakte (geteilter Platzhalter), Klick → Übersicht-Tab (Block leuchtet auf). */}
        <KiKurzaktePlaceholder onClick={onOpenPanel ? () => onOpenPanel('overview', 'kiakte') : undefined} />

        {/* RECHTS — Subscription + Usage (compact) statt Deals; Klick → Subscription-Tab (Block leuchtet auf). */}
        <div className="flex flex-col gap-4">
          <SubscriptionBox variant="compact" data={subscription} onShowAll={onOpenPanel ? () => onOpenPanel('subscription', 'subscription') : undefined} />
          <UsageBox variant="compact" data={usage} onShowAll={onOpenPanel ? () => onOpenPanel('subscription', 'subscription') : undefined} />
        </div>
      </div>

      {/* UNTEN — Kommunikationskette (Mock-Strang aus der id); Klick auf einen Knoten → Kommunikation-Tab. */}
      <CommunicationChain personId={customer.person.id} onSelectCommunication={onOpenPanel ? () => onOpenPanel('communication', 'communication') : undefined} />
    </div>
  );
}
