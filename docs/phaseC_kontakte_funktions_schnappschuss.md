# Phase C — Funktions-Schnappschuss ScreenKontakte (PRE-Refactor Baseline)

> Erhoben VOR der Tabellen-Extraktion (2026-07-17). Nach der Extraktion muss **jeder** Punkt
> 1:1 identisch funktionieren. Abweichung = melden (Regel B). Basis-Commit: prefetch-Merge auf main.

## Daten & Zustände
- [x] Laden über `getContacts(org, {limit:1000})` (TanStack Query, `staleTime 30s`, Key `["kontakte", org]`)
- [x] Lade-Skeleton (8 Pulse-Zeilen) · Fehler-EmptyState mit „Nochmal laden" (refetch) · Leer-EmptyState
      (Text unterscheidet: kein Kontakt / kein Treffer / Liste leer)

## Tabellen-Mechanik
- [x] Sortieren per Header-Klick (asc→desc→none), Sort-Icons (ArrowUp/Down/ChevronsUpDown), nur sortierbare Spalten
- [x] Spalten **Drag-Reorder** (Header ziehen → `columnOrder`)
- [x] Spalten **Breite ziehen** (Resize-Handle rechts → `columnSizing`)
- [x] Spalten **ein-/ausblenden** (Konfig-Popover, „Kontakt" nicht abwählbar) + **„Auf Standard"** (Sichtbarkeit+Reihenfolge+Breite)
- [x] **Virtualisierung** (`useVirtualizer`, 68px, overscan 8) innerhalb der Seite
- [x] **Pagination** (25/50/100, Default 50; Zurück/Weiter; „Zeige X–Y von Z")
- [x] **Persistenz pro User** (`user_preferences` → `table_views.contacts`: columnVisibility/columnOrder/columnSizing/sorting/pageSize; laden on-mount, speichern debounced 500ms)

## Spalten (Zellen-Renderer)
- [x] Kontakt (Avatar farbig + Name + Jobtitel·Firma) · Quelle (LeadSourceBadge) · Status (StatusBadge) ·
      Zuletzt („vor X Tagen", <1 Tag → leer) · ICP Score (ICPDonut) · Routing (RoutingChip, nicht-gebaute Ziele aus)
- [x] Header-Labels + alle Texte über i18n (`kontakte.*`)

## Auswahl & Bulk (Gmail-Muster)
- [x] Zeilen-Checkbox + Kopf-Checkbox „alle auf Seite" · „Alle N im aktuellen Filter auswählen" · „Auswahl aufheben"
- [x] Bulk-Bar: Zu Liste (ZuListeDialog) · Tag (Toast-Platzhalter) · Archivieren (Toast-Platzhalter) · X
- [x] Bei aktiver STATISCHER Liste zusätzlich: „Aus Liste entfernen" (Bulk) + Per-Zeile-Hover (UserMinus)

## Filter (Kontakte-spezifisch, NICHT generisch)
- [x] Status-Pills mit echten Counts (nur Count>0; „Alle") · kombiniertes „Filter"-Dropdown (Quelle+ICP, Popover) · „Alle zurücksetzen"
- [x] Lagebild-Zeile (Ohne Kontaktweg / Opt-outs), klickbar → Filter, 0 → weg, alle 0 → Zeile weg
- [x] Filter/Seitenwechsel → Bulk-Auswahl reset

## Listen (Kontakte-spezifisch)
- [x] Listen-Dropdown (Popover, click-outside): Liste wählen → ersetzt Filteransicht (Aktiv-Leiste + ✕), Umbenennen (inline), Löschen (alert-dialog)
- [x] „+ Neue Liste" (NeueListeDialog, Statisch|Dynamisch) · Add-Toast „Liste ansehen" · sofortige Aktualisierung (lists+listMembers invalidiert)

## Panels & Interaktion
- [x] Zeilen-Pfeil → HunterSidepanel (Detail); **Hover-Prefetch** auf der Zeile (useHoverPrefetch → prefetchContactPanel)
- [x] „+ Kontakt" → KontaktAnlegenPanel (K1+K2)

## Gates-Baseline (muss nach Refactor identisch grün sein)
- [x] build · lint 0 · tsc 0 · 120 Tests · structure PASS · audit 24 PASS/0 FAIL · beide Agents PASS
