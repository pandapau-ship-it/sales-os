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
    "group relative rounded-[12px] flex flex-col shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 transition-all duration-300 border border-[var(--border-card)] overflow-hidden",
  /** Gepolsterter Body (Top-Row + Expand). 16px. */
  body: "p-4 flex flex-col gap-4",
  /** Top-Row-Container. */
  topRow: "flex flex-col md:flex-row md:items-center justify-between gap-6 relative",

  avatarSize: 40,
  /** Status-Punkt am Avatar. */
  statusDot: "absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-[var(--surface)] rounded-full",

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
  /** Stage-Badge — Größe wie Neu-in-Pipeline (px-3 py-1), Farben wie Lead-Kachel. */
  stageBadge:
    "px-3 py-1 rounded-full bg-[var(--app-bg)] text-[var(--text-body)] text-[12px] font-semibold border border-[var(--border)]",
  /** Heat-Badge — Größe wie Neu-in-Pipeline (px-3 py-1); Farbe kommt aus getHeatColor. */
  heatBadge: "px-3 py-1 rounded-full text-[12px] font-semibold border flex items-center gap-1.5",

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
    "absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-[22px] h-[22px] rounded-[6px] z-10 cursor-pointer",
} as const;

/**
 * HOVER_ACTIONS — GLOBALE REGEL: Edit-/Löschen-/Copy-Buttons in Kacheln/Zeilen sind
 * standardmäßig unsichtbar und erscheinen erst beim Hover über die Kachel (Tastatur:
 * via focus-within). Voraussetzung: die Kachel trägt `group`. Auf den Button ODER den
 * Button-Container anwenden. Bei benannten Groups stattdessen die Variante
 * `opacity-0 group-hover/<name>:opacity-100 focus-within:opacity-100 transition` nutzen.
 * `transition` (statt transition-opacity) deckt zugleich die Hover-Farbwechsel ab.
 */
export const HOVER_ACTIONS =
  "opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition" as const;

/** Action-Row-Vorgaben ("Neu in Pipeline" ist die Referenz). */
export const ACTION_ROW = {
  /** Voll-breite Zeile unterhalb des Bodys. */
  container:
    "bg-[var(--app-bg)] border-t border-[var(--border-card)] px-4 py-3 flex items-center justify-between flex-wrap gap-4",
  /** Linke Info-Texte. */
  text: "text-[12.5px] font-semibold text-text-muted",
  /** Hervorgehobener Text (z.B. Quelle/Aktionstext). */
  strongText: "text-[12.5px] font-semibold text-text-body",
  /** Primärer CTA (gefüllt). */
  ctaPrimary:
    "px-4 py-1.5 bg-[var(--sherloq-primary)] hover:opacity-90 text-white rounded-full text-[11px] font-black transition-opacity shadow-sm cursor-pointer",
  /** Sekundärer CTA (Outline). */
  ctaSecondary:
    "px-4 py-1.5 bg-app-surface border border-border hover:bg-app-bg text-text-body rounded-full text-[11px] font-black transition-colors shadow-sm cursor-pointer",
} as const;

/**
 * CARD_PANEL — Box INNERHALB eines Panels/Overlays (Elevation-System Ebene 1, In-Panel).
 *
 * Wann nutzen: Inhalts-/Sektions-Box, die in einem schwebenden Panel sitzt (820px-Info-Panel,
 * CustomerDrawer, Action-Panels). Das Panel selbst liefert die Elevation (Ebene 2) → die Box
 * trägt NUR eine Haarlinie, KEINEN eigenen Schatten (sonst Schatten-im-Schatten).
 * NICHT für Kacheln auf dem Seiten-Hintergrund — die nutzen `CARD.shell` (mit Schatten + Hover).
 */
export const CARD_PANEL =
  "bg-app-surface border border-[var(--border-card)] rounded-[12px]" as const;

/**
 * TABLE — Daten-Tabelle/Liste (Elevation-System Ebene 0 in Ebene-1-Container).
 *
 * Wann nutzen: Tabellen/Listen, die schnell gescannt werden (Pipeline-Deals, Kontakte-Liste …).
 * Die Tabelle ist EINE ruhende Karte (`container`); die Zeilen sind KEINE Karten — nur Haarlinien-
 * Trenner + Hover-Tint, NIE ein Schatten/Box pro Zeile. Header durch `bg-app-bg` + Bottom-Border
 * abgesetzt.
 */
export const TABLE = {
  /** Äußerer Container = ruhende Karte (Ebene 1). */
  container:
    "bg-app-surface rounded-[12px] border border-[var(--border-card)] shadow-[var(--shadow-card)] overflow-hidden",
  /** Kopfzeile — abgesetzt durch Hintergrund + Bottom-Border. */
  header: "bg-app-bg border-b border-[var(--border-card)]",
  /** Datenzeile — nur Trennlinie + Hover, kein Schatten/Box. */
  row: "border-b border-[var(--border-card)] last:border-0 hover:bg-app-bg",
} as const;

