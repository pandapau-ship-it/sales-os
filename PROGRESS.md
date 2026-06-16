# Sales OS — Progress Tracker

> Update this file at the end of every session. Read it at the start.

---

## Current Status: Phase 3 (DB-Wiring Hunter) — gestartet · Migrationen 001–014 remote live ✅ → Leads-Tab Read next

> Single Source of Truth für den Umsetzungsstand: **CHECKLIST.md** (`npm run audit` prüft).
> CLAUDE.md = WARUM/WIE · CHECKLIST.md = WAS-offen · PROGRESS.md = Session-Historie.

> **i18n-Gerüst steht, EN/ES-Befüllung in Phase 4.** Bis dahin: alle UI-Texte konsequent
> über i18n-Keys (`t()`), nichts hardcoden, nur Deutsch pflegen. (Bewusst geplant, kein Bug.)

---

## Offen — Nächste Session (Phase 2 Abschluss → Phase 3 DB)

0. **Vollansicht — restliche Tabs aufwerten** — Grundgerüst (echte Seite) + **Details-Tab**
   sind fertig (2026-06-15, `HunterSidepanel` `variant="full"`, geöffnet über ↗ im Info-Panel).
   Offen: nur noch das **vollseiten-spezifische** Layout/Spacing der Tabs — die Tab-**Inhalte**
   wurden 2026-06-16 (Teil 2) stark aufgewertet (Kommunikation = vertikaler Zeitstrahl, Aktivität =
   System-Feed, Tasks/Notizen/Deals mit Anlegen/Bearbeiten, neuer **Deal-Tab**). Details-Tab-Felder
   beim DB-Wiring an echte `contacts`/`companies`-Felder hängen (CRM-Felddefinition). Optional später:
   Vollansicht aus `shared/HunterSidepanel` in eine eigene `features/hunter/`-Komposition herauslösen.
1. **Snooze · Settings · AddSdrLeadPanel verdrahten** — aktuell reine UI/Mock. Beim DB-Wiring:
   Snooze-State + Limits aus `system_config` (`snooze_max_count`/`_days`/`_escalation_type`),
   `SnoozeSettings` schreibt echt, `AddSdrLeadPanel` legt Kontakt/Deal an (Edge Function).
   `SnoozeSettings` ist noch **nicht gemountet** (kein Settings-Screen) — einhängen sobald da.
2. **DB-Wiring (Phase 3 Start)** — Mock → echte Queries (`getDeals`/`getSignals`/
   `getPipelineSettings`), props → `organizationId`/`userId`, TanStack Query (bringt
   Skeleton/Loading automatisch), Realtime, Routing `HunterReference` → echtes `ScreenHunting`.
   Composer-`initialDraft` aus `messages` (`status='draft'`, via `generate_message()`).
   Deal-Felder Name/Produkt → `deals.name`/`deals.product`; Produktkatalog (`DEAL_PRODUCTS`) aus
   `system_config`. Mock-Listen (Tasks/Notizen/Deals/Kommunikation/Aktivität) → echte Tabellen;
   die Blöcke sind bereits datengetrieben (`*Item`-Typen + Default-Mock).

> **PR #12** (Draft) vorbereiten, aber **NICHT mergen** — auf Freigabe warten.

---

## Offene Konzept-Entscheidungen / Deferred Logic

> **Was das ist:** In dieser Phase (DB-Wiring) zeigen die Screens echte Daten, aber
> manche Werte werden nur **angezeigt**, nicht **berechnet/gesetzt**. Die folgenden
> Punkte sind bewusst aufgeschoben — hier steht je Punkt: **Status heute · Zielphase ·
> Was später zu tun ist**. Eine neue Session liest das beim Start (CLAUDE.md → SESSION START).
> Jeder Punkt hat einen Anker-Tag für `grep`.

### [D1] Lifecycle-Status — Automatik · Zielphase: Automation / Edge Functions
- **Status heute:** Reine **Anzeige**. `LeadListRow` mappt `contacts.contact_status`
  → Klartext-Label (`hunterMappers.ts` → `CONTACT_STATUS_LABEL`): Neu · Aktiv ·
  In Pipeline · Kunde · Inaktiv · Opt-out. Niemand setzt diese Übergänge automatisch.
