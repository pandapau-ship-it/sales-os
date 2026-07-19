/**
 * alertTemplates.ts — Klartext-Template-Registry für Betriebs-Alarme (B-1, Bauplan E).
 *
 * Jeder überwachte Cron-Job hat eine für Nicht-Programmierer verständliche Erklärung mit den DREI
 * Pflicht-Feldern: WAS betroffen ist · VERMUTUNG woran es liegt · BEDEUTUNG für Betrieb/Nutzer.
 *
 * SPIEGEL-PRINZIP (wie credits.ts ↔ SQL): die LAUFZEIT-Quelle ist die DB-Tabelle `cron_expectations`
 * (Spalten alert_what/alert_hypothesis/alert_meaning, Seed in Migr. 068/069) — der Watchdog (DB)
 * baut die Alarm-Meldung daraus. Diese Datei ist der TS-Spiegel für die spätere Status-Seite (B-4)
 * und die [AUTO]-Tests. Ändert sich ein Text, MUSS er in beiden gleich bleiben.
 */

export interface AlertTemplate {
  /** WAS ist betroffen — Klartext, kein Funktionsname. */
  what: string;
  /** VERMUTUNG — plausible Hypothese in einfachen Worten. */
  hypothesis: string;
  /** BEDEUTUNG — was das für Betrieb/Nutzer konkret heißt. */
  meaning: string;
}

/** job_name → Klartext-Template. Neuer überwachter Cron = Eintrag hier + Seed-Zeile in cron_expectations. */
export const ALERT_TEMPLATES: Record<string, AlertTemplate> = {
  "score-deal-health-daily": {
    what: "Der tägliche Deal-Gesundheits-Check (Stagnations-Erkennung) ist nicht durchgelaufen.",
    hypothesis: "Möglicherweise war die Datenbank kurz nicht erreichbar oder ein Zugangsschlüssel ist abgelaufen.",
    meaning: "Stagnations-Hinweise auf Deals könnten heute veraltet sein, bis der nächste Lauf erfolgreich ist.",
  },
  "score-heat-status-daily": {
    what: "Die tägliche Heat-Status-Berechnung der Kontakte ist nicht durchgelaufen.",
    hypothesis: "Wahrscheinlich ein kurzer Ausfall der Datenbank oder ein abgelaufener Zugangsschlüssel.",
    meaning: "Die Heat-Anzeigen (Engaged/Warm/Cold …) könnten veraltet sein, bis der nächste Lauf klappt.",
  },
  "score-churn-risk-daily": {
    what: "Die tägliche Churn-Risiko-Berechnung der Bestandskunden ist nicht durchgelaufen.",
    hypothesis: "Möglicherweise ein kurzer Datenbank-Ausfall oder ein Zugangsproblem.",
    meaning: "Churn-Warnungen im Farmer könnten veraltet sein, bis der nächste Lauf erfolgreich ist.",
  },
  "score-upsell-daily": {
    what: "Die tägliche Upsell-Potenzial-Berechnung ist nicht durchgelaufen.",
    hypothesis: "Vermutlich ein kurzer Datenbank- oder Zugangs-Aussetzer.",
    meaning: "Upsell-Hinweise im Farmer könnten veraltet sein, bis der nächste Lauf klappt.",
  },
  "credit-monthly-reset": {
    what: "Der tägliche Wächter für den Credit-Verbrauchs-Reset ist nicht durchgelaufen.",
    hypothesis: "Kurzer Datenbank-Ausfall oder ein Zugangsproblem.",
    meaning: "Am Monatswechsel könnten die Credit-Zähler nicht korrekt auf 0 zurückgesetzt werden.",
  },
  "notifications-cleanup": {
    what: "Das tägliche Aufräumen alter Mitteilungen und Aktivitäten ist nicht durchgelaufen.",
    hypothesis: "Kurzer Datenbank-Ausfall oder ein Zugangsproblem.",
    meaning: "Alte Mitteilungen sammeln sich vorübergehend an — unkritisch, wird beim nächsten Lauf nachgeholt.",
  },
  "cron-runs-cleanup": {
    what: "Das tägliche Aufräumen der Cron-Lauf-Protokolle ist nicht durchgelaufen.",
    hypothesis: "Kurzer Datenbank-Ausfall oder ein Zugangsproblem.",
    meaning: "Die Lauf-Protokolle wachsen vorübergehend an — unkritisch, wird beim nächsten Lauf nachgeholt.",
  },
};

export type MonitoredJob = keyof typeof ALERT_TEMPLATES;

/** Template zu einem Job (oder null, wenn unbekannt — nie erfinden). */
export function alertTemplateFor(jobName: string): AlertTemplate | null {
  return ALERT_TEMPLATES[jobName] ?? null;
}
