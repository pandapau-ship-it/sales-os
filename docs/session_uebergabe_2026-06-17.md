# Session-Übergabe — 2026-06-17 (Hunter Read-Abschluss + Task-System)

> Tages-Abschluss. Ergänzt die früheren Übergaben von heute
> (`_pipeline.md`, `_signals-contact-unification.md`) — diese Datei deckt **Teil 2** ab:
> Neu-in-Pipeline, Task-System (Migrationen 021–024), Follow-ups = fällige Tasks, erster Write (Abhaken).
> Branch: `feature/phase-2-hunter`. Migrationen 001–023 remote live; **024 (knowledge_base) wartet auf `db push`**.

## Was heute (Teil 2) fertig wurde

- **Neu-in-Pipeline read-verdrahtet** — `getNewInPipeline(org)` (Deals `created_at` desc, Kontakt-Embed +
  `source_lead_id`) + `dealToNewPipelineRow` über die zentrale `contactToProfile`/`contactActiveStage`-Leitung.
  **Zeitfilter** heute / 7 Tage / 30 Tage (Default 30T, client-seitig über `created_at`). Herkunft
  **„Via AI SDR" vs. „Manuell"** aus `source_lead_id`. Türen sichtbar (Meeting-Prep/Termin-Buttons + Panel-Pfeil),
  Termin-Datum/Prep-Status/AI-Text **deferred** ([D18]).
- **Task-System (DB):**
  - **021** — composite Indizes `tasks(org+due_at)`, `(org+deal_id)`, `(org+contact_id)`.
  - **022** — `tasks.channel` (nullable, `email|linkedin|phone|calendar|other`); Priority-Doku auf
    `low|medium|high|urgent` angeglichen (kein CHECK).
  - **023** — Seed mit 6 Test-Tasks (4 fällig: 3 überfällig + 1 heute · 2 Kontrollen: 1 zukünftig + 1 erledigt;
    `source`/`priority`/`channel` gemischt; idempotent, `due_at` relativ zu `now()`, `deal_id = NULL`).
- **Follow-ups-Tab = fällige Tasks** — von Heat-Cold/Gone **vollständig umgestellt** auf
  `getDueTasks` (`completed_at IS NULL AND due_at <= now()`) + `taskToDueCard`. Karte = Kontakt-Kachel +
  grauer Bereich „Fällige Task" + Titel + Fälligkeit (überfällig rot, heute amber). Alte
  `getFollowUps`/`contactToFollowUpCard` entfernt (keine Leichen). **[D17] entschieden.**
- **Erster echter Write — Task abhaken (T4a)** — `completeTask(taskId, org)` (UPDATE `completed_at`,
  org-gescoped, Audit via DB-Trigger, **keine Edge Function**). „Erledigt"-Button auf der Follow-up-Karte,
  `useMutation` + **invalidate-on-success** (kein Optimistic). Abhaken → Karte verschwindet, Count sinkt.
  Visuell verifiziert.
- **knowledge_base 024** (geschrieben, nicht gepusht) — `Hunter Signals` · `Neu in Pipeline` · `Follow-ups`.
- **Doku:** Panel-Thema (B) in PROGRESS konsolidiert (B0–B5); [D18]/[D19] angelegt; [D17] auf entschieden.

## Was noch offen ist

- **820px-Info-Panel an echte Daten** (großer nächster Brocken, → Panel-Thema B). Enthält:
  - **Task ANLEGEN (T4b)** — `createTask` vorbereitet (channel + `mail→email`, `due_at`-Komposition,
    `source='manual'`, `assigned_to=NULL`), Formular wartet auf Panel-Anbindung; Kontakt-/Deal-Feld → echtes
    durchsuchbares Auswahlfeld (vorbefüllt aus Kontext + änderbar).
  - **Karten-Deeplink** — Klick öffnet Panel am kontextrelevanten Tab (welche Task), nicht generisch.
- **Pipeline-Task-Liste** (Pipeline-Tab) entmocken (B4) — „Deal ohne offene Task" ableitbar (`openTaskCount`
  auf PipelineRow ergänzen); „Stagniert" braucht Stagnations-Berechnung (B5/[D4]/[D9]) + KI-Vorschlag.
- **Übersicht** (Top-5/KPIs/Funnel) — Aggregat-Zahlen, eigener Block.
- **Task-Reminder** ([D19]) — Feld (`reminder_at`) + Auslöse-System (notifications-Tabelle, Cron, Versand)
  fehlen komplett; Reminder-Schalter bleibt ausgegraut.
