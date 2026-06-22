# Sales OS — Progress Tracker

> Update this file at the end of every session. Read it at the start.

---

## Current Status: Phase 3 (DB-Wiring Hunter) — Panel/Tabs · P8 · Telefon · P7 Kommunikation · Stagnation/Heat Edge Functions · Pipeline Task-Liste ✅ · **Action Panels verdrahtet** (Signal- + Kalt-Opener mit echten Daten, AI-Platzhalter [D5]) · **Details-Tab + Kontakt-Inline-Edit schreiben echt** (Migr. 039) · **Aufgeklappte Kachel echt** (Deals+Kommunikation lazy, Stagnations-Warnung, Icon-Konsistenz) → alles auf `main` (`8d33001`). Next: **[D27] Tech-Schuld** · Auth/Org [D21] · Realtime (Phase 5)

> **Session 2026-06-22 — fertig (auf `main`, `8d33001`; Spanne `8011f49..HEAD`):**
> **Signal- + Kalt-Opener echt** verdrahtet: `signalToActionData`/`contactToColdPerson`/`ColdPersonData`/`SignalActionData` (hunterMappers), `LinkedinSignalCard` „Antworten"→`SignalActionDrawer`, Kalt-Sektion (Follow-ups, `getContacts({heatStatus:'kalt'|'tot'})`)→`ContactColdDrawer`. **`ChatActionPanel` AI-noch-nicht-da-Modus** (recommendation/draft nullable → „Folgt"-Platzhalter, disabled „Draft generieren", Chat-Footer aus). PROGRESS [D5] aktualisiert.
> **Details-Tab + Kontakt-Inline-Edit schreiben echt:** `updateContact`/`updateCompany` (db.ts), Migr. **039** (`salutation`/`language`/`department`/`twitter_handle`), Seed aus DB, `DetailField.validate` (E-Mail/URL → roter Rand, kein Write), `contact_status` Single-Source (`CONTACT_STATUS_LABEL` Dropdown==Badge), E-Mail-Verifiziert-Mock entfernt, Deep-Link Panel-Stift→Vollansicht-Feld (`initialFocusField`/`autoEdit`).
> **Aufgeklappte Kachel echt** (HunterCard + LeadListRow): lazy Queries (Deals/Kommunikation/Stages), KI-Kurzakte-Platzhalter [D5], **`CommunicationChain` auf echte `communications`** (Hover-Tooltip) + Legacy-Mock-Fallback (Farmer), zweispaltig (gleiche Höhe), Action-Icons in Chevron-Zeile, **Deep-Links** Task/Notiz/Deal-Edit (`initialDealEditId`), `contactId` durch alle 6 Wrapper.
> **Stagnations-Warnung am Deal:** `StagnationHint` (AlertTriangle/Token-Rot) + `stagnationFlag` (Schwelle aus settings) — DealsListe compact/detail, Pipeline-Liste; `DealView.stagnationDays`/`PipelineRow.stagnationDays`.
> **Tab-Icons als Single Source** (Panel+Vollansicht): Übersicht=LayoutDashboard · Aktivität=Activity · Kommunikation=MessageSquare · Tasks=CheckSquare · Deals=Briefcase · Notizen=FileText · Details=Tag — Icon-Konsistenz überall durchgezogen (Notizen→FileText, Tasks→CheckSquare, kein Plus mehr).
> **Neu in Library:** `StagnationHint` (panel-blocks). **KB 040** (Signal-Opener · Kalt-Reaktivierung · Stagnations-Warnung + Update „Kontakt-Details") — **nicht gepusht**.

> **Session 2026-06-21 — fertig (auf `main`, `8785da2`; Spanne `20ca624..HEAD`):**
> **Kanban-Optik** überarbeitet (graue Lanes, weiße Kacheln, ← / Auge / → -Aktionen, KPI-Übersicht volle Breite + Filter-Disclosure; KB 033). **Won/Lost Notiz+Grund** (Migr. **034** `lost_note`/`won_reason`/`won_note`, `DealWonModal` nicht-blockierend mit Auswahl+Notiz, Abschluss-Box unten auf der Kachel, `DealLostModal` dismissbar). **Performance & Signal-getriebene-UI-Regeln** in CLAUDE.md + 4 Audit-Perf-Checks (N+1 FAIL · staleTime/SELECT*/Edge-Timeout WARN) + Structure-Check (CREATE TABLE ohne INDEX → WARN).
> **Stagnation (`score-deal-health`):** Edge Function (`deals.stagnation_days` aus `stage_updated_at`), Cron **035** (Vault-Methode), Stage-Trigger (fire-and-forget); später bereinigt → schreibt **nur** `stagnation_days`, **kein** `heat_status` (Konzept-Trennung).
> **Kommunikation protokollieren (P7):** Migr. **036** `communications` (RLS, Indizes, `audit_write`, Trigger `bump_contact_last_contacted` = `last_contacted_at` nur vorwärts), `getContactCommunications`/`createCommunication`, **Kommunikations-Tab** (`KommunikationVerlauf` echt) + **`KommunikationLogModal`** + **`KommunikationKompakt`** (Übersicht-Block), Manuell-Badge, occurred_at-Sortierung/Vorschau, „Ausstehend" für Zukunfts-Termine. **Neu-in-Pipeline** + **LeadListRow** auf `last_contacted_at` („Letzter Kontakt"/„ZULETZT", „vor 0 Tagen" unterdrückt); **LeadListRow** komplett auf `typo-*`-Primitive + im Audit-Scope.
> **Pipeline Task-Liste:** `dealToStagnatedCard`/`dealToNoTaskCard`, `PipelineStagniertCard`/`PipelineKeineTaskCard` von Mock → prop-getrieben (leer→`null`), aus `getDeals` abgeleitet (Schwelle aus settings, keine-Task = `tasks.length===0`); Badge-Zähler echt; `['deals']`-Invalidierung nach Task-Anlegen → Kachel verschwindet; **Deal vorausgefüllt + readonly** im Task-Formular (`lockDeal`/`initialDealId`); Mock-Drawer + `focusedTask` entfernt.
> **Heat (`score-heat-status`):** Edge Function (`contacts.heat_status` aus `last_contacted_at`, Schwellen aus `settings.thresholds.heat_status`, NULL→übersprungen), Cron **037**, fire-and-forget-Trigger nach `createCommunication`. **Deployed.**
> **PROGRESS:** [D22] Cron · [D23]/[D24] Webhook Actions + org-AI-Prompts · [D26] Komm.→KI-Kurzakte · [D27] Tech-Schuld. **KB 038** (Kommunikation protokollieren · Pipeline Task-Liste · Heat-Automatik) geschrieben — **nicht gepusht**.

