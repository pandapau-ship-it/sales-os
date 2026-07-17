# Knowledge Base (Seed)

> Die Tabelle `knowledge_base` existiert noch nicht (DB-Wiring = Phase 5).
> Bis dahin werden die Einträge hier gesammelt und beim ersten DB-Wiring importiert.
> Schema: `feature` · `what` · `how` · `value` · `module` (+ `organization_id`, `created_at`).
> Quelle/Regel: CLAUDE.md → „KNOWLEDGE BASE — nach jedem fertigen Screen/Feature (Pflicht)".
>
> **`value` = Kundennutzen / Pitch** — immer aus Kundensicht (Zeit gespart, mehr Pipeline/Umsatz,
> weniger Churn, schnellere Ramp-Up), **nie technisch**. Diese Felder speisen später AI-Chat,
> Onboarding, Help-Center und Sales-Material. Interne/Architektur-Einträge (`module: core`,
> für Kunden unsichtbar) als _„intern"_ kennzeichnen — sie werden nicht an Kunden ausgespielt.

---

## 2026-06-14

### HunterSidepanel (Info Panel 820px)
- **feature:** Hunter Info Panel (820px)
- **what:** Vollständige Kontakt-/Deal-Detailansicht als Slide-in-Panel (820px) mit Tabs
  (Übersicht · Kommunikation · Aktivität · Tasks · Notizen). Öffnet über den grünen Pfeil jeder Kachel.
- **how:** Grüner Pfeil auf einer Lead-/Signal-Kachel klicken → Panel fährt rechts ein, schließt nur per X.
  Übersicht zeigt KI-Kurzakte, aktive Signale, Deal-Setup, offene Tasks, Sequence-Chain, Kommunikations-Preview.
- **value:** Der gesamte Kontakt-Kontext (Kurzakte, Deal, Signale, Tasks, Kommunikation) auf einen Klick —
  kein Tab-Wirrwarr, kein Suchen. Reps reagieren schneller und souveräner → mehr gewonnene Deals.
- **module:** hunter

