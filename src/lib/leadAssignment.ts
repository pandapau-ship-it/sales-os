/**
 * leadAssignment.ts — K9: Lead-Assignment-Strategien (Basislogik round_robin).
 *
 * Bauplan-Entscheidung K9: jeder Kontakt trägt `assigned_to`. Bei Team-Orgs greift eine
 * konfigurierbare Regel (`settings.lead_assignment_strategy`). K-1b liefert die
 * round_robin-Basislogik; by_region | by_source | manual_only = spätere Settings-Erweiterung
 * (kein Architekturumbau — deshalb hier schon als Typ vorgesehen).
 *
 * Rein (keine DB): die DB-Schicht (assign_lead_owner in db.ts/Edge) lädt die aktiven
 * Sales-User + den zuletzt zugewiesenen Owner und ruft `pickRoundRobin`.
 */

export type LeadAssignmentStrategy = "round_robin" | "by_region" | "by_source" | "manual_only";

export const DEFAULT_LEAD_ASSIGNMENT_STRATEGY: LeadAssignmentStrategy = "round_robin";

/**
 * Nächsten Owner per Round-Robin wählen: der auf `lastAssignedId` folgende User in der
 * (stabil sortierten) Liste aktiver Sales-User. Reihum, am Ende wieder von vorn.
 *
 * @param activeSalesUserIds aktive Sales-User der Org, STABIL sortiert (z.B. nach created_at, id).
 * @param lastAssignedId     der zuletzt einem Lead zugewiesene Owner (oder null beim ersten Lauf).
 * @returns nächste User-id, oder null wenn kein Sales-User verfügbar (Aufrufer → manual/unassigned).
 */
export function pickRoundRobin(
  activeSalesUserIds: string[],
  lastAssignedId: string | null | undefined,
): string | null {
  if (activeSalesUserIds.length === 0) return null;

  // Unbekannter/keiner zuletzt → mit dem ersten anfangen.
  const idx = lastAssignedId ? activeSalesUserIds.indexOf(lastAssignedId) : -1;
  if (idx === -1) return activeSalesUserIds[0];

  return activeSalesUserIds[(idx + 1) % activeSalesUserIds.length];
}

/**
 * Auf Basis der Org-Strategie den Owner bestimmen. K-1b implementiert nur round_robin;
 * erweiterte Strategien fallen bewusst auf round_robin zurück, bis ihre Settings-Erweiterung
 * gebaut ist (kein stiller Fehlversand — dokumentierter Übergang, nicht erfunden).
 * manual_only → kein Auto-Owner (User weist selbst zu).
 */
export function resolveOwner(
  strategy: LeadAssignmentStrategy,
  activeSalesUserIds: string[],
  lastAssignedId: string | null | undefined,
): string | null {
  if (strategy === "manual_only") return null;
  // round_robin (+ vorerst Fallback für by_region/by_source bis Slice-Erweiterung)
  return pickRoundRobin(activeSalesUserIds, lastAssignedId);
}