- **Später:** automatische Übergänge per Regel/Edge Function — z.B. Sequenz gestartet
  → `in_campaign` (Aktiv), Deal angelegt → `pipeline` (In Pipeline), Deal **gewonnen**
  → `kunde` (Kunde), lange inaktiv / Heat=`tot` → `archiviert` (Inaktiv). User setzt **nichts** manuell.
- **Offene Frage:** Löst „Lifecycle" `contact_status` ab, **oder** wird es ein eigenes
  abgeleitetes Feld (z.B. `lifecycle_stage`) neben `contact_status`? — vor Implementierung entscheiden.

### [D2] Lifecycle-Labels — user-konfigurierbar · Zielphase: Settings / Rechte
- **Status heute:** Labels/Stufen **hardcodiert** in `CONTACT_STATUS_LABEL`.
- **Später:** Labels + Stufen pro Org aus `settings` konfigurierbar (analog
  `settings.pipeline_stages`), nicht im Code. Verbindung zu [D1].

### [D3] opt_out / archiviert im Leads-Tab — Filter · Zielphase: Rechte / Filter
- **Status heute:** Beide Kontakte erscheinen im Leads-Tab, mit eigenem Label
  (`opt_out`→„Opt-out", `archiviert`→„Inaktiv"). Keine Filterung.
- **Später:** Produktentscheidung — sollen `opt_out`/`archiviert` im Leads-Tab
  überhaupt erscheinen oder rausgefiltert werden? `opt_out` ist **rechtlicher Hard-Block**
  (nie wieder Sequenz, Audit-pflichtig) → darf nicht versehentlich reaktiviert werden.

### [D4] Stagnation / „XT in Stage" — Pipeline + Berechnung · Zielphase: Pipeline-Slice + Automation
- **Status heute:** Aus der **Kontakt-Zeile entfernt** (ist ein Deal-Konzept, kein Kontakt-Konzept).
- **Später:** gehört in den **Pipeline-Tab** (Deals erstklassig). `deals.stagnation_days`
  wird per **Edge Function (Cron)** berechnet (Vergleich gegen `settings.pipeline_stages[].stagnation_days`),
  nicht im Frontend. Rotes Warn-Dreieck nur bei echtem Stagnations-Trigger (Rot = nur Warnung, CLAUDE.md-Regel).

### [D5] Berechnete Werte allgemein — Befüllung per Edge Functions · Zielphase: Automation (am Ende)
- **Status heute:** `heat_status`, `icp_score`, `stagnation_days`, `last_contacted_at`
  kommen aus **Seed/Demo-Daten** und werden nur **angezeigt** (reines Mapping).
  `last_contacted_at` ist im Seed NULL → Zeit-Spalte leer (gewollt).
- **Später:** Berechnung/Befüllung per **Edge Functions (Cron)** — erst **nachdem alle
  Screens verdrahtet** sind. Business-Logik nie im Frontend (CLAUDE.md → Heat/Churn/ICP/Scores → Edge Functions).

> Anker-Tags `[D1]`–`[D5]` sind im Code referenzierbar (z.B. `hunterMappers.ts` → `[[leads-tab-read]]`).
> Vor Umsetzung eines Punkts: passende Referenz-Doku (`docs/sales_os_edge_functions_v2.md` etc.) lesen.

---

## Completed

### Phase 3 — DB-Wiring Start: Live-Schalt + Fundament-Ergänzungen (Branch `feature/phase-2-hunter`) — Session 2026-06-16

Erster DB-Slice, slice-by-slice. Supabase live geschaltet, zwei additive Migrationen
gepusht (kein reset). Read-only verifiziert. Mock-Code unangetastet (eigener Slice folgt).

- [x] **`.env.local`** mit `VITE_SUPABASE_URL` + anon-Key (Projekt `qhcmruprfjunalgrhgcp`, eu-west-1)
  angelegt (gitignored) → `db.ts` schaltet in den Live-Modus (`isSupabaseConfigured()` true).
  Keys via `supabase projects api-keys` beschafft, nur anon (kein service_role).
- [x] **Remote-Stand festgestellt** (read-only): `migration list` zeigt 001–012 lokal == remote;
  REST-Probe bestätigt alle 33 Tabellen live, `knowledge_base` fehlte (404 PGRST205).
