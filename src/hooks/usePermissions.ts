/**
 * usePermissions — effektive Rechte des eingeloggten Users, EINMAL pro Session geladen (Caching, SET-1).
 *
 * Server-State via TanStack Query (Projektregel), user_id im Query-Key (Multi-Tenant-Cache-Isolation),
 * kurzer staleTime wie useCurrentOrg — kein DB-Roundtrip pro Klick. Das UI prüft in-memory (`has`),
 * der SERVER erzwingt bei jedem Write erneut (has_permission in den RPCs). UI-Ausblenden ≠ Sicherheit.
 *
 * Demo-Modus (keine Session): leere Rechte + Rollen-Fallback über useCurrentOrg → UI zeigt Member-Sicht,
 * der Server verweigert echte Writes ohnehin (kein auth.uid()).
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useCurrentOrg } from "./useCurrentOrg";
import { getEffectivePermissions } from "@/lib/db";
import { ROLE_PERMISSIONS, type Role } from "@/lib/permissions";

export function useEffectivePermissions(): {
  permissions: Set<string>;
  has: (permission: string) => boolean;
  loading: boolean;
} {
  const { user } = useAuth();
  const { role } = useCurrentOrg();

  const { data, isLoading, isError, isSuccess } = useQuery({
    enabled: !!user?.id,
    queryKey: ["effectivePermissions", user?.id],
    queryFn: () => getEffectivePermissions(user!.id),
    staleTime: 5 * 60_000, // Rechte ändern sich selten pro Session; Mutationen invalidieren gezielt
    retry: false,          // RPC fehlt/greift nicht → sofort auf Rollen-Fallback, kein Spinner-Stau
  });

  // Rollen-Default aus der Matrix als FAIL-SAFE: ohne Session, ODER wenn die RPC (noch) nicht
  // erreichbar ist (z.B. Migration noch nicht gepusht) → nie fälschlich ALLES ausblenden.
  // v1 setzt keine deny-Overrides → Matrix == effektive Rechte; der Server erzwingt ohnehin erneut.
  const roleFallback = ROLE_PERMISSIONS[(role as Role)] ?? [];
  const source = user?.id && isSuccess && data ? data : roleFallback;
  const permissions = new Set<string>(source);

  return {
    permissions,
    has: (permission: string) => permissions.has(permission),
    loading: !!user?.id && isLoading && !isError,
  };
}

/** Imperative Einzelabfrage (disabled-Zustand, bedingte Handler). `usePermission("x.y") → boolean`. */
export function usePermission(permission: string): boolean {
  return useEffectivePermissions().has(permission);
}
