# Session-Übergabe 2026-06-21

**Branch dieser Session:** `chore/session-2026-06-21` (Doku) · Arbeit gemergt auf **`main`** (`8785da2`)
**Spanne:** seit letzter Übergabe 2026-06-20 (`20ca624`) → `8785da2` · **~24 Commits**
**Stack:** unverändert (React 19 + Vite + TS strict + Tailwind v4 + shadcn + Supabase + TanStack Query + i18next). Demo-Org via `DEMO_ORGANIZATION_ID`, kein Auth ([D21]).

---

## Was seit letzter Session fertig wurde

### Kanban-Optik-Überarbeitung
- Graue Spalten-Lanes (`--border-subtle`), weiße Kacheln, Karten-Aktionen **← / Auge / →** (Zurück nur ab 2. Stage, → nur nicht-terminal).
- KPI-Übersicht über dem Board (Pipeline-Wert · Gewichteter Wert mit Stage-Hover-Popover · Heat-Verteilung), volle Breite, gleich hohe Kacheln; Filter als Progressive-Disclosure-Button. **KB 033**.

### Won/Lost — Grund + Notiz
- Migration **034**: `deals.lost_note` · `won_reason` · `won_note`.
- `DealWonModal` (neu, nicht-blockierend): optionaler Grund (RadioGroup) + Notiz; Konfetti/Won-Write passieren schon beim Öffnen. `DealLostModal` dismissbar gemacht (X/Escape/Außenklick = Abbrechen). Abschluss-Box (grau) unten auf der Deal-Kachel mit Grund+Notiz.

### Performance- & Signal-UI-Regeln
- CLAUDE.md: „Performance & Skalierung" + „Signal-getriebene UI — Kern-Philosophie".
- `scripts/audit.ts`: 4 Perf-Checks — N+1 (FAIL, präzises Paren-Matching) · staleTime (WARN) · SELECT * (WARN, Ausnahme `getContactDetail`) · Edge-Fn-Timeout (WARN). `structure-check.sh`: CREATE TABLE ohne CREATE INDEX → WARN.

