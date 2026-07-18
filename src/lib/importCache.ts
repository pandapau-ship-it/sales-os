/**
 * importCache — welche TanStack-Query-Caches nach einem erfolgreichen Import (oder Undo)
 * invalidiert werden müssen (K-5). Ausgelagert + rein, damit der Kontrakt getestet ist:
 * genau DAS wurde im ersten Schnitt vergessen (neue Kontakte erst nach Hard-Reload sichtbar).
 *
 * Ein Import kann Kontakte UND (per Domain/Name) neue Companies anlegen, und verändert das
 * Dedup-Universum → alle drei Caches müssen frisch werden. org_id im Key = Multi-Tenant-Isolation.
 */
export function importInvalidationKeys(organizationId: string): (readonly [string, string])[] {
  return [
    ["kontakte", organizationId],   // Kontakte-Liste (ScreenKontakte)
    ["companies", organizationId],  // Companies-Liste (neue Firmen aus dem Import)
    ["dedupUniverse", organizationId], // Duplikat-Abgleich eines Folge-Imports
  ];
}
