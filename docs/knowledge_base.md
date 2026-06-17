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
