/**
 * useHoverPrefetch — Hover-Intent-Prefetch (Projekt-Standard, CLAUDE.md-Regel).
 *
 * Lädt Panel-/Detaildaten schon beim Verweilen über einer „Öffnen"-Affordance (Karte, Zeile,
 * Pfeil) vor, damit beim tatsächlichen Klick keine spürbare Ladezeit entsteht. Nach kurzem
 * Hover-Delay (Default 120 ms, deutlich < Slide-in ~340 ms) wird die Prefetch-Funktion EINMAL
 * ausgelöst — kein Prefetch-Sturm beim schnellen Drüberwischen; mehrfaches Hovern ist billig,
 * weil `queryClient.prefetchQuery` `staleTime` respektiert (frische Daten werden nicht erneut geholt).
 *
 * EINE Instanz teilt EINEN Timer → für Listen/Tabellen: den Hook einmal im Screen aufrufen und
 * `bind(fn)` pro Zeile spreaden (es ist immer nur eine Zeile gehovert). Für Einzel-Ziele (Karte):
 * einmal `bind(fn)` auf das Ziel.
 *
 * Nutzung:
 *   const prefetch = useHoverPrefetch();
 *   <div {...prefetch(() => prefetchContactPanel(queryClient, orgId, contactId))} />
 *
 * Das „WAS wird geladen" liegt in `lib/prefetch.ts` (`prefetchContactPanel`, später
 * `prefetchCompanyPanel` …) — dieser Hook liefert nur das „WANN" (Hover-Intent + Cancel).
 */
import { useCallback, useEffect, useRef } from "react";

export function useHoverPrefetch(delayMs = 120) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Beim Unmount einen offenen Timer aufräumen (kein Leak / kein Prefetch nach Verlassen).
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return useCallback((fn?: () => void) => ({
    onMouseEnter: () => {
      if (!fn || timer.current) return;
      timer.current = setTimeout(() => { fn(); timer.current = null; }, delayMs);
    },
    onMouseLeave: () => {
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    },
  }), [delayMs]);
}
