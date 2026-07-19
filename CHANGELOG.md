# Changelog

> Eintrag nach jedem Commit (→ CLAUDE.md Dokumentations-Standard).
> Format: `add:` neu · `update:` geändert · `fix:` behoben · `refactor:` · `docs:`
> Neueste oben.

## Unreleased

- **feat:** Betrieb & Überwachung B-1 (Minimal, Migr. 068/069). Drei globale Tabellen `cron_runs`
  (Lauf-Telemetrie) · `system_alerts` (Betriebs-Alarme) · `cron_expectations` (Erwartungs-Katalog +
  Klartext-Templates) — alle in audit `GLOBAL_TABLES`. Cron-Wrapper `cron_run_start`/`cron_run_finish`;
  **alle 6 bestehenden Crons umgestellt** (063/067 DB-seitig neu geschedult; 035/037/049/051 schreiben
  in ihren Edge-Functions — Deploy nötig). Watchdog-Cron (alle 15 Min) prüft Erwartungs-Katalog, **bündelt**
  gleichzeitige Ausfälle in EINE `system_alerts`-Zeile + EIN `notify()` (Kategorie System, nur interne
  Ops-Orgs, N12-Dedupe), Selbstheilung bei Erholung. Retention-Cron (Erfolg 7T / Fehler 30T) + Indizes.
  Klartext-Registry `src/lib/alertTemplates.ts` (WAS/Vermutung/Bedeutung, +Test, Spiegel des DB-Seeds).
  `/health`-Endpoint-Stub (B-2-Andockpunkt). **In-App-only** (System-Mail-Kanal = B-2). Haken: B9
  (aiCall-Überwachung), Sentry, Status-Seite/Mini-Indikator = B-2/B-4.

