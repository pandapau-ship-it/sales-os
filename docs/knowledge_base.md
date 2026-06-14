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
