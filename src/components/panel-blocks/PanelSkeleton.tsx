/**
 * PanelSkeleton — Lade-Platzhalter für Info-Panel-Tabs während `isLoading`
 * (statt leerem Inhalt → fühlt sich sofort „richtig" an, kein leeres Aufblitzen).
 *
 * Reine Token-Farben + `animate-pulse`. In-Panel-Box-Stil: `border-card`, KEIN
 * Schatten (das Panel liefert die Elevation → CLAUDE.md Elevation-System).
 * Erscheint nur beim ersten Laden — `placeholderData` hält bei Folge-Öffnungen
 * die vorigen Daten, dann greift dieser Skeleton nicht.
 */
export default function PanelSkeleton({
  rows = 3,
  height = 72,
}: {
  /** Anzahl Platzhalter-Zeilen (an der erwarteten Inhaltsmenge des Tabs orientiert). */
  rows?: number;
  /** Höhe je Zeile in px (an die jeweilige Karten-/Box-Höhe angelehnt). */
  height?: number;
}) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-[12px] bg-app-surface border border-[var(--border-card)] animate-pulse"
          style={{ height }}
        />
      ))}
    </div>
  );
}
