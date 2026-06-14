/**
 * NAV — EINZIGE Stil-Quelle für ALLE Navigationsleisten:
 *   • Top-Nav (layout/TopBar)
 *   • Sub-Navs (ScreenHunting / ScreenFarming …)
 *   • linke Sidebar (layout/Sidebar)
 *
 * HIER ändern → überall angepasst. Nie Nav-Stile pro Komponente hardcoden.
 * Aktiv-Hintergrund ist ein Gradient → als Inline-Style setzen: style={{ background: NAV.activeBg }}.
 * (analog CARD/ACTION_ROW in componentBehavior.ts)
 */
export const NAV = {
  /** Pill-Form für Container + Items — die eine Stellschraube für alle Nav-Leisten. */
  radius: "rounded-full",
  /** Weiße Fläche der (horizontalen) Nav-Container. */
  surface: "bg-app-surface shadow-[var(--shadow-card)]",
  /** Innen-Layout horizontaler Nav-Container. */
  container: "flex items-center gap-1 p-1 w-fit",
  /** Tab-Geometrie + Typografie (horizontale Navs). */
  tab: "px-[21px] py-[11px] text-[14px] font-medium transition-all cursor-pointer flex items-center gap-2",
  /** Aktiv-Hintergrund (Brand-Gradient) — als style={{ background: NAV.activeBg }} setzen. */
  activeBg: "var(--sherloq-gradient)",
  /** Aktiver Tab (Text + Schatten; Hintergrund via activeBg). */
  active: "text-on-accent shadow-sm",
  /** Inaktiver Tab (Text-Navigation). */
  inactive: "text-text-body hover:bg-app-bg hover:text-text-primary",
  /** Count-Badge im Tab (aktiv / inaktiv). */
  badgeActive: "bg-app-surface text-[var(--sherloq-primary)]",
  badgeInactive: "bg-[var(--border)] text-text-body",
  /** Icon-Button-Geometrie (Sidebar). */
  iconBtn: "flex items-center justify-center transition-all duration-200 cursor-pointer",
  /** Aktives Icon (Sidebar) — Hintergrund via activeBg. */
  activeIcon: "text-on-accent shadow-brand",
  /** Inaktives Icon (Sidebar). */
  inactiveIcon: "text-text-muted hover:bg-app-bg hover:text-text-primary",
} as const;
