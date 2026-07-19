/**
 * RequiresPermission — blendet Kinder aus, wenn die aktuelle Person das Recht NICHT hat (SET-1).
 *
 * DAUERHAFTER Baustein (CLAUDE.md „GLOBALE REGEL — Rechte-Check-Pflicht"): jede künftige
 * rechte-relevante UI wird mit EINER Zeile geschützt, statt jedes Mal neue Prüf-Logik zu schreiben.
 *
 *   <RequiresPermission permission="records.delete">
 *     <button onClick={onDelete}>Löschen</button>
 *   </RequiresPermission>
 *
 * WICHTIG: Das ist nur die UI-Sichtbarkeit — die ECHTE Durchsetzung ist der Server-Guard
 * (has_permission in den RPCs). Ausblenden ersetzt NIE die serverseitige Prüfung.
 *
 * `fallback` (optional) statt Nichts rendern (z.B. ein deaktivierter Zustand oder Upgrade-Hinweis).
 * `loading` (optional) während die effektiven Rechte einmalig laden — Default: nichts zeigen.
 */
import type { ReactNode } from "react";
import { useEffectivePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";

// Hinweis: der imperative `usePermission`-Hook lebt in `@/hooks/usePermissions` (react-refresh:
// eine Komponenten-Datei exportiert nur Komponenten). Import in Consumern von dort.

export function RequiresPermission({
  permission,
  children,
  fallback = null,
  loadingFallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}) {
  const { has, loading } = useEffectivePermissions();
  if (loading) return <>{loadingFallback}</>;
  return has(permission) ? <>{children}</> : <>{fallback}</>;
}