- [x] **Migration 013 — `knowledge_base`**: org_id NOT NULL + RLS (`auth_org_id()`, Muster wie 011)
  + `audit_write`-Trigger (`trg_knowledge_base_audit`, AI-Chat-relevante Quelle → kein Silent-Write),
  append-only. Gepusht (additiv), verifiziert: REST 404→200, `migration list` 013 == remote.
- [x] **Migration 014 — `deals.product`**: `text`, nullable, kein Default, kein FK (Katalog folgt als
  eigene `products`-Tabelle beim Pipeline-Wiring). Gepusht (additiv), verifiziert: `select=product`
  HTTP 200 + Negativ-Gegenprobe 400 (42703), `migration list` 014 == remote.
- [x] **Doc-Angleich** (Konflikt-Regel, selber Commit): `docs/sales_os_db_schema_v3.md` um
  `knowledge_base` + `deals.product` ergänzt; CLAUDE.md `knowledge_base`-DDL auf `NOT NULL`
  korrigiert (war ohne); CHECKLIST/PROGRESS nachgezogen.
- **Stand:** Migrationen 001–014 remote live. **PR #12 weiter Draft, nicht gemergt.**
- **Offen (nächste Slices):** `knowledge_base` Seed pro fertigem Feature · `db.ts` Mock→Live je Block ·
  Leads-Tab Read zuerst · Realtime · `products`-Katalogtabelle (später).

### Phase 2 — Komponenten-Struktur & panel-block-Library (Branch `feature/phase-2-hunter`) — Session 2026-06-16

Aufräumen + Konsolidierung der Komponenten-Struktur. Reiner Refactor, **kein** Design-/Verhaltens-
Change (Markup byte-identisch), kein DB-Wiring. Build · Audit · Structure-Check durchgehend grün.

- [x] **Tote Dateien + Orphans gelöscht** — `shell/` komplett (alte Shell-Variante) · `shared/InfoPanel`
  `EngagementChain` `HeatDot` `ChannelIcon` `ScoreRing` · verwaiste `features/hunter/HunterInfoPanel`
  `HunterActionPanel` · `features/settings/SnoozeSettings` (vorher je 0 Importe verifiziert).
- [x] **Komponenten verschoben** — Karten → `panel-blocks/` (`HunterCard` `SignalRow` `FollowUpKaltCard`
  `PipelineStagniertCard` `PipelineKeineTaskCard` `LinkedinSignalCard` `NewInPipelineCards`
  `SequenceLeadCards`) · Hunter-Panels/Drawer → `features/hunter/` (`HunterSidepanel` `ChatActionPanel`
  4 Drawer). Import-Pfade projektweit angepasst.
- [x] **HunterSidepanel + ChatActionPanel vollständig auf panel-blocks** (Weg B + Weg A, blockweise mit
  Preview): `EditableInline`/`PhoneField` extrahiert; `PanelTabs`; Übersicht-Blöcke (`KiKurzakte`
  /`AktiveSignale`/`DealSetup`/`OffeneTasks`/`ActiveSequenceChain`/`KommunikationPreview`);
  `KontaktZeile` (interaktiv); Tab-Bodies als neue Blöcke `TasksListe`/`KommunikationVerlauf`/
  `AktivitaetsVerlauf`/`NotizenListe`; `ActionComposer`/`ActionFooter`. **Jeder panel-block auf dem
  reichsten/kanonischen Stand** (nie Funktion/Design verloren).
- [x] **panel-blocks/index.ts Barrel** (Default-/Named-Exports + Typen) — gebündelter Import möglich.
- [x] **shared/ bereinigt** — `ActionPanel` (Orphan) gelöscht · `FunnelAnalysis` → `features/hunter/`
  · `PersonalityBadge` → `panel-blocks/` (künftiger Block) · `BrandIcons` als legitimes shared-Util.
- [x] **`npm run structure-check`** (`scripts/structure-check.sh`) — FAIL bei falsch platzierten
  `shared/`-Komponenten; im **Pre-Push-Hook** nach der DB-Checkliste; Teil des Merge-Gates. CLAUDE.md ergänzt.

### Phase 2 — Hunter Info-Panel: Tabs, Deals, Footer, globale Regeln (Branch `feature/phase-2-hunter`) — Session 2026-06-16 (Teil 2)

