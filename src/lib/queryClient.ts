/**
 * queryClient — zentrale TanStack-Query-Instanz (einziger Server-State-Cache).
 *
 * Mounten in App.tsx via <QueryClientProvider>. Realtime invalidiert die Caches
 * primär (→ CLAUDE.md: Performance & Data Loading). staleTime moderat, kein
 * Refetch beim Fokuswechsel (Realtime hält die Daten frisch).
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
