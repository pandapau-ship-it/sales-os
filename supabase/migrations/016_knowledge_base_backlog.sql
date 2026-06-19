-- 016_knowledge_base_backlog.sql
-- Backlog-Überführung: die in docs/knowledge_base.md gesammelten Einträge
-- (Sessions 2026-06-14 / 06-15 / 06-16) in die DB. Gleiches Muster wie 015:
-- idempotent über UNIQUE(organization_id, feature) (aus 015) + ON CONFLICT DO UPDATE.
-- Reihenfolge: MUSS nach 015 laufen (Constraint stammt aus 015).
-- 19 Einträge · org = Demo-Org. docs/knowledge_base.md bleibt die Quelle/Sammlung.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

-- ── 2026-06-14 ────────────────────────────────────────────────────────────────
('00000000-0000-0000-0000-000000000001',
 'Hunter Info Panel (820px)',
 'Vollständige Kontakt-/Deal-Detailansicht als Slide-in-Panel (820px) mit Tabs (Übersicht · Kommunikation · Aktivität · Tasks · Notizen). Öffnet über den grünen Pfeil jeder Kachel.',
 'Grüner Pfeil auf einer Lead-/Signal-Kachel klicken → Panel fährt rechts ein, schließt nur per X. Übersicht zeigt KI-Kurzakte, aktive Signale, Deal-Setup, offene Tasks, Sequence-Chain, Kommunikations-Preview.',
 'Der gesamte Kontakt-Kontext (Kurzakte, Deal, Signale, Tasks, Kommunikation) auf einen Klick — kein Tab-Wirrwarr, kein Suchen. Reps reagieren schneller und souveräner → mehr gewonnene Deals.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Action-Panel-Shell (panels/ActionPanel)',
 'Wiederverwendbare Side-Panel-Shell (Sheet „drawer", 50vw) für einspaltige Aktions-Flows (Stagniert · Signal · Kalt · Kein Task · SDR Lead anlegen). Nur Struktur — Inhalt kommt als children.',
 'Feature-Komponenten (z.B. AddSdrLeadPanel, ChatActionPanel) setzen Header + Body + Footer/Composer aus panel-blocks/ zusammen und rendern sie in der Shell.',
 'Jede Aktion passiert direkt am Kontakt — ohne Seitenwechsel. Weniger Klicks, kein Kontextverlust, mehr erledigte Schritte pro Tag. (Shell intern; Kundennutzen = Inline-Handeln.)',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'SDR Lead anlegen (Action-Side-Panel)',
 'Lead-Anlage als 50vw-Side-Panel mit Progressive Disclosure: Stufe 1 Pflicht (Owner · Vorname · Nachname · E-Mail ODER LinkedIn · Firma), Stufe 2 aufklappbar (Anrede · Rolle · Telefon · Quelle · Pipeline-Stage · Notizen), Stufe 3 optionaler Deal (Wert · Owner · ARR/MRR · Abschluss).',
 '„+ SDR Lead hinzufügen" öffnet das Panel. Pflichtfelder oben, Rest hinter „Weitere Details", Deal hinter „+ Deal hinzufügen". Pipeline-Stage und Deal sind gekoppelt (Hinweis-Banner). Speichern → Toast.',
 'Leads in Sekunden erfasst statt Formular-Frust — und trotzdem saubere Daten, auf denen Automatisierung, Lead-Routing und Reporting verlässlich laufen. Weniger Pflege, mehr aktive Pipeline.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Zentrale Status-Badges (HeatBadge/StageBadge)',
 'Zwei zentrale Badge-Komponenten. HeatBadge rendert den Heat-Status aus HEAT_STATUS (Engaged/Warm/Cooling/Cold/Gone) als randloses Pill (Hintergrund 10% Opacity, Dot 8px, gleichfarbiger Text). StageBadge rendert die Pipeline-Stage als randloses graues Pill.',
 'Überall wo Heat/Stage erscheint: <HeatBadge status={...} /> bzw. <StageBadge stage={...} />. Ein npm run audit-Check verhindert hardcodierte alte Heat-Labels.',
 'Auf einen Blick sehen, welcher Kontakt heiß ist und wo ein Deal steht — Priorisierung in Sekunden statt Bauchgefühl. Kein Lead fällt durchs Raster, der Rep arbeitet immer am Wichtigsten zuerst.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Komponenten-Ordnerstruktur',
 'Verbindliche Struktur: panels/ (Shells, nur Struktur) · panel-blocks/ (wiederverwendbare Inhalts-Blöcke) · features/[modul]/ (modul-spezifische Kompositionen).',
 'Jede neue Komponente landet sofort in der richtigen Schublade (CLAUDE.md-Pflichtregel). Panels komponieren aus panel-blocks; keine Inhalts-Logik in der Shell.',
 '(intern/Architektur — nicht kundenfähig) Schnellere, konsistente Weiterentwicklung → neue Funktionen erreichen Kunden früher und mit weniger Bugs.',
 'core'),

