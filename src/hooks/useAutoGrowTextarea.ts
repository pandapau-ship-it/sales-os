/**
 * useAutoGrowTextarea — mehrzeilige „Mein Unternehmen"-Felder wachsen zeilenweise mit dem Inhalt.
 *
 * EINE zentrale Stelle (genutzt in `KnowledgeField`, dem FIELD-Kanon aller drei Bereiche Personal
 * Voice · Company Profile · Product) → alle mehrzeiligen Felder profitieren automatisch, kein
 * zweiter Wachstums-Weg. Deckel bei ~8 Zeilen (CSS `max-height` aus `--field-max-lines`), danach
 * Scroll; Start-/Mindesthöhe 3 Zeilen (CSS `min-height` aus `--field-min-lines`).
 *
 * RUHE VOR WEICHHEIT: Die Messung passiert IMMER aus `height:auto` und liest `scrollHeight` — das ist
 * die reine Inhaltshöhe, unabhängig von der aktuell angewandten Höhe. Dadurch ist die Berechnung
 * idempotent (gleicher Inhalt → gleiche Höhe) und kann nicht zittern. `scrollHeight` folgt dem echten
 * Inhalt, wächst also weich in ganzen Textzeilen (eine Textarea-Zeile ist eine Zeilenhöhe) — kein
 * Pixel-Zucken je Tastendruck. Der ganze Ablauf läuft in `useLayoutEffect` (vor dem Paint) → kein
 * sichtbares Flackern.
 *
 * RÜCKKOPPLUNGS-SCHUTZ (kritisch, weil zentral): Der `ResizeObserver` misst NUR bei BREITEN-Änderung
 * neu (Umbruch ändert die Zeilenzahl). Höhen-Änderungen — die wir selbst auslösen — werden am
 * unveränderten `width` erkannt und übersprungen. So kann „Höhe setzen → RO feuert → Höhe setzen"
 * keine Schleife bilden.
 */
import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Koppelt mehrere Textareas auf die Höhe der LÄNGSTEN (z. B. das „immer"/„nie"-Paar bei dos_donts):
 * beide bleiben bündig auf dem Maximum. Feedback-frei, weil jede Textarea ihre INHALTS-natürliche
 * Höhe meldet (nicht die angewandte) — die Gruppe bildet stabil genau ein Maximum und wendet es auf
 * alle an. Kein Aufschaukeln zwischen den Feldern.
 */
export interface AutoGrowGroup {
  /** Textarea an-/abmelden. Rückgabe = Abmelde-Funktion (Cleanup). */
  register(el: HTMLTextAreaElement): () => void;
  /** Natürliche (Inhalts-)Höhe eines Mitglieds melden → Gruppe wendet das Maximum auf alle an. */
  report(el: HTMLTextAreaElement, naturalPx: number): void;
}

/**
 * Reine Fabrik einer Kopplungs-Gruppe (ohne React/DOM-Layout testbar). `apply()` bildet das Maximum
 * aller gemeldeten Inhaltshöhen und setzt es auf ALLE Mitglieder — genau ein Ergebnis, kein
 * Aufschaukeln (die gemeldeten Werte sind inhaltsbasiert, nicht höhen-abhängig).
 */
export function createCoupleGroup(): AutoGrowGroup {
  const naturals = new Map<HTMLTextAreaElement, number>();
  const apply = () => {
    let max = 0;
    naturals.forEach((n) => { if (n > max) max = n; });
    if (max <= 0) return;
    naturals.forEach((_n, el) => { el.style.height = `${max}px`; });
  };
  return {
    register(el) {
      if (!naturals.has(el)) naturals.set(el, 0);
      return () => { naturals.delete(el); apply(); };
    },
    report(el, naturalPx) {
      naturals.set(el, naturalPx);
      apply();
    },
  };
}

/**
 * Erzeugt EINE stabile Kopplungs-Gruppe (im Eltern-Container des Paares aufrufen und an beide
 * gekoppelten `KnowledgeField` als `coupleGroup` durchreichen). Nicht gekoppelte Felder bekommen
 * KEINE Gruppe → der Kopplungs-Code berührt sie in keiner Weise (strikt opt-in).
 */
export function useCoupleGroup(): AutoGrowGroup {
  // useState-Lazy-Init: erzeugt die Gruppe genau EINMAL und hält sie stabil über alle Renders —
  // idiomatisch für „stabile Instanz je Komponente", ohne Ref-Zugriff während des Renderns.
  const [group] = useState(createCoupleGroup);
  return group;
}

export function useAutoGrowTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  group?: AutoGrowGroup,
): void {
  // An-/Abmelden bei der Kopplungs-Gruppe (nur gekoppelte Felder haben eine).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !group) return;
    return group.register(el);
  }, [ref, group]);

  // Mitwachsen — bei Inhalts-Änderung (`value`) und bei Breiten-Änderung (Umbruch).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return; // Einzeiliges Input-Feld: kein Textarea-Ref → No-op.

    const measure = () => {
      el.style.height = "auto"; // reine Inhaltshöhe messen
      const maxPx = parseFloat(getComputedStyle(el).maxHeight);
      const natural = Number.isFinite(maxPx) ? Math.min(el.scrollHeight, maxPx) : el.scrollHeight;
      if (group) group.report(el, natural); // Gruppe setzt das Maximum auf ALLE (inkl. dieses Feld)
      else el.style.height = `${natural}px`; // Einzelfeld: eigene Höhe
    };

    measure();

    // Nur BREITEN-Änderung neu messen (Umbruch). Höhen-Änderung ignorieren → kein Selbst-Trigger.
    // `ResizeObserver` fehlt in manchen Umgebungen (jsdom/SSR) → dann nur die Erst-Messung, kein Beobachter.
    if (typeof ResizeObserver === "undefined") return;
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w === lastWidth) return;
      lastWidth = w;
      measure();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [value, ref, group]);
}
