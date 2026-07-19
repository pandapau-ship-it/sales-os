# Sales OS — Build Checklist

> Single Source of Truth für den Umsetzungsstand aller Anforderungen aus CLAUDE.md.
> CLAUDE.md = WARUM/WIE · diese Datei = WAS-noch-offen.
> Legende: `[ ]` offen · `[x]` erledigt · `[~]` teilweise
> Pflege: automatisch bei jeder relevanten Änderung (→ CLAUDE.md "Selbst-Wartung").
> Prüfen mit: `npm run audit`

---

## 🚦 Modul-Abschluss-Gate (PFLICHT — bei JEDEM abgeschlossenen Modul durchgehen)

> Wiederkehrendes Gate, analog zum Code-Review. **Bevor ein Modul als „fertig" gilt**, die vier Prinzipien
> als Tabelle pro Modul prüfen (bestanden / offen als Deferred) und das Ergebnis **im Übergabe-Protokoll
> vermerken**. Verankert in CLAUDE.md ([D51] · Honesty · Single Source · Design-Invarianten).

- [ ] **(1) SINGLE SOURCE OF TRUTH** — keine duplizierte Logik/Konstante/Komponente; geteilte Resolver/
  Query-Keys/Komponenten konsistent genutzt (EIN Mapper/Resolver, EIN Query-Key-Cache, EINE Konstanten-Quelle;
  Frontend↔Edge spiegeln denselben Enum statt Doppel-Literal).
- [ ] **(2) PERFORMANCE (Weltklasse-Standard)** — keine N+1-Queries (kein `useQuery` in `.map`), geteilte
  Caches (gleiche Query-Keys), Skeletons/Prefetch/`placeholderData` wo sinnvoll, kein `SELECT *` ohne Grund,
  keine unnötigen Re-Reads/Doppel-Fetches.
- [ ] **(3) KONFIGURIERBARKEIT [[D51]]** — jeder verhaltenssteuernde Wert UND jede Regel (Schwellen/Gewichte/
  Zeitfenster/Vorrang-Regeln/Mail-/AI-Vorlagen/Prompts/Workflow-Konfig) liegt in der DB, pro Org, laufzeit-
  gelesen, AI-Chat-änderbar [[D5]]. **KEIN** verhaltenssteuerndes Code-Literal (A), **kein** stummer Fallback-
  Degrade (Fallback laut scheitern/warnen). *Maßstab: ein User muss später per Chat sagen können „die Mails in
  diesem Workflow sind schlecht, ändere sie so-und-so" → greift genau für diesen Flow.* Pro Modul Tabelle:
  Regel \| Speicherort \| A/B/C \| laufzeit-gelesen? (System-Enums wie Won/Lost-Slugs sind bewusst KEIN
  Config — dokumentieren statt konfigurierbar machen.)
- [ ] **(4) HONESTY** — kein erfundener Wert; fehlend → „Folgt"/ausgeblendet; leer = ehrlicher Positivzustand
  (echte EmptyStates, keine Fake-Zeilen/-Zahlen).

