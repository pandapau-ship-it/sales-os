/**
 * prefetch — Daten beim Hover/Intent vorladen, damit das Info-Panel beim Öffnen
 * oft schon Daten hat (vor Ende der Slide-in-Animation ~340 ms → gefühlt instant).
 *
 * Nutzt dieselben queryKeys + queryFns wie HunterSidepanel/ExpandedCardContent →
 * der Prefetch füllt exakt deren Cache (kein Doppel-Fetch). `prefetchQuery`
 * respektiert `staleTime`: frische Daten werden nicht erneut geholt, mehrfaches
 * Hovern kostet nichts.
 */
import type { QueryClient } from "@tanstack/react-query";
import {
  getContactDetail,
  getPipelineSettings,
  getTasksByContact,
  getDealsByContact,
  getNotesByContact,
  getContactCommunications,
} from "@/lib/db";

/**
 * Lädt den Panel-Kern eines Kontakts vor (Kopf + Tabs, die beim Öffnen sofort
 * sichtbar sind). Der Aktivität-Tab (audit_log, schwerer) bleibt absichtlich
 * außen vor — er lädt erst beim Tab-Wechsel.
 */
export function prefetchContactPanel(
  queryClient: QueryClient,
  organizationId: string,
  contactId: string,
): void {
  if (!organizationId || !contactId) return;
  const staleTime = 30_000; // wie queryClient-Default — kein Refetch wenn frisch

  queryClient.prefetchQuery({
    queryKey: ['contactDetail', organizationId, contactId],
    queryFn: () => getContactDetail(organizationId, contactId),
    staleTime,
  });
  queryClient.prefetchQuery({
    queryKey: ['pipelineStages', organizationId],
    queryFn: () => getPipelineSettings(organizationId),
    staleTime,
  });
  queryClient.prefetchQuery({
    queryKey: ['tasksByContact', organizationId, contactId],
    queryFn: () => getTasksByContact(organizationId, contactId),
    staleTime,
  });
  queryClient.prefetchQuery({
    queryKey: ['dealsByContact', organizationId, contactId],
    queryFn: () => getDealsByContact(organizationId, contactId),
    staleTime,
  });
  queryClient.prefetchQuery({
    queryKey: ['notesByContact', organizationId, contactId],
    queryFn: () => getNotesByContact(organizationId, contactId),
    staleTime,
  });
  queryClient.prefetchQuery({
    queryKey: ['communications', organizationId, contactId],
    queryFn: () => getContactCommunications(organizationId, contactId),
    staleTime,
  });
}