UI-Ausbau des Hunter Info-Panels + zwei globale Regeln. Reine UI/Mock (kein DB-Wiring). Alle Blöcke
**datengetrieben** (`*Item`-Typen + Default-Mock) → System spielt echte Daten später 1:1 ein.
Build · Audit · Structure-Check durchgehend grün.

- [x] **Kommunikation-Tab** → vertikaler **Zeitstrahl** (grüne Verbindungslinie, direkt aufgeklappt),
  medium-spezifische Karten (Mail/LinkedIn/Call/Meeting/Notiz). Karten einheitlich weiß (`bg-app-surface`).
- [x] **Aktivität-Tab** → System-**Aktivitäts-Feed** (Deal angelegt mit Kurzinfo+Datum, Stage-Wechsel,
  Task an/erledigt, Heat, Sequenz, Kontakt angelegt) mit Akteur — ab Tag 1 aus `activity_log` abbildbar.
- [x] **Tasks-Tab** → Checkbox raus · aufklappbare Read-Only-Details · Bearbeiten/Löschen on-hover ·
  Bearbeiten/Neu öffnet neuen Block **`TaskFormular`** (Maske ohne Kontext-/KI-Meldungen).
  `TaskAnlegenForm` (NoTaskDrawer) nutzt jetzt denselben `TaskFormular` → eine Quelle.