/**
 * FIELD — Kanon-Optik JEDES Eingabefeldes (Text/Textarea/Select-Trigger) im Projekt:
 * GRAUE Füllung `bg-app-bg`, 10px Radius, Border erst im Fokus in Markenfarbe.
 *
 * Warum hier: dieser String existierte bisher als Copy-Paste an ~22 Stellen (zuerst in
 * `AddSdrLeadPanel`, daher „FIELD-Kanon" in CLAUDE.md) — und die rohen shadcn-Primitive
 * `Input`/`Textarea` bringen eine ANDERE Optik mit (weiß bzw. shadcn-Rohtokens). Wer sie
 * ungeklassed benutzt, weicht unbemerkt vom Rest der App ab (genau so entstand der weiße
 * Eingabe-Hintergrund in „Produkte & Preise"). Ab jetzt: eine Quelle.
 *
 * Anwendung: `<Input className={FIELD} />` bzw. `<Textarea className={FIELD_MULTILINE} />`.
 */
// FOKUS-ZIELBILD = Kontakte-Anlage-Feld (`EditableInline`/`DetailField`): EINE saubere Border-Linie
// im Fokus (border-border → focus:border-sherloq-primary, rounded-[10px], outline-none), KEIN Ring/Glow.
// FIELD selbst hat schon exakt diesen Look — den Ring bringt NUR das shadcn-`Input`-Primitiv mit
// (`focus:ring-2 focus:ring-sherloq-primary/30`). `focus:ring-0` neutralisiert ihn (greift über
// cn()/tailwind-merge, da FIELD im Primitiv als className ZULETZT gemergt wird). `ui/input.tsx` bleibt
// unangetastet. FIELD wird NUR von KnowledgeField genutzt (die übrigen Panels haben eigene lokale
// FIELD-Strings auf rohen <input> ohne Ring) → die Angleichung bleibt auf „Mein Unternehmen" beschränkt.
export const FIELD =
  "w-full text-[13px] font-sans px-3.5 py-2.5 bg-app-bg border border-border " +
  "focus:border-[var(--sherloq-primary)] rounded-[10px] focus:outline-none focus:ring-0 transition-colors " +
  "placeholder-[var(--text-muted)]";

/** Mehrzeilige Variante — gleiche Optik, nur Höhe/Umbruch abweichend. */
// `md:text-[13px]` überschreibt das `md:text-sm` aus dem shadcn-Textarea-Primitiv —
// sonst wären mehrzeilige Felder ab Tablet 14px, einzeilige 13px.
// `field-autogrow` (index.css): einheitliche 3-Zeilen-Starthöhe, wächst zeilenweise mit dem Inhalt
// (JS-Hook `useAutoGrowTextarea`) bis 8 Zeilen, danach Scroll. `leading-relaxed` MUSS zum Token
// `--field-line-height` (1.625) passen — sonst rechnet die Höhe daneben. Ersetzt `resize-y`.
//
// FOKUS-KONSISTENZ = Kontakte-Zielbild (nur Border, KEIN Ring): Das shadcn-Textarea-Primitiv bringt
// `focus-visible:ring-2 ring-ring ring-offset-2` mit (abgesetzter Ring/Glow). Wir setzen die Ring-Breite
// UND den Offset auf 0 → der Ring verschwindet vollständig; es bleibt nur die Border-Linie im Fokus,
// exakt wie `EditableInline`/`DetailField`. `focus-visible:` deckt die Textarea-Variante ab (das
// `focus:ring-0` aus FIELD greift bei der Textarea nicht, da anderer Variant). Greift über
// cn()/tailwind-merge (className zuletzt gemergt); `ui/textarea.tsx` bleibt unangetastet.
export const FIELD_MULTILINE =
  `${FIELD} md:text-[13px] leading-relaxed field-autogrow ` +
  `focus-visible:ring-0 focus-visible:ring-offset-0`;

/**
 * AI_PILL — Optik JEDES KI-Knopfes (Feld-Ebene und ganze Karte/Abschnitt).
 *
 * Übernimmt bewusst den Pill-Kanon der Statistik-Kacheln aus „Mein Profil"
 * (`rounded-full` + `typo-chip` + Teal-Tint aus den Signal-Tokens): KI-Aktionen sollen als
 * eigene, wiedererkennbare Klasse von Aktionen lesbar sein — nicht als weiteres graues Icon
 * zwischen Stift und Papierkorb.
 *
 * `AI_PILL_PENDING` ist der Zustand „Folgt": derselbe Tint, sichtbar abgeschwächt und nicht
 * bedienbar. Solange `lib/ai.ts` fehlt, ist das der einzige erlaubte Zustand — ein Knopf, der
 * so tut, als könne er etwas, wäre ein Honesty-Bruch.
 */
export const AI_PILL =
  "inline-flex items-center gap-1.5 rounded-full typo-chip " +
  "bg-[var(--signal-teal-bg)] text-[var(--signal-teal-text)] transition-colors";

export const AI_PILL_PENDING = `${AI_PILL} opacity-60 cursor-not-allowed`;
