# Session-Übergabe — 2026-06-22 (Teil 2: [D27] Tech-Schuld)

> Fortsetzung von `session_uebergabe_2026-06-22.md`. Diese Session = reine **Tech-Schuld /
> Aufräum-Arbeit ([D27])** auf grünem `main`. Kein neues User-Feature, kein DB-Change.
> Spanne: `3ddf89b` (Stand letzte Übergabe) … `66a815b` (aktueller `main`-HEAD vor Session-Commit).

## Was in dieser Session passiert ist

### 1. `ExpandedCardContent` extrahiert (Expand-Dedup) — `28d56d7`/`4434176`
- Neuer panel-block `src/components/panel-blocks/ExpandedCardContent.tsx`: der **aufgeklappte
  Inhalt** einer Profilkachel (KI-Kurzakte-Platzhalter · Deals · Kommunikationskette ·
  Stagnations-Warnung) lag doppelt in `HunterCard` **und** `LeadListRow` (~47 Zeilen je Karte).
- Jetzt **eine Quelle**: beide Karten rendern `<ExpandedCardContent contactId onEditDeal />`.
- Lazy: interne Queries (Deals/Kommunikation/Stages) laufen nur mit `enabled: !!contactId`.
- 2-Spalten-Grid: KI-Kurzakte „Folgt"-Platzhalter ([D5]) · `DealsListe variant="compact"`
  mit `stagnationBySlug`. Kommunikation echt (`CommunicationChain`) bzw. „Noch keine
  Kommunikation protokolliert". Reine Extraktion — kein Verhaltens-Change.
- Unbenutzte Imports in beiden Karten entfernt (useQuery, db-Queries, CommunicationChain, …).

### 2. `window.confirm` → shadcn `AlertDialog` — `5d1fca1`/`faee927`
- Neues UI-Primitive `src/components/ui/alert-dialog.tsx` (shadcn auf `@radix-ui/react-alert-dialog`,
  **neue Dependency**). Overlay = `bg-[var(--scrim)]/25 backdrop-blur-sm` (Token, **nicht** bg-black).
  Action = `destructive`, Cancel = `outline`.
- Verdrahtet im `HunterSidepanel`: Löschen der **letzten** Telefonnummer öffnet jetzt den
  AlertDialog (Cancel/„Nummer löschen") statt des nativen `window.confirm`.
- **Im gesamten `src/` gibt es keinen `window.confirm`-Aufruf mehr** (nur noch ein erklärender Kommentar).

### 3. Typo-Kanon Welle 1 + 2 + IN_SCOPE-Pflicht — `600b424`/`846a12f`, `cedc012`/`66a815b`
- 14 Komponenten von rohen Schrift-Klassen auf die `typo-*`-Primitive gehoben:
  - **Welle 1 (Formulare/Panels):** TaskAnlegenForm, TaskFormular, TaskEntwurfForm, MailComposer,
    AddSdrLeadPanel, ChatActionPanel, HunterSidepanel.
  - **Welle 2 (Karten/Felder):** LinkedinSignalCard, NewInPipelineCards, KpiCard, EditableInline,
    DetailField, DetailPhoneList, FunnelAnalysis.
- `scripts/audit.ts` (`checkTypographyTokens`) walkt jetzt **`panel-blocks/` UND `features/`**;
  alle 14 Komponenten in `IN_SCOPE` aufgenommen.
- **CLAUDE.md-PFLICHT** ergänzt: „Jede neue Komponente, die Typo-Klassen nutzt, muss SOFORT in
  `IN_SCOPE` — nie erst beim nächsten Cleanup." + neue Pre-Push-Checkbox.

## Gate-Status (vor dem Session-Commit)
- `npm run build` → ✓
- `npm run audit` → **0 FAIL** · 4 WARN (bekannt, Perf) · Typo-Kanon **PASS** · Single-Source **PASS**
- `npm run structure-check` → PASS

## Doku aktualisiert
- `PROGRESS.md` — Status-Zeile + Session-Block ([D27] fertig, `66a815b`).
- `CHECKLIST.md` — [D27]-Eintrag (ExpandedCardContent · AlertDialog · Typo-Welle 1+2).
- `CLAUDE.md` — `ExpandedCardContent` in der panel-block-Tabelle; `alert-dialog` in der
  shadcn-ui-Liste + Pflicht-Zuordnung „destruktive Bestätigung → alert-dialog (nie window.confirm)".

## Bewusst NICHT gemacht
- **Keine neue knowledge_base-Migration.** [D27] ist Refactor/UI-Primitive/Typo-Aufräumen —
  kein kundenseitiges Feature. KB-Einträge sind Pitch-/Nutzen-Text aus Kundensicht → hier nicht zutreffend.
- **Kein DB-Change**, keine neue Migration. Nächste freie Nummer bleibt **041**.

## Offene Punkte / Next
- **`KB Migration 040`** (Signal-Opener · Kalt-Reaktivierung · Stagnations-Warnung + Kontakt-Details)
  steht in `CHECKLIST.md` weiterhin als „db push offen" — beim Sessionstart prüfen, ob bereits gepusht.
- **Typo-Kanon Welle 3** (optional): Modale ohne audit-relevante Verstöße (DealWon/Lost/Close,
  KommunikationLogModal) könnten zur Vollständigkeit in `IN_SCOPE` — aktuell kein FAIL.
- Größere offene Themen unverändert: **Auth/Org [D21]** (ersetzt `DEMO_ORGANIZATION_ID`),
  **Realtime** (Phase 5), **AI-Pipeline** (löst die „Folgt"-Platzhalter [D5]/[D26]),
  **Reminder/Notifications** [D19].