- **fix:** Weiße Seite auf /app/notifications behoben. Ursache: `subscribeToNotifications` nutzte für
  beide Subscriber (TopBar + ScreenNotifications) denselben Channel-Topic → Supabase-Kollision
  („tried to subscribe multiple times"), in der Effect-Phase geworfen, ohne ErrorBoundary → React
  unmountet den Baum. Fix: eindeutiges Topic pro Subscription (`notifications:${user}:${n}`) + try/catch-
  Guard (Realtime-Fehler schaltet die App nie weiß). Zusätzlich: EINE globale `ErrorBoundary` (freundliche
  Fallback-UI + Reload, Konsole-Log, B-1-Anschlusspunkt für Monitoring). Regressionstests: realtime
  (eindeutige Topics/Guard), ErrorBoundary (Fallback statt weiß), ScreenNotifications-Realdata (echtes
  i18n + 4 Kategorien). Der Render-Test war grün, weil alle Tests `@/lib/realtime` mockten.

- **feat:** Mitteilungs-Glocke + Mitteilungsseite N-S2-Minimal (Option A, Route). TopBar-Glocke mit
  echtem Ungelesen-Badge (RLS-Query, live via Realtime). Route `/app/notifications`: Standardansicht
  nur Ungelesenes in 4 Gruppen (Braucht dich/System/Berichte/Team via `notifications.ts`-Registry),
  Verlauf-Tab (90T), Klick=gelesen+verschwindet+Navigation (N13), „Alle als gelesen", EmptyState.
  db.ts `getNotifications`/`getUnreadNotificationCount`/`markNotificationRead`/`markAllNotificationsRead`
  (reine RLS-Queries, kein `notify()`). `realtime.ts` `subscribeToNotifications` echt verdrahtet
  (user-gefilterter postgres_changes-Channel). Registry `screen_notifications`, i18n, +7 Tests. Keine
  Migration. Inline-Source-Buttons/Settings-Matrix/Popup/Feed bleiben Folge-Slices (N-S3/N-S4).
- **feat:** N-S2 Polish (ruhe-konform, reduced-motion-aware): dezenter Badge-Ring-Puls nur bei Zuwachs ·
  sanftes Ausblenden beim Als-gelesen · Cmd+K-Eintrag „Mitteilungen" · ruhige Gruppen-Count-Chips.

- **feat:** Mitteilungs-Fundament N-S1 (Migrationen 065-067). Tabellen `notifications`
  (user-gerichtet) + `activity_events` (Ambient-Feed) + `settings.notifications` (Matrix, additiv).
  **Idempotenz-Key MIT `user_id`** (`UNIQUE(org,user,source_type,source_id,category)`) → Mehr-
  Empfänger-Mitteilungen fallen nicht in eine Zeile (Diagnose Punkt 5). Postgres-Funktionen
  `notify()` (Idempotenz-Upsert N12, Rollen-Fanout, „Zeile schreiben → Fan-out später") +
  `log_activity()`. Pflicht-Indizes (partiell `read_at IS NULL`, created_at, occurred_at). Realtime
  DB-seitig aktiviert (`supabase_realtime` + `notifications`). Cleanup-Cron (DELETE: read >90T /
  activity >30T). `category`/`source_type` = TEXT + Registry `src/lib/notifications.ts` (neue Quelle
  = nur Daten). Kanal-Fan-out (Push/Slack) + AI-Chat-Lesetool bleiben dokumentierte Haken.

- **fix:** Merge-Dialog wendet den K-6a-Default jetzt auch im UI an (Duplikate verwalten).
  Gewinner = befüllterer Datensatz via `pickPrimaryId` (statt Paar-Reihenfolge); Vorauswahl pro
  abweichendem Feld auf den befüllten Wert (`defaultMergeSide`, Spiegel von `resolveMergeFields`).
  Verhindert stillen Datenverlust, wenn der Gewinner an einem Feld leer und der Verlierer befüllt
  ist. Manuelle Pro-Feld-Override-Auswahl bleibt unverändert. Reiner Frontend-Fix (+4 Tests).

- **feat:** Billing-Fundament-Härtung (Migration 064, additiv auf 061-063). Punkt 0:
  `consume_credits` friert die angewandten Parameter (tokens_per_credit/model_factor/min) in
  `credit_transactions.metadata` ein → Rückwirkungsfreiheit, vergangene Buchungen für immer
  erklärbar. Punkt 5: globale `billing_config`-Singleton-Tabelle + `_billing_config` liest
  global → per-Key-Override aus `settings.billing` (bestehende Orgs behalten Override, neue erben
  global). TS-Spiegel `resolveBillingConfig`/`buildFrozenChargeMeta` (+Tests). Onboarding-Regel
  „kein Auto-Seed von settings.billing" vermerkt. Punkte 1-4 bleiben dokumentierte Andock-Haken.

- **feat:** Entitlement- & Credit-Layer (Vorab-Migration vor AI-SDR-Slice-5, Option A).
  Additive Migrationen 061–063 auf den Billing-Tabellen (008): `credit_transactions.metadata`,
  `settings.billing` ([D51]-Config statt nicht-existenter `system_config`), Seeds (internal-Plan
  `-1`, Subscription + credit_balance je Org, Billing-Config). RLS war bereits vollständig in 011
  (plans/plan_limits global — dokumentierte audit-Ausnahme `GLOBAL_TABLES`). RPCs `check_entitlement` /
  `check_credit_balance` / `consume_credits` (atomar, security definer, intern blockiert nie).
  Monats-Reset-Cron. Formel-Spiegel `src/lib/credits.ts` (+19 Tests). `aiCall()`-Verdrahtung +
  Promo/Voucher (redemption_codes) als dokumentierte Haken. (docs §9)

- **docs:** Git-Workflow als harte Regel verankert — niemals direkt auf `main`,
  immer Feature-Branch (`feature/`·`fix/`·`chore/`), regelmäßige Commits. (CLAUDE.md Selbst-Wartung + Repository)
- **feat:** Service-Abstraktion `lib/db|auth|storage|realtime` — einzige Supabase-Swap-Stelle; audit-geprüft.
- **feat:** Dark Mode Basis (Tokens, `useTheme`, Sidebar-Toggle, FOUC-Guard); CustomerDrawer-Slide + Dark-Fixes.

- **docs:** Dokumentations-Standard in CLAUDE.md erweitert (Stripe/Linear/Vercel-Niveau);
  `/docs`-Struktur angelegt (modules, api, decisions); 6 ADRs geschrieben
  (Supabase, shadcn, Edge Functions, organization_id, Sending Layer, aiCall);
  Placeholder für setup/runbook/CONTRIBUTING/database/architecture; `llms.txt`; dieses CHANGELOG.
- **fix:** Emoji aus UI entfernt (ScreenFarming/Hunting/CustomerDrawer) → Lucide-Icons;
  `audit.ts` schließt `ScreenPlaceholder` als Helper sauber aus.
- **add:** `CHECKLIST.md` + `scripts/audit.ts` (`npm run audit`) — Selbst-Audit der 5 Pflicht-Prüffragen.
- **add:** Selbst-Wartung Pflichtregeln (höchste Priorität) als erste CLAUDE.md-Sektion.
- **update:** Agent-Architektur (AI SDR/Hunter/Farmer), Navigation 4-Punkte,
  Signal Routing, Hunter/Farmer als Recommendation Agents, Risk-Level Vorbereitung.
- **add:** Datenqualität & Duplikate, Notifications, Performance, Fehlerbehandlung,
  SaaS-Readiness, Dynamische Sequenzen, Sequenz Engine, AI Call Abstraktion, Modularer Aufbau.

## Frühere Phasen

Siehe `PROGRESS.md` für die Session-Historie (Design-Phase, shadcn-Migration,
Token-Zentralisierung, Build-Fixes).