- [x] **Notizen-Tab** → Speicher-Icon raus · Inline-Composer („Neue Notiz") · Inline-Edit ·
  Datum **+ Uhrzeit** + Autor je Notiz.
- [x] **Deal-Tab (neu)** → Block **`DealsListe`** (listet Deals, Bearbeiten/Löschen on-hover) +
  „Neuer Deal" über das geteilte `NewDealCard`-Formular.
- [x] **Übersicht** interaktiv — Deal-Karte (`DealSetup`): Hover-Edit → Deal-Tab im Edit; Count-Badge
  bei mehreren Deals. Tasks (`OffeneTasks`): Checkbox raus, Hover-Aktionen (Edit/Löschen/Erledigt),
  Klick → Tasks-Tab, Bearbeiten öffnet den Task direkt im Edit.
- [x] **Footer-Quick-Actions** — LinkedIn → **Deal**; jeder Button öffnet sein Anlege-Panel
  (Task/Deal/Notiz in ihrem Tab, **Mail** = neuer Block `MailComposer` im Kommunikation-Tab).
- [x] **Deals global erweitert** — `DealDraft` + `name` + `product`; `NewDealCard` mit Deal-Name-Feld
  + Produkt-Dropdown (`DEAL_PRODUCTS` + „Eigenes Produkt…"). Anzeige mitgezogen (DealsListe-Karten,
  DealSetup). *Pipeline (ScreenHunting) nutzt lead-gebundenen `dealValue` — separater Mock, unberührt.*
- [x] **Empty States für alle Hunter-Tabs** (ScreenHunting) — Leads (+Button), Signals, Follow-ups,
  Neu in Pipeline, leere Kanban-Spalte (+„Deal anlegen"). `shared/EmptyState` (description optional).
- [x] **Globale Regel: Hover-Aktionen** — Edit/Löschen/Copy nur bei Hover (`HOVER_ACTIONS` in
  `lib/componentBehavior.ts`); app-weit angewandt + in CLAUDE.md verankert.
- [x] **Globale Regel: Icon-Tooltips** — neuer `shared/TooltipLayer` (portal, sofort, getönt) +
  `data-tip` auf allen Icon-Buttons; in App.tsx gemountet, in CLAUDE.md verankert.
- [x] **Neue panel-blocks:** `TaskFormular` · `DealsListe` · `MailComposer` (+ `shared/TooltipLayer`) —
  in Barrel + CLAUDE-Tabelle. **`npm run audit` um Inline-Code-Check erweitert** (warnt bei >20-Z.-
  JSX-Blöcken in features/screens, die einen panel-block duplizieren).

### Phase 2 — Hunter-Vollansicht (Branch `feature/phase-2-hunter`) — Session 2026-06-15

Kontakt-**Vollansicht** als echte Seite + **Details-Tab** (Attio/Clay-Stil). Alles Mock/Design,
**kein DB-Wiring**. Build grün · Audit 0 FAIL durchgehend.

- [x] **Vollansicht über ↗** — `HunterSidepanel` bekam Prop `variant: 'panel' | 'full'`. Derselbe
  Body (Fragmente `identityBlock`/`statusBadgesInner`/`contactPill`/`tabNav`/`tabContent`) rendert
  als 820px-Sheet **oder** als Vollseite. ↗ oben rechts im Info-Panel öffnet die Vollseite; in der
  Vollseite ist ↗ aus, ← geht zurück zum Panel (Sheet wird ausgeblendet), ✕ schließt ganz (`onExit`).
- [x] **Echte-Seiten-Mechanik** — ein Scroll-Container (nativer Scrollbalken, kein Panel-Inner-Scroll);
  Topbar-Leiste entfernt → dezente Steuer-Zeile (← / ✕); Tabs als seitenbreite **sticky** Leiste;
  Hero (Avatar · Name · ICP · Status/Heat/Stage · Aktionen) randlos in die Seite integriert.
- [x] **Details-Tab** (nur Vollansicht, neuer erster Tab) — alle Kontakt-/Firmen-/CRM-Felder
  (CLAUDE.md → CRM FELDER): Person · Firma · Klassifizierung · Notizen · System (zusammengeklappt).
  **Read-Mode** als Standard (Werte ohne Rahmen), Klick/Stift → **Inline-Edit direkt im Feld**
  (kein Popup, Escape bricht ab), leere Felder → „+ Hinzufügen"-Link. **Copy** bei
  E-Mail/LinkedIn/Web/Domain (+ Toast „Kopiert ✓"). System-Status als **read-only Badges**
  (`HeatBadge`/`StageBadge`/`StatusBadge`). Kontaktdaten in dezenter grauer Sub-Kachel.
- [x] **Telefon-Management** (`DetailPhoneList`) — mehrere Nummern, Favorit-Stern (primär), Typ je
  Nummer, Inline-Edit, Copy + Löschen, „+ Nummer hinzufügen" (neue Zeile auto-fokussiert; bleibt sie
  leer → beim Wegklicken automatisch verworfen).
- [x] **4 neue panel-blocks** (global, prop-driven, Tokens-only, Dark-Mode automatisch):
  `DetailField` · `DetailSection` · `StatusBadge` · `DetailPhoneList`.

### Phase 2 — Hunter-Screen (Branch `feature/phase-2-hunter`) — Session 2026-06-14 (Teil 2)

Nav-Vereinheitlichung, Erledigt-Flow, Popover-Fokus-Fix, AI-Chat-Guardrails. Alles Mock/Design,
**kein DB-Wiring**. Build grün · Audit 0 FAIL durchgehend.

- [x] **Navigation zentralisiert** — neue Quelle `src/lib/navBehavior.ts` (`NAV`): Top-Nav,
  Hunter-/Farmer-Sub-Nav **und** linke Sidebar lesen daraus (einmal ändern → überall). Top-Nav als
  `rounded-full`-Pills (+30px Abstand oben, größere Schrift/Padding), Sub-Navs kompakt (`NAV.subTab`),
  Sidebar-Leiste stärker abgerundet. CLAUDE.md-Regel + Radius-Hierarchie angepasst (Top-Nav = Pill).
- [x] **Erledigt-Aktion** — zentrale `panel-blocks/ErledigtAction` (Button + shadcn Popover mit
  RadioGroup „Was hast du gemacht?" + immer sichtbares Notizfeld). Einmal in `ChatActionPanel`
  (bei der AI-Empfehlung) → erscheint in allen Action-Panels (Signal/Stagniert/Kalt). shadcn
  `radio-group` ergänzt. Mock.
- [x] **Popover-Fokus-Fix (systemweit)** — `ui/popover` bekam `portal`-Prop; Eingaben in Popovern
  innerhalb modaler Sheets verlieren sonst den Fokus (Radix-Fokusfalle → kein Tippen). Kontaktfelder
  (`EditableInline`/`PhoneField`) + Erledigt-Notiz auf `portal={false}`. **Neuer Audit-Check**
  „Popover-Eingabe fokussierbar" (FAIL) + CLAUDE.md-Regel.
- [x] **AI-Chat Guardrails & Restriktionen** dokumentiert (CLAUDE.md §9): Secrets/Code/Tenant nie
  leaken, Prompt-Injection-Resistenz, Function-Allowlist, PII/DSGVO + **Red-Team-Gate**
  (`npm run redteam`, Phase 7) als Merge-Gate. CHECKLIST-To-dos ergänzt.
- [x] **knowledge_base** — `value`-Feld verpflichtend kundenorientiert/Pitch (CLAUDE.md-Regel +
  `docs/knowledge_base.md` Leitlinie); 5 Bestands-Einträge umformuliert.
- [~] **Vollansicht** — Token-Cleanup + panel-blocks-Komposition gebaut, dann **bewusst verworfen
  und gelöscht** (wird neu gebaut, siehe Offen 0). Netto entfernt.

### Phase 2 — Hunter-Screen (Branch `feature/phase-2-hunter`) — Session 2026-06-14

Komponenten-Struktur, AddSdrLeadPanel, Heat-System, Badges, Snooze. Alles Mock-Daten,
**kein DB-Wiring**. Build grün · Audit 0 FAIL durchgehend.

- [x] **Komponenten-Struktur** eingeführt + als CLAUDE.md-Pflicht verankert:
  `panels/` (InfoPanel 820 · ActionPanel 50vw, reine Shells) · `panel-blocks/` (wiederverwendbare
  Blöcke) · `features/[modul]/` (Kompositionen). „Jede neue Komponente sofort in die Struktur."
- [x] **AddSdrLeadPanel** — „+ SDR Lead hinzufügen" von Popup → **Action-Side-Panel** (50vw)
  neu gebaut, komponiert aus `panel-blocks/` (`PanelField` · `PhoneNumbersField` · `NewDealCard`).
  **Progressive Disclosure** (Stufe 1 Pflicht: Owner·Vorname·Nachname·E-Mail/LinkedIn·Firma →
  Stufe 2 „Weitere Details" → Stufe 3 optionaler Deal). Stage↔Deal-Kopplung mit Hinweis-Banner.
- [x] **Heat-Status neu** — Labels Engaged/Warm/Cooling/Cold/Gone, zentral in
  `src/lib/constants.ts` (`HEAT_STATUS` + Bridge `heatFor` vom Enum). Farb-Tokens
  (`--color-success/-warning-soft/-warning/-info/-muted`, Light+Dark). App-weit ersetzt;
  Dot-Kreis statt `●`. Rot bleibt ausschließlich Warnungen (Stagnation/überfällig).
- [x] **`HeatBadge` + `StageBadge`** (`panel-blocks/`) — kein Border, Hintergrund 10% Opacity
  (`color-mix`), Dot 8px + Text gleiche Farbe, `rounded-full`. App-weit verdrahtet (HunterCard,
  Leads-/Pipeline-Tabelle, Übersicht, Farmer, CustomerDrawer). **Audit-Check** „keine alten
  Heat-Labels" (Kalt/Stabil/Rückläufig/Ruhend/Hot/Lukewarm/Dead → FAIL; „Aktiv" bewusst
  ausgenommen). **CLAUDE.md Badge-Regel** (kein Border für Badges).
- [x] **Snooze** — Regelwerk + `system_config`-Keys in CLAUDE.md dokumentiert. 3 Zustände
  **interaktiv** in den Follow-up-Kacheln (`FollowUpKaltCard`, Mock-State): Normal (Dropdown
  Morgen/3T/1 Woche) → gesnoozed (gedimmt, Countdown, Reaktivieren, Zähler) → Limit (rote
  Eskalation). Settings-Sektion `SnoozeSettings` (Design, noch nicht gemountet).

### Phase 2 — Hunter-Screen (Branch `feature/phase-2-hunter`) — Session 2026-06-12

UI-Vereinheitlichung & Komponenten-Standardisierung (alles Mock-Daten, **kein DB-Wiring**).
Build grün · Audit 0 FAIL durchgehend. Draft-PR #12 offen (nicht gemergt).

- [x] **Design-Etappen 1–6**: Header „Hunter", aktiver Tab Gradient, **673 Hex → CSS-Tokens**,
  Emoji → Lucide/Dots, Avatare app-weit rund, **alle UI-Strings → i18n** (`hunter.*` in
  de/en/es; en/es = DE-Kopie bis Phase 4)
- [x] **Einheitliches Kachel-System** — neue geteilte Komponente
  `src/components/shared/HunterCard.tsx` + `src/lib/componentBehavior.ts` (EINZIGE Quelle der
  Werte: `CARD` = Lead-Kachel-Referenz, `ACTION_ROW` = Neu-in-Pipeline-Referenz). **ALLE**
  Profilkarten nutzen sie: Übersicht · Signals · Neu in Pipeline · Follow-ups · Pipeline-Task-
  Liste (Leads = Referenz; Kanban-Mini-Karten bauartbedingt separat). Identische Top-Row,
  Badge-Größe, Breite, Ausrichtung; Chevron → Kurzansicht (KI Kurzakte + Deal Details +
  Aktionen + Kommunikationskette); grüner Pfeil → 820px Info-Panel — überall gleich.
  **CLAUDE.md-Pflichtregel verankert** („Kacheln immer HunterCard + componentBehavior").
- [x] **Side Panels**: `SignalActionDrawer` neu (580px, props-driven, `initialDraft`-ready,
  nutzt `ui/sheet`-Shell wie Kontakt-Panel) · ContactCold/NoTask/PipelineStagnated auf
  `ui/sheet` migriert (slide-in, Radix-Backdrop, custom-scrollbar, X/Backdrop/Escape)
- [x] **PipelineStagnatedDrawer auf Spec-Flow** (§1.3/§4.2): „Stage wechseln zu"-Pills +
  „Speichern + Stage wechseln"/„Nur Task speichern"/„Ignorieren" *(bereits in dieser Session
  umgesetzt, Commit `6f81f83` — ggf. nur noch Feinschliff offen)*
- [x] **shadcn**: Regel verschärft (Primitive bevorzugen); Composer- + Deal-Dropdown → `ui/select`
- [x] **Dark Mode app-weit token-sicher** — alle hardcodierten Farben → CSS-Tokens
  (`bg-white→bg-app-surface`, `text-gray-*→text-text-*`, Semantik → Signal-Tokens; neue fixe
  Tokens `--on-accent`/`--inverse-surface`/`--scrim`). **shadcn-Farbnamen** (`background`/`card`/
  `popover`/`muted`/`accent`/`primary`/…) in `@theme inline` auf unsere Tokens gemappt →
  `ui/`-Primitive adaptieren Dark Mode automatisch.
- [x] **Token-Enforcement** — neuer Audit-Check „Design: nur Token-Farben" (`scripts/audit.ts`):
  **FAIL** bei `bg/text/border-white|black|gray-*` oder Hex in `.tsx` → Commit blockiert.
  CLAUDE.md-Regel: AI-Studio-Imports vor erstem Commit tokenisieren, Audit muss grün sein.

**Offen (nächste Session) — siehe unten „Offen / Nächste Schritte".**

### Phase 1 — Datenschicht (Branch `feature/phase-1-datenschicht`)

12 SQL-Migrationen unter `supabase/migrations/` — **nur geschrieben & committet, nicht
ausgeführt** (Option a). Live-Anbindung folgt, sobald `.env.local`-Creds stehen.

- [x] **001–009** alle Tabellen feldgenau nach `db_schema_v3` (33 Tabellen): organizations/
  users · contacts/companies · campaigns/sequences/leads · messages/signals/deals ·
  tasks/notes/lists · automation_rules/sequence_rules/settings/audit_log · mailboxes/
  blacklist/churn_rules/upsell_rules/user_permissions/daily_briefings/scheduled_tasks ·
  Billing (plans/limits/subscription/credits/addons) · AI-Chat (sessions/messages/dashboards)
- [x] **010** `update_updated_at()`-Trigger (alle Tabellen mit der Spalte) + generischer
  `audit_write()`-Trigger auf den Kern-Entitäten
- [x] **011** RLS auf allen 33 Tabellen + Policies; `auth_org_id()`-Helper statt Inline-
  Subselect (vermeidet RLS-Rekursion); Sonderfälle organizations/plans/plan_limits/
  blacklisted_domains/chat_messages
- [x] **012** Settings-Seed (Demo-Org) mit allen Schwellenwerten: Heat-Tage, Pipeline-Stages
  (Slug+Probability, top-level), Churn (zweischichtig), Soft-Bounce-Retry, Mein-Tag-Top-5,
  Sending-Defaults, Follow-up 3/7
- [x] `lib/db.ts` um Query-Helper erweitert (getContacts/getDeals/getSettings/getModules,
  Keyset-Pagination, org_id immer, null-tolerant)
- [x] **Build grün · Audit 0 FAIL** (DB-Checks aktiv: org_id/RLS/CASCADE PASS)

**Kanonische Abweichungen vom Paket-Entwurf (Konflikt-Regel angewandt, geflaggt):**
Tabellenname `deals` (nicht `pipeline_deals`) · Churn zweischichtig (nicht flach) ·
Modul-Keys = kanonische `useModules`-Keys · `pipeline_stages` top-level · `auth_org_id()`-RLS.

**Offen:** Migrationen ausführen + lib/db live schalten (wenn Creds da) · CLAUDE.md-Prosa
`pipeline_deals` → `deals` angleichen (Rest-Widerspruch).

---

### Phase 0 — Fundament (Branch `feature/phase-0-fundament`)

Erstes Bau-Paket: Layout, Auth, Tokens, Hooks, Panel-Shells, Cmd+K, Primitives, Login.
Keine Geschäftslogik. AI-Studio-Code als visueller Ausgangspunkt, vereinheitlicht.

- [x] **1 Setup:** Branch + `react-router-dom` & `@supabase/supabase-js` installiert
- [x] **2 Tokens:** bestehendes (kanonisches) Token-System behalten + `--shadow-panel` ergänzt
- [x] **3 Auth:** Supabase-Client in `db.ts` (env-tolerant, `createClient` audit-konform nur dort),
  `auth.ts` echte Supabase-Auth, `useAuth`, `.env.example`, `.gitignore` `.env*`
- [x] **4 useModules:** `hasModule()`, kanonische ModuleKeys, Phase-0-Default alle aktiv
- [x] **5 Dark Mode:** vorhandenes `useTheme` + FOUC-Guard (bereits erfüllt)
- [x] **6 Shell:** Router-Routing `/app/*`, TopBar (4 Pills, Sliding-Pill), Sidebar (8 Icons),
  ComingSoon-Platzhalter, Protected-Route (Phase-0-Dev-Bypass ohne Backend)
- [x] **7 Panel-Shells:** InfoPanel (820, nur X), ActionPanel (580, auto-close + Toast), Toast-System
- [x] **8 Cmd+K:** CommandPalette (cmdk), Navigation + Quick-Actions, globaler Shortcut, kein AI-Chat
- [x] **9 Primitives:** Badge · Avatar · EmptyState · SignalRow
- [x] **10 Login:** funktionaler Login (signIn/Loading/Inline-Fehler/redirect) + `ui/input.tsx`
- [x] **DoD:** build grün · 0 Hex im Code · 8 Sidebar-Icons · 4 TopBar-Punkte · 6+1 Routen ·
  Panels öffnen/schließen · Cmd+K ohne AI-Chat · i18n via `t()` (nur DE gepflegt) · Audit 0 FAIL

**Offen:** Login mit echtem Test-User erst verifizierbar wenn `.env.local` (Supabase-Creds)
gesetzt ist — Code ist funktionsfähig, greift dann automatisch.

---

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
- [x] **PR #7 squash-gemergt → `main`** (i18n-Code + alle Referenz-/Doku-Arbeit), Vercel-Preview grün.
- [x] **PR #8 squash-gemergt → `main`** (i18n-Gerüst-Notiz). Beide Feature-/Chore-Branches gelöscht.
- [x] **`main` sauber + synchron** (`d19a808`), Build-Gate grün. Nächste Arbeit wieder per Feature-Branch.

**Offen / getrackt:** `personalityColors`-Token in `theme.ts` umbenennen (CHECKLIST) ·
EN/ES übersetzen (Phase 4) · restliche Screens auf `t()` migrieren · noch offene Entscheidungen
(#1 Heat-Schwellen, #5 Upsell-Trigger, #19 CRM-Sync, #34 Sherloq bidirektional,
#36b Video-Provider, #35 Hunter/Farmer-Prompts).

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
