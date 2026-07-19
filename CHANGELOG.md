# Changelog

> Eintrag nach jedem Commit (→ CLAUDE.md Dokumentations-Standard).
> Format: `add:` neu · `update:` geändert · `fix:` behoben · `refactor:` · `docs:`
> Neueste oben.

## Unreleased

- **fix:** SET-2 Ansicht — **Entitlement-Ehrlichkeit** (Modul-Plan × persönliche Präferenz). Die Sidebar
  kombinierte beide Ebenen bereits korrekt (`hasModule` UND `!hidden`, AND-verknüpft — ein nicht-gebuchtes
  Modul erscheint nie, auch wenn der User es „sichtbar" schaltet). **Gefixt:** der „Ansicht"-Reiter zeigte
  für nicht-gebuchte Module (`ai-sdr`/`hunter`/`farmer`) einen normal bedienbaren Toggle → jetzt **ausgegraut +
  Hinweis „Nicht in eurem Plan enthalten" + deaktivierter Toggle** (`AppearanceTab.isEntitled`). **Neue
  CLAUDE.md-Dauerregel „Nav-Sichtbarkeit = zwei Ebenen"** (analog Rechte-Check-Pflicht). 2 Entitlement-
  Regressionstests (Org ohne Farmer + User schaltet sichtbar → Farmer bleibt weg; nicht-gebuchtes Modul =
  disabled Toggle, kein Save). i18n de/en/es.

- **fix/feat:** SET-2 „Mein Profil"-Fixes (nach Live-Test, Migr. 074). **Bug:** Sidebar ignorierte die
  Ansicht-Prefs (hardcodierte Nav-Listen) → liest jetzt `getNavPreferences` mit gleichem Query-Key wie
  AppearanceTab, wendet `hidden`+`order` an → Ausblenden/Reihenfolge wirkt **sofort ohne Reload** (2 Regressionstests;
  Screens/Data-Mittel-Divider entfällt zugunsten der freien Reihenfolge). **Korrektur:** `booking_provider` auf
  E3-Kanon `calcom`|`external` (Migr. 074 `update_my_profile`-Whitelist + `settingsDefaults.BOOKING_PROVIDERS`);
  UI „Cal.com" / „Externer Link" mit freiem URL-Feld (beschreibender Platzhalter). **Ergänzungen:** Signatur
  8 Zeilen · Rolle-Anzeige verifiziert · **Statistik** (eigene Kontakte + deren Companies, neue Funktion
  `get_profile_stats`) · **„Dabei seit"** (users.created_at, `getMyProfile` um `created_at` erweitert). i18n
  de/en/es. Deferred dokumentiert: `[D-profile-signature-richtext]` · `[D-profile-avatar-upload]` ·
  `[D-profile-team-view]` · `[D-profile-usage-analytics]` (PROGRESS.md).

- **feat:** Settings SET-2 „Persönlich"-UI — Mein Profil · Ansicht · Sicherheit (an das fertige SET-2-Backend
  gebunden, echte Daten). **Zugang gebündelt hinter dem Avatar-Dropdown** (Route `/app/profil`, 3 interne
  Reiter via `PanelTabs`) — **nicht** in der Haupt-Settings-Nav (Bauplan-Struktur-Korrektur eingetragen).
  **Mein Profil:** Avatar (Anzeige) · Name · Rolle (read-only) · Sprache (`setLanguage` + Persistenz
  `user_preferences('ui.language')`) · Booking-Provider/Link · Signatur → `updateMyProfile`, Auto-Save je Karte;
  **keine** Personal-Voice-Karte (gehört in „Mein Unternehmen"). **Ansicht:** Nav ein-/ausblenden (shadcn `switch`)
  + Reihenfolge (Hoch/Runter-Pfeile) → `getNavPreferences`/`setNavPreferences`; „Einstellungen" fest/nicht
  ausblendbar. **Sicherheit:** Passwort ändern mit **Re-Auth-Verifikation** des aktuellen PW (`signInWithEmail`)
  → `updatePassword`; „Angemeldet über" read-only aus `getUserIdentities`. Neuer Baustein `SettingsCard`
  (Titel/Beschreibung/„Gespeichert ✓") + Hook `useSaveState` (echter Speicher-Zustand, kein Fake-Delay).
  Referenz-Export nur als Struktur-Vorlage (alle Mock-Daten/Hex/`<style>`/native Elemente ersetzt). shadcn
  `switch`+`textarea` ergänzt. i18n de/en/es (`personal.*`). Avatar-Dropdown „Mein Profil" verdrahtet
  (kein „wird gebaut" mehr). 11 Render-Tests. `typo-page-title`-Primitive.

- **feat:** Settings SET-2 — **nur Backend/Datengrundlage** (keine UI, Migr. 073). **Allgemein:** neue
  `settings.general` jsonb (Sprache/Zeitzone/Datumsformat/Währung, Defaults geseedet); Org-Name/Logo bleiben
  org-seitig (`organizations.name`/`branding.logo_url`). **Mein Profil:** neue `users`-Spalten `booking_provider`
  · `booking_link` · `signature` (Voice = deferred SET-KB-2). **Neues Recht `settings.manage`** (owner+admin) im
  SET-1-Katalog (Migr. 073 + TS-Spiegel `permissions.ts`). **Zentrale validierte Update-RPCs mit audit_log**
  (Falle 2, server-erzwungen): `update_general_settings` (Recht `settings.manage`, Key-Whitelist + Wert-Validierung)
  · `update_my_profile` (eigener Datensatz, Booking-URL/Längen-Validierung). **Merge-Lesen mit Defaults an EINER
  Stelle** (Falle 3): `src/lib/settingsDefaults.ts` (`mergeGeneral`/`mergeNav`) + db.ts `getGeneralSettings`/
  `getMyProfile`/`updateGeneralSettings`/`updateMyProfile`. **Ansicht** (Nav-Sichtbarkeit+Reihenfolge) über
  bestehendes `user_preferences` (057) — `getNavPreferences`/`setNavPreferences` (settings nie versteckt, kein
  Eintrag verloren; rein persönlicher UI-State, kein audit). **Sicherheit:** Passwort-Ändern via bestehendem
  `lib/auth.updatePassword`; SSO-Anzeige `getUserIdentities` (Lesefunktion). **Area 5 Rollen-Sichtbarkeit** baut
  direkt auf SET-1 auf: `src/lib/settingsNav.ts` (Gruppen→Sichtbarkeit `self`/`elevated`/Permission). 11 neue
  [AUTO]-Tests (Merge-Logik, Nav-Regeln, Sichtbarkeit, settings.manage). RPC-Validierung/audit → Live-Verify.

- **feat:** Login-Pflicht [D21] — Rest-Lücken geschlossen (kein Neubau; Auth war bereits voll gebaut).
  **Öffentliche-Routen-Architektur:** Catch-all `NotFoundRedirect` (unbekannt + nicht eingeloggt → Login `/`,
  nie blind `/app`); öffentliche Routen explizit VOR Catch-all; `/reset` neu, `/invite/:token` + `/unsubscribe`
  als öffentliche Platzhalter reserviert; **neue CLAUDE.md-Dauerregel „Öffentliche Routen".** `Protected`/
  `NotFoundRedirect` als eigene testbare Komponenten. **Passwort-Reset vervollständigt** (`/reset` = neues PW
  setzen, `updatePassword`; Reset-Mail führt jetzt dorthin). **Logout** im Avatar-Dropdown (Sidebar) — `signOut`
  war ungenutzt. **Dev-Bypass hinter Flag** (`isAuthDevBypass` = `import.meta.env.DEV` + `VITE_DEV_AUTH_BYPASS`),
  nie in Prod; ersetzt den impliziten „env-fehlt"-Bypass. **`useCurrentOrg` gehärtet:** `provisioningError`
  (eingeloggt ohne `users`-Row) → sichtbares `ProvisioningGate` statt stiller Demo-Org. **Invite-only (Migr. 072):**
  `handle_new_user` legt ohne gültige Einladung keine Org/Owner mehr an → „Zugang nur auf Einladung". **Redirect
  nach Login** (`state.from`, Deep-Link) + **differenzierte Fehler** (`authErrorKey`: falsches PW / Rate-Limit /
  Verbindung). i18n de/en/es. 12 neue [AUTO]-Tests (Protected/Catch-all/authErrorKey/provisioningError).
  Haken: MFA-Zwang → B-3 · Invite-Annahmeseite → [D29] · SET-2 „Mein Profil/Sicherheit" (greenfield).

- **feat:** Settings SET-1 — Rechte-Fundament (echter serverseitiger Wächter, Migr. 070/071).
  Zwei GLOBALE datengetriebene Katalog-Tabellen `permission_catalog` (**v1: 3 Rechte, nur heute-existierend**
  — `team.invite`/`records.delete`/`records.merge`; Zukunfts-Rechte kommen mit ihrem Modul, Registry in
  PROGRESS.md) + `role_permissions` (Rollen-Matrix owner=alles · admin=alles außer `billing.*` · member/viewer=∅) — beide in
  audit `GLOBAL_TABLES`. `user_permissions` (007) gehärtet: `effect`-Spalte (`grant`|`deny`, v1 nur grant —
  Tür offen für Subtraktion) + `UNIQUE(user_id, permission)` + Audit-Trigger. **Guard als Postgres-Funktionen**
  (security definer, `auth.uid()` als nicht-spoofbarer Actor, Org-Scope je Write): `has_permission`
  (deny > grant > Rolle) · `effective_permissions` (Caching, Org-/Actor-Check → kein Cross-Tenant-Leak) ·
  `grant_permission`/`revoke_permission` (Actor owner/admin, Cross-Org-Schutz, Admin-Hierarchie: kein
  `billing.*`, nicht an Owner/Admin) · `set_user_role` (nur Owner, Cross-Org-Schutz, **Letzter-Owner-Schutz**).
  **[D-delete-rights] geschlossen:** `soft_delete_contacts`/`_companies`/`_deals` server-erzwingen
  `records.delete` (RPC statt Direkt-Update in `db.ts`).
  **Projekt-weiter Rechte-Scan (Teil-D-Ergänzung):** heute-existierende Lücken erfasst → **`records.merge`**
  (Duplikat-Merge `mergeContacts`/`mergeCompanies` war ungeschützt → serverseitiges Vorab-Gate
  `assert_permission`) + **`soft_delete_deals`** (Deal-Löschen war ungeschützt). Wiederverwendbarer UI-Gate
  **`RequiresPermission`/`usePermission`** (shared) + **neue CLAUDE.md-Dauerregel „GLOBALE REGEL —
  Rechte-Check-Pflicht"** (analog Cron-Wrapper: neues Recht? UI-Gate? Server-Prüfung? — kein Merge ohne
  diese 3 Fragen; als Prüffrage 6 „vor jedem Commit"). Hook `useEffectivePermissions` (Caching,
  ein Aufruf/Session, **fail-safe Rollen-Fallback** wenn RPC (noch) nicht erreichbar).
  TS-Spiegel `src/lib/permissions.ts` (Katalog/Matrix/`effectivePermissions`, +Test). Verstreute
  Rollen-Checks abgelöst: `TeamSettings.canInvite` → `has('team.invite')`, `MfaBanner` → `isElevatedRole`,
  `updateUserRole` → `set_user_role`-RPC („serverseitig" jetzt wahr). Haken (NICHT jetzt): AI-Chat-Tool-Bindung ·
  Einzelrechte-/Papierkorb-UI (SET-3) · Nav-Rollen-Ausblendung (SET-2) · Rechte künftiger Module entstehen
  mit dem Modul (Katalog wächst mit, nie auf Vorrat).

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