### ActionPanel (50vw + Composer)
- **feature:** Action-Panel-Shell (`panels/ActionPanel`)
- **what:** Wiederverwendbare Side-Panel-Shell (Sheet „drawer", 50vw) für einspaltige Aktions-Flows
  (Stagniert · Signal · Kalt · Kein Task · SDR Lead anlegen). Nur Struktur — Inhalt kommt als children.
- **how:** Feature-Komponenten (z.B. `AddSdrLeadPanel`, `ChatActionPanel`) setzen Header + Body + Footer/Composer
  aus `panel-blocks/` zusammen und rendern sie in der Shell.
- **value:** Jede Aktion passiert direkt am Kontakt — ohne Seitenwechsel. Weniger Klicks, kein
  Kontextverlust, mehr erledigte Schritte pro Tag. _(Shell intern; Kundennutzen = Inline-Handeln.)_
- **module:** hunter

### AddSdrLeadPanel (Progressive Disclosure)
- **feature:** SDR Lead anlegen (Action-Side-Panel)
- **what:** Lead-Anlage als 50vw-Side-Panel mit Progressive Disclosure: Stufe 1 Pflicht
  (Owner · Vorname · Nachname · E-Mail ODER LinkedIn · Firma), Stufe 2 aufklappbar (Anrede · Rolle ·
  Telefon · Quelle · Pipeline-Stage · Notizen), Stufe 3 optionaler Deal (Wert · Owner · ARR/MRR · Abschluss).
- **how:** „+ SDR Lead hinzufügen" öffnet das Panel. Pflichtfelder oben, Rest hinter „Weitere Details",
  Deal hinter „+ Deal hinzufügen". Pipeline-Stage und Deal sind gekoppelt (Hinweis-Banner). Speichern → Toast.
- **value:** Leads in Sekunden erfasst statt Formular-Frust — und trotzdem saubere Daten, auf denen
  Automatisierung, Lead-Routing und Reporting verlässlich laufen. Weniger Pflege, mehr aktive Pipeline.
- **module:** hunter

### HeatBadge + StageBadge
- **feature:** Zentrale Status-Badges (`panel-blocks/HeatBadge`, `StageBadge`)
- **what:** Zwei zentrale Badge-Komponenten. HeatBadge rendert den Heat-Status aus `HEAT_STATUS`
  (Engaged/Warm/Cooling/Cold/Gone) als randloses Pill (Hintergrund 10% Opacity, Dot 8px, gleichfarbiger Text).
  StageBadge rendert die Pipeline-Stage als randloses graues Pill.
- **how:** Überall wo Heat/Stage erscheint: `<HeatBadge status={lead.heatStatus} />` bzw.
  `<StageBadge stage={...} />`. Ein `npm run audit`-Check verhindert hardcodierte alte Heat-Labels.
- **value:** Auf einen Blick sehen, welcher Kontakt heiß ist und wo ein Deal steht — Priorisierung in
  Sekunden statt Bauchgefühl. Kein Lead fällt durchs Raster, der Rep arbeitet immer am Wichtigsten zuerst.
- **module:** hunter

### Komponenten-Struktur (panels/ panel-blocks/ features/)
- **feature:** Komponenten-Ordnerstruktur
- **what:** Verbindliche Struktur: `panels/` (Shells, nur Struktur) · `panel-blocks/`
  (wiederverwendbare Inhalts-Blöcke) · `features/[modul]/` (modul-spezifische Kompositionen).
- **how:** Jede neue Komponente landet sofort in der richtigen Schublade (CLAUDE.md-Pflichtregel).
  Panels komponieren aus panel-blocks; keine Inhalts-Logik in der Shell.
- **value:** _(intern/Architektur — nicht kundenfähig)_ Schnellere, konsistente Weiterentwicklung →
  neue Funktionen erreichen Kunden früher und mit weniger Bugs.
- **module:** core

---

## 2026-06-14 — SQL (beim DB-Wiring einspielen)

```sql
-- knowledge_base { feature, what, how, value, module }
-- INSERT INTO knowledge_base (organization_id, feature, what, how, value, module) VALUES

-- Erledigt-Aktion (Action-Panels)
-- (:org, 'Erledigt-Aktion',
--  'In jedem Action-Panel kannst du ein Signal als „bereits erledigt" markieren und festhalten, was du gemacht hast (Email/LinkedIn/Telefonat/Meeting/Anderes) + Notiz.',
--  'Im Action-Panel bei der AI-Empfehlung auf „Bereits erledigt" klicken, Kanal wählen, optional Notiz tippen, bestätigen — Panel schließt, Eintrag landet in der Kurzakte.',
--  'Erledigtes außerhalb des Tools fließt trotzdem in Kurzakte, Heat und Tagesfortschritt — kein Kontakt geht verloren, der Verlauf bleibt vollständig.',
--  'hunter'),

-- Navigations-Stil-Quelle (intern)
-- (:org, 'Navigation (zentrale Stil-Quelle)',
--  'Top-Nav, Sub-Navs und Sidebar teilen EINE Stilquelle (lib/navBehavior.ts → NAV).',
--  'Entwickler ändern NAV an einer Stelle, alle Nav-Leisten passen sich automatisch an.',
--  '(intern/Architektur — nicht kundenfähig) Konsistente, schnell anpassbare Navigation; weniger UI-Drift.',
--  'core');
```

---

## 2026-06-15

### Kontakt-Vollansicht (Vollbild-Profil)
- **feature:** Kontakt-Vollansicht
- **what:** Vollbild-Profilseite zu einem Kontakt — derselbe Inhalt wie das 820px-Info-Panel,
  aber als ganze, scrollbare Seite mit Tabs (Details · Übersicht · Kommunikation · Aktivität · Tasks · Notizen).
- **how:** Im Info-Panel oben rechts auf den ↗-Pfeil klicken → die Vollansicht öffnet sich.
  ← bringt zurück ins Panel, ✕ schließt ganz. Die ganze Seite scrollt wie eine normale Website.
- **value:** Der komplette Kontakt-Kontext auf einer ruhigen, übersichtlichen Seite — ideal für
  Vorbereitung und Pflege. Mehr Platz, weniger Gedränge: der Rep findet alles schneller und arbeitet fokussierter.
- **module:** hunter

### Kontakt-Details (Read-Mode + Inline-Edit)
- **feature:** Kontakt-Details-Tab
- **what:** Alle Stamm-, Firmen- und CRM-Felder eines Kontakts auf einen Blick (Person · Firma ·
  Klassifizierung · Notizen · System). Befüllte Werte stehen sauber lesbar da; System-Status
  (Heat, Status, E-Mail verifiziert) erscheint als Badge.
- **how:** Werte direkt anklicken und im Feld ändern (kein Extra-Fenster), leere Felder per
  „+ Hinzufügen" füllen. Bei E-Mail/Telefon/LinkedIn/Web ein Klick aufs Copy-Icon kopiert den Wert.
  Mehrere Telefonnummern mit Favorit-Stern, Hinzufügen und Löschen.
- **value:** Kontaktdaten pflegen wie in einem modernen CRM (Attio/Clay) — schnell, ohne Formular-Frust,
  alles inline. Saubere Daten sind die Basis für verlässliche Automatisierung, Personalisierung und Reporting.
- **module:** hunter

### Profil-Bausteine (intern)
- **feature:** Detail-Bausteine (`DetailField` · `DetailSection` · `StatusBadge` · `DetailPhoneList`)
- **what:** Wiederverwendbare panel-blocks für Profil-Ansichten (Read-Mode-Feld mit Inline-Edit/Copy,
  Sektions-Karte, Status-Badge, Telefon-Liste).
- **how:** Entwickler komponieren Detail-/Profilseiten aus diesen Blöcken statt Felder pro Seite neu zu bauen.
- **value:** _(intern/Architektur — nicht kundenfähig)_ Konsistente, schnell baubare Detailansichten →
  neue Felder/Objekte (Companies, Deals) erreichen Kunden früher und einheitlich.
- **module:** core

---

## 2026-06-15 — SQL (beim DB-Wiring einspielen)

```sql
-- knowledge_base { feature, what, how, value, module }
-- INSERT INTO knowledge_base (organization_id, feature, what, how, value, module) VALUES

-- (:org, 'Kontakt-Vollansicht',
--  'Vollbild-Profilseite zu einem Kontakt mit Tabs (Details/Übersicht/Kommunikation/Aktivität/Tasks/Notizen) — gleicher Inhalt wie das Info-Panel, als ganze scrollbare Seite.',
--  'Im Info-Panel oben rechts auf den ↗-Pfeil klicken; ← zurück ins Panel, ✕ schließt. Die ganze Seite scrollt wie eine normale Website.',
--  'Kompletter Kontakt-Kontext auf einer ruhigen, übersichtlichen Seite — mehr Platz, schneller alles im Blick, fokussierteres Arbeiten.',
--  'hunter'),

-- (:org, 'Kontakt-Details (Inline-Edit)',
--  'Alle Stamm-/Firmen-/CRM-Felder auf einen Blick; befüllte Werte lesbar, System-Status (Heat/Status/verifiziert) als Badge.',
--  'Wert anklicken und direkt im Feld ändern (kein Extra-Fenster), leere Felder per „+ Hinzufügen"; Copy-Icon bei E-Mail/Telefon/LinkedIn/Web; mehrere Telefonnummern mit Favorit-Stern.',
--  'Kontaktpflege wie in einem modernen CRM — schnell, inline, ohne Formular-Frust. Saubere Daten als Basis für Automatisierung, Personalisierung und Reporting.',
--  'hunter'),

-- Profil-Bausteine (intern)
-- (:org, 'Detail-Bausteine (panel-blocks)',
--  'Wiederverwendbare Blöcke für Profilansichten: DetailField (Read-Mode + Inline-Edit + Copy), DetailSection, StatusBadge, DetailPhoneList.',
--  'Entwickler komponieren Detailseiten aus diesen Blöcken statt Felder pro Seite neu zu bauen.',
--  '(intern/Architektur — nicht kundenfähig) Konsistente, schnell baubare Detailansichten; neue Objekte (Companies/Deals) einheitlich und früher verfügbar.',
--  'core');
```

---

## 2026-06-16 — SQL (beim DB-Wiring einspielen)

```sql
-- panel-block-Library + Struktur (intern)
-- (:org, 'Komponenten-Library (panel-blocks)',
--  'Alle Inhalts-Blöcke der Panels/Vollansicht sind wiederverwendbare panel-blocks (Barrel-Import); HunterSidepanel/ChatActionPanel komponieren nur noch daraus. Struktur per npm run structure-check + Pre-Push-Hook erzwungen.',
--  'Entwickler bauen neue Ansichten aus bestehenden Blöcken statt Inline-Code; falsch platzierte shared/-Komponenten werden vor dem Push geblockt.',
--  '(intern/Architektur — nicht kundenfähig) Weniger Duplikate, konsistente UI, schnellere Weiterentwicklung — Features erreichen Kunden früher und mit weniger Bugs.',
--  'core');
```


---

## 2026-06-16 (Teil 2) — SQL (beim DB-Wiring einspielen)

```sql
-- Kommunikations-Zeitstrahl (Kontakt Info-Panel)
-- (:org, 'Kommunikations-Verlauf',
--  'Vertikaler Zeitstrahl aller Touchpoints (Mail, LinkedIn, Anruf, Meeting, Notiz) — direkt aufgeklappt, jede Station in der Optik ihres Mediums.',
--  'Im Kontakt-Panel den Tab „Kommunikation" öffnen; jede Nachricht ist mit Richtung, Sentiment und Volltext sichtbar.',
--  'Der Vertriebler sieht die gesamte Beziehung auf einen Blick und spart das Zusammensuchen aus Mail/LinkedIn — schnellere, fundiertere nächste Schritte.',
--  'hunter');

-- Aktivitäts-Verlauf (Kontakt Info-Panel)
-- (:org, 'Aktivitäts-Verlauf',
--  'System-Feed aller Aktionen am Datensatz: Deal angelegt (mit Betrag/Stage), Stage-Wechsel, Task an/erledigt, Heat-Wechsel, in Sequenz aufgenommen, Kontakt angelegt — je mit Akteur und Datum.',
--  'Tab „Aktivität" im Kontakt-Panel.',
--  'Lückenlose Nachvollziehbarkeit, wer wann was getan hat — Vertrauen, Audit und schnelleres Onboarding neuer Team-Mitglieder auf einen Account.',
--  'hunter');

-- Tasks im Kontakt-Panel
-- (:org, 'Aufgaben am Kontakt',
--  'Aufgaben pro Kontakt als aufklappbare Karten mit allen Details; Anlegen/Bearbeiten über eine fokussierte Task-Maske, Erledigen/Löschen direkt an der Karte.',
--  'Tab „Tasks"; „Neue Task" oder Stift an einer Karte; aus der Übersicht öffnet der Stift den Task direkt im Bearbeiten-Modus.',
--  'Kein Deal ohne nächsten Schritt — Follow-ups gehen nicht verloren, mehr Abschlüsse pro Pipeline.',
--  'hunter');

-- Notizen mit Zeitstempel
-- (:org, 'Notizen am Kontakt',
--  'Manuelle Notizen je Kontakt mit Datum, Uhrzeit und Autor; Anlegen über Inline-Composer, Bearbeiten direkt in der Karte.',
--  'Tab „Notizen" → „Neue Notiz" schreiben und speichern.',
--  'Wissen bleibt am Kontakt statt in Köpfen/Chats — bei Übergaben und Reaktivierungen sofort verfügbar.',
--  'hunter');

-- Deal-Verwaltung im Kontakt-Panel
-- (:org, 'Deals am Kontakt',
--  'Alle Deals eines Kontakts (Name, Produkt, Wert, Owner, Stage, ARR/MRR, Abschlussdatum) gelistet; neue Deals über ein Formular mit Produktauswahl (Katalog + eigenes Produkt) und Deal-Namen.',
--  'Tab „Deals" → „Neuer Deal"; aus der Übersicht führt der Stift direkt in den Deal-Bearbeiten-Modus.',
--  'Pipeline-Werte und Produkte sauber erfasst — präzisere Forecasts und schnelleres Deal-Handling direkt am Kontakt.',
--  'hunter');

-- Mail direkt aus dem Kontakt
-- (:org, 'E-Mail aus dem Kontakt',
--  'Schlanke „Neue E-Mail"-Maske (An/Betreff/Nachricht) direkt im Kontakt-Panel, Empfänger vorbefüllt.',
--  'Im Panel-Footer auf „Mail" klicken — der Composer öffnet im Kommunikations-Tab.',
--  'Outreach ohne Toolwechsel — der Vertriebler bleibt im Kontext und antwortet schneller.',
--  'hunter');

-- Leere Zustände (Empty States)
-- (:org, 'Klare Leerzustände',
--  'Jeder Hunter-Tab zeigt bei leerer Liste einen hilfreichen Hinweis mit der nächsten Aktion (z.B. „Noch keine Leads" + „SDR Lead hinzufügen", leere Pipeline-Spalte + „Deal anlegen").',
--  'Erscheint automatisch, sobald eine Liste/Spalte leer ist.',
--  'Neue Nutzer wissen sofort, was zu tun ist — schnellere Aktivierung, weniger Verwirrung beim Start.',
--  'hunter');

-- Hover-Tooltips für Icons (intern/UX)
-- (:org, 'Icon-Tooltips & Hover-Aktionen',
--  'Aktions-Icons (Bearbeiten/Löschen/Erledigt/Kopieren) erscheinen erst beim Hover und zeigen sofort einen Tooltip mit ihrer Bedeutung.',
--  'Mit der Maus über eine Kachel/ein Icon fahren.',
--  '(intern/UX) Aufgeräumtere Oberfläche und bessere Verständlichkeit — weniger Fehlklicks, schnelleres Arbeiten.',
--  'core');
```

---

> **Ab 2026-06-17:** Einträge laufen über **Migrationen** (`supabase/migrations/NNN_knowledge_base_*.sql`,
> idempotent `ON CONFLICT DO UPDATE`) und werden mit `db push` eingespielt. Diese Datei bleibt die
> menschenlesbare Sammlung; die Migration ist die DB-Wahrheit. (Backlog 2026-06-14…16 → Migration `016`.)

## 2026-06-17 — Migration `017_knowledge_base_pipeline.sql` (3 Einträge)

### Pipeline Listenansicht
- **feature:** Pipeline Listenansicht
- **what:** Alle offenen Deals als kompakte Tabelle — Kontakt, Stage, Deal Owner, Wert und Heat je Deal.
- **how:** Hunter → Pipeline → Ansicht „Liste". Pfeil rechts öffnet den Kontakt; oben nach Heat/Owner/Stage filtern.
- **value:** Schneller Überblick über alle Deals in einer scanbaren Tabelle — Priorisierung und Statusprüfung in Sekunden, ohne ins CRM zu wechseln.
- **module:** hunter

### Pipeline Kanban
- **feature:** Pipeline Kanban
- **what:** Deals als Kanban-Board nach Pipeline-Stage (Spalten aus den konfigurierten Stages); je Karte Wert/Heat/ICP, pro Spalte Anzahl + Summe.
- **how:** Hunter → Pipeline → Ansicht „Kanban". Spalten ein-/ausklappen; nach Heat/Owner filtern (Spalten-Summen folgen dem Filter).
- **value:** Pipeline-Verteilung und -Wert pro Stage auf einen Blick — du erkennst sofort Engpässe und wo Volumen steht, für bessere Forecasts.
- **module:** hunter

### Pipeline Filter
- **feature:** Pipeline Filter
- **what:** Filter für Liste und Kanban: nach Heat-Stufe und Deal Owner (beide Ansichten) sowie Pipeline-Stage (nur Liste).
- **how:** Filterleiste oben in der Pipeline; die Auswahl grenzt die Deals sofort ein, im Kanban folgen auch die Spalten-Aggregate.
- **value:** Genau die Deals sehen, die gerade zählen (z.B. nur heiße, nur meine) — fokussiertes Arbeiten statt Scrollen durch alles.
- **module:** hunter

## 2026-06-17 (Teil 2) — Migration `024_knowledge_base_hunter_read.sql` (3 Einträge)

### Hunter Signals
- **feature:** Hunter Signals
- **what:** Echte Kauf-/Engagement-Signale zu deinen Kontakten (z.B. LinkedIn-Aktivität, Job-Wechsel) als Feed — mit Kontakt-Kachel, Signaltyp, Zeit und — wenn vorhanden — der Stage des zuletzt aktiven Deals.
- **how:** Hunter → Signale. Jede Kachel zeigt den Anlass; Pfeil rechts öffnet den Kontakt. Leer = aktuell nichts zu tun.
- **value:** Du erfährst sofort, wann ein Kontakt anspringt — und reagierst im richtigen Moment statt zu spät. Mehr Antworten, weniger verpasste Chancen.
- **module:** hunter

### Neu in Pipeline
- **feature:** Neu in Pipeline
- **what:** Frisch in die Pipeline eingegangene Deals als Übersicht, wählbar nach Zeitraum (heute / letzte 7 Tage / letzter Monat); je Eintrag Herkunft „Via AI SDR" oder „Manuell hinzugefügt".
- **how:** Hunter → Neu in Pipeline. Oben den Zeitraum wählen; Pfeil öffnet den Kontakt. Zeigt nur frisch Eingegangenes, nicht die ganze Pipeline.
- **value:** Du siehst auf einen Blick, was neu reinkam und woher — schneller Einstieg in frische Opportunities, ohne die komplette Pipeline zu durchsuchen.
- **module:** hunter

### Follow-ups
- **feature:** Follow-ups
- **what:** Alle fälligen Aufgaben an deinen Kontakten/Deals als Liste — pro Eintrag die Kontakt-Kachel plus Aufgabe und Fälligkeit (überfällig rot, heute markiert). Erledigte verschwinden direkt.
- **how:** Hunter → Follow-ups. „Erledigt" hakt die Aufgabe ab (verschwindet sofort). Leer = alles erledigt.
- **value:** Kein Follow-up fällt mehr durchs Raster — du arbeitest deine fälligen Aufgaben ab und hältst Deals warm, mit klarer Dringlichkeit auf einen Blick.
- **module:** hunter

### Deal-Stufe ändern
- **feature:** Deal-Stufe ändern
- **what:** Deals durch die Pipeline bewegen — direkt von der Kanban-Karte (Pfeile vor/zurück), per Klick auf den Stage-Badge in der Liste und im Kontakt (Deals-/Übersicht-Tab). Schreibt sofort in die Pipeline, überall synchron.
- **how:** Pipeline → Kanban: Pfeile ← / → an der Karte. Oder Stage-Badge anklicken (Liste, Deals-Tab, Übersicht) und neue Stufe wählen.
- **value:** Pipeline-Pflege in einem Klick statt Formular — der Status bleibt aktuell, Forecasts und Follow-ups stimmen, ohne Reibung.
- **module:** hunter

### Deal abschließen (Gewonnen / Verloren)
- **feature:** Deal abschließen (Gewonnen / Verloren)
- **what:** Deals sauber abschließen: „Gewonnen" markiert den Abschluss (mit kurzer Erfolgs-Animation), „Verloren" verlangt einen Grund plus optionale Notiz. Abschlussdatum wird automatisch gesetzt.
- **how:** Letzte Pfeil-Stufe im Kanban → „Gewonnen" oder „Verloren" wählen; bei Verloren den Grund angeben.
- **value:** Saubere Won/Lost-Daten als Basis für Win-Rate, Verlustgründe und bessere Forecasts — und ein motivierender Moment beim Gewinnen.
- **module:** hunter

### Telefonnummern am Kontakt
- **feature:** Telefonnummern am Kontakt
- **what:** Mehrere Telefonnummern pro Kontakt mit Typ (Mobil/Geschäftlich/Privat) und einer Favorit-Nummer. Anrufen und Kopieren direkt aus dem Kontakt; Anlegen/Bearbeiten/Löschen inline; Eingaben werden geprüft.
- **how:** Kontakt öffnen → auf die Telefon-Pill klicken: Popover mit allen Nummern (Anrufen/Kopieren, Favorit setzen). Verwalten im Details-Tab der Vollansicht.
- **value:** Alle Nummern eines Kontakts an einem Ort, sofort anrufbar — keine verstreuten Daten, schnellerer Erstkontakt, saubere Stammdaten.

### Pipeline-Kennzahlen (Kanban)
- **feature:** Pipeline-Kennzahlen (Kanban)
- **what:** Kennzahlen-Kacheln über dem Kanban-Board: Pipeline-Gesamtwert, Gewichteter Wert (Wert × Stage-Wahrscheinlichkeit, mit Aufschlüsselung pro Stage beim Hover) und Heat-Verteilung (Anzahl aktiver Deals je Heat-Stufe).
- **how:** Hunter → Pipeline → Ansicht „Kanban". Kacheln über dem Board; „Gewichteter Wert" zeigt beim Hover die Werte je Stage.
- **value:** Forecast und Pipeline-Gesundheit auf einen Blick — realistischer gewichteter Wert statt Bruttosumme, plus Heat-Verteilung als Frühindikator.
- **module:** hunter

### Kommunikation protokollieren
- **feature:** Kommunikation protokollieren
- **what:** Manuelles Erfassen eines Touchpoints (E-Mail · LinkedIn · Anruf · Meeting) mit Richtung, Datum/Uhrzeit und optionaler Notiz. Erscheint im Kommunikations-Tab und als kompakter „Letzter Kontakt"-Block in der Übersicht; aktualisiert „zuletzt kontaktiert".
- **how:** Kontakt öffnen → Tab „Kommunikation" → „Protokollieren". Kanal + Richtung wählen, Zeitpunkt setzen, optional Notiz, speichern.
- **value:** Lückenlose Kontakt-Historie ohne Pflege-Frust — jeder Touchpoint zählt sofort in „zuletzt kontaktiert" und in die Heat-Einstufung.
- **module:** hunter

### Pipeline Task-Liste (Stagniert / Keine Task)
- **feature:** Pipeline Task-Liste (Stagniert / Keine Task)
- **what:** Signal-getriebene Aufgaben-Liste: stagnierende Deals (über Stage-Schwelle ohne Fortschritt) + aktive Deals ohne offene Task. Echte Daten; „Task anlegen" mit vorausgefülltem Deal. Leere Liste → nichts angezeigt.
- **how:** Hunter → Pipeline → „Task Liste". Zähler zeigt Anzahl; „Task anlegen" auf einer Karte → Deal ist bereits gewählt.
- **value:** Kein Deal fällt durchs Raster — Stagnation und fehlende Folgeaufgaben werden aktiv hochgespült.
- **module:** hunter

### Automatische Heat-Einstufung
- **feature:** Automatische Heat-Einstufung
- **what:** Heat-Status (Engaged/Warm/Cooling/Cold/Gone) wird automatisch aus dem letzten Kontaktzeitpunkt berechnet — nach jedem Touchpoint + täglich. Ohne Kontaktdatum bleibt der Status leer.
- **how:** Passiv — Kontakte protokollieren, Heat-Badges aktualisieren sich selbst. Schwellen in den Einstellungen konfigurierbar.
- **value:** Heat zeigt immer den echten Beziehungszustand statt manueller Pflege — verlässlicher Frühindikator.
- **module:** hunter

### Signal-Antwort (Opener)
- **feature:** Signal-Antwort (Opener)
- **what:** Aus einem LinkedIn-Signal direkt antworten — Action-Panel mit echtem Kontext (Name/Firma/ICP/Aktionstext/Zeit). KI-Entwurf + Empfehlung als „Folgt"-Platzhalter (AI-Pipeline).
- **how:** Hunter → Signals → „Antworten" auf einer Signal-Kachel.
- **value:** Vom Signal zur Reaktion in einem Klick — kein Reaktionsfenster geht verloren.
- **module:** hunter

### Kontakt reaktivieren (Kalt)
- **feature:** Kontakt reaktivieren (Kalt)
- **what:** Action-Panel für kalte/inaktive Kontakte (heat_status kalt/tot), echter Kontext + „vor X Tagen". Reaktivierungs-Entwurf als „Folgt"-Platzhalter. Nur sichtbar bei kalten Kontakten.
- **how:** Hunter → Follow-ups → Sektion „Kalt & Inaktiv" → „Start Outreach".
- **value:** Abkühlende Beziehungen aktiv hochgespült + mit einem Klick reaktiviert.
- **module:** hunter

### Stagnations-Warnung am Deal
- **feature:** Stagnations-Warnung am Deal
- **what:** Roter „⚠ Xt"-Hinweis neben der Stage, sobald ein Deal über der Stage-Schwelle ohne Fortschritt steckt. Überall sichtbar (Liste, Kacheln, Übersicht, Expand). Terminal → kein Hinweis.
- **how:** Passiv; Schwelle pro Stage in den Einstellungen.
- **value:** Frühwarnung ohne Reporting-Umweg — festhängende Deals fallen sofort auf.
- **module:** hunter

### Team & Einladungen
- **feature:** Team & Einladungen
- **what:** Mitglieder der Organisation verwalten (Liste Name/E-Mail/Rolle/Seit), Rollen ändern (nur Owner), neue Personen per E-Mail einladen (Owner/Admin), offene Einladungen zurückziehen. Registrierung über eine Einladung ordnet Org + Rolle automatisch zu. Mailversand der Einladung folgt (Edge Function); Einladung ist bereits gespeichert.
- **how:** Einstellungen → Team → „Mitglied einladen" (E-Mail + Rolle). Rollen per Dropdown in der Mitgliederliste; offene Einladungen mit „Zurückziehen".
- **value:** Schnelles Team-Onboarding ohne IT — neue Kolleg:innen in Minuten startklar, Rollen steuern Zugriff sauber, gegenseitige Vertretung verhindert liegengebliebene Leads.
- **module:** core

### Farmer-Übersicht (Kundengesundheit)
- **feature:** Farmer-Übersicht (Kundengesundheit)
- **what:** Einstieg in die Kundenpflege: Kennzahlen (laufender MRR, gefährdeter Umsatz durch Churn-Risiko, Upsell-Potenzial, NRR) + Gesundheits-Übersicht aller Bestandskunden mit Sprung in die Kundenliste.
- **how:** Farmer → Tab „Übersicht"; „Alle anzeigen" → Kundenliste.
- **value:** Sofort sehen, wo Umsatz wackelt und wo er wächst — ohne Report. Energie zuerst zu den Kunden, die sie am dringendsten brauchen oder am meisten Wachstum bringen.
- **module:** farmer

### Farmer-Kundenliste
- **feature:** Farmer-Kundenliste
- **what:** Alle Bestandskunden im einheitlichen Karten-Format (Person, Firma, ICP, Subscription-Status aktiv/gekündigt, Heat, letzter Kontakt). Aufklappbar (Kurzakte/Deals/Kommunikation); grüner Pfeil → volles Profil.
- **how:** Farmer → Tab „Kunden". Karte aufklappen / Pfeil für Profil.
- **value:** Alle Kunden an einem Ort, gleiches Format wie Leads — kein Umlernen. Status + letzter Kontakt sofort sichtbar.
- **module:** farmer

### Farmer-Retention (Churn-Prävention)
- **feature:** Farmer-Retention (Churn-Prävention)
- **what:** Gefährdete Kunden in drei Signal-Typen: akutes Churn-Risiko, „Kunde wird kalt" (kein Kontakt), eingegangene Kündigungen — je mit Empfehlung + Aktion (Retention sichern · Check-in starten · sofort anrufen).
- **how:** Farmer → Tab „Retention"; empfohlene Aktion pro Karte.
- **value:** Churn früh erkennen und handeln, bevor der Kunde weg ist — gerettete Bestandsumsätze sind günstiger als Neukundengewinnung.
- **module:** farmer

### Farmer-Upsell-Empfehlungen
- **feature:** Farmer-Upsell-Empfehlungen
- **what:** Kunden mit Wachstumspotenzial (steigende Feature-Nutzung, fast ausgeschöpfte Limits) als Upsell-Karten mit AI-Empfehlung + Aktion.
- **how:** Farmer → Tab „Upsell"; Upsell-Aktion pro Karte.
- **value:** Mehr Umsatz aus bestehenden Kunden — Upgrade-Chancen werden automatisch sichtbar.
- **module:** farmer

### Farmer-Signale
- **feature:** Farmer-Signale
- **what:** Aktivitäts-Signale rund um Bestandskunden (z. B. LinkedIn) im gleichen Signal-Format wie Hunter — Mehrfachauswahl + Antwort-Aktion.
- **how:** Farmer → Tab „Signals"; Signal auswählen und reagieren.
- **value:** Warme Momente bei Bestandskunden nutzen — wer interagiert, ist offen für Pflege oder Expansion.
- **module:** farmer

<!-- Migration 047 (Session 2026-06-25) — Farmer Info-/Action-Panel + Follow-ups (UI, Mock) -->

### Farmer-Kundenprofil (Info-Panel)
- **feature:** Farmer-Kundenprofil (Info-Panel)
- **what:** Vollständiges Kundenprofil als Panel/Vollansicht: Subscription & Nutzung, offene Aufgaben, Kommunikationsverlauf, Notizen, aktive Signale (Churn/Upsell/„wird kalt"/Kündigung); Kontaktzeile (Mail/Telefon/LinkedIn/Web) im Kopf.
- **how:** Farmer → Kundenkarte → Pfeil öffnet Panel; Aufklapp-Symbol oben rechts → Vollansicht.
- **value:** Alles über einen Kunden auf einen Blick, ohne Tool-Wechsel — schnellere, fundiertere Gespräche, kein Detail geht unter.
- **module:** farmer

### Farmer-Aktionspanel (Empfehlung → Aktion)
- **feature:** Farmer-Aktionspanel (Empfehlung → Aktion)
- **what:** Pro Kunden-Signal ein fokussiertes Aktionspanel mit AI-Empfehlung + passenden Aktionen (Retention-/Reaktivierungs-/Upsell-Nachricht, Winback-Anruf, Aufgabe, Snooze) — Format wie im Hunter.
- **how:** Farmer → Signal/Karte → empfohlene Aktion klicken → Aktionspanel rechts.
- **value:** Von der Erkenntnis direkt zur Handlung — die richtige Reaktion ist vorbereitet, der Mensch bestätigt nur.
- **module:** farmer

### Farmer-Follow-ups
- **feature:** Farmer-Follow-ups
- **what:** Tagesarbeits-Tab für Bestandskunden: fällige Aufgaben + „Kunde wird kalt"-Karten an einem Ort; Snooze/erledigen, „Ansehen" springt + hebt kurz hervor.
- **how:** Farmer → Tab „Follow-ups"; Aufgaben abarbeiten, „Kunde wird kalt"-Karten mit Aktion/Snooze bearbeiten.
- **value:** Klare Tagesliste für die Kundenpflege — nichts fällt durchs Raster, Beziehungen bleiben warm.
- **module:** farmer

### Farmer-Kundengesundheit (Churn-/Upsell-Scoring)
- **feature:** Farmer-Kundengesundheit (Churn-/Upsell-Scoring)
- **what:** Jeder Bestandskunde bekommt automatisch täglich einen Churn-Risiko- und einen Upsell-Potenzial-Score (0–100) aus den Beziehungsdaten (letzter Kontakt, Antwortverhalten, Heat, Aktivität). Schwellen in den Einstellungen anpassbar; bei aktivem Churn/Kündigung hat Retention Vorrang vor Upsell. Fehlen Daten → Score leer statt geraten.
- **how:** Läuft automatisch (tägliche Neuberechnung). Sichtbar als Churn-/Upsell-Signale, in der Übersicht-Top-5 + Retention-/Upsell-Tabs.
- **value:** Risiko- und Wachstumskunden werden automatisch erkannt und priorisiert — keine manuellen Listen, Retention schlägt Expansion bei gefährdeten Kunden.
- **module:** farmer
- *(Migration 053, 2026-06-30)*

### Kontakte-Screen (zentrale Personen-Datenbank)
- **feature:** Kontakte-Screen
- **what:** Eine durchsuchbare, sortier- und filterbare Tabelle aller Personen im System — unabhängig vom Status. Über der Liste eine Lagebild-Zeile mit den wichtigsten Bestandszahlen (z. B. „Ohne Kontaktweg", „Opt-outs") — jede Zahl ist ein Klick-Filter, und sie erscheint nur, wenn es dazu wirklich etwas gibt. Schnellfilter als Status-Pills mit echten Anzahlen plus ein Filter-Menü für Quelle und ICP; Mehrfachauswahl über alle Treffer im aktuellen Filter (nicht nur die sichtbare Seite). Spalten frei ein-/ausblenden, per Drag umsortieren und in der Breite ziehen — die Ansicht wird pro Nutzer gemerkt. Neue Kontakte legt man in einem seitlichen Panel direkt an — Pflichtprüfung (Name oder LinkedIn) und Live-Duplikatswarnung inklusive. Jede Zeile zeigt, wo der Kontakt gerade bearbeitet wird, und springt per Klick dorthin — aber nur zu Bereichen, die es schon gibt (nichts führt ins Leere).
- **how:** Sidebar → Kontakte; oben über Lagebild-Zahlen oder Status-Pills filtern, Spalten über das Zahnrad anpassen (verschieben/Breite ziehen), „+ Kontakt" zum Anlegen, Pfeil öffnet die Detailansicht.
- **value:** Eine einzige verlässliche Personenliste statt verstreuter Listen — auf einen Blick sehen, was ansteht, gezielt filtern, sauber anlegen ohne Doubletten, die Tabelle nach eigenem Arbeitsstil einrichten, und mit einem Klick genau dort weiterarbeiten, wo der Kontakt hingehört.
- **module:** core_crm
- *(K-3 inkl. QA-Runden 1–3, 2026-07-17)*

### Kontakt-Listen (statisch + dynamisch)
- **feature:** Kontakt-Listen
- **what:** Zwei Arten von Listen auf der Kontakte-Seite. **Statische Listen** befüllt man selbst (Kontakte auswählen und „Zu Liste hinzufügen" — als Massenaktion in der Tabelle oder einzeln im Kontakt-Panel). **Dynamische Listen** speichern stattdessen einen Filter: Man filtert die Kontakte wie gewünscht und speichert das als Liste — ihre Mitglieder aktualisieren sich danach automatisch (rein und raus), sobald sich Kontaktdaten ändern. Bei dynamischen Listen ist „Zu Liste hinzufügen" bewusst nicht möglich (die Regel entscheidet die Mitgliedschaft) und wird klar so gekennzeichnet.
- **how:** Kontakte → „Listen" öffnen → Liste wählen (Tabelle zeigt die Mitglieder) oder „Neue Liste erstellen" → Statisch oder Dynamisch. Für statische Listen: Kontakte markieren → „Zu Liste" (oder im Kontakt-Panel das Listen-Symbol).
- **value:** Wiederkehrende Kontaktgruppen einmal definieren und immer griffbereit haben — feste Kuratierung per Hand oder selbstpflegende Segmente per Filter, ohne manuelle Nachpflege. Grundlage für spätere gezielte Kampagnen.
- **module:** core_crm
- *(K-3b, 2026-07-17)*
