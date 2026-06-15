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

