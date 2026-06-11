# Sales OS — Progress Tracker

> Update this file at the end of every session. Read it at the start.

---

## Current Status: Referenz-Dokumente konsolidiert + alle Konflikte aufgelöst ✅ → Phase 5 (Supabase) next

> Single Source of Truth für den Umsetzungsstand: **CHECKLIST.md** (`npm run audit` prüft).
> CLAUDE.md = WARUM/WIE · CHECKLIST.md = WAS-offen · PROGRESS.md = Session-Historie.

---

## Completed

### Session 10 — 2026-06-11 — Referenz-Dokumente + Konfliktauflösung (Doku)

Reine Doku/Referenz-Arbeit auf Branch `feature/i18n-architektur` (kein App-Code).

- [x] **8 maßgebliche Referenzen** nach `/docs` gelegt: `ui_interaktionen_v14_komplett.md`,
  `sales_os_db_schema_v3.md`, `entscheidungen_komplett.md`, `sales_os_crm_felder.md`,
  `sherloq_os_pricing_konzept.md`, `sales_os_edge_functions_v2.md`,
  `sales_os_sending_layer.md`, `sales_os_ai_chat_spezifikation.md`.
  Ältere Stände nach `/docs/archiv` (nicht gelöscht). In CLAUDE.md unter `REFERENZ-DATEIEN` registriert. (Commit `62d2895`)
- [x] **Neue Konflikt-Regel** in CLAUDE.md: eine kanonische Wahrheit pro Thema, neueste
  Entscheidung gewinnt, alle Dateien angleichen, gleicher Commit.
- [x] **Alle 15 Konflikte aufgelöst** (CLAUDE.md + /docs angeglichen, Commit `ed3c7f3`):
  Pipeline-Stages deutsch+Slug · Follow-up 3/7 Werktage · Churn zweischichtig ·
  `settings.pipeline_stages` top-level · `subscription_status` ohne „paused" ·
  Persönlichkeit 3 Dim statt DISG · Companies eigenes Sidebar-Icon · Sidebar max 8,
  kein Posteingang-Icon · Onboarding/Cluster-Vererbung/Listen-Rechte entschieden ·
  `ai_chat` in Pricing · `calculate_health_score()` erwähnt · Booking-Stage `demo_vereinbart`.
- [x] Frühere Doku-Aufgaben dieser Session: Session-Notizen Juni (Heat/Stagnation/
  Mailbox/Email-Verifizierung/Churn-Upsell/Mein-Tag/Rollen-Matrix/DSGVO/AI-Chat),
  Side Panels + Task Modal, Provider-Entscheidungen, MODUL-SYSTEM, Win-Probability,
  CHECKLIST.md nachgezogen.
- [x] **CLAUDE.md committet + zu GitHub gepusht** (Branch gepusht, trackt `origin`).