> **Gate-Läufe (je Modul, Ergebnis):**
> - **Farmer (30.06.2026): BESTANDEN** ✅ (1)+(2)+(3)+(4) — Details + Deferred siehe `docs/session_uebergabe_2026-06-30.md`.
> - **Hunter (Konfig-Scope, 30.06.2026): BESTANDEN** ✅ (1)+(2)+(3 für auditierte Werte)+(4) — Deferred (ICP-Berechnung/-Bänder, Signal-Routing-Regel/Resolver-Konfig, Deal-Health-Kompositum, AI-SDR-Gating) siehe Übergabe.
> - **core_crm — Kontakte & Companies (Kern-Arc K-1…K-6, 18.07.2026): BESTANDEN** ✅ (1)+(2)+(3 für auditierte Werte)+(4) — Details `docs/session_uebergabe_2026-07-18.md`.
>   - **(1) Single Source ✅** — `contactToProfile`/`contactActiveStage` (Kontakt-Anzeigewerte, audit-erzwungen) · `contactDetailFields`/`DETAIL_MAP` (Details-Tab, Hunter+Farmer) · geteilte `DataTable` (Kontakte+Companies) · `lib/merge.ts` + `classifyDuplicate` (Merge/Dedup, von UI+Import genutzt) · `lib/filter` (EINE Filter-Sprache: Liste+dynamische Listen+Lifecycle) · `createContact` (Import ruft dieselbe Funktion, keine Insert-Kopie).
>   - **(2) Performance ✅** — audit „N+1" PASS (kein `useQuery` in `.map`); geteilte Query-Keys; `staleTime` gesetzt; `DataTable` virtualisiert; Prefetch-on-hover + `PanelSkeleton`/`placeholderData`; `loadDedupUniverse`/`getDuplicatePairs` = EINE Query (kein N+1). *Scale-Deferred:* Paar-Findung ist client-seitig (bucketed) — bei sehr großen Orgs später server-seitige Dedup-Query.
>   - **(3) Konfigurierbarkeit [[D51]] — für auditierte Werte ✅** — Pipeline-Stages = `settings.pipeline_stages` (C) · `campaign_match_min_score` = `system_config` (C) · **System-Enums bewusst KEIN Config** (`contact_status`/Won-Lost-Slugs — dokumentierte Invarianten). **Deferred (benannt):** Import-Undo-Fenster (`+7 Tage`, Literal in `db.ts`) und Dedup-Fuzzy-Schwellen (`NAME_COMPANY_MATCH_MIN 0.82` / `COMPANY_NAME_MATCH_MIN 0.85`, Konstanten in `dedup.ts`, B) → später nach `settings` (Code-Kommentar vermerkt es bereits).
>   - **(4) Honesty ✅** — vollständige Fake-Wert-Inventur (18.07.) → Real-Kontakt-Panels fake-frei; echte EmptyStates (leere Duplikat-/Listen-/Import-Zustände = positiver Zustand); Import-Undo-Ergebnis transformiert sich ehrlich (keine falsche „NEU ERSTELLT"-Stat).
>   - **Offene Folge-Slices (kein Kern-Blocker, tracked):** merge_candidates-Persistenz („Kein Duplikat") · onBlur-Hard/Soft-Match beim Anlegen + CSV-Review-Dedup-Spalte · **K-FS1** (Hunter-Dedup-Umbau — gehört zum Hunter-Modul, nicht zu core_crm) · Import-Vorlagen-Erkennung · [D-company-import].

---

## 🛠️ Selbst-Wartung (Tooling)
- [x] CHECKLIST.md als Single Source of Truth — *Umsetzungsstand zentral*
- [x] `scripts/audit.ts` + `npm run audit` — *prüft die 5 Pflicht-Prüffragen automatisch*
- [x] audit-Check „Design: nur Token-Farben" — *FAIL bei bg/text/border-white|black|gray-* oder Hex in .tsx*
- [x] audit-Check „Elevation: keine rohen Shadow-Stufen" — *FAIL bei shadow-sm/md/lg/xl/2xl + hardcodierten shadow-[0…] in Karten/Boxen (panel-blocks/features/farming); nur Token-Schatten* — *2026-06-24*
- [x] audit-Check „Elevation: Border ≠ Hintergrundfarbe" — *FAIL bei border-[var(--signal-*-bg)] = bg (unsichtbar); Karten/Boxen nutzen border-[var(--border-card)]* — *2026-06-24*
- [x] audit-Check „Radius: keine benannten Tailwind-Radien" — *FAIL bei rounded-sm/md/lg/xl/2xl/3xl/none (+ Richtungs-Varianten); nur explizite px aus der Hierarchie (16/12/10/8/7/6/5) + full/pill* — *2026-06-24*
- [x] **`npm run structure-check`** (`scripts/structure-check.sh`) — *FAIL bei falsch in shared/ platzierten Komponenten; im Pre-Push-Hook + Merge-Gate* — *2026-06-16*
- [x] **panel-block-Library konsolidiert** — alle Inhalts-Blöcke in `panel-blocks/` (+ Barrel `index.ts`); HunterSidepanel/ChatActionPanel komplett panel-block-basiert; tote Dateien/Orphans entfernt; shared/ bereinigt — *2026-06-16*
- [x] **Single-Source-Audit + pre-push-Kopplung** — `checkSingleSourceContactValues()` (Kontaktwerte nur über `contactToProfile`/`contactActiveStage`; FAIL `.heat_status`, WARN icp/company/name, Resolver-Marker + `// single-source-ok`-Opt-out); **`npm run audit` jetzt im pre-push-Hook** (blockt FAIL hart); CLAUDE.md-Regel „Gleiche Ausgabe = gleiche Quelle" — *2026-06-18*
- [ ] **[KONFIG-AUDIT] Konfigurierbarkeits-Audit (wiederkehrendes MODUL-ABSCHLUSS-Gate, analog Abschluss-Audit)** — *[[D51]] „Logik-als-Daten"-Gebot: jeder verhaltenssteuernde Wert UND jede Regel (Schwellen/Gewichte/Zeitfenster/Cutoffs/Prioritäten/Vorrang-Regeln/Mail-/AI-Vorlagen/Prompts/Gating) ist **Kategorie C** (DB `settings`/Pro-Entität-Tabelle, pro Org, laufzeit-gelesen, chat-änderbar), **KEIN A** (Code-Literal), **KEIN stummer B-Degrade** (Fallback muss laut scheitern/warnen, nie still den Org-Wert überschreiben). Pro Modul am Ende eine Tabelle: Regel \| Speicherort \| A/B/C \| laufzeit-gelesen? — gilt Farmer/Hunter/AI-SDR/Mein Tag/Settings/künftige Module. (Diagnose 30.06.2026: Farmer-Schwellen/-Gewichte/Heat-Grenzen = C ✅; offene A-Verstöße: churn/upsell Tages-Cutoffs 30/14/7, Churn-Vorrang-Regel; B-Degrade-Risiko: Frontend-Threshold 61/70 bei `getSettings()===null`.) Später Tooling/Audit-Wächter + Pre-Push-Kopplung.*
- [x] **Elevation- & Radius-System app-weit** — 3 Ebenen (Base/Card/Float) in CLAUDE Design Invariants; `--border-card` 0.11; `CARD_PANEL`/`TABLE`-Konstanten (`componentBehavior.ts`); Sweep über panel-blocks/Tabelle/Container; Radius-Hierarchie + benannte Radien normalisiert; Feld-Labels Sans. 3 Audit-Wächter + Pre-Commit-Check. — *2026-06-24* — siehe `docs/session_uebergabe_2026-06-24.md`
- [x] **Drawer-Panels Full-Bleed** — `ui/sheet.tsx` Drawer-Variante bündig am Bildschirmrand (`inset-y-0 right-0`, volle Höhe), nur linke Kante gerundet (`rounded-l-[16px] rounded-r-none border-l`); Panel-Übergänge am `HunterSidepanel` bereinigt (eine Haarlinie als `border-y` am grauen `main`, `gap-0 h-full`, kompakter Footer). CLAUDE-Pflichtregel „Große Arbeits-Panels — Full-Bleed". — *2026-06-24* — siehe `docs/session_uebergabe_2026-06-24_teil2.md`
- [x] **K-2b Profilzeile vereinheitlichen** — alle Meta-Spalten (STATUS·HEAT·SUBSCRIPTION·ZEIT) identisch Label-über-Wert (`CARD.miniLabel` oben, Wert darunter; Zeit-Label „ZULETZT"; NULL→ausblenden). HunterCard-Zeit-Spalte auf geteilten Slot; 3 lokale `daysSince`-Kopien + Inline → zentrales `daysSinceIso`; LeadListRow-Labels angeglichen; verwaister i18n-Key entfernt. **Neue Audit-Checks (FAIL):** „keine daysSince-Kopie" + „nur über HunterCard" (Allowlist HunterCard+LeadListRow). Kanon in CLAUDE.md + design-system.md. Offen: LeadListRow strukturell in HunterCard auflösen (kontrollierter Expand — Folge-Slice). Beide Gate-Agents PASS; Screenshot-QA blockiert (Login). — *2026-07-16*
- [x] **Farmer Slice 4 — CustomerDrawer aus Farmer-Pfad entfernt** — toter `<Drawer>` aus `FarmerReference` + `onSelectCustomer`-Prop aus `ScreenFarming` raus (Farmer öffnet `FarmerSidepanel` intern); CustomerDrawer bleibt für MeinTag/Hunter bis migriert. — *2026-06-27*
- [x] **`supabase/.temp/` aus Git-Tracking** — CLI-Cache (9 Dateien) untracked + in `.gitignore`; erscheint nicht mehr bei `git add -A`. — *2026-06-27*
- [x] **K-1a Test-Fundament (vitest)** — Config (`vite.config.ts`), Smoke-Test (`heatUtils.test.ts`, 3/3), npm-Scripts `test`/`test:watch`; Voraussetzung für [AUTO]-Tests + `test-runner`-Agent. — *2026-07-16* (Commit `3e6ad8b`)
- [x] **K-1a2 Lint-Schuld — Korrektheit vollständig behoben (109 → 60)** — purity (3) · set-state-in-effect (19) · exhaustive-deps (6) · no-unused-vars (20) · react-refresh (4) alle weg (`useNowMs`, State-im-Render, ScreenMyDay→TanStack Query, Toast-/brand-Split, `_`-Konvention in eslint.config). **Offen: 60 × `no-explicit-any` auf DB-Rohzeilen** — bekannt, kein Blocker, Fix in EINEM Zug mit `supabase gen types typescript` bei K-1b/K-2 (Live-DB nötig). **Gate-2-Zwischen-Baseline jetzt 60** (kein Commit darf sie überschreiten). — *2026-07-16* (Branch `chore/k1a2-lint-schuld`)
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
- [x] **Skeleton/Loading + Prefetch** — `PanelSkeleton` (panel-block) in allen Info-Panel-Tabs während `isLoading` · Prefetch-on-hover (`lib/prefetch.ts` zentral in `HunterCard`, 120 ms Intent) · `placeholderData: keepPreviousData` auf allen per-Contact-Queries (HunterSidepanel + ExpandedCardContent) — *2026-06-25*
- [ ] Kanban-Mini-Karten angleichen (bauartbedingt separat)
- [ ] DB-Wiring: Mock → `getDeals`/`getSignals`/`getPipelineSettings`, Realtime, Routing → echtes ScreenHunting; Deal-Felder `name`/`product` + Produktkatalog aus `system_config`

---

## 🗄️ Datenbank (Phase 3 DB-Wiring — Migrationen live)

### Stand (Phase 1 + Phase 3) — Migrationen 001–056 remote applied ✅ (verifiziert 2026-07-16 via `supabase migration list`)
> Ältere „db push offen"-Notizen unten waren veraltet — der gesamte Backlog (031, 032, 040, 042, 043, 044 …) ist faktisch angewendet; Stand jetzt durchgängig 001–056 remote.
- [x] `organizations` + Multi-Tenant-Basis, alle 33 Tabellen aus 001–012 remote live (Projekt `qhcmruprfjunalgrhgcp`) — *2026-06-16*
- [x] `organization_id NOT NULL` + RLS (`auth_org_id()`) + `ON DELETE CASCADE` + org-Index durchgängig (011) — *2026-06-16*
- [x] `update_updated_at()` + `audit_write()`-Trigger auf Kern-Entitäten (010) — *2026-06-16*
- [x] **`knowledge_base` (Migration 013)** — org_id NOT NULL + RLS + `audit_write`-Trigger; append-only — *2026-06-16*
- [x] **`deals.product` (Migration 014)** — nullable text, kein Default; Produkt-Katalog (`products`) folgt separat — *2026-06-16*
- [x] **`knowledge_base`-Schreibweg = Migrationen** (`015` Constraint+Leads-Eintrag · `016` 19 Backlog-Einträge); idempotent `ON CONFLICT DO UPDATE` — *2026-06-17*
- [x] **Hunter Pipeline-Tab auf echte `deals`** — `getDeals` (+`owner:users`-Embed) + `getPipelineSettings` via TanStack; Liste/Kanban/Filter (Heat/Owner/Stage), value Cent→/100 — *2026-06-17*
- [x] **Hunter Signals-Tab datengetrieben** — `getSignals` + `signalToCardProps` (S-0…S-2); Signal-Typ-Mapping (i18n/Icon/`settings.signal_windows`) — *2026-06-17*
- [x] **Kontakt-Datenvereinheitlichung** — `contactToProfile` = Single-Source (Identität/ICP/Heat/Status); Heat-Quellen-Fix Pipeline; `contactActiveStage` (zuletzt aktiver Deal); Regeln in CLAUDE.md — *2026-06-17*
- [x] **Hunter Neu-in-Pipeline read-verdrahtet** — `getNewInPipeline` + `dealToNewPipelineRow` (created_at desc), Zeitfilter heute/7T/30T (Default 30T), Herkunft AI-SDR/Manuell via `source_lead_id` ([D18]) — *2026-06-17*
- [x] **Task-System DB** — Migration **021** (composite Indizes `org+due_at`/`+deal`/`+contact`), **022** (`tasks.channel` nullable), **023** (fällige Test-Tasks-Seed, idempotent) — *2026-06-17*
- [x] **Hunter Follow-ups-Tab = fällige Tasks** — `getDueTasks` (`completed_at IS NULL AND due_at <= now()`) + `taskToDueCard`; ersetzt Heat-Cold/Gone ([D17] entschieden) — *2026-06-17*
- [x] **Task abhaken = erster echter Write** — `completeTask` (UPDATE `completed_at`, org-gescoped, Audit via Trigger), `useMutation` + invalidate-on-success (T4a) — *2026-06-17*
- [x] **knowledge_base Migration 024** — Einträge `Hunter Signals` · `Neu in Pipeline` · `Follow-ups` (module='hunter'); idempotent `ON CONFLICT DO UPDATE` — *2026-06-17*
- [x] **Task ANLEGEN (T4b)** — `createTask` verdrahtet (Panel Tasks-Tab + Neu-in-Pipeline-Deeplink `initialAction='task'`), `createTaskMutation` + invalidate — *2026-06-18*
- [x] **Kanban-Optik** — graue Lanes, weiße Kacheln, ← / Auge / → -Aktionen, KPI-Übersicht (volle Breite) + Filter-Disclosure; KB 033 — *2026-06-21*
- [x] **Won/Lost Notiz+Grund** — Migr. 034 (`lost_note`/`won_reason`/`won_note`), `DealWonModal` (Auswahl+Notiz, nicht blockierend), Abschluss-Box auf der Kachel, `DealLostModal` dismissbar — *2026-06-21*
- [x] **P7 Kommunikation protokollieren** — Migr. 036 `communications` (RLS/Indizes/Audit + `bump_contact_last_contacted`-Trigger), `getContactCommunications`/`createCommunication`, Kommunikations-Tab (`KommunikationVerlauf` echt) + `KommunikationLogModal` + `KommunikationKompakt` (Übersicht), Manuell-Badge, occurred_at-Sortierung, „Ausstehend" — *2026-06-21*
- [x] **„Letzter Kontakt" durchgängig** — Neu-in-Pipeline + LeadListRow auf `last_contacted_at` (vor 0 Tagen unterdrückt); LeadListRow komplett auf `typo-*` + Audit-Scope — *2026-06-21*
- [x] **Pipeline Task-Liste echt** — `PipelineStagniertCard`/`PipelineKeineTaskCard` prop-getrieben aus `getDeals` (Stagniert via Schwelle/settings · Keine-Task via `tasks.length===0`), Badge echt, `['deals']`-Invalidierung, Deal vorausgefüllt+readonly (`lockDeal`) — *2026-06-21*
- [x] **KB Migration 038** (Kommunikation protokollieren · Pipeline Task-Liste · Heat-Automatik) — gepusht — *2026-06-22*
- [x] **Action Panels verdrahtet** — Signal-Opener (`signalToActionData` → `SignalActionDrawer`) + Kalt-Opener (`contactToColdPerson` → `ContactColdDrawer`, Follow-ups „Kalt & Inaktiv"); `ChatActionPanel` AI-noch-nicht-da-Modus (recommendation/draft nullable → „Folgt"-Platzhalter [D5]) — *2026-06-22*
- [x] **Details-Tab + Kontakt-Inline-Edit Write echt** — `updateContact`/`updateCompany`, Migr. **039** (salutation/language/department/twitter_handle), Seed aus DB, `DetailField.validate` (E-Mail/URL), `contact_status` Single-Source, E-Mail-Verifiziert-Mock entfernt, Deep-Link Stift→Vollansicht — *2026-06-22*
- [x] **Aufgeklappte Kachel echt** — HunterCard + LeadListRow lazy Queries (Deals/Kommunikation), `CommunicationChain` auf echte communications (Hover), zweispaltig, Action-Icons, Deep-Links (Task/Notiz/Deal-Edit), KI-Kurzakte-Platzhalter [D5] — *2026-06-22*
- [x] **Stagnations-Warnung am Deal** — `StagnationHint` + `stagnationFlag` (Schwelle aus settings) in DealsListe (compact/detail) + Pipeline-Liste — *2026-06-22*
- [x] **Icon-Konsistenz (Tab-Icons = Single Source)** — Tab-Icons Panel+Vollansicht; Notizen→FileText, Tasks→CheckSquare überall (kein Plus/StickyNote/ListChecks-Drift) — *2026-06-22*
- [x] **[D27] Tech-Schuld** — `ExpandedCardContent` extrahiert (HunterCard+LeadListRow-Expand-Dedup, ~47 Z. je Karte) · `window.confirm` → shadcn `AlertDialog` (neues `ui/alert-dialog.tsx` + Dep `@radix-ui/react-alert-dialog`; letzte-Telefonnummer-Löschen) · Typo-Kanon Welle 1+2 (14 Formulare/Panels/Karten/Felder auf `typo-*`, Audit walkt `panel-blocks/`+`features/`, alle in `IN_SCOPE`) · CLAUDE-PFLICHT „neue Komponente sofort in IN_SCOPE" + Pre-Push-Checkbox — *2026-06-22*
- [x] **KB Migration 040** (Signal-Opener · Kalt-Reaktivierung · Stagnations-Warnung + Update Kontakt-Details) — db push erfolgt (Stand 001–056 applied) — *2026-06-22*
- [x] **820px Info-Panel READ+WRITE (P1–P5c)** — Kopf/Kontaktzeile/Tasks/Notizen/Deals echt; `dealToView`-Resolver; Übersicht (KPIs+Funnel) + Aktivität (audit_log) + Pipeline-Liste echt; Migr. **028** (products) **029** (Vertragsfelder) **030** (Deal soft-delete) — *2026-06-18/19*
- [x] **P8 Stage-Write + Won/Lost** — Terminal-Slugs Single-Source (`WON_/LOST_STAGE_SLUG`/`isTerminalStage`); Stage-Wechsel Kanban(←/→)+Stage-Badge-Dropdown (Liste/Deals/Übersicht) → `updateDealStage`; **Won** (`updateDealWon`+`closed_at`+Konfetti) / **Lost** (`DealLostModal`→`updateDealLost`+`lost_reason`); `closed_at`/`lost_reason` aus Migr. 004 (keine neue Spalte) — *2026-06-19*
- [x] **P8-4 Cache-Konsistenz** — alle Deal-Writes invalidieren `dealsByContact`/`deals`/`newInPipeline` **+ `dueTasks`/`signals`** (aktive-Deal-Stage) — *2026-06-20*
- [x] **Telefon PH1–PH4** — `contact_phones` (Migr. **026**) read (`contactToProfile.phones` + Embed) + write (create/update/setPrimary/delete, Favorit Constraint-sicher) + Validierung (`lib/validation.ts`); Legacy `contacts.phone` entfernt (Migr. **031**, db push erfolgt) — *2026-06-20*
- [x] **knowledge_base Migration 032** — `Deal-Stufe ändern` · `Deal abschließen (Gewonnen/Verloren)` · `Telefonnummern am Kontakt` (module='hunter', idempotent); db push erfolgt — *2026-06-20*
- [x] **Merge `feature/phase-2-hunter` → `main`** (`--no-ff`, `22c3cad`), Gates grün — *2026-06-20*
- [ ] **Erinnerung/Reminder** — Feld (`reminder_at`) + Auslöse-System (notifications/Cron/Versand) fehlen komplett ([D19])
- [ ] **Erinnerung/Reminder** — Feld (`reminder_at`) + Auslöse-System (notifications/Cron/Versand) fehlen komplett ([D19])
- [x] **K-1b Daten-Fundament (Migration 056, db push erfolgt + `gen types` gezogen)** — `contacts.assigned_to`+`created_by`; **`list_members` Join-Tabelle löst `lists.contact_ids`-Array (005) ab** (FK+CASCADE+RLS+Audit, verlustfreier Backfill nur auf existierende Kontakte); `import_batches`+`import_templates` (K4/K5); `settings.lead_assignment_strategy` (K9, D51). Zentrale **pure** Functions + **[AUTO]-Tests** (41/41): K1 Pflichtfeld-Validierung (`contactValidation.ts`), K2 `find_duplicates`/Normalisierung (`dedup.ts`), K9 round_robin (`leadAssignment.ts`); dünne DB-Schicht `findDuplicates`/`assignLeadOwner` (`db.ts`). `sales_os_db_schema_v3.md` angeglichen. Beide Gate-Agents PASS. — *2026-07-16*
- [ ] knowledge_base-Eintrag je weiterem fertigem Feature (K-1b = Infra/intern, KB folgt mit K-3/K-4 Screens)

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
- [~] notifications, ~~notification_preferences~~ — *Notification-Infrastruktur* — **N-S1 gebaut (Migr. 065-067):** `notifications` + `activity_events` + `settings.notifications` (statt eigener `notification_preferences`-Tabelle) · `notify()`/`log_activity()` Postgres-Funktionen · Idempotenz-Key mit `user_id` · Realtime + Cleanup-Cron. Offen: N-S2 Glocke/UI · Kanal-Fan-out (Push/Slack, dokumentiert)
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
- [x] `permission_catalog` + `role_permissions` (SET-1, Migr. 070 — globale datengetriebene Matrix) · `user_permissions` gehärtet (`effect` grant|deny, UNIQUE, Audit-Trigger) — *2026-07-19*
- [ ] `daily_briefings` — Mein Tag Top 5 (priorities jsonb, generated_at, user_id)
- [ ] `custom_dashboards` (v2/v3 — jetzt anlegen, Widget-Layout jsonb)
- [ ] `chat_sessions` + `chat_messages` (content jsonb = Block-Array, langfuse_trace_id) — *AI Chat*
- [~] Billing-Tabellen: `plans`, `plan_limits`, `organization_subscription`, `credit_balance`, `credit_transactions`, `addons` — Tabellen (008) + RLS/Policies (011) + **Entitlement-Layer (Migr. 061–063: metadata-Spalte, `settings.billing`, Seeds internal-Plan `-1`, RPCs `check_entitlement`/`check_credit_balance`/`consume_credits`, Monats-Reset-Cron)** gebaut (19.07.2026). **Härtung Migr. 064:** Rückwirkungsfreiheit (angewandte Parameter in `credit_transactions.metadata` eingefroren) + globaler Default-Layer (`billing_config` + `_billing_config` global→per-Key-Override). Offen: `aiCall()`-Verdrahtung (Haken, erster echter AI-Call-Slice) · Kauf-Flow (Launch/A-Serie) · Andock-Haken Diagnose-Punkte 1-4 (action_prices/grant_credits/count-enforcement)
- [ ] `settings` JSONB: `modules`, `automation_defaults`, `thresholds` (churn_weights/upsell_weights/stagnation_days_per_stage/heat_status_days/trial/onboarding/meeting_prep), `sending_defaults`

- [~] **Betrieb & Überwachung B-1** (Migr. 068/069): `cron_runs`/`system_alerts`/`cron_expectations` (global, audit `GLOBAL_TABLES`) · Cron-Wrapper `cron_run_start`/`cron_run_finish` · **alle 6 Crons umgestellt** (063/067 DB + 035/037/049/051 Edge, Deploy nötig) · Watchdog (15 Min, gebündelt → `system_alerts` + `notify()` System) · Retention-Cron · Klartext-Registry `alertTemplates.ts` · `/health`-Stub. **Folge:** B9/aiCall-Überwachung · System-Mail-Kanal (B-2, jetzt In-App-only) · Sentry (B-2) · Status-Seite (B-4)

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
- [x] **Supabase Auth (Email + Passwort)** — Login Email+Passwort + Google/Microsoft SSO + Passwort-Reset; `lib/auth.ts`, `Login.tsx`, `AuthCallback` + `/auth/callback`, db-Client-Auth-Optionen (persistSession/autoRefresh/detectSessionInUrl) — *2026-06-22*

### Auth/Org-Wiring [D21] (Session 2026-06-22 teil3)
- [x] **Provisioning-Trigger** (Migr. **041**) — `handle_new_user()` auf `auth.users` INSERT → neue Org + Owner-User; **db push erfolgt** — *2026-06-22*
- [x] **`useCurrentOrg()`-Hook** — Session→`organization_id`+`role` (via `getUserOrgRole`), Fallback `DEMO_ORGANIZATION_ID` — *2026-06-22*
- [x] **`DEMO_ORGANIZATION_ID` → `useCurrentOrg()`** in 5 Consumern (ReferenceScreens/HunterSidepanel/ScreenHunting/ExpandedCardContent/useModules); `lib/org.ts` bleibt Fallback — *2026-06-22*
- [x] **`created_by`/`assigned_to`/`owner_id` aus `auth.uid()`** — createNote/createTask/createCommunication/createDeal optional, Fallback NULL — *2026-06-22*
- [x] **Invitations + Teams** (Migr. **042** Tabellen+RLS+Audit, **043** Trigger-Einladungs-Pfad) — `TeamSettings`-UI unter `/app/settings`; db.ts `getTeamMembers`/`getInvitations`/`createInvitation`/`deleteInvitation`/`updateUserRole`; **db push erfolgt** — *2026-06-22*
- [x] **KB Migration 044** (Team & Einladungen, module=core) — db push erfolgt — *2026-06-22*
- [x] **Auth/2FA-Entscheidungen** in CLAUDE.md ([D21]-Block): Email+Passwort+SSO · TOTP-2FA (Owner Pflicht) · Teams · Onboarding · Session-Länge — *2026-06-22*
- [x] **Login-Pflicht [D21]** (19.07.2026) — `Protected` erzwingt Login, Catch-all `NotFoundRedirect` (→ Login statt `/app`),
  öffentliche Routen explizit vor Catch-all (`/reset` neu · `/invite/:token` + `/unsubscribe` reserviert) + CLAUDE-Dauerregel;
  Passwort-Reset-Abschluss `/reset`; Logout im Avatar-Dropdown; Dev-Bypass hinter `VITE_DEV_AUTH_BYPASS`;
  `useCurrentOrg.provisioningError` + `ProvisioningGate`; **invite-only** (Migr. 072); Redirect `state.from` + differenzierte Fehler.
- [x] **Invite-only Provisioning** (Migr. **072**) — `handle_new_user` legt ohne gültige Einladung keine Org/Owner an (ersetzt 043-Else) — *2026-07-19*
- [x] **Settings SET-2 „Persönlich"-UI** (19.07.2026): Zugang hinter Avatar-Dropdown (`/app/profil`, 3 Reiter) — nicht in Haupt-Settings-Nav. Mein Profil (`updateMyProfile` + Sprache) · Ansicht (`setNavPreferences`, Einstellungen fest, shadcn switch + Pfeile) · Sicherheit (Passwort mit Re-Auth + SSO-Anzeige). `SettingsCard`/`useSaveState`/`typo-page-title`. Keine Voice-Karte. 11 Render-Tests. **Offen:** SET-3 (Team&Rechte-UI), SET-4/5/6.
- [~] **Settings SET-2 — Backend/Datengrundlage** (Migr. **073**, keine UI): `settings.general` (Sprache/Zeitzone/Datumsformat/Währung) · `users.booking_provider/booking_link/signature` · Recht `settings.manage` (owner+admin) · validierte Update-RPCs `update_general_settings`/`update_my_profile` (+audit_log) · zentrale Merge-Defaults `settingsDefaults.ts` · Ansicht via `user_preferences` (057) · SSO-Anzeige `getUserIdentities` · Rollen-Sichtbarkeit `settingsNav.ts`. **Offen: UI/Screens (Folge-Slice nach Design), Voice-Inhalt (SET-KB-2).** — *2026-07-19*
- [ ] **[D29] Einladungs-Mail** via Edge Function (`auth.admin.inviteUserByEmail`) — service_role, deferred; **Route `/invite/:token` reserviert**
- [ ] **2FA (TOTP)** UI vorhanden (`MfaBanner`); **Enforcement (Owner Pflicht) → B-3 Launch-Härtung** (deferred, Entscheidung C)
- [ ] **Verwaiste Auth-User** (abgelehnte invite-only-SSO-Sessions) aufräumen — kleiner Folge-Schritt

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
- [x] `score_heat_status()` (täglich + nach Touchpoint) — *`contacts.heat_status` aus `last_contacted_at`, Schwellen aus `settings.thresholds.heat_status`, NULL→übersprungen; Edge Function deployed + Cron 037 + fire-and-forget nach `createCommunication`* — *2026-06-21*
- [x] `score_deal_health()` (täglich + bei Stage-Wechsel) — *`deals.stagnation_days` aus `stage_updated_at`; Edge Function deployed + Cron 035 (Vault) + Stage-Trigger; schreibt nur stagnation_days (kein heat_status)* — *2026-06-21*
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
- [x] **Farmer Screen** → Recommendation Feed (Bestandskunden) — **DB-Wiring KOMPLETT (30.06.2026):** Screen (6 Tabs + aufgeklappter Bereich), Panel 8a–8e (Header/KontaktZeile/Tabs/Writes/Signale/Subscription/Details — alles echt + editierbar), Vollansicht. Echtes Churn-/Upsell-Scoring (Edge Functions `score-churn-risk`/`score-upsell` + Crons, Migr. 048–053). Invarianten: Subscription-nie-Stage · Churn-Vorrang vor Upsell (auch dedizierte Tabs) · Single Source (`contactToProfile`/`getContactDetail`/`companies`/`contactDetailFields`) · Honesty. Verbleibend nur bewusst deferred: KI-Kurzakte/Action-Draft [D5] · Usage-Telemetrie [D49] · Deals-Tab [D50] · Mail [D29] · Snooze-Persistenz [D48] · Won→Kunde-Lifecycle [D38].
- [ ] **Mein Tag** → aggregierter Feed (keine eigene Datenquelle)
- [x] **Kontakte Screen (K-3)** — *zentrales Datenobjekt, `ScreenKontakte` an `getContacts`, Route live.* — *2026-07-17*
- [x] Kontakte-Listenansicht — TanStack Table + Virtualisierung: Checkbox (Gmail-Bulk „alle im Filter") · Name+Jobtitel+Company · `LeadSourceBadge` · Status-Badge · ZULETZT · ICP-Ring · `RoutingChip` (Lucide, kein Emoji); Filter-Pills (K-2 `evaluateFilter`) · Spalten-Konfig + Persistenz (`user_preferences`) · Anlegen-Panel (K1-Pflicht + K2-Duplikat hard/soft). — *2026-07-17*
- [x] **Listen (K-3b)** — statisch + dynamisch (live über K-2 `compileToPostgrest`); Listen-Dropdown, `NeueListeDialog` (Statisch|Dynamisch, dynamisch = aktueller Filter), `ZuListeDialog` geteilt (nur statisch wählbar, dynamisch ausgegraut), Bulk + Einzel (`HunterSidepanel`). db: `getLists`/`createList`/`addToList`/`getListMembers`/`deleteList`. — *2026-07-17*
- [x] **Companies-Listenansicht (K-4a)** — `ScreenCompanies` auf der geteilten Tabelle (`useDataTable`/`DataTableCard`/`ColumnConfigPopover`, `persistKey="table_views.companies"`); 6 Set-A + 15 Set-B-Spalten; abgeleiteter Firmen-Status (`companyStatus`, Single Source für Badge + `RoutingChip`); 3 Filter-Dropdowns (Branche/Größe/Land), Lagebild „ohne Kontakt" (honest), Bulk Tag/Export. `getCompanies`/`getCompanyDetail` (Embed contacts/deals-Aggregate) + `prefetchCompanyPanel` (Regel C). Route `companies` live (ersetzt ComingSoon). — *2026-07-17*
- [x] **Tabellen-Suche (geteilte DataTable)** — Substring-Live-Suche (kein AI) in `useDataTable` (globalFilter + `tableSearch.matchesQuery`) + geteiltes `TableSearch`-Feld (oben rechts neben Filtern). Kontakte: Name/E-Mail/Firma · Companies: Name/Domain. Kombiniert UND mit Filtern; Bulk „alle auswählen" respektiert die gefilterte Menge. 5 Tests. — *2026-07-17*
- [x] **Companies-Detailseite K-4b-1** — `ScreenCompanyDetail`: Kopf + KPIs (echt) + Tab-Leiste (`PanelTabs`); **Übersicht** = Company-Details inline editierbar (`DetailSection`/`DetailField` → `updateCompany`, Branche/Größe/Stadt/Land/Domain/Website/LinkedIn + CRM-ID readonly); **Kontakte-Tab** = echte Firmen-Kontakte (`getContacts({companyId})`, lazy) mit Hover-Prefetch + „+ Kontakt hinzufügen" (`KontaktAnlegenPanel initialCompany`). Honesty: Sherloq-Zusammenfassung/Live-Signale/Quelle/Inhaber/Churn-KPI ausgeblendet. — *2026-07-17*
- [x] **Companies-Detailseite K-4b-2** — **Deals-Tab** (`getDealsByCompany` + `DealsListe variant=detail`: anlegen/bearbeiten/löschen/Stage echt; `createDeal` um `companyId` erweitert) · **Aktivität-Tab** (`getCompanyActivity` = aggregierter Touchpoint-Feed ALLER Firmen-Kontakte, EIN Query mit Kontaktname → `KommunikationVerlauf` + `companyActivityToView`) · **Notizen-Tab** (`getNotesByCompany`/`createCompanyNote` + `NotizenListe`, CRUD echt). Alle Tabs lazy. — *2026-07-17* · *Reduziert: Won/Lost-Modal-Zeremonie (Konfetti/Lost-Reason) bleibt Hunter; Company-Deals-Stage-Wechsel = direkt. Aktivität read-only (Protokollieren pro Kontakt).*
- [x] **Löschen Kontakte + Companies (Soft-Delete)** — Migration 058 (`deleted_at`/`deleted_by` + part. Indizes; `audit_write()` → `delete_<table>`); `softDeleteContacts`/`softDeleteCompanies`; ALLE Kontakt-/Company-Lesequeries filtern `deleted_at IS NULL`; roter Löschen-Button + AlertDialog (Einzel im Panel/Company-Header + Bulk in beiden Tabellen, Anzahl genannt); Firma-Löschen ohne Kaskade (Kontakte behalten sich, verlieren nur `company_id`). audit_log via Trigger. **Bewusst offen [D-delete-rights]:** keine Rollenprüfung (SET-1/SET-3), kein Papierkorb-UI (SET-3). — *2026-07-18*
- [ ] UI-Verhalten leere/System-Felder: "—" grau + Hover-Edit · Pflicht=amber Unterstreichung · System=grau readonly · inline-Edit, onBlur-Save, rotes Inline-Fehler-Feedback (Hex → index.css-Tokens mappen)
- [ ] Analytics kontextuell eingebettet — kein eigener Nav-Screen (AI SDR/Hunter/Farmer/Companies/Mein Tag inline · Settings→Reporting später)
- [ ] **Inbox** Screen + Sidebar-Icon (Tools-Bereich) + Badge
- [ ] **Sidebar finale Struktur** (max 9 Icons, Lucide): Screens · Kontakte · Tools · Settings/Profil
- [ ] Listen via Pill-Dropdown im Kontakte-Screen + Cmd+K (kein Nav-Punkt)
- [ ] Companies: nur im Drawer + Settings (Admin) + Cmd+K — kein Nav-Punkt
- [ ] Duplikat-Erkennung UI: Hard Match (Email/LinkedIn → blockiert) · Soft Match (Name+Company → Banner) · läuft bei Anlegen (onBlur), CSV-Import-Review, "Duplikate verwalten"-Ansicht
- [x] **"Duplikate verwalten"-Vollbild-Screen (K-6b, 2026-07-18)** — Tabs Kontakte|Companies · Paar-Karten (sicher/möglich) · Merge-Dialog Feld-für-Feld A/B + alert-dialog-Bestätigung → `mergeContacts`/`mergeCompanies` (FK-Kaskade, K-6a) · 3. Aktion „Datensatz löschen" im ⋯-Menü → `softDelete*` · Einstieg im Aktionen-Dropdown (Kontakte + Companies) · Render-Test (Live-DOM). *Offen: merge_candidates-Persistenz für „Kein Duplikat"; onBlur-Hard/Soft-Match beim Anlegen*
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
- [ ] **Feature-Panels migrieren (NEU vermerkt 2026-07-17)** → **`AddSdrLeadPanel`** (Referenz-Panel, komplett hardcodiert Deutsch außerhalb i18n — bei der K-3-QA aufgefallen) + **`HunterSidepanel` Details-Tab-Labels** (`Vorname`/`Nachname` u.a. hardcodiert statt `t()` — bei der K-4b-1-QA aufgefallen) + weitere `features/hunter`/`features/farmer`-Panels. *Nicht jetzt fixen, nur festgehalten.* **Erledigt (K-3/K-4):** `ScreenKontakte`, `KontaktAnlegenPanel`, `LeadSourceBadge`, `RoutingChip` (`kontakte.*`), `ScreenCompanies`/`ScreenCompanyDetail`/`CompanyAnlegenPanel` (`companies.*`).
- [ ] EN/ES tatsächlich übersetzen (aktuell DE-Kopie)
- [ ] `audit.ts` erweitern: hardcodierte UI-Strings im JSX erkennen — *Regel automatisch prüfen* (würde AddSdrLeadPanel u.a. automatisch aufdecken)

### Daten-Layer
- [x] **Service-Abstraktion** `lib/db.ts · auth.ts · storage.ts · realtime.ts` — *einzige Swap-Stelle für Supabase*
- [x] App lädt Daten über `lib/db` (nicht direkt aus `@/data`/supabase) — *audit-geprüft*
- [x] audit-Regel: `@supabase` nur in `lib/`, `createClient` nur in `db.ts`
- [x] **Supabase-Client live** (`.env.local`, anon-Key) — `db.ts` Live-Modus, Test-User + Demo-Seed, RLS greift — *2026-06-16*
- [x] **Hunter Leads-Tab auf echte Queries** — `getContacts` (org-gescoped, Company-Embed FK-Hint) → `hunterMappers.contactRowToLead` → TanStack Query (Loading/Error); Heat + Lifecycle-Status + last_contacted echt — *2026-06-16*
- [x] **`useModules` → `getModules()` (`settings.modules`) via TanStack** statt nicht existenter `user_modules` (404 weg) — *2026-06-16*
- [~] TanStack Query als Server-State — *Leads-Tab + Module umgestellt; restliche Screens folgen*
- [ ] Restliche Mock-Listen (Pipeline/Signals/Info-Panel) durch echte Queries ersetzen
- [x] Glocke: echter Badge-Count aus `notifications` (read=false), live via Realtime — **N-S2 gebaut** (TopBar-Glocke + Route `/app/notifications`, RLS-Queries, `subscribeToNotifications` verdrahtet)
- [x] **K-2 Filter-Sprache (Weiche 1)** — `src/lib/filter/` EINE Sprache für Listen+Lifecycle+Analyse: AST (`types`) · Whitelist-Schema (Sicherheitsgrenze, kein D51) · `validate` (Gatekeeper) · `evaluate` (in-memory) · `compile` (→ PostgREST, nie freies SQL, Werte double-quoted). **[AUTO]-Tests 80/80** inkl. Injection-Nachweis + evaluate↔compile-Parität (case-sensitiv, NULL matcht nie). DB-Anwendung an `getContacts` + `%`/`_`-ilike = K-3. Beide Gate-Agents PASS. — *2026-07-16*
- [x] **DB-Rohzeilen-`any` (60, K-1a2) mit `database.types.ts` ersetzen** — K-3 CP1: Row-Composites `src/types/rows.ts`, db.ts-Feeder + mappers typisiert → **Lint-Baseline 0, Gate 2 HART**. — *2026-07-17*
- [~] **K-5 Smart-Import Engine-Kern (dep-frei, vorgezogen)** — `src/lib/import/`: `detect` (Encoding-BOM + Trennzeichen), `mapping` (Synonym-Wörterbuch de/en + Vorlagen-Signatur), `validate` (Pflichtfeld K1 + Format + Duplikat K2 + Intra-Datei, Report K8). **[AUTO]-Tests 28 neu (108 gesamt)**. Offen: echtes Parsen (papaparse + **xlsx >50 kb → Dep-Freigabe Oliver**), AI-Mapping (C27), UI (mit K-3/K-4), Ausführung (Edge + import_batch_id). — *2026-07-16*

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
- [~] Vollständige Rechte-Matrix (owner/admin/member/viewer) durchsetzen — **SET-1 Fundament (Migr. 070/071):**
  `has_permission` (deny>grant>Rolle) als serverseitiger Guard in `soft_delete_*`/`set_user_role`; UI-Gating via
  `useEffectivePermissions`. **Offen:** flächendeckende Guard-Nutzung in allen künftigen Write-Pfaden — *2026-07-19*
- [~] `user_permissions`: Einzelrecht-Überschreibung — **Backend fertig** (`grant_permission`/`revoke_permission`,
  `effect` grant|deny). **Offen (SET-3):** Einzelrechte-UI. — *2026-07-19*
- [x] **[D-delete-rights] Teil 1 (Löschen server-erzwungen)** — `soft_delete_contacts`/`_companies` prüfen
  `records.delete` + Org-Scope (Migr. 071). Offen: Papierkorb-UI (SET-3). — *2026-07-19*
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
- [~] `notify()` + Event-Katalog — *einziger Notification-Eintrittspunkt* — **N-S1: als Postgres-Funktion** gebaut (Migr. 066, aufrufbar SQL-Cron/Edge/RPC), Registry `src/lib/notifications.ts`. Ein späterer dünner TS/Edge-Wrapper ruft diese Funktion.
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
