/**
 * useCurrentOrg — Session → organization_id + role ([D21], Scheibe 4).
 *
 * Single-Source fürs Org-Wiring: liest organization_id + role des eingeloggten
 * Users aus public.users (via lib/db getUserOrgRole). Solange keine Session da ist
 * (oder kein passender users-Datensatz), Fallback auf DEMO_ORGANIZATION_ID — damit
 * die Demo voll funktionsfähig bleibt. Scheibe 5 ersetzt dann das verstreute
 * DEMO_ORGANIZATION_ID Datei für Datei durch diesen Hook.
 *
 * Server-State über TanStack Query (Projektregel — kein useEffect+fetch), org_id im
 * Query-Key für Multi-Tenant-Cache-Isolation.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getUserOrgRole } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/org";

export function useCurrentOrg(): {
  organizationId: string;
  role: string;
  loading: boolean;
} {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    // Nur abfragen, wenn ein eingeloggter User da ist; sonst greift der Fallback.
    enabled: !!user?.id,
    queryKey: ["currentOrg", user?.id],
    queryFn: () => getUserOrgRole(user!.id),
    staleTime: 5 * 60_000, // Org/Role ändern sich praktisch nie pro Session
  });

  // Kein User → Demo-Fallback (sofort verfügbar, kein Ladezustand).
  if (!user?.id) {
    return { organizationId: DEMO_ORGANIZATION_ID, role: "member", loading: false };
  }

  return {
    organizationId: data?.organization_id ?? DEMO_ORGANIZATION_ID,
    role: data?.role ?? "member",
    loading: isLoading,
  };
}
