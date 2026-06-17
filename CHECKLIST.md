# Sales OS — Build Checklist

> Single Source of Truth für den Umsetzungsstand aller Anforderungen aus CLAUDE.md.
> CLAUDE.md = WARUM/WIE · diese Datei = WAS-noch-offen.
> Legende: `[ ]` offen · `[x]` erledigt · `[~]` teilweise
> Pflege: automatisch bei jeder relevanten Änderung (→ CLAUDE.md "Selbst-Wartung").
> Prüfen mit: `npm run audit`

---

## 🛠️ Selbst-Wartung (Tooling)
- [x] CHECKLIST.md als Single Source of Truth — *Umsetzungsstand zentral*
- [x] `scripts/audit.ts` + `npm run audit` — *prüft die 5 Pflicht-Prüffragen automatisch*
- [x] audit-Check „Design: nur Token-Farben" — *FAIL bei bg/text/border-white|black|gray-* oder Hex in .tsx*
- [x] **`npm run structure-check`** (`scripts/structure-check.sh`) — *FAIL bei falsch in shared/ platzierten Komponenten; im Pre-Push-Hook + Merge-Gate* — *2026-06-16*
- [x] **panel-block-Library konsolidiert** — alle Inhalts-Blöcke in `panel-blocks/` (+ Barrel `index.ts`); HunterSidepanel/ChatActionPanel komplett panel-block-basiert; tote Dateien/Orphans entfernt; shared/ bereinigt — *2026-06-16*
- [ ] audit.ts an Pre-Commit-Hook hängen — *kein Commit mit hartem Verstoß*
- [ ] audit.ts erweitern wenn neue Infrastruktur existiert (DB, lib/ai.ts …)

---

## 🎯 Hunter-Screen (Phase 2 — UI, Branch `feature/phase-2-hunter`)

