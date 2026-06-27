/**
 * ExpandedCardContent — aufgeklappter Inhalt
 * einer Profilkachel (Hunter/Leads).
 * Lazy: Queries nur wenn contactId vorhanden.
 * Genutzt von: HunterCard, LeadListRow
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import CommunicationChain from "@/components/shared/CommunicationChain";
import DealsListe from "./DealsListe";
import KiKurzaktePlaceholder from "./KiKurzaktePlaceholder";
import PanelSkeleton from "./PanelSkeleton";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { getContactCommunications, getDealsByContact, getPipelineSettings } from "@/lib/db";
import { communicationToView } from "@/lib/hunterMappers";

export default function ExpandedCardContent({
  contactId,
  onEditDeal,
}: {
  contactId?: string;
  onEditDeal?: (dealId: string) => void;
}) {
  const { organizationId } = useCurrentOrg();

  // Lazy: nur laden, wenn es einen Kontakt gibt (die Komponente wird nur im aufgeklappten Zustand gemountet).
  const enabled = !!contactId;
  // placeholderData: vorige Daten halten → weicher Übergang beim erneuten Aufklappen.
  const dealsQuery = useQuery({
    queryKey: ['dealsByContact', organizationId, contactId],
    queryFn: () => getDealsByContact(organizationId, contactId as string),
    enabled,
    placeholderData: keepPreviousData,
  });
  const commsQuery = useQuery({
    queryKey: ['communications', organizationId, contactId],
    queryFn: () => getContactCommunications(organizationId, contactId as string),
    enabled,
    placeholderData: keepPreviousData,
  });
  const stagesQuery = useQuery({
    queryKey: ['pipelineStages', organizationId],
    queryFn: () => getPipelineSettings(organizationId),
    enabled,
    placeholderData: keepPreviousData,
  });
  const stageMap = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.name]));
  const stageProbMap = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.probability]));
  const stagnationBySlug = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.stagnation_days]));
  const commsView = (commsQuery.data ?? []).map(communicationToView);
  const dealRows = dealsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-5 border-t border-[var(--border-subtle)] pt-5 mt-2" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* KI-Kurzakte — geteilter Platzhalter-Block (Single Source mit Farmer), bis AI-Pipeline ([D5]). */}
        <KiKurzaktePlaceholder />

        {/* Deals — echt; Bleistift → Deals-Tab dieses Deals im Edit-Modus. Kein Deal → ausgeblendet.
            Erstes Laden → Skeleton statt leerer Spalte. */}
        {dealsQuery.isLoading ? (
          <PanelSkeleton rows={1} height={132} />
        ) : dealRows.length > 0 && (
          <DealsListe variant="compact" dealRows={dealRows} stageNameBySlug={stageMap} stageProbBySlug={stageProbMap} stagnationBySlug={stagnationBySlug} onEditDeal={onEditDeal} />
        )}
      </div>

      {/* Kommunikation — volle Breite, echte Kette mit Hover; leer → ehrlicher Hinweis.
          Erstes Laden → Skeleton statt „leer"-Hinweis (kein falsches Aufblitzen). */}
      {commsQuery.isLoading ? (
        <PanelSkeleton rows={1} height={56} />
      ) : commsView.length > 0 ? (
        <CommunicationChain items={commsView} />
      ) : (
        <p className="px-1 text-[12px] text-text-muted">Noch keine Kommunikation protokolliert.</p>
      )}
    </div>
  );
}