**Offen / getrackt:** `personalityColors`-Token in `theme.ts` umbenennen (CHECKLIST) ·
EN/ES übersetzen · restliche Screens auf `t()` migrieren · noch offene Entscheidungen
(#1 Heat-Schwellen, #5 Upsell-Trigger, #19 CRM-Sync, #34 Sherloq bidirektional,
#36b Video-Provider, #35 Hunter/Farmer-Prompts).

**Branch-Hinweis:** `feature/i18n-architektur` trägt inzwischen viel Doku-Arbeit;
beim finalen Merge ggf. umbenennen oder thematisch aufteilen.

---

### Session 9 — 2026-06-08 — i18n-Architektur + Kontakte/Companies-Doku

**i18n von Anfang an** (i18next + react-i18next), Branch `feature/i18n-architektur`:

- [x] `src/lib/i18n.ts` — einziger Init-Eintrittspunkt, Default+fallback `de`,
  Sprache persistiert in `localStorage` (`language`), Resources statisch gebündelt
- [x] `src/locales/de.json · en.json · es.json` — DE als Basis befüllt, EN/ES als DE-Kopie
- [x] `useLanguage()` Hook (Muster wie `useTheme`) + `setLanguage()` als einzige Wechsel-Stelle
- [x] Sprachumschalter in **Settings → Allgemein** (DE/EN/ES, segmentierte Buttons)
- [x] Erste Migration als Referenz-Pattern: TopBar Nav-Labels + Settings-Dialog → `t()`
- [x] `tsconfig.app.json`: `resolveJsonModule` ergänzt · **build + audit grün**
- [x] Verankert: CLAUDE.md (Tech Stack + Pflichtregel-Abschnitt), CHECKLIST.md, ADR 007

**Außerdem (vorherige Doku-Session):** CLAUDE.md + CHECKLIST.md um Kontakte/Companies
ergänzt (Pflichtfelder, Listenansicht-Spalten, UI-Verhalten leere/System-Felder,
Duplikat-Erkennung UI, Companies-Zuordnung, Analytics kontextuell eingebettet).

**Offen / getrackt:** restliche Screens migrieren (ScreenMyDay/Hunting/Farming/
Marketing/Jira/Sherloq, CustomerDrawer, CommandPalette, Sidebar → alle Strings `t()`) ·
EN/ES tatsächlich übersetzen · `audit.ts` um Hardcoded-String-Check erweitern.

**Git:** Branch angelegt, Commit/Push bewusst ans Session-Ende verschoben (auf Wunsch).

---

### Session 8 — 2026-06 — Erster echter Code seit Phase-Design: Dark Mode, Service-Layer, Git-Workflow

Erstmals wieder **Produkt-Code** statt nur Architektur-Doku:

- [x] **Dark Mode Basis-Architektur** — Dark-Tokens in `[data-theme="dark"]` (index.css),
  `useTheme()` Hook (localStorage + modul-weiter Store), FOUC-Guard in index.html,
  Sonne/Mond-Toggle im Sidebar-Profilbereich. `@theme inline` folgt automatisch.
  Alten `.dark-theme`-!important-Hack aus App.tsx entfernt.
- [x] **CustomerDrawer** — echter Slide-In/Out (rechts, eigene CSS-Keyframes ohne Plugin),
  Schließ-Animation gefixt (immer gemountet + gehaltene Inhaltskopie), Dark-Mode-Farben
  (CHURN-RISK-Gradient, Settings-Modal, ~13 hardcodierte Farben → Tokens).
- [x] **Service-Abstraktion** `lib/db.ts · auth.ts · storage.ts · realtime.ts` —
  einzige Supabase-Swap-Stelle, einziger Client-Init in db.ts, klar benannte Exports;
  App lädt Daten jetzt über `lib/db` statt direkt aus `@/data`. audit.ts erzwingt die Regel.
- [x] **Git-Workflow (hart)** — nie direkt auf `main`, Feature-Branch-Pflicht,
  PR + Squash-Merge, grün-gated (build + audit). In CLAUDE.md verankert, PR #1 gemergt.

**Offen / getrackt:** ~144 Akzent-Hex in Screens (Status-Badges, brechen Dark Mode
optisch nicht strukturell) · tote Dateien `theme.ts`/`shell/TopNav.tsx` löschen ·
`aiChat.ts` → `aiCall()` migrieren (Phase 5).

**Nächster echter Bau-Block:** Phase 5 — Supabase (Client in `lib/db.ts` aktivieren,
Schema, RLS, Auth). Die Service-Abstraktion ist bereit; nur Funktionskörper tauschen.

---

### Session 7 — 2026-06 — AI-SDR-Tiefe: Kontakte, Risk, Lernen, Routing

Reine CLAUDE.md/CHECKLIST-Architektur (kein Produkt-Code) — der AI-SDR-Bereich
ist jetzt durchdefiniert:

- [x] **Kontakte — zentrales Datenobjekt**: `contact_status`, `lead_source`, ICP optional, Listen, Companies verknüpft
- [x] **Admin-Regeln**: Rollen `owner|admin|member|viewer`, Audit-Log-Schema, Opt-out (irreversibel), destruktive Aktionen
- [x] **Finale Sidebar-Struktur**: max 9 Icons (Lucide), Screens · Kontakte · Tools · Settings
- [x] **Message Templates**: Platzhalter-Registry (erweiterbar), `resolve_placeholders()`, nie im Frontend
- [x] **Automation Risk-Level (final)**: globaler Override Low/Medium/High, High immer `requires_human`, `automation_rules` Tabelle, Reply-Handling-Varianten
- [x] **Adaptives Lernen**: Feedback/Präferenzen pro User × Bereich, kein Fine-Tuning, token-effizient (capture 0 / consolidate 1×Tag / inject ~100T), `ai_feedback` + `ai_preferences`
- [x] **Lead Routing & Campaign-Matching**: regelbasiert (kein AI), `classify_sherloq_lead/classify_leads_batch/isExcluded`, Import-Flow (Default „Nur speichern"), Sherloq-Fallback

**Bereinigt/zurückgesetzt:** „Automation Risk-Level — Vorbereitung" (Platzhalter) →
durch finale Version ersetzt. ICP-Gate aus Sequenz Engine entfernt (nur noch Verstärker).
Rollen vereinheitlicht. — Eine zwischenzeitliche Reaktivierung/Sherloq-Routing-Datei
wurde auf Wunsch wieder zurückgesetzt (kommt später in überarbeiteter Form).

**Offen zum Nachreichen** (vom User): `cmdk_update.md`, `entscheidungen_v4.md`,
`ui_interaktionen_v6.md`, überarbeitete Reaktivierung/Sherloq-Datei.

---

### Session 6 — 2026-06 — Architektur-Vertiefung, Selbst-Wartung, Doku-Fundament

#### Architektur-Regeln in CLAUDE.md (Phase-5-Bauplan, noch nicht implementiert)
- [x] **Agent-Architektur**: AI SDR (Execution) · Hunter/Farmer (Recommendation) — fundamentale Trennung
- [x] **Navigation neu**: 4 primäre Punkte (Mein Tag · AI SDR · Hunter · Farmer), Signal Routing, Risk-Level-Vorbereitung
- [x] **AI SDR Automation**: Sending Layer, Intent Detection, Eskalation
- [x] **Sequenz Engine**: process_new_lead/classify_intent/process_sequence_step, Cron Job, dynamische Sequenzen
- [x] **SaaS-Readiness**: organization_id Pflichtfeld, RLS, invitations, api_usage, Billing/Stripe, DSGVO
- [x] **Modularer Aufbau**: user_modules, useModules(), Modul-Gating
- [x] **AI Call Abstraktion**: aiCall() Wrapper, Langfuse-Vorbereitung, Modell-Wahl
- [x] **Notifications**: notifications/notification_preferences, Event-Katalog, notify()
- [x] **Datenqualität & Duplikate**: Ingestion-Validierung, Fuzzy-Match (GmbH/AG-Normalisierung), User-Entscheidung
- [x] **Performance**: TanStack Query, Keyset-Pagination, Virtualisierung, Realtime-Bounds
- [x] **Fehlerbehandlung User-Sicht**: 8s-Timeout, 4-Stufen-Eskalation, keine "Fehler"-Wörter
- [x] **CRM Sync & Kalender**: provider-agnostisch, Booking-Flow

#### Selbst-Wartung & Tooling
- [x] Selbst-Wartung Pflichtregeln als erste CLAUDE.md-Sektion → danach verschlankt (Session Start/Während/Ende/Anfrage)
- [x] `CHECKLIST.md` als Single Source of Truth (Gruppierung: DB · Edge Functions · Frontend · Security · SaaS · AI · Design)
- [x] `scripts/audit.ts` + `npm run audit` — prüft die Pflicht-Prüffragen (Node 24, keine Deps)
- [x] audit deckte real auf: aiChat.ts nutzt SDK direkt (WARN, für Phase 5), ScreenPlaceholder als Helper eingestuft

#### Cleanup (Code)
- [x] Emoji aus UI entfernt (ScreenFarming/Hunting/CustomerDrawer) → Lucide-Icons — audit PASS
- [x] Sliding-Pill-Animation in TopBar

#### Dokumentations-Fundament
- [x] Dokumentations-Standard in CLAUDE.md erweitert (Stripe/Linear/Vercel-Niveau)
- [x] `/docs` Struktur angelegt (modules · api · decisions) mit Placeholdern
- [x] **6 ADRs mit echtem Inhalt**: Supabase, shadcn, Edge Functions, organization_id, Sending Layer, aiCall
- [x] `CHANGELOG.md` + `llms.txt` angelegt

**Wichtig:** Alles oben ist **Architektur-Dokumentation + Doku-Fundament**, kein
neuer Produkt-Code. Nächster echter Bau-Block = Phase 5 (Supabase).

---

## Completed (frühere Sessions)

### Session 1 — 2026-05-24
- [x] Node.js v24.16.0 installed via nvm
- [x] Vite + React + TypeScript project scaffolded
- [x] Mantine v8 installiert und konfiguriert
- [x] `AppShell` mit navbar, header, dark/light mode
- [x] `vercel.json` erstellt (Vite build config + SPA rewrites)
- [x] GitHub repo erstellt: `pandapau-ship-it/sales-os` (public)
- [x] `CLAUDE.md` + `PROGRESS.md` erstellt

### Session 2 — 2026-05-25 — Hyper-Modern Floating UI
- [x] Komplettes Navigation-Redesign: Pill-TopBar + Icon-Sidebar
- [x] Gradient Active States: `linear-gradient(135deg, #175253, #3f8383)`
- [x] `CLAUDE.md` — "Design Vision Hyper-Modern Floating UI" permanent festgeschrieben

### Session 3 — 2026-05-26 — Realtime & Framework Switch
- [x] `CLAUDE.md` — "Realtime Events & Webhooks" Sektion (8 Webhook-Endpunkte, Supabase Subscriptions, Offline Handling)
- [x] Mantine vollständig entfernt → shadcn/ui + Tailwind CSS v4
- [x] `src/lib/utils.ts` — `cn()` Helper (clsx + tailwind-merge)
- [x] `components.json` — shadcn Konfiguration
- [x] `vite.config.ts` — `@` Alias → `src/`
- [x] `tsconfig.app.json` — Paths-Mapping, verbatimModuleSyntax

### Session 4 — 2026-05-28 — ZIP-Migration (Design Token System + Ordnerstruktur)

#### Schritt 2 — Design Tokens (src/index.css) ✅
- [x] Komplettes CSS-Token-System:
  - Brand: `--sherloq-primary`, `--sherloq-gradient`, `--sherloq-light`
  - Surfaces: `--app-bg`, `--surface`, `--surface-secondary`
  - Text: `--text-primary`, `--text-body`, `--text-muted`
  - Borders, Radien, Shadows, Signal Colors (urgent/warn/success/info/cold/teal)
- [x] `@theme inline` Block → Tailwind-Utility-Klassen (`bg-sherloq-primary`, `shadow-card` etc.)
- [x] Globale Utility-Klassen: `.sherloq-card`, `.sherloq-pill`, `.sherloq-btn-primary`, `.sherloq-btn-secondary`, `.pill-urgent` etc.

#### Schritt 3 — Tailwind v4 ✅
- `tailwind.config.ts` entfällt in v4 → `@theme inline` in CSS erledigt dasselbe nativ

#### Schritt 4 — Ordnerstruktur + Datenmigration ✅
- [x] `src/types.ts` → Referenz-Version (HeatStatus: HOT/WARM/LUKEWARM/COLD/DEAD, vollständige Interfaces)
- [x] `src/data.ts` → Referenz-Version (INITIAL_LEADS, INITIAL_CUSTOMERS, INITIAL_TASKS, alle 8 Exports)
- [x] Neue Ordnerstruktur: `ui/`, `screens/`, `layout/`, `shared/`
- [x] Alle Import-Pfade angepasst, `import type` für alle Type-Only-Imports

#### Schritt 5 — TopBar + App.tsx ✅
- [x] 56px sticky TopBar, absolut zentrierte Nav, ⌘K Pill, Avatar
- [x] App.tsx: vollständige State-Verwaltung, CustomerDrawer, CommandPalette

#### Schritt 6 — Token-Migration aller Komponenten ✅
- [x] Alle hardcodierten Hex-Werte → Design Tokens
- [x] TypeScript: 0 Errors ✓

---

### Session 5 — 2026-06 — Design Cleanup, shadcn/ui Migration, Architecture Docs

#### Design Konsistenz ✅
- [x] Nav-Radius-Inkonsistenz behoben: TopBar 14px + Sub-Nav pill → überall `rounded-[12px]`/`rounded-[9px]`
- [x] Alle Borders normiert (Top-Nav kein Border, Cards ja — in CLAUDE.md als Invariant)
- [x] Sidebar bereinigt: `rounded-[16px]`, `shadow-card`, kein duplizierter Search/Avatar
- [x] Sliding Pill Animation in TopNav (`useRef`-basiertes Slider-Element)

#### Vollständige Farb-Zentralisierung ✅
- [x] `src/lib/heatUtils.ts` — neue Shared-Utility, `getHeatColor()` einmalig definiert
- [x] Alle 48× hardcodierten `#ADB5BD` → `var(--icon-muted)` Token
- [x] Neue Tokens in `index.css`: `--signal-warm-bg/text`, `--sherloq-dark`, `--border-subtle`,
  `--icon-muted`, `--selection-bg`, `--accent-teal`, Personality Colors, Channel Colors, ICP Colors
- [x] `ChannelIcon.tsx`, `EngagementChain.tsx` — channel keys uppercase (EMAIL/PHONE/MEETING etc.)
- [x] `HeatDot.tsx` — keys auf HOT/WARM/LUKEWARM/COLD/DEAD korrigiert
- [x] `PersonalityBadge.tsx` — `PersonalityType` lokal definiert (nicht in types.ts)
- [x] Heat-Badge Pattern: CSS `●` Dot statt Emoji, `getHeatColor()` überall
- [x] Status-Badges in ScreenFarming: Emoji-Icons (✅✖️🆕⌛) → Lucide (`CheckCircle2`, `XCircle`, `Zap`, `Clock`)

#### shadcn/ui Migration ✅
- [x] `@radix-ui/react-select` + `@radix-ui/react-dropdown-menu` installiert
- [x] `src/components/ui/select.tsx` — neues shadcn Select (Design Tokens angepasst)
- [x] `src/components/ui/dropdown-menu.tsx` — neues shadcn DropdownMenu
- [x] `src/components/ui/sheet.tsx` — Overlay angepasst, `drawer`-Variante hinzugefügt
- [x] `src/components/ui/dialog.tsx` — Overlay + Content auf Design Tokens
- [x] `src/components/ui/tooltip.tsx` — auf Design Tokens angepasst
- [x] `CustomerDrawer` → `<Sheet side="drawer">` migriert (Radix: Overlay, Escape, Focus-Trap)
- [x] Quick Lead Modal in ScreenHunting → `<Dialog>` migriert
- [x] Sidebar Tooltips → shadcn `<Tooltip>` migriert
- [x] Heat-Level `<select>` → shadcn `<Select>` mit farbigen CSS-Dots

#### Build-Fixes (Vercel) ✅
- [x] Alle TS6133/TS6196/TS2305/TS2339/TS2561 Fehler behoben
- [x] Alle ungenutzten `import React` entfernt (React 19 JSX Transform)
- [x] Alle ungenutzten Icon-Imports entfernt
- [x] Tote `getChannelIcon()` Funktionen in ScreenHunting + ScreenFarming entfernt
- [x] Build: 0 Fehler, 1833 Module ✓

#### CLAUDE.md Architecture Docs ✅
- [x] Session Protocol + Pflicht-Prüffrage (shadcn vor jeder interaktiven Komponente)
- [x] Design Invariants: Radius-Hierarchie, Border-Hierarchie, Heat-Badge Muster, Nav-Muster, Badge/Icon-Regel (nie Emoji)
- [x] AI SDR Automation: Sending Layer, Intent Detection, Eskalation
- [x] Modularer Aufbau: `user_modules` Tabelle, `useModules()` Hook, Modul-Abhängigkeiten
- [x] CRM Sync & Kalender-Integration: provider-agnostisch, Booking-Flow, Webhooks
- [x] Granulare Automation-Settings: 15 `system_config` Keys pro Funktion (AI SDR / Hunting / Farming)
- [x] AI Call Abstraktion: `aiCall()` Wrapper, Langfuse-Vorbereitung, Modell-Wahl-Tabelle
- [x] Sequenz Engine: Algorithmus vs AI Trennung, `sequence_rules` Schema, 3 Edge Functions, Cron Job

---

## Nächste Schritte — Phase 5: Supabase Setup

### Priorität 1 — Datenbank
- [ ] Supabase Projekt erstellen
- [ ] Schema SQL ausführen (alle Tabellen: workspaces, users, contacts, companies, pipeline_deals, communications, tasks, sequences, sequence_rules, kurzakte_entries, user_modules, ai_usage, system_config, audit_log)
- [ ] RLS Policies einrichten (`assigned_to = auth.uid()` + `workspace_id`)
- [ ] Supabase Auth konfigurieren (Email + Passwort)
- [ ] `system_config` Seed-Daten (alle automation_* Keys, heat_status_config, followup_auto_days)
- [ ] TypeScript Types generieren: `supabase gen types typescript`

### Priorität 2 — Frontend verbinden
- [ ] Supabase Client (`src/lib/supabase.ts`)
- [ ] `src/lib/ai.ts` — `aiCall()` Wrapper implementieren
- [ ] Mock-Daten (`data.ts`) durch echte Supabase-Queries ersetzen
- [ ] `useModules()` Hook implementieren

### Priorität 3 — Realtime & Webhooks
- [ ] 8 Webhook-Endpunkte als Vercel API Routes
- [ ] Supabase Realtime für alle relevanten Tabellen aktivieren
- [ ] Frontend Subscriptions in Kacheln, Drawer, Mein Tag

### Später
- [ ] Sequenz Engine: `process_new_lead`, `classify_intent`, `process_sequence_step` Edge Functions
- [ ] Langfuse Integration (in `aiCall()` — ein-Datei-Change)
- [ ] CRM Sync (HubSpot / Salesforce)
- [ ] Kalender-Integration (Calendly / Cal.com)
- [ ] `/docs/` Ordner — nach Design-Finalisierung

---

## Tech Stack (aktuell)
- React 19 + Vite + TypeScript (strict)
- Tailwind CSS v4 (`@tailwindcss/vite`, kein `tailwind.config.ts`)
- shadcn/ui — alle interaktiven Komponenten (Dialog, Sheet, Select, Tooltip, DropdownMenu)
- Design Tokens: `src/index.css` CSS Variables + `@theme inline`
- `@` Alias → `src/`
- Vercel: Auto-Deploy auf Push zu `main`

## Design System — aktive Regeln
- **Niemals Hex-Werte direkt** — immer CSS Variables oder Tailwind-Tokens
- **Niemals Emoji in Badges** — immer Lucide-Icons
- **Niemals interaktive Komponente selbst bauen** — shadcn Primitiv aus `src/components/ui/`
- Radius-Hierarchie: Drawer 16px · Cards 12px · Buttons 10px · Badges 7px
- `getHeatColor()` aus `src/lib/heatUtils.ts` — nie duplizieren
- `cn()` aus `src/lib/utils.ts` für alle Klassen-Kombinationen

## GitHub
- Repo: `pandapau-ship-it/sales-os`
- Branch: `main`
- Vercel: Auto-Deploy aktiv