### Erledigt
- [x] Design-Etappen 1–6: Header/Gradient · 673 Hex → Tokens · Emoji → Lucide · Avatare rund · i18n `hunter.*`
- [x] **`HunterCard`** (`src/components/shared/`) = eine Kachel für alle Tabs — *einheitliche Top-Row, Chevron-Kurzansicht, grüner Pfeil → Info-Panel*
- [x] **`componentBehavior.ts`** (`src/lib/`) = einzige Wertquelle (`CARD` + `ACTION_ROW`)
- [x] Alle Profilkarten auf HunterCard: Übersicht · Signals · Neu in Pipeline · Follow-ups · Pipeline-Task-Liste
- [x] Side Panels auf `ui/sheet`: SignalAction (580) · ContactCold · NoTask · PipelineStagnated
- [x] SignalActionDrawer props-driven (`initialDraft`) · Composer/Deal-Dropdown → `ui/select`
- [x] PipelineStagnatedDrawer Spec-Flow (Stage-Pills + 3 Buttons)
- [x] CLAUDE.md-Regel: Kacheln immer HunterCard · shadcn-Primitive bevorzugen
- [x] **Dark Mode app-weit token-sicher** — alle hardcodierten Farben → Tokens; shadcn-Farbnamen in `@theme inline` gemappt; Enforcement via Audit-Check + CLAUDE.md-Regel
- [x] **Komponenten-Struktur** eingeführt: `panels/` (InfoPanel 820 · ActionPanel 50vw) · `panel-blocks/` · `features/[modul]/` (CLAUDE.md-Pflichtregel) — *Session 2026-06-14*
- [x] **Side Panels als Basis-Komponenten** abstrahiert: `panels/InfoPanel` (820) + `panels/ActionPanel` (50vw, Sheet-Shell) — *2026-06-14*
- [x] **AddSdrLeadPanel** (Popup → Action-Side-Panel, Progressive Disclosure, Owner-Pflicht, Stage↔Deal-Kopplung; aus `panel-blocks/` komponiert) — *2026-06-14*
- [x] **Heat-Status neu** — Engaged/Warm/Cooling/Cold/Gone zentral in `lib/constants.ts` (`HEAT_STATUS`), Farb-Tokens Light+Dark, app-weit ersetzt, Dot-Kreis statt `●` — *2026-06-14*
- [x] **`HeatBadge` + `StageBadge`** (`panel-blocks/`) — kein Border, 10%-Hintergrund, Dot+Text; app-weit verdrahtet; Audit-Check „keine alten Heat-Labels"; CLAUDE.md Badge-Regel — *2026-06-14*
- [x] **Snooze** — Regelwerk in CLAUDE.md; 3 Zustände interaktiv in Follow-up-Kacheln (Mock); Settings-Sektion `SnoozeSettings` (Design) — *2026-06-14*
- [x] **Navigation zentralisiert** — `src/lib/navBehavior.ts` (`NAV`) für Top-Nav · Sub-Navs · Sidebar (einmal ändern → überall); Top-Nav `rounded-full`-Pills, +30px oben; CLAUDE.md-Regel + Radius-Hierarchie — *2026-06-14*
- [x] **Erledigt-Aktion** — zentrale `panel-blocks/ErledigtAction` (Popover + RadioGroup + Notiz), einmal in `ChatActionPanel` → alle Action-Panels; shadcn `radio-group` ergänzt — *2026-06-14*
- [x] **Popover-Fokus-Fix** — `ui/popover` `portal`-Prop; Eingaben in Popovern im Sheet tippbar (Kontaktfelder + Erledigt-Notiz); Audit-Check „Popover-Eingabe fokussierbar" + CLAUDE.md-Regel — *2026-06-14*
- [x] **AI-Chat Guardrails** — CLAUDE.md §9 (Secrets/Code/Tenant, Injection, PII) + Red-Team-Gate (`npm run redteam`, Phase 7) — *2026-06-14*
- [x] **knowledge_base** `value` = Kundennutzen/Pitch (Regel + Leitlinie + 5 Einträge umformuliert) — *2026-06-14*
- [x] **Vollansicht (Kontakt-Detail, Vollbild)** — `HunterSidepanel` `variant="full"`: echte Seite (ein Scroll-Container, native Scrollbar, sticky Tabs, Hero integriert), über ↗ im Info-Panel; ← zurück zum Panel, ✕ schließt (`onExit`) — *2026-06-15*
- [x] **Details-Tab (Vollansicht)** — alle CRM-Felder (Person/Firma/Klassifizierung/System/Notizen); Read-Mode + Inline-Edit (kein Popup) + Copy + System-Status als Badges; Kontaktdaten in grauer Sub-Kachel — *2026-06-15*
- [x] **Neue panel-blocks** — `DetailField` · `DetailSection` · `StatusBadge` · `DetailPhoneList` (global, prop-driven, Tokens-only) — *2026-06-15*
- [x] **Info-Panel-Tabs ausgebaut** — Kommunikation = vertikaler Zeitstrahl (medium-spezifisch) · Aktivität = System-Feed · Tasks (aufklappbar, Edit/Löschen on-hover, `TaskFormular`) · Notizen (Composer + Datum/Uhrzeit) · **neuer Deal-Tab** (`DealsListe`) — *2026-06-16*
- [x] **Footer-Quick-Actions verdrahtet** — Task/Mail/Deal/Notiz öffnen ihr Anlege-Panel (LinkedIn→Deal; Mail = `MailComposer`) — *2026-06-16*
- [x] **Deals: Deal-Name + Produktauswahl** (`DealDraft` + `name`/`product`; `NewDealCard` Dropdown `DEAL_PRODUCTS` + „Eigenes Produkt…"); Anzeige in DealsListe/DealSetup — *2026-06-16*
- [x] **Empty States für alle Hunter-Tabs** — Leads(+Button) · Signals · Follow-ups · Neu in Pipeline · leere Kanban-Spalte(+„Deal anlegen"); `shared/EmptyState` (description optional) — *2026-06-16*
- [x] **Globale Regel: Hover-Aktionen** (Edit/Löschen/Copy nur bei Hover — `HOVER_ACTIONS`) — *2026-06-16*
- [x] **Globale Regel: Icon-Tooltips** (`shared/TooltipLayer` + `data-tip`, portal/sofort) — *2026-06-16*
- [x] **Neue panel-blocks** — `TaskFormular` · `DealsListe` · `MailComposer` (+ `shared/TooltipLayer`); `npm run audit` um Inline-Code-Check erweitert — *2026-06-16*

### Offen (neu heute)
- [ ] **Vollansicht — vollseiten-spezifisches Layout/Spacing der Tabs** (Inhalte aufgewertet; nur Voll-Layout offen)
- [ ] AI-Chat **Red-Team-Gate** (`scripts/redteam-aichat.ts`, `npm run redteam`) bauen — Phase 7, vor Live

### Offen
- [ ] Skeleton/Loading — kommt mit DB-Wiring via TanStack Query
- [ ] Kanban-Mini-Karten angleichen (bauartbedingt separat)
- [ ] DB-Wiring: Mock → `getDeals`/`getSignals`/`getPipelineSettings`, Realtime, Routing → echtes ScreenHunting; Deal-Felder `name`/`product` + Produktkatalog aus `system_config`

---

## 🗄️ Datenbank (Phase 3 DB-Wiring — Migrationen live)

### Stand (Phase 1 + Phase 3) — Migrationen 001–016 remote applied ✅
- [x] `organizations` + Multi-Tenant-Basis, alle 33 Tabellen aus 001–012 remote live (Projekt `qhcmruprfjunalgrhgcp`) — *2026-06-16*
- [x] `organization_id NOT NULL` + RLS (`auth_org_id()`) + `ON DELETE CASCADE` + org-Index durchgängig (011) — *2026-06-16*
- [x] `update_updated_at()` + `audit_write()`-Trigger auf Kern-Entitäten (010) — *2026-06-16*
- [x] **`knowledge_base` (Migration 013)** — org_id NOT NULL + RLS + `audit_write`-Trigger; append-only — *2026-06-16*
- [x] **`deals.product` (Migration 014)** — nullable text, kein Default; Produkt-Katalog (`products`) folgt separat — *2026-06-16*
- [x] **`knowledge_base`-Schreibweg = Migrationen** (`015` Constraint+Leads-Eintrag · `016` 19 Backlog-Einträge); idempotent `ON CONFLICT DO UPDATE` — *2026-06-17*
- [x] **Hunter Pipeline-Tab auf echte `deals`** — `getDeals` (+`owner:users`-Embed) + `getPipelineSettings` via TanStack; Liste/Kanban/Filter (Heat/Owner/Stage), value Cent→/100 — *2026-06-17*
- [ ] knowledge_base-Eintrag je weiterem fertigem Feature (Migration 017+)

> Die folgenden Listen sind die vollständige Soll-Spezifikation (großteils Felder/Feature-Wiring, das schrittweise folgt).

### Multi-Tenancy & Isolation (zuerst, nicht verhandelbar)
- [ ] `organizations` Tabelle zuerst — *Basis für alles, brand_*/onboarding_* Felder*
- [ ] `organization_id NOT NULL` + `ON DELETE CASCADE` in JEDE Tabelle — *Mandanten-Isolation*
- [ ] RLS + `org_isolation` Policy auf jeder Tabelle — *kein Kunde sieht fremde Daten*
- [ ] `organization_id` als JWT Custom Claim — *Isolation auch im Token*
- [ ] Index auf `organization_id` in jeder Tabelle — *sonst Full-Scan bei jeder RLS-Query*
- [ ] Ownership-Felder überall: `created_by`, `assigned_to` — *Rollen/Verantwortung von Tag 1*

### Kern-Tabellen
- [ ] users, contacts, companies, deals, communications, tasks
- [ ] sequences, sequence_rules, contact_sequences, kurzakte_entries *(Append-Only)*
- [ ] signals — *inkl. `routed_to`/`routed_at`/`routing_reason` (Signal Routing)*
- [ ] user_modules, system_config, audit_log, ai_usage, error_log
- [ ] notifications, notification_preferences — *Notification-Infrastruktur*
- [ ] merge_candidates — *Duplikat-Entscheidung durch User*
- [ ] invitations, api_usage, data_deletion_requests — *SaaS/DSGVO*
- [ ] pipeline_stages *(in DB, nicht hardcoded)*, heat_status_config
- [ ] lists, list_contacts — *Listen (static|dynamic), JSONB-Filter*
- [ ] contacts: `contact_status`, `lead_source` (Pflicht), `opt_out`, `icp_score` (optional) — *Kontakte-Datenobjekt*
- [ ] users.role = `owner|admin|member|viewer` — *kanonisches Permission-Modell*
- [ ] audit_log Schema: action/object_type/object_id/old_value/new_value (read-only)
- [ ] automation_rules — *globaler Risk-Override pro Org (low/medium_risk_auto, medium_confidence)*
- [ ] deals: `company_id` NULL + `contact_id` NULL + CHECK (mind. eines gesetzt) — *Deal von Company ODER Person*
- [ ] Deals manuell anlegbar (Inline, Cmd+K, Drawer) via Edge Function — *Owner = Company/Person, audit_log*
- [ ] contacts CHECK: (`vorname` + `nachname`) ODER `linkedin_url` gesetzt — *Pflichtfeld-Minimum beim Anlegen*
- [ ] companies CHECK: `name NOT NULL` — *einziges Pflichtfeld*
- [ ] Company-Zuordnung: eine primäre Company + „ehemalig"-Archiv (nie löschen) — *Verlauf erhalten, kein Auto-Delete*

> Maßgebliche, feldgenaue Schema-Referenz: **`docs/sales_os_db_schema_v3.md`** (→ REFERENZ-DATEIEN).

### Kern-Tabellen — Felder & Tabellen aus Session Juni 2026
- [ ] contacts Zusatzfelder: `lead_status` (lead/qualified/mql/sql/customer/churned, ≠ contact_status) · `automation_override` · `primary_company_id` (Cluster-Vererbung)
- [ ] contacts Persönlichkeit: `personality_profile` (jsonb style/decision/tempo) · `personality_confidence` · `personality_sources` · `personality_updated_at`
- [ ] contacts Email-Verifizierung: `email_verified` · `email_verification_date/source/status` · `email_suggestion`
- [ ] deals: kanonische Default-Stages (frei konfigurierbar pro Org, nie hardcodiert) · `stage_updated_at` · `stagnation_days` · `end_date` · `lost_reason`
- [ ] companies: `subscription_plan/status/since` — *Subscription auf Company-Ebene (Cluster-Vererbung)*
- [ ] `mailboxes` — warmup_phase, current_daily_limit, bounce_rate, spam_rate, status
- [ ] `blacklisted_domains` — disposable/spam/catch-all/manual (Email-Verifizierung Ebene A)
- [ ] `churn_rules` + `upsell_rules` (v2 — jetzt anlegen, Feature später, additiv zu Basis-Signalen)
- [ ] `user_permissions` — individuelle additive Rechte-Überschreibung (nur Owner vergibt)
- [ ] `daily_briefings` — Mein Tag Top 5 (priorities jsonb, generated_at, user_id)
- [ ] `custom_dashboards` (v2/v3 — jetzt anlegen, Widget-Layout jsonb)
- [ ] `chat_sessions` + `chat_messages` (content jsonb = Block-Array, langfuse_trace_id) — *AI Chat*
- [ ] Billing-Tabellen: `plans`, `plan_limits`, `organization_subscription`, `credit_balance`, `credit_transactions`, `addons`
- [ ] `settings` JSONB: `modules`, `automation_defaults`, `thresholds` (churn_weights/upsell_weights/stagnation_days_per_stage/heat_status_days/trial/onboarding/meeting_prep), `sending_defaults`

### Pflichtfelder pro Tabellentyp
- [ ] Aktionen: `source`, `execution_mode`, `executed_by`, `approved_by`, `approved_at` — *AI-Automation*
- [ ] Sending: `sending_channel/provider`, `external_message_id`, `delivery_status`, `sent/delivered/read_at`
- [ ] Intent: `intent_detected`, `intent_confidence`, `requires_human`, `auto_reply_*`
- [ ] Inbox: `inbox_read/processed/processed_at/processed_by`
- [ ] CRM: `crm_provider`, `crm_external_id`, `crm_sync_status`, `crm_sync_error`
- [ ] Dynamic-Sequenz: `read_count`, `dynamic_adjustment`, `adjustment_reason`

### Triggers & Seed
- [ ] Triggers: Cluster-Vererbung, Audit Log, Heat-Timestamp, updated_at — *nichts vergessen*
- [ ] `system_config` Seed: alle `automation_*`, `sequence_dynamic_*`, `automation_risk_*`, `followup_auto_days`
- [ ] TypeScript Types generieren (`supabase gen types typescript`)
- [ ] Supabase Auth (Email + Passwort)

---

## ⚙️ Edge Functions (Business-Logic — nie im Frontend)

### Read/Query (MCP-ready)
- [ ] `get_contact_summary`, `get_pipeline_summary`, `get_churn_risks`, `get_signals_today`, `get_smart_list`, `execute_action`

### Sequenz Engine
- [ ] `process_new_lead()` — *Sequenz-Zuweisung + Signal-Routing + AI-Entwurf*
- [ ] `classify_intent()` — *Intent + Routing + Inbox + Kurzakte*
- [ ] `process_sequence_step()` — *execution_mode-abhängig senden/flaggen*
- [ ] Cron Job 07:00 — *fällige Schritte, Follow-ups, dynamische Regeln REGEL 1/2/3*
- [ ] Tages-Fortschritt als Supabase View — *kein Frontend-Calc*

### Scoring, Briefing & Verifizierung (Session Juni 2026)
- [ ] `score_heat_status()` (täglich) — *aus `last_contacted_at`; Tasks pausieren Heat nicht*
- [ ] `score_deal_health()` (täglich + bei Stage-Wechsel) — *Stagnation aus `stage_updated_at` vs. Schwellenwert*
- [ ] `score_churn_risk()` + `score_upsell()` — *Basis-Signale fix + Gewichtung (v1) + `churn_rules`/`upsell_rules` (v2); geben `main_drivers[]` zurück (Hover-Tooltip ohne extra Call)*
- [ ] `morning_briefing()` (07:00) — *Top-5-Auswahl nach Prio-Tabelle + Tiebreaker, nur aktive Module → `daily_briefings`*
- [ ] `analyze_personality()` — *ab ≥3 Nachrichten, nach jedem Reply; 3-Dimensionen + Confidence*
- [ ] `analyze_engagement()` — *erweiterte `sequence_rules`: Basis-Schicht immer, Sherloq-Schicht wenn Modul aktiv*
- [ ] Mailbox-Warmup-Cron — *Ramp-up 10→50/Tag, Bounce >3% Reset / >5% Pause+requires_human*
- [ ] `sequence_runner`: Follow-ups zuerst, dann Outreach (globales Einzel-Limit) · Smart Sending Window · Timezone → UTC · Inbox Rotation (Round Robin)

### Email-Verifizierung (lib/verification.ts — provider-agnostisch)
- [ ] `lib/verification.ts` einzige Datei die Provider (ZeroBounce) kennt — *austauschbar via `lib/providers/`*
- [ ] Ebene A (Syntax/MX/Blacklist/Catch-All, kostenlos) + Ebene B (ZeroBounce, wenn Modul aktiv)
- [ ] `verify_contact_email()` + Batch (CSV-Import, max 100 Req/s) — *Status-Mapping, bei invalid → requires_human*
- [ ] Harte Regel: nie an `email_verified = false` senden (außer manueller Override); Catch-All = senden + Warnung

### Lead Routing & Campaign-Matching (regelbasiert, kein AI)
- [ ] `route_sherloq_signal()` — *Sherloq-Lead anlegen → Matching anstoßen*
- [ ] `classify_sherloq_lead()` — *Einzel-Matching, Score-basiert*
- [ ] `classify_leads_batch()` — *Batch-Matching für CSV/CRM-Import*
- [ ] `isExcluded()` — *VOR jedem Match: opt_out/kunde/pipeline/archiviert/Domain-Block*
- [ ] Match-Score-Regeln + `campaign_match_min_score` (system_config, Default 3) — *nicht hardcoded*
- [ ] `campaigns.targeting` JSONB (job_titles/industries/company_sizes/regions/min_icp_score)
- [ ] contacts: `campaign_id`, `sherloq_signal_id`, `imported_at` — *Routing-Felder*
- [ ] Import-Flow: 3 Optionen, Default „Nur speichern" (kein Auto-Outreach)
- [ ] Sherloq-Fallback-Einstellung (Settings → AI SDR → Sherloq)

### Integrationen
- [ ] `webhook-booking` (Calendly/Cal.com normalisieren)
- [ ] `webhook-crm-sync` (HubSpot/Salesforce normalisieren + Konflikt-Logging)
- [ ] `webhook-stripe` (Plan/Module) *(SPÄTER)*

### Business-Logic-Regel
- [ ] Heat/Churn/ICP/Signal-Erkennung NUR in DB/Edge Functions — *nie im React-Code*

---

## 🖥️ Frontend

### Navigation & Agenten (fundamental — Code-Umbau offen)
- [ ] TopBar: 3er → **4 primäre** (`Mein Tag · AI SDR · Hunter · Farmer`) — *neue Agent-Architektur*
- [ ] Sekundäre Pills (Jira/Marketing/Sherloq System) abgesetzt
- [ ] `navConfig.tsx → roleAccess` an 4-Punkte-Struktur anpassen
- [ ] **AI SDR Screen** (NEU bauen): Sequenzen · Outreach · Posteingang · Termine
- [ ] **Hunter Screen** umbauen → Recommendation Feed (keine Sequenzen)
- [ ] **Farmer Screen** → Recommendation Feed (Bestandskunden)
- [ ] **Mein Tag** → aggregierter Feed (keine eigene Datenquelle)
- [ ] **Kontakte Screen** (NEU) — *zentrales Datenobjekt, eigener Sidebar-Icon*
- [ ] Kontakte-Listenansicht — Spalten: Checkbox · Avatar+Name+Jobtitel+Company · Lead-Source-Badge · Status-Badge · Letzter Kontakt · ICP-Ring · Routing-Hinweis (Lucide, kein Emoji)
- [ ] UI-Verhalten leere/System-Felder: "—" grau + Hover-Edit · Pflicht=amber Unterstreichung · System=grau readonly · inline-Edit, onBlur-Save, rotes Inline-Fehler-Feedback (Hex → index.css-Tokens mappen)
- [ ] Analytics kontextuell eingebettet — kein eigener Nav-Screen (AI SDR/Hunter/Farmer/Companies/Mein Tag inline · Settings→Reporting später)
- [ ] **Inbox** Screen + Sidebar-Icon (Tools-Bereich) + Badge
- [ ] **Sidebar finale Struktur** (max 9 Icons, Lucide): Screens · Kontakte · Tools · Settings/Profil
- [ ] Listen via Pill-Dropdown im Kontakte-Screen + Cmd+K (kein Nav-Punkt)
- [ ] Companies: nur im Drawer + Settings (Admin) + Cmd+K — kein Nav-Punkt
- [ ] Duplikat-Erkennung UI: Hard Match (Email/LinkedIn → blockiert) · Soft Match (Name+Company → Banner) · läuft bei Anlegen (onBlur), CSV-Import-Review, "Duplikate verwalten"-Ansicht
- [ ] Settings (Admin/Owner): Company-Verwaltung, Audit Log, Team, Webhooks, Automation Rules, Billing
- [ ] Destruktive Aktionen → Bestätigungs-Dialog (Kontakt/Liste/Campaign löschen, Opt-out, CRM-Overwrite)
- [x] Sliding-Pill-Animation in TopBar

#### Screens & Komponenten aus UI-Referenz (`docs/ui_interaktionen_v14_komplett.md` = maßgeblich)
- [ ] **Side Panels — zwei Typen:** Info Panel (820px, Tabs, schließt nur per X) · Action Panel (580px, einspaltig, schließt nach Aktion + Toast + Realtime) · 7 Action-Varianten
- [ ] **Task Modal** (560px) — KI-Vorschlag-Block nur mit Kontext, Kontakt readonly wenn aus Kontext, „Task gespeichert" Toast + Realtime
- [ ] Heat-Status Task-Hinweis in Kachel (3 Fälle: geplant/überfällig/keine) — Hunter/Follow-ups/Mein Tag Zone 2
- [ ] Pipeline-Stagnation Anzeige in Kachel (3 Fälle) + Mein-Tag-Prioritäten
- [ ] Churn/Upsell Hover-Tooltip (280px) aus `main_drivers[]` — aktive Signale ● + fehlende Daten ○ + Quelle
- [ ] Persönlichkeitsprofil-Anzeige (3 Pills, nur ab Confidence ≥60%) — Info Panel · AI SDR Header · Action Panel · Composer
- [ ] Email-Verifizierungs-Icons (verifiziert/unbekannt/invalid/catch-all) — Liste + Side Panel + Import-Summary
- [ ] Opt-out-Anzeige: roter Badge „Opt-out · [Datum]" + Block beim Hinzufügen
- [ ] Mein Tag Zonen 1–7 (Morgenanalyse-Banner, Termine, Top 5, Überfällig, Heute, Churn/Upsell/Jira)
- [ ] **Settings → Pipeline Stages** — Stages anlegen/umbenennen/sortieren/löschen + Schwellenwert pro Stage (Default deutsch, kanonisch)
- [ ] **Settings → Automation-Level** — global Manual/Semi/Auto pro Bereich (Default Semi) + Per-Kontakt-Override (`automation_override`)
- [ ] **Settings → AI SDR → Mailbox & Limits** — globaler Slider, „Follow-ups zuerst", Inbox Rotation, Warmup-Status, Tagesverbrauch
- [ ] **Integrationen → Email-Verifikation** — Provider-Auswahl (ZeroBounce/NeverBounce) + Credits

### Internationalisierung (i18n)
- [x] `i18next` + `react-i18next` installiert · Init nur in `src/lib/i18n.ts` (Default `de`, fallback `de`)
- [x] `src/locales/de.json · en.json · es.json` — *EN/ES zunächst DE-Kopie*
- [x] `useLanguage()` Hook + Sprachwechsel `setLanguage()` (persistiert in `localStorage`)
- [x] Sprachumschalter in Settings → Allgemein (DE/EN/ES)
- [x] TopBar Nav-Labels + Settings-Dialog über `t()` migriert
- [ ] **Alle übrigen Screens migrieren** → ScreenMyDay/Hunting/Farming/Marketing/Jira/Sherloq, CustomerDrawer, CommandPalette, Sidebar — *jeder hardcodierte UI-String → `t()`*
- [ ] EN/ES tatsächlich übersetzen (aktuell DE-Kopie)
- [ ] `audit.ts` erweitern: hardcodierte UI-Strings im JSX erkennen — *Regel automatisch prüfen*

### Daten-Layer
- [x] **Service-Abstraktion** `lib/db.ts · auth.ts · storage.ts · realtime.ts` — *einzige Swap-Stelle für Supabase*
- [x] App lädt Daten über `lib/db` (nicht direkt aus `@/data`/supabase) — *audit-geprüft*
- [x] audit-Regel: `@supabase` nur in `lib/`, `createClient` nur in `db.ts`
- [x] **Supabase-Client live** (`.env.local`, anon-Key) — `db.ts` Live-Modus, Test-User + Demo-Seed, RLS greift — *2026-06-16*
- [x] **Hunter Leads-Tab auf echte Queries** — `getContacts` (org-gescoped, Company-Embed FK-Hint) → `hunterMappers.contactRowToLead` → TanStack Query (Loading/Error); Heat + Lifecycle-Status + last_contacted echt — *2026-06-16*
- [x] **`useModules` → `getModules()` (`settings.modules`) via TanStack** statt nicht existenter `user_modules` (404 weg) — *2026-06-16*
- [~] TanStack Query als Server-State — *Leads-Tab + Module umgestellt; restliche Screens folgen*
- [ ] Restliche Mock-Listen (Pipeline/Signals/Info-Panel) durch echte Queries ersetzen
- [ ] Glocke: echter Badge-Count aus `notifications` (read=false), live via Realtime

### Realtime
- [ ] Supabase Realtime für 7 Tabellen aktivieren
- [ ] Subscriptions in Kacheln, Drawer, Mein Tag, Pipeline, Feed
- [ ] Max ~5 Channels, pro Listen-Ansicht, bei Unmount schließen

### Performance
- [ ] Query-Keys immer mit `organization_id` — *Cache-Isolation*
- [ ] staleTime nach Volatilität · Realtime invalidiert primär
- [ ] Keyset/Cursor-Pagination (nie OFFSET) — *bleibt bei 50k Zeilen schnell*
- [ ] Virtualisierung für Listen > 50 Zeilen (`@tanstack/react-virtual`)
- [ ] Code-Splitting pro Modul (`React.lazy`)
- [ ] Optimistic Updates bei reversiblen Mutationen

### Fehlerbehandlung (User-Sicht)
- [ ] 8s-Timeout (AbortController) auf jeder async-Operation — *Spinner hat immer ein Ende*
- [ ] 4-Stufen-Eskalation (optimistisch → auto-retry → manuell → offen markieren)
- [ ] Keine "Fehler"/"Error"-Wörter in UI — *Formulierungs-Tabelle befolgen*
- [ ] Fehlgeschlagenes = sichtbarer DB-Status (gelbes Badge), kein Spinner

### Design-Invarianten (laufend)
- [x] **Emoji in UI entfernt** — *ScreenFarming/Hunting/MyDay/Marketing/CustomerDrawer → Lucide-Icons (audit PASS)*
- [x] `ScreenPlaceholder` korrekt als Helper eingestuft (kein Render-Key → nicht in Registry; audit-Ausnahme)
- [ ] Jede neue interaktive Komponente → shadcn-Primitiv aus `ui/`
- [ ] Jede neue Komponente → sofort in `componentRegistry.ts`

### Dark Mode
- [x] Dark-Tokens in `[data-theme="dark"]` (index.css) — *@theme inline folgt automatisch*
- [x] `useTheme()` Hook (data-theme auf `<html>` + localStorage, modul-weiter Store)
- [x] FOUC-Guard in `index.html` (Theme vor erstem Paint)
- [x] Theme-Toggle (Sonne/Mond) im Profil/Avatar-Bereich der Sidebar
- [x] Alter `.dark-theme` !important-Hack aus App.tsx entfernt → Token-System
- [x] Strukturelle Flächen schalten korrekt (alle über Token-Klassen)
- [x] **Akzent-Hex/-Klassen → Signal-Tokens** app-weit (Hunter + ScreenMyDay/Farming/Marketing/
      Jira/CustomerDrawer): bg-white/gray/semantik/Hex → Tokens; `--on-accent`/`--inverse-surface`/`--scrim`
- [x] **shadcn-Farbnamen** (`background`/`card`/`popover`/`muted`/`accent`/`primary`/…) in `@theme inline` gemappt
- [x] **Enforcement**: Audit-Check „Design: nur Token-Farben" (FAIL bei Hardcode) + CLAUDE.md-Pflichtregel
- [ ] Tote Dateien mit Hex entfernen: `src/theme.ts`, `src/components/shell/TopNav.tsx` (nicht importiert)
- [ ] personalityColors Token in theme.ts umbenennen (kein DISG: rot/gelb/grün/blau → neutral benennen, passend zu 3-Dimensionen-Modell)

---

## 🔐 Security
- [ ] Kein API Key im Frontend — *ausnahmslos*
- [ ] Service Role Key nur in Edge Functions
- [ ] Alle Webhooks: `x-webhook-secret` / Signature-Validierung vor Verarbeitung
- [ ] Rate Limiting auf öffentlichen Endpunkten
- [ ] Audit Log: jeder Write schreibt nach `audit_log` (DB-Trigger, read-only)
- [ ] Permission-Check vor jedem Write — *RLS + Edge Function prüfen `role`*
- [ ] Opt-out: stoppt alle Sequences sofort, irreversibel, von niemandem überschreibbar — *höchste Priorität*
- [ ] Audit Log nur für Admin/Owner einsehbar (Settings)
- [ ] Vollständige Rechte-Matrix (owner/admin/member/viewer) durchsetzen — *RLS + Edge Function pro Aktion*
- [ ] `user_permissions`: additive Überschreibung (nur Owner vergibt, nie subtraktiv)
- [ ] DSGVO-Löschung: Opt-out → Suppression 90T → anonymisieren · Account-Kündigung 30T → komplett löschen · Export vor Löschung
- [ ] Fehler-Eskalation: AI 3× fail / Mailbox gesperrt → Owner+Admin via Email+In-App

---

## 💳 SaaS (vor Launch)
- [ ] Stripe Integration + `webhook-stripe` — *Plan/Module freischalten*
- [ ] Plan-Limit-Enforcement via `api_usage` (monatlich) — *kein harter Fehler bei Limit*
- [ ] Onboarding Wizard (5 Schritte)
- [ ] DSGVO Export (`export_organization_data`) + Löschungs-Flow
- [ ] Transactional Emails via `lib/email.ts` (Adapter)
- [ ] White-Label Theming (`brand_*` → CSS Variables zur Laufzeit)
- [ ] Subdomain (`slug`) / Custom Domain

---

## 🤖 AI Architektur
- [ ] `src/lib/ai.ts` — `aiCall()` Wrapper — *einziger AI-Eintrittspunkt*
- [ ] `aiCall()` loggt `ai_usage` + `api_usage` — *Kosten/Limits pro Org*
- [ ] `aiChat.ts` auf `aiCall()` migrieren *(audit WARN: nutzt SDK noch direkt)*
- [ ] Langfuse-Integration (ein-Datei-Change in `aiCall()`)
- [ ] `src/lib/notify.ts` — `notify()` + Event-Katalog — *einziger Notification-Eintrittspunkt*
- [ ] Signal Routing in `process_new_lead`/`classify_intent` — *kein Signal an zwei Orten*
- [ ] **Automation Risk-Level** (final): globaler Override Low/Medium/High über allen Campaigns
  - [ ] High Risk = immer `requires_human` (hardcoded false) — *Opt-out, Termin-Bestätigung, Löschen, CRM-Overwrite*
  - [ ] Medium Risk Auto nur bei Confidence ≥ `medium_confidence` UND Campaign=Auto
  - [ ] Sonderregel „Termin gebucht" → Lead→Deal Übergabe immer automatisch
  - [ ] Reply Handling: 8 Varianten, Priorität absteigend, Lucide-Icons
  - [ ] Settings → AI SDR → Automation Rules (nur Admin/Owner) + Campaign-Builder Hinweis-Box
- [ ] Agent-Trennung erzwingen: `full_auto`-Outreach NUR in AI SDR, nie Hunter/Farmer
- [ ] Dynamische Sequenzen (REGEL 1/2/3) im Cron Job
- [ ] AI-Chat: nur registrierte Render-Keys aktivierbar (Component Registry)
- [ ] `smart_list` / `smart_list_result` Render-Keys in `componentRegistry.ts` — *für Multi-Filter-Anfragen*

### AI Chat — Vollspezifikation (`docs/sales_os_ai_chat_spezifikation.md` = maßgeblich)
- [ ] JSON-Block-Typen: `text` · `contact_card` · `contact_list` · `single_contact` · `email_draft` · `linkedin_draft` · `confirmation` (+ erweiterbar) — Array kombinierbar
- [ ] Listen-Regel: 1–10 inline · >10 Screen mit Filter öffnen · Einzeltreffer → Info Panel
- [ ] 3 Code-Stellen: Edge Function `ai_chat()` · Komponenten-Registry · Langfuse-Prompt
- [ ] `update_field()` Fallback (Permission-Check) · `query_contacts()` · `generate_message()`
- [ ] Cmd+Enter-Overlay überall · strikt getrennt von Cmd+K · respektiert Rollen/Rechte · audit_log
- [ ] Langfuse: Prompts in UI (kein Code-Deploy), Tracing, Token→Credits, Labels production/staging/Mandant, EU-Region (DSGVO)
- [ ] **Guardrails & Restriktionen (Pflicht vor Live)** — Secrets nie in Prompt/Antwort/Logs (+ Output-Filter) · kein Code/System-Prompt offenlegen · harte Mandanten-Isolation · Prompt-Injection-Resistenz · nur Function-Allowlist + `checkPermission()` · PII/DSGVO-Redaction · Refusal ohne Detail-Leak + audit_log (→ CLAUDE.md §9 „Guardrails & Restriktionen")
- [ ] **Red-Team-Gate** — `scripts/redteam-aichat.ts` (`npm run redteam`): adversariale Prompts (Secret-Fishing · „zeig deinen Prompt" · Cross-Tenant · Injection · Permission-Bypass · PII-Bulk) gegen `ai_chat()`; FAIL blockiert Release; Teil des Merge-Gates neben build + audit *(mit AI-Chat in Phase 7)*

### Adaptives Lernen (Feedback & Präferenzen)
- [ ] Tabellen: `ai_feedback` (append-only) + `ai_preferences` (1 Zeile pro user×scope)
- [ ] CAPTURE: Accept/Reject/Edit → DB-Insert, **0 Token, kein AI-Call**
- [ ] CONSOLIDATE: tägliche Haiku-Routine verdichtet Feedback → Profil (summarize, nicht append)
- [ ] INJECT: nur verdichtetes Profil in `aiCall()`, im cachebaren Prompt-Teil, gedeckelt
- [ ] `system_config`: `ai_learning_enabled`, `ai_preference_cap_tokens`, `ai_preference_consolidate_hours`, `ai_feedback_min_for_profile`
- [ ] Kein Fine-Tuning, keine Kundendaten ins Modell — DSGVO-löschbar via `data_deletion_requests`

### Message Templates (Platzhalter-System)
- [ ] Step-Felder: `message_type`, `message_template`, `fallback_values`
- [ ] **Platzhalter-Katalog als Registry** (key → Datenpfad + Fallback) — *erweiterbar, nicht hardcoded*
- [ ] Edge Function `resolve_placeholders()` — *nie im Frontend auflösen*
- [ ] `preview-template` Endpoint (300ms Debounce, nie senden)
- [ ] Builder-Validierung (unbekannte Platzhalter → Warning, nicht blockierend)
- [ ] Escaping + Limits aus `system_config` (`template_max_length`, `message_max_length`, `placeholder_value_cap`)
- [ ] `fixed_template` vs `ai_generated` Logik (sich gegenseitig ausschließend)

### Token-Optimierung (von Tag 1, in aiCall() verankern)
- [ ] Kontext-Minimierung — *nur letzte 3 Touchpoints (summary), nie volle Historie*
- [ ] Token-Budget pro Call-Typ aus `system_config` (`ai_token_budget_*`) — *nie hardcodiert*
- [ ] Über Budget → summarize statt abschneiden — *Qualität erhalten*
- [ ] AI-Cache: kurzakte/company/icp/sequences (`ai_cache_ttl_*`), invalidieren via DB-Trigger
- [ ] Batching (`ai_batch_*`) für Intent Detection · ICP · Kurzakte — *1 Call statt 10*
- [ ] Fallbacks ohne AI — *Datum/Regel/Query: kein AI* (deckt sich mit Sequenz Engine)
- [ ] Prompt-Optimierung: Variablen in User-Prompt, stabiler System-Prompt — *Prompt-Caching*
- [ ] `api_usage` Logging: input/output_tokens, cost_usd, duration_ms pro Call
- [ ] `system_config` Seed: alle `ai_token_budget_*`, `ai_cache_ttl_*`, `ai_batch_*` Keys

---

## 🎨 Design
- [x] Design-Token-System in `index.css` (single source)
- [x] shadcn/ui Migration (Dialog, Sheet, Select, Tooltip, DropdownMenu)
- [x] `getHeatColor()` zentral in `heatUtils.ts`
- [x] Heat-/Status-Badges als Lucide-Icons (kein Emoji)
- [x] Restliche Emoji-Strings entfernt (🔥✨🚀⚠️✅⬆️ → Lucide) — *audit PASS*
- [ ] Inbox-Sortierung mit Lucide-Icons (kein Emoji) — *beim Inbox-Bau*

---

## 📚 Docs

### Struktur & Standard (erledigt)
- [x] `/docs` Grundstruktur angelegt (modules, api, decisions) — *Placeholder bereit*
- [x] Dokumentations-Standard in CLAUDE.md erweitert — *wann/was/Format, ADR, Setup, Runbook, OpenAPI, CONTRIBUTING*
- [x] 7 ADRs geschrieben (001 Supabase · 002 shadcn · 003 Edge Functions · 004 organization_id · 005 Sending Layer · 006 aiCall · 007 i18n)
- [x] `CHANGELOG.md` angelegt — *Eintrag nach jedem Commit*
- [x] `llms.txt` Placeholder im Root
- [x] **8 maßgebliche Referenzen** in `/docs` (UI v14 · DB v3 · Entscheidungen · CRM-Felder · Pricing · Edge Functions v2 · Sending Layer · AI-Chat) — *in CLAUDE.md unter „REFERENZ-DATEIEN" registriert; ältere Stände in `/docs/archiv`*
- [x] Pipeline-Stages vereinheitlicht: deutsche Liste kanonisch + frei konfigurierbar (CLAUDE.md + beide Referenz-Docs angeglichen)
- [ ] ADR 008 für Stage-Entscheidung (kanonisch + konfigurierbar) — *optional, Doku-Standard (007 = i18n)*

### Inhalt befüllen (nach den jeweiligen Phasen)
- [ ] Nach Phase 1: `setup.md`, `database.md`, `architecture.md` ausfüllen
- [ ] Nach Phase 2: `api/edge-functions.md`, `api/openapi.yaml`, `runbook.md`
- [ ] Pro fertigem Modul: `modules/[modul].md` (mein-tag, ai-sdr, hunter, farmer, sequenzen, inbox, cmd-k)
- [ ] Vor Launch: `CONTRIBUTING.md`, `README.md` finalisieren, `llms.txt` finalisieren
- [ ] Neue ADR bei jeder weiteren Architektur-Entscheidung (fortlaufend 008+)
