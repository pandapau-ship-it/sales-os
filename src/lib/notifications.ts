/**
 * notifications.ts — Registry & Helfer für das Mitteilungs-Fundament (N-S1).
 *
 * Zweck (Zukunftsfähigkeits-Diagnose Punkt 2): `category`/`source_type`/`event_type` sind in der
 * DB bewusst TEXT (kein enum/CHECK). Diese Datei ist die EINE dokumentierte Quelle der bekannten
 * Werte — neue Quelle/Modul = Eintrag hier (Daten), KEINE Migration, KEINE `notify()`-Änderung.
 *
 * SPIEGEL-PRINZIP (wie credits.ts ↔ SQL-RPCs): der Idempotenz-Key hier spiegelt den DB-UNIQUE-Index
 * `uq_notifications_idem (organization_id, user_id, source_type, source_id, category)` aus 065.
 * Der DB-Constraint ist die Laufzeit-Wahrheit; dieser Helfer ist Referenz/UI-Dedupe + [AUTO]-testbar.
 */

/** Severity-Stufen (steuert Sortierung/Ton in der Glocke). */
export const NOTIFICATION_SEVERITIES = ["low", "normal", "high", "urgent"] as const;
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];

/**
 * Kategorien der Glocke → Anzeige-Gruppe (N2: Braucht dich · System · Berichte · Team) +
 * E-Mail-Default (N6). Neue Kategorie = Zeile ergänzen (Daten), plus Seed in settings.notifications.
 */
export const NOTIFICATION_CATEGORIES = {
  approval:     { group: "braucht_dich", emailDefault: "instant" },
  credit:       { group: "braucht_dich", emailDefault: "instant" },
  system_alert: { group: "system",       emailDefault: "instant" },
  job_result:   { group: "system",       emailDefault: "digest" },
  mailbox:      { group: "system",       emailDefault: "digest" },
  report:       { group: "berichte",     emailDefault: "digest" },
  team:         { group: "team",         emailDefault: "digest" },
} as const;
export type NotificationCategory = keyof typeof NOTIFICATION_CATEGORIES;
export const NOTIFICATION_GROUPS = ["braucht_dich", "system", "berichte", "team"] as const;
export type NotificationGroup = (typeof NOTIFICATION_GROUPS)[number];

/**
 * Namespace der Erzeuger (source_type). Verweist auf die Quell-Tabelle/den Erzeuger — die Mitteilung
 * KOPIERT keine Daten, sie referenziert die Quelle (N2). Neue Quelle = Eintrag ergänzen.
 */
export const NOTIFICATION_SOURCE_TYPES = [
  "approval_requests", // C6 Freigabe-Flow
  "credit_balance",    // Credit-80%-Warnung / Kauf-Anfrage
  "system_alerts",     // Betriebs-Alarme B3
  "cron_runs",         // Job-Ergebnisse/-Fehler C2
  "invitations",       // Team-Einladungen
  "mailboxes",         // Onboarding-/Mailbox-Nudges, Warmup
  "chat_sessions",     // spätere Chat-/Billing-Ereignisse
] as const;
export type NotificationSourceType = (typeof NOTIFICATION_SOURCE_TYPES)[number];

/** Ereignis-Katalog des Ambient-Feeds (N3, v1). Neuer Typ = Eintrag ergänzen. */
export const ACTIVITY_EVENT_TYPES = [
  "auto_send",       // Auto-Sends gebündelt pro Campaign/Lauf
  "score_run",       // Score-/Heat-Läufe
  "kurzakte_update", // Kurzakten-Updates gebündelt
  "briefing",        // Morning Briefing erstellt
  "signal_routed",   // Signale empfangen + geroutet
  "list_sync",       // Listen-Sync-Ergebnis
  "meeting_prep",    // Meeting-Prep erstellt
  "warmup_step",     // Mailbox-Warmup-Stufe erhöht
] as const;
export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export function isKnownCategory(v: string): v is NotificationCategory {
  return v in NOTIFICATION_CATEGORIES;
}
export function isKnownSeverity(v: string): v is NotificationSeverity {
  return (NOTIFICATION_SEVERITIES as readonly string[]).includes(v);
}
export function groupOf(category: string): NotificationGroup | null {
  return isKnownCategory(category) ? NOTIFICATION_CATEGORIES[category].group : null;
}

export interface NotificationKeyParts {
  organizationId: string;
  userId: string; // Diagnose Punkt 5: user_id IST Teil des Keys — Mehr-Empfänger = getrennte Zeilen
  sourceType: string;
  sourceId: string;
  category: string;
}

/**
 * Stabiler Idempotenz-/Update-Key — spiegelt den DB-UNIQUE-Index aus 065. Gleiche Parts → gleiche
 * Zeile (Update, N12); unterschiedliche user_id → unterschiedlicher Key → getrennte Zeilen.
 * NUR-für-Referenz/UI-Dedupe: der DB-Constraint bleibt die durchsetzende Instanz.
 */
export function notificationIdempotencyKey(p: NotificationKeyParts): string {
  return [p.organizationId, p.userId, p.sourceType, p.sourceId, p.category].join("::");
}