### Stagnation — `score-deal-health`
- Edge Function: `deals.stagnation_days` aus `stage_updated_at`, Update nur bei Änderung, Return `{ updated, org_id }`.
- Cron **035** (täglich 02:00 UTC, **Vault-Methode** `vault.decrypted_secrets` statt GUC — `current_setting` ist auf Hosted Supabase „permission denied"). Stage-Trigger (`updateDealStage` → fire-and-forget invoke).
- **Bereinigt:** schreibt **nur** `stagnation_days`, **kein** `heat_status` (Konzept-Trennung: Stagnation = Deal, Heat = Kontakt). Toter Settings-Read entfernt.

### P7 — Kommunikation protokollieren (LIVE)
- Migration **036**: Tabelle `communications` (`channel` email|linkedin|call|meeting · `direction` outbound|inbound · `occurred_at` · `note` · `created_by`), RLS (`auth_org_id()`), 3 Indizes, `audit_write`-Trigger **+ `bump_contact_last_contacted`** (setzt `contacts.last_contacted_at` **nur vorwärts**).
- `db.ts`: `getContactCommunications` (occurred_at DESC) + `createCommunication` (stößt `score-heat-status` fire-and-forget an).
- UI: **Kommunikations-Tab** (`KommunikationVerlauf` von Mock → echte Daten, Kanal-/Richtungs-/Manuell-Badge, „Ausstehend" für Zukunfts-Termine), **`KommunikationLogModal`** (neu), **`KommunikationKompakt`** (neu, Übersicht-Block „Letzter Kontakt" mit Notiz-Vorschau). Tab in Panel + Vollansicht.

### „Letzter Kontakt" durchgängig + Typo-Kanon
- Neu-in-Pipeline-Kacheln + LeadListRow zeigen `contacts.last_contacted_at` statt `deal.created_at`; „vor 0 Tagen" unterdrückt (erst ab 1 Tag); Sublabel „Letzter Kontakt"/Spalten-Überschrift „ZULETZT".
- **LeadListRow** komplett auf `typo-*`-Primitive gehoben + in den Audit-`IN_SCOPE` aufgenommen (erzwungen).

### Pipeline Task-Liste — echt verdrahtet
- Mapper `dealToStagnatedCard` / `dealToNoTaskCard`.
- `PipelineStagniertCard` / `PipelineKeineTaskCard` von Self-Mock → **prop-getrieben** (leere Liste → `null`).
- Ableitung in ScreenHunting aus **rohen** `getDeals` (neuer Prop `rawDealsData`): Stagniert = `stagnation_days >= Schwelle` (aus `settings.pipeline_stages`, Fallback 7), Keine-Task = `tasks.length === 0`.
- Badge-Zähler echt (`stagnatedItems.length + noTaskItems.length`); `['deals']`-Invalidierung nach Task-Anlegen → Keine-Task-Kachel verschwindet sofort; **Deal vorausgefüllt + readonly** im Task-Formular (`lockDeal` / `initialDealId`). Mock-Drawer + `focusedTask` entfernt.

### Heat — `score-heat-status`
- Edge Function (neu): `contacts.heat_status` aus `last_contacted_at`, Schwellen frisch aus `settings.thresholds.heat_status`, **NULL → übersprungen** (kein Fake-Heat), Update nur bei Änderung, Return `{ updated, skipped, org_id }`.
- Cron **037** (täglich 03:00 UTC, Vault-Methode) + fire-and-forget-Trigger nach `createCommunication`. **Deployed.**

---

## Noch offen / nicht gepusht (db push = Sessionstart)
- **Migration 038** (`knowledge_base`: Kommunikation protokollieren · Pipeline Task-Liste · Heat-Automatik) — geschrieben, **nicht** `db push`.
- **Migration 037** (Heat-Cron) ist bereits gepusht; 035/036 ebenfalls.
- **Vault-Secrets** `app_supabase_url` + `app_service_role_key` müssen gesetzt sein, damit die **Crons** (035/037) die Functions erreichen. Die per-Event-Trigger (`functions.invoke`) laufen auch ohne Vault.

## Nächste Schritte (Reihenfolge)
1. **db push** Migration 038 (KB) + Vault-Secrets verifizieren.
2. **Action Panels** komplett verdrahten (letzter großer Hunter-Block).
3. **[D27] Tech-Schuld** abarbeiten: `window.confirm` → shadcn `AlertDialog` (PhoneField/DetailPhoneList) · Typo-Kanon-Komponenten vervollständigen + in Audit-Scope · Inline-JSX-Blöcke (>20 Z.) als panel-blocks extrahieren.
4. **[D21] Auth/Org** — `owner_id`/`created_by`/`user_id` auto-setzen; Heat/Stagnation-Crons je echter Org statt fixer Demo-UUID.
5. **Realtime (Phase 5)** — `lib/realtime.ts` aktivieren.
6. **[D23]/[D24]** Webhook Actions + Rule Builder + org-spezifische AI-Prompts (Langfuse) — nach Settings/Auth.

## Wichtige Entscheidungen
- **Konzept-Trennung Heat ↔ Stagnation:** `heat_status` gehört zu `contacts` (aus `last_contacted_at`, `score-heat-status`); `stagnation_days` gehört zu `deals` (aus `stage_updated_at`, `score-deal-health`). `score-deal-health` schreibt **kein** `heat_status` mehr.
- **Honesty bei Heat:** `last_contacted_at` NULL → Kontakt wird übersprungen, nie auf `kalt`/`tot` gezwungen. Zukunfts-Touchpoint → „Ausstehend" statt „vor 0 Tagen".
- **`last_contacted_at` nur vorwärts** (DB-Trigger) — nie mit älterem Datum überschreiben.
- **Cron via Vault**, nicht GUC (`current_setting` → permission denied auf Hosted Supabase).
- **Pipeline-Task-Karten signal-getrieben:** leere Liste → Komponente rendert nichts (kein Platzhalter).
- **Schwellen immer aus settings** (Stagnation: `pipeline_stages.stagnation_days` · Heat: `thresholds.heat_status`) — nie hardcodiert als Quelle.
- **Wording ausgeschrieben** (`stagnatedSince`: „seit X Tagen", nicht „seit Xt").

## Offene Fragen
- **`bump_contact_last_contacted` bei Zukunfts-Datum:** ein in der Zukunft protokollierter Touchpoint schiebt `last_contacted_at` in die Zukunft (UI blendet die „ZULETZT"-Spalte dann aus, da < 1 Tag). Optional: Trigger auf `occurred_at <= now()` einschränken — offen.
- **`onTaskAnlegen` Deal-Prefill:** Deal wird vorausgewählt + readonly; eine echte Auto-Selektion eines spezifischen Deals war zuvor nicht verdrahtet — jetzt via `initialDealId` gelöst.

## Neue Komponenten in der Library
- **`KommunikationLogModal`** (`features/hunter/`) — Dialog zum Protokollieren (Kanal/Richtung/Datum+Zeit/Notiz).
- **`KommunikationKompakt`** (`panel-blocks/`) — kompakter „Letzter Kontakt"-Block für den Übersicht-Tab (3 neueste, Notiz-Vorschau).
- **`DealWonModal`** (`features/hunter/`) — nicht-blockierendes Won-Modal (Grund+Notiz).
- Refactored: `KommunikationVerlauf` (Mock → echte Daten), `PipelineStagniertCard`/`PipelineKeineTaskCard` (Mock → prop-getrieben), `LeadListRow` (typo-Kanon), `TaskFormular`/`TasksListe` (`lockDeal`/`initialDealId`).
- Edge Functions: `supabase/functions/score-deal-health/`, `supabase/functions/score-heat-status/`.

## Deferred-Items (vollständig, [D1]–[D27])
[D1]–[D20] unverändert (siehe PROGRESS.md). Neu/relevant dieser Session:
- **[D21]** Auth/Org-Wiring — `owner_id`/`created_by`/`user_id`, Org-Kontext (Crons je echter Org).
- **[D22]** Cron-Job (Stagnation) — umgesetzt (035), Eintrag dokumentiert.
- **[D23]** Custom Webhook Actions + Rule Builder (`receive-webhook`, `action_rules`).
- **[D24]** Org-spezifische AI-Prompts via Langfuse.
- **[D26]** Manuell protokollierte Kommunikation → KI-Kurzakte (AI-SDR-Phase).
- **[D27]** Technische Schuld: `window.confirm`→AlertDialog · Typo-Kanon vervollständigen · Inline-JSX extrahieren (nach Action Panels, vor [D21]).
- **[TS]** Deal-Typ ohne `product` — offener Faden.

---

## Pre-Push-Checkliste (DB-Features dieser Session: 036 communications · 037 Cron · 038 KB)
- [x] **activity_log / audit_log** — `communications` hat `audit_write`-Trigger (`trg_communications_audit`) → jeder Insert/Update/Delete im Audit-Log.
- [x] **knowledge_base** als Migration — **038** (idempotent `ON CONFLICT DO UPDATE`), nicht gepusht.
- [x] **settings statt hardcodiert** — Heat-Schwellen aus `settings.thresholds.heat_status`, Stagnation aus `settings.pipeline_stages` (Defaults nur als Fallback).
- [x] **org_id + RLS + CASCADE** — `communications`: `organization_id NOT NULL` + RLS `auth_org_id()` + `on delete cascade` (org + contact).
- [n/a] **api_usage vor AI Calls** — keine AI-Calls in dieser Session.
