import { useEffect, useState } from "react";

/**
 * useDeeplinkHighlight — zentrales Hilfsmittel für die „Deeplink-Highlight"-Invariante
 * (CLAUDE.md → Design Invariants). Springt der User zu einem bestimmten Element (Ansehen,
 * Alle anzeigen, Cmd+K, Benachrichtigung → Element), wird das Ziel kurz hervorgehoben:
 *  1. hinscrollen (das Element trägt `data-flash-id="<id>"`),
 *  2. die zurückgegebene `flashId` aktivieren → die Ziel-Row bekommt `className={cn(..., flashId===id && 'deeplink-flash')}`,
 *  3. nach `duration` (Default 1.5s) verblasst der Effekt automatisch.
 *
 * Das Aufklappen (expanded[id]=true) steuert die Liste selbst (List-spezifischer State) —
 * dieser Hook kümmert sich nur um Scroll + Flash-Timing, damit es nicht pro Stelle neu gebaut wird.
 * Respektiert `prefers-reduced-motion` über die CSS-Klasse (`.deeplink-flash`).
 */
export function useDeeplinkHighlight(
  highlightId: string | null | undefined,
  duration = 1500,
): string | null {
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightId) { setFlashId(null); return; }
    setFlashId(highlightId);
    // Nach dem Paint scrollen, damit eine eben aufgeklappte Ziel-Row schon existiert.
    const raf = requestAnimationFrame(() => {
      const sel = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(highlightId) : highlightId;
      document.querySelector(`[data-flash-id="${sel}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = setTimeout(() => setFlashId(null), duration);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [highlightId, duration]);

  return flashId;
}