('00000000-0000-0000-0000-000000000001',
 'Erledigt-Aktion',
 'In jedem Action-Panel kannst du ein Signal als „bereits erledigt" markieren und festhalten, was du gemacht hast (Email/LinkedIn/Telefonat/Meeting/Anderes) + Notiz.',
 'Im Action-Panel bei der AI-Empfehlung auf „Bereits erledigt" klicken, Kanal wählen, optional Notiz tippen, bestätigen — Panel schließt, Eintrag landet in der Kurzakte.',
 'Erledigtes außerhalb des Tools fließt trotzdem in Kurzakte, Heat und Tagesfortschritt — kein Kontakt geht verloren, der Verlauf bleibt vollständig.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Navigation (zentrale Stil-Quelle)',
 'Top-Nav, Sub-Navs und Sidebar teilen EINE Stilquelle (lib/navBehavior.ts → NAV).',
 'Entwickler ändern NAV an einer Stelle, alle Nav-Leisten passen sich automatisch an.',
 '(intern/Architektur — nicht kundenfähig) Konsistente, schnell anpassbare Navigation; weniger UI-Drift.',
 'core'),

-- ── 2026-06-15 ────────────────────────────────────────────────────────────────
('00000000-0000-0000-0000-000000000001',
 'Kontakt-Vollansicht',
 'Vollbild-Profilseite zu einem Kontakt mit Tabs (Details/Übersicht/Kommunikation/Aktivität/Tasks/Notizen) — gleicher Inhalt wie das Info-Panel, als ganze scrollbare Seite.',
 'Im Info-Panel oben rechts auf den ↗-Pfeil klicken; ← zurück ins Panel, ✕ schließt. Die ganze Seite scrollt wie eine normale Website.',
 'Kompletter Kontakt-Kontext auf einer ruhigen, übersichtlichen Seite — mehr Platz, schneller alles im Blick, fokussierteres Arbeiten.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Kontakt-Details (Inline-Edit)',
 'Alle Stamm-/Firmen-/CRM-Felder auf einen Blick; befüllte Werte lesbar, System-Status (Heat/Status/verifiziert) als Badge.',
 'Wert anklicken und direkt im Feld ändern (kein Extra-Fenster), leere Felder per „+ Hinzufügen"; Copy-Icon bei E-Mail/Telefon/LinkedIn/Web; mehrere Telefonnummern mit Favorit-Stern.',
 'Kontaktpflege wie in einem modernen CRM — schnell, inline, ohne Formular-Frust. Saubere Daten als Basis für Automatisierung, Personalisierung und Reporting.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Detail-Bausteine (panel-blocks)',
 'Wiederverwendbare Blöcke für Profilansichten: DetailField (Read-Mode + Inline-Edit + Copy), DetailSection, StatusBadge, DetailPhoneList.',
 'Entwickler komponieren Detailseiten aus diesen Blöcken statt Felder pro Seite neu zu bauen.',
 '(intern/Architektur — nicht kundenfähig) Konsistente, schnell baubare Detailansichten; neue Objekte (Companies/Deals) einheitlich und früher verfügbar.',
 'core'),

-- ── 2026-06-16 ────────────────────────────────────────────────────────────────
('00000000-0000-0000-0000-000000000001',
 'Komponenten-Library (panel-blocks)',
 'Alle Inhalts-Blöcke der Panels/Vollansicht sind wiederverwendbare panel-blocks (Barrel-Import); HunterSidepanel/ChatActionPanel komponieren nur noch daraus. Struktur per npm run structure-check + Pre-Push-Hook erzwungen.',
 'Entwickler bauen neue Ansichten aus bestehenden Blöcken statt Inline-Code; falsch platzierte shared/-Komponenten werden vor dem Push geblockt.',
 '(intern/Architektur — nicht kundenfähig) Weniger Duplikate, konsistente UI, schnellere Weiterentwicklung — Features erreichen Kunden früher und mit weniger Bugs.',
 'core'),

