// terminalStages.ts — geteilte Won/Lost-System-Anker für die Edge Functions (eine Quelle statt
// dupliziertem Literal je Function).
//
// SYSTEM-INVARIANTE — bewusst KEIN [D51]-Config-Wert: Die terminale Stage-Identität (gewonnen/verloren)
// ist ein struktureller Bezeichner — Teil des `DealStage`-Typs (src/types/hunter.ts) und des Write-Pfads
// (db.ts updateDealWon/updateDealLost). Sie ist NICHT pro Org tunbar. Org-Anpassung betrifft ausschließlich
// die AKTIVEN Stufen (Name/Reihenfolge/Anzahl in settings.pipeline_stages — die sind [D51]-konform C).
//
// Dieses Modul SPIEGELT die Frontend-Quelle `hunterMappers` (WON_STAGE_SLUG/LOST_STAGE_SLUG/isTerminalStage).
// Deno kann die TS-Lib des Frontends nicht importieren → ein geteiltes Edge-Modul ist der DRY-Ersatz.
// Ändert sich der Enum, MÜSSEN beide Quellen (hunterMappers + dieses Modul) gleich gehalten werden.

export const WON_SLUG = "gewonnen";
export const LOST_SLUG = "verloren";
export const TERMINAL_STAGE_SLUGS = [WON_SLUG, LOST_SLUG] as const;

/** true, wenn der Slug eine Terminal-Stage (gewonnen/verloren) ist. */
export const isTerminalStageSlug = (slug: string | null | undefined): boolean =>
  (TERMINAL_STAGE_SLUGS as readonly string[]).includes(slug ?? "");
