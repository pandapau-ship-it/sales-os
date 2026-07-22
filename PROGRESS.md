# Sales OS — Progress Tracker

> Update this file at the end of every session. Read it at the start.

---

## ▶ NÄCHSTER SCHRITT

> **▶ markiert den nächsten offenen Punkt.** Die Typen **[BAU]** / **[OLIVER]** /
> **[BAU+DESIGN]** steuern die **Dauerregel „weiter"** in CLAUDE.md (Session Protocol).
> Auf „weiter" → diesen Block öffnen, ▶-Schritt nehmen, nach Typ handeln.
> **Reihenfolge-Flexibilität:** Wartet ein [OLIVER]-/DESIGN-Schritt, darf der nächste
> [BAU]-Schritt ohne diese Abhängigkeit vorgezogen werden — **Vorziehen hier vermerken,
> nie stillschweigend**.

**1.** [~] **[BAU+DESIGN] Kontakte & Companies — Slices K-1 bis K-6** — **Kern-Arc K-1…K-6 FERTIG (18.07.2026, in `main`).**
  (`docs/kontakte_companies_bauplan_v1.md`; Designs ScreenKontakte/ScreenCompanies
  vorhanden — Abgleich nach Dauerregel 4c) · **erledigt: K-1a · K-1a2 · K-1b · K-2 · K-2b · K-3 · K-3b · K-4 · K-5 (Engine + Schicht 4 + UI) · K-6a (Merge-Backend) · K-6-fuzzy · K-6b (Duplikate-verwalten-UI + Merge-Dialog + Löschen, Merge `dc93eb5`) + Import-Live-QA-Runden 2/3** (linkedin_url-Filter-Fix, Undo-Vorschau, Honesty-Undo-Transformation). · **[~] = Folge-Slices bleiben offen** (siehe unten: K-FS1 Hunter-Dedup · Vorlagen-Erkennung · [D-company-import] · merge_candidates-Persistenz · [D-contact-city]-Entscheidung).
  · **Folge-Slices offen (Import):** (1) **Vorlagen-Erkennung** (`import_templates`/`headerSignature`, für K-5 bewusst ausgeblendet)
  · (2) **[D-company-import] Company-only-Import** — Datei nur mit Firmen (z.B. gekaufte Ziel-Account-Liste): eigener
  Anlage-Weg mit eigenen Pflichtfeldern (**Name ODER Domain**) + eigener Duplikat-Prüfung (Domain exakt/Name unscharf, K2).
  · **[BUGFIX 18.07.] Details-Tab Honesty (HunterSidepanel):** der Vollansicht-Details-Tab zeigte für JEDEN
  Kontakt ein hardcodiertes Mock `DEFAULT_DETAILS` („Christian Brand / VP of Sales EMEA / LogixFlow / ICP 87 /
  Owner Oliver Prossi / Tags / Notiz") — vier Felder (icp/tags/owner/notiz) wurden NIE aus echten Daten geseedet.
  **DB per Abfrage als KORREKT bewiesen** (kein Datenfehler, reiner UI-Fehler). Fix: `seedContactDetails` (Single
  Source, wie Farmer) + icp/tags/notiz aus echten `contacts`-Spalten + Owner-Name aus `assigned_to`. Verifiziert.
  · **[D-contact-city] ERLEDIGT (18.07.2026):** `contacts` hatte **keine** `city`/`country`-Spalten trotz CRM-Doku.
  Oliver entschied „umsetzen" → **Migration `060_contacts_city_country.sql`** (zwei nullable text-Spalten, rein additiv)
  **angewendet + Remote verifiziert** (beide Spalten existieren, text, nullable). Der Code war bereits vollständig
  verdrahtet (`createContact` schreibt city/country, `DETAIL_MAP` stadt→city/land→country, Import-Synonyme,
  `getContactDetail` `select("*")`) → Import-Stadt/Land-Mapping und Details-Tab Standort/Land funktionieren jetzt
  (Hunter + Farmer). Kein Code-Change nötig, nur die Spalten fehlten.
  · **[KB-DEFERRED] KB-DB-Migration bündeln, sobald AI-Chat/RAG-Slice ansteht — NICHT vorher (Oliver-Entscheidung 18.07.).**
  Die seit KB-Migration 053 (30.06.) fertigen core_crm-Features (Kontakte/Listen/Companies/Suche/Detail/Löschen/Import/
  Duplikate) sind vollständig im **Seed** `docs/knowledge_base.md` erfasst. Sie werden **bewusst Seed-only** gehalten und
  erst mit dem AI-Chat/RAG-Slice (der die KB tatsächlich konsumiert) als **eine idempotente KB-Migration** in die DB gebündelt.
  · **[BUGFIX 18.07.] Details-Tab SYSTEM-Sektion Honesty (HunterSidepanel):** die System-Sektion zeigte
  **hardcodierte Fake-Literale** (Lead-Quelle „Manuell", Erstellt „12. März 2026", „vor 2 Tagen · E-Mail",
  Enrichment „Surfe", CRM-ID „HS-48213"). Jetzt aus echten `contacts`-Spalten geseedet (`sys`-Objekt:
  lead_source→Label, created_at, last_contacted_at, last_reply_at, enrichment_sources; CRM-ID leer, da
  keine Spalte). NULL→„—". **Render-Test beweist es** (`HunterSidepanel.render.test.tsx`: schlägt auf
  Fake-Code fehl, besteht auf Fix). Nebenbei: Import schrieb `lead_source='csv'` statt kanonisch
  `'csv_upload'` → gefixt (+ 5 bestehende Zeilen in DB korrigiert). **Dateiname in der Lead-Quelle:**
  `getContactDetail` embeddet jetzt `import_batch:import_batches!import_batch_id(filename)` → System-Feld zeigt
  „Import (CSV) — test_import_kontakte.csv" (nachvollziehbar, aus welcher Datei der Kontakt stammt; Render-Test prüft es).
  · **VOLLSTÄNDIGE FAKE-WERT-INVENTUR (18.07., ganzer `src/components`-Baum durchgesucht):**
  **Real-Kontakt-Panels FAKE-FREI** — HunterSidepanel (Person+System), FarmerSidepanel (Person/Firma echt,
  „Folgt"-Platzhalter ehrlich), NotizenListe/DealsListe **im `isReal`/`dealRows`-Modus** (echte Daten/Autoren).
  **Verbleibende Fakes NUR in nicht-Real-Flow-Code (dokumentiert, [D-mock-hunter-feed]):** (a) Mock-Fallback-
  Zweige `NotizenListe.DEFAULT_NOTES`/`DealsListe.MOCK_DEALS` (nur `!isReal`, nie im echten Panel) · (b)
  `KommunikationPreview` (tot, nur Barrel-Export, nirgends gerendert) · (c) **Legacy-Mock-Hunter/MeinTag-Feed**
  `CustomerDrawer` + `TaskEntwurfForm`-Defaults + `ScreenHunting`-Mock-Signaldaten (zeigen Mock-Personas by
  design; importierte echte Kontakte laufen NICHT durch diesen Pfad, sondern durch Kontakte→HunterSidepanel).
  **[D-mock-hunter-feed]:** dieser Legacy-Mock-Feed wird beim DB-Wiring des Hunter-Signal-Screens bereinigt —
  eigener Slice, kein Real-Kontakt-Leak.
  · **[D-details-persist] OFFEN:** Details-Tab-Felder icp/tags/owner/notiz sind editierbar + zeigen jetzt echte Werte,
  ABER `setDetail` schreibt nur lokal (Toast „Gespeichert" ohne DB-Write) — Persistenz dieser Klassifizierungs-Felder
  ist ein Folge-Slice (Owner als User-Dropdown → assigned_to; icp/tags/notes → updateContact).
  · (3) **[D-unified-upload] EIN gemeinsamer Upload-Einstieg** — kein zweiter Button: EINE Upload-Oberfläche für Kontakt-
  UND Company-Import, **automatische Erkennung an den Spaltenüberschriften** (Personen-Felder → Kontakt-Import, ausschließlich
  Firmen-Felder → Company-Import), transparente Anzeige in Schritt 2, was erkannt wurde. Zwei Logiken im Hintergrund, ein
  Bildschirm für den User. *(beide nur dokumentiert, keine Bau-Entscheidung — 18.07.2026)*
  - [x] **K-1a Test-Fundament ZUERST** — vitest eingerichtet (Config in `vite.config.ts`,
        Smoke-Test `src/lib/heatUtils.test.ts` 3/3 grün, npm-Scripts `test`/`test:watch`).
        Commit `3e6ad8b`, gemerged `81d0d33`. **Voraussetzung für [AUTO]-Tests in ALLEN
        Folge-Slices** und für den `test-runner`-Agent (liest das `test`-Script). Damit
        zählt Punkt 5 der „GATES VOR JEDEM MERGE" („Tests grün") ab jetzt wirklich.
  - [x] **K-1a2 Lint-Schuld — Korrektheit vollständig behoben (109 → 60).** Branch
        `chore/k1a2-lint-schuld`. Ausgangslage 109 Fehler, vorbestehend (am 15.07.2026 per
        `git stash` gegen reines `main` verifiziert). **ALLE Korrektheits-/Hygiene-Regeln
        behoben:** `react-hooks/purity` (3) · `set-state-in-effect` (19) · `exhaustive-deps`
        (6, mitentfallen) · `no-unused-vars` (20) · `react-refresh/only-export-components` (4).
        Vorgehen: `useNowMs()` (useSyncExternalStore) als reine Zeit-Quelle · State-Anpassung
        im Render statt Reset-Effect · ScreenMyDay `useEffect+fetch` → TanStack Query ·
        Toast-Context/`lib/brand.ts` in eigene Dateien getrennt · `_`-Konvention in
        `eslint.config.js` deklariert. Nebenbefund behoben: ScreenMyDay gab bei Fehlschlag
        ein **erfundenes** AI-Briefing mit echt klingenden Namen aus (Honesty-Verstoß).
        **VERBLEIBEND: 60 × `@typescript-eslint/no-explicit-any` — bekannt, KEIN Blocker.**
        Alle 60 sind `Record<string, any>` für **DB-Rohzeilen** in den zentralen Mappern
        (`hunterMappers`, `HunterSidepanel`/`FarmerSidepanel`, `ScreenHunting`,
        `contactDetailFields`, `OffeneTasks`/`TasksListe`/`AktivitaetsVerlauf` u.a.). Ihr
        **kanonischer Fix sind generierte Supabase-Typen** (CLAUDE.md → TypeScript:
        `supabase gen types typescript`), die im Repo noch fehlen und eine Live-DB-Verbindung
        brauchen. Hand-geschriebene Row-Interfaces wurden bewusst **verworfen** — sie würden
        das Schema an zweiter Stelle duplizieren (genau das, was generierte Typen vermeiden).
        **→ Diese 60 werden in EINEM Zug mit `supabase gen types typescript` typisiert,
        sobald K-1b/K-2 die DB-Schicht bauen und eine Live-Verbindung existiert.**
        **Gate-2-Regel ab jetzt:** neue **Zwischen-Baseline 60** statt 109 — Gate 2 bleibt bis
        zur DB-Typisierung „bekannt, kein Blocker", aber **kein Commit darf die 60 überschreiten**
        (Zählung vorher/nachher). Nach der DB-Typisierung gilt Gate 2 wieder hart bei 0.
        *(Spiegel in CLAUDE.md „GATES VOR JEDEM MERGE" Punkt 2 angeglichen.)*
  - [x] **K-1b Diagnose & Daten-Fundament** — Branch `feat/k1b-daten-fundament`, beide
        Gate-Agents PASS (test-runner ALLE GRÜN, auditor AUDIT: PASS A–E). Migration **056**:
        `contacts.assigned_to` + `created_by` (K9/SaaS-Ownership) · **`list_members` Join-Tabelle
        LÖST das Array `lists.contact_ids` ab** (Migration 005; kanonisches Schema, FK+CASCADE,
        Backfill nur auf existierende Kontakte, drop column) · `import_batches` + `import_templates`
        (K4/K5) · `settings.lead_assignment_strategy` (K9, D51-konfigurierbar). Zentrale **pure**
        Functions mit **[AUTO]-Tests** (38 neu, gesamt 41/41): K1 `validateContactRequired`/
        `validateCompanyRequired` (`contactValidation.ts`) · K2 `classifyDuplicate`/`classifyCompanyDuplicate`
        + Normalisierung (`dedup.ts`, Match-Kaskade E-Mail/LinkedIn exakt → sicher, Name+Company
        unscharf → möglich) · K9 `pickRoundRobin`/`resolveOwner` (`leadAssignment.ts`). Dünne DB-Schicht
        `findDuplicates`/`assignLeadOwner` in `db.ts` (delegiert an die puren Libs, keine Zweitlogik).
        Referenz-Doku `sales_os_db_schema_v3.md` angeglichen (Konflikt-Regel).
        **Diagnose-Befunde:** keine bestehende Dedup-/Sherloq-Intake-Logik (sauberer Neubau,
        Bauplan-Annahme „Sherloq-Intake existiert" traf NICHT zu); `createContact` fehlt noch in
        `db.ts` (voller Anlege-Pfad mit Validierung+Dedup+Assign = **K-3**). **Migrationen NICHT
        gepusht** (Olivers Gate); `supabase gen types` + Typisierung der 60 `any` folgt beim Push.
  - [x] **K-2 Filter-Sprache (Weiche 1, erstmalig)** — Branch `feat/k2-filter-sprache`, beide
        Gate-Agents PASS (auditor A–E, Kategorie-C-Konsistenz gefixt). Eigenständige Lib
        `src/lib/filter/` als **EINE** Sprache für Listen (DB) · Lifecycle-Trigger (in-memory) ·
        Analyse: `types.ts` (AST Feld·Operator·Wert + UND/ODER-Gruppen) · `schema.ts`
        (**Whitelist = Sicherheitsgrenze**: filterbare Felder je Entität + typ-erlaubte Operatoren,
        strukturell/code-definiert wie terminalStages, **kein** D51-Wert) · `validate.ts`
        (einziger Gatekeeper — unbekanntes Feld/Operator/Werttyp/enum → wirft; DoS-Tiefenlimit) ·
        `evaluate.ts` (in-memory Prädikat) · `compile.ts` (→ PostgREST, **nie freies SQL**,
        Werte double-quoted → Injection-sicher) · `index.ts` Barrel. **[AUTO]-Tests: 39 neu
        (gesamt 80/80)** inkl. **Injection-Nachweis** (böswillige Werte brechen nicht aus) +
        **evaluate↔compile-Paritätstests** (case-sensitiv, NULL matcht nie außer is_empty).
        **DB-Anwendung** (`query.or(compiled)` an getContacts) + `%`/`_`-Wildcard-Verifikation =
        **K-3** (Live-DB). **Migration 056 gepusht** + `database.types.ts` im Repo → die 60
        DB-Rohzeilen-`any` werden mit **K-3** (echte Listen-/Kontakt-Verdrahtung) ersetzt.
  - [x] **K-2b Profilzeile vereinheitlichen (Retrofit, vor K-3)** — Branch `feat/k2b-profilzeile`,
        beide Gate-Agents PASS. Alle Meta-Spalten (STATUS·HEAT·SUBSCRIPTION·**ZEIT**) identisch
        Label-über-Wert (`CARD.miniLabel` oben, Wert darunter; Zeit-Label **„ZULETZT"**; NULL→ausblenden).
        HunterCard-Zeit-Spalte auf den geteilten Slot umgestellt (`timeMain`/`timeSub`-Eigenbau aufgelöst;
        `timeSubLabel` bleibt nur ECHTER Kontext Urgency/Stagnation, nicht Zweit-Label). **3 lokale
        `daysSince`-Kopien** (NewInPipeline/Stagniert/KeineTask) + Inline-Berechnung (ScreenHunting,
        `contactToColdPerson`) → zentrales **`daysSinceIso`**. LeadListRow-Labels visuell angeglichen
        (STATUS/HEAT/ZEIT alle `CARD.miniLabel`). Verwaister i18n-Key `lastContactSub` entfernt.
        **Maschinell erzwungen:** `audit.ts` Checks „keine daysSince-Kopie" (FAIL) + „nur über
        HunterCard" (FAIL, Allowlist HunterCard+LeadListRow). Kanon in CLAUDE.md + design-system.md.
        **OFFEN → eigener Folge-Punkt „K-FS1" unten.** Farmer-Datenquellen-Diagnose → **[D21-Farmer]**.
        Naming-Schuld erledigt: `Customer.lastLogin` → `lastContactedAt` (Name log nicht mehr).
        ⚠ **Screenshot-QA blockiert** (App hinter Login, keine Credentials) — visuelle Sicht durch Oliver.
  - [ ] **K-FS1 — Hunter-Umbau-Folge-Slice (gebündelt, NICHT isoliert): (a) HunterCard controlled-expand +
        LeadListRow-Dedup · (b) Pipeline-Listenansicht auf K-3-Tabellen-Kanon**
        **(a)** `LeadListRow` ist eine Zweitimplementierung der Profilzeilen-Top-Row (CLAUDE.md Z.588-590
        verlangt „ausschließlich HunterCard"). Auflösung erfordert, `HunterCard` um einen **kontrollierten
        Expand-Modus** (`isExpanded`/`onToggleExpand` + Ganzzeilen-Klick) zu erweitern — betrifft **alle**
        HunterCard-Consumer, daher in K-2b bewusst deferred (Escape-Hatch). Audit-Allowlist-Ausnahme für
        `LeadListRow.tsx` (Check „Profilzeile: nur über HunterCard") ist in `scripts/audit.ts` **BEFRISTET**
        markiert → nach K-FS1 muss `LeadListRow.tsx` RAUS (FAIL greift dann dort).
        **(b) NEU vermerkt (2026-07-17, Olivers Nachtrag):** Die **Hunter-Pipeline-Listenansicht** (Deal-Tabelle
        Kontakt/Firma/Stage/Owner/Wert/Heat, `ScreenHunting`) ist weiterhin eine **eigene, ältere
        Tabellen-Implementierung OHNE die K-3-Fähigkeiten** (Spalten verschieben/ein-ausblenden/Breite/
        Persistenz via `user_preferences`, Lesbarkeits-/Panel-Kanon). Beim Hunter-Umbau auf denselben
        Tabellen-Baustein wie `ScreenKontakte` heben (idealerweise eine geteilte Tabellen-Komponente).
        **Warum zusammen:** (a) und (b) betreffen **denselben Bereich (Hunter-Listen/Karten)** — eine
        gemeinsame Diagnose spart Doppelarbeit. **Timing:** spätestens wenn der **Hunter beim AI-SDR-Bau
        (Punkt 7) ohnehin angefasst** wird — **nicht** als isolierte Extra-Runde. Kein Bau jetzt.
  - [x] **K-3 Kontakte-Screen — FERTIG (CP1–CP4).** Branch `feat/k3-kontakte`.
        **CP1** (`9bb2ac4`): `user_preferences` (Migr. 057, gepusht) + `database.types.ts` regeneriert +
        60 DB-Rohzeilen-`any` typisiert → **Gate 2 HART bei 0**. Row-Composite-Typen in `src/types/rows.ts`
        (ContactRow/DealRow/SignalRow/… inkl. Embeds), db.ts-Feeder-Rückgaben typisiert,
        hunterMappers/ScreenHunting/Sidepanels durchgezogen. **3 latente Bugs aufgedeckt:** (1) `signals`
        hat **kein `occurred_at`** (toter Fallback entfernt); (2) **ScreenMyDay** `c.sherloqStatus ===
        'CHURN_RISK'` — kein `SherloqStatus`-Wert → Churn-Count im Briefing **immer 0** (Cast erhält
        Verhalten, echter Fix = Mein-Tag-Bau); (3) **`contacts` hat keine `city`/`country`-Spalte** → Details-Tab
        Stadt/Land persistiert nie (`rows.ts` optional, **[D-city]** deferred bis K-4).
        **CP2** (`40d3212`): `ScreenKontakte` als **TanStack Table** (nicht Karten) an `getContacts`,
        Route statt ComingSoon, `kontakteMappers` (contactToKontakteRow via contactToProfile + routingFor),
        `LeadSourceBadge` + `RoutingChip` panel-blocks, Spalten (Name/Source/Status/ZULETZT/ICP/Routing),
        Sortierung, `useVirtualizer` innerhalb Seite, Pagination (25/50/100, Default 50), Lade-/Fehler-/Leer-Zustände.
        **CP3** (`e2777d8`): Filter-Pills (STATUS/SOURCE/ICP) → `buildFilterDef` → `evaluateFilter` (K-2, client-seitig
        auf rohen ContactRow[]) · Gmail-Bulk (`selectAllFiltered` + „Alle N im aktuellen Filter") · Spalten-Konfig-Popover
        + „Auf Standard" · Persistenz via `user_preferences` (Laden on-mount, Speichern debounced columnVisibility/sorting/pageSize).
        **CP4**: `KontaktAnlegenPanel` (rechtes Sheet 560px) — K1-Pflicht (`validateContactRequired`, amber) + Live-Duplikat
        (K2 `findDuplicates` onBlur: HARD sicher → rot + Speichern gesperrt, SOFT möglich → gelber Banner) → `findOrCreateCompany`
        + `createContact` (lead_source=manual, Owner via K9). Detail-Panel-Öffnen via `HunterSidepanel`. **Export/Aktionen-Button
        bewusst weggelassen** — serverseitiges „alle im Filter" nicht sauber in K-3 (kommt mit echter DB-Filterung; Entscheidung
        gemeldet). xlsx-lazy-`import()` bleibt Sache des Import-UI (K-5/K-6), hier kein Export-Pfad.
        **QA-Nacharbeit (2026-07-17, Prossis Screenshot-Blick):** (1) `KontaktAnlegenPanel` auf das
        **bestehende Action-Panel-Muster** umgebaut (`panels/ActionPanel` 720px + `PanelField` + graue
        `FIELD`-Optik, 1:1 wie `AddSdrLeadPanel`) — vorher Eigenbau-Sheet (Single-Source-Verstoß). Neuer
        **Audit-Check `checkPanelShellComposition` („Panel: Shell statt Eigenbau" = FAIL)** schließt die
        Blindstelle maschinell. (2) Tabelle vervollständigt: **Spalten-Drag-Reorder + Breite-Ziehen +
        Persistenz** (columnOrder/columnSizing in `user_preferences`), „Standard" setzt jetzt Sichtbarkeit
        **+ Reihenfolge + Breite** zurück. (3) Lesbarkeit: Header `text-text-body`, Pagination-Buttons mit
        Icons + `disabled:opacity-50`. (4) `RoutingChip` blendet **nicht-gebaute Ziele aus** (AI SDR =
        ComingSoon) — Honesty; re-aktivieren sobald AI-SDR-Screen existiert. (5) Filterleiste: 11 Pills →
        **drei Multi-Select-Dropdowns** (Status/Quelle/ICP, `in`-Operator, aktive Zahl im Button) + „Alle
        zurücksetzen"; **erweiterter Filter-Builder = disabled** (folgt mit K-2-Filter-UI, `data-tip`).
        **QA-Runde 2 (2026-07-17):** (5b) Filter überarbeitet — **Status-Pills mit ECHTEN Counts**
        („Alle N · In Campaign N · Pipeline N · Kunde N", nur Status mit Count>0; Counts aus dem
        geladenen Satz ≤1000, nichts erfunden) + **Quelle/ICP in EIN „Filter"-Dropdown** zusammengefasst
        (Leiste läuft nicht über). (9) **Lagebild-Zeile** über der Tabelle: klickbare Bestands-Zahlen,
        **nur KONTAKT-bezogen + hier filterbar** — in K-3 valide: **„Ohne Kontaktweg"** (email+linkedin
        `is_empty`) · **„Opt-outs"** (`contact_status=opt_out`). Echte Counts, Kategorie 0 → weg, alle 0 →
        Zeile weg (Task-getriebene Leere). „Kunden mit Churn Risk" bewusst NICHT (Farmer-Territorium).
        **Anti-Doppel-Begründung (kein Verstoß gegen Mitteilungssystem-Anti-Doppel):** Mein Tag zeigt eine
        **priorisierte Auswahl für heute** (Top 5, „Was mache ich jetzt?"); die Kontakt-Lagebildzeile zeigt
        den **Gesamtbestand** („Wie steht mein Bestand?"). Zwei verschiedene Fragen, keine Doppelung. Jede
        Zahl ist ein Filter (kein Dashboard).
        (10) **Kein „Zuletzt synchronisiert"-Indikator** — kein Sync vorhanden (Honesty).
        **QA-Runde 3 (2026-07-17):** (3) **i18n nachgezogen** — Konvention (useTranslation + `t()` +
        de/en/es.json) war aktiv, meine neuen Komponenten aber hardcodiert Deutsch (dem hardcodierten
        Referenz-Panel folgend). Neuer `kontakte.*`-Namespace (36 Keys × 3, EN/ES = DE-Kopie) +
        `ScreenKontakte`/`LeadSourceBadge`/`RoutingChip`/`CombinedFilter` auf `t()` verdrahtet.
        **`KontaktAnlegenPanel` bewusst NICHT jetzt** (wird in Punkt 1 = „Weitere Details"-Ausbau ohnehin
        umgebaut → i18n dort in einem Zug, `create.*`-Keys liegen schon bereit). (4) `knowledge_base`-Eintrag
        Kontakte um Lagebild/Filter/Spalten-Umbau/Routing-Honesty ergänzt.
        **QA-Runde 3b (2026-07-17):** (1) `KontaktAnlegenPanel` um **aufklappbare „Weitere Details"** ergänzt
        (Muster 1:1 aus `AddSdrLeadPanel`): **Anrede** (salutation) · **Jobtitel** · **Seniority** · **Abteilung**
        (department) · **Telefonnummern mit Primär-Logik** (`PhoneNumbersField` → `contact_phones`-Insert via
        `createContactPhone`, in `createContact` verdrahtet) · **Notizen** — alle Felder **persistieren echt**
        (kein totes Feld). **NICHT übernommen** (fachlich lead-/deal-spezifisch): Pipeline-Stage · „Deal
        hinzufügen" · Owner (auto via K9) · Quelle (systemseitig „manual"). **K1-Pflichtlogik unverändert**
        (Vorname+Nachname ODER LinkedIn; Telefon ist Zusatzfeld, kein Ersatz). Panel jetzt voll i18n-isiert.
        **i18n-Schuld vermerkt (nicht gefixt):** `AddSdrLeadPanel` ist selbst komplett hardcodiert Deutsch —
        neuer expliziter CHECKLIST-Punkt (i18n → Feature-Panels migrieren); ein künftiger `audit.ts`-Check
        für hardcodierte JSX-Strings würde ihn automatisch aufdecken.
        **+ Nachtrag (K-4b-1-QA, 2026-07-17):** auch `HunterSidepanel` Details-Tab-Labels (`Vorname`/`Nachname`
        u.a.) sind hardcodiert statt `t()` — im SELBEN i18n-Backlog-Punkt gesammelt (CHECKLIST → Feature-Panels
        migrieren). Nicht jetzt fixen, künftiger i18n-Aufräum-Slice.
        **Nebenbefund behoben (2026-07-17):** der Token `--signal-danger-text` existierte NIE (still
        gebrochener Pflicht-Stern in `PanelField`/`AddSdrLeadPanel`/`NewDealCard`/`PhoneNumbersField`) →
        auf `--signal-urgent-text` korrigiert; `ScreenPlaceholder` (3 tote `--sherloq-text*`-Tokens) auf
        `--text-primary`/`--text-muted`/`--signal-teal-bg`. Neuer **Audit-Check `checkTokenExistence`
        („Design: Token existiert" = FAIL)** meldet ab jetzt jede `var(--x)`-Referenz auf ein nicht in CSS
        definiertes Token (Framework `--tw-*`/`--radix-*` ausgenommen) — diese Blindstelle kehrt nicht wieder.
        Gates: build ✓ · lint 0 · tsc 0 · 120 Tests ✓ · structure PASS · audit 0 FAIL (24 PASS).
  - [ ] **„+ Kontakt"-Dropdown (Anlege-Wege)** — sobald weitere Wege existieren wird der Direkt-Button
        zum Dropdown: **Manuell** (jetzt) · **CSV importieren** (mit K-5-UI) · **CRM synchronisieren**
        (mit crm_sync-Integration) · **Via Sherloq** (mit Sherloq-Integration). Honesty: nur zeigen was
        funktioniert — bleibt 1 Eintrag, bleibt Direkt-Button. **Ersetzt den früheren „Aktionen-Button"**;
        Import wandert hierher. **K-5-UI = nächster sinnvoller Slice nach K-4** (Engine-Kern liegt bereits,
        `src/lib/import/`). Export „alle im aktuellen Filter" braucht serverseitige Filterung (DB-seitiger
        K-2-Anschluss).
  - [x] **K-3b Listen-Zugang — FERTIG (2026-07-17).** Branch `feat/k3b-listen`. **Statisch UND dynamisch,
        live ausgewertet** (Bauplan K6). Keine Migration nötig (`lists`/`list_members` existieren 005/056).
        **db.ts:** `getLists` (Counts: statisch aus `list_members` in EINER Query, dynamisch je Liste eine
        head-Count über `compileToPostgrest`) · `createList` · `addToList` (nur statisch, upsert-dedupe) ·
        `getListMembers` (statisch Join · dynamisch `compileToPostgrest`-Live-Query) · `deleteList`.
        **UI (`ScreenKontakte`):** „Listen"-Dropdown (Meine Listen: Name+Anzahl+Typ-Icon · „Neue Liste");
        Listenauswahl **ersetzt** die Filteransicht (Aktiv-Leiste mit Typ+Count+✕, Lagebild/Pills ausgeblendet).
        **`NeueListeDialog`:** fragt Statisch|Dynamisch; **dynamisch = aktueller Kontakte-Filter** (`buildFilterDef`
        → `filter_config`, **dieselbe Filter-Quelle, keine zweite UI**); ohne aktiven Filter ist Dynamisch
        deaktiviert + Hinweis (Honesty). **`ZuListeDialog`** (geteilt Bulk + Einzel): **nur STATISCHE Listen
        wählbar; dynamische ausgegraut + Hinweis „Mitglieder automatisch über die Regel"** (Olivers Zusatz) +
        „Neue statische Liste" inline. Zwei Zuordnungswege: **Bulk** (Tabellen-Auswahl → „Zu Liste") **+ Einzel**
        (`ListPlus`-Button im `HunterSidepanel`-Header). i18n `kontakte.lists.*` (28 Keys × 3). **Live-Auswertung**
        (kein Cron/materialisiertes `list_members` für dynamisch) — `filter_config` bleibt Single Source, spätere
        AI-SDR-Materialisierung (Feed/`sync_list_campaigns`) ohne Umbau. Gates grün, beide Agents.
        **Deferred (benannt):** voller K-2-Filter-Builder-UI (eigener Slice) · AI-SDR-Feed-Cron.
  - [x] **K-3b Phase A — Listen-Verwaltung (2026-07-17, Branch `feat/k3b-listen-verwaltung`).** QA-Lücken
        nachgezogen: **Liste löschen** (`ui/alert-dialog`-Bestätigung, irreversibel) · **umbenennen**
        (Inline im Listen-Dropdown, Hover-Stift) · **Kontakt aus Liste entfernen** (nur STATISCH, nur
        Mitgliedschaft — `removeFromList`; Bulk-Button in der Bulk-Bar + Per-Zeile-Hover in der aktiven
        Listenansicht; **nie** Kontakt gelöscht/archiviert) · **Toasts** für alle Listen-Aktionen (add
        vorhanden; Verkabelung verifiziert: ToastProvider gemountet, Toast `z-[60]` über Dialogen `z-50`).
        db.ts neu: `renameList` + `removeFromList`. i18n `kontakte.lists.*` ergänzt. Teil der A→B→C→D-Reihe
        (A Listen · B Avatar · C geteilte Tabelle+Spalten+Suche · D K-4 Companies).
  - [x] **Listen-Bugfix (2026-07-17, Branch `fix/listen-invalidierung`, Prossi live gefunden).** „Add zu Liste"
        zeigte keinen Toast + aktive Listenansicht aktualisierte erst nach hartem Reload. Ursache: Erfolgsfall
        toastete im Dialog + invalidierte nur `["lists"]`, **nicht** `["listMembers"]`; der Einzel-Add-Pfad
        (HunterSidepanel) hatte **gar kein `onDone`**. Fix: `ZuListeDialog.onDone({count,listName})` → **Eltern**
        toasten (garantiert gemountet) + invalidieren `["lists"]` **und** `["listMembers", org]` in **beiden**
        Add-Pfaden. Umbenennen/Löschen/Entfernen waren bereits korrekt (mitgeprüft). **Lehre für Phase C:**
        dieser Invalidierungs-Fehler darf beim Tabellen-Extrakt NICHT mitwandern.
        **Runde 2 (Toast weiterhin unsichtbar — aktiv im Browser reproduziert):** Root-Cause = der Toast
        hing zu 100% an der `fadeIn`-Animation (`from{opacity:0}`); wird die Animation nicht advanced
        (eingefroren/Tab-Throttling), bleibt der Toast bei **`opacity:0`** → unsichtbar. Fix: neuer
        `@keyframes toastIn` (nur Transform, **kein** Opacity-Keyframe) + `.toast-enter` → Toast ist IMMER
        `opacity:1`, Animation kann ihn nie unsichtbar lassen (im laufenden Browser verifiziert: opacity 0→1).
        **UX (Punkt 3):** Toast-Baustein um optionale **Aktion** erweitert (`ToastAction`); die „Add"-Bestätigung
        trägt **„Liste ansehen"** → setzt den Listen-Filter (`openList`), **kein Auto-Sprung** (Kontext bleibt).
        Einzel-Add (Panel-lokaler Toast) bewusst ohne Aktion (wäre Screen-Wechsel). **Punkt 4:** Listen-Dropdown
        von custom `{open&&<div>}` auf **shadcn `Popover`** (Projekt-Muster wie `CombinedFilter`) → **click-outside
        + Escape** schließen automatisch; `portal={false}` wegen Inline-Rename-Input.
  - [x] **Prefetch-Perf-Slice (2026-07-17, Branch `feat/prefetch-hook`, vor Phase C).** Hover-Intent-Prefetch
        war nur inline in `HunterCard` → Kontakte-Tabelle + `LeadListRow` öffneten das Sidepanel ohne Vorladen
        (spürbare Ladezeit). Fix: zentraler Hook **`useHoverPrefetch()`** (`src/hooks/`, 120 ms + Cancel, ein
        Timer je Instanz, Unmount-Cleanup) — das „WANN"; `lib/prefetch.ts` bleibt das „WAS". **Angewandt:**
        HunterCard (auf Hook umgestellt, DRY), **ScreenKontakte-Zeile**, **LeadListRow**. **CLAUDE.md REGEL C**
        (analog Regel A): jede „Klick-öffnet-Panel/Seite"-Affordance MUSS den Hook + passende `prefetch*`-Funktion
        nutzen. **Folge (eigener Slice):** `prefetchFarmerPanel` (Subscription/Usage) beim Farmer-DB-Wiring ·
        `prefetchCompanyPanel` direkt in Phase D (die geteilte Tabelle bekommt den Hook).
  - [ ] **Campaign-Zuweisung — Anschlusspunkt (AI-SDR-Slice 6)** — Bulk-Aktion **+ Zeilen-Aktion**
        „Zu Campaign hinzufügen" wird in AI-SDR-Slice 6 nur **aktiviert**, nicht neu gebaut. Struktur
        vorbereitet (Bulk-Bar-Muster + `selectAllFiltered`-Auswahl über den ganzen Filter). **Beim
        AI-SDR-Bau nicht übersehen.** (Kein Campaign-Button in K-3 — bewusst, kein AI SDR vorhanden.)
  - [x] **Farbige Avatare — FERTIG (Phase B, 2026-07-17, Branch `feat/avatar-farben`).** `shared/Avatar.tsx`
        (einzige Avatar-Komponente, ~16 Aufrufstellen) auf **deterministische Farbe aus dem Namen** umgestellt
        (stabiler Hash → fester `--avatar-*`-Token, gleicher Name = gleiche Farbe), **weiße Initialen**
        (`text-on-accent`). 8 benannte Tokens in `index.css` (nie Hex im Code). **Bewusst EINE Palette für
        Light+Dark** (kein `[data-theme]`-Override): gesättigte Mid-Tones poppen auf beidem UND halten weiße
        Initialen ≥3:1 — eine hellere Dark-Variante würde genau diesen Weiß-Kontrast senken. **Status-Punkt
        weggelassen** (bis ein echtes Feld ihn speist). Propagiert automatisch auf alle Aufrufstellen.
        **Finale Palette (8 Tokens):** `--avatar-emerald #059669` · `--avatar-cyan #0891B2` · `--avatar-blue #2563EB`
        · `--avatar-indigo #4F46E5` · `--avatar-violet #7C3AED` · `--avatar-magenta #DB2777` · `--avatar-amber #B45309`
        · `--avatar-red #DC2626`. **Änderung ggü. Vorschlag:** `--avatar-teal #0D9488` **raus** (zu nah am
        Marken-Teal/Gradient `#175253` → ein Avatar dürfte nie wie ein aktiver Zustand wirken) → ersetzt durch
        **`--avatar-cyan #0891B2`**: klar kühler/blauer und deutlich heller als das dunkle, entsättigte Marken-Teal,
        füllt den Kühl-Slot ohne Verwechslung; von `--avatar-blue` (Royalblau) durch den Grün-Blau- Stich getrennt.
  - [x] **K-3 Phase C — Geteilte Tabellen-Komponente (2026-07-17, Branch `feat/shared-datatable`).**
        Tabellen-Mechanik aus ScreenKontakte extrahiert: **`useDataTable`** (Tabelle + Persistenz
        `user_preferences`) · **`DataTableCard`** (Header drag/resize/sort · virtualisierter Body ·
        Pagination · Zustände · **Hover-Prefetch** eingebaut · `rowActions`-Slot) · **`ColumnConfigPopover`**
        (beliebig große Spaltenliste). ScreenKontakte darauf migriert (Filter/Lagebild/Listen/Panels bleiben).
        **Erweiterte Spalten:** 6 default + **17 Set-B-Spalten** (default aus, im Popover wählbar) —
        getContacts um `contact_phones` + `owner:users!assigned_to` erweitert (Telefon + Lead-Owner echt).
        Chrome-i18n generisch `table.*`; Spalten-Labels `kontakte.col.*`. **1:1-Abgleich** gegen die
        44-Punkte-Checkliste (`docs/phaseC_kontakte_funktions_schnappschuss.md`) — alle erhalten.
        **Verhaltensänderung (intern, UX identisch):** Bulk-Auswahl nutzt jetzt TanStack-Bordmittel
        (`getIsAllPageRowsSelected` / materialisierte „alle im Filter"-Auswahl) statt eigenem
        `selectAllFiltered`-Flag. Companies (Phase D) baut auf `DataTableCard` + `prefetchCompanyPanel`.
  - [x] **K-4 Companies-Screen + Detail** (4c: ScreenCompanies) — K-4a Liste (`feat/companies-list-k4a`) +
        K-4b-1 Übersicht/Kontakte + K-4b-2 Deals/Aktivität/Notizen, alle gemergt. **[D-city]** mit erledigt
        (`contacts.city`/`country` verdrahtet). **Companies-Modul funktional komplett.**
  - [x] **K-5-UI Import-Bildschirm FERTIG (Branch `feat/k5-import-ui`, STOP für Live-QA, 18.07.2026)** —
        Vollbild-Wizard `/app/kontakte/import` (ohne Sidebar), 4 Schritte ECHT verdrahtet: Upload
        (`parseImportFile` **dynamisch** → xlsx als eigener `parse-*`-Chunk, nicht im Haupt-Bundle) →
        Mapping (`buildMappingPlan`/`applyMapping`, shadcn-Select) → Preview (`loadDedupUniverse`/
        `validateImport`/`summarize`, `KpiCard`/`StatusBadge`/`EmptyState`, Fehler-CSV-Download) → Import/Report
        (`runImport` mit **echtem `onProgress`**, `undoImport`). Einstieg: „Aktionen"-Dropdown in ScreenKontakte.
        i18n `import.*` (de/en/es), Registry-Eintrag `screen_kontakte_import`. **Design aus AI-Studio-Referenz
        übersetzt** (Tokens statt Hex, echte Daten statt Mock, echter statt Fake-Fortschritt, `<style>`/Font weg).
        Beide Agents PASS, Gates grün (140 Tests, audit 0 FAIL). **Nicht umgesetzt / reduziert (Regel B):**
        (1) **„Zusammenführen" pro Duplikat = K-6** → als deaktivierte Select-Option „kommt mit K-6" sichtbar
        markiert (nicht weggelassen); Report zeigt daher kein „aktualisiert", nur erstellt/übersprungen/fehlgeschlagen.
        (2) **Vorlagen-Erkennung** (`import_templates`, `headerSignature`) = **Folge-Slice** (db-Funktionen fehlen) —
        bewusst ausgeblendet für den ersten Schnitt (Olivers Freigabe). (3) AI-Mapping unbekannter Header = an AI-Pipeline.
        **Migration 059 (import_batch_id) ist auf Remote angewendet** (db push freigegeben).
        **Live-QA-Funde behoben (18.07.2026):** (1) **Preview-Bug** — `loadDedupUniverse`/`findDuplicates`
        embeddeten `company:companies(name)` OHNE FK-Hint → `PGRST201` (2 FKs) → `dedupQuery.isError` →
        Schritt 3 zeigte alles 0 + leere Tabelle. Fix `company:companies!company_id(name)` (live reproduziert
        + verifiziert) + ehrlicher `isError`-Zweig statt still 0. (2) **i18n** — `common.next` fehlte
        (roher Text) → de/en/es ergänzt. (3) **UX** — wiederverwendbarer `shared/Stepper` mit CSS-Mikro-
        Animation (Linie wächst, Kreis-Pop, spiegelverkehrt beim Zurück, `prefers-reduced-motion`).
    - [x] **Live-QA Runde 2 (18.07.2026, mit K-6b) — Diagnose + Fixes:**
          **(1) „Duplikate nach Import nicht gefunden" = KEIN Bug, erwartet.** `buildImportPlan`: Zeilen mit Status
          `duplicate` werden per Default **übersprungen** (nicht eingefügt) → nach dem Import existiert nur die
          bestehende Einzelkopie, kein Paar. Gegen echte DB verifiziert (17 Kontakte, **0** exakte E-Mail-/LinkedIn-/
          Name-Dupes) → „Duplikate verwalten" zeigt korrekt „Keine gefunden". Wer sie im Merge-Screen sehen will, muss
          im Import „trotzdem anlegen" wählen. **(2) Ungemappte Spalten = korrekt.** `applyMapping` liest nur Spalten
          mit `field!==null`; unbekannte Spalten werden ignoriert, der Kontakt wird trotzdem gebaut/importiert (nie
          verworfen). **(3) BUG behoben — weiße Seite bei „Ohne Kontaktweg".** `linkedin_url` fehlte in der
          Filter-Registry (`lib/filter/schema.ts CONTACT_FIELDS`) → `validateFilter` warf im `useMemo` → Render-Crash →
          leere Seite. Fix: `linkedin_url: { type: "text" }` registriert + Regressionstest (`evaluate.test.ts`).
          **Pill-Audit systematisch:** Kontakte Status-Pills (contact_status) ✅ · Opt-outs ✅ · Filter Quelle/ICP ✅ ·
          „Ohne Kontaktweg" ❌→✅ · Companies (reines JS-Filtern, kein Schema) Industry/Size/Country/„Ohne Kontakt" ✅.
          **(4) Undo-Vorschau gebaut:** Undo-Button öffnet jetzt einen `alert-dialog` mit Anzahl der zu entfernenden
          neu angelegten Kontakte (`result.created`), statt sofort zu löschen. i18n `import.undoConfirm*` in de/en/es.
          **(5) Honesty-Fix Undo-Ergebnis (Runde 3):** Nach erfolgreichem Undo transformiert sich der GANZE
          Ergebnis-Block in-place (statt eine falsche „1 NEU ERSTELLT"-Stat stehenzulassen): Icon RotateCcw (info-Ton),
          Headline `undoneTitle`, Subtext `undoneDesc`, „Neu erstellt"-Stat = alter Wert durchgestrichen + **0**,
          Undo-Button weg → statische Bestätigung, „Zu den Kontakten" bleibt. Report in reine Komponente
          **`ImportResultReport`** (named export, prop-driven) extrahiert → Render-Test `ImportResultReport.render.test.tsx`
          (beide Zustände: doneTitle+echter Wert+Undo-Button ↔ undoneTitle+durchgestrichen+0+kein Undo). i18n
          `import.undoneTitle/undoneDesc` de/en/es.
    - [ ] **Import v2 — State-of-the-Art-Ideen (NICHT vor Projekt-Ende angehen — reine Politur-Vormerkung).**
          Erst ganz am Schluss, wenn das gesamte Produkt steht: **(a) Intelligentes KI-Spalten-Mapping** — erkennt auch
          ungewöhnliche/mehrsprachige Spaltennamen (hängt an AI-Chat/Langfuse, Prompt `import_mapping_v1`, ai_chat C27).
          **(b) Live-Anreicherung während des Imports** — fehlende Felder (E-Mail/Firma/Jobtitel) automatisch aus
          LinkedIn/Datenquelle nachladen (`lib/enrichment.ts`, nur leere Felder füllen). **(c) Mapping-Vorlagen** —
          merkt sich wiederkehrende Datei-Strukturen (`import_templates` + `headerSignature`; db-Funktionen fehlen noch).
          **(d) Undo mit Detail-Vorschau** — über die reine Anzahl hinaus eine Liste der betroffenen Kontakte (Query auf
          `import_batch_id`). *(Anzahl-Vorschau ist mit Runde 2 bereits gebaut; die Namensliste bleibt v2.)*
    - [ ] **[D-import-aichat-cta]** — Post-Import **AI-Chat-CTA** ist als Platzhalter gebaut (`ImportResultReport`,
          Erfolgsfall, Button **disabled** + „Coming soon"-Tooltip, i18n `import.aichatCta*`/`aichatComingSoon`).
          **Sobald der AI Chat gebaut wird** (laut Fahrplan erst nach AI SDR): dieser Button muss den `import_batch_id`
          (bzw. die Liste der gerade importierten Kontakt-IDs) als **Kontext an die neue Chat-Session** übergeben, damit
          der Chat direkt weiß, über welche Leads gesprochen wird, ohne dass der Nutzer sie erneut nennen muss.
          **Jetzt bewusst KEINE Datenübergabe-Logik** — AI-Chat-Architektur (Tool-Registry/Session-Format) steht noch nicht.
    - [x] **Schicht 4 Ausführung (design-unabhängig VORGEZOGEN, 18.07.2026)** — Branch
          `feat/k5-import-execution` (fertig-gegated, **Migration 059 NICHT gepusht** — db-push = Gate;
          Branch bewusst NICHT nach main bis zum Push). Beide Agents PASS. `lib/import/execute.ts` (rein +
          8 [AUTO]-Tests, gesamt 140): `buildImportPlan` (valid→anlegen, Duplikat/Fehler→skip, Fehler-Override
          ignoriert = K8-Honesty; **Merge pro Zeile = K-6, bewusst nicht hier**) + `extractEmailDomain`
          (Company-Domain-Match). `db.ts`: `loadDedupUniverse` (Dedup-Universum in EINER Query = kein N+1) ·
          `resolveCompanyForImport` (Domain- dann Name-Match, neu mit `import_batch_id`; Domain nicht auf Insert
          wegen Unique-Constraint) · `runImport` (ruft die **zentrale `createContact`** mit `{leadSource:'csv',
          importBatchId}` — keine Insert-Kopie K1/K7; echte Zähler K8; kaputte Zeile stoppt nicht) · `undoImport`
          (soft-delete NUR im Batch neu erstellte contacts+companies, 7-Tage-Frist K4, audit via 058-Trigger).
          `createContact` um `{leadSource, importBatchId}` erweitert (Single Source); `NewContactInput` +
          city/country/tags. **Migration 059**: `import_batch_id` (nullable, FK on delete set null, partieller
    - [x] **Schicht 4 Ausführung (design-unabhängig VORGEZOGEN, 18.07.2026)** — Branch
          `feat/k5-import-execution` (fertig-gegated, **Migration 059 NICHT gepusht** — db-push = Gate;
          Branch bewusst NICHT nach main bis zum Push). Beide Agents PASS. `lib/import/execute.ts` (rein +
          8 [AUTO]-Tests, gesamt 140): `buildImportPlan` (valid→anlegen, Duplikat/Fehler→skip, Fehler-Override
          ignoriert = K8-Honesty; **Merge pro Zeile = K-6, bewusst nicht hier**) + `extractEmailDomain`
          (Company-Domain-Match). `db.ts`: `loadDedupUniverse` (Dedup-Universum in EINER Query = kein N+1) ·
          `resolveCompanyForImport` (Domain- dann Name-Match, neu mit `import_batch_id`; Domain nicht auf Insert
          wegen Unique-Constraint) · `runImport` (ruft die **zentrale `createContact`** mit `{leadSource:'csv',
          importBatchId}` — keine Insert-Kopie K1/K7; echte Zähler K8; kaputte Zeile stoppt nicht) · `undoImport`
          (soft-delete NUR im Batch neu erstellte contacts+companies, 7-Tage-Frist K4, audit via 058-Trigger).
          `createContact` um `{leadSource, importBatchId}` erweitert (Single Source); `NewContactInput` +
          city/country/tags. **Migration 059**: `import_batch_id` (nullable, FK on delete set null, partieller
          Index) auf contacts+companies. **Robustheit:** `createContact` sendet `import_batch_id` NUR beim Import
          → manueller Anlege-Pfad bleibt unabhängig von 059 (Spalte remote noch nicht da). xlsx bleibt aus dem
          Haupt-Bundle (db.ts importiert `extractEmailDomain` direkt aus `execute.ts`, nicht via Barrel).
          **OFFEN bei Rückkehr:** `supabase db push` (059) → dann Branch mergen; danach fehlt nur die Import-UI.
  - [~] **K-5 Smart-Import — Engine-Kern (dep-frei) VORGEZOGEN** (Reihenfolge-Flexibilität
        Dauerregel 4, während K-3-Design bei Oliver läuft — **hier vermerkt, nicht stillschweigend**).
        Branch `feat/k5-import-engine`. Gebaut (rein + [AUTO]-Tests, 28 neu / 108 gesamt):
        `src/lib/import/` — **Schicht 1 dep-frei** (`detect.ts`: Encoding-BOM + Trennzeichen-Erkennung,
        „deutsches Excel = Semikolon", quote-bewusst) · **Schicht 2** (`mapping.ts`: Synonym-Wörterbuch
        de/en → CRM-Feld, Kollisions-Regel, `headerSignature` für `import_templates`-Vorlagen-Erkennung,
        `applyMapping`) · **Schicht 3** (`validate.ts`: Pro-Zeile Pflichtfeld K1 + Format + Duplikat K2
        `classifyDuplicate` inkl. **Intra-Datei-Duplikate**, `summarize`=Report K8). Nutzt K-1b
        (`validateContactRequired`/`classifyDuplicate`) + `import_batches`/`import_templates` (live).
        **Schicht 1 echtes Parsen FERTIG** (`parse.ts`, Deps `papaparse`+`xlsx` freigegeben +
        als CLAUDE-Ausnahme dokumentiert): CSV (Encoding UTF-8→Windows-1252-Fallback, Trennzeichen,
        Quotes/Zeilenumbrüche) + Excel (xlsx, erstes Sheet), Größen-/Zeilen-Limits. **[AUTO]-Akzeptanz
        grün:** deutsches Semikolon+ISO-CSV, echtes .xlsx (12 Tests, gesamt 120). ⚠ **Build-Note:**
        `parse.ts` muss im Import-UI **dynamisch** (`import()`) geladen werden → xlsx nicht im Haupt-Bundle.
        **NOCH OFFEN:** (a) **AI-Mapping** `import_mapping_v1` (C27/AI-Chat); (b) **UI**
        (Upload/Mapping-Vorschau/Review — mit K-3/K-4-Design); (c) **Schicht 4 Ausführung** (Edge Function,
        resumierbare Batches, `contacts/companies.import_batch_id`-Spalte für Undo, Company-Domain-Match, Report/Undo).
  - [x] **K-6 Duplikate verwalten + Merge — FERTIG (18.07.2026, in `main`).** *(Der folgende Absatz ist die historische Ausgangs-Diagnose; umgesetzt via K-6a Merge-Backend · K-6-fuzzy · K-6b UI — siehe die abgehakten Einträge weiter unten. Die damals offenen „2 Entscheidungen + Design" sind alle getroffen/geliefert.)*
        **Bestand:** `classifyDuplicate`/`classifyCompanyDuplicate` (dedup.ts, K2) + `findDuplicates` (db.ts, Einzel) da;
        **keine** Merge-Funktionen, **merge_candidates-Tabelle existiert NICHT** (per DB geprüft), **kein visuelles Design**
        (§13-Spec in ui_interaktionen vorhanden). **FK-Kaskade Contact-Merge:** communications · contact_phones · deals ·
        leads · list_members · messages · notes · signals · tasks → Gewinner. **Company-Merge:** contacts.company_id +
        primary_company_id · deals · notes · signals. **KANON-WIDERSPRUCH Merge-Semantik:** §13 „User wählt PRO FELD"
        vs. CLAUDE Datenqualität #4 „Bestand gewinnt automatisch, fehlende Felder auffüllen" → **Oliver entscheidet**.
        Design-Prompt: `docs/design_prompt_k6_duplicates.md`.
    - [x] **K-6a Merge-Backend FERTIG (design-unabhängig, KEINE Migration/kein Push, 18.07.2026)** — Branch
          `feat/k6a-merge-backend`. Entscheidungen: **(1) Merge-Semantik „Auto-Default + Pro-Feld-Override"**
          (befüllter Datensatz gewinnt, Lücken füllen, pro Feld übersteuerbar — kanonisch, CLAUDE #4 + §13
          angeglichen) · **(2) merge_candidates später** (K-6b, „Kein Duplikat"-Persistenz). `lib/merge.ts` (rein,
          **13 [AUTO]-Tests**): `resolveMergeFields` · `pickPrimaryId` · `findDuplicatePairs`/`findCompanyDuplicatePairs`
          (sichere Treffer E-Mail/LinkedIn/Domain exakt) · FK-Tabellen-Konstanten. `db.ts`: `getDuplicatePairs`/
          `getCompanyDuplicatePairs` · **`mergeContacts`/`mergeCompanies`** — Feld-Merge + **vollständige FK-Kaskade**
          (communications/contact_phones/deals/leads/list_members/messages/notes/signals/tasks → Gewinner;
          list_members konfliktbereinigt via UNIQUE(list_id,contact_id); contact_phones entprimärt) + Verlierer
          Soft-Delete (audit via 058-Trigger). **Akzeptanz „Testfall pro Verweistyp"** über FK-Coverage-Tests erfüllt.
          **Fuzzy-Paare nachgezogen (18.07., Branch `feat/k6-fuzzy-pairs`):** `findDuplicatePairs`/
          `findCompanyDuplicatePairs` liefern jetzt auch **möglich**-Paare (Name+Firma bzw. Firmenname unscharf,
          über `classifyDuplicate` K2). Kontakt-Fuzzy über Firmennamen-Buckets (bounded, kein globales O(n²)),
          Doppel-Vermeidung (sicher überschreibt möglich). 16 Merge-Tests. `getDuplicatePairs` zeigt beide Stufen.
          **Offen (Folge):** merge_candidates-Persistenz („Kein Duplikat") · **K-6b UI** (Duplikate-verwalten-Screen
          + Merge-Dialog — **braucht Olivers Design**, Prompt `docs/design_prompt_k6_duplicates.md`).
    - [x] **K-6b UI FERTIG (18.07.2026)** — Branch `feat/k6b-duplicates-ui`. AI-Studio-Export als reine Struktur-/
          Ablauf-Referenz übersetzt (kein 1:1-Copy: Hex→Tokens, Mock→echte Paare, setTimeout→echter Query-Ladezustand,
          `<style>`-Tag weg, confirmMerge mit alert-dialog **VOR** Ausführung ergänzt). **`ScreenDuplicates.tsx`**
          (Vollbild-Route `/app/kontakte/duplicates`, ohne Sidebar — wie Import): Tabs Kontakte|Companies (Initial-Tab aus
          `?tab=`), echte Queries `getDuplicatePairs`/`getCompanyDuplicatePairs` (K-6a, staleTime 30s, enabled pro Tab),
          Paar-Karten (Avatar + Level-Badge sicher=warn/möglich=muted + Grund), **Merge-Dialog** (shadcn `dialog`,
          Feld-für-Feld A/B nur für **abweichende** Felder via `diffFields`, Honesty-Hinweis) → **alert-dialog-Bestätigung**
          → `mergeContacts`/`mergeCompanies`. **3. Aktion** (Regel-B-Ergänzung): „Datensatz löschen" A/B im **⋯-Überlauf-Menü**
          (`dropdown-menu`) → alert-dialog → `softDeleteContacts`/`softDeleteCompanies` (**nicht** Merge). Leer-/Lade-/Fehler-
          Zustand (EmptyState/PanelSkeleton). „Kein Duplikat" = lokales Dismiss (merge_candidates-Persistenz weiter Folge).
          **Einstieg:** „Duplikate verwalten" im Aktionen-Dropdown von ScreenKontakte **und** ScreenCompanies (`?tab=companies`).
          `db.ts`: `getCompanyDuplicatePairs` liefert jetzt `CompanyDuplicatePairView` (a/b Records). `diffFields` in `merge.ts`
          (+ Test, 17 Merge-Tests). **Registry** `screen_duplicates`. **i18n** `duplicates.*` (47 Keys) + `common.retry` +
          `kontakte.manageDuplicates` in **allen drei** Locales. **Render-Test** `ScreenDuplicates.render.test.tsx` (3 Fälle,
          Live-DOM: echtes Paar/kein Fake · Merge-Dialog A/B + Bestätigung-vor-Ausführung + Override-Wert · Löschen ruft
          softDelete, nicht Merge). Gates alle grün (build/lint/168 Tests/structure/audit 0 FAIL), test-runner + auditor PASS.

**2.** [~] **[BAU] Vorab-Migration Entitlement & Credits** — *Kern gebaut + gemergt (19.07.); nur dokumentierte Haken offen.*
  (`docs/for_ai_sdr_vorab_entitlement_credits.md` — PFLICHT vor AI-SDR-Slice-5)
  - **GEBAUT + GEMERGT 19.07.2026 (Option A)** — db push erfolgt, in `main`.
    Branch `feature/entitlement-credit-layer`. Additive Migr. **061** (metadata-Spalte ·
    `settings.billing` als [D51]-Config-Heimat statt nicht-existenter `system_config` · Seeds
    internal-Plan `-1`/Subscription/credit_balance/Config; **RLS bereits vollständig in 011**, nicht
    dupliziert) · **062**
    (RPCs `check_entitlement`/`check_credit_balance`/`consume_credits` + `_billing_config`, atomar,
    security definer, intern blockiert nie, kein Plan-Name-Vergleich) · **063** (`reset_credit_balances`
    + täglicher Cron). Formel-Spiegel `src/lib/credits.ts` (+`credits.test.ts` 19 Tests, Mirror-Pattern
    wie `_shared/terminalStages.ts`). `audit.ts` GLOBAL_TABLES-Ausnahme (plans/plan_limits). Gates: build/
    lint/190 Tests/structure/audit **0 FAIL**; test-runner + auditor **PASS**.
  - **Haken (bewusst NICHT gebaut, dokumentiert §9):** (a) `aiCall()`-Verdrahtung — `lib/ai.ts`
    existiert noch nicht, `consume_credits` wird am ersten echten AI-Call-Slice angeklemmt · (b)
    Promo/Voucher-`redemption_codes` (Bonus-Topf additiv andockbar, kein Umbau) — Launch-Phase.
  - **Fundament-Härtung Migr. 064 (19.07.2026), gepusht + gemergt:** Punkt 0 (angewandte Parameter
    in `credit_transactions.metadata` eingefroren → Rückwirkungsfreiheit) + Punkt 5 (globale
    `billing_config` + `_billing_config` global→per-Key-Override; bestehende Orgs behalten Override,
    neue erben global). TS-Spiegel `resolveBillingConfig`/`buildFrozenChargeMeta` + Tests. Onboarding-
    Provisioning-Regel vermerkt. **Diagnose-Punkte 1-4 bleiben dokumentierte Andock-Haken** (nicht gebaut).

**3.** [~] **[OLIVER] Integrations-Session 0** — *teilweise erledigt (19.07.2026)*
  (`docs/integrations_masterplan.md` Abschnitt 2 — Nango · Google-Testing-App ·
  Microsoft-App · Langfuse · Gemini-Key · System-Mail-Kanal.
  Auf „weiter" lieferst du die **Klick-Anleitung** und verdrahtest danach die Keys.)
  - **✅ Nango + Outlook:** Account/Projekt live, Outlook über Nangos geteilte Test-App,
    eine Test-Connection (`panda.pau@web.de`, `connection_id f615aa32-…`, `errors:[]`) verifiziert.
    `nango_secret_key` im Supabase Vault (Konvention lowercase snake_case wie `app_service_role_key`,
    README dokumentiert). API-Erreichbarkeit smoke-getestet (`GET /connection`).
  - **⬜ Offen:** Google Mail (→ **[D-google-own-app]**) · Langfuse-Key · Gemini-Key · System-Mail-Kanal.

  > **[D-google-own-app]:** Google Mail braucht eine EIGENE Google-Cloud-OAuth-App (Testing-Modus,
  > eigene Konten als Test-User) statt Nangos geteilter App — Nangos Standard-App wird von Google
  > für Gmail-Scopes blockiert. Aufwand: ca. 15-20 Min, komplett selbst gemacht, KEINE Wartezeit/
  > Verifizierung nötig (nur Testing-Modus). Muss erledigt sein, bevor Google-Mailbox-Verbindungen
  > im AI SDR genutzt werden können. Outlook ist unabhängig davon bereits nutzbar.

  > **[D-nango-own-apps]:** Aktuell läuft die Mailbox-Verbindung über Nangos geteilte Standard-App
  > (zeigt „Nango" statt „Sherloq" im Consent-Screen der Nutzer, feste Standard-Scopes). Muss auf
  > eine EIGENE Google-Cloud-App + Microsoft-Entra-App-Registrierung umgestellt werden, BEVOR ein
  > echter externer Nutzer (nicht nur wir selbst) eine Mailbox verbindet — wichtig für Vertrauen/
  > Branding beim Consent-Screen und volle Scope-Kontrolle. Umstellung ist unkritisch (nur Austausch
  > der Credentials in Nango, kein Code-Umbau).

**4.** [~] **[BAU] Mitteilungs-Fundament N-S1 + N-S2-Minimal** (`docs/mitteilungssystem_bauplan_v1.md`)
  - **N-S2-MINIMAL GEBAUT + GEMERGT 19.07.2026 (Option A/Route).** Branch
    `feature/notifications-bell-ns2`. TopBar-Glocke + Ungelesen-Badge (RLS-Query, Realtime live) ·
    Route `/app/notifications` (4 Gruppen nur Ungelesenes · Verlauf-Tab 90T · Klick=gelesen+navigate N13 ·
    Alle-als-gelesen · EmptyState) · db.ts 4 RLS-Queries (kein `notify()`) · `realtime.ts`
    `subscribeToNotifications` echt verdrahtet (user-gefiltert) · Registry `screen_notifications` · i18n ·
    +7 Tests. **Keine Migration.** Gates 0 FAIL, test-runner + auditor. **Live-QA nur eingeloggt** (RLS;
    Demo-Modus = leer, korrekt). **Bewusst Folge-Slices:** Inline-Source-Buttons (Chat C6/Betrieb B3) ·
    Settings-Matrix (N-S4) · Aktions-Popup+E-Mail (N-S4) · Aktivitätsfenster (N-S3) · Client-Realtime für
    andere Listen (Stub bleibt).
  - **N-S1 GEBAUT + GEMERGT 19.07.2026** (db push erfolgt). Branch `feature/notifications-foundation-ns1` (gelöscht).
    Migr. **065** (`notifications` + `activity_events` + `settings.notifications` additiv · Idempotenz-Key
    **MIT `user_id`** · Pflicht-Indizes inkl. partiell `read_at IS NULL` · RLS · Realtime `supabase_realtime`
    + `notifications`) · **066** (`notify()` Idempotenz-Upsert N12 + Rollen-Fanout + „Zeile schreiben →
    Fan-out später"; `log_activity()`) · **067** (Cleanup-Cron DELETE: read >90T / activity >30T). Registry
    `src/lib/notifications.ts` (+`.test.ts` 9 Tests). i18n `notifications.*` (3 Locales). Alle
    Zukunftsfähigkeits-Fixes drin (Punkte 2/3/5 + Realtime); Punkt 4 (Kanäle) + AI-Chat-Lesetool nur
    dokumentiert. **CLAUDE.md Notifications-Sektion angeglichen** (settings.notifications statt
    notification_preferences; Postgres-`notify()`). **N-S2 (Glocke/UI) = Folge-Slice**, hier nicht gebaut.
  - **Diagnose-Konsequenz für später:** Realtime-CLIENT-Verdrahtung (`realtime.ts`-Body, aktuell Stub) +
    `activity_events` in die Publication gehören zu N-S2/N-S3.
  - **[D-notify-rpc-guard] vor N-S2 (Auditor-Hinweis):** `notify()`/`log_activity()` sind security-definer
    ohne Org-Guard/`REVOKE` (bewusst wie `consume_credits` — in N-S1 nur server-seitig SQL-Cron/Edge genutzt).
    **Bevor** sie als **Frontend-RPC** exponiert werden (N-S2), org-scopen (auth_org_id-Prüfung im
    authenticated-Pfad, service_role/Cron ausgenommen) + `REVOKE EXECUTE FROM anon/authenticated`.
  - **[D-notify-ai-chat-config]:** Die Benachrichtigungs-Einstellungen (`settings.notifications`) sollen
    später auch über den AI Chat änderbar sein, nicht nur über die Settings-UI — passt zum
    Konfigurierbarkeits-Prinzip [D51]. Umsetzung mit dem AI-Chat-Slice, kein Mehraufwand jetzt.

**5.** [~] **[BAU] Betrieb Slice B-1 MINIMAL** (`docs/betrieb_ueberwachung_bauplan_v1.md`)
  - **GEBAUT + GEMERGT 19.07.2026** (db push + Edge-Deploy erfolgt). Branch `feature/ops-monitoring-b1` (gelöscht).
    Migr. **068** (`cron_runs`/`system_alerts`/`cron_expectations` global + RLS + Indizes + Klartext-Seeds) ·
    **069** (`cron_run_start`/`cron_run_finish`-Wrapper · Retention-Cron · 063/067 umgestellt · `run_watchdog`
    gebündelt + Watchdog-Cron 15 Min). 4 Edge-Crons (035/037/049/051) schreiben cron_runs in ihren Functions.
    `alertTemplates.ts` (+Test). `/health`-Stub. audit `GLOBAL_TABLES` += 3 Tabellen. Gates 0 FAIL, test-runner
    + auditor. **⚠ Edge-Deploy nötig** (`supabase functions deploy score-*`) damit die 4 Edge-Crons cron_runs
    schreiben — separate Aktion neben db push.
  - **Bewusst Folge-Slices/Haken:** B9 (aiCall-Fehlererfassung + KI-Smoke-Test) → mit erstem `aiCall`/`lib/ai.ts` ·
    System-Mail-Kanal (Critical-Mails) → B-2 (jetzt In-App-only, dokumentierter Preis: Nacht-Ausfälle erst beim
    App-Öffnen sichtbar) · Sentry/`lib/monitoring.ts` → B-2 (ErrorBoundary-Anker steht) · Status-Seite + Mini-
    Indikator → B-4 (B-1 bleibt backend-only).

**6.** [~] **[BAU+DESIGN] Settings SET-1 bis SET-4** (`docs/settings_bauplan_v1.md`;
  **SET-2 wartet auf Olivers vorhandenes Design** — Abgleich nach dessen Abschnitt 6)

  - ✅ **SET-4a „REGELN"-SEITE FERTIG + GEMERGT 22.07.2026** (Merge `a212588`, `--no-ff`, gepusht;
    Branch `feature/set4a-regeln-bausteine` gelöscht; local main == origin/main). **Slices 2a**
    (Bausteine `WhyPopover`/`WeightEditor`/**`ValueChip`**/`HeatThresholdTile` + `RuleRow`-Erweiterung)
    **+ 2b** (Seite: 5 Regel-Gruppen — Heat · Pipeline+Follow-up · Churn+Upsell · Signale&ICP ·
    Mein-Tag-Verweis — + leere Layout-Reserve „Eigene Actions") **+ Referenz-Überarbeitung** (farbige
    Heat-Kacheln über `HEAT_STATUS`-Tokens, ehrliche 0–100-Score-Darstellung statt „Summe bis Schwelle",
    value-first Gruppe 4, **Slider-Bug gefixt** via lokalem Drag-State + `onValueCommit`) **+ Feinschliff**
    (Heat-Badge Icon-im-Badge, Spalten-Ausrichtung) **+ Doku [D52]**. EIN Schreibweg `updateSettings`
    (chat-fähig), Rechte-Gates `rules.edit`/`pipeline.manage`/`automation.manage` (Server erzwingt).
    Gates grün (vitest 419, audit 0 FAIL, build ✓); test-runner **ALLE GATES GRÜN** + auditor **AUDIT: PASS**.
    **Mit 4a offen geblieben (dokumentiert):** [D-set4-group4-signalcap] (Gruppe 4 — `signal_windows`
    schreibbar + Kappungs-Key; 4a editiert bereits `signal_fresh_hours`/`max_ai_adjustments_per_lead`/
    `icp_score_threshold`) · [D-lifecycle-trigger] (Gruppe 5 — eigener Slice, `conditions[]` über `src/lib/filter`).
  - ✅ **LIFECYCLE-TRIGGER-BAUKASTEN L-1 (Backend-Fundament) FERTIG + GEMERGT 22.07.2026** (Merge `e250118`,
    Migr. **088** gepusht + remote per DO-Block 12/12 verifiziert; test-runner + auditor PASS). Aus [D-lifecycle-
    trigger] (SET-4a Gruppe 5) vorgezogen. `lifecycle_rules` (Cross-Entity Option B: `anchor_entity` + `conditions`
    {logic, groups[]}) · `lifecycle_rule_runs` (Einmal-Feuer-Zustand) · `action_types` (Registry als Daten) ·
    plan_limits · RLS/Index/audit-Trigger · RPCs `upsert/delete_lifecycle_rule` (automation.manage, Grammatik-
    Validierung, plan_limit-Blocker) + `db.ts`-Chat-Vertrag. L2-Sofortgewinn: churn/upsell/health_score +
    stagnation_days filterbar. Doku [D53] (`set_contact_status` Governance) + [D54] (Chat-Fehler-Rückmeldung).
  - ▶ **NÄCHSTE SLICE: L-2 LIFECYCLE-AUSWERTER** — *[BAU].* Edge Function (cron-gewrappt + `cron_expectations`):
    je Regel-Gruppe `compileToPostgrest` → **Anker-ID-Mengen-Algebra** (AND=Schnitt/OR=Vereinigung über
    `deals.contact_id`/`primary_company_id`) → **Einmal-Feuer-Semantik** über `lifecycle_rule_runs` (Match-Zustand
    nicht-match→match) → **Aktions-Handler** für Gruppe-1 (`notify`/`notify_urgent`/`create_task`/`add_tag`/
    `add_to_list`). Nutzt `evaluateFilter`/`compileToPostgrest` (Single Source, kein Sprach-Neubau). Danach **L-3**
    UI Condition-Builder (in „Eigene Actions"-Reserve). **[D54] beachten:** strukturierte Fehler-Rückmeldung.
  - **QUEUED (nach dem Lifecycle-Thread): SET-4b „Automation"-Seite** — *[BAU], nächste Settings-Seite im 4a–4d-Arc.*
    Settings → Arbeitsweise → **Automation** (`settingsNav` key `automation`, `built:false`): Editor für Automation-
    Level/Risk-Rules über `update_settings` + `automation.manage`-Gate. Danach **4c** Pipeline-Stages-UI · **4d**
    Mein-Tag-Gewichte. **Reihenfolge-Hinweis (nie stillschweigend):** der ▶ ist bewusst auf den **Lifecycle-Thread
    (L-2/L-3)** vorgezogen — SET-4b/4c/4d folgen danach; Item 2 Rest-Haken + Items 3–5 weiterhin dahinter.
  - **SET-1 Rechte-Fundament FERTIG + GEMERGT 19.07.2026** (Migr. 070/071 gepusht, 11/11 live-verifiziert, Merge `b79b11c`).**
    Live-Akzeptanz gegen Remote (11/11 PASS, self-abortierender DO-Block, kein Testdaten-Rest): member ohne Recht→false /
    grant→sofort true / member-Löschen ohne Recht verweigert / mit Recht ok / Cross-Org-grant verweigert / Letzter-Owner
    geschützt / audit_log-Eintrag / **ohne Session löschen+merge → „nicht authentifiziert"** / Katalog=3 / member-Matrix=0.
    Serverseitiger Wächter als Postgres-Funktionen (`has_permission` deny>grant>Rolle · `grant`/`revoke_permission`
    Cross-Org+Admin-Hierarchie · `set_user_role` Owner-only+Letzter-Owner-Schutz · `soft_delete_contacts`/
    `_companies`/`_deals` erzwingen `records.delete` → **[D-delete-rights] Teil 1 geschlossen** · Merge über
    `assert_permission('records.merge')`). Global `permission_catalog` + `role_permissions` (datengetriebene
    Matrix), `user_permissions` gehärtet (`effect` grant|deny, UNIQUE, Audit). TS-Spiegel `lib/permissions.ts`,
    Hook `useEffectivePermissions` (fail-safe), UI-Gate `RequiresPermission`/`usePermission`, CLAUDE-Dauerregel
    „Rechte-Check-Pflicht". Verstreute Rollen-Checks abgelöst (`TeamSettings`/`MfaBanner`/`updateUserRole`).
    **Katalog-Umfang v1 (Teil-D-Scan, Option 3): NUR heute-existierend** — `team.invite` · `records.delete` ·
    `records.merge`. **NICHT jetzt:** Einzelrechte-/Papierkorb-UI (SET-3), Nav-Rollen-Ausblendung (SET-2),
    AI-Chat-Tool-Bindung, Viewer-Read-only-Enforcement.

  - **SET-2 „PERSÖNLICH"-UI FIXES 19.07.2026 (nach Live-Test) — GEMERGT** (Migr. 074 gepusht, Merge `0f16896`).**
    (1) **Bug behoben:** Sidebar las die Ansicht-Prefs nicht (hardcodierte Listen) → liest jetzt `getNavPreferences`
    mit gleichem Query-Key wie AppearanceTab → Ausblenden/Reihenfolge wirkt **sofort ohne Reload** (Regressionstest).
    (2) **booking_provider auf E3-Kanon** (`calcom`|`external`, Migr. 074 `update_my_profile`) — UI: „Cal.com" /
    „Externer Link" (freies URL-Feld). (3) Signatur größer (8 Zeilen), Rolle-Anzeige verifiziert, **Statistik**
    (eigene Kontakte + deren Companies via `get_profile_stats`), **„Dabei seit"** (users.created_at).
    **Sidebar-Änderung:** Screens/Data-Mittel-Divider entfällt (flache Reihenfolge, da Ansicht frei sortiert).
  - **DEFERRED — „Mein Profil"-Folge-Ideen (dokumentiert, kein Bau jetzt):**
    - **[D-profile-signature-richtext]** — Signatur mit Formatierung (fett/kursiv/Link/Bild). Braucht echten
      Rich-Text-Editor + sichere Speicher-Entscheidung (HTML-Sanitizing). Eigener kleiner Folge-Slice im Profil.
    - **[D-profile-avatar-upload]** — echter Bild-Upload (aktuell nur Initialen/Anzeige, Entscheidung B). Braucht
      `lib/storage`-Infrastruktur. Eigener kleiner Folge-Slice.
    - **[D-profile-team-view]** — Team-Zugehörigkeit geprüft & verworfen: aktuell deckungsgleich mit der Org
      (keine Unter-Teams im System). Neu bewerten, falls echte Unter-Teams eingeführt werden.
    - **[D-profile-usage-analytics]** — tiefere Nutzungs-/Aktivitäts-Statistik (Login-Häufigkeit, Verlauf) bewusst
      NICHT auf „Mein Profil" → künftiges „Berichte"-Modul (Recht „Reports ansehen" existiert, Seite nicht).
      Verwandt: `last_seen_at` aus SET-3-Diagnose — sobald dort befüllt, könnte „Zuletzt aktiv" auch hier dezent
      erscheinen. Nur vermerkt.

  - **PERSONAL VOICE — REFERENZ-FELDER (Backend/UI 2/n) FERTIG 22.07.2026** (Gates grün: build/tsc/lint/
    structure-check/audit + test-runner + auditor PASS; **noch nicht gemergt** — STOP mit Screenshot-QA
    aller 5 Reiter offen). **Baut auf Migr. 084 auf** (Schreibweg lag schon vor). Umgesetzt nach neuem
    UI-Slice-Ablauf (Regel-A-Analyse + 00_Designs-Referenz geöffnet + 3-Richtungs-Gap-Liste + Freigabe):
    - **db.ts-Typen gesplittet:** `VoiceOverview` {bio·tone·**core_topics (Liste)**·style·~~themes (alt, versteckt)~~} ·
      `VoiceChannel` gemeinsam {tone_attributes(L)·sentence_structure·vocabulary(L)·emoji_formatting·dos_donts·samples}
      + kanal-spezifisch {post→hook_strategies(L) · comment→engagement_patterns · dm/email→cta_style} ·
      `VoiceListItem` {id,text}. Alte Keys `sentence_style`/`hooks`/`themes` bleiben im Typ (DB-Sicherheitsnetz), UI-versteckt.
    - **UI `PersonalVoicePage`/`ChannelFields` kanal-abhängig:** Listen via `KnowledgeListField`, Texte via
      `KnowledgeField`, dezente graue Icons (`iconEl`), 2-Spalten-Attribut-Grid wie Referenz + Company Profile.
      E-Mail-Reiter bleibt (bewusst, DM-analog). Do's&Don'ts (immer/nie) bleiben je Kanal (bewusster Zusatz).
    - **`fieldImportance` voice-Scope neu** (recommended = je Kanal Beispiele+Satzbau, Overview bio/style/tone →
      weiterhin 11 gezählte Felder; Listen/Emoji/Kanal-Spezifika/dos_donts = optional) · **`companyKnowledge`**
      `valueOf` normalisiert jetzt 3 Formen (Text · Liste [{id,text}] · dos_donts {always,never}).
    - **i18n de/en/es** (echte Übersetzungen) · **Render-/Completeness-Tests** angepasst + erweitert (kanal-
      spezifische Felder, Listen-Save schickt volle [{id,text}]-Liste). 36/36 grün.
    - **VORGEMERKT [D-voice-altfelder-cleanup]:** Alte DB-Keys `sentence_style`/`hooks` (Kanäle) + `themes`
      (Overview) erst NACH der Daten-Neueingabe entfernen (Migration + Whitelist-Bereinigung) — jetzt bewusst
      als Sicherheitsnetz behalten. Siehe deferred-Abschnitt.
    - **Offen (nächster Schritt):** Daten-Neueingabe der getrennten Voice-Inhalte (Chat-Claude liefert Inhalt,
      Schreibweg `update_voice_profile`) — nach Olivers Screenshot-QA + Merge.

  - **MEIN-UNTERNEHMEN-TEXTFELDER WACHSEN MIT (UI-Feinschliff, 22.07.2026, gleicher Branch)** — Gates grün,
    test-runner + auditor PASS. Mehrzeilige Felder aller drei Bereiche (Personal Voice · Company Profile ·
    Product) wachsen zeilenweise mit dem Inhalt (einheitliche 3-Zeilen-Starthöhe, Deckel 8 Zeilen, danach
    Scroll). **EINE zentrale Stelle:** neuer Hook `src/hooks/useAutoGrowTextarea.ts`, konsumiert nur über
    `KnowledgeField` (FIELD-Kanon) → alle mehrzeiligen Felder automatisch; kein zweiter Wachstums-Weg.
    Messung immer aus `height:auto` (idempotent, kein Zittern); `ResizeObserver` misst NUR bei Breiten-
    Änderung (Rückkopplungs-Schutz) + jsdom/SSR-Guard. **Paar-Kopplung** (`createCoupleGroup`/`useCoupleGroup`):
    dos_donts „immer"/„nie" wachsen bündig auf das längere, feedback-frei, **strikt opt-in** (`coupleGroup`-
    Prop) → nicht gekoppelte Felder unberührt. Min/Max als benannte Tokens `--field-min-lines`/`--field-max-lines`/
    `--field-line-height`/`--field-pad-y` (index.css) + Plain-Class `.field-autogrow` (schlägt shadcn
    `min-h-[80px]`). Unit-Tests der Kopplungs-Logik (Konvergenz/keine Rückkopplung/Opt-in/Abmelden).
    **MyProfileTab** (Persönlich, rohes Textarea) bewusst out of scope. **Betrifft ausschließlich die drei
    Bereiche** — alle `KnowledgeField`-Konsumenten liegen in settings/Mein Unternehmen (Hunter/Farmer/CRM nutzen
    `DetailField`, nicht betroffen). Teil desselben STOP wie oben (noch nicht gemergt).

  - **PERSONAL VOICE — REFERENZ-FELDER (Migration 1/n) FERTIG 21.07.2026** (Migr. **084** gepusht + remote
    per DO-Block verifiziert 6/6; Gates grün, test-runner + auditor PASS, F: N.A.). **Nur der Schreibweg** —
    Backend-Typen/UI/i18n + Daten-Neueingabe folgen als nächste Slices. **Grund:** Referenz-Abgleich
    (`00_Designs/…/PersonalVoiceCard`) ergab, dass unser Sammel-Feld `sentence_style` **4 getrennte
    Referenz-Felder** bündelt (Tonfall/Satzbau/Wortwahl/Emoji&Format) und `hooks` **3 kanal-spezifische**
    (Post: Hook-Strategien · Comment: Engagement-Muster · DM: CTA-Stil). **Migr. 084 = `update_voice_profile`
    neu** (KEIN ALTER TABLE, KEINE Daten-Änderung): per-Kanal-Whitelist (overview {bio,tone,style,themes,
    core_topics}; post +hook_strategies; comment +engagement_patterns; dm+email +cta_style; E-Mail DM-analog,
    Referenz kennt kein E-Mail), Listen-Felder (core_topics/tone_attributes/vocabulary/hook_strategies) als
    Array-mit-id validiert. **Alte Keys (`sentence_style`/`hooks`/`themes`) bewusst BEHALTEN** → transition-safe
    (heutige UI schreibt sie noch); shallow-merge überschreibt nie Nachbar-Keys → **kein Datenverlust**.
    **`sales_approach` bleibt EIN Textfeld** (= bestehendes `style`, Oliver-Entscheidung: KI braucht Zusammenhang).
    **Offen (nächste Slices):** db.ts-Typen (`VoiceOverview`/`VoiceChannel` splitten) · UI `PersonalVoicePage`/
    `ChannelFields` (kanal-abhängig: Listen via KnowledgeListField, Texte via KnowledgeField) · i18n de/en/es ·
    `fieldImportance` voice-Scope · Render-Tests · **Daten-Neueingabe** der getrennten Inhalte (Chat-Claude).
    **Company Profile** (Diagnose gleiche Runde): nahezu deckungsgleich, nur 2 kleine fehlende Felder
    (`org_icps.description` · `org_personas.archetype`) — **✅ ERLEDIGT 22.07.2026 (Migr. 086, siehe unten).**

  - **COMPANY PROFILE ABGESCHLOSSEN — ICP-`description` + Persona-`archetype` (22.07.2026)** — Gates grün,
    test-runner + auditor PASS; **noch nicht gepusht/gemergt (Freigaben separat).** Die zwei letzten
    Referenz-Felder (Diagnose bestätigt, Referenz `00_Designs/CompanyProfile.tsx`) ergänzt:
    - **`org_icps.description`** = ICP-Kurzbeschreibung (einzeiliger Subtext unter dem Namen) ·
      **`org_personas.archetype`** = Personen-Archetyp (kurzes Label). Beide **nullable text, kein Default**
      (bestehende Einträge bleiben ehrlich leer). Analog zur bestehenden `name`-Spalte.
    - **Migr. 086:** 2× `alter table add column` + `update_icp`/`update_persona` um den jeweiligen Key
      **EINZELN** erweitert (Whitelist + field_meta-Lock + audit_log, `''`→NULL) — **kein zweiter Schreibweg**.
    - **db.ts:** `IcpRow.description` / `PersonaRow.archetype` (+ Select/Mapper, null→""). **UI:** je ein
      einzeiliges `KnowledgeField` (`showAi={false}`) als erstes Element im ICP-/Persona-Body — **identisch
      zum `name`-Feld** (save-on-blur, ring-loser Fokus, kein Sonderweg). **i18n de/en/es** (echte Übersetzungen).
    - **Field-Contract:** ICP/Persona sind bewusst NICHT in `fieldImportance` (nur Voice/Product/org dort) —
      ihr Vertrag lebt in der RPC-Whitelist; description/archetype exakt konsistent dort registriert, nicht mehr/weniger.
    - **Tests:** CompanyProfilePage-Render-Test um 2 Fälle erweitert (einzeiliges Feld + Save über
      `updateIcp({description})` / `updatePersona({archetype})`). 389/389.

  - **SET-4 FUNDAMENT (1/2 + 2/2) FERTIG 21.07.2026** (Migr. **083** gepusht + remote per DO-Block verifiziert;
    Gates grün, test-runner + auditor PASS je Teilschritt). **Der Schreib-Unterbau für den Regeln/Automation/
    Pipeline-Bereich — die Seiten (4a–4d) folgen.** (1/2) **3 neue Rechte** `rules.edit`/`pipeline.manage`/
    `automation.manage` (Katalog + role_permissions owner+admin + `permissions.ts`-Spiegel + Test) und **EIN
    validierter Schreibweg** `update_settings(p_patch)`: Top-Level-Whitelist {thresholds, automation_defaults,
    pipeline_stages} · **bereichs-spezifisches** Rechte-Gate (nicht ein pauschales settings.manage) ·
    Zweitebene-Key-Whitelist je Bereich · **Min/Max PRO FELD** im RPC (Helfer `settings_chk_num`/`_group`;
    kein system_config) · **Won/Lost-Schreibschutz** (gewonnen/verloren müssen bleiben; RPC = dokumentierter
    3. Spiegel von hunterMappers/terminalStages) · shallow-merge + `audit_log`. (2/2) **`RuleRow`** (panel-block):
    wiederverwendbare Klartext-Regel-Zeile (Satz + anklickbarer Wert, shadcn-Popover mit Min/Max, `portal={false}`,
    Doppelvalidierung Client+Server) + `updateSettings`-db.ts-Wrapper. **Diagnose bestätigt:** Gruppen 1–3 (Heat/
    Pipeline/Churn+Upsell) liegen schon in `settings.thresholds` (konfigurierbar, edge-frisch gelesen) → 4a nur
    Editor-UI. **Offen dokumentiert:** [D-set4-group4-signalcap] (Gruppe 4: signal_windows schreibbar + Kappung,
    mit 4a) · **[D-lifecycle-trigger]** (Gruppe 5: eigener Slice, conditions[] über `src/lib/filter`).

  - **MEIN UNTERNEHMEN 3b/3 „UNTERNEHMENSPROFIL — ICP & PERSONAS" FERTIG + GEMERGT 21.07.2026**
    (Migr. **081/082** gepusht + remote per DO-Block verifiziert; Gates durchgehend grün, test-runner +
    auditor PASS über alle Teilschritte). **Damit ist der volle „Unternehmensprofil"-Screen (3 Reiter) fertig.**
    Zielgruppen (ICPs) + Personen (Personas) als **eigenständige, verschachtelte Datensätze (1:N)** nach dem
    **products-Muster** — bewusst NICHT als jsonb-Liste (KnowledgeListField kann keine Kindbeziehung).
    **DB (081):** `org_icps` (name, fit_level CHECK{high,medium,low} nullable, Text-Listen company_profile/
    fit_rationale/desired_outcomes/problems_solved, is_active weich, field_meta) + `org_personas`
    (FK icp_id CASCADE, buying_role CHECK{decision_maker,influencer,champion,end_user,blocker} nullable,
    job_titles [PFLICHT match_persona] + responsibilities/goals/priorities/core_problems/objections/
    exact_wording/inferred_wording, is_active, field_meta); RLS tenant_isolation, Index org(+icp_id),
    audit-/updated_at-Trigger. **fit_level/buying_role = feste System-Enums** (CHECK, kein [D51]-Config;
    CLAUDE.md-Vermerk). **RPCs (082):** create/update/delete_icp + create_persona(icp_id)/update/delete_persona
    — je settings.manage · Cross-Org-Guard · Key-Whitelist · Listen-Item-id-Pflicht · field_meta-lock ·
    audit_log · weiches Löschen (wie delete_product). Enum-Werte NICHT dupliziert (CHECK = Quelle), '' → null.
    **UI (3b-3):** 3. Reiter `PanelTabs`; **neuer Baustein `EntityCardList`** (verallgemeinertes Produkte-
    Karten-Muster: einklappbare Karten, Anlegen + AlertDialog-Löschen, Name-Feld, renderBody-Slot,
    variant primary/nested, eigener openId-Scope je Instanz → Verschachteln sicher — Single Source, einmal
    gebaut, zweimal genutzt); `getIcpsWithPersonas` (EIN verschachteltes Embed, kein N+1). **Layout-Korrektur
    (97cbef5):** Zwei-Spalten-Layout (mobil einspaltig), dezente graue Lucide-Icons je Sektions-Label,
    Abstands-Rhythmus, kompaktere Listen, **Passungs-/Kaufrollen-Badge** im Karten-Kopf (StatusBadge,
    fit high=success/medium=warn/low=muted, role=muted; live über dasselbe Select; null→kein Badge).
    **3 Konsistenz-Fixes (3184eb6, auf gemeldete Geschwister-Stellen angewandt):** ProductPricingPage
    Nutzen|Zielgruppe zweispaltig + **Preismodell-Badge** im Karten-Kopf (StatusBadge tone=info); PersonalVoicePage
    Do's|Don'ts nebeneinander. `KnowledgeListField`/`EnumField`/`EntityCardList` um icon-/headerBadge-Prop erweitert.
    i18n `company.profile.icp.*`/`persona.*` in de/en/es (131 Keys verifiziert, kein Hardcode). +6 Render-Tests
    (CompanyProfilePage 12). **Echte Daten live** (Sherloq Company Profile + 4 ICPs/Personas · Olivers Personal
    Voice) über die validierten RPCs eingetragen. **Offen (Mini):** AE-Kaufrolle steht auf `influencer` (Annahme,
    per RPC auf `end_user` änderbar). **[KB]** knowledge_base-Eintrag als Seed in `docs/knowledge_base.md`
    (KB-DB-Migration weiter deferred bis AI-Chat/RAG).

  - **MEIN UNTERNEHMEN 3a/3 „UNTERNEHMENSPROFIL — ÜBERBLICK & ANGEBOTE" FERTIG + GEMERGT 21.07.2026**
    (Migr. **080** gepusht + remote verifiziert; Gates grün, test-runner + auditor PASS ×2; Überblick- +
    Angebot-&-Markt-Reiter + AI Context Builder je Screenshot QA'd). Erster von zwei Sub-Slices der
    „Unternehmensprofil"-Seite — **Reiter 3b „ICP & Personas" (`org_icps`/`org_personas`) bleibt offen**.
    **DB (080, rein additiv):** `org_profile` +jsonb `summary`/`product_service_model`/`value_outcome` +
    Listen `problems_solved`/`business_outcomes`/`offerings`; `competitors` neu als `[{id,name,why_us,kind}]`
    (Daten-Migration setzt Bestand auf `kind:'direct'`). **Einziger Schreibweg** `update_org_profile` erweitert
    (Skalar- + Listen-Whitelist, pro-Item `id`-Validierung, `competitors` name+kind∈{direct,adjacent},
    `field_meta`-lock, `audit_log`). **RPC live per self-abortierendem DO-Block getestet** (gültiger Patch ·
    unbekannter Key wirft · invalider kind wirft · fehlende id wirft; Rollback, 0 Rückstände). **UI**
    `CompanyProfilePage` (features/settings): 2 Reiter (Überblick/Angebot & Markt) via `PanelTabs`; oben
    Zusammenfassung + **AI Context Builder** (dunkles `--ai-panel-*`-Panel, 2 disabled „Folgt"-Buttons) ;
    Vollständigkeits-Ring (`fieldImportance.ts` +6 org-Felder, Scope `"org"`). **Neuer Baustein**
    `KnowledgeListField` (panel-block): generische wachsende Liste für jsonb-`{id,…}`-Arrays, `fields`-Config
    (Einzel=Zeile, Mehr=Karte), Regel-A-Diagnose (`DetailPhoneList` geprüft, Read-Mode passt nicht → Eigenbau).
    **Leerzustand-Fix (Korrektur nach Live-Test):** Einzelfeld-Listen (USPs/Probleme/Ergebnisse) zeigen leer
    EINE leere, direkt beschreibbare Zeile (kein „Noch nichts eingetragen."-Text) + dezenten „+ hinzufügen"-Link;
    leerer Draft wird nicht persistiert (Honesty). **Reusable/geändert:** `KnowledgeField` label optional +
    `showAi`; **Token-Rename** `--voice-trainer-*` → `--ai-panel-*` (shared AI Voice Trainer + AI Context Builder),
    PersonalVoicePage migriert. i18n `company.*` in de/en/es. **Doku:** ai_sdr_bauplan Personas-Korrektur;
    CLAUDE.md panel-block-Tabelle. **Offen (mit 3b):** ICP-/Persona-Reiter · **knowledge_base-Eintrag +
    session_uebergabe** (bei vollem Screen-Abschluss, nicht pro Sub-Slice) · Umzug USPs/Wettbewerber aus
    „Produkte & Preise" ist mit 3a **erledigt** (leben jetzt hier im Unternehmensprofil).

  - **MEIN UNTERNEHMEN 2/3 „PERSONAL VOICE" FERTIG + GEMERGT 20.07.2026** (Migr. **078/079** gepusht +
    remote verifiziert; Gates grün, test-runner + auditor PASS; 5 Tabs live-verifiziert je Screenshot).
    Die eigene Schreibstimme **pro User** (`visibility:'self'`) — was der AI SDR später zum Texten in
    DEINER Stimme braucht, klar getrennt von `contacts.personality_profile` (Empfänger). **DB:**
    `voice_profiles` (078, org+user, RLS pro-User `user_id=auth.uid() AND org`, UNIQUE(org,user),
    `field_meta`-locked wie 077) · **einziger Schreibweg** `update_voice_profile` (079, Self-Service
    ohne `settings.manage`, Top-**und** Sub-Key-Whitelist, Shallow-Merge je Kanal save-on-blur-sicher,
    `audit_log`). **RPC live per self-abortierendem DO-Block getestet** (gültiger Patch → locked/manual ·
    unbekannter Key wirft · Shallow-Merge bewiesen · fremde Identität abgewiesen; Rollback, 0 Rückstände).
    **UI** `PersonalVoicePage` (features/settings): 5 Kanäle **overview + post/comment/dm/email** (email die
    bewusste 5. Ergänzung, das Design kennt sie nicht) via `PanelTabs`; je Feld `KnowledgeField`; Kanal-Felder
    **Schreibstil · Aufmacher · „Das machst du immer" (✓) / „…nie" (⚠) · Beispiele (ganz unten)** — die zwei
    Do's&Don'ts-Teile leben im **selben** Feld `dos_donts` (`{always,never}`, keine Migration). **Voice-Karte
    + AI-Voice-Trainer nebeneinander (6/6);** die Trainer-Kachel ist eine **bewusste Einzelfall-Ausnahme**
    (Original-Dunkel-Optik türkis, Tokens `--voice-trainer-*` in `index.css`, kein Hex im JSX) mit **zwei
    echten `ui/button`** (size sm, gefüllt+hell, rounded-full) — alle KI-Aktionen bleiben `AI_PILL_PENDING`
    „Folgt" bis `lib/ai.ts`. Vollständigkeits-Ring über **dieselbe Registry** (`fieldImportance.ts` +20 Voice-
    Felder, neuer Scope `"voice"` in `computeCompleteness`). `KI ausfüllen`-Pill im Kanäle-Header (wie Produkte).
    **Reusable dabei:** `SettingsCard` um optionale `headerAction`/`className` erweitert · `KnowledgeField` um
    optionalen Label-`icon`. **Honesty:** leere Voice → ehrlicher Leerzustand; Jobtitel/Firma nur bedingt
    (users-Tabelle hat die Spalten nicht → korrekt unsichtbar, Logik vorbereitet). i18n `voice.*` in de/en/es.
    **Offen:** Slice 3 (Unternehmensprofil + `org_icps`/`org_personas` + Umzug USPs/Wettbewerber).
    **[D-voice-admin-help]** (Owner/Admin hilft neuem Mitglied bei leerer Voice) bewusst deferred.

  - **MEIN UNTERNEHMEN 1/3 „PRODUKTE & PREISE" FERTIG + GEMERGT 20.07.2026** (Migr. 077 gepusht,
    11/11 live-verifiziert, Merge `963b3a2`). Erste Seite der Gruppe **„Mein Unternehmen"** (SET-KB-2).
    `org_profile` als schlankes Gerüst (usps/competitors/`field_meta` **mit `locked`** als Schutz vor dem
    späteren Website-Scan) · `products` (028) **additiv** erweitert statt zweiter `product_info`-Tabelle
    (sonst fände der Nutzer sein Produkt nicht im Deal-Dropdown wieder) · **`ai_may_reference_price`**
    pro Produkt, Default false, als **harte Bedingung** im AI-SDR-Bauplan verankert · EIN Schreibweg
    (`update_org_profile`/`create_product`/`update_product`/`delete_product` weich) mit Key-Whitelist +
    `settings.manage` + `audit_log` · Texte als `jsonb` (Mehrsprach-Andockhaken `i18nText`).
    **UI:** durchgehend sichtbare graue Felder (Muster-Korrektur nach Live-Test), einklappbare Produkte
    mit „X offen"-Hinweis, KI-Knöpfe im Teal-Pill-Kanon (Funktion „Folgt" bis `lib/ai.ts`),
    regelbasierte Vollständigkeit mit Wirkungshinweis. **Projektweit entstanden:** Wichtigkeits-Registry
    `fieldImportance.ts` (einzige Quelle der Feld-Wichtigkeit) · Dauerregel **„Chat-Aktions-Vertrag-Pflicht"**
    (CLAUDE.md) · **„Progressive Ausführung"** (ai_chat_bauplan 5a) · `FIELD`/`AI_PILL`-Kanon in
    `componentBehavior.ts`. **Offen:** Slice 2 (Personal Voice, 5 Kanäle inkl. `email`) · Slice 3
    (Unternehmensprofil + `org_icps`/`org_personas` + Umzug von USPs/Wettbewerbern, die bis dahin bewusst
    über keine Oberfläche erreichbar sind).

  - **SET-3 TEAM & RECHTE FERTIG + GEMERGT 19./20.07.2026** (Backend + UI, Migr. 076 gepusht, 18/18 live-verifiziert, Merge `ad34c94`).**
    Settings-Shell `/app/settings` mit Zurück-Button + VOLLSTÄNDIGER Gruppen-Nav (Bauplan Abschnitt 1) — nur „Team & Rechte"
    gebaut, Rest ausgegraut/„Folgt" (künftige Slices setzen nur `built:true` in `settingsNav.ts`, keine Struktur-Änderung mehr).
    Persönlich = dezenter Verweis auf /app/profil (keine Gruppe). Mitglieder (Rolle/Status/zuletzt aktiv/Aktionen), Einladen
    mit Dedup + Link-Kopieren, Offene Anfragen als „Folgt"-Karte, Personen-Detail mit `PERMISSIONS.map()`-Rechten + Historie.
    Backend: `users.status` (weiches „removed", kein Hard-Delete), Guards (Cross-Org/Selbst-Lockout/letzter Owner/Admin≠Owner),
    zwei Audit-Lücken geschlossen (`set_user_role`, personen-gescoptes `grant/revoke_permission`), `set_last_seen`.
    **NICHT jetzt (Haken):** echtes Realtime für `user_permissions` · volle Audit-Log-Seite (SET-6) · `approval_requests` (C6)
    · Einladungs-Mailversand ([D29]) · Inhalt der ausgegrauten Gruppen (je eigener Slice).
    · **Mitglieder-Zeile-Feinschliff (20.07.2026, gemergt+gepusht):** Zeilen-Hover (`hover:bg-app-bg`, bestehendes Muster) ·
    expliziter „Rechte anzeigen"-Knopf je Zeile · Rollen-Badge vor den Status, als `StatusBadge` — **nur Owner** dezent
    farbig (`tone="info"`), andere neutral/grau; keine Rolle-/Status-Überschriften; Inline-Rollen-Select bleibt. Render-Test (3),
    i18n `viewPermissions` de/en/es. (Live-Screenshot der Zeile im Dev-Bypass nicht möglich — RLS ohne Session = 0 Zeilen; per Test verifiziert.)

  - **SET-2 „PERSÖNLICH"-UI FERTIG + GEMERGT 19.07.2026** (Mein Profil/Ansicht/Sicherheit, Merge `0f16896`).**
    Zugang gebündelt hinter dem Avatar-Dropdown (Route `/app/profil`, 3 Reiter via `PanelTabs`) — NICHT in der
    Haupt-Settings-Nav (Bauplan-Struktur-Korrektur eingetragen, `6a2ed07`). Echte Daten: `updateMyProfile`
    (Name/Booking/Signatur, Auto-Save) · Sprache via `setLanguage`+`user_preferences('ui.language')` ·
    `getNavPreferences`/`setNavPreferences` (Nav ein/aus + Reihenfolge, Einstellungen fest) · Passwort mit
    Re-Auth-Verifikation + `updatePassword` · SSO-Anzeige `getUserIdentities`. Neu: `SettingsCard` + `useSaveState`,
    shadcn `switch`/`textarea`, `typo-page-title`. **Keine Personal-Voice-Karte** (→ Mein Unternehmen). 11 Render-Tests.
    Entscheidungen A–F wie vorgeschlagen. **Kein db push nötig** (reine UI auf vorhandenem Backend).

  - **SET-2 BACKEND/DATENGRUNDLAGE FERTIG + GEMERGT 19.07.2026** (keine UI; Migr. 073 gepusht, Merge `53e4123`).**
    Allgemein: `settings.general` (Sprache/Zeitzone/Datumsformat/Währung); Mein Profil: `users.booking_provider/
    booking_link/signature`; neues Recht `settings.manage` (owner+admin). Validierte Update-RPCs `update_general_settings`
    / `update_my_profile` (audit_log, Falle 2). Merge-Lesen mit Defaults zentral: `settingsDefaults.ts` +
    db.ts `getGeneralSettings/getMyProfile/getNavPreferences`. Ansicht via `user_preferences` (057, kein Schema nötig).
    Sicherheit: `updatePassword` (vorhanden) + `getUserIdentities`. Area-5 Rollen-Sichtbarkeit: `settingsNav.ts`
    (baut auf SET-1). **NICHT gebaut (Auftrag):** jede UI/Screen · Voice-Inhalt (SET-KB-2). **Welche Bereiche
    brauchten neue Backend-Arbeit:** Allgemein + Mein Profil (neu) · Ansicht/Sicherheit/Shell = bereits vorbereitet.

  - **LOGIN-PFLICHT [D21] FERTIG + GEMERGT 19.07.2026 (vorgezogen)** — Migr. 072 gepusht, Merge `42381be`.**
    Auth war bereits voll gebaut (Korrektur der „Phase 5"-Altnotiz). Geschlossen: Catch-all `NotFoundRedirect`
    (unbekannt+nicht-eingeloggt → Login), öffentliche Routen explizit vor Catch-all (`/reset` neu, `/invite/:token`
    + `/unsubscribe` reserviert), **CLAUDE-Dauerregel „Öffentliche Routen"** · Passwort-Reset-Abschluss `/reset` ·
    Logout im Avatar-Dropdown · Dev-Bypass hinter `VITE_DEV_AUTH_BYPASS` (nie Prod) · `useCurrentOrg.provisioningError`
    + `ProvisioningGate` · **invite-only** (Migr. 072: `handle_new_user` legt ohne Einladung keine Org an) · Redirect
    `state.from` + differenzierte Fehler. **Entscheidungen A/B/C:** Bypass geflaggt · invite-only · MFA-Zwang→B-3.
    **NICHT jetzt:** MFA-Zwang (B-3) · Invite-Annahmeseite+Mail ([D29]) · SET-2 „Mein Profil/Sicherheit" (greenfield,
    verifiziert: existiert noch nicht) · „Angemeldet bleiben"-Toggle · Verwaiste-Auth-User-Cleanup.
    **Manuell:** `.env.example` um `VITE_DEV_AUTH_BYPASS=` ergänzen (Datei tool-seitig gesperrt).

  - **▶ „MEIN UNTERNEHMEN" — BEREICHSWEITE REGELN + ARCHITEKTUR FÜR SLICE 2/3 (20.07.2026).**
    Slice 1/3 „Produkte & Preise" ist gebaut (Migr. 077). Die folgenden Setzungen gelten für den
    **gesamten** Bereich und sind beim Bau von Slice 2/3 **verbindlich** — nicht neu verhandeln:
    - **KEIN Feld in diesem Bereich ist Pflicht.** Nur `id` + `organization_id` sind technisch Pflicht.
      Der Nutzer füllt in seinem Tempo; leere Felder zeigt die UI ehrlich leer, nie als Warnung.
    - **`org_profile` wird nur ADDITIV erweitert** (Slice 3 hängt seine Felder an) — kein Umbau,
      keine zweite Tabelle. `field_meta` (Feldpfad → source/updated_at/confidence/**locked**) existiert
      bereits; `locked` schützt Handarbeit vor dem späteren Website-Scan und muss von jedem künftigen
      Auto-Befüller respektiert werden.
    - **Feldpfade sind STABIL** (`org.usps` · `org.competitors` · `product.<id>.<feld>`); Slice 2/3
      setzen das Muster fort (`voice.<channel>.<feld>` · `icp.<id>.<feld>` · `persona.<id>.<feld>`).
      Umbenennen bricht den späteren AI-Chat-Zugriff → nicht umbenennen.
    - **Mehrsprachigkeit:** Textfelder liegen als `jsonb` (heute ein reiner String, später
      `{de:…,en:…}`) — Lese-Helfer `src/lib/i18nText.ts` `textOf()`. Neue Textfelder in Slice 2/3
      **ebenfalls jsonb**, nie `text`.
    - **Ein Schreibweg:** alles über die validierten RPCs (`update_org_profile`/`update_product`,
      Muster 073) mit Key-Whitelist + `audit_log`. Stift, KI-Knopf und künftiger AI-Chat teilen ihn.
    - **[SLICE 3] ICPs/Personas — feste Architektur-Vorgabe (jetzt NICHT bauen):**
      ICPs gehören der **eigenen Organisation**, nicht einer Kunden-Company; **mehrere ICPs pro Org**.
      `org_icps` (organization_id · name · description · fit_level · `attributes jsonb` erweiterbar) und
      `org_personas` (referenziert `org_icps`, **mehrere Personas je ICP**). Jede Persona trägt
      **wachsende Listen**: mehrere Pain Points · mehrere Original-Zitate **getrennt nach „wörtlich"
      vs. „abgeleitet"** · mehrere Job-Titel-Synonyme — jeweils Arrays, frei erweiterbar. Alle Felder
      optional. Muss `match_persona` aus `ai_sdr_bauplan_v1.md` genügen (Abgleich gegen
      `role_pattern`-Synonyme).
    - **[KONFIG-AUDIT vormerken]** Die Wirkungs-Reihenfolge der Vollständigkeits-Hinweise
      (`src/lib/companyKnowledge.ts`: Nutzen > Zielgruppe > USP > Beschreibung > Wettbewerb) ist heute
      eine hartkodierte Empfehlungs-Priorität — für einen Ausfüllhinweis vertretbar, aber [D51] nennt
      „Prioritäten/Reihenfolgen" ausdrücklich. Beim Modul-Abschluss-Gate prüfen.
    - **[VERBINDLICH FÜR SLICE 2 + 3] Feld-Muster: durchgehend sichtbare Eingabefelder.**
      Entschieden 20.07.2026 nach Live-Test. Jedes Feld in „Mein Unternehmen" zeigt **Label oben,
      darunter IMMER ein sichtbares graues Eingabefeld** (`FIELD`/`FIELD_MULTILINE` aus
      `componentBehavior.ts`), gespeichert beim **Verlassen des Feldes**. **KEIN Stift, kein
      Read-Mode-Zwischenschritt** — der zuvor gebaute Read-Mode (Wert als Text, Klick öffnet ein
      Feld) ließ die Seite weiß und randlos wirken und wich von der Design-Referenz ab. Begründung:
      Das sind **Ausfüll**-Seiten (man kommt her, um zu tippen), keine Lese-Flächen. Read-Mode +
      Inline-Edit bleibt richtig für CRM-Panels (`DetailField`) — dort ist Lesen der Normalfall.
      **Der KI-Knopf pro Feld bleibt** (Vorschlag für genau dieses Feld). Umgesetzt im geteilten
      Baustein `KnowledgeField` → gilt automatisch für Personal Voice und Unternehmensprofil;
      **in Slice 2/3 nicht erneut zur Diskussion stellen.**
      **Ergänzt 20.07.2026 (ebenfalls verbindlich):** (a) **KI-Knöpfe tragen den Pill-Kanon**
      `AI_PILL`/`AI_PILL_PENDING` (`componentBehavior.ts`, Teal-Tint wie die Statistik-Pills in
      „Mein Profil") — auf Feld-Ebene UND je Karte/Abschnitt, damit KI-Aktionen als eigene Klasse
      lesbar sind statt als weiteres graues Icon. Solange `lib/ai.ts` fehlt: ausschließlich
      `AI_PILL_PENDING` (sichtbar, aber nicht bedienbar). (b) **Eingeklappte Karten zeigen einen
      dezenten „X offen"-Hinweis**, wenn required/recommended fehlen — neutral-grau, nie Warn-Ton;
      vollständig = **gar kein** Hinweis. Zählung IMMER über `computeCompleteness` (dieselbe
      Registry wie die Vollständigkeits-Anzeige), nie eine zweite Logik.
    - **[SLICE 3 — UMZUG] USP + Wettbewerber ziehen auf die künftige Company-Profile-Seite um.**
      Backend ist bereits vorhanden (`org_profile.usps` / `org_profile.competitors` +
      `update_org_profile`) — nur das UI-Zuhause wechselt. Die Sektionen wurden am 20.07.2026
      bewusst von „Produkte & Preise" **entfernt**; bis Slice 3 gebaut ist, sind beide Listen über
      **keine** Oberfläche erreichbar. Bewusst so: lieber kurz unerreichbar als dauerhaft am
      falschen Ort (Honesty). Die Wichtigkeits-Registry führt sie weiter (`org.usps` recommended,
      `org.competitors` optional) — die Produktseite zählt sie über `scope: "product"` nicht mit,
      damit kein Hinweis auf ein Feld zeigt, das dort gar nicht existiert.
    - **[OFFEN — Oliver entscheidet] Aktions-bezogene Pflichtfelder für den AI Chat.** Die
      Wichtigkeits-Registry (`src/lib/fieldImportance.ts`) stuft Felder **global** ein
      (required/recommended/optional + Begründung) und treibt heute die Vollständigkeits-Anzeige,
      später den Chat („Progressive Ausführung", ai_chat_bauplan Abschnitt 5a). Eine künftige
      Chat-**Aktion** kann aber andere Anforderungen haben als eine andere („Nachricht schreiben"
      braucht den Nutzen, „Produkt umbenennen" nur den Namen). Ob dafür eine zweite, aktions-
      bezogene Ebene ergänzt wird (Aktion → Pflichtfelder, verweist auf dieselben Feldpfade),
      ist **bewusst offen** (Entscheidung A vom 20.07.2026: jetzt KEINE leere Aktions-Ebene auf Vorrat)
      und wird beim Bau des Chat-Tool-Layers entschieden. Die Feldpfade bleiben in jedem Fall
      unverändert — kein Umbau nötig.
      **Zwei konkrete Struktur-Befunde für diesen Zeitpunkt (aus der Übertragbarkeits-Prüfung 20.07.):**
      (a) `hintKey` ist ein UI-Feld der Vollständigkeits-Anzeige — für rein chat-fähige Funktionen ohne
      solche Anzeige muss es **optional** werden (heute Pflichtfeld des Registry-Eintrags).
      (b) Die Registry adressiert **gespeicherte Felder**; Chat-Aktionen haben **Parameter**, die nicht
      immer einem Feld entsprechen (`set_user_role(p_role)`, Lost-Reason, `p_ids[]`). Ein künftiger
      Aktions-Vertrag braucht daher **Funktionsname + Parametername** als Schlüssel und verweist NUR
      dort auf einen Feldpfad, wo es einen gibt.
    - **[SLICE 2] ✅ ERLEDIGT + GEMERGT 20.07.2026** (siehe „MEIN UNTERNEHMEN 2/3" oben): fünf Kanäle
      (`overview` · `post` · `comment` · `dm` · **`email`**) umgesetzt; das Live-Beispiel **„So klingt das"**
      ist als `AI_PILL_PENDING`-„Folgt" angelegt (echtes AI-Feature, kommt mit `lib/ai.ts`).

  - **▶ CHAT-AKTIONS-VERTRÄGE — NACHZUHOLENDE BESTANDS-FUNKTIONEN (20.07.2026).**
    Die neue globale Regel **„Chat-Aktions-Vertrag-Pflicht"** (CLAUDE.md) gilt ab jetzt für **NEUE**
    Funktionen. Die folgenden Funktionen wurden **VOR** dieser Regel gebaut und brauchen die
    `required`/`recommended`/`optional`-Einstufung noch **nachträglich** — das passiert **NICHT jetzt**,
    sondern **gebündelt als Diagnose-First-Schritt, sobald der AI-Chat-Baustein selbst ansteht**
    (letztes Modul im Fahrplan). Grund: die Funktionen sind noch nicht stabil genug; eine frühere
    Einstufung müsste vermutlich mehrfach nachgezogen werden.
    **Reine Bestandsliste — bewusst NICHT klassifiziert.**

    **A) Postgres-RPCs (geschäftlich relevant, `security definer`):**
    - Rechte & Team: `grant_permission` · `revoke_permission` · `set_user_role` · `deactivate_member` ·
      `reactivate_member` · `remove_member` · `create_invitation` · `effective_permissions` (Auskunft)
    - Einstellungen & Profil: `update_general_settings` · `update_my_profile` · `get_profile_stats` (Auskunft)
    - Mein Unternehmen: `update_product` · `create_product` · `delete_product` · `update_org_profile`
      *(einziger Bereich, der die Einstufung bereits HAT — `src/lib/fieldImportance.ts`)* ·
      **`update_voice_profile`** (NEU 20.07., Personal Voice — Self-Service, Feldpfade `voice.<channel>.<feld>`
      in `fieldImportance.ts` Scope `voice` vorhanden, Chat-Vertrag aber wie die anderen erst beim Chat-Bau)
    - Datensätze: `soft_delete_contacts` · `soft_delete_companies` · `soft_delete_deals`
    - Mitteilungen & Aktivität: `notify` · `log_activity`
    - Credits & Entitlement: `consume_credits` · `check_entitlement` · `check_credit_balance` ·
      `reset_credit_balances`
    - Telemetrie mit Nutzerbezug: `set_last_seen`

    **B) Schreibwege im Frontend OHNE eigene RPC** (direkte Tabellen-Writes in `src/lib/db.ts` — sie sind
    genauso chat-fähig und dürfen bei der Nachhol-Runde **nicht vergessen werden**; im Prompt waren sie
    nicht genannt, gehören aber sachlich dazu):
    - Kontakte/Companies: `createContact` · `updateContact` · `createCompany` · `updateCompany`
    - Deals: `createDeal` · `updateDeal` · `updateDealStage` · `updateDealWon` · `updateDealLost`
    - Tasks/Notizen/Kommunikation: `createTask` · `updateTask` · `completeTask` · `softDeleteTask` · `createNote` · `updateNote` · `softDeleteNote` · `createCompanyNote` ·
      `createCommunication`
    - Telefonnummern: `createContactPhone` · `updateContactPhone` · `setContactPhonePrimary` ·
      `deleteContactPhone`
    - Listen: `createList` · `renameList` · `addToList` · `removeFromList` · `deleteList`
    - Leads *(heute Prototyp-Stubs ohne echten DB-Write bzw. nur lesend — beim Nachhol-Slice
      prüfen, ob sie dann real sind)*: `createLead` · `updateLeadStage` · `assignLeadOwner` ·
      `setTaskCompleted` · `upgradeSubscription` · `publishMarketingPost`
    - Mitteilungen: `markNotificationRead` · `markAllNotificationsRead`
    - Personal Voice (NEU 20.07.): `updateVoiceProfile` (dünner Passthrough auf RPC `update_voice_profile`) ·
      `getMyVoiceProfile` (nur lesend/Auskunft)
    - Import: `runImport` · `undoImport` *(rückgängig machen = destruktiv, klar chat-relevant)*
    - Sonstiges: `mergeContacts` · `mergeCompanies` · `deleteInvitation` · `setUserPreference` ·
      `setNavPreferences`
    *(`softDeleteDeal` steht NICHT hier — es ruft `soft_delete_deals` und ist über Liste A geführt.
    `findOrCreateCompany`/`loadDedupUniverse` sind Import-interne Helfer, keine Chat-Aktionen.)*

    **NICHT auf der Liste** (bewusst, weil nicht chat-fähig): Trigger-Funktionen (`audit_write`,
    `update_updated_at`, `bump_contact_last_contacted`, `handle_new_user`), interne Wächter/Helfer
    (`auth_org_id`, `has_permission`, `assert_permission`, `assert_member_action`,
    `assert_not_last_owner`, `_billing_config`) und Betriebs-/Cron-Funktionen (`cron_run_start`,
    `cron_run_finish`, `run_watchdog`, `cleanup_notifications`, `cleanup_activity_events`,
    `cleanup_cron_runs`). Insgesamt geprüft: **41 DB-Funktionen** (vollständiger grep über alle
    Migrationen) + die Schreibwege aus `db.ts`.

  - **▶ RECHTE-KATALOG — ZUKUNFTS-REGISTRY (Teil-D-Scan 19.07.2026).** Diese Rechte existieren HEUTE noch
    nicht im Katalog und werden **MIT ihrem Modul** hinzugefügt (`permission_catalog` 070 + `role_permissions`
    + TS-Spiegel + `<RequiresPermission>` + Server-Guard — die 3 Fragen der Dauerregel). **Beim jeweiligen
    Modul-Bau abhaken:**
    - [x] `rules.edit` · `pipeline.manage` · `automation.manage` — **GEBAUT SET-4 Fundament (21.07.2026, Migr. 083)**:
      Katalog + role_permissions (owner+admin) + TS-Spiegel + Server-Guard je Bereich in `update_settings`.
    - [ ] `campaigns.manage` · `templates.manage` — AI SDR
    - [ ] `integrations.manage` — Integrationen + Webhook-Config (Endphase)
    - [ ] `billing.manage` · `billing.approve_credits` — Billing-UI (Launch; `billing.`-Filter in Matrix schon vorbereitet)
    - [ ] `trash.purge` — Papierkorb (SET-3)
    - [ ] `export.all` — Gesamt-Daten-Export (noch nicht gebaut)
    - [ ] `audit.view` — Audit-Log-Screen + Import-Verlauf (Settings)
    - [x] `settings.manage` — **GEBAUT SET-2 (19.07.2026, Migr. 073)**: Workspace/Allgemein-Einstellungen (owner+admin)
    - [ ] `branding.manage` — Produkte&Pricing/erweitertes Branding (SET-2+; Logo läuft vorerst über `settings.manage`)
    - [ ] `lists.share` — Team-Listen teilen / Listen-Rechte (Settings)
    - [ ] **Viewer-Read-only-Enforcement** — Basis-CRUD (Kontakte/Companies/Tasks/Listen anlegen/bearbeiten,
      Opt-out) ist heute nirgends rollen-gated; Viewer-Sperre kommt mit dem Viewer-Modus (RLS/Guard).
  - **AI-Studio-Design-Abgleich (19.07.2026) → Bauplan Abschnitt 8** (Seiten→Slice-Timing ·
    Nav-komplett-in-SET-2 · Won/Lost-Invariante · Regel-A-Diagnose 8.T). Drei neue Entscheidungen:
    - **[SET-KB-1]** neue Gruppe **„Mein Unternehmen"** (final 19.07.2026; Untertitel „Was die AI über
      euch weiß") mit 3 dauerhaften Seiten: Company Profile · Personal Voice Card · Product & Pricing.
    - **[SET-KB-2]** aus Onboarding herausgelöst, VOR AI SDR: **DB-Tabellen `org_profile` ·
      `voice_profiles` · `product_info` jetzt einplanen** (alle drei fehlen — `products` (028) ist NICHT
      dasselbe) + Settings-Seiten manuell editierbar jetzt; AI-Befüllung (Crawl) später mit Onboarding,
      kein Umbau. Leere Felder = ehrlich „Folgt".
    - **[SET-KB-3]** Fallback-Regel (→ auch `ai_sdr_bauplan_v1.md`): Nachrichten-Generierung MUSS ohne
      Company/Voice/Product-Felder funktionieren; gefüllt = besser, nicht Voraussetzung.

**7.** [ ] **[BAU+DESIGN] AI SDR Slices 0–14** (`docs/ai_sdr_bauplan_v1.md` +
  `docs/for_ai_sdr_testplan_kritische_pfade.md`; UI-Slices über Dauerregel 4c)
  - [ ] 0 Doku-Angleichung · [ ] 1 Migration A · [ ] 2 Migration B · [ ] 3 Sending-Layer
  - [ ] 4 Mailbox-Management · [ ] 5 Sequenz-Engine · [ ] 6 Lead-Intake · [ ] 7 Inbound & Intent
  - [ ] 8 Campaigns-UI · [ ] 9 Operatives UI · [ ] 10 Termine · [ ] 11 Lifecycle
  - [ ] 12 Performance & Digest · [ ] 13 Learning · [ ] 14 Mein-Tag-Integration & Abschluss

**8.** [ ] **[BAU+DESIGN] Mein Tag Slices 0–4** (`docs/mein_tag_bauplan_v1.md`)
  - [ ] 0 Doku-Angleichung · [ ] 1 Migration & Settings · [ ] 2 Ranking-Engine + morning_briefing
  - [ ] 3 UI-Verkabelung Kernzonen · [ ] 4 Lagebild, Realtime, Abschluss

**9.** [ ] **[BAU+DESIGN] AI Chat Slices 0, 1, 2, 2R, 3–13** (`docs/ai_chat_bauplan_v1.md` +
  `docs/for_ai_chat_testplan_kritische_pfade.md`)
  - [ ] 0 Doku-Angleichung · [ ] 1 Migration Chat-Kern · [ ] 2 Tool-Layer · [ ] 2R RAG-Pipeline
  - [ ] 3 Orchestrator · [ ] 4 UI-Grundgerüst · [ ] 5 Block-Katalog · [ ] 6 Schreib-Aktionen/Papierkorb
  - [ ] 7 Approval-Flow · [ ] 8 Credits & Kauf · [ ] 9 Ketten & Jobs · [ ] 10 Externe Recherche
  - [ ] 12 Kontext & „Warum?" · [ ] 13 Abschluss-QA *(Slice 11 entfällt — RAG ist 2R)*
  - Mitteilungs-Slices: **N-S3 ab AI-SDR-9** · **N-S4 mit Chat-7**

**10.** [ ] **[BAU+OLIVER] Endphase: Integrationen I-B1 ff. + Betrieb B-2/B-3**
  (inkl. **Security-Abschluss-Check**, `betrieb_ueberwachung_bauplan` B-3)

**11.** [ ] **[OLIVER+BAU] Launch: Onboarding + Abo-Verwaltung — NUR nach Re-Challenge**
  (beide Drafts, deren Abschnitte **7** bzw. **6**)

---

## OFFEN (Oliver)

- [ ] **Settings-Design nachreichen** — *blockiert SET-2* (`settings_bauplan` Abschnitt 6)
- [ ] **ICP-Scoring-Spezifikation** — *blockiert ICP-Filter ab AI-SDR-Slice-6*
      (Onboarding-Draft O10: bewusster Platzhalter, lebt außerhalb jenes Plans)
- [ ] **Sherloq-Webhook-Payload + On-Demand-Profilabruf-Endpoint** mit dem Sherloq-Team
      abstimmen — *vor AI-SDR-Slice-6*
- [ ] **Bestehendes Ranking-System liefern** — ersetzt die Startgewichte in
      `settings.my_day.ranking` (reine Datenlieferung, kein Code — `mein_tag_bauplan` M2)
- [ ] **ENTSCHEIDUNG AUSSTEHEND:** `ScreenMarketing.tsx` (eigenes Modul mit Planungs-Session
      ODER Sherloq-seitig parken?) · `ScreenSherloqSystem.tsx` (v1-Screen oder reicht die
      Integrations-Kachel?) — **beide Designs liegen lassen, nichts bauen**

---

## UI-DESIGN-INVENTAR (fehlende Designs)

> Oliver designt jeweils **KURZ VOR** dem zugehörigen UI-Slice in AI Studio.
> Claude Code liefert nach **Dauerregel 4c**: Gap-Liste + vollständigen Design-Prompt.

- [ ] **Campaign Builder** (7 Tabs) — *AI SDR Slice 8*
- [ ] **AI-SDR-Panel-Varianten** inkl. **Manual-Email (E25)** + **Meeting-Nachbereitungs-Panel** — *Slice 9/10*
- [ ] **Templates- & Mailbox-Settings-Seiten** — *AI SDR Slice 8 / Settings SET-5*
- [ ] **Performance-Tab** — *AI SDR Slice 12*
- [ ] **Chat-Block-Komponenten + Session-Sidebar** — *Chat Slice 4/5*
- [ ] **Lagebild-Zeile** (Mein Tag) — *Mein Tag Slice 4*
- [ ] **Papierkorb** — *Chat Slice 6 / Settings SET-6*
- [ ] **Mitteilungs-Center + Aktivitätsfenster + Aktions-Popup** — *N-S2/N-S3/N-S4*
- [ ] **System-Status-Seite** — *Betrieb B-2*
- [ ] **Import-Flow** (Mapping-Vorschau + Validierungs-Preview + Report) — *K-5*
- [ ] **Settings-Abgleich** (Design vorhanden) — gegen die **5 Patterns** aus
      `settings_bauplan` Abschnitt 6 prüfen — *SET-2*

**VERMERK:** Bestehende Designs (ScreenAiSdr, ScreenKontakte, ScreenCompanies, ScreenMyDay etc.)
sind **Ausgangspunkt, aber ggf. unvollständig** gegenüber den Bauplänen — **Dauerregel 4c gilt
für JEDEN UI-Slice**, auch wenn ein Design existiert.

---

> **[D-lead-status] lead_status Automatik-Trigger — OFFEN (16.07.2026):** `contacts.lead_status`
> (freie Textspalte, Default `'lead'`; Wertebereich `lead|qualified_lead|mql|sql|customer|churned`
> laut Migration 002 + `sales_os_crm_felder.md`) ist als „system-gesteuert, aber manuell änderbar"
> geplant, aber die **Automatik-Trigger wurden nie definiert** (kein Seed setzt je einen anderen
> Wert; keine Logik, anders als `contact_status`, das bei Booking / Company→Kunde automatisch
> springt). **Jetzt (K-3): nur Anzeige** — neutrale deutsche Labels via i18n
> (`kontakte.leadStatusValue.*`: Lead/Qualifiziert/Interessiert/Bereit/Kunde/Verloren), **keine
> Automatik**. Trigger-Regeln (`Lead→Qualifiziert→MQL→SQL→…` auslösen durch was?) = eigene
> Produktentscheidung, **vor** dem Bau der Automatisierung nachzuholen. **Nicht Teil von K-3.**
> Voll dokumentiert als `#40` in `docs/entscheidungen_komplett.md`.

> **✅ GEMERGT (18.07.2026):** `feat/soft-delete-contacts-companies` → `main` (`--no-ff`, `68d1802`),
> Branch gelöscht, **origin gepusht**. Bündel: Soft-Delete + Vollansicht-Konsistenz (3 Punkte) + ganze
> Tabellenzeile klickbar. Migration 058 zuvor per `db push` (Olivers Freigabe) auf Remote angewendet.
> Doku-Branch `chore/status-invariant-doc` (contact_status-System-Invariante + [D51]-Deal-Stage-Anschluss)
> separat nach `main` gemergt (`b13c51e`).
>
> **[D-card-rowclick] Farmer/HunterCard — ganze Kachel klickbar + Farmer-Prefetch — OFFEN (18.07.2026):**
> In der geteilten `DataTableCard` (Kontakte + Companies) öffnet inzwischen die **ganze Zeile** die
> Detailansicht. Die **HunterCard/Farmer-Kacheln** dagegen öffnen aktuell **nur über den Pfeil**, nicht die
> ganze Kachel/den Namen. Zusätzlich lädt der **Prefetch bei Farmer** ggf. **nicht** die Subscription-/
> Usage-Daten (`prefetchFarmerPanel` fehlt evtl. — `HunterCard` nutzt `prefetchContactPanel`, das die
> Farmer-spezifischen Blöcke nicht abdeckt). **Nicht Teil von K-FS1**, kleiner eigenständiger Fix,
> **TIMING noch offen**. Nur vermerkt, nicht gebaut.
>
> **Session 2026-07-18 (Löschen Kontakte + Companies — Soft-Delete — Branch `feat/soft-delete-contacts-companies`, STOP für QA):**
> Migration **058**: `contacts`+`companies` bekommen `deleted_at`/`deleted_by` + partielle Indizes
> (`where deleted_at is null`); `audit_write()` erkennt Soft-Delete (`deleted_at` NULL→gesetzt) und loggt
> `delete_<table>` statt `update_<table>` (generisch via `to_jsonb`, sicher für Tabellen ohne die Spalte).
> **db.ts:** `softDeleteContacts`/`softDeleteCompanies` (Einzel = Bulk mit einer id); **alle** Kontakt-/
> Company-Lesequeries filtern jetzt `deleted_at IS NULL` (getContacts · getCompanies · getCompanyDetail ·
> getContactDetail · getListMembers statisch+dynamisch · findDuplicates · findOrCreateCompany ·
> getCompanyActivity; Company-Kontakt-Aggregat filtert im Mapper, NICHT als Embed-Filter — sonst würde der
> Left-Join zum Inner-Join und „Ohne Kontakt"-Firmen verschwinden). **UI:** roter „Löschen"-Button + roter
> AlertDialog (Anzahl bzw. Name genannt) — Kontakt im HunterSidepanel-Details-Tab; Company im Detail-Header;
> Bulk in beiden Tabellen. audit_log entsteht automatisch über den Trigger.
>
> **Nachtrag QA (18.07.2026) — Vollansicht-Konsistenz Kontakt↔Company↔Farmer:** (1) Kontakt-Löschen-
> Button in die Vollansicht-Steuerzeile oben rechts (wie Company). (2) **Card-Hero wird Vollansicht-Standard
> für alle drei** (Kontakt/Farmer bekommen die weiße Header-Card wie Company; **CLAUDE.md:1043 von „randlos"
> auf „Card-Hero" umgestellt**, Option B — die drei liefen auseinander, jetzt einheitlich). (3) **Haupt-
> Kontakte-Tabelle-Pfeil öffnet direkt die Vollansicht** (`variant='full'`, ← und ✕ → zurück zur Liste),
> konsistent zu Companies. **Bewusst NUR die Haupt-Kontakte-Tabelle** — Company-Kontakte-Tab (`CompactContactRow`),
> Hunter, Farmer öffnen weiter das 820px-Schnellpanel (Deeplinks laufen ausschließlich über ScreenHunting/
> ScreenFarming-Panels, vom Kontakte-Pfeil unberührt).
>
> **[D-delete-rights] — Teil (1) GESCHLOSSEN 19.07.2026 mit Settings SET-1:**
> (1) ~~Keine Rollenprüfung~~ → **erledigt:** `soft_delete_contacts`/`soft_delete_companies` (Migr. 071)
> erzwingen serverseitig `has_permission(actor, 'records.delete')` + Org-Scope; `records.delete` liegt bei
> owner/admin (Rollen-Matrix 070), member/viewer NICHT. (2) **Kein Papierkorb-UI** — gelöschte Objekte sind unsichtbar, bleiben
> aber in der DB (kein Datenverlust); Wiederherstellen-/Papierkorb-Ansicht kommt mit **SET-3**.
> (3) **Firma löschen = KEINE Kaskade** (Punkt 5 bestätigt): verknüpfte Kontakte bleiben, verlieren nur
> `company_id`/`primary_company_id` — analog „Company ohne Kontakte bleibt erhalten". Deals unangetastet.
> **Angewendet:** Migration 058 muss per `supabase db push` auf die Remote-DB (additiv/low-risk) —
> **db-push = Gate**, Autorisierung beim STOP erfragt (ohne sie zeigen die gefilterten Queries einen Spaltenfehler).
>
> **Session 2026-07-17 (K-4b-2 Companies-Detail: Deals + Aktivität + Notizen — Branch `feat/companies-detail-k4b2`, STOP für QA):**
> Companies-Detailseite komplett: **Deals-Tab** `getDealsByCompany` + `DealsListe variant=detail` (anlegen/
> bearbeiten/löschen/Stage echt; `createDeal` um `companyId` erweitert, CHECK `deal_owner_present` erfüllt).
> **Aktivität-Tab** `getCompanyActivity` — **EIN** Query (communications ⋈ contacts!inner auf `company_id`),
> aggregierter Touchpoint-Feed ALLER Firmen-Kontakte mit Kontaktname (`companyActivityToView`; `CommunicationView`
> um `contactName` erweitert, `KommunikationVerlauf` zeigt Namen im aggregierten Feed). **Notizen-Tab**
> `getNotesByCompany`/`createCompanyNote` + `NotizenListe` (CRUD echt, `notes.company_id`). Alle Tabs lazy
> (`enabled: tab===…`), Stage-Maps/Produkt-/Owner-Kataloge nur bei Deals-Tab. Gates + beide Agents.
> **Reduziert (Regel B):** Won/Lost-Modal-Zeremonie (Konfetti + Lost-Reason-Pflicht) bleibt Hunter-spezifisch —
> Company-Deals-Stage-Wechsel läuft direkt über `updateDealStage`. Aktivität-Tab read-only (Protokollieren
> passiert pro Kontakt, nicht firmenweit). `KommunikationVerlauf`-Header „Kommunikationsverlauf" (Komponenten-
> Default) statt Mockup-„Gesamte Aktivitäts-Timeline". **Companies-Modul (K-4) damit funktional komplett.**
>
> **Session 2026-07-17 (K-4b-1 Companies-Detail: Übersicht + Kontakte — Branch `feat/companies-detail-k4b1`, STOP für QA):**
> `ScreenCompanyDetail` vom Platzhalter zur echten Detailseite: Kopf + KPIs (aus K-4a) + `PanelTabs`
> (5 Tabs). **Übersicht** = `DetailSection`/`DetailField`, Company-Details **inline editierbar** →
> `updateCompany` (Branche/Größe via BRANCHE/GROESSE_OPTS, Stadt, Land via LAND_OPTS, Domain, Website,
> LinkedIn; CRM-ID readonly) + invalidate. **Kontakte-Tab** = echte Firmen-Kontakte über neuen
> `getContacts({companyId})`-Filter (lazy: lädt erst bei aktivem Tab; Anzahl kommt aus dem Detail-Embed),
> Rows mit Avatar/ICP/Status/Zeit + **Hover-Prefetch** (Regel C) → `HunterSidepanel`; „+ Kontakt
> hinzufügen" öffnet `KontaktAnlegenPanel` mit **vorbelegter Company** (neuer `initialCompany`-Prop).
> **Honesty:** Sherloq-AI-Zusammenfassung + Live-Signale + „Quelle/Inhaber" + Churn-KPI ausgeblendet
> (kein Company-Feld/-Modul). Deals/Aktivität/Notizen = ehrlicher „folgt (K-4b-2)"-Platzhalter.
> Gates + beide Agents. **K-4b-2 offen:** Deals-Tab (`getDealsByCompany`+`DealsListe`) · Aktivität
> (aggregierter Zeitstrahl, ein Query) · Notizen (`notes.company_id`+`NotizenListe`).
> **QA-Runde 1 (vor Merge):** Übersicht-Tab-Icon auf projektweites `LayoutDashboard` (statt `Info`).
> **Kontakt-Zeile aus Inline-Eigenbau in echten panel-block `CompactContactRow` herausgelöst** —
> visuell wie die Kontakte-Tabellenzeile (Avatar·Name/Subzeile·ICP·Zeit·Status·Routing·Pfeil), ohne
> Tabellen-Gerüst; als **K-FS1-Basis** markiert (der Hunter-Dedup LeadListRow/HunterCard soll DIESE
> Zeile übernehmen, keine 4. Variante). Kein neuer Inline-Row mehr.
>
> **Session 2026-07-17 (Tabellen-Suche — Branch `feat/table-search`, STOP für QA):**
> Einfache, schnelle Substring-Live-Suche (kein AI — semantische Suche bleibt bewusst dem AI-Chat/RAG)
> **zentral in der geteilten DataTable**: `useDataTable` bekommt `searchAccessor` + globalFilter +
> `getFilteredRowModel` (Filter-Fn = `tableSearch.matchesQuery`, reiner Helfer + 5 Tests); geteiltes
> `shared/TableSearch`-Feld (oben rechts neben den Filtern). **Kontakte:** Name/E-Mail/Firma ·
> **Companies:** Name/Domain. Suche UND Filter kombiniert (Suche wirkt auf die bereits gefilterten
> Daten). Leer-Zustand bei aktiver Suche → „keine Treffer". Bulk „alle auswählen" nutzt das
> such-gefilterte Row-Model (nie unsichtbare Zeilen). Single Source → neue DataTable-Screens erben
> die Suche durch `searchAccessor` + `<TableSearch>`. Gates + beide Agents. **Vor K-4b bewusst
> nachgezogen**, solange die geteilte Tabelle frisch ist.
>
> **Session 2026-07-17 (K-4a Companies-Listenansicht) — Branch `feat/companies-list-k4a`, STOP für QA:**
> Companies-Screen auf dem geteilten Tabellen-Standard aus K-3 Phase C (`useDataTable`/`DataTableCard`/
> `ColumnConfigPopover`, eigener `persistKey="table_views.companies"`). **Neu:** `companiesMappers.ts`
> (`CompaniesRow` + `companyStatus`-Resolver = Single Source für Status-Badge UND `RoutingChip`, aus
> `subscription_status`/offener Deal/`in_campaign`/Kontaktanzahl; `formatEuroCents`), `getCompanies`/
> `getCompanyDetail` (Embed contacts/deals-Aggregate), `prefetchCompanyPanel` (Regel C). 6 Set-A-Spalten
> (Company·Status·Kontakte·Zuletzt·ARR·Bearbeitung) + 15 Set-B; 3 Filter-Dropdowns (Branche/Größe/Land);
> Lagebild „ohne Kontakt" nur bei echtem Aggregat (Honesty); Bulk Tag/Export→Toast. `ScreenCompanyDetail`
> (volle Seite): Kopf + KPIs **echt**, Tabs als ehrlicher „folgt (K-4b)"-Platzhalter. Routen `companies`
> + `companies/:id` live (ersetzt ComingSoon), beide in `componentRegistry`. i18n `companies.*` (de/en/es).
> Gates grün, beide Agents PASS. **Companies = eigenständiger Nav-Screen** (Sidebar-Icon vorhanden).
>
> **Selbst ergänzt (nach Kanon, nicht im Mockup):** abgeleiteter `companyStatus` inkl. Routing-Chip
> (Mockup zeigt reiche Status-Sublabels „Pipeline · Demo Stage" etc. → auf primären Status reduziert,
> Tabellen-Sauberkeit); Detail-Placeholder-Route mit echtem Kopf+KPIs statt totem Pfeil; KPI-Label
> „Kontrollierte Kontakte" 1:1 aus dem Mockup übernommen (ggf. Wortwahl beim QA prüfen).
>
> **Deferred (benannte Folge-Punkte):** **K-4b** Detail-Tabs (Übersicht/Kontakte/Deals/Aktivität/Notizen)
> + Bearbeiten + „+ Company hinzufügen"-Anlege-Panel · **[D-companies-grid]** Grid-/Kachel-Ansicht (Toggle
> aus Mockup, nicht Teil der geteilten Tabelle) · **[D-companies-quickpanel]** Quick-Side-Panel aus der
> Kontakte-Liste (§15) · **[D-companies-archive]** Bulk „Archivieren" + Verhalten verknüpfter Kontakte/
> Deals bei Archiv (eigene Entscheidung, kein Soft-Delete in K-4) · **[D-companies-statusfilter]** Status-
> Filter „Mit Deals"/„Ohne Kontakt" als Pills · Companies-**Listen** (statisch/dynamisch) · Sherloq-Block
> (AI-Zusammenfassung/Live-Signale, Detail) erst mit Sherloq-Modul. `sortieren`-Dropdown aus Mockup
> entfällt (Spalten-Header-Sortierung = Tabellen-Standard). Prefetch/Detail-Query-Keys stehen für K-4b bereit.

## Current Status: **[D51] Konfigurierbarkeit-als-Architektur verankert + Farmer/Hunter konfig-konform (30.06.2026, Teil 2)** — neues hartes Prinzip „Logik-als-Daten" (gleichrangig Honesty); **Modul-Abschluss-Gate** (4 Prinzipien: Single Source · Performance · Konfigurierbarkeit · Honesty) in CHECKLIST.md verankert. Farmer- & Hunter-Konfig-Lücken geschlossen (Tages-Cutoffs/Churn-Vorrang-Schalter/„Neu-in-Pipeline"-Fenster → `settings.thresholds`; stummer Fallback → Drei-Zustands-Gate; Edge-Terminal-Literale → `_shared/terminalStages.ts`; Won/Lost = dokumentierte System-Invariante). Migr. 053 (KB) + 054/055 (settings) **applied**. Beide Module bestehen das Gate (offene Punkte = bewusst Deferred). · **Farmer-Modul DB-Wiring KOMPLETT abgeschlossen (30.06.2026)** — Screen (6 Tabs + aufgeklappter Bereich) · Panel 8a–8e (Header/KontaktZeile/Tabs/Writes/Signale/Subscription/Details — alles echt + editierbar) · Vollansicht · echtes Churn-/Upsell-Scoring (Edge Functions `score-churn-risk`/`score-upsell` + tägliche Crons, Migr. 048–053). Farmer-Invarianten erzwungen: **Subscription-nie-Stage · Churn-Vorrang vor Upsell (auch dedizierte Tabs) · Single Source (`contactToProfile`/`getContactDetail`/`companies`/`contactDetailFields`) · Honesty (kein Fake, „Folgt" sauber)**. **NÄCHSTES MODUL: Companies** (Empfehlung: erst Diagnose-/Bestandsaufnahme-Slice analog Farmer-Audit). · Phase 3 (DB-Wiring Hunter) abgeschlossen · **[D27] Tech-Schuld erledigt** · **Auth/Org [D21] Scheiben 1–8** (inkl. MfaBanner 2FA-Empfehlung) · **Hunter-Übersicht Dringlichkeits-Score** (Migr. 045, settings-basiert) + Profilzeilen-Konsistenz erzwungen · **Farmer-Screen UI komplett (alle 6 Tabs: Übersicht · Kunden · Retention · Upsell · Signals · Follow-ups — Mock, kein DB-Wiring)** · **Farmer Info-Panel [D33] + Action-Panel [D34] + Follow-ups [D46] + Vollansicht [D47] gebaut** (eigene `FarmerSidepanel`/`FarmerActionDrawer`, Mock) · **ScreenFarming verdrahtet** (Panels + Action-CTAs + #7 LinkedIn-Signal-Antwort) · **Snooze/Ignorieren bei Signalen** (Hunter+Farmer, Single Source `constants.ts`) · **Panel-Performance** (Skeletons + Prefetch-on-hover + placeholderData) · **[D35] Signal-Action-Resolver Phase 0** · **Elevation- & Radius-System app-weit** · **Drawer-Panels Full-Bleed** (zentral in `sheet.tsx`). Next (Reihenfolge entschieden 29.06.2026 — siehe [D43]): **1. Farmer DB-Wiring komplett** (echte Scores/Signale/Subscription/KI-Kurzakte + AktiveSignale-Flags an echte Felder — siehe [D47]-Nachzieh-Liste) · **2. Score-Funktionen aktivieren** (score_churn_risk/score_upsell/calculate_health_score → täglich echte Zahlen) · **3. [D43] Historisierung systemweit** (Hunter+Farmer zusammen, **hartes Gate: live vor erstem echten Kunden / Phase 4** — NICHT als Farmer-Insel/Erstschritt) · dann **Hunter Trial-Kacheln [D36]/[D37]** · **Lifecycle-Trigger [D38]** · **[D29] Einladungs-Mail Edge Function** · AI-Pipeline (löst „Folgt"-Platzhalter [D5])

> **Session 2026-06-29/30 (Farmer DB-Wiring komplett — von Mock zu echt) — auf `main`:**
> Spanne: seit Übergabe `2026-06-27`. **Das gesamte Farmer-Modul von Mock auf echte DB-Daten verdrahtet** (Detail-Einträge oben im Body: `[SLICE …]`/`[FIX …]`/`[SCORE-FIX]`/`[BUGFIX]`/`[HONESTY-WURZELFIX]`/`[FARMER-ABSCHLUSS]`). Kurz:
> - **DB-Fundament:** Migration **048** (Farmer-Score-Felder auf contacts + MRR/ARR + `subscription_*` auf companies + Settings-Seed Schwellen/Gewichte) · **049**/**051** Crons · **050** `upsell_drivers` · **052** Score-Fix (overdue_tasks-Gewicht 0) · **053** KB-Eintrag Scoring *(noch nicht gepusht)*.
> - **Edge Functions:** `score-churn-risk` + `score-upsell` (Progressive Data Logic, Schwellen/Gewichte FRISCH aus `settings`, SKIP bei `available===0`, 0-Punkte-Treiber raus) — deployt + Demo-Org re-gescored + verifiziert. Score-Fix: `heat_hot` nur bei `heiss`, churn `overdue_tasks`-Gewicht 0 (bis [[D49]]-Usage).
> - **Screen:** KPIs/Health/Top-5/Kunden/Retention/Upsell/Signals/Follow-ups + aufgeklappter Bereich (`FarmerExpandedCardContent`) alle echt (Kommunikation via `getContactCommunications`, Subscription aus `customer`/companies). **Stage-Leak in Top-5 geschlossen** (overdue_task/going_cold Subscription-Slot).
> - **Panel 8a–8e:** Header/KontaktZeile echt (`contactToProfile`), 4 Tabs echt (`*ByContact`), **alle Schreib-Aktionen** echt (Task/Notiz/Komm/Kontakt/Firma/Telefon — `updateTask` projektweit NEU), AktiveSignale echt + **Churn-Vorrang** (`applyFarmerDisplayPrecedence`/`displaySignals`), Subscription aus companies, **Details-Tab Person+Firma editierbar** (`contactDetailFields` als Single Source, Hunter+Farmer), **KontaktZeile alle 4 Felder inline** editierbar.
> - **Systemweite Shared-Fixes:** Dropdown-z-index über Vollansicht, `DetailField`-Fehlertext, sichtbarer Telefon-Stift, `isValidPhone` (≥3 Ziffern, „+" optional), `CommunicationChain`-Linie bei 1 Eintrag, **„Growth"-Default raus** (`subscriptionPlan` optional, Honesty-Wurzelfix).
> - **Abschluss-Audit** (Screen+Panel+Vollansicht, 2 Explore-Agenten): 3 Lücken gefunden + geschlossen — `mockUsage` Fake-Zahlen → „Folgt" [[D49]] · Churn-Vorrang im Upsell-Tab · Retention-Text vereinheitlicht. **Kein Mock/Fake mehr im Farmer.**
> - **Neue lib:** `src/lib/contactDetailFields.ts` (Options + `DETAIL_MAP` + `seedContactDetails` — Single Source Details-Tab, Hunter+Farmer). Remote-Stand: Migrationen bis **052** applied (053 offen). Gates durchgängig grün.

> **Session 2026-06-27 (Aufräum-Session — Farmer Slice 4 + Repo-Hygiene) — auf `main`:**
> Kleine Wartungs-Session, kein neues Feature, keine neue Komponente, kein DB-Wiring.
> **Farmer Slice 4 — CustomerDrawer aufgeräumt:** in `ReferenceScreens.tsx → FarmerReference` war noch
> `<Drawer s={s}/>` (alter `CustomerDrawer`) + `onSelectCustomer={s.selectPerson}` gerendert, öffnete aber
> nie (ScreenFarming aliased die Prop als unbenutzt → öffnet intern `FarmerSidepanel`). Toten Pfad entfernt:
> `<Drawer>` aus FarmerReference raus, `onSelectCustomer` ganz aus `ScreenFarming`-Props gestrichen (war voll
> tot). **CustomerDrawer bleibt** — wird von **MeinTag** (`onPersonSelect`→`selectById`, aktiv genutzt, kein
> eigenes Panel) und **Hunter** (`<Drawer>` noch gerendert; Hunter routet zwar intern auf `HunterSidepanel`,
> CustomerDrawer dort ebenfalls toter Rest, aber out-of-scope) weiter eingebunden. Erst löschbar, wenn
> MeinTag/Hunter migriert sind.
> **Repo-Hygiene:** `supabase/.temp/` (CLI-Cache, vom `db push`/`link` verändert) aus dem Git-Tracking
> entfernt (`git rm -r --cached`, 9 Dateien) + in `.gitignore` aufgenommen → erscheint nicht mehr bei
> `git add -A`. **Migration 047** (KB Farmer-Panels, aus der 2026-06-25-Session) wurde diese Session via
> `supabase db push` remote angewendet (remote jetzt auf **047**). Remote-Branch `chore/session-2026-06-25`
> gelöscht. Gates grün (build/audit/structure).

> **Session 2026-06-25 (Farmer Info-/Action-Panel + Follow-ups + Vollansicht + Verdrahtung + Panel-Perf) — auf `main`:**
> Spanne: seit Übergabe `2026-06-24_teil2`. **[D33] Farmer Info-Panel** als eigene `features/farmer/FarmerSidepanel.tsx` (`variant='panel'|'full'`, typo-Kanon, Full-Bleed) — Tabs Übersicht/Aktivität/Kommunikation/Tasks/Subscription/Usage/Notizen; KontaktZeile im Header; reuse aller panel-blocks. **[D34] Farmer Action-Panel**: `lib/farmerActions.tsx` (Resolver `farmerActionConfig` + `FARMER_ACTION_CATALOG`, Spiegel von `signalActions`) + `FarmerActionDrawer` (rendert `ChatActionPanel` **unverändert** — Option A: Actions erst mit echtem Draft, sonst „Folgt"-Platzhalter bis [D5]). Action-Panel-Breite app-weit **720px fix**.
> **[D46] Farmer Follow-ups-Tab** (fällige Tasks + „Kunde wird kalt"; Trennung Retention=Risiko vs Follow-ups=Aktion). **[D47] Farmer Vollansicht** (`variant='full'` + 7 Tabs + ArrowUpRight; Details via Library; SubscriptionBox compact; `createPortal`-Fix gegen transform-Vorfahre; KontaktZeile-Hero entfernt — konsistent Hunter/Farmer).
> **ScreenFarming verdrahtet (Slice 3):** Kunden/Retention/Upsell/Signals → `openInfo()`→FarmerSidepanel; CTAs→FarmerActionDrawer; **#7** LinkedIn-Signal „Antworten"→`SignalActionDrawer` (reuse Hunter-Resolver).
> **Snooze + Ignorieren bei Signalen (Hunter+Farmer):** `SNOOZE_MAX`/`SNOOZE_OPTIONS` → `constants.ts` (Single Source); Snooze 1:1 auf `LinkedinSignalCard` (Dropdown/Snoozed/Eskaliert); Ignorieren = lokaler `ignoredSignalIds`-Filter (Kachel verschwindet sofort) + Bulk-X verdrahtet (ScreenHunting + ScreenFarming).
> **Hunter-Bugfixes:** „Ansehen" (fällige Task → Tasks-Tab + Deeplink-Highlight) · Pipeline-stagniert-CTA → `PipelineStagnatedDrawer` (Honesty). **[D45] Deeplink-Highlight-Muster** (`useDeeplinkHighlight` + `.deeplink-flash` + `highlightId`) als globale Regel + erste Anwendung. **[D43]/[D44]** Doku (Historisierung · TanStack-Table).
> **Panel-Performance:** neuer panel-block **`PanelSkeleton`** (Token-only `animate-pulse`) in allen Info-Panel-Tabs während `isLoading` (statt leer) · **Prefetch-on-hover** (`lib/prefetch.ts` → `prefetchContactPanel`, zentral in `HunterCard`, 120 ms Hover-Intent) · **`placeholderData: keepPreviousData`** auf allen per-Contact-Queries (HunterSidepanel + ExpandedCardContent). **Fix:** Mail in Farmer-KontaktZeile (synthetisierter Fallback bis DB-Wiring).
> Gates durchgehend grün (build/audit/structure). Kein DB-Wiring, keine Migration. Verifikation per User-Dev-Server (Preview-MCP blockiert).

> **Session 2026-06-24 (Teil 2 — Panel-Übergänge & Full-Bleed-Drawer) — auf `main`:**
> Reine UI-Politur am Hunter-Info-Panel (`HunterSidepanel`) + zentrale Drawer-Variante (`ui/sheet.tsx`). Kein neues Feature, kein DB, keine neuen Komponenten.
> **Trennlinien sauber:** der weiße Streifen unter der Tab-Trennlinie (oben) und über dem Footer (unten) kam von doppelten `border-b`/`border-t` + `gap-4` am `SheetContent`. Fix: **eine** Haarlinie als `border-y` am grauen `main` (`bg-app-bg`), `SheetContent` `gap-0 h-full`, `main` `flex-1 min-h-0 overflow-y-auto` → grauer Bereich füllt lückenlos bis zur Footer-Linie. Footer kompakt (`px-4 py-2.5`, Buttons mittig via `items-center`), ohne `shadow-sm` (Trennlinie am `main` reicht). `PanelTabs`-nav ohne eigenen `border-b`.
> **Full-Bleed-Drawer (zentral in `sheet.tsx`):** Drawer-Variante von schwebend (`top-2 bottom-2 right-2`, ringsum gerundet+border) auf **bündig am Bildschirmrand** umgestellt: `inset-y-0 right-0`, volle Höhe, nur **linke Kante** gerundet (`rounded-l-[16px] rounded-r-none`) + `border-l`. `h-full` dadurch korrekt (kein Überlauf unten mehr). Gilt zentral für **alle** Drawer-Panels (Hunter-Panel, CustomerDrawer, künftige Action-Panels). **CLAUDE.md:** neue Pflichtregel „Große Arbeits-Panels — Full-Bleed" (auch fürs Farmer-Info-Panel [D33] hinterlegt).
> **Konsolidiert:** Branch `chore/session-2026-06-24` (Teil 1, Elevation — gestern stranded) jetzt nach `main` gemergt → 2026-06-24-Übergabe (Teil 1) + PROGRESS/CHECKLIST-Doku sind auf main.

> **Session 2026-06-24 (Elevation- & Radius-System app-weit) — auf `main`:**
> **Elevation-System** (CLAUDE Design Invariants): 3 Ebenen — Base (Tabellen/Listen) · Card (Seiten-Kachel = border-card + shadow-card + hover · In-Panel-Box = nur border-card, kein Schatten) · Float (Panel/Dropdown/Toast = shadow-dropdown). Grundsatz „Elevation einmal pro Kontext, nie Schatten-im-Schatten". Token `--border-card` 0.07→0.11 (spürbare Haarlinie). Neue Quellen in `componentBehavior.ts`: `CARD_PANEL` (In-Panel-Box) + `TABLE` (container/header/row).
> **Sweep** über alle In-Panel-Boxen (DealsListe/DealSetup/NewDealCard/OffeneTasks/Komm*/Aktivität/Notizen/Tasks/KiKurzakte/Mail/TaskFormular/TaskAnlegenForm/ExpandedCardContent), Pipeline-**Tabelle** → `TABLE`, KPI/Kanban/Übersicht-Container (Funnel/HealthOverview/MeinTag) → Ebene 1, KontaktZeile/AktiveSignale, CustomerDrawer-Karten. **Feld-Labels Mono→Sans** (`typo-field-label`, Single Source — gilt für alle 7 Nutzer). Plus 4 echte Verstöße in den AI-SDR-Drawern (TaskEntwurfForm/TaskDrawer/AddSdrLeadPanel).
> **Radius-Hierarchie** um **8px** (Inputs/kleine Buttons) + **6px** (Checkboxen/Icon-Buttons/Mini-Badges) erweitert; **benannte Tailwind-Radien app-weit normalisiert** (rounded-xl/2xl/lg/md → explizite px; 15 Dateien). Chat-Bubble bleibt asymmetrisch via expliziter px.
> **3 Audit-Wächter (FAIL)** in `audit.ts`: „keine rohen Shadow-Stufen" · „Border ≠ Hintergrundfarbe" · „keine benannten Tailwind-Radien" — mit sauberen Ausnahmen (Buttons/Avatare/Pills/Footer/Toasts/Tooltips/Chat-Bubbles). In CHECKLIST + CLAUDE Pre-Commit-Check verankert. Drift ist ab jetzt geblockt.
> **Konsolidiert:** Branch `chore/session-2026-06-23-farmer` (gestern stranded) nach `main` gemergt → 2026-06-23-Übergabe, **[D40]** automation_rules, **KB-Migration 046** sind jetzt auf main.

> **Session 2026-06-23 (Farmer-Screen Slices 2–3) — auf `main` (Kunden-Tab) + Branch `feature/farmer-signals-tab` (Signals):**
> **Kunden-Tab:** `FarmerKundenKachel` (Wrapper um `HunterCard`, additiver `statusBadge`-Slot statt STAGE) + `customerStatusConfig` (active/cancelled + grauer Fallback). **Subscription-Badge** = Form 1:1 wie HeatBadge (`rounded-full`, kein Border, `text-[12px] font-medium`) mit Lucide-Icon statt Dot. `data.ts` TRIAL→ACTIVE. CLAUDE.md: zwei bewusst getrennte Badge-Typen (Heat-Pille vs Status-Badge) dokumentiert.
> **Signals-Tab (Slice 3):** 1:1 Hunter-Signals-Muster — `LinkedinSignalCard` additiv um `statusBadge`-Passthrough erweitert (**Hunter unverändert**, Default). Neue geteilte `SubscriptionBadge`-Komponente. **Nur echte Aktivitäts-/LinkedIn-Signale** (wie Hunter) — Churn & Upsell sind KEINE Signale (eigene Tabs). 3 LinkedIn-Mock-Signale, SUBSCRIPTION statt STAGE, Bulk-Auswahl-Leiste wie Hunter, CTA = Platzhalter-Toast ([D34]). Kein DB-Wiring. **[D33]/[D34]** dokumentiert (Farmer Info-/Action-Panel).
> **Retention-Tab (Slice 4):** `FarmerRetentionKachel` (HunterCard-Wrapper) — Tab „Churn & Trial" → **„Retention"** umbenannt; alte bespoke Churn-UI (`font-mono`) ersetzt. 3 Mock-Typen: **Churn Risk** (rote Badge, „Retention sichern"), **Wird kalt** (= 1:1 Hunter Cold-Row: blaue Snowflake-„Cold"-Badge + „Start Outreach" + „Snooze", erscheint nur bei `heat_status='COLD'`), **Gekündigt** (rote Badge, „Jetzt anrufen"). Signal-Rows alle hellgrau (`app-bg`, wie Hunter). HEAT über kanonischen Enum→HeatBadge (Single Source — „Cold" bleibt englisch, Eindeutschung = separater Slice). CTA = Platzhalter-Toast.
> **Upsell-Tab (Slice 5):** `FarmerUpsellKachel` (Struktur 1:1 wie Retention) — grüne Zap-„Upsell Potential"-Badge auf grauer Row + „Action"-CTA. 2 Mock-Kacheln. Kein DB-Wiring.
> **[D35] Signal-Action-Resolver Phase 0:** `lib/signalActions.tsx` (`signalActionConfig` + serialisierbare `SignalActionType`/`SIGNAL_ACTION_CATALOG`) statt Inline-Config im `SignalActionDrawer` — verhaltens-identisch, Vorbereitung für spätere DB-Regeln (kein Schema). **[D36]–[D39]** dokumentiert (Hunter Trial-Kacheln · Lifecycle-Trigger · Farmer „Kunde wird kalt"). CLAUDE.md: **Farmer-vs-Hunter-Routing** (`contact_status` entscheidet) ergänzt.
> **Davor in dieser Spanne (post-teil3):** [D21] Scheibe 8 `MfaBanner` (2FA-Empfehlung + TOTP-Setup) · Hunter-Übersicht **Dringlichkeits-Score** (`calculatePriorityScore`, Migr. **045**, settings-Gewichte) + PRIO-Badge raus + Top-5 aus mehreren Quellen · **Profilzeilen-Konsistenz** erzwungen (Audit: Kurz-Zeitformat WARN + internes-Label FAIL).

> **Session 2026-06-22 (Teil 2, [D27] Tech-Schuld) — auf `main`:**
> **ExpandedCardContent extrahiert** (panel-blocks): geteilter aufgeklappter Karten-Inhalt (lazy Deals/Kommunikation/Stages, KI-Platzhalter, Stagnations-Warnung) — HunterCard + LeadListRow je ~47 doppelte Zeilen entfernt. Reine Extraktion.
> **`window.confirm` → shadcn `AlertDialog`** (neues UI-Primitive `ui/alert-dialog.tsx` + Dep `@radix-ui/react-alert-dialog`): letzte-Telefonnummer-Löschen im HunterSidepanel (Cancel=outline / Löschen=destructive). Kein `window.confirm` mehr im Code.
> **Typo-Kanon Welle 1+2:** 14 Komponenten (Formulare/Panels + Karten/Felder) auf `typo-*`-Primitive; `audit.ts` walkt jetzt **panel-blocks/ + features/**; alle in `IN_SCOPE` (erzwungen). **CLAUDE.md-PFLICHT:** neue Komponente mit Typo-Klassen → SOFORT in `IN_SCOPE`; Pre-Push-Checkbox ergänzt.

> **Session 2026-06-22/23 (Teil 3, Auth/Org [D21] Scheiben 2–7 + D28/D29):**
> Login passwortlos→korrigiert auf **Email+Passwort + Google/Microsoft SSO + Passwort-Reset** (AuthCallback, db-Client-Auth-Optionen, Brand-Icons). **Provisioning-Trigger** 041 (+ 043 Einladungs-Pfad). **`useCurrentOrg()`**-Hook + Ersetzen von `DEMO_ORGANIZATION_ID` in 5 Consumern. **`created_by`/`assigned_to`/`owner_id`** aus `auth.uid()` (Fallback NULL). **Invitations + Teams** (042/043, `getTeamMembers`/`getInvitations`/`createInvitation`/`deleteInvitation`/`updateUserRole`, `TeamSettings`-UI unter `/app/settings`). KB **044** (Team & Einladungen). Auth/2FA-Entscheidungen in CLAUDE.md. Mailversand der Einladung deferred [D29].

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

## 🧩 Slice-Checklisten-Template (PFLICHT — jede Slice-Checkliste endet damit)

> Verankert in CLAUDE.md → **GATES VOR JEDEM MERGE** + **Kurzregeln**. Die Punkte stehen am **Ende jeder**
> Slice-Checkliste, **vor** dem STOP, und dürfen nie entfernt werden. Die Agents laufen
> **genau einmal pro Slice am Ende** — nicht nach einzelnen Zwischenschritten.
> Nicht zutreffende Prüfpunkte werden mit „n/a" abgehakt, **nie gelöscht**.

**A — Inhaltliche Prüfpunkte (vor den Gates durchgehen):**
```
- [ ] [AUTO]-Tests dieses Slices implementiert UND grün? (Testpläne / Kurzregel 5f)
- [ ] Neue AI-Funktion → Prompt-File in /prompts + Inventar-Eintrag? (C27)
- [ ] Neuer Cron → Cron-Wrapper + Erwartungs-Katalog-Eintrag? (Betrieb B2)
- [ ] Neuer kritischer Pfad (Senden/Buchen/Zahlen/Löschen/Merge) → Alarm-Fall definiert? (Betrieb B3)
- [ ] Mitteilung/Feed-Eintrag NUR über notify()/logActivity() + gegen Anti-Doppel-Liste geprüft? (N1/N9/N10)
- [ ] Neuer AI-Wert im UI → WhyPopover-Affordance dran? (C21)
- [ ] Schwelle/Gewicht/Zeitfenster/Modellname → Settings-Wert, nirgends hardcodiert? ([D51] + Kurzregel 5e)
- [ ] Bedingung/Filter → über die EINE gemeinsame Filter-Sprache (K-2)? (Weiche 1)
- [ ] Kachel/Panel strikt aus panel-blocks komponiert? (Weiche 2)
- [ ] Aktion an Enforcement-Punkt → ruft check_entitlement/check_credit_balance? (Abo A1/A4)
- [ ] Query auf Kontakte/Companies/Deals → respektiert deleted_at + Opt-out? (C5)
- [ ] Validierung/Duplikat/Merge → NUR über die zentralen Functions? (K1/K2/K5)
- [ ] Kein Token-Wert im UI sichtbar — nur Credits? (Entitlement-Doku Abschnitt 3)
- [ ] Schreibaktion → audit_log-Eintrag vorhanden?
- [ ] Design-Übernahme: AI-Studio-Markup in BESTEHENDE Library-Komponenten übersetzt
      (nie 1:1 kopiert)? Neue wiederverwendbare Teile als Komponente angelegt?
      Keine Inline-Duplikate? (Single Source of Truth)
- [ ] Ab Chat-Slice-3: Injection-Testfall dieses Slices gelaufen? (Chat-Testplan Regel 2)
```

**B — GATES VOR JEDEM MERGE** (immer zuletzt, in dieser Reihenfolge — vollständige
Definition in CLAUDE.md → „GATES VOR JEDEM MERGE"; sie ersetzt Merge-Gate/Green Gates/
Agent-Gates-Kurzfassung):
```
- [ ] 1. npm run build         → grün
- [ ] 2. npm run lint          → grün
- [ ] 3. npm run structure-check → grün
- [ ] 4. npm run audit         → FAIL-frei (WARN ist kein Verstoß)
- [ ] 5. Tests (ab K-1a)       → grün
- [ ] 6. test-runner Subagent ausführen → muss "ALLE GATES GRÜN" melden (deckt 1,2,5 + structure ab)
- [ ] 7. auditor Subagent ausführen (nur Slice-Diff) → muss "AUDIT: PASS" melden
        (Kategorien A–E: Komponenten · Design · Funktionalität · Hygiene · Performance)
- [ ] Bei FAIL: fixen, beide Agents erneut laufen lassen
```

**C — Abschluss-Dokumentation (nach Gates PASS, VOR dem STOP an Oliver — Pflicht):**
```
- [ ] CHECKLIST.md aktualisiert (gemeinsam mit PROGRESS.md — nie nur eines)
- [ ] Modul-Abschluss-Gate durchlaufen + Ergebnis vermerkt, falls ein Modul fertig wird
- [ ] docs/session_uebergabe_<YYYY-MM-DD>.md erzeugt, falls ein Screen/Feature fertig wird
- [ ] knowledge_base-Eintrag als Migration, falls ein Screen/Feature fertig wird
- [ ] DANN: STOP + Prossi um Screenshot-QA bitten (Screen-/Feature-Ebene)
```

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

#### [D21-Farmer] Farmer-Datenquellen-Diagnose (Stand 2026-07-16, aus K-2b) — Feld für Feld
> Live-Pfad: `FarmerReference` → `getContacts(status='kunde')` → **`customerRowToView`**. Ergebnis:
> **kein Mock-Leak** — jedes angezeigte Feld ist entweder ECHT (DB) oder ehrlich leer/„Folgt". Zu tun:
> - **ECHT (DB, verdrahtet):** Identität (`contactToProfile`) · ICP (`icp_score`) · Heat (`heat_status`,
>   Fallback DEAD) · E-Mail · **Zeit „ZULETZT" = `last_contacted_at`** (via `lastContactedLabel`) ·
>   Subscription Status/Plan (`companies.subscription_status`/`subscription_plan`) · MRR (`companies.mrr_monthly`) ·
>   Churn/Upsell/Health-Score + Driver (`contacts.*`, **NULL bis Score-Funktionen laufen** → „—"/ausgeblendet).
> - **⚠ NAMING-SCHULD:** `Customer.lastLogin` heißt irreführend „lastLogin", enthält aber **`last_contacted_at`**
>   (nicht Produkt-Login). Umbenennen (`lastContactedLabel`/`lastContactedAt`) — reine Klarheit, kein Verhalten.
>   FarmerSidepanel hat das bereits erkannt (Usage-Box entfernt „lastLogin", Z.335).
> - **EHRLICH LEER / „Folgt" (kein Fake, korrekt):** Kurzakte `""` (**[D5]** AI) · Timelines/EngagementChain/
>   Touchpoints `[]` · **Sherloq-Usage** (profilesAdded/enrichments/messages/posts) → `UsageBox` leer **[D49]**
>   (keine DB-Quelle) · **NRR**-KPI → „Folgt" (**[D43]** Historisierung) · signalsCount `0`, pipelineStage
>   `"pipeline"` (Konstante, im Farmer ungenutzt).
> - **Score-Compute offen:** `churn_score`/`upsell_score`/`health_score` sind DB-Spalten (Migr. 048), aber die
>   **Edge-Funktionen laufen noch nicht produktiv je Org** → aktuell NULL. Aktivierung = eigener Schritt (Next-Liste).
> **Fazit:** nichts sofort zu fixen (alles honest); offene Anschlüsse sind die bereits vergebenen Marker
> [D5]/[D43]/[D48]/[D49] + die `lastLogin`-Umbenennung. K-2b hat die Zeit-Spalte selbst vereinheitlicht.

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

### [D-perf-aufraeumen] Pre-Push-Audit WARN-Punkte sammeln + abarbeiten (deferred)
> **Erfasst 21.07.2026** aus dem Pre-Push-Audit beim `main`-Push `3c5b19c` (6 WARN · 0 FAIL — alle
> vorbestehend, keiner aus dem 3b-Slice). Nur dokumentiert, **nicht jetzt umsetzen** (Oliver-Entscheidung).
> WARN = Empfehlung, kein Blocker. Gute Kandidaten für einen späteren Perf-/Aufräum-Slice bzw. den AI-Layer.
>
> **A) Perf-Empfehlungen (Bestandscode):**
> 1. **`staleTime` fehlt** (`useQuery` Default 0 → aggressiv; Empf. 30s statisch / 5s live):
>    `FarmerSidepanel.tsx` · `HunterSidepanel.tsx` · `ExpandedCardContent.tsx` · `FarmerExpandedCardContent.tsx` · `useModules.ts`.
> 2. **`SELECT *` statt expliziter Felder** in `src/lib/db.ts`: `getContacts` · `getCompanies` · `getCompanyDetail` ·
>    `getDealsByCompany` · `getNotesByCompany` · `getSignals` · `getTasksByContact` · `getNotesByContact` ·
>    `getDealsByContact` · `getSettings` · `getDuplicatePairs` · `getCompanyDuplicatePairs` · `mergeContacts` ·
>    `mergeCompanies` · `getListMembers` (Ausnahme `getContactDetail` bleibt bewusst `*`).
> 3. **Edge-Function ohne explizites Timeout** (Empf. max 30s Cron / 10s User): `supabase/functions/`
>    `health` · `score-churn-risk` · `score-deal-health` · `score-heat-status` · `score-upsell`.
>
> **B) AI-Layer-Migration:** `src/lib/aiChat.ts` ruft (künftig) nicht über `aiCall()` — `lib/ai.ts` fehlt noch;
>    **bei Bau des AI-Layers migrieren** (deckt sich mit der Choke-Point-Regel; verwandt mit [D5]).
>
> **C) Kein Handlungsbedarf (Fehlalarm der Heuristik, nur zur Vollständigkeit):** „Component Registry" +
>    „Single-Source Kontaktwerte" treffen ausschließlich **Test-Dateien** (`*.render.test.tsx`,
>    `ScreenDuplicates.render.test.tsx:97/115/143`) — kein Produktivcode.
>
> **Verwandt:** [D28] (Perf-Politur Phase 5) · [D5] (AI-Pipeline). **Kommt wenn:** eigener Perf-/Aufräum-Slice
> bzw. mit dem jeweiligen Modul (AI-Layer, Realtime).

### [D-voice-altfelder-cleanup] Personal Voice — alte Sammel-Keys entfernen — ✅ ERLEDIGT 22.07.2026
> **Erfasst 22.07.2026, umgesetzt 22.07.2026** (nach der Daten-Neueingabe). Reihenfolge eingehalten:
> erst Neueingabe (neue Split-Keys befüllt + live bestätigt), dann Cleanup.
>
> **Umgesetzt (Migr. 085 gepusht + remote per self-abortierendem DO-Block verifiziert; Gates grün,
> test-runner + auditor PASS):**
> 1. **`update_voice_profile` neu (085):** Whitelist OHNE `sentence_style`/`hooks` (Kanäle) + `themes` (overview).
>    Verifiziert: ein `themes`- bzw. `sentence_style`-Patch wird jetzt abgelehnt (`Unbekanntes Voice-Feld`).
> 2. **Daten-Cleanup (085):** die alten Keys aus `overview`/`post`/`comment`/`dm`/`email` **und** `field_meta`
>    entfernt (idempotent, `-`-Operator + WHERE-Guard). Verifiziert: `old_gone=t` in allen Kanälen + field_meta;
>    **neue Keys unverändert** (core_topics 6 · post tone 4/vocab 5/hooks 3 · comment/dm tone 4/vocab 5 +
>    engagement_patterns/cta_style/samples · email leer). Kein Datenverlust an den neuen Feldern.
> 3. **TS-Typen (`db.ts`):** `VoiceOverview.themes` + `VoiceChannel.sentence_style`/`hooks` entfernt.
> 4. **i18n de/en/es:** tote Keys `voice.field.writingStyle`/`hooks`, `voice.overview.themes`,
>    `company.hint.voiceThemes`/`voiceHooks`/`voiceSentenceStyle` entfernt.
> 5. **Guard-Test** `src/lib/voiceCleanup.test.ts`: Registry + Locale-Parität gegen Wieder-Einführung.
>
> Sicherheits-Check vorab bestätigt: kein aktiver Code las/schrieb die alten Keys (nur Whitelist + Typen +
> tote i18n, alle mitentfernt). History-Migrationen 078/079 (Kommentare) bewusst unberührt.

### [D-voice-listen-ki-pill] KI-Ausfüllen-Symbol auch an Listen-Felder (deferred, gekoppelt an [D5] KI-Pipeline)
> **Erfasst 22.07.2026** (Konsistenz-Diagnose Personal Voice). **Jetzt NICHT bauen — bewusst bis zur KI-Anbindung verschoben.**
>
> **Was:** Das KI-Ausfüllen-Symbol (Sparkle) einheitlich auch an `KnowledgeListField` ergänzen — **EIN Pill auf
> Listen-Header-Ebene** (neben dem Label), **nicht** pro Item (ein Pill je Eintrag wäre zu laut; bestehende
> Entscheidung `showAi={false}` je Item bleibt). Heute haben nur die Fließtext-Felder (`KnowledgeField`, `showAi`
> default) das Symbol; die Listen-Felder (Tonfall/Wortwahl/Kernthemen/Hook-Strategien) haben keins.
>
> **Warum erst mit der KI:** Das Symbol ist heute überall nur **Platzhalter** (`AI_PILL_PENDING`, disabled, kein
> `onClick`) — `lib/ai.ts`/`aiCall` fehlt. Ein Listen-Pill jetzt wäre reine Optik ohne Funktion. Darum **einheitlich
> UND funktional zusammen** bauen, sobald die KI-Pipeline steht: dann mit **korrekter Listen-Rückgabe** (mehrere
> Einträge `[{id,text}]`, nicht ein Text).
>
> **Nebenwirkung (bewusst):** `KnowledgeListField` ist zentral → ein Listen-Pill erscheint dann **automatisch an
> ALLEN** Nutzungsstellen: Personal Voice (Kernthemen/Tonfall/Wortwahl/Hook-Strategien) **und** Company Profile
> (USPs · Probleme · Geschäftsergebnisse · Angebote · Wettbewerber) **plus** die Listen in den ICP-/Persona-Karten.
> Gewollt (Konsistenz), aber bewusst gemeinsam.
>
> **Bau-Vorgabe:** Fließtext-Fill und Listen-Fill laufen über **EINEN gemeinsamen Weg** (`lib/ai.ts`/`aiCall`), den
> auch der AI Chat per Function-Call nutzt; gespeichert wird über **denselben einen Schreibweg** wie die Tastatur
> (`update_voice_profile` / `update_org_profile`); `fieldImportance.ts` ist der gemeinsame Vertrag. **i18n de/en/es**
> für neue Labels/Tooltips. **Kommt wenn:** [D5] (KI-Pipeline / `lib/ai.ts`) gebaut wird.

### [D-lifecycle-trigger] SET-4 Gruppe 5 — Lifecycle-Trigger mit UND-Kombination (deferred, eigener Slice)
> **Erfasst 21.07.2026** (SET-4-Zuschnitt bestätigt). **Noch NICHT gebaut.** Die 5. Regel-Gruppe des
> SET-4-Bauplans (Lifecycle-Trigger) ist bewusst KEIN Teil von 4a — sie braucht mehr als eine RuleRow.
>
> **Heutiger Stand:** nur `sequence_rules.trigger_signal text` = EIN Einzel-Event, **keine** UND-Kombination.
> Kein `conditions[]`-Schema, keine `lifecycle_triggers`-Tabelle. **Nicht** in der `update_settings`-Whitelist (083).
>
> **Ziel-Anwendungsfall:** User definiert Wenn-Dann-Regeln mit UND-Kombination, z.B.
> **„WENN Deal > X UND älter als Y Tage UND Z Tage kein Kontakt → DANN Aktion (Glocken-Mitteilung /
> später E-Mail)".**
>
> **Neubau (eigener Slice):** eigene Tabelle/Schema `lifecycle_triggers` (org-scoped, RLS/CASCADE) mit
> **`conditions` als UND/ODER-Baum** — **zwingend über die bestehende Filter-Lib `src/lib/filter/`**
> (`FilterRule` Feld·Operator·Wert · `FilterGroup` logic AND|OR · `FilterNode` · compile/evaluate/validate;
> CLAUDE Architektur-Weiche d „EINE Bedingungs-/Filter-Sprache — nie eine zweite, nie freies SQL").
> UI braucht einen **Condition-Builder** (RuleRow allein reicht nicht). Auslöse-Ausführung (Trigger prüft
> conditions → Aktion) ist Teil des Slices.
>
> **VERBINDLICHE BAU-VORGABEN für diesen Slice (beim Bau nicht vergessen):**
> 1. **CHAT-VERTRAG — EIN Schreibweg für Mensch UND KI.** Regel-Erstellung/-Änderung läuft über GENAU EINE
>    sauber definierte Schreib-Funktion (RPC), sodass der spätere KI-Chat sie per Function-Call auf **exakt
>    demselben Weg** erzeugt wie der Bedingungs-Baukasten/das Formular. **NIEMALS zwei getrennte Wege.**
>    (Deckt sich mit der Dauerregel „Chat-Aktions-Vertrag-Pflicht" — Einstufung required/recommended/optional
>    beim Bau festlegen, direkt beim RPC-Aufrufer in `db.ts`.)
> 2. **AKTIONEN andockbar (offener Andockpunkt).** Die „DANN"-Aktion ist ein offenes Registry/Andock-Muster:
>    verfügbare Aktionen docken an, sobald ihre Bausteine existieren — **Glocken-Mitteilung zuerst**
>    (`notify()`/`log_activity` Migr. 066 existiert bereits), **E-Mail später** (Sending-Layer). **Kein Fake**
>    für noch nicht existierende Aktionen — nicht-verfügbare erscheinen nicht bzw. ehrlich „Folgt".
> 3. **PLAN-LIMIT von Anfang an.** Plan-abhängige Mengen-Begrenzung (wie viele Regeln/Actions ein User anlegen
>    darf). **Die Obergrenze ist KEIN hartcodierter Wert**, sondern konfigurierbar pro Plan über
>    `plan_limits`/Entitlement (Zahlen definiert Oliver später je Paket). System braucht einen **Blocker**,
>    der bei Erreichen der Grenze sauber stoppt (freundliche Meldung, kein Silent-Fail — Muster wie `api_usage`/
>    Entitlement-Serie). Zähl-/Limit-Prüfung serverseitig im Schreibweg.
> 4. **RECHT festlegen.** Erstellen/Ändern gaten — voraussichtlich **`rules.edit`** (existiert seit SET-4/083)
>    ODER ein eigenes `automation.manage` (existiert ebenfalls) — beim Bau final entscheiden + `<RequiresPermission>`
>    + Server-Guard im RPC (Rechte-Check-Pflicht: UI + Server, nie nur UI).
>
> **Kommt wenn:** nach SET-4a (Regeln 1–4). **Verwandt:** [D51] (Werte-in-DB) · K-2 (Filter-Sprache-Quelle) ·
> [D38] (Lifecycle-Trigger contact_status, dort als Auslöser-Fall genannt) · Chat-Aktions-Vertrag-Pflicht
> (CLAUDE) · Entitlement/`plan_limits`-Serie (`for_ai_sdr_vorab_entitlement_credits`).
>
> **L-1 STATUS (Backend-Fundament FERTIG, 22.07.2026 — Branch `feature/lifecycle-trigger-l1`, noch nicht gemergt):**
> Migr. **088** = `lifecycle_rules` (conditions Option-B: Spalte `anchor_entity` + `conditions` {logic, groups[]}) ·
> `lifecycle_rule_runs` (Match-Zustand je Regel/Datensatz, Einmal-Feuer-Semantik) · `action_types` (Registry ALS
> DATEN, global; Gruppe-1 aktiv `notify`/`notify_urgent`/`create_task`/`add_tag`/`add_to_list`, Gruppe-2
> `coming_soon` inkl. `set_contact_status`/`send_email_*`/`start_sequence`/`slack_message`) · plan_limits-Feature
> `lifecycle_rules` (intern -1) · RLS (Read je Org, Write nur RPC) · Indizes · audit-Trigger · RPCs
> `upsert_lifecycle_rule`/`delete_lifecycle_rule` (automation.manage-Gate, Option-B-Grammatik-Validierung,
> action.type ∈ aktive Registry, plan_limit-Blocker) + `db.ts`-Wrapper mit Chat-Aktions-Vertrag. **L2-Sofortgewinn:**
> `churn_score`/`upsell_score`/`health_score` (contacts) + `stagnation_days` (deals) in `filter/schema` filterbar.
> **L-2a STATUS (Auswerter-Kern FERTIG, 22.07.2026 — Branch `feature/lifecycle-l2a`):** Edge `evaluate-lifecycle-
> rules` (Guard: heutige Score-Läufe durch? sonst Alarm+Skip · Cross-Entity Option B via `compileToPostgrest`+
> FK-Mapping für ALLE drei Anker · `computePlan`: Rangfolge/terminal/Gleichstand + Einmal-Feuer + Batch-Vertagung) ·
> **Verkettung C** (score-upsell stößt Auswerter an, nicht-regressiv) · Migr. **089** (cron_expectations + atomare
> `lifecycle_mark_fired`/`_rearmed`) · notify/notify_urgent (Kategorie „Regel") · reine Logik testbar (`_shared/
> lifecycle/eval.ts` 15 Tests) + Deno-Filter-Mirror mit Parity-Test. **[D56]:** deals/companies-Anker sind
> implementiert, aber Deeplink fehlt + noch nicht live-verifiziert → in L-2b abschließen (vor L-3-UI).
> **Offen: L-2b** (Aktionen create_task/add_tag/add_to_list + [D56] Deeplinks) · **L-3 UI Condition-Builder**
> (in „Eigene Actions"-Reserve). **Cross-Entity-Grenze:** gemischtes Blatt-OR bewusst nicht (Option C später, ohne Datenmigration).

### [D53] set_contact_status als Lifecycle-Aktion scharfschalten (deferred, folgenschwer)
> **Erfasst 22.07.2026** (Lifecycle-Baukasten L-1). In der Aktions-Registry (`action_types`, Migr. 088) als
> **`status:'coming_soon'`** (`requires='governance'`) angelegt — im Builder ehrlich ausgegraut, NICHT scharf.
> **Warum deferred:** `set_contact_status` ändert **echte Kundendaten automatisch** (verschiebt Kontakte zwischen
> `ohne_campaign`/`in_campaign`/`pipeline`/`kunde`/`archiviert` → zwischen Modulen). Braucht **Governance** vor dem
> Scharfschalten:
> - **Welche Übergänge automatisch erlaubt?** (z.B. `trial→kunde` [D38] ja; beliebige Sprünge nein).
> - **`opt_out`/`archiviert` NIE automatisch** (rechtlich/irreversibel — nur Mensch).
> - **Verhältnis zum Automation-Risk-Level** (contact_status-Wechsel als Medium/High einstufen?).
> **Scharfschalten =** Registry-Zeile auf `active` + Handler im L-2-Auswerter (mit Guardrail-Prüfung) + Governance-
> Regeln — **ohne** Regel-Schema/RPC/UI zu ändern (Registry-als-Daten-Muster). **Verwandt:** [D38] · [D39] ·
> [D-lifecycle-trigger] · docs/integrations_masterplan.md §5 (Aktions-Registry).

### [D54] Chat-Fehler-Rückmeldung-Pflicht — Nachrüst-Slice (Bestandsaufnahme 22.07.2026)
> **Regel verankert** als GLOBALE REGEL [D54] in CLAUDE.md + AI-Chat-Bauplan §5a-1. **Kern:** jeder chat-fähige
> Schreibweg muss bei nicht ausführbaren Anfragen eine **KLARE, STRUKTURIERTE, maschinell weiterreichbare**
> Begründung liefern (WAS/WARUM/WAS-zu-tun) — ein nacktes `raise exception 'text'` (P0001, ohne
> `errcode`/`detail`/`hint`/`column`) genügt allein NICHT. Der `db.ts`-Wrapper wirft den Rohfehler heute 1:1 weiter.
>
> **Bestandsaufnahme (nichts umgebaut — Basis für den Nachrüst-Slice):** ALLE heutigen chat-fähigen RPCs nutzen
> reines `raise exception 'text'` → **keiner erfüllt [D54] vollständig** (Text-Qualität unterschiedlich, aber
> durchweg **unstrukturiert**). Reihenfolge nach Nachrüst-Aufwand (kleinster zuerst):
> - **`upsert_lifecycle_rule`/`delete_lifecycle_rule` (088):** Text **stark** (Limit „X von Y … upgraden/löschen",
>   „Aktion nicht verfuegbar (unbekannt oder noch nicht freigeschaltet)", „Pflichtfelder fehlen: …", Operator/anchor)
>   → **muss nachgerüstet** (nur Struktur/Code fehlen). *Selbst der neueste RPC erfüllt [D54] noch nicht — bewusst notiert.*
> - **`update_settings` (083):** Text **stark** (Min/Max „muss zwischen X und Y liegen (war Z)", unbekannter Key,
>   Won/Lost unantastbar) → **muss nachgerüstet** (Struktur/Code).
> - **`update_voice_profile` (084):** Text ok (Feldpfad „%.%"), aber `Ungueltiger primary_channel` **ohne erlaubte
>   Werte** → **muss nachgerüstet** (Struktur + erlaubte Werte ergänzen).
> - **`update_icp`/`update_persona` (086) · `update_org_profile`/`update_product` (077):** Text ok (unbekannter Key,
>   „muss eine Liste sein", „braucht eine id", „nicht gefunden"), teils ohne erlaubte Werte (`Ungueltiges Preis-Modell`)
>   → **muss nachgerüstet** (Struktur).
> - **Querschnitt alle:** `Kein Recht (X)` nennt das Recht, aber kein „was tun" (z.B. Admin anfragen); `nicht
>   authentifiziert`/`unbekannter User`/`… gehoert zu anderer Organisation` terse. **db.ts-Wrapper** normalisieren
>   den Fehler nicht → roher Postgres-Fehler erreicht Chat/UI.
>
> **Nachrüst-Slice (später, eigener Branch):** einheitliches Fehler-Schema (Code/Typ + Feld/Objekt + optional
> erlaubte Werte/Grenzen) via `raise ... using errcode/detail/hint/column`, ODER strukturiertes Rückgabe-Objekt;
> `db.ts`-Wrapper mappt auf ein gemeinsames `AppError`; Auditor-/Test-Punkt „Chat-Fehler-Rückmeldung" ergänzen.
> **Kommt mit:** dem AI-Chat-Tool-Layer (dort wird die strukturierte Form tatsächlich konsumiert). **Verwandt:**
> Chat-Aktions-Vertrag-Pflicht · Fehlerbehandlung-aus-User-Sicht (CLAUDE) · [D5] (KI-Pipeline).

### [D55] Kanal-Präferenz-Wähler pro Benachrichtigungs-Art/Regel (deferred → L-3 / Mitteilungssystem-Ausbau)
> **Erfasst 22.07.2026** (Lifecycle-Baukasten L-2a). Heute wählt der Nutzer den **Ausgabe-Kanal** einer
> Benachrichtigung **nicht** pro Art/Regel — die Kanal-/Präferenz-Logik existiert im Mitteilungssystem nur
> als Kategorie-Default (`NOTIFICATION_CATEGORIES[].emailDefault`, `settings.notifications`-Matrix, N-S2).
> **Fehlt:** ein UI-Wähler „für DIESE Regel/Benachrichtigungs-Art Kanal = In-App / E-Mail / Slack / Pop-up".
> **In L-2a bewusst nicht:** der einzige aktive Kanal ist In-App (`notify`/`notify_urgent`, Kategorie „Regel",
> in `NOTIFICATION_CATEGORIES` registriert). Der notify-Handler hängt **am bestehenden** System (gleiche
> Kanal-/Präferenz-Fan-out-Logik) → weitere Kanäle werden später nur „angesteckt", ohne Handler-Umbau.
> **Kommt mit:** L-3 (UI Condition-Builder + Aktions-Kanal-Wahl) bzw. dem Mitteilungssystem-Ausbau
> (`docs/mitteilungssystem_bauplan_v1.md`); Voraussetzungen je Kanal: E-Mail → System-Mail-Kanal ·
> Slack → Slack-Integration (beide existieren noch nicht). **Verwandt:** [D-lifecycle-trigger] · Aktions-
> Registry `action_types` (Migr. 088, `send_email_internal`/`slack_message` als `coming_soon`) · N-S2.

### [D56] Lifecycle-Auswerter — deals/companies-Anker abschließen (deferred → L-2b, vor L-3-UI)
> **Erfasst 22.07.2026** (nach Faktencheck). **Korrektur einer Annahme:** die deals/companies-Anker sind in
> **L-2a bereits IMPLEMENTIERT** (nicht nur contacts) — `groupAnchorIds`/`resolveOwner`/`computePlan` behandeln
> alle drei Anker inkl. FK-Mapping (`deals.contact_id` · `contacts.primary_company_id` · `deals.company_id`)
> und Owner (`contacts.assigned_to` · `deals.owner_id` · companies → Fallback `created_by`). Deal-/Firmen-
> verankerte Regeln **würden feuern**. **Echte offene Lücken:**
> 1. **Deeplink `p_link` fehlt** für deals/companies — nur `anchor==='contacts'` erhält ein Sprungziel
>    (`/app/kontakte/{id}`); deals/companies-Benachrichtigungen kommen ohne Link.
> 2. **Noch nicht live-verifiziert** (falls die L-2a-Live-Prüfung nur contacts abdeckte) — die deals/companies-
>    Anker-Pfade live gegen echte Daten prüfen.
> **MUSS in L-2b umgesetzt werden, BEVOR die L-3-UI alle drei Anker anbietet** (sonst UI-Anker ohne Sprungziel
> bzw. unverifiziert). **Verwandt:** [D-lifecycle-trigger] · L-2b (create_task/add_tag/add_to_list).

### [D-set4-group4-signalcap] SET-4 Gruppe 4 — signal_windows schreibbar + Kappungs-Key (mit 4a)
> **Erfasst 21.07.2026.** Für Gruppe 4 (Signale & ICP) fehlt im Schreibweg: (a) `settings.signal_windows`
> (Top-Level-Spalte, Migr. 018) ist **nicht** in der `update_settings`-Whitelist (083, nur
> thresholds/automation_defaults/pipeline_stages) → **kleine Migration** in 4a: `signal_windows` in die
> Top-Level-Whitelist + Item-Validierung (`window_hours` z.B. 1–8760) + Recht `rules.edit`. (b) **„Kappung"**
> hat heute keine DB-Heimat → neuer Key (in `thresholds.*` oder auf `signal_windows`) + Whitelist-Eintrag.
> ICP-Schwellen (`automation_defaults.icp_score_threshold` + `thresholds.hunter_priority_weights.icp_*`)
> sind bereits da/whitelisted. **Kommt mit:** 4a-Bau.

### [D29] Einladungs-Email via Edge Function (deferred)
- Einladung wird bereits in `invitations` gespeichert (Migration 042) ✓
- Provisioning-Trigger ordnet Org + Rolle zu, wenn der User sich registriert (Migration 043) ✓
- **Fehlt noch:** der Email-Versand — `supabase.auth.admin.inviteUserByEmail` braucht den
  `service_role`-Key → **nur in einer Edge Function**, nie im Client.
- **Was die Edge Function tun muss:** `inviteUserByEmail(email)` aufrufen → Supabase schickt
  automatisch die Einladungs-Email mit Magic Link zur Registrierung.
- **Kommt wenn:** Settings-Screen fertig + Email-Provider in Supabase konfiguriert.
- **Bis dahin:** Einladung nur in der DB, kein Mailversand (UI-Hinweis weist darauf hin).

### [D30] 2FA Pflicht für Owner (Enforcement) (deferred)
- **Aktuell:** Empfehlung via `MfaBanner` (Scheibe 8) ✓ — kein Zwang, überspringbar.
- **Fehlt:** Owner **MUSS** 2FA aktivieren, bevor er auf die App zugreifen kann.
- **Umsetzung:** Supabase **AAL2**-Policy + Auth-Guard (Zugriff erst nach erfüllter 2FA).
- **Kommt wenn:** Settings-Screen fertig + erste echte Kunden.

### [D31] Google + Microsoft OAuth Setup (deferred)
- **Code fertig:** `signInWithGoogle`/`signInWithMicrosoft` (Scheibe 2) ✓.
- **Fehlt:** OAuth-Apps anlegen in **Google Cloud Console** + **Azure Portal**.
- **Redirect-URL:** `[domain]/auth/callback`.
- **Dauer:** ca. 20 Min pro Provider.
- **Kommt wenn:** Production-Domain feststeht.

### [D33] Farmer Info-Panel (820px) — eigene `FarmerSidepanel`-Komponente (✅ gebaut, Mock)
- **Erledigt (Sessions 2026-06-24/25):** Eigene `features/farmer/FarmerSidepanel.tsx` (NICHT der alte
  `CustomerDrawer`, NICHT ein Hunter-Flag) — `variant='panel'|'full'`, typo-Kanon + Tokens, Full-Bleed-Sheet.
  Tabs: Übersicht (AktiveSignale Churn/Upsell/Kalt/Gekündigt · OffeneTasks · KommunikationKompakt ·
  SubscriptionBox + UsageBox) · Aktivität · Kommunikation · Tasks · Subscription · Usage · Notizen.
  KontaktZeile im Panel-Header (Mail/Telefon/LinkedIn/Web). Reuse aller geteilten panel-blocks
  (DetailSection/DetailField/DetailPhoneList/NotizenListe/TasksListe).
- **Slice 3 (2026-06-25):** ScreenFarming verdrahtet — Kunden/Retention/Upsell/Signals → `openInfo()` öffnet
  FarmerSidepanel mit echter Person-Shape (`itemToPerson`); CTAs → FarmerActionDrawer ([D34]); LinkedIn-Signal
  „Antworten" → `SignalActionDrawer` (#7, reuse Hunter-Resolver).
- **Slice 4 (2026-06-27):** alten `CustomerDrawer` aus dem Farmer-Pfad entfernt — `<Drawer>` aus
  `FarmerReference` raus, `onSelectCustomer` ganz aus `ScreenFarming`-Props gestrichen (war toter Code; Farmer
  öffnet ausschließlich `FarmerSidepanel`). CustomerDrawer bleibt nur noch für MeinTag (aktiv) + Hunter (Rest).
- **Offen (Farmer-DB-Wiring):** echte Daten statt Mock · KI-Kurzakte-Block · AktiveSignale-Flags an echte
  Felder koppeln (siehe [[D47]] Nachzieh-Liste). Daten aktuell Mock (Reference-State).

### [D34] Farmer Action-Panel (720px) + Signal-Feed (✅ gebaut, Mock — Option A)
- **Erledigt (Sessions 2026-06-24/25):** `lib/farmerActions.tsx` (Resolver `farmerActionConfig` + serialisierbares
  `FarmerActionType`/`FARMER_ACTION_CATALOG`, Spiegel von `signalActions.tsx`) + `features/farmer/FarmerActionDrawer.tsx`
  (dünner Wrapper, rendert `ChatActionPanel` **unverändert**). Kinds: `churn_risk`/`going_cold`/`upsell_potential`/`cancelled`.
- **Option A (bewusst):** ChatActionPanel-Renderer bleibt unverändert → Actions erscheinen erst mit echtem Draft;
  bis [[D5]] AI-Pipeline ehrliche „Folgt"-Platzhalter (recommendation = AI_PENDING_LABEL, draft null). Actions
  schon im Katalog definiert → DB-ready.
- **Action-Panel-Breite** app-weit auf **720px fix** vereinheitlicht (ChatActionPanel zentral; NoTaskDrawer + ActionPanel).
- **Verdrahtet (Slice 3):** ScreenFarming-CTAs (Retention/Upsell/Übersicht-Signale) → FarmerActionDrawer.
- **Offen:** echte Drafts/Sending mit [[D5]] + Sending-Layer.

> Hinweis: `[D32]` bleibt bewusst unbelegt (Nummern-Lücke, keine offene Entscheidung).

### [D35] Dynamische Signal-Action-Rules — „wenn Signal X → Panel Y mit CTA Z" (deferred)
- **Problem heute:** Signal→Action-Panel ist fest verdrahtet. `ChatActionPanel` ist zwar eine
  config-getriebene Render-Engine (`ChatActionConfig`), aber die Config wird pro Drawer gebaut.
  Neuer Signal-Typ/CTA = Code-Änderung (`SIGNAL_TYPE_META` in `constants.ts` + i18n + Drawer).
  Keine `signal_action_rules`-Tabelle. (`automation_rules`/`sequence_rules` aus 006 regeln
  AI-SDR-Automatik, **nicht** UI-Action-Panels.)
- **✅ Phase 0 erledigt (dieser Branch):** Resolver `signalActionConfig` (`lib/signalActions.tsx`)
  statt Inline-Config im `SignalActionDrawer` (verhaltens-identisch) + serialisierbare
  **Action-Registry** (`SignalActionType` + `SIGNAL_ACTION_CATALOG`, Handler erst beim Dispatch
  gebunden). Kein Schema-Lock-in. Macht Phase 1 deutlich kleiner.
- **Phase 1 (Mittel, 2–3 T) — wenn [D5] AI-Pipeline + Sending-Layer + [D34] stehen:** Tabelle
  `signal_action_rules` (org_id + RLS + CASCADE + Index; `condition` jsonb, `action_config` jsonb
  = `ChatActionConfig`-Form, `priority`, `is_active`) + client-seitiger Resolver liest Regeln aus
  DB + Dispatch-Registry (`action_type`-String → Handler). Noch ohne Builder-UI (Seed/Settings).
- **Phase 2 (Groß, >1 Woche) — bei echter Nachfrage:** No-code Rule-Builder-UI (Settings) +
  DB-basierte Signal-Definitionen (löst `SIGNAL_TYPE_META`).
- **Warum gestaffelt:** Der teure/riskante Teil ist nicht die Tabelle, sondern Condition-Modell +
  Dispatch-Registry — die abstrahiert man seriös erst mit ~3 echten Fällen (heute: 1). Steht auf
  [D5]/Sending-Layer, die noch fehlen → Engine jetzt = Bau auf Sand.

### [D36] Hunter — „Trial läuft aus"-Kachel (deferred)
- **Trigger:** `companies.trial_end_date <= now() + 2 Tage` **AND** `subscription_status = 'trial'`.
- **Wo:** Hunter → **Follow-ups**-Tab.
- **CTA:** „Abschluss sichern".
- **Wann:** nach Farmer komplett fertig (alle Tabs + Info-Panel [D33] + Action-Panel [D34]).
- **Voraussetzung:** Feld `trial_end_date` in `companies` (Migration nötig) + `subscription_status`.

### [D37] Hunter — „Trial abgelaufen ohne Conversion"-Kachel (deferred)
- **Trigger:** `companies.trial_end_date < now()` **AND** `subscription_status = 'trial'`.
- **Wo:** Hunter → **Follow-ups**-Tab.
- **CTA:** „Jetzt konvertieren".
- **Wann:** nach Farmer komplett fertig (alle Tabs + Info-Panel [D33] + Action-Panel [D34]).
- **Voraussetzung:** wie [D36] (`trial_end_date` + `subscription_status` in `companies`).

### [D38] Lifecycle-Trigger: Trial → Kunde (deferred)
- **Auslöser:** `subscription_status` wechselt von `'trial'` auf `'active'`.
- **Effekt:**
  - `contact_status → 'kunde'`
  - Kontakt **verschwindet** aus Hunter
  - Kontakt **erscheint** in Farmer
- **Braucht:** Supabase-Trigger oder Edge Function.
- **Wann:** nach Farmer komplett + Hunter-Trial-Kacheln ([D36]+[D37]) — alles zusammen mit der DB-Wiring-Phase.
- **💡 IDEE (29.06.2026) — „Neue Kunden"-Tab im Farmer:** Wird ein Deal auf **Won** gesetzt und der
  Kontakt wandert nach Farmer, landet er in einem neuen Tab **„Neue Kunden"** (analog „Neu in Pipeline"
  beim Hunter). Dort **bestätigt der AM den MRR-Betrag**. Nach Bestätigung → `companies.mrr_monthly` wird
  gesetzt, der Kontakt **verschwindet** aus diesem Tab. **Voraussetzung:** [D38] Lifecycle-Trigger muss
  zuerst stehen. Verwandt: MRR/ARR-Übergangslösung unter [[D21]].

### [D39] Farmer Retention-Tab — „Kunde wird kalt"-Kachel (deferred)
- **Trigger:** `contact_status = 'kunde'` **AND** `heat_status = 'kalt'`.
- **Bedeutung:** Bestandskunde ohne Kontakt — **Churn-Vorstufe**, gehört in Farmer (nicht Hunter).
- **Signal-Row-Hintergrund:** amber.
- **CTA:** „Check-In starten".
- **Wann:** Retention-Tab-Slice (nächster Schritt).

### [D40] automation_rules Schema-Korrektur (deferred)
- **Problem:** Migration **006** legt `automation_rules` falsch an — **N Zeilen pro Org**
  (`risk_level` × `action_type` × `is_auto_allowed`/`confidence_threshold`) statt der in
  CLAUDE.md final entschiedenen Form **1 Zeile pro Org** (`low_risk_auto`/`medium_risk_auto`/
  `medium_confidence`, High Risk bewusst ohne Feld). Keine gemeinsamen Spalten außer id/org/created_at.
- **Lösung:** **Option A — `ALTER TABLE`** (risikoarm): alte 4 Spalten droppen, neue Felder +
  `updated_at` hinzufügen, `UNIQUE(organization_id)`. Index `idx_automation_rules_org` und die
  RLS-Policy hängen nur an `organization_id` → **bleiben automatisch erhalten** (kein Recreate,
  kein Tenant-Leak-Risiko). Sicher, weil **0 Zeilen, 0 Leser, keine FKs/Functions** (geprüft).
- **Dabei mitklären (sonst zweimal migrieren):**
  - `settings.automation.hunter|farmer|mein_tag` (per-Modul) fehlt im Seed (012) — nur
    `automation_defaults.default_automation_level` vorhanden.
  - `execution_mode` (manual/semi_auto/full_auto) ist nur CLAUDE-Architektur-Text, **nicht** in der DB.
  - `docs/sales_os_db_schema_v3.md` angleichen (006-Header nennt sie als maßgeblich → möglicher dritter Widerspruch).
- **Wann:** gebündelt mit dem Bau der **Automation-Settings-UI** (Settings → AI SDR → Automation
  Rules, Settings-Screen-Phase) — dann gegen echte Reads verifizierbar; eine isolierte 047 jetzt
  wäre eine blinde Änderung an einer ungenutzten Tabelle.

### [D41] ScreenMarketing + ScreenSherloqSystem auf Elevation-System (deferred)
- **Problem:** Beide Screens nutzen einen abweichenden „Soft-Card"-Stil — `rounded-[24/32px]` +
  rohe/hardcodierte Schatten (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]` u.ä.), **kein** `border-card`.
  Folgt dem Elevation-System (CLAUDE Design Invariants) **nicht**.
- **Lösung:** eigener Sweep analog Hunter/Farmer — Container auf `rounded-[12/16px]` + `border-card` +
  `shadow-[var(--shadow-card)]`; rohe Schatten → Token.
- **Aufwand:** eigener Sweep, **Mittel**.
- **Wann:** wenn diese Screens aktiv gebaut/verdrahtet werden — **nicht jetzt isoliert** (aktuell nicht Teil des Farmer/Hunter-Fokus).

### [D42] TaskDrawer (850px) auf shadcn `Sheet` umbauen (deferred)
- **Problem:** `features/hunter/TaskDrawer.tsx` baut seine Drawer-Hülle **von Hand** (eigenes
  `fixed inset-0` Overlay + Panel-`<div>`) statt über das shadcn-`Sheet`-Primitiv — Verstoß gegen
  CLAUDE „Side-Panels → `sheet`". (Schatten/Radius sind seit dem Elevation-Sweep schon Token-konform:
  `shadow-[var(--shadow-dropdown)]` + `rounded-[16px]`.)
- **Lösung:** auf `Sheet`/`SheetContent side="drawer"` umstellen (wie HunterSidepanel/CustomerDrawer) —
  Overlay/Backdrop/Escape/Fokusfalle kommen dann gratis.
- **Aufwand:** klein–mittel. **Wann:** wenn der AI-SDR-/Task-Drawer-Bereich aktiv drankommt.

### [D43] Historisierung — Zeitreihen & Event-Log (Architektur-Prinzip, deferred · Reihenfolge entschieden 29.06.2026)
- **Grundsatz:** Alle über-Zeit-veränderlichen Daten werden **historisiert**, nicht nur als
  Momentaufnahme. Vergangenheit ist nachträglich unwiederbringlich → bei JEDEM Daten-Wiring mitdenken.
  Volle Regel in **CLAUDE.md → „Historisierung — Zeitreihen & Event-Log"**.
- **🔑 ENTSCHEIDUNG (29.06.2026) — Reihenfolge:** [D43] wird **NICHT** als isolierter erster Schritt
  gebaut. Neue Reihenfolge:
  1. **Farmer DB-Wiring komplett** — echte Scores, Subscription, Signale, KI-Kurzakte.
  2. **Score-Funktionen aktivieren** (`score_churn_risk`, `score_upsell`, `calculate_health_score`),
     sodass **täglich echte Zahlen** entstehen.
  3. **[D43] History als systemweite Schicht** — einmal sauber für **Hunter + Farmer zusammen**,
     **NICHT** als Farmer-Insel.
  - **HARTES GATE:** [D43] muss **live sein, BEVOR der erste echte Kunde reinkommt** (= vor
    Billing-Go-Live / Phase 4). Sonst gehen echte Analyse-Daten **für immer** verloren.
  - **Begründung:** `churn_score`/`upsell_score`/`health_score` existieren aktuell **noch gar nicht**
    als DB-Felder (Diagnose 29.06.2026 bestätigt) → es gibt **noch nichts zu historisieren**. History
    erst aufbauen, wenn echte Werte täglich laufen.
- **Zwei Mechanismen:** (A) **periodische Snapshots** (`usage_snapshots` täglich · `score_snapshots`
  täglich–wöchentlich · MRR/ARR/NRR monatlich) via Cron — (B) **Event-Log** (`subscription_events`:
  gebucht/gekündigt/reaktiviert/upgraded/downgraded · `payment_history`) via Trigger/Webhook.
  Delta-Berechnung in Edge Functions (z.B. `usage_change_pct`), nie im Frontend. Alle Tabellen mit
  `organization_id` + RLS + CASCADE + Index `(org, customer, datum)`.
- **Zweck:** AI-Chat-Auswertungen + KPI-Dashboards über Zeit (Typ-2-Query / Custom Dashboards v2/v3) —
  „−10 % vs. letzter Monat", „in 10 Monaten X bezahlt", „schon mal gekündigt & reaktiviert".
- **Einordnung:** als **CLAUDE.md-Dauerregel** verankert (cross-cutting, gilt für ALLE künftigen Daten) +
  Pflicht-Prüffrage vor jeder neuen veränderlichen Tabelle (in CLAUDE.md hinterlegt). Verwandt: [[D5]]
  AI-Pipeline · KPI-Dashboards.
  > ⚠️ **Überholt durch die Entscheidung oben (29.06.2026):** die frühere Einordnung „greift zuerst beim
  > Farmer-DB-Wiring / Snapshot-Tabellen müssen vor dem Wiring stehen" gilt **nicht mehr**. Reihenfolge:
  > Farmer-Wiring → Score-Funktionen aktiv → DANN [D43] systemweit (Hunter+Farmer), hartes Gate vor Phase 4.

### [D44] Flexible Daten-Tabellen (TanStack Table) (deferred)
- **Bei Bau der Company- + Kontakt-Übersicht** eine **einheitliche Tabellen-Komponente auf TanStack
  Table** aufsetzen: Spalten **sortieren · ein-/ausblenden · verschieben · filtern**. Gemeinsames
  Fundament für **alle** Tabellen (Deals, Kontakte, Companies) — nicht pro Tabelle einzeln.
- **Wann:** Kontakte/Companies-Phase. (Einordnung vorgegeben.) Beachtet die Performance-Leitlinien
  (Virtualisierung > 50 Zeilen, Keyset-Pagination — siehe „Performance & Data Loading").

### [D45] Deeplink-Highlight an allen relevanten Sprung-Stellen anwenden (deferred)
- Das Muster (`useDeeplinkHighlight` + `.deeplink-flash` + `highlightId`-Prop) ist **zentral gebaut**
  und als **globale Regel in CLAUDE.md** verankert (Design Invariants → „Deeplink-Highlight").
- **Aktuell angewendet:** NUR der **„Ansehen"-Button** (fällige Task → Tasks-Tab, aufgeklappt + Flash).
- **Noch anzuwenden — inkrementell** (jeweils wenn wir an der Stelle eh dran sind, NICHT als ein Block):
  - Signal → betroffener Deal/Kontakt
  - „Alle anzeigen" → Liste mit relevantem Eintrag oben/aufgeklappt
  - Cmd+K-Navigation → Ziel-Element
  - Benachrichtigung → auslösendes Element
  - Dashboard / Mein Tag → Detail-Sprünge
- Jede Anwendung = kleiner Handgriff (`highlightId` durchreichen + Liste pre-expand), **kein Neubau**.
  **Beim Bau jeder neuen Sprung-Stelle prüfen, ob das Muster dort gehört.** Verwandt: [[D33]]/[[D34]].

### [D46] Farmer Follow-ups Tab (✅ gebaut, Mock)
- **Erledigt (2026-06-24/25):** Follow-ups-Tab im Farmer gebaut — fällige Tasks bei Kunden (`SequenceLeadCards`,
  1:1 Hunter) + „Kunde wird kalt"-Kacheln (`FollowUpKaltCard`). Trennung Retention/Churn = Risiko vs. Follow-ups =
  Aktion umgesetzt; „Kunde wird kalt" liegt in Follow-ups; kein „Stagniert" (kein Deal/Stage). „Ansehen" →
  Deeplink-Highlight ([[D45]]). Kein DB-Wiring (Mock).
- Farmer bekommt einen **vierten Tab** in der Sub-Navigation: **Follow-ups** — analog Hunter Follow-ups.
- **Navigation Farmer (final):** `[Signale] [Churn & Trials] [Upsell] [Follow-ups]`. Follow-ups steht
  bewusst **am Ende** (Signale/Churn/Upsell = dringender → vorne).
- **Inhalt des Tabs (bewusst entschieden):**
  1. **Fällige Tasks** bei Bestandskunden (manuell **+** system-generiert).
  2. **„Kunde wird kalt"**-Kacheln (kein Kontakt seit X Tagen).
  3. **NICHT „Stagniert"** — gibt es beim Farmer nicht (kein Deal/Stage).
- **Logik + Kachel-Aufbau: 1:1 analog Hunter Follow-ups.** Gleiche Komponenten wo möglich
  (`SequenceLeadCards` für fällige Tasks · `FollowUpKaltCard` für „Kunde wird kalt").
- **Warum jetzt entschieden:** Bestandskunden-Tasks hatten **keinen Ort zum Erscheinen**. Der Farmer
  Follow-ups-Tab ist der fehlende **Auffangort für alle fälligen Tasks bei Kunden**.
  Verwandt: [[D33]] Farmer-Info-Panel · [[D34]] Farmer-Action-Panels.
- **Trennung Churn & Trials vs. Follow-ups (bewusst entschieden):**
  - **Churn & Trials** = Risiko-Übersicht: Churn Risk · Trial läuft ab · Gekündigt — mentaler Modus
    *„Was beobachte ich?"*
  - **Follow-ups** = operative Tagesarbeit: fällige Tasks + „Kunde wird kalt" — mentaler Modus
    *„Was tue ich heute?"*
  - **„Kunde wird kalt"** gehört zu **Follow-ups** (konkrete Handlungs-Aufforderung), NICHT zu
    Churn & Trials (Risiko-Signal). **Kein Inhalt erscheint in beiden Tabs.**

### [D47] Farmer Vollansicht (gebaut)
- `FarmerSidepanel` bekommt `variant='full'` analog HunterSidepanel: ArrowUpRight im Panel-Header →
  `showVollansicht` → Vollseiten-Overlay (eigene Instanz, `onExit`/`onClose`). 7 Full-Tabs: **Details ·
  Übersicht · Aktivität · Kommunikation · Tasks · Subscription · Notizen**. Farmer-spezifisch: Subscription-Tab
  zeigt **SubscriptionBox + UsageBox** (kein eigener Usage-Tab in der Vollansicht); Übersicht = AktiveSignale
  (Churn/Upsell/Kalt) + OffeneTasks + Usage-Kompakt. Generisch 1:1 vom Hunter: Aktivität/Kommunikation/Tasks/
  Notizen + Details (KontaktZeile + Person/Firma via DetailSection/DetailField). Keine neuen panel-blocks.
- Mock-Fix: Follow-up-Leads in ScreenFarming mit `sherloqStatus:'ACTIVE'` → SubscriptionBadge im Header/Hero.
- **Offen:** echte Daten (Farmer-DB-Wiring) · D33-Vollverdrahtung der übrigen Farmer-Tabs (noch CustomerDrawer).
- **Beim Farmer-DB-Wiring zwingend nachziehen** (heute Mock/hardcodiert, erscheint NICHT automatisch):
  - **(a) KI-Kurzakte-Block im FarmerSidepanel Übersicht-Tab ✅ erledigt** (KiKurzaktePlaceholder
    eingebaut, echte Daten folgen mit [[D5]]).
  - **(b) `AktiveSignale`-Flags ✅ erledigt (8c/8c-final):** echt gekoppelt — `cancelled=sherloqStatus==='CANCELLED'` ·
    `churnRisk=churn_score>=churn_risk_threshold` · `upsell=upsell_score>=upsell_threshold` · `goingCold=heat==='COLD'`.
    Schwellen aus `settings.thresholds` (via `getSettings`), NULL-Score=inaktiv, Honesty-Positiv-Zustand
    („Keine akuten Signale — Kunde stabil"). Quelle = **`calculateFarmerPriority`** (Single Source, Panel + Kachel).
  - **[ENTSCHEIDUNG Churn-Vorrang] (29.06.2026):** Bei aktivem **Churn Risk ODER Gekündigt** wird **Upsell
    unterdrückt** (Retention vor Expansion — man verkauft keinem Kunden mehr, der gerade abwandert). Gilt im
    Panel; Kachel-Ebene nutzt denselben Resolver (`applyFarmerDisplayPrecedence` → `calculateFarmerPriority.displaySignals`).
    Begründung: Geld-Logik-Priorisierung (Gekündigt > Churn > Kalt > Upsell) + moderne CS-Praxis (Gainsight/Catalyst/
    Vitally). Scoring (`signals`/`score`/Top-5) bleibt unberührt — nur die **Anzeige** filtert. Churn/Upsell nie
    gleichzeitig als Handlungsempfehlung.
  - **(c) KontaktZeile-Editierbarkeit ✅ erledigt (8e):** Sidepanel-KontaktZeile bleibt **read-only** (Copy);
    **Bearbeiten in der Vollansicht/Details-Tab**. Der **Stift** ist wieder da als **Deep-Link**: Farmer reicht
    `onEditField` → öffnet Vollansicht + Details-Tab mit Feldfokus (`focusField`/`autoEdit`, 1:1 Hunter). Telefon
    (`contact_phones`) wird via `DetailPhoneList` in der Vollansicht editiert (Favorit/Nummer/Label/Add/Remove),
    nicht inline im Sidepanel.

### [8e] Details-Tab Vollansicht komplett echt + editierbar (29.06.2026) ✅ — letzter Farmer-Panel-Slice
- **Person + Firma echt** aus `getContactDetail` (Single Source, bestehender contactQuery — kein neuer Fetch),
  **editierbar + DB-schreibend**: `saveDetail` → `updateContact`/`updateCompany` über das geteilte `DETAIL_MAP`;
  E-Mail/LinkedIn/Web → `saveContactField` (mit Validierung). **Telefon** via `DetailPhoneList` →
  `setContactPhonePrimary`/`updateContactPhone`/`createContactPhone`/`deleteContactPhone`. Alles reload-persistent.
- **Einheitsgebot:** Optionslisten + `DETAIL_MAP` + Seed-Mapping nach **`src/lib/contactDetailFields.ts`**
  ausgelagert (Single Source) — Hunter **und** Farmer importieren sie; Hunter-Verhalten unverändert (gleiche Werte,
  keine Regression). Keine Dublette.
- **Honesty:** leere DB-Werte → leer/ausgeblendet; **Owner/Tags** (kein DB-Feld) → „Folgt"; Usage [[D49]] „Folgt";
  KI-Kurzakte [[D5]]. **Farmer-Invariante:** Klassifizierung zeigt **Subscription-Status**, nie Lead Status.
- **Damit ist das Farmer-Panel vollständig echt** (Header/KontaktZeile 8a · Tabs+Writes 8b · Signale 8c ·
  Subscription 8d · Details 8e). Kein synthetisiertes/hardcodiertes Profil- oder Firmenfeld mehr im Farmer-Panel.

### [FIX] Details-/KontaktZeile-Edit systemweit (29.06.2026) ✅ — 5 Lücken, geteilte Komponenten
QA fand 5 Edit-Lücken (teils auch Hunter), alle in **geteilten** Komponenten → systemweite Fixes, keine Insel:
- **(A) Dropdown-Schichtung (löst #2 Telefon-Typ, #3 Branche/Größe, #4 Sidepanel≠Vollansicht):** `DropdownMenuContent`/
  `SubContent` lagen auf **z-50** und damit **hinter** der Vollansicht (`createPortal`, z-[120]) → Selects/Typ-Dropdown
  öffneten unsichtbar. **Fix:** Dropdown → **z-[160]** (über Vollansicht 120, unter Toast 200). Wirkt für ALLE Selects
  (Anrede/Sprache/Seniorität/Land/Branche/Größe) + Telefon-Typ, Hunter+Farmer, Sidepanel+Vollansicht. Verdrahtung von
  Branche/Größe war nie kaputt — nur verdeckt.
- **(B) Fehlermeldung (#5):** `DetailField` zeigte bei `validate`-Fehler nur roten Rand, keinen Text. **Fix:** optionaler
  `errorText`-Prop + freundlicher Hinweis unter dem Input (E-Mail-Default „…mit @", URL → „…mit https://"). Geteilt.
- **(C) Farmer-KontaktZeile editierbar (#1) — REVISION der 8a-„read-only"-Entscheidung:** Die KontaktZeile war seit 8a
  bewusst read-only (Edit nur via Stift→Vollansicht). **Neue Entscheidung (29.06.2026):** Farmer-KontaktZeile wird
  editierbar **1:1 wie Hunter** — Telefon inline (Phone-Mutationen), Text (Email/LinkedIn/Web) weiterhin über den
  **Stift-Deep-Link** in die Vollansicht (beide Wege bestehen). **Begründung:** Einheitsgebot + Nutzwert wiegen schwerer
  als die ursprüngliche read-only-Linie. Reload-persistent.
- **(D) Sichtbarer Telefon-Stift:** `DetailPhoneList` bekam einen expliziten Bearbeiten-Stift pro Nummer (statt nur
  unsichtbarem Klick-auf-die-Nummer) → klare Affordance, Hunter+Farmer (geteilt).
- **Einheitsgebot erfüllt:** Jede Edit-Funktion (Text/Select/Telefon inkl. Typ) funktioniert jetzt **identisch** in
  Hunter+Farmer und Sidepanel+Vollansicht. Touch: `ui/dropdown-menu.tsx`, `DetailField.tsx`, `DetailPhoneList.tsx`,
  `FarmerSidepanel.tsx`, `HunterSidepanel.tsx`.

### [FIX] KontaktZeile vollständig inline-editierbar + 2 Telefon-Bugs (30.06.2026) ✅
- **(1) ENTSCHEIDUNG — KontaktZeile alle 4 Felder inline:** E-Mail/LinkedIn/Web werden jetzt **inline in der Zeile**
  editiert (Stift → Input direkt im Feld, Enter/Blur speichert, Escape bricht ab) — **exakt wie Telefon** schon.
  Vorher inkonsistent (Telefon inline, die drei sprangen per Stift in die Vollansicht; rein historisch, weil Telefon
  eine eigene Edit-Komponente hatte). **Begründung:** Konsistenz + moderne-CRM-Standard (Edit am Ort). E-Mail/LinkedIn
  → `updateContact`, Web → `updateCompany`; Validierung + Fehlertext direkt in der KontaktZeile; reload-persistent.
  **Geteilte Komponente** → Hunter **und** Farmer, Sidepanel **und** Vollansicht. **Stift vs. Vollansicht sauber
  getrennt:** der Stift öffnet inline; der Weg in die Vollansicht bleibt über den **Vollansicht-Pfeil im Header**
  (kein doppelter/toter Button).
- **(2) BUG Telefon-Typ schloss neue Nummer:** Beim Anlegen einer neuen Nummer schloss/verwarf das Wählen des Typs
  das Feld (Dropdown-Klick blurte den Input → „leer = verwerfen"). **Fix:** `onMouseDown preventDefault` am Typ-Trigger
  → Typ-Wahl stiehlt dem Input nicht den Fokus, Edit bleibt offen bis aktiv gespeichert/abgebrochen.
- **(3) BUG „Nur Ziffern und +" bei reinen Ziffern:** „9384" wurde abgelehnt — Ursache war die **Mindestlänge 5**
  (nicht das „+", das war nie Pflicht). **Fix:** `isValidPhone` = erlaubte Zeichen + **mind. 3 Ziffern**, „+" optional,
  Format-zeichen toleriert. Meldung freundlich/korrekt („Bitte eine gültige Telefonnummer eingeben (mind. 3 Ziffern).").
  Gültig jetzt z.B. „9384", „+49 221 123 456", „(0221) 12-34"; ungültig: leer/Buchstaben/<3 Ziffern.
- Touch: `validation.ts`, `DetailPhoneList.tsx`, `KontaktZeile.tsx`. Geteilt → systemweit, keine Insel.

- **💰 MRR/ARR Übergangslösung (ENTSCHEIDUNG 29.06.2026)** — Teil des Farmer-DB-Wirings (Owner-/Auth-Bezug [[D21]]):
  - **Slice 1** legt `mrr_monthly` + `arr_yearly` als Felder auf **`companies`** an (nullable). *(Korrigiert die
    bisherige „MRR/ARR bekommen bewusst keine Spalten"-Linie von 029 — die galt nur für Deal-berechnete Werte;
    auf Kunden-/Subscription-Ebene gibt es jetzt echte Felder.)*
  - **Wiring (Slice 3+4):** MRR/ARR **zuerst aus dem gewonnenen Deal abgeleitet** (`dealToView`-Logik,
    `value€ / term_months`) — Übergangslösung, bis der AM bestätigt.
  - **Sobald [[D38]] + „Neue Kunden"-Tab gebaut:** AM **bestätigt den Betrag** → schreibt direkt in
    `companies.mrr_monthly` (`arr_yearly = mrr × 12`).
  - **Später:** **Stripe-Webhook** überschreibt `companies.mrr_monthly` automatisch.
  - **UI-Pflicht (Honesty):** immer anzeigen, **woher** der Wert kommt — „aus Deal" · „bestätigt" · „Stripe"
    (z.B. `companies.mrr_source` text: `deal | confirmed | stripe`).

- **🎯 FARMER ÜBERSICHT TOP-5 (ENTSCHEIDUNG 29.06.2026)** — Übersicht-Tab zeigt **nach** der Customer
  Health Overview einen Top-5-Empfehlungsbereich (analog Hunter „Wichtigste Aufgaben").
  - **Prioritätsreihenfolge (1 = wichtigster):**
    1. **Gekündigt** — `subscription_status='churned'` → `FarmerRetentionKachel` (cancelled)
    2. **Churn Risk** — `churn_score >= 61` → `FarmerRetentionKachel` (churn_risk)
    3. **Kunde wird kalt** — `heat_status='kalt'` → `FollowUpKaltCard`
    4. **Upsell Potenzial** — `upsell_score >= 70` → `FarmerUpsellKachel`
    5. **Fällige Task** — `due_at < now()` → `SequenceLeadCards`
  - **Logik (Honesty):** bis zu 5 anzeigen, **nie leere Slots**; weniger als 5 aktive Signale → weniger
    anzeigen (kein Auffüllen mit Leerem); mehr Kandidaten → die 5 dringendsten gewinnen über Tiebreaker.
  - **Tiebreaker (bei gleichem Signal-Typ, z.B. mehrere Churn-Risk-Kunden):** (1) MRR-Höhe (mehr Umsatz =
    wichtiger) → (2) Score-Höhe (höherer churn/upsell_score) → (3) Zeitdruck (Kündigungsfrist näher /
    Task länger überfällig).
  - **Begründung (Geld-Logik):** verlorenes Geld (Gekündigt) > bedrohtes Geld (Churn) > kühlende
    Beziehung (Kalt) > Wachstumschance (Upsell) > Routine (Task).
  - **Datenrealität:** `heat='kalt'` + `cancelled` sofort verfügbar (echte Felder); `churn_score`/
    `upsell_score` erst nach dem Score-Edge-Functions-Slice → erscheinen dann **automatisch** im Top-5
    (Resolver muss sie **additiv** aufnehmen); fällige Tasks via `getDueTasks` (Farmer-gefiltert).
  - **Umsetzung:** eigener **Farmer-Priorisierungs-Resolver** (Pendant zu `calculatePriorityScore`, rechnet
    über **Kunden** statt Deals), Gewichte aus `settings.thresholds`. Render-Sektion in `ScreenFarming`
    nach `FarmerHealthOverview` (im Übersicht-`<div>`), Kacheln 1:1 wiederverwendet, Score nie als Badge.
  - **Reihenfolge-Empfehlung:** sinnvoll **nach** dem Score-Slice bauen (sonst überwiegend leer); Heat-/
    cancelled-Items könnten als Zwischenschritt schon vorher erscheinen. Verwandt: [[D5]] · Hunter-Top-5.

### [D48] Snooze/Ignorieren bei Signalen — Persistenz (deferred)
- **Heute:** Snooze (`LinkedinSignalCard`-State) + Ignorieren (`ScreenFarming`/`ScreenHunting` `ignoredSignalIds`)
  sind **rein lokaler React-State** — kein Backend, kein Write. Kachel verschwindet/dimmt nur in der Session;
  nach Reload ist alles zurück. Bewusst so (Honesty: kein Fake-Persist).
- **Später:** echte Persistenz — `signals.snoozed_until` / `signals.ignored_at` (+ `processed_at`), Writes via
  `lib/db.ts`, `getSignals`-Filter berücksichtigt sie. Bulk-Snooze/Löschen (Hunter+Farmer) ebenfalls hier.
  Snooze-Regelwerk (max_count/max_days/Eskalation) liegt in CLAUDE.md „Snooze — Regelwerk" + `system_config`.
- **Wann:** mit dem Signals-/Inbox-DB-Wiring (nach AI-SDR/Sending-Layer). Gilt für **Hunter + Farmer** gemeinsam.

### [BUGFIX] Stage-Leak an Top-5 (overdue_task/going_cold) — Subscription-Invariante durchgesetzt (29.06.2026) ✅
- **Symptom:** Sarah Klein zeigte in der **Übersicht Top-5** wieder „STAGE: free_trial" statt Subscription.
- **Ursache:** **zweite Render-Stelle** ohne Subscription-Slot — der Slice-6-Fix (Commit 857bf89) war nur im
  **Follow-ups-Tab** (SequenceLeadCards `renderStatusBadge` + FollowUpKaltCard `statusBadge`). Die identischen
  Karten in der **Top-5** (`overdue_task`-Zweig `SequenceLeadCards`; `going_cold`-Zweig `FollowUpKaltCard`)
  hatten den Slot nie. Sichtbar wurde es erst durch den **Score-Fix**: Sarahs churn 72→0 → `dominantSignal`
  wechselte von `churn_risk` (FarmerRetentionKachel, hat Badge) zu `overdue_task` (SequenceLeadCards, kein Badge)
  → `stageLabel` fiel auf `it.stage` zurück.
- **Fix:** beide Top-5-Karten mit Subscription-Slot versorgt (1:1 wie Follow-ups), Badge direkt aus
  `c.sherloqStatus` (customer in der `.map` verfügbar, kein Lookup). Audit aller Farmer-Render-Stellen: die
  Kachel-Wrapper (`FarmerKundenKachel`/`FarmerRetentionKachel`/`FarmerUpsellKachel`) setzen bereits
  `stageLabel:""` + `statusBadge` — **kein weiterer Leak**. **AUSNAHMSLOS jede Farmer-Karte zeigt jetzt
  Subscription, nie Stage** (CLAUDE.md-Invariante gilt für ALLE Render-Stellen, präzisiert).

### [SCORE-FIX] heat_hot-bei-warm + overdue_tasks-Gewicht + 0-Punkte-Treiber (29.06.2026) ✅
QA der Farmer-Scores ergab zwei systematische Verzerrungen — behoben (Score-Ebene, systemweit):
- **(A) `score-upsell`: `heat_hot` zählte auch bei `heat='warm'`** (Bedingung `"heiss" || "warm"`). Falsch —
  „warm" ist nicht „hot". Trieb Upsell-Scores hoch (Sarah Klein +20 trotz warm). **Fix:** nur noch `=== "heiss"`.
- **(B) `churn_weights.overdue_tasks` = 15 → 0.** „Überfällige offene Tasks" misst die **To-do-Disziplin des
  AM**, nicht die **Kundengesundheit**. Solange die starke Usage-Schicht ([[D49]]: Login-Frequenz, Nutzung
  hoch/runter) als **erweiterte Schicht** (Progressive Data Logic) fehlt, verzerrt dieses eine Basis-Signal
  den Churn überproportional (Sarah: 72 aus diesem EINEN Signal). **Fix:** Gewicht 0 in **Live-`settings`
  (Migration 052, `jsonb_set`)** + edge-fn-Default-Spiegel (`score-churn-risk`).
- **(Cleanup) 0-Punkte-Treiber** werden NICHT mehr in `score_drivers`/`upsell_drivers` geschrieben
  (`if (w.X > 0) drivers.push(...)`, beide Functions, Einheitsgebot) → kein „Überfällige Tasks +0" im Tooltip.
- **Architektur unberührt:** `data_sources[]`, Normalisierung über verfügbare Punkte, alle anderen Gewichte/
  Schwellen. Die starke Usage-Schicht dockt mit [[D49]] automatisch an (nur Gewicht/Bedingung geändert).
- **Verifiziert (Re-Score Demo-Org):** Sarah churn **72→0** / upsell **100→33** (heat_hot weg); Anna 35→24 /
  69→38; Eva 43→0 / 67→0. → 8c: Sarah jetzt Positiv-Zustand „Keine akuten Signale".

### [D49] Usage-Telemetrie (Produkt-Nutzung) (deferred)
- **Status:** deferred, eigenes Vorhaben **nach** dem Farmer-Panel (Richtung echte Kunden / Billing).
- **Was fehlt:** DB-Felder/Tabelle für Produkt-Nutzung (Messages gesendet · Enrichments verbraucht ·
  Last Login · Seats aktiv · Onboarding-Status) + **Tracking-Mechanismus** (woher kommen die Zahlen —
  Produkt schreibt selbst mit / extern via Sherloq-Webhook) + spätere **Churn-Score-Integration**
  (Usage-Einbruch als Frühsignal, vgl. `score_churn_risk` „erweiterter Score").
- **Bis dahin:** `UsageBox` zeigt **„Folgt"** (Honesty, modul-gated `sherloq_signals`) — **keine Fake-Zahlen**.
- **WICHTIG (Einordnung):** Usage ist **optional + gewichtbar**, **kein Blocker**. Die Beziehungs-Daten
  (Kommunikation/letzter Kontakt, Heat, Tasks, Aktivität) tragen die **Kern-Churn-Signale schon HEUTE**
  und sind echt verdrahtet (Slice 4a/4c). Churn/Upsell-Gewichte liegen in `settings`
  (`churn_weights`/`upsell_weights`) → per Einstellung änderbar, kein Code-Eingriff. Usage = Verfeinerung.
- Verwandt: [[D43]] Historisierung (Usage-Snapshots) · `score_churn_risk`/`score_upsell` (additive Felder).

### [FARMER-ABSCHLUSS] 3 Audit-Lücken geschlossen (30.06.2026) ✅ — Farmer abgeschlossen
Der Abschluss-Audit (Screen + Panel + Vollansicht) fand 3 Lücken — alle gefixt:
- **(1) HONESTY — `mockUsage` Fake-Zahlen entfernt:** `messages '1.240'`, `enrichments 8500/10000`, `onboarding
  'Abgeschlossen'`, `profilesAdded.trend '+12%'` + `lastLogin/lastUsage` (= last-CONTACTED, nicht Produkt-Login,
  irreführend) → **raus**. FarmerSidepanel nutzt jetzt `const usage = {}` → `UsageBox` compact rendert null
  (Übersicht-Kompakt ausgeblendet), full zeigt ehrlich **„Folgt — Produkt-Nutzungsdaten werden angebunden."**
  [[D49]]. Konsistent mit dem aufgeklappten Bereich. `UsageBox` full bekam dafür einen `hasAny`-Leerzustand (geteilt).
- **(2) INVARIANTE — Churn-Vorrang im Upsell-Tab:** `upsellRows` (ScreenFarming) filtert jetzt über
  `calculateFarmerPriority(...).displaySignals.includes('upsell')` statt roh `upsellScore≥thr` → bei aktivem
  Churn/Gekündigt wird Upsell unterdrückt (Single Source, **keine duplizierte Vorrang-Logik**). Ein churn-aktiver
  Kunde erscheint NUR im Retention-Tab, nicht zusätzlich im Upsell-Tab. Top-5-Resolver zusätzlich auf die
  settings-Schwellen ausgerichtet (statt Default 61/70) → Top-5 ↔ Tabs konsistent.
- **(3) Kosmetik — Top-5 Retention-Text vereinheitlicht:** hardcodierter Text → `retentionText(sig, c.scoreDrivers)`
  (dieselbe Funktion wie der Retention-Tab).
- **Damit ist der Farmer vollständig echt/ehrlich/konsistent abgeschlossen** (Screen 6 Tabs + aufgeklappt · Panel
  7 Tabs + Header/Footer/ActionDrawer · Vollansicht/Details). Verbleibend nur bewusst deferred: [[D5]] KI · [[D49]]
  Usage · [[D29]] Mail · [[D48]] Snooze · [[D50]] Deals · [[D38]] Lifecycle.

### [BUGFIX] CommunicationChain-Linie bei 1 Eintrag (30.06.2026) ✅
- **Bug (Hunter + Farmer, geteilte Komponente `shared/CommunicationChain`):** Die durchgehende grüne/graue
  Verbindungslinie (eine absolute Linie mit festen Insets `left/right-[75px]`, Fortschritt per `width: progress%`)
  ragte bei **genau 1 Eintrag** nach rechts ins Leere (Punkt sitzt links, Linie spannt aber den ganzen Mittelbereich).
- **Fix:** Linie nur noch bei `chain.length > 1` rendern → 1 Eintrag = keine Linie; ≥2 = Linie erste→letzte (unverändert).
  Token-only, geteilt → wirkt Hunter + Farmer zugleich.

### [FARMER-EXPANDED] Aufgeklappter Kachelbereich echt (30.06.2026) ✅
`FarmerExpandedCardContent` war komplett Mock (kein Query) — jetzt Lazy-Query-getrieben, 1:1 wie Hunters `ExpandedCardContent`:
- **Kommunikationskette echt:** `getContactCommunications(org, customer.id)` → `communicationToView` → `CommunicationChain
  items=…` (Lazy `useQuery` IN der Komponente, nicht im `.map` → audit-safe; `placeholderData`). Vorher: **erfundener
  `personId`-Mock-Strang** — entfernt. Leer → „Noch keine Kommunikation protokolliert." Query-Key `contactCommunications`
  = **derselbe Cache wie der Sidepanel-Kommunikation-Tab** (Konsistenz, kein Doppel-Fetch).
- **Subscription (compact) echt:** aus `customer` (`mrrMonthly`→€, `plan` [ehrlich nach Wurzelfix], `sherloqStatus`) —
  **Single Source mit Panel-8d, kein neuer Fetch**. `nextPayment`/`NRR` = „Folgt" (kein DB-Feld). Vorher hardcodiert
  „2.000 €"/„01.07.2026" — raus. **Subscription nie Stage** (über `sherloqStatus`).
- **Usage (compact):** „Folgt" [[D49]] — leeres Objekt → `UsageBox` rendert null (Fake 8500/10000 + „Onboarding
  abgeschlossen" raus).
- **KI-Kurzakte:** `KiKurzaktePlaceholder` [[D5]]. **Deals:** weiterhin [[D50]].
- **Konsistenz bestätigt:** aufgeklappter Bereich zeigt für denselben Kunden dieselben Subscription-/Kommunikations-Daten
  wie das Sidepanel (gleiche Quellen: `customer`/`companies` bzw. `getContactCommunications`). Kein erfundener Wert mehr.

### [HONESTY-WURZELFIX] „Growth"-Default in customerRowToView entfernt (30.06.2026) ✅
- **Problem:** `customerRowToView` defaultete `subscriptionPlan` auf **„Growth"**, wenn `companies.subscription_plan`
  NULL ist (`… ?? "Growth"`) → bei Demo-Daten (alle NULL) zeigte **jeder** Kunde fälschlich „Growth". Inkonsistent
  mit Panel-8d (liest `companies.subscription_plan` direkt → NULL ⇒ ausgeblendet).
- **Fix:** Default entfernt — NULL/unbekannt → **undefined** (Honesty); `Customer.subscriptionPlan` jetzt **optional**.
- **Anzeige-Stellen geprüft (alle ehrlich):**
  - `FarmerExpandedCardContent` → `SubscriptionBox` blendet Plan bei undefined aus. ✅
  - `CustomerDrawer` (legacy) → Fallback **„—"** statt leer/undefined. ✅
  - Farmer-Kacheln (`FarmerKundenKachel`/`Retention`/`Upsell`) zeigen **`sherloqStatus`-Badge, nicht den Plan** → kein Leak. ✅
  - Panel-8d liest `companies.subscription_plan` direkt → war schon ehrlich. ✅
  - `data.ts` (Mock-Seed) + Plan-Wechsel-Handler (`ReferenceScreens`/`db.changePlan`) setzen echte Werte → unberührt.
- **Konsistenz:** Nirgends mehr erfundenes „Growth"; NULL-Plan überall ausgeblendet/„—", identisch zum Panel.
- **Voraussetzung für** den ehrlichen aufgeklappten Bereich (nächster Slice): Subscription kann nun direkt aus
  `customer` gebaut werden, ohne Fake-Plan.

### [DEFERRED] Pipeline-Stage-Management-UI (Settings-Screen)
- **Status:** deferred, kommt mit dem **Settings-Block**.
- **Inhalt:** User kann die **aktiven** Pipeline-Stufen verwalten — hinzufügen / entfernen / umbenennen / sortieren (schreibt `settings.pipeline_stages`: name/order/stagnation_days/probability, alles bereits [D51]-konform C).
- **GESCHÜTZT:** **Gewonnen/Verloren** sind System-Anker (Enum, siehe `_shared/terminalStages.ts` + `DealStage`-Typ) — **nicht löschbar/umbenennbar** in der UI (nur ihr Anzeige-Name evtl., aber der Slug bleibt). Das Management betrifft nur die aktiven Stufen dazwischen.
- **Bezug:** schließt an Hunter-Konfig-Fix Slice 2 an (Terminal-Slugs = geschützt, aktive Stufen = konfigurierbar).
- **Diagnose 30.06.2026 — Daten-/Logik-Ebene bereits dynamisch vorbereitet:** Hunter liest `pipeline_stages` ÜBERALL dynamisch (Kanban-Spalten, Stage-Dropdowns, Pfeil-Nav weiter/zurück via `order`, Funnel, Pipeline-Wert, Stagnation, Stage-Name) — **keine feste Stufenzahl, keine Index-Annahme (`stages[2]`), kein `Record<DealStage>`, kein exhaustiver `switch(stage)`**. Neue/entfernte aktive Stufe läuft durch. **Beim Bau des Editier-UIs erforderlich (sonst Stolperstellen):**
  - **`DealStage`-Typ-Union (`types/hunter.ts`) lockern** (offener Typ/`string`) — sonst sind neue Slugs nicht typisiert (Runtime läuft als String durch, aber Typ-Schuld).
  - **Pflichtfelder für neue Stufen erzwingen: `stagnation_days` + `probability`** — sonst NaN im weighted Pipeline-Wert bzw. stiller `?? 7`-Default bei Stagnation.
  - **Won/Lost (`gewonnen`/`verloren`) als System-Anker schützen** — in der UI nicht löschbar/umbenennbar (Slug bleibt; ggf. nur Anzeige-Name).
  - **`dealStageColors` (`theme.ts`) aufräumen:** derzeit **tot (ungenutzt)** + **stale** (`onboarding_trial` vs. Seed `onboarding_offen`, kein `free_trial`). Bei Wiederbelebung für Stage-Farben: Token-/Fallback für unbekannte Slugs nötig.
  - **Hinweis:** Kanban-Board-Deals noch **Mock** (ScreenHunting) — „neue Stufe mit echten Deals im Board" erst nach Kanban-DB-Wiring real getestet.

### [D50] Farmer Deals-Tab + Deal-Anlegen (deferred)
- **Status:** deferred, eigenes Vorhaben **nach** Farmer-Panel-Abschluss.
- **Bedarf:** Ein Bestandskunde (Farmer) kann mehrere Deals haben (Upsell/Erweiterung/Verlängerung). Farmer braucht daher:
  - **(a)** einen **Deals-Tab** im Panel (+ ggf. Vollansicht), der die Deals des Kontakts zeigt — `getDealsByContact`
    existiert bereits.
  - **(b)** einen Action-Button **„Deal anlegen"** (`createDeal`) — analog zu Task/Notiz-Anlegen (8b-write).
- **Einheitsgebot:** prüfen wie **Hunter** Deals handhabt (Hunter hat bereits einen Deals-Tab); Deals-Tab/Deal-Anlegen
  wenn möglich als **geteilte Komponente** (Hunter + Farmer), keine Farmer-Insel.
- **Architektur-Bezug:** hängt mit [[D38]] (Won-Deal → Kunde-Lifecycle) und der MRR-Logik zusammen (MRR aus Won-Deal
  abgeleitet, `mrr_source`). **Ein neuer gewonnener Deal bei einem Bestandskunden soll MRR/Subscription beeinflussen**
  — beim Bau mitdenken.
- **Standard-Anforderungen** (wie alle Edit-Slices): reload-persistent, echter DB-Write, kein toter Button/Attrappe.

### [D51] Konfigurierbarkeit-als-Architektur — „Logik-als-Daten"-Gebot (Prinzip festgeschrieben 30.06.2026)
- **Hartes Architektur-Prinzip, gleichrangig zur Honesty-Regel** (Volltext in CLAUDE.md, eigener `##`-Abschnitt):
  Jeder verhaltenssteuernde Wert **und jede Regel** (Schwellen/Gewichte/Zeitfenster/Cutoffs/Prioritäten/Vorrang-Regeln/
  Mail-/AI-Vorlagen/Prompts/Gating) liegt in der DB (`settings`/Pro-Entität-Tabelle), pro Org, laufzeit-gelesen,
  damit über AI-Chat [[D5]] änderbar. Begriff weit gefasst: auch „interne" Rechenparameter (Tages-Cutoffs) + feste
  `if`-Regeln (Vorrang-Logik). Code-Literal für Verhalten = Architektur-Verstoß. Code-Defaults nur als Fallback,
  müssen DB-Seed spiegeln **und** bei Lese-Fehler LAUT scheitern (nie stummer Default-Degrade).
- **Kategorien:** A (Code-Literal, Verstoß) · B (constants.ts, build-time, Verstoß sobald verhaltenssteuernd) ·
  C (DB, laufzeit, pro Org, chat-änderbar = Ziel).
- **Admin-Schicht (deferred, NICHT jetzt):** WER ändern darf → später über Rollen-/Rechte-System; dieses Prinzip ist die Voraussetzung.

### [KONFIG-AUDIT] Konfigurierbarkeits-Audit als wiederkehrendes Modul-Abschluss-Gate (deferred)
- **Status:** wiederkehrendes Gate — am **Ende jedes Moduls** durchführen (analog zum Farmer-Abschluss-Audit), bevor das Modul „fertig" ist.
- **Inhalt:** Tabelle pro Modul — *Regel | Speicherort | A/B/C | laufzeit-gelesen?* — jeder verhaltenssteuernde Wert/jede Regel muss **C** sein; **kein A**, **kein stummer B-Degrade** ([[D51]]).
- **Ist-Stand Farmer (Diagnose 30.06.2026 → Konfig-Fix 30.06.2026):** C ✅ = churn/upsell-Schwellen (61/70), Score-Gewichte, Heat-Grenzen.
  **A-Verstöße geschlossen:** Tages-Cutoffs → `settings.thresholds.timing_windows` (Migr. 054, Edge-Fns lesen frisch, `if sErr throw`);
  Churn-Vorrang → Schalter `settings.thresholds.churn_suppresses_upsell` (Default true; **Regel-Logik bleibt im Code**, nur der Schalter aus settings).
  **B-Degrade geschlossen:** Frontend rechnet nicht mehr stumm mit 61/70 — `ReferenceScreens` Drei-Zustands-Gate (Laden / Fehler-sichtbar / Erfolg), `FarmerSidepanel` rechnet Signale nur bei geladenen settings (`settingsLoaded`). **AI-SDR-Gating:** existiert noch nicht (keine Kategorie). → **Farmer jetzt vollständig Kategorie C** (außer noch-nicht-gebaute Features).
- **Später:** Tooling/Audit-Wächter (`scripts/audit.ts`) + Pre-Push-Kopplung, sobald das Muster pro Modul steht.
- **Ist-Stand Hunter (Diagnose 30.06.2026 → Slice 1 gefixt):** C ✅ = Heat-Grenzen (`heat_status`), Stagnationsschwellen pro Stage (`pipeline_stages[].stagnation_days`), Hunter-Priority-Gewichte (`hunter_priority_weights`, 045). **Slice 1 geschlossen:** stummer Fallback (priority-Gewichte/Stagnation `?? default` bei `getSettings()===null`) → ReferenceScreens Drei-Zustands-Gate (eine `settingsQuery`, alles daraus abgeleitet); „Neu in Pipeline"-Fenster (7/30) → `settings.thresholds.timing_windows.new_pipeline_short_days/_long_days` (Migr. 055). **Slice 2 ✅ aufgelöst (Variante 1, 30.06.2026):** Terminal-Stage-Slugs („gewonnen"/„verloren") sind **KEIN A-Verstoß**, sondern ein **System-Enum** (struktureller Bezeichner: Teil `DealStage`-Typ + Write-Pfad `updateDealWon/Lost`; Won/Lost wird NUR am Slug erkannt, nie an `probability`). Org-Anpassung betrifft nur die **aktiven** Stufen (Name/Reihenfolge/Anzahl in `settings.pipeline_stages` = C). Statt Config: die zwei duplizierten Edge-Literale → **eine geteilte Quelle** `supabase/functions/_shared/terminalStages.ts` (DRY, spiegelt hunterMappers); kein `type`-Flag, kein Write-/Typ-Eingriff. **Deferred (nicht Verstoß / noch nicht gebaut):** ICP-Berechnung (Spalte nie befüllt — wird später selbst gebaut), `icp_score_threshold:65` BEHALTEN (Vorab-Einstellung, Konsument folgt), ICP-Bänder vereinheitlichen (Donut 75/50 + priority 80/60 → ein Satz), Signal→Aktion-Resolver-Konfig, Signal-Routing-Regel (`routed_to`), Deal-Health-Kompositum, AI-SDR-Gating.

### [HUNTER-KONFIG-FIX Slice 2] Terminal-Stages — DRY statt Config (Variante 1, 30.06.2026) ✅
- **Entscheidung:** Won/Lost-Slugs (`gewonnen`/`verloren`) sind **System-Anker (Enum)**, KEIN [D51]-Config-Wert — struktureller Bezeichner (Teil `DealStage`-Typ + Write-Pfad). Won/Lost wird ausschließlich am Slug erkannt (nie an `probability`). Org-Anpassung = nur die **aktiven** Stufen (Name/Reihenfolge/Anzahl, `settings.pipeline_stages` = C).
- **Gebaut:** geteiltes Edge-Modul `supabase/functions/_shared/terminalStages.ts` (`WON_SLUG`/`LOST_SLUG`/`TERMINAL_STAGE_SLUGS`/`isTerminalStageSlug`) — `score-deal-health` + `score-upsell` importieren daraus statt eigener Literale (ein Literal statt zwei Kopien). **Kein** Migration/`type`-Flag/Write-/Typ-Eingriff. **Frontend unberührt** (hunterMappers ist schon die eine Quelle; Kommentar-Querverweis im Shared-Modul). Verhalten 100% identisch (Slugs unverändert).
- **Edge Fns nach diesem Slice neu deployen** (geänderter Import) — Scores bleiben identisch (Re-Score zur Bestätigung). 1:1-Spiegel-Regel: ändert sich der Enum, müssen hunterMappers + _shared gleich gehalten werden.

### [HUNTER-KONFIG-FIX Slice 1] stummer Fallback + Neu-in-Pipeline-Fenster → C (30.06.2026) ✅
- **(A) stummer Fallback → echtes C (#1 Stagnation + #4 Priority-Gewichte):** `HunterReference` rechnete bei `getSettings()===null` stumm mit Code-Defaults (`?? undefined`→`PRIORITY_WEIGHTS_DEFAULT`, `?? 7` Stagnation). **Fix:** EINE `settingsQuery` (getSettings, Key `['settings',org]` — geteilter Cache mit Farmer) + **Drei-Zustands-Gate** (Laden→Lade-UI · `data===null`→sichtbarer Fehler · Erfolg→Org-Werte). `pipeline_stages`/`hunter_priority_weights`/`timing_windows` werden aus der EINEN geladenen Zeile abgeleitet; die separaten `getPipelineSettings`/`getHunterPriorityWeights`-Queries entfernt (waren nur getSettings-Sub-Reads → kein stiller Degrade mehr). Happy-Path unverändert.
- **(B) „Neu in Pipeline"-Fenster A→C (#7):** Literal `7 : 30` in `newPipelineInPeriod` → Param `windows` aus `settings.thresholds.timing_windows.{new_pipeline_short_days,new_pipeline_long_days}` (Migr. 055, idempotent jsonb_set-Merge in den 054-`timing_windows`-Key). Literale 7/30 nur Per-Key-Fallback. *Caveat:* die UI-Labels „7d"/„30d" bleiben fest (i18n-String, separat) — nur die Tage-Fenster dahinter sind konfigurierbar.
- **Migrationen 054→055** noch **nicht gepusht** (db push am Sessionstart/Freigabe). Touch: `ReferenceScreens.tsx`, `ScreenHunting.tsx`, `hunterMappers.ts`, Migr. 055.
- **Deferred (kosmetisch, gebündelt mit ICP-Bänder-Vereinheitlichung):** dynamische Zeitfenster-**Labels** „7d"/„30d" — die Tage-Fenster sind jetzt konfigurierbar (settings), die **Labels** noch fest (i18n-String). Wenn eine Org das Fenster ändert (z.B. 10 Tage), zeigt das Label weiter „7d". Zusammen mit der ICP-Bänder-Frage (Donut 75/50 + priority 80/60 → ein Satz) angehen.
- **FarmerReference-Angleich ✅ NICHT NÖTIG (Diagnose 30.06.2026):** FarmerReference nutzt bereits EINE `settingsQuery` (`queryKey ["settings", org]` = geteilter Cache mit Hunter) + Drei-Zustands-Guard; alle Farmer-Settings aus der einen Zeile, keine Mehrfach-`getSettings`-Sub-Reads. Grund: das Muster entstand **zuerst** im Farmer-FIX-2-Slice, Hunter Slice 1 hat es gespiegelt. Beide Referenzen gleichwertig — Einheitsgebot erfüllt, **kein Code-Eingriff**.

### [KONFIG-FIX] Farmer A/B-Lücken → C geschlossen (30.06.2026) ✅
- **(1) Tages-Cutoffs A→C:** `LAST_CONTACT_DAYS=30`/`INACTIVE_DAYS=14` (score-churn-risk) + `RECENT_CONTACT_DAYS=7` (score-upsell) → `settings.thresholds.timing_windows`, frisch gelesen (`if sErr throw`), Literal nur als Per-Key-Fallback. **Migration 054** (idempotent `||`-Merge) — *noch nicht gepusht*.
- **(2) Stummer Frontend-Fallback B→C:** `getSettings()` schluckt Fehler zu null → `ReferenceScreens` jetzt Drei-Zustands-Gate (Laden/Fehler sichtbar/Erfolg); `FarmerSidepanel` berechnet `farmerPriority` nur bei `settingsLoaded`. Org-Werte gewinnen immer; Default nie heimlich.
- **(3) Churn-Vorrang A→C:** `applyFarmerDisplayPrecedence(active, churnSuppressesUpsell=true)` — ein Schalter aus `settings.thresholds.churn_suppresses_upsell`, über `calculateFarmerPriority` (Single Source) an Panel/Top-5/Upsell-Tab durchgereicht. Regel-Logik unverändert im Code.
- **Neue settings.thresholds-Keys (Seed 054):** `timing_windows` (last_contact_days/inactive_days/recent_contact_days) · `churn_suppresses_upsell`.

### [CLEANUP] `score_drivers` → `churn_drivers` umbenennen (Symmetrie mit `upsell_drivers`)
- Heute: `contacts.score_drivers` (+ `data_sources`) = **Churn**-Treiber (048/score-churn-risk) ·
  `contacts.upsell_drivers` = **Upsell**-Treiber (050/score-upsell). Namen asymmetrisch.
- Sauberer: `score_drivers` → `churn_drivers` (analog `upsell_drivers`). **Breaking-Change**: Migration
  (rename) + `score-churn-risk` Edge Function + `Customer.scoreDrivers`→`churnDrivers` + Retention-Banner.
- **Wann:** später bündeln (kein dringender Nutzen; bewusst aufgeschoben, 2026-06-29).

### [TS] Deal-Typ ohne `product` — offener Faden
- `src/types/hunter.ts` `Deal` hat **kein `product`** (Migration 014 fügte nur die DB-Spalte).
  Beim späteren Produkt-Anzeigen (Pipeline/Deal-Detail) `product?: string` im Typ ergänzen + mappen.

### [D52] Kunden-eigene externe Signale — „Bring Your Own Signal" (v2, deferred)
- Kunden speisen später eigene externe Signale aus IHREN Systemen ein: (1) dynamischer Quell-Name
  (kein hardcodiertes „Sherloq") + (2) Webhook-Ingestion + **kundendefiniertes Mapping-Layer**
  (Feld X → Signal S ab Wert Y) + custom rules. Buildbar, aber eigenes Feature — gehört in den
  Baukasten-/Integrations-Slice, **NICHT SET-4a**. Grundsatz schon jetzt: externe-Signal-Definitionen
  als Datenliste halten. **Single Source (Volltext): `docs/integrations_masterplan.md` §5.** Verwandt: [[D23]].

> Anker-Tags `[D1]`–`[D47]` sind im Code referenzierbar (z.B. `hunterMappers.ts` → `[[leads-tab-read]]`).
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

> ✅ **ERLEDIGT (2026-06-23) — Keine-Task-Logik kontakt-basiert:** eine Kachel **pro Kontakt**
> (mit ≥1 aktivem, nicht-terminalem Deal + ohne offene Task) statt pro Deal; die Kachel zeigt alle
> Deals des Kontakts. `contactToNoTaskCard` (hunterMappers) + Gruppierung in ScreenHunting +
> `PipelineKeineTaskCard` (Deals-Zeile). Auf `main` (`219fa3b`).

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