> **Session 2026-06-18→20 — fertig (Merge-Commit `22c3cad`):**
> **820px-Info-Panel verdrahtet (P1–P5c):** Kopf (P1, zentrale `contactToProfile`/`contactActiveStage`-Leitung) · Kontaktzeile (P2) · Tasks-Tab read+anlegen/abhaken/soft-delete (P3/P3b) · Notizen read+anlegen/edit/soft-delete (P4/P4b) · Deals-Tab read+anlegen+bearbeiten+soft-löschen, Owner/Stage/Probability, Vertragsfelder (P5a–P5c, Migr. 028/029/030) · zentraler **`dealToView`**-Resolver · Übersicht-Tab echt (KPIs+Funnel) · Aktivität-Tab echt (audit_log) · Pipeline-Listenansicht echt · Typo-Kanon (zentrale `typo-*`-Primitive + Audit-Gate) · Single-Source-Audit-Check.
> **P8 — Stage-Write + Abschluss:** Terminal-Slugs Single-Source ([P8-2a], `WON_/LOST_STAGE_SLUG`+`isTerminalStage`) · Stage-Wechsel überall (Kanban ← / →, Stage-Badge-Dropdown in Liste/Deals-/Übersicht-Tab) → `updateDealStage` · **Won/Lost** ([P8-3]: `updateDealWon` mit `closed_at`+Konfetti, `DealLostModal` mit Pflicht-Grund → `updateDealLost` mit `closed_at`+`lost_reason`; `DealCloseModal`-Popup am letzten Kanban-Pfeil) · Won-Hervorhebung (grüner Rand + „Gewonnen"-Badge) · Cache-Invalidierung einheitlich inkl. `dueTasks`/`signals` ([P8-4]). Kein Won/Lost-DB-Feld erfunden — `closed_at`/`lost_reason` aus Migr. 004.
> **Telefon PH1–PH4:** `contact_phones` (Migr. 026) read (`contactToProfile.phones`, Embed in `getContactDetail`) → write (`createContactPhone`/`updateContactPhone`/`setContactPhonePrimary`/`deleteContactPhone`, Favorit Constraint-sicher, Hard-Delete) → Validierung (`lib/validation.ts`, Telefon verdrahtet; E-Mail/URL vorbereitet für P8) → **Legacy `contacts.phone` entfernt** (Code + Migr. **031** drop, noch nicht gepusht).
> **Merge:** `feature/phase-2-hunter` → `main` via `--no-ff` (`22c3cad`), Gates grün, Vercel-Prod baut.

> **Session 2026-06-17 (Teil 2) — fertig:** Neu-in-Pipeline read-verdrahtet (`getNewInPipeline`/`dealToNewPipelineRow`, Zeitfilter heute/7T/30T, Herkunft AI-SDR/Manuell via `source_lead_id`, [D18]) · **Task-System:** Migration 021 (composite Indizes org+due_at/deal/contact), 022 (`tasks.channel`), 023 (fällige Test-Tasks-Seed) · Follow-ups-Tab von Heat-Cold/Gone **auf fällige Tasks** umgestellt ([D17] entschieden: `getDueTasks`/`taskToDueCard`) · **Task abhaken = erster echter Write** (`completeTask`, T4a, invalidate-on-success) · Reminder ausgegraut ([D19]: Feld+System fehlen) · Panel-Thema (B) konsolidiert (T4b Anlegen + Deeplink + Pipeline-Task-Liste + Stagnation gebündelt). Task **Anlegen** (T4b) bewusst zum Panel-Bau verschoben.

> Single Source of Truth für den Umsetzungsstand: **CHECKLIST.md** (`npm run audit` prüft).
> CLAUDE.md = WARUM/WIE · CHECKLIST.md = WAS-offen · PROGRESS.md = Session-Historie.

> **i18n-Gerüst steht, EN/ES-Befüllung in Phase 4.** Bis dahin: alle UI-Texte konsequent
> über i18n-Keys (`t()`), nichts hardcoden, nur Deutsch pflegen. (Bewusst geplant, kein Bug.)

---

## Offen — Nächste Session (Phase 3 DB-Wiring, Reihenfolge)

> **Stand 2026-06-21:** Das Panel-Thema (B) ist verdrahtet, **P7 Kommunikation** + **Stagnation/Heat Edge Functions** sind gebaut & deployed, **Pipeline Task-Liste** ist echt. Reihenfolge ab jetzt:
> 1. **db push am Sessionstart:** Migration **037** (Heat-Cron) ist gepusht; **038** (knowledge_base) **noch offen**. Vault-Secrets (`app_supabase_url`/`app_service_role_key`) für die Crons setzen, falls noch nicht.
> 2. **Action Panels** komplett verdrahten (letzter großer Hunter-Block) → danach **[D27] Tech-Schuld** abarbeiten (window.confirm→AlertDialog · Typo-Kanon vervollständigen · Inline-JSX extrahieren).
> 3. **[D21] Auth/Org** — `owner_id`/`created_by`/`user_id` auto-setzen (Activity-„Wer", Owner-Default, Heat-Cron je echter Org statt fixer Demo-UUID).
> 4. **Realtime (Phase 5)** — `lib/realtime.ts` aktivieren statt nur Query-Invalidierung.
> 5. **[D23]/[D24]** Webhook Actions + Rule Builder + org-spezifische AI-Prompts (nach Settings/Auth).
> Die folgenden Detail-Notizen (B0–B5) sind historischer Planungskontext — die meisten Punkte sind erledigt.

**~~A. Pipeline-Tab~~ ✅ erledigt** (Liste/Kanban/Filter/Owner, Session 2026-06-17). Offen bleibt dort
   nur die **Task-Liste-Ansicht** (→ Panel-Thema **B4**, [D13]) + **Stage-Writes/Stagnation** (→ **B5**, [D8]/[D9])
   — an Panel-Wiring + Edge Functions gebunden.
**B. PANEL-THEMA — Info-Panel (820px) + Action-Panel** (`HunterSidepanel`). **← nächster großer Block.**
   Sammelpunkt für ALLES, was bewusst hierher verschoben wurde — beim Panel-Bau zusammen umsetzen,
   damit nichts doppelt angefasst wird.

   **B0 — Info-Panel-Felder:** `contacts`/`companies`-Felder (CRM-Felder) + Tabs
   (Kommunikation/Aktivität/Tasks/Notizen/Deals) an echte Tabellen hängen.

   **B1 — Task ANLEGEN (T4b, bewusst hierher verschoben):** Das „Neue Task"-Formular (`TaskFormular`)
   lebt im Panel (Action-Panel). Wird **zusammen mit dem Panel-Wiring** gebaut (kein doppeltes Anfassen);
   bis dahin bleibt das Formular **Mock (kein Persist)**. **Vorbereitet & wartend:** `createTask` (db.ts)
   inkl. `channel` (+ `mail→email`-Mapping), `due_at`-Komposition (Datum+Uhrzeit), `source='manual'`,
   `assigned_to = NULL` (vorerst) — nur die Panel-Anbindung fehlt. **Kontakt-Feld:** vorbefüllt aus
   Kartenkontext + änderbar; Ziel ein **echtes durchsuchbares Auswahlfeld** („ein Formular für beide
   Wege" — kontextbasiert **und** frei). _(Abhaken T4a ist bereits **fertig**: echter Write `completeTask`.)_

   **B2 — Task-Datenmodell (GELOCKT):** Eine Aufgabe hängt **immer am Kontakt** (`contact_id`, Pflicht),
   **Deal optional** (`deal_id`, nullable) — im Anlege-Formular wählbar. Die Tabelle unterstützt das
   bereits. Begründung: deckt **menschbezogene** (kein Deal) **und geschäftsbezogene** Aufgaben ab; bei
   Kontakten mit mehreren Deals macht die Deal-Zuordnung die Aufgabe **eindeutig**. Entspricht klassischem
   CRM (SF/HubSpot: *who* + optional *what*) und modernen, kontaktzentrierten Execution-Tools.

   **B3 — Karten-Deeplink:** Klick auf eine Karte öffnet das Panel **direkt am kontextrelevanten Tab**,
   nicht generisch. Follow-up-/Task-Karte → **Task-/Aktivitäts-Tab** mit Kontext, **welche** Task
   (Task-ID durchreichen). Analog andere kartenspezifische Einstiege (z.B. Signal-Karte → relevanter Tab).
   Heute öffnet `onSelectLead`/`onOpenInfo` nur generisch (Tür sichtbar, Deeplink-Kontext fehlt noch).

   **B4 — Pipeline-Task-Liste** (Pipeline-Tab, „Task Liste"-Ansicht; ersetzt [D13]) — **kommt mit dem
   Panel + Stagnations-Berechnung (B5)**, zwei Fälle:
   - **„Stagniert"** → Warnhinweis + KI-Vorschlag; Klick öffnet **Action-Panel**. Braucht die
     Stagnations-Berechnung (B5) **und** den KI-Vorschlag (noch nicht gebaut).
   - **„Deal ohne offene Task"** → Klick öffnet **Anlege-Panel**. **Aus Daten ableitbar**
     (`getDeals` open-filtert `deal.tasks` → `length === 0`); `openTaskCount` auf `PipelineRow` noch zu ergänzen.
   - **Definitionen (bestätigt):** Follow-ups = **fällige** Tasks (`completed_at IS NULL AND due_at <= now()`);
     Pipeline-Task-Liste = **alle offenen** Tasks (`completed_at IS NULL`, Fälligkeit egal).
   - **Testdaten-Hinweis:** die Seed-Tasks (023) haben `deal_id = NULL` → für die **Deal-bezogene** Ansicht
     werden **Deal-verknüpfte** Test-Tasks gebraucht (Deal-UUIDs liefert der User via SQL-Editor, RLS-bedingt).

   **B5 — Stagnations-Berechnung ([D4]/[D9], Voraussetzung für B4 „Stagniert"):** Regel „Deal länger als
   X Tage/Wochen in einer Stage" — Schwellwert **pro Org konfigurierbar** (`settings`), erzeugt den
   „Stagniert"-Warnhinweis. **Noch nicht gebaut** (Edge Function / Berechnung).
   ⮑ **Übersicht-KPI „Deals in Gefahr / stagniert" — bewusst entfernt, kommt mit B5 zurück:** Die Kachel
   wurde aus der Hunter-Übersicht entfernt (kein Fake-Wert); aktuell bewusst **3 KPI-Kacheln**. Mit der
   Stagnations-Berechnung kehrt sie an ihren Platz zurück → Kachel-Reihe dann wieder **4-spaltig**.

   **B6 — Panel read-Slices (Reihenfolge, regelunabhängiger Teil):**
   - **P1 — Kopf (read) ✅ (2026-06-18):** echte `contact_id` aus allen Karten durchgereicht; `getContactDetail`
     (contact + company + deals-Embed); Kopf (Name/Jobtitel/Firma/Initialen/ICP/Heat/Status/Stage) **nur** über
     `contactToProfile`/`contactActiveStage` — **Heat-Bug (hardcodiertes „Aktiv") behoben, keine Literale mehr**.
     Stage-Dropdown zeigt echte Stage, **noch nicht schreibend** (Tür → P8). Loading/Empty-State.
   - **P2 — Kontaktzeile (read):** email/phone/linkedin/web aus `contacts`.
   - **P3 — Tasks-Tab:** read (`getTasksByContact`) + **+Task** (`createTask`, prefill) + **complete** (`completeTask`, da)
     + **soft-delete** (P3b: `softDeleteTask` → `tasks.deleted_at`, Migration 025; alle Task-Queries filtern `deleted_at IS NULL`).
     ⮑ **Soft-gelöschte Tasks bleiben via `deleted_at` erhalten** → Grundlage für die geplante **Aufgaben-Historie**
       (Aktivität-Tab) + **Statistik** (erledigte/gelöschte über Zeit). Wiederherstellen-UI später, harte Löschung nicht vorgesehen.
   - **P4 — Notizen-Tab:** read + **+Notiz** (`notes`-Insert).
   - **P5 — Deals-Tab:** **P5a (read) ✅** (`getDealsByContact`; arr/mrr entfallen, close=closed_at/end_date).
     **P5b (Deal anlegen) → offen** (`deals`-Insert, einfacher User-Write; Owner = [D21]).
   - **Produkt-Katalog ✅ ENTSCHIEDEN + Tabelle angelegt (Migration 028):** eigene **`products`**-Tabelle
     (Stammdaten je Org: id/org_id/name/description?/is_active/created_at/updated_at) + RLS/Audit/Index + **Seed
     der 6 Defaults** (Starter/Growth/Scale/Enterprise/Enrichment Add-on/Signals Add-on) für die Demo-Org.
     **NICHT** `system_config`/`settings` (Stammdaten, kein Schwellenwert). **`deals.product` (Freitext) bleibt
     vorerst** — **P5b** speist das **Dropdown aus `products`** und schreibt den **gewählten Namen** in
     `deals.product` (→ konsistente Werte). **Spätere Option (nicht jetzt):** `deals.product_id` FK + Daten-Migration
     für saubere Auswertung „welches Produkt wie oft" · Produkt-**Verwaltung** (CRUD) später.
   - **P6 — Übersichts-Blöcke:** Deal-Setup/Offene-Tasks/Komm-Vorschau **echt** (aus geladenen deals/tasks/messages);
     **KI-Kurzakte/Aktive-Signale/Active-Sequence bleiben deferred (Gruppe B)**.
   - **P6 ✅ Honesty-Pass Übersicht (2026-06-19):** Übersicht zeigt nur echte Daten. **Verdrahtet:**
     **Offene Tasks** echt (`getTasksByContact`, nur offene; fällige=`due_at≤heute` orange; keine → Sektion
     erscheint nicht) + **Aktive Signale** nur real ableitbar: „Stagniert XT in Stage Y" **nur wenn
     `deals.stagnation_days > 0`** (Edge Function `score_deal_health` fehlt → bleibt 0 → kein Signal) ·
     „Keine Task hinterlegt" (aktiver Deal + 0 offene Tasks). **Ausgeblendet + hier dokumentiert (kein Mock):**
     **KI-Kurzakte** → KI-Pipeline (`kurzakte_entries` + `analyze_*`) · **Active Sequence** → `contact_sequences` ·
     **externe/LinkedIn-Signale** → Signal-Quelle (`signals`/Webhook) · **Kommunikation** (Tab + Übersicht-
     Vorschau + Footer-„Mail" + `MailComposer`) → **P7** (Quelle fehlt: keine `messages`-Read-Query/kein
     Zufluss). **Aktivität-Tab bleibt sichtbar** (eigene nächste Scheibe = Audit-Log).
   - **Aktivität-Tab ✅ verdrahtet (2026-06-19):** echter Feed aus `audit_log` (`getActivityByContact` —
     Einträge des Kontakts + seiner Deals/Tasks/Notes über `entity_id`, neueste zuerst, Limit 50; soft-
     gelöschte bewusst mit für die Lösch-Historie). Pro Eintrag: **Was** (lesbar aus `entity_type`+`op`,
     z.B. „Deal erstellt"/„Task aktualisiert"), **Wann** (relativ), **Wer** nur wenn `user_id`/Name vorhanden
     (bei System/AI weggelassen — Honesty, Auth/[D21] offen). Keine Einträge → ehrlicher Empty-State, Default-
     Mock entfernt. **Limitierung (ehrlich):** `audit_write()` schreibt nur `{op}_{table}` (kein Feld-Diff) →
     ein Stage-Wechsel/Soft-Delete erscheint als generisches „aktualisiert". Feinere Labels (Feld-Diff aus
     `metadata`) später möglich.
   - **P7 — Kommunikation:** read aus `messages` (Empty-State); **Versand deferred (Gruppe C)**.
     (Aktuell ausgeblendet — Quelle steht noch nicht: keine Read-Query, kein Parser/Webhook-Zufluss.)
   - **P8 — Panel-Edits (Write):** Kontaktfeld-Inline-Edit (Write auf `contacts`, audit via Trigger) +
     **Stage-Write via Edge Function** (High-Risk: `audit_log` + Stagnation/`stage_updated_at`).
     - **P5c-2b (2026-06-19) — Teil vorgezogen:** Stage ist im Deal-**Create + Edit** wählbar; ein Wechsel
       schreibt über **`updateDealStage`** (setzt `stage`+`stage_updated_at`+`stagnation_days=0`, Audit via Trigger,
       nur bei echtem Wechsel). Probability wird **abgeleitet** aus `settings.pipeline_stages` (nicht `deals.probability`).
     - **NICHT vergessen (Rest P8):** (a) Edge Function `score_deal_health()` für **tägliche** Stagnations-Neuberechnung
       (`stagnation_days` aus `stage_updated_at`) + `deals.heat_status='stagniert'`; (b) Stage-Write auch aus **Kanban-Pfeilen/StageBadge**
       ([D8]) auf dieselbe `updateDealStage`-Quelle verdrahten; (c) terminale Stages (Gewonnen/Verloren) ggf. Won/Lost-Popup (Lost-Reason).
   - **PH — Telefon-Mehrfachnummern + Favorit** (eigenes Thema, Modell-Details in der Diagnose 2026-06-18):
     - **PH1 ✅ (2026-06-18, Migration 026):** Tabelle `contact_phones` (id/org_id/contact_id/number/label/is_primary/created_at)
       + RLS (`auth_org_id()`) + Index `(org_id, contact_id)` + **partial unique** `(contact_id) WHERE is_primary` (max. 1 Favorit)
       + `audit_write`-Trigger + **Daten-Migration** (`contacts.phone` → is_primary-Nummer, idempotent). **`contacts.phone` bleibt Legacy.**
     - **PH2 (Read) + PH3 (Write) → kommen mit P8** (Nummer-Bearbeiten/Favorit-Setzen = Kontakt-Edit-Funktionen):
       `getContactDetail` embeddet `contact_phones`; `ContactProfile.phones[]` + `phone`=Primär (Fallback Legacy);
       `PhoneField`/`DetailPhoneList` verdrahten; `addContactPhone`/`updateContactPhone`/`deleteContactPhone`/`setPrimaryPhone`
       (Favorit **atomar** — partial-unique beachten: andere Favoriten erst zurücksetzen).
     - **PH4 (Cleanup) → nach P8:** Legacy `contacts.phone` droppen, wenn nichts mehr liest.
   - **Deeplink** (`initialTab`, klein, nach P1): Karte → Panel am Ziel-Tab (Task-Karte → Tasks/Aktivität).
   - **Deferred-Gruppen:** **B** = KI-Kurzakte · „Stagniert"/Next-Step · Active-Sequence · Heat-**Berechnung** ·
     Stage-Write. **C** = Mail-Versand (`lib/sending.ts`) · `activity_log`-Tabelle · `products`-Tabelle ·
     `kurzakte_entries`-Tabelle. _(Korrektur: Kommunikations-Historie hat eine Tabelle `messages` → read = A, nur Versand fehlt.)_
     ⮑ **User-Wunsch (Aktivität-Tab / `activity_log` mitdenken):** **erledigte/alte Aufgaben als Historie ansehen.**
       Datenbasis ist bereits da — **soft-gelöschte (`deleted_at`)** und **erledigte (`completed_at`)** Tasks bleiben
       erhalten. Beim Bau des Aktivität-Tabs/`activity_log` diese Task-Historie (erledigt + gelöscht, mit Zeitpunkt)
       mit abbilden.
**C. Realtime** für die Live-Tabellen (`lib/realtime.ts`), Cache-Invalidierung.
**D. Restliche Mock-Screens** (Neu-in-Pipeline/Follow-ups/Overview Top-5) + AddSdrLeadPanel/Snooze (Writes, Edge Functions).
   ⮑ **Beim Wiring: Produktprinzip „Task-getriebene Leere"** (CLAUDE.md → Design Invariants) — diese Bereiche
   erscheinen NUR bei echtem Anlass, sonst komplett leer (keine Kachel/„0"/Fake-Warnung). Ausnahme: Kanban/Liste/Termine
   immer sichtbar. (Hunter **Signals** ist bereits so verdrahtet, S-2.)

> Berechnete Werte (heat/icp/stagnation/last_contacted) bleiben Anzeige bis Edge Functions —
> siehe **„Offene Konzept-Entscheidungen / Deferred Logic"** [D1]–[D13].

<details><summary>Ältere offene Punkte (Phase-2-Reste)</summary>

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

</details>

> **PR #12** (Draft) vorbereiten, aber **NICHT mergen** — auf Freigabe warten.

---

## Offene Konzept-Entscheidungen / Deferred Logic

> **Was das ist:** In dieser Phase (DB-Wiring) zeigen die Screens echte Daten, aber
> manche Werte werden nur **angezeigt**, nicht **berechnet/gesetzt**. Die folgenden
> Punkte sind bewusst aufgeschoben — hier steht je Punkt: **Status heute · Zielphase ·
> Was später zu tun ist**. Eine neue Session liest das beim Start (CLAUDE.md → SESSION START).
> Jeder Punkt hat einen Anker-Tag für `grep`.

### [D21] ⭐ WICHTIG/BALD — Automatische Autor-/Bearbeiter-Erkennung (Auth/Org-Wiring)
> _Bewusst vorne platziert (Priorität), außerhalb der numerischen Reihenfolge._
- **Was:** Sobald die **Auth/User-Zuordnung** sauber steht (Login-Identität **`auth.uid()` ↔ interner `users`-Eintrag**
  eindeutig verknüpft), wird der **handelnde Nutzer automatisch gesetzt** — niemand tippt seinen Namen ein.
- **Betrifft auf einen Schlag:**
  - **`notes.created_by`** (Notiz-Autor — heute **NULL**, P4)
  - **`tasks.assigned_to`** (Zuständig — heute **NULL**, P3)
  - **Stage-Änderungen / künftige Status-Writes** (wer hat geändert)
  - das geplante **Aktivitäts-Log** (lebt komplett von „wer hat was gemacht" — **braucht es zwingend**)
- **Gehört zum Auth/Org-Wiring** (heute noch **Demo-Org-Platzhalter** `DEMO_ORGANIZATION_ID`; vgl. CLAUDE.md
  „TODO Auth→Org" + `[D6]`). **Voraussetzung klären:** Wie ist `auth.uid()` mit `users.id` verknüpft — gibt es
  ein **Mapping / `profiles`-Tabelle / FK** (ist `users.id` == `auth.uid()` oder ein separates Feld)?
- **Warum „bald":** Je weiter wir bauen, desto mehr Stellen sammeln **NULL-Autoren** an, die später nachgezogen
  werden müssten — und das **Aktivitäts-Log** ist ohne diese Verknüpfung gar nicht baubar.

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
- **Update 2026-06-22:** `stagnation_days` (score-deal-health) + `heat_status` (score-heat-status) sind jetzt **echt berechnet** (Edge Functions live). Offen bleibt die **AI-Draft/Recommendation-Pipeline**: `SignalActionDrawer` + `ContactColdDrawer` zeigen `aiRecommendation`, Entwurf, `confidence` und Reaktionsfenster aktuell als **sichtbar markierte „Folgt"-Platzhalter** (grau/kursiv + Badge „Folgt", „Draft generieren" disabled) — **kein erfundener Text**. Echte AI-Drafts + Empfehlungen kommen mit der **AI-SDR-Phase** (Quelle: `messages` status='draft' / AI-Pipeline).

### [D6] Org-Provisionierung von Seed-Konfig (knowledge_base + settings.signal_windows) · Zielphase: SaaS / Onboarding
- **Status heute:** Mehrere produktweit-gleiche Konfig-/Inhaltsblöcke werden per Migration **nur auf die
  Demo-Org** geseedet:
  - `knowledge_base` (org-gescoped, RLS, NOT NULL) — Migrationen 015/016/017.
  - **`settings.signal_windows`** — Migration 018 (`update … where organization_id = Demo-Org`).
  Echte Kunden-Orgs erhalten diese Blöcke **nicht automatisch**.
- **Später:** gemeinsame Provisionierungs-Strategie — **Funktion/Trigger bei Org-Anlage** (kopiert
  Produkt-Defaults in die neue Org) **oder** globale, org-unabhängige Quellen (z.B. `product_knowledge`-
  Tabelle; signal_windows-Defaults als Fallback). Beim Org-Anlage-Mechanismus zentral mitlösen.

### [D7] Deal Owner — echte Auflösung · Zielphase: Team / Rollen-Setup
- **Status (Slice C):** **Owner-Auflösung ist live** — `getDeals` hat das `owner:users(full_name)`-Embed,
  `dealToPipelineRow.ownerLabel` = echter Name (Fallback `„—"` bei `owner_id = null`, kein Fake).
  Owner-Spalte + Owner-Filter laufen darüber.
- **Offen / Vorsicht:** **nur mit EINEM User getestet** — im Seed gehören alle Deals dem Test-User,
  also steht überall sein Name. **Multi-User-Verhalten** (mehrere distinct Owner, Filter über mehrere
  Namen, „nur meine Deals") ist **erst mit Team/Rollen-Setup verifizierbar**. Bis dahin gilt die
  Owner-Kette als funktional, aber nicht multi-user-erprobt.

### [D8] Kanban Stage-Wechsel-Pfeile (←→) · Zielphase: Stage-Write-Slice (Edge Function)
- **Status heute:** Im Kanban (Slice B) **ausgeblendet**. Waren Writes über den Mock-`onUpdateLeadStage`.
- **Später:** Stage-Wechsel als echter Write via Edge Function (Stage + `stage_updated_at`, `stagnation_days=0`,
  `audit_log`-Eintrag). `onUpdateLeadStage` bleibt dafür im `ScreenHunting`-Interface. **Muss mit dem Write-Slice zurück.**

### [D9] Kanban „Deal stagniert"-Signal · Zielphase: Stagnations-Slice
- **Status heute:** Im Kanban **ausgeblendet**. War aus `heatStatus===HOT` **fingiert** (Falschinfo).
- **Später:** echtes Signal aus `deals.stagnation_days` vs. `settings.pipeline_stages[].stagnation_days`
  (berechnet per Edge Function, [D4]). Rot nur bei echtem Trigger. **Muss mit dem Stagnations-Slice zurück.**

### [D10] Kanban „Task fehlt"-Badge · Zielphase: Task-Signal-Slice
- **Status heute:** Im Kanban **ausgeblendet**. War aus `heatStatus===WARM` fingiert.
- **Später:** echtes Signal aus dem Task-Bestand des Deals (`tasks` ohne offene Aufgabe). **Muss mit dem Task-Slice zurück.**

### [D11] Kanban „N Action"/„Im Flow"-Status-Badge (+ Action-Filter) · Zielphase: Signal-/Task-Logik
- **Status heute:** Im Kanban **ausgeblendet** (inkl. `actionFilterCols`-Toggle). War aus Heat fingiert.
- **Später:** echte Aggregation aus den realen Signalen/Tasks der Spalte ([D9]/[D10]). **Muss mit der Signal-/Task-Logik zurück.**

### [D12] Fake-Score-Defaults in Mock-Bereichen · Zielphase: DB-Wiring des jeweiligen Screens
> **Universelle Regel (gilt app-weit):** Fehlt ein Score/Status-Wert (null/undefined) → das Element
> (ICP-Ring, Heat-Badge, Firmen-Block, Stage, Zeit) wird **NICHT gerendert** — **kein** 0/grau-Platzhalter,
> kein erfundener Default. (ICP-Ring in Leads-Tab/Kanban/Signals folgt dem bereits; HunterCard rendert
> ICP/Heat/Stage/Company nur bei Wert.)
- **Status heute:** Noch erfundene Default-Scores in **Mock-Bereichen**:
  - `src/components/screens/ScreenFarming.tsx` ~Z. 233 — `icpScore ?? 87`
  - `src/components/panel-blocks/TaskEntwurfForm.tsx` ~Z. 54 — `icpScore ?? 87`
  - `src/components/features/hunter/SignalActionDrawer.tsx` ~Z. 58 — `confidence ?? 91`
- **Später:** beim DB-Wiring des jeweiligen Screens entfernen → echter Wert oder **Element unsichtbar**,
  **kein erfundener Default**. Mitnehmen, wenn Farmer / Task-Entwurf / Signal-Drawer echte Daten bekommen.

### [D13] Pipeline „Task-Liste"-Ansicht auf echte Daten · Zielphase: Stagnations-/Task-Logik (gebündelt)
- **Status heute:** Die dritte Pipeline-Ansicht („Task-Liste", per Button) läuft **komplett auf Mock**
  (Christian Brand/LogixFlow, „Pipeline stagniert seit 14 Tagen", „Keine Task", Action-/Task-anlegen-Buttons).
- **Abhängig von zwei Fundamenten:** (1) echte **Stagnations-Berechnung** (`stagnation_days` via Edge
  Function, nicht Seed/fingiert, [D4]/[D9]); (2) **Task-Logik** (offene Tasks an Deals erkennen, [D10]).
  Enthält zudem **Writes** (Action / Task anlegen → [D8]-artig, audit_log).
- **Später:** gebündelt mit der Stagnations-/Task-Logik bauen — **dieselbe Logik** speist auch die im
  Kanban ausgeblendete „Deal stagniert"-Pille ([D9]) + „N Action"-Badge ([D11]). Erst bauen, wenn diese Fundamente stehen.
- **Produktprinzip „Task-getriebene Leere"** (CLAUDE.md → Design Invariants): Stagniert-/Keine-Task-Kacheln
  nur bei **echtem** `stagnation_days`/offener Task rendern — keine Fake-/„0 Tage"-Kachel; gibt es nichts, bleibt die Ansicht leer.

### [D14] Signals-Tab Dringlichkeit + Stage · Zielphase: Signal-Urgency-/Action-Slice
- **Status heute:** Im Signals-Tab (S-2) **ausgeblendet** (`showUrgency=false`, `showStage=false` an
  `LinkedinSignalCard`): Hot-Flamme · „Xh left" · Window-Balken · „Xh window" · „Act now"-Button · Stage-Badge.
  Die Elemente sind in der Karte erhalten (Übersicht-Tab nutzt sie weiter), nur im Signals-Tab gegated.
- **Später:** Restzeit/Window aus `signals.created_at` + `settings.signal_windows` (S-0) **berechnen**
  (Config/Edge Function, [D5]-Linie) → Hot/Window/Restzeit echt; „Act now" als echte Aktion; Stage falls
  am Signal sinnvoll. **Mit dem Urgency-/Action-Slice zurückholen.**

### [D15] Follow-ups + Neu-in-Pipeline: `contactActiveStage` erben · Zielphase: Daten-Wiring dieser Tabs
- **Status heute:** `SequenceLeadCards` (Follow-ups) + `NewInPipelineCards` (Neu in Pipeline) sind **noch Mock**
  (hartkodierte Stages). Die zentrale Stage-Logik (`contactActiveStage`, Slice 4) ist gebaut, aber dort **noch nicht angewandt**.
- **Später:** beim Daten-Wiring dieser Tabs die Stage über `contactActiveStage(contact, stageNameBySlug)` ziehen
  (zuletzt aktiver Deal) — wie Signals. Identität/Heat/ICP/Status über `contactToProfile`. Kein eigenes Herleiten.

### [D16] Follow-up-Karten: ausgeblendete Dekorationen + Aktionen · Zielphase: Berechnungs-/Write-/Panel-Slices
- **Status heute:** Follow-ups-Tab read-verdrahtet (Heat Cold/Gone → Kontakt-Kachel + aktive-Deal-Stage + Panel-Pfeil).
  **Ausgeblendet** (`FollowUpKaltCard showActions=false`), weil Logik fehlt (würde Daten vortäuschen):
  „XT in Stage"/Stagnation ([D4]/[D9]) · „vor X Tagen" (`last_contacted_at`, im Seed NULL) · Snooze inkl.
  „X/3 genutzt"/„noch X Tage"/Reaktivieren (kein DB-Feld → Schema+Write) · „Eskaliert" · „Start Outreach" (Write) ·
  `generatedMessage`/Step-Zähler (Sequenz-Engine) · die „Kontakt wird kalt"-Action-Zeile.
- **Später:** je Element mit seiner Logik zurückholen. Die **konkrete AI-Empfehlung** gehört NICHT auf die Karte —
  sie lebt im **820px-Action-Panel** (Slice „Info-Panel", B). Der Panel-**Pfeil** ist bewusst schon sichtbar (Tür für später).

### [D17] Follow-ups-Tab — finale Bedeutung ✅ ENTSCHIEDEN (T2 umgesetzt)
- **Entscheidung (gelockt):** Follow-up = **Kontakt/Deal mit fälliger Task** (`completed_at IS NULL AND due_at <= now()`). Ersetzt die frühere „kalte Kontakte"-Verdrahtung (Heat Cold/Gone) **vollständig**.
- **Umsetzung (T2):** Query `getDueTasks` + Mapper `taskToDueCard`; Karte = zentrale Kontakt-Kachel + grauer Bereich „Fällige Task" + Titel + Fälligkeit. Alte `getFollowUps`-Heat-Query + `contactToFollowUpCard` entfernt. Tab-Count = Anzahl fälliger Tasks.
- **Deferred bleibt:** Snooze/Eskalation/„Start Outreach"/Stagnation (Logik fehlt) — UI lebt weiter in `FollowUpKaltCard` (jetzt ungenutzt, bewusst behalten als Heimat der späteren Follow-up-Aktionen).
- _Historie:_ frühere Optionen (a) kalte Kontakte / (b) dealbezogen / (c) beides — verworfen zugunsten der fällige-Task-Definition.
- **Zu klären (nicht unter Bau-Druck):** Soll der Tab
  - **(a)** kalte Kontakte als **Segment** zeigen (Reaktivierungs-Sicht über alle, mit/ohne Deal — entspricht „niemand geht verloren"), **oder**
  - **(b)** **dealbezogene** Follow-ups (nur Kontakte mit **laufendem Deal**, an dem man nachfasst), **oder**
  - **(c)** **beides** als zwei getrennte Sichten.
- **Kontext:** die ursprünglichen Design-Screenshots zeigten **dealbezogene** Karten (mit Stage); der aktuelle Build zeigt **reine kalte Kontakte**.
- **Auswirkung:** die Entscheidung beeinflusst **Selektor** (`getFollowUps`) + **Karten-Inhalt** (Stage immer/nur bei Deal). Erst entscheiden, dann ggf. anpassen.

### [D18] Neu-in-Pipeline — ausgeblendete Termin-/Prep-Logik (deferred)
- **Read-Slice steht:** Tab verdrahtet über `getNewInPipeline` → `dealToNewPipelineRow` (zentrale `contactToProfile`/`contactActiveStage`-Leitung). Definition **gelockt:** „Neu in Pipeline" = kürzlich angelegte Deals (`deals.created_at`), client-seitiger Zeitfilter (heute / 7T / 30T, Default 30T). Herkunft „Via AI SDR" vs. „Manuell" aus `deals.source_lead_id`.
- **Ausgeblendet (Logik/Tabellen fehlen → würde Daten vortäuschen):**
  - **Termin-Datum** („Demo · 12. Juni · 14:00") — es gibt **keine Termin-/Booking-Tabelle**; kommt mit dem **Task-System (Termine = Tasks mit Datum)** bzw. der **Kalender-Integration** (Cal.com) zurück.
  - **Meeting-Prep-Status + Spinner** („bereit/wird generiert") — `deals.meeting_prep` existiert als Spalte, aber **kein AI-Job** befüllt sie; Status erst zeigen, wenn die Generierung läuft.
  - **AI-generierter Begleittext** + **„Termin gebucht"-Provenance** — hängen an Meeting-Prep-Job bzw. Booking-Ebene.
- **Türen bleiben sichtbar** (Funktion folgt): Buttons „Meeting-Prep" + „Termin vereinbaren" (Klick → Platzhalter-Toast) und der Pfeil ins 820px-Info-Panel.
- **Seed-Hinweis:** Recency/`source_lead_id`/`meeting_prep` der Demo-Deals sind mit dem anon-Key (RLS scoped auf `auth.uid()`) **nicht lesbar** — Default-Fenster bewusst weit (30T). Falls der Tab leer/„nur Manuell" wirkt: Seed prüfen/justieren (eingeloggt via SQL-Editor).
- ⚠️ **Die „Türen" (Meeting-Prep / Termin vereinbaren) werden vom geplanten Umbau [A-NIP] ENTFERNT** (siehe unten) — sie passen thematisch nicht.

### [A-NIP] 📋 GEPLANTER AUFTRAG — Neu-in-Pipeline-Tab umbauen (noch nicht gebaut)
> _Geplanter Auftrag mit ausführlichem WARUM, damit der Kontext über Sessions hält. Supersedet die
> „Türen bleiben sichtbar"-Zeile aus [D18]: die Meeting-Buttons sollen **weg**, nicht als Tür bleiben._

**Problem / Beobachtung:** Die Karten im Neu-in-Pipeline-Tab zeigen aktuell **„Meeting-Prep / Termin vereinbaren"**.
Das passt **thematisch nicht** zum Zweck des Tabs. ⮑ **Erst prüfen:** Sind das **Reste** aus dem ursprünglichen Mock,
oder wurde es wieder eingeblendet? In [D18] wurde dieses Meeting-Zeug (Termin-Datum/Meeting-Prep/AI-Text) **bewusst
deferred**, weil die Logik dahinter fehlt — die Buttons blieben damals aber als „Tür" stehen. Genau die sollen jetzt **raus**.

**Warum der Tab anders sein soll (Zweck):** Der Tab beantwortet **„Welche Deals sind NEU in die Pipeline gekommen?"** —
eine **Übersicht über Neuzugänge**, **KEINE Meeting-Funktion**. Der User will auf einen Blick sehen: **was ist neu, woher
kam es, wie groß ist es** — und einen **klaren nächsten Schritt** anstoßen können.

**Soll-Zustand der Karte:**
- **Herkunft prominent** (oben/vorne): **„Manuell"** oder **„Via AI SDR"** (über `deals.source_lead_id`: gesetzt = via
  AI SDR, sonst manuell — die Leitung existiert schon, zeigte bisher nur „Manuell", weil der Seed `source_lead_id` nicht setzt).
- **Deal-Infos** (darunter/daneben): **Deal-Name · Volumen (Wert) · Produkt**.
- **Aktion:** ein Button **„Action starten"** (o. ä.). User-Idee: wenn der Deal **noch keine (offene) Task** hat → von hier
  aus eine **anlegen** können. _(Logik „hat der Deal eine offene Task?" ist noch zu klären — die Karten müssten das wissen.)_
- **Raus:** Meeting-Prep / Termin vereinbaren / Termin-Datum / AI-Text (= das deferrte [D18]-Zeug), solange die Logik fehlt.

**Offene Punkte für die spätere Diagnose:**
1. Woher weiß die Karte, ob ein Deal **schon eine (offene) Task** hat? (Embed `deals.tasks` open-gefiltert, analog Pipeline „Keine Task" B4?)
2. Was genau macht **„Action starten"** — direkt das Task-Anlegen-Formular, oder das 820px-Panel öffnen (am Tasks-Tab, vgl. Deeplink)?
3. Ist **„neu in Pipeline" = Deal-Erstelldatum im Zeitfenster** (heute/7T/30T, existiert schon)?

**Vorgehen wenn dran:** erst **read-only Diagnose** (heutiger Karten-Aufbau in `NewInPipelineCards`, vorhandene Datenfelder,
[D18]-Reste prüfen), **dann Bau in Scheiben.**

### [D19] Task-Erinnerung — Feld + Auslöse-System fehlen komplett (deferred)
- **Kontext:** Das „Neue Task"-Formular hat einen **Erinnerung**-Schalter (An/Aus + eigener Tag + Uhrzeit). Dafür gibt es **weder ein DB-Feld noch ein Auslöse-System.**
- **Fehlt — Feld:** kein `reminder_at`/Reminder-Flag auf `tasks` (nur `due_at`). Migration 022 ergänzte nur `channel`.
- **Fehlt — System:** keine `notifications`-Tabelle, keine `notification_preferences`, kein `lib/notify.ts`, **kein zeitgesteuerter Job** (pg_cron/Edge Function) und kein Versand (In-App/E-Mail/Push). `scheduled_tasks` (007) ist nur eine Datentabelle, kein aktiver Scheduler. CLAUDE.md beschreibt die Notifications-Infra ausführlich — **gebaut ist davon nichts**.
- **Bis dahin (UI-Regel):** Der Erinnerung-Schalter bleibt **ausgegraut / „bald verfügbar"** (kein Fake-Speichern). Erst aktivieren, wenn (a) `reminder_at`-Feld, (b) `notifications`-Tabelle + `notify()`, (c) zeitgesteuerter Job + Versand existieren.
- **Eigenes späteres Thema** (Reihenfolge nach Task-Write T4): Reminder-Feld → Notifications-Fundament → Scheduler/Versand.

### [D20] Zentrale Priorisierungs-Regel — Top-5 „wichtigste Aufgaben" (Übersicht + Mein Tag)
- **Was:** Eine **Regel/Edge-Function** (= `morning_briefing()`-Logik) berechnet „**die N wichtigsten Actions aus allem**" — über **alle** Quellen: Signale, fällige Tasks, stagnierte Deals, kalte Kontakte, Trials … (Katalog + Prioritäten siehe CLAUDE.md → „Mein Tag → Top 5 Auswahl-Logik").
- **Wo angezeigt:** Ergebnis als Kacheln in der **Hunter-Übersicht** (Top-5-Bereich) **und** in **Mein Tag** — jeweils mit **Deeplink** zum Element. **Einmal zentral bauen, mehrfach anzeigen.**
- **Gehört zum Regel-/Berechnungs-Thema** (zusammen mit Stagnation **B5/[D4]**, Heat **[D5]**, Scores) — **NICHT** in den Übersicht-Read-Tab. Der Read-Tab zeigt heute nur einen **ruhigen Platzhalter** als Tür (kein Fake, keine Leere).
- **Status:** Übersicht-KPIs (Pipeline-Wert/Heiße-Signale/Follow-ups) + Funnel (Deals/€ pro Stage) sind **read-seitig echt** (2026-06-18); Top-5 wartet auf diese Regel.
- **User-Wunsch (Statistik-Kachel, später):** mögliche Übersicht-Kachel **„Anzahl erledigter Aufgaben über Zeit"** — Datenbasis ist da (`tasks.completed_at`, zusätzlich `deleted_at` für gelöschte). **Hinweis:** aussagekräftig erst mit **echter Nutzung über Wochen** (vorher zu wenig Datenpunkte). Gehört zum Statistik-/Berechnungs-Thema, nicht in den Read-Tab.

### [D22] Cron Job: score-deal-health täglich 02:00 UTC (deferred)
- **Migration 035** liegt bereits in `supabase/migrations/` (auf `main`) — `pg_cron`-Job 02:00 UTC → `net.http_post` auf die Edge Function.
- **Edge Function `score-deal-health`** ist gebaut (`supabase/functions/`), aber **NOCH NICHT deployed** (verifiziert: `supabase functions list` = leer) → `supabase functions deploy score-deal-health`.
- **Fehlt außerdem:** GUCs `app.supabase_url` + `app.service_role_key` via Supabase Vault setzen (Dashboard → Integrations → Vault), dann **Migration 035 pushen** (`supabase db push`).
- **Ohne Cron:** Stagnation wird nur **bei Stage-Änderung** berechnet (fire-and-forget Trigger in `updateDealStage` aktiv).
- **Kommt wenn:** der **Settings-Screen** gebaut wird (dort konfiguriert der User die Schwellenwerte → dann macht das Cron-Setup als Gesamtpaket Sinn).

### [D23] Custom Webhook Actions + Rule Builder (deferred)
- **Webhooks empfangen:** via Edge Function `receive-webhook()`.
- **`signals`-Tabelle** empfängt + speichert (Schema vorhanden).
- **`action_rules`-Tabelle anlegen:** `trigger_type`, `condition jsonb`, `card_title`, `card_text`, `cta_label`, `cta_action`, `ai_prompt`, `langfuse_prompt_id`, `organization_id`.
- **Signal-getriebene UI:** Kachel erscheint automatisch, wenn eine Rule matcht (siehe CLAUDE.md → „Signal-getriebene UI").
- **White Label:** Admin definiert eigene Rules + Kacheln via Rule Builder in Settings.
- **Kommt wenn:** Settings-Screen + Auth/Org-Wiring ([D21]) fertig.

### [D24] Org-spezifische AI Prompts via Langfuse (deferred)
- Jede Organization kann einen eigenen Prompt pro Action hinterlegen.
- Gespeichert in `action_rules.ai_prompt` + `langfuse_prompt_id`.
- AI-Call nutzt den org-spezifischen Prompt statt des Defaults.
- Ermöglicht White-Label-AI-Logik ohne Code-Änderung.
- **Kommt wenn:** Langfuse integriert + Action Rules ([D23]) gebaut.

### [D26] Manuell protokollierte Kommunikation → KI-Kurzakte (deferred)
- Wenn ein Kontakt protokolliert wird (call/meeting/email/linkedin via `communications`, 036) → KI-Kurzakte des Kontakts wird automatisch aktualisiert (`analyze_personality` + Kurzakte-Update).
- **Kommt wenn:** KI-Kurzakte gebaut wird (AI-SDR-Phase).

### [D27] Technische Schuld — nach Action Panels erledigen (deferred)
1. **`window.confirm` → shadcn `AlertDialog`.** Betrifft das Löschen der letzten Telefonnummer (`PhoneField.tsx` + `DetailPhoneList.tsx`). Browser-Popup durch unseren shadcn `AlertDialog` ersetzen. Klein, ~1 Stunde.
2. **Typo-Kanon: alle fehlenden Komponenten in Audit-Scope.** Diagnose, welche panel-blocks + features noch rohe `text-[Xpx]`-Klassen haben → alle auf `typo-*`-Primitive heben + in die Audit-`IN_SCOPE` aufnehmen. ~1 Tag.
3. **Inline-JSX-Blöcke extrahieren.** Blöcke >20 Zeilen, die in mehreren Dateien ähnlich aussehen → als panel-block auslagern (kürzere Dateien + wiederverwendbar).
- **Kommt nach:** Action Panels komplett verdrahtet. **Vor:** Auth/Org-Wiring [D21].
- **Status (2026-06-22):** Punkte 1 + 2 **erledigt** (`AlertDialog`, Typo-Welle 1+2 + Audit-Scope). Punkt 3 (Inline-JSX-Dedup) teils erledigt (`ExpandedCardContent`).

### [D28] Performance-Optimierungen (Phase 5 Politur) (deferred)
- **Prefetching:** Daten laden bevor der User klickt (z.B. Panel-Daten prefetchen, wenn der User über eine Kachel hovert → sofortiges Öffnen).
- **Supabase Pro:** bessere Edge-Function-Performance (Cold Starts reduzieren).
- **Realtime Subscriptions statt Polling:** `realtime.ts` ist aktuell ein No-op-Stub → echte Subscriptions in Phase 5.
- **Kommt wenn:** alle Screens fertig + Auth/Org [D21] steht.

### [D29] Einladungs-Email via Edge Function (deferred)
- Einladung wird bereits in `invitations` gespeichert (Migration 042) ✓
- Provisioning-Trigger ordnet Org + Rolle zu, wenn der User sich registriert (Migration 043) ✓
- **Fehlt noch:** der Email-Versand — `supabase.auth.admin.inviteUserByEmail` braucht den
  `service_role`-Key → **nur in einer Edge Function**, nie im Client.
- **Was die Edge Function tun muss:** `inviteUserByEmail(email)` aufrufen → Supabase schickt
  automatisch die Einladungs-Email mit Magic Link zur Registrierung.
- **Kommt wenn:** Settings-Screen fertig + Email-Provider in Supabase konfiguriert.
- **Bis dahin:** Einladung nur in der DB, kein Mailversand (UI-Hinweis weist darauf hin).

### [TS] Deal-Typ ohne `product` — offener Faden
- `src/types/hunter.ts` `Deal` hat **kein `product`** (Migration 014 fügte nur die DB-Spalte).
  Beim späteren Produkt-Anzeigen (Pipeline/Deal-Detail) `product?: string` im Typ ergänzen + mappen.

> Anker-Tags `[D1]`–`[D29]` sind im Code referenzierbar (z.B. `hunterMappers.ts` → `[[leads-tab-read]]`).
> Vor Umsetzung eines Punkts: passende Referenz-Doku (`docs/sales_os_edge_functions_v2.md` etc.) lesen.

---

## Completed

### Phase 3 — Signals-Tab live + Kontakt-Datenvereinheitlichung (Branch `feature/phase-2-hunter`) — Session 2026-06-17 (Teil 2)

Signals-Tab datengetrieben (S-0…S-2) + **eine** zentrale Kontakt-Auflösung für alle Tabs (Slices A,1–5).
Gates durchgehend grün. **PR #12 weiter Draft.** Preview-MCP env-defekt (`EPERM`) → Verifikation via Build/Audit/REST.

- [x] **Signal-Fundament (S-0):** i18n-Text-Templates je `signal_type` + `constants.SIGNAL_TYPE_META` (Icon/Badge)
  + `settings.signal_windows` (Migr. 018) + `resolveSignalText` Helfer.
- [x] **Signals-Seed (S-1):** Migr. 019 (5 → nach 020 noch 4 Rows, alle mit Kontakt, hunter-routed).
- [x] **Signals-Tab datengetrieben (S-2):** `getSignals` + `signalToCardProps`; `LinkedinSignalCard` heat/icp/channel
  prop-driven (kein Fake-„HOT"/`?? 80`); Bulk-Select auf echte `signals.id`; ICP-Ring „kein Wert → unsichtbar".
- [x] **Kontakt-Datenvereinheitlichung (A,1–5):** `contactToProfile(contact)` = **Single-Source** für Name/Jobtitel/
  Firma/Initialen/ICP/Heat/Status; `contactRowToLead`/`dealToPipelineRow`/`signalToCardProps` ziehen daraus.
  - **Heat-Fix:** Pipeline-Heat jetzt aus `contacts.heat_status` (statt `deals.heat_status`).
  - **Stage zentral:** `latestActiveDeal`/`contactActiveStage` (zuletzt aktiver, nicht-terminaler Deal) → Signals
    zeigt aktive-Deal-Stage; Pipeline = konkreter Deal; Leads = Status.
  - **Cleanup:** Migr. 020 entfernt das kontaktlose Test-Signal (Fall existiert real nicht).
  - **Regeln in CLAUDE.md verankert** (Kontakt-Datenvereinheitlichung, Single-Source, Heat-Quelle, Stage-Regel).
- **Migrationen 018/019/020 remote applied.** **Offen:** Follow-ups/Neu-in-Pipeline erben `contactActiveStage` erst
  beim jeweiligen Daten-Wiring ([D15]).

### Phase 3 — Hunter Pipeline-Tab auf echte Deals + knowledge_base-via-Migration (Branch `feature/phase-2-hunter`) — Session 2026-06-17

Pipeline-Tab (Listenansicht · Kanban · Filter) slice-by-slice auf echte `deals` verdrahtet;
knowledge_base-Schreibweg auf Migrationen umgestellt. Gates durchgehend grün. **PR #12 weiter Draft.**
Preview-MCP in dieser Umgebung defekt (`EPERM`) → Verifikation via Build/Audit/REST + User-Gegencheck.

- [x] **knowledge_base via Migration** — Pattern etabliert: pro Feature/Batch eine additive Migration,
  idempotent (`UNIQUE(org,feature)` + `ON CONFLICT DO UPDATE`). `015` (Constraint + Leads-Tab-Eintrag),
  `016` (19 Backlog-Einträge aus `docs/knowledge_base.md` → DB == docs). Beide remote applied.
- [x] **Slice A — Pipeline-Listenansicht:** `getDeals` + `getPipelineSettings` als geteilte TanStack-
  Queries; neuer Mapper `dealToPipelineRow` (`hunterMappers`) → `PipelineRow`. Liste: Kontakt/Stage/
  Owner/Wert (**Cent→/100**)/Heat. Mock-Filter + Mock-Helper entfernt.
- [x] **Slice B — Pipeline-Kanban:** Spalten aus `settings.pipeline_stages` (slug/name/order, alle 7);
  Karten gruppiert nach stageSlug; echte Aggregate (count + Σ Wert); ICP `null→Ring unsichtbar`. Fingierte
  Pfeile/Stagnations-Pills/Action-Badges **ausgeblendet** (→ Deferred [D8]–[D11]).
- [x] **Slice C — Filter + echte Owner:** `owner:users(full_name)`-Embed → echter Owner-Name; 3 client-
  seitige Filter über geteilte `dealRows`: Heat+Owner (Liste+Kanban), Stage (nur Liste). Kanban-
  Aggregate folgen dem Heat/Owner-Filter.
- [x] **Ehrlichkeit:** ICP-Fake-Default `?? 87` in LeadListRow → `?? 0`; restliche Mock-Fake-Defaults als [D12].
- [x] **Deferred-Logic gepflegt:** [D6]–[D13] ergänzt (Provisionierung, Owner, Kanban-Rückbau-Punkte,
  Fake-Defaults, Task-Liste-Ansicht).
- **Offen (nächste Slices):** 820px-Info-Panel an echte contacts/companies · Realtime · Signals/Follow-ups/
  Overview · Stage-Writes + Stagnation/Task-Logik (Edge Functions) — siehe Deferred Logic.

### Phase 3 — Hunter Leads-Tab auf echte DB-Daten (Branch `feature/phase-2-hunter`) — Session 2026-06-16 (Teil 2)

Slice-by-slice Mock → Supabase für den **Leads-Tab**. Live geschaltet, Test-User + Demo-Seed
(vom User im SQL-Editor ausgeführt), Tab zeigt echte org-gescopte Kontakte. Gates durchgehend
grün. **PR #12 weiter Draft.** Preview-MCP in dieser Umgebung defekt (`EPERM`) → Verifikation
über Build/Audit/REST + visueller Gegencheck durch den User.

- [x] **Live-Setup:** `.env.local` (anon-Key, Projekt `qhcmruprfjunalgrhgcp`) → `db.ts` Live-Modus;
  Test-User (`test@gosherloq.dev`, `public.users` + Demo-Org, role owner) + Demo-Seed
  (5 companies / 8 contacts / 3 leads / 6 deals) angelegt. RLS greift.
- [x] **Slice 1 — Leads-Read:** `getContacts` (org-gescoped, Company-Name eingebettet) → neuer
  Mapper `src/lib/hunterMappers.ts` (`contactRowToLead`) → `ScreenHunting` Leads-Tab via TanStack
  Query (`HunterReference`), Loading-Skeleton + Error-State. Andere Tabs unverändert Mock.
- [x] **Fix:** `getContacts`-Embed mehrdeutig (contacts→companies 2 FKs) → FK-Hint `!company_id` (PGRST201).
- [x] **Fix:** `useModules` fragte nicht existente `user_modules` ab (404) → `getModules` (settings.modules)
  via TanStack; `settings.modules` der Demo-Org auf `farmer:true` gesetzt (Nav unverändert).
- [x] **Slice 2 — Heat:** `heat_status` (DB-Enum heiss/warm/lauwarm/kalt/tot) → UI-`HeatStatus` (1:1),
  Badge zeigt echte Farbe (heiss=Engaged/grün, tot=Gone/grau); Fallback DEAD.
- [x] **Slice 3 — Zeile fertig:** Stage-Badge ← `contact_status` (Lifecycle-Klartext: Neu/Aktiv/
  In Pipeline/Kunde/Inaktiv/Opt-out, opt_out eigener Zustand); Heading „STAGE"→„STATUS" via
  dediziertem `hunter.leadCard.statusLabel`; „vor X Tagen" ← `last_contacted_at` (NULL → nichts);
  Stagnations-Block entfernt (Deal-Konzept). Firmen-Block ausgeblendet wenn keine Firma.
- [x] **Deferred-Logic-Doku:** Abschnitt „Offene Konzept-Entscheidungen" (D1–D5) + CLAUDE SESSION-START-Verweis.
- **Offen (nächste Slices):** Pipeline-Tab auf echte `deals` · 820px-Info-Panel an echte Kontaktdaten ·
  Realtime · berechnete Werte per Edge Functions (siehe Deferred Logic).

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