-- ── 2026-06-16 (Teil 2) ───────────────────────────────────────────────────────
('00000000-0000-0000-0000-000000000001',
 'Kommunikations-Verlauf',
 'Vertikaler Zeitstrahl aller Touchpoints (Mail, LinkedIn, Anruf, Meeting, Notiz) — direkt aufgeklappt, jede Station in der Optik ihres Mediums.',
 'Im Kontakt-Panel den Tab „Kommunikation" öffnen; jede Nachricht ist mit Richtung, Sentiment und Volltext sichtbar.',
 'Der Vertriebler sieht die gesamte Beziehung auf einen Blick und spart das Zusammensuchen aus Mail/LinkedIn — schnellere, fundiertere nächste Schritte.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Aktivitäts-Verlauf',
 'System-Feed aller Aktionen am Datensatz: Deal angelegt (mit Betrag/Stage), Stage-Wechsel, Task an/erledigt, Heat-Wechsel, in Sequenz aufgenommen, Kontakt angelegt — je mit Akteur und Datum.',
 'Tab „Aktivität" im Kontakt-Panel.',
 'Lückenlose Nachvollziehbarkeit, wer wann was getan hat — Vertrauen, Audit und schnelleres Onboarding neuer Team-Mitglieder auf einen Account.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Aufgaben am Kontakt',
 'Aufgaben pro Kontakt als aufklappbare Karten mit allen Details; Anlegen/Bearbeiten über eine fokussierte Task-Maske, Erledigen/Löschen direkt an der Karte.',
 'Tab „Tasks"; „Neue Task" oder Stift an einer Karte; aus der Übersicht öffnet der Stift den Task direkt im Bearbeiten-Modus.',
 'Kein Deal ohne nächsten Schritt — Follow-ups gehen nicht verloren, mehr Abschlüsse pro Pipeline.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Notizen am Kontakt',
 'Manuelle Notizen je Kontakt mit Datum, Uhrzeit und Autor; Anlegen über Inline-Composer, Bearbeiten direkt in der Karte.',
 'Tab „Notizen" → „Neue Notiz" schreiben und speichern.',
 'Wissen bleibt am Kontakt statt in Köpfen/Chats — bei Übergaben und Reaktivierungen sofort verfügbar.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Deals am Kontakt',
 'Alle Deals eines Kontakts (Name, Produkt, Wert, Owner, Stage, ARR/MRR, Abschlussdatum) gelistet; neue Deals über ein Formular mit Produktauswahl (Katalog + eigenes Produkt) und Deal-Namen.',
 'Tab „Deals" → „Neuer Deal"; aus der Übersicht führt der Stift direkt in den Deal-Bearbeiten-Modus.',
 'Pipeline-Werte und Produkte sauber erfasst — präzisere Forecasts und schnelleres Deal-Handling direkt am Kontakt.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'E-Mail aus dem Kontakt',
 'Schlanke „Neue E-Mail"-Maske (An/Betreff/Nachricht) direkt im Kontakt-Panel, Empfänger vorbefüllt.',
 'Im Panel-Footer auf „Mail" klicken — der Composer öffnet im Kommunikations-Tab.',
 'Outreach ohne Toolwechsel — der Vertriebler bleibt im Kontext und antwortet schneller.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Klare Leerzustände',
 'Jeder Hunter-Tab zeigt bei leerer Liste einen hilfreichen Hinweis mit der nächsten Aktion (z.B. „Noch keine Leads" + „SDR Lead hinzufügen", leere Pipeline-Spalte + „Deal anlegen").',
 'Erscheint automatisch, sobald eine Liste/Spalte leer ist.',
 'Neue Nutzer wissen sofort, was zu tun ist — schnellere Aktivierung, weniger Verwirrung beim Start.',
 'hunter'),

('00000000-0000-0000-0000-000000000001',
 'Icon-Tooltips & Hover-Aktionen',
 'Aktions-Icons (Bearbeiten/Löschen/Erledigt/Kopieren) erscheinen erst beim Hover und zeigen sofort einen Tooltip mit ihrer Bedeutung.',
 'Mit der Maus über eine Kachel/ein Icon fahren.',
 '(intern/UX) Aufgeräumtere Oberfläche und bessere Verständlichkeit — weniger Fehlklicks, schnelleres Arbeiten.',
 'core')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;
