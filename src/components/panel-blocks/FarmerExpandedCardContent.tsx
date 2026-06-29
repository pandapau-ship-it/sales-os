/**
 * FarmerExpandedCardContent — aufgeklappter Inhalt einer Farmer-Profilkachel.
 * Farmer-Pendant zu `ExpandedCardContent` (Hunter): Design/Abstände/Elevation 1:1 — nur der
 * RECHTS-Block ist Subscription/Usage (statt Deals), weil Kunden keine Pipeline-Deals haben ([D50]).
 * Genutzt (via HunterCard `expandedSlot`) von: FarmerKundenKachel, FarmerRetentionKachel,
 * FarmerUpsellKachel, LinkedinSignalCard (Farmer) + Follow-ups (SequenceLeadCards/FollowUpKaltCard).
 *
 * ECHT (Lazy-Query, gleicher Schnitt wie Hunters ExpandedCardContent — keine Farmer-Insel):
 *  - Kommunikationskette: getContactCommunications → communicationToView → CommunicationChain (items).
 *    Lazy (useQuery in DER Komponente, nicht im .map → audit-safe), placeholderData. Leer → Hinweis.
 *  - Subscription (compact): echte customer-Felder (mrrMonthly→€, plan [ehrlich nach Honesty-Wurzelfix],
 *    sherloqStatus) — Single Source mit Panel-8d, KEIN neuer Fetch. nextPayment/NRR = „Folgt" (kein DB-Feld).
 *  - Usage (compact): „Folgt" [D49] — keine echte Quelle, UsageBox blendet leere Daten aus (kein Fake).
 *  - KI-Kurzakte: KiKurzaktePlaceholder [D5].
 * SUBSCRIPTION nie Stage (über sherloqStatus) — Farmer-Invariante.
 *
 * `onOpenPanel(tab, section?)`: Deeplink — jeder Block öffnet das FarmerSidepanel auf dem passenden Tab
 * (Sektions-ID → Block leuchtet kurz auf). „Kein Hover ohne onClick": Boxen tragen ihre Hover-Affordance
 * nur mit funktionalem Handler.
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import CommunicationChain from "@/components/shared/CommunicationChain";
import KiKurzaktePlaceholder from "./KiKurzaktePlaceholder";
import SubscriptionBox, { type SubscriptionData } from "./SubscriptionBox";
import UsageBox, { type UsageData } from "./UsageBox";
import PanelSkeleton from "./PanelSkeleton";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { getContactCommunications } from "@/lib/db";
import { communicationToView } from "@/lib/hunterMappers";
import type { Customer } from "@/types";

export default function FarmerExpandedCardContent({
  customer,
  onOpenPanel,
}: {
  customer: Customer;
  onOpenPanel?: (tab: string, section?: string) => void;
}) {
  const { organizationId } = useCurrentOrg();
  const contactId = customer.id;

  // Lazy: die Komponente wird nur im aufgeklappten Zustand gemountet. Key = Farmer-Panel-Key
  // ('contactCommunications') → derselbe Cache wie der Sidepanel-Kommunikation-Tab (Konsistenz, kein Doppel-Fetch).
  const commsQuery = useQuery({
    queryKey: ["contactCommunications", organizationId, contactId],
    queryFn: () => getContactCommunications(organizationId, contactId),
    enabled: !!contactId,
    placeholderData: keepPreviousData,
  });
  const commsView = (commsQuery.data ?? []).map(communicationToView);

  // Subscription aus dem echten customer (customerRowToView → companies). Single Source mit Panel-8d.
  // HONESTY: SubscriptionBox blendet fehlende Werte selbst aus; plan ist nach dem Wurzelfix ehrlich (undefined wenn NULL).
  const fmtEuroCents = (cents: number | undefined) =>
    typeof cents === "number" ? (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : undefined;
  const subscription: SubscriptionData = {
    plan: customer.subscriptionPlan,
    status: customer.sherloqStatus,
    mrr: fmtEuroCents(customer.mrrMonthly),
    nextPayment: "Folgt", // kein DB-Feld (Billing/Stripe folgt)
    nrr: "Folgt",         // kein DB-Feld
  };
  // Usage: keine echte Quelle → „Folgt" [D49]. Leeres Objekt → UsageBox compact rendert null (kein Fake).
  const usage: UsageData = {};

  return (
    <div className="flex flex-col gap-5 border-t border-[var(--border-subtle)] pt-5 mt-2" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* LINKS — KI-Kurzakte (geteilter Platzhalter [D5]), Klick → Übersicht-Tab (Block leuchtet auf). */}
        <KiKurzaktePlaceholder onClick={onOpenPanel ? () => onOpenPanel("overview", "kiakte") : undefined} />

        {/* RECHTS — Subscription (echt) + Usage („Folgt" [D49]) statt Deals ([D50]); Klick → Subscription-Tab. */}
        <div className="flex flex-col gap-4">
          <SubscriptionBox variant="compact" data={subscription} onShowAll={onOpenPanel ? () => onOpenPanel("subscription", "subscription") : undefined} />
          <UsageBox variant="compact" data={usage} onShowAll={onOpenPanel ? () => onOpenPanel("usage", "usage") : undefined} />
        </div>
      </div>

      {/* UNTEN — echte Kommunikationskette (getContactCommunications). Laden → Skeleton; leer → ehrlicher Hinweis. */}
      {commsQuery.isLoading ? (
        <PanelSkeleton rows={1} height={56} />
      ) : commsView.length > 0 ? (
        <CommunicationChain items={commsView} onSelectCommunication={onOpenPanel ? () => onOpenPanel("communication", "communication") : undefined} />
      ) : (
        <p className="px-1 text-[12px] text-text-muted">Noch keine Kommunikation protokolliert.</p>
      )}
    </div>
  );
}
