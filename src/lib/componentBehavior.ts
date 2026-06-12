/**
 * componentBehavior.ts — EINZIGE Quelle für die Kachel-Designvorgaben (Hunter).
 *
 * Referenz: Lead-Kachel (ScreenHunting.tsx, Leads-Tab) für die Top-Row,
 * "Neu in Pipeline" für die Action-Row. Alle Hunter-Kacheln nutzen diese
 * Konstanten (über die geteilte HunterCard), damit Typografie, Größen, Farben
 * und Ausrichtung überall AUTOMATISCH identisch sind. Werte hier ändern → ändert
 * sich überall.
 */

/** Top-Row-Vorgaben (Lead-Kachel ist die Referenz). */
export const CARD = {
  /** Karten-Shell (ohne Padding — Body + Action-Row liegen darin). */
  shell:
    "group relative rounded-[12px] flex flex-col shadow-[var(--shadow-card)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-[var(--border-card)] overflow-hidden",
  /** Gepolsterter Body (Top-Row + Expand). 16px. */
  body: "p-4 flex flex-col gap-4",
  /** Top-Row-Container. */
  topRow: "flex flex-col md:flex-row md:items-center justify-between gap-6 relative",

  avatarSize: 40,
  /** Status-Punkt am Avatar. */
  statusDot: "absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-white rounded-full",

  /** Personenname. */
  name: "text-[14px] font-bold text-[var(--text-primary)] font-sans",
  /** Jobbezeichnung (+ Company-Suffix), muted. */
  jobTitle: "text-[12px] text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate",

  /** ICP-Donut-Wrapper (feste Breite für vertikale Ausrichtung). */
  icpWrap: "w-[48px] flex items-center justify-center",

  /** Firmen-Initial-Box (dunkel). */
  companyBox:
    "bg-[var(--text-primary)] text-white text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0",
  /** Firmenname (teal). */
  companyName: "text-[14px] text-[var(--sherloq-primary)] font-semibold w-[120px] truncate",

  /** Mini-Label über Stage/Heat ("STAGE"/"HEAT"). */
  miniLabel:
    "absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase",
  /** Stage-Badge. */
  stageBadge:
    "px-4 py-2 rounded-full bg-[var(--app-bg)] text-[var(--text-body)] text-[12px] font-semibold border border-[var(--border)]",
  /** Heat-Badge (Basis — Farbe kommt aus getHeatColor). */
  heatBadge: "px-4 py-2 rounded-full text-[12px] font-semibold border flex items-center gap-1.5",

  /** Zeitangabe (Hauptzeile). */
  timeMain: "text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap",
  /** Zeitangabe (Unterzeile, z.B. "Xh left" / "8T in Stage"). */
  timeSub:
    "flex items-center justify-end gap-1.5 mt-0.5 text-[var(--icp-low)] font-semibold text-[12px] whitespace-nowrap",

  /** Senkrechte Trennlinie zwischen Spalten. */
  divider: "border-l border-[var(--border-subtle)]",

  /** Chevron-Button (Kurzansicht auf/zu). */
  chevronBtn:
    "w-8 h-8 flex items-center justify-center text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--app-bg)] cursor-pointer",
  /** Grüner Pfeil-Button (→ 820px Info-Panel). */
  arrowBtn:
    "w-10 h-10 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-all flex items-center justify-center shadow-sm cursor-pointer",

  /** Auswahl-Checkbox (Hover/Selected). */
  checkboxBase:
    "absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-[22px] h-[22px] rounded-md z-10 cursor-pointer",
} as const;

/** Action-Row-Vorgaben ("Neu in Pipeline" ist die Referenz). */
export const ACTION_ROW = {
  /** Voll-breite Zeile unterhalb des Bodys. */
  container:
    "bg-[var(--app-bg)] border-t border-[var(--border-card)] px-4 py-3 flex items-center justify-between flex-wrap gap-4",
  /** Linke Info-Texte. */
  text: "text-[12.5px] font-semibold text-gray-500",
  /** Hervorgehobener Text (z.B. Quelle/Aktionstext). */
  strongText: "text-[12.5px] font-semibold text-gray-800",
  /** Primärer CTA (gefüllt). */
  ctaPrimary:
    "px-4 py-1.5 bg-[var(--sherloq-primary)] hover:opacity-90 text-white rounded-full text-[11px] font-black transition-opacity shadow-sm cursor-pointer",
  /** Sekundärer CTA (Outline). */
  ctaSecondary:
    "px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-[11px] font-black transition-colors shadow-sm cursor-pointer",
} as const;
