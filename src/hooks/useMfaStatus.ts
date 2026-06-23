/**
 * useMfaStatus — ist für den eingeloggten User 2FA (TOTP) eingerichtet? ([D21] Scheibe 8)
 *
 * Liest den MFA-Status über lib/auth getUserMfaStatus. Nur abgefragt, wenn eine Session
 * existiert; ohne User/Backend → `enrolled: true` (Banner erscheint dann nicht). TanStack
 * Query, staleTime 5 min (ändert sich selten). `refetch` für sofortiges Ausblenden nach Setup.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getUserMfaStatus } from "@/lib/auth";

export function useMfaStatus(): { enrolled: boolean; loading: boolean; refetch: () => void } {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    enabled: !!user?.id,
    queryKey: ["mfaStatus", user?.id],
    queryFn: getUserMfaStatus,
    staleTime: 5 * 60_000,
  });

  return {
    // Ohne User/noch nicht geladen → als „enrolled" behandeln (Banner nicht zeigen).
    enrolled: user?.id ? (data?.enrolled ?? true) : true,
    loading: !!user?.id && isLoading,
    refetch: () => { void refetch(); },
  };
}
