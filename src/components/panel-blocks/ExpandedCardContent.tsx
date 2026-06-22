/**
 * ExpandedCardContent — aufgeklappter Inhalt
 * einer Profilkachel (Hunter/Leads).
 * Lazy: Queries nur wenn contactId vorhanden.
 * Genutzt von: HunterCard, LeadListRow
 */
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import CommunicationChain from "@/components/shared/CommunicationChain";
import DealsListe from "./DealsListe";
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
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrg();

  // Lazy: nur laden, wenn es einen Kontakt gibt (die Komponente wird nur im aufgeklappten Zustand gemountet).
  const enabled = !!contactId;
  const dealsQuery = useQuery({
    queryKey: ['dealsByContact', organizationId, contactId],
    queryFn: () => getDealsByContact(organizationId, contactId as string),
    enabled,
  });
  const commsQuery = useQuery({
    queryKey: ['communications', organizationId, contactId],
    queryFn: () => getContactCommunications(organizationId, contactId as string),
    enabled,
  });
  const stagesQuery = useQuery({
    queryKey: ['pipelineStages', organizationId],
    queryFn: () => getPipelineSettings(organizationId),
    enabled,
  });
  const stageMap = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.name]));
  const stageProbMap = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.probability]));
  const stagnationBySlug = Object.fromEntries((stagesQuery.data ?? []).map((s) => [s.slug, s.stagnation_days]));
  const commsView = (commsQuery.data ?? []).map(communicationToView);
  const dealRows = dealsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-5 border-t border-[var(--border-subtle)] pt-5 mt-2" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* KI-Kurzakte — Label außerhalb (wie „Deals"), Box darunter. Platzhalter bis AI-Pipeline ([D5]). */}
        <div className="h-full flex flex-col gap-2">
          <span className="px-1 typo-section-label text-text-muted inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[var(--sherloq-primary)]" /> {t("hunter.common.kiKurzakte")}
            <span className="px-1.5 py-0.5 rounded-full bg-app-bg text-text-muted text-[9px] font-extrabold uppercase tracking-wide">Folgt</span>
          </span>
          <div className="flex-1 bg-app-surface rounded-[12px] p-5 border border-[var(--border)]">
            <p className="text-[13px] text-text-muted italic leading-relaxed">KI-Kurzakte folgt mit der AI-Pipeline ([D5]).</p>
          </div>
        </div>

        {/* Deals — echt; Bleistift → Deals-Tab dieses Deals im Edit-Modus. Kein Deal → ausgeblendet. */}
        {dealRows.length > 0 && (
          <DealsListe variant="compact" dealRows={dealRows} stageNameBySlug={stageMap} stageProbBySlug={stageProbMap} stagnationBySlug={stagnationBySlug} onEditDeal={onEditDeal} />
        )}
      </div>

      {/* Kommunikation — volle Breite, echte Kette mit Hover; leer → ehrlicher Hinweis. */}
      {commsView.length > 0 ? (
        <CommunicationChain items={commsView} />
      ) : (
        <p className="px-1 text-[12px] text-text-muted">Noch keine Kommunikation protokolliert.</p>
      )}
    </div>
  );
}