- **Write-Phase** allgemein: Stage-Writes/Stagnation/AI-Vorschläge via Edge Functions.

## Nächste Schritte (in Reihenfolge)

1. **820px-Info-Panel — Diagnose zuerst:** Welcher Kontakt/Deal wird beim Karten-Klick übergeben
   (heute: minimaler `Lead` aus `buildLead`, oft nur Task-/Deal-ID, **nicht** die echte `contact_id`)?
   Welche Panel-Tabs/Felder haben echte DB-Gegenwerte (`contacts`/`companies`/`deals`/`tasks`/`notes`/
   `communications`)? Was ist Mock?
2. **Panel-Wiring + Karten-Deeplink** (B0/B3) → dann **Task anlegen (T4b)** im Panel (B1/B2).
3. **Pipeline-Task-Liste** (B4) + **Stagnations-Berechnung** (B5) — letztere als Edge Function.
4. **Übersicht** (KPIs/Funnel) — separat.

## Wichtige Entscheidungen heute

- **[D17] Follow-up = Kontakt/Deal mit fälliger Task** (`completed_at IS NULL AND due_at <= now()`) —
  ersetzt „kalte Kontakte" (Heat Cold/Gone) vollständig.
- **Task-Datenmodell (gelockt, B2):** Aufgabe **immer am Kontakt** (Pflicht), **Deal optional** — deckt
  menschbezogene + geschäftsbezogene Aufgaben ab; CRM-konform (who + optional what).
- **Zwei Listen-Definitionen:** Follow-ups = **fällige** Tasks · Pipeline-Task-Liste = **alle offenen**
  Tasks (`completed_at IS NULL`, Fälligkeit egal).
- **Direkter Supabase-Write ist regelkonform** für User-Writes (Task abhaken/anlegen) — Audit deckt der
  DB-Trigger ab, keine Edge Function nötig. Edge Functions bleiben für AI-/Berechnungs-/Booking-Pfade.
- **Default-Zeitfilter Neu-in-Pipeline = 30T** (weiteste Spanne, da Seed-Recency mit anon/RLS nicht prüfbar).
- **T4b bewusst zum Panel verschoben** (Formular lebt im Panel — kein doppeltes Anfassen).

## Offene Fragen / Hinweise

- **RLS/anon:** Reads/Writes brauchen die eingeloggte Test-User-Session (`test@gosherloq.dev`); mit anon-Key
  liefert REST leer (RLS auf `auth_org_id()`). Seed-Werte daher nur eingeloggt (SQL-Editor) prüfbar.
- **Pipeline-Task-Liste-Testdaten:** Seed-Tasks (023) haben `deal_id = NULL` → für die **Deal-bezogene**
  Ansicht werden Deal-verknüpfte Test-Tasks gebraucht (Deal-UUIDs liefert der User via SQL-Editor).
- **`assigned_to`** beim Anlegen: vorerst NULL — Quelle (Session-User vs. NULL) bei T4b final entscheiden.

## Neue/geänderte Helfer & Komponenten (Library)

- `lib/db.ts`: **`getNewInPipeline`**, **`getDueTasks`**, **`completeTask`**, **`createTask`** (erweitert),
  `getFollowUps` **entfernt**.
- `lib/hunterMappers.ts`: **`dealToNewPipelineRow`**/`NewPipelineCardItem` + `NewPipelinePeriod`/
  `newPipelineInPeriod`, **`taskToDueCard`**/`DueTaskCardItem`; `contactToFollowUpCard`/`FollowUpCardItem`
  **entfernt**.
- `panel-blocks/NewInPipelineCards.tsx` (datengetrieben, Zeitfilter) + `panel-blocks/SequenceLeadCards.tsx`
  (jetzt fällige-Task-Karten + „Erledigt") — beide bereits im Barrel (`panel-blocks/index.ts`), strukturkonform.
  `FollowUpKaltCard` bewusst behalten (deferred Snooze/Eskalation/Outreach-UI).
- `types/hunter.ts`: `Deal.source_lead_id`, `Task.channel`/`priority`-Kommentar.

## Migrationen-Stand

001–023 **remote live**. **024** (`knowledge_base_hunter_read`) ist geschrieben, **noch nicht gepusht** —
`supabase db push` am Sessionstart (idempotent, `ON CONFLICT DO UPDATE`).
