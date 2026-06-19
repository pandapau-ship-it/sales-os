# Session-Übergabe 2026-06-17 — Hunter Pipeline auf echte Deals + knowledge_base-via-Migration

> Fortsetzung von `docs/session_uebergabe_2026-06-16_leads-wiring.md`.
> Branch: `feature/phase-2-hunter`. **PR #12 weiter Draft — NICHT mergen.**

## LIES ZUERST (neue Session)
1. `CLAUDE.md` (SESSION START → Verweis auf Deferred Logic; Service-Abstraktion-Status)
2. `PROGRESS.md` → „Current Status", „Offen — Nächste Session", **„Offene Konzept-Entscheidungen / Deferred Logic [D1]–[D13]"**
3. `src/lib/db.ts` · `src/lib/hunterMappers.ts` · `docs/sales_os_db_schema_v3.md`

## Was heute fertig wurde
- **knowledge_base-Schreibweg = Migrationen** (Entscheidung): pro Feature/Batch eine additive, idempotente
  Migration (`UNIQUE(org,feature)` + `ON CONFLICT DO UPDATE`). **`015`** (Constraint + Leads-Tab-Eintrag),
  **`016`** (19 Backlog-Einträge aus `docs/knowledge_base.md`) — beide **remote applied**.
  **`017`** (3 Pipeline-Einträge: Listenansicht · Kanban · Filter) — **geschrieben, noch nicht gepusht** (du machst `db push`).
- **Hunter Pipeline-Tab auf echte `deals`:**
  - **Slice A — Liste:** `getDeals` + `getPipelineSettings` als geteilte TanStack-Queries; Mapper
    `dealToPipelineRow` → `PipelineRow`. Spalten Kontakt/Stage/Owner/Wert(**Cent→/100**)/Heat.
  - **Slice B — Kanban:** Spalten aus `settings.pipeline_stages` (slug/name/order, alle 7); Karten nach
    stageSlug gruppiert; echte Aggregate (count + Σ); ICP `null→0/grau`. Fingierte Pfeile/Pills/Badges
    ausgeblendet ([D8]–[D11]).
  - **Slice C — Filter + Owner:** `owner:users(full_name)`-Embed → echter Owner-Name; 3 client-seitige
    Filter über geteilte `dealRows`: Heat+Owner (Liste+Kanban), Stage (nur Liste). Kanban-Aggregate folgen dem Filter.
- **Ehrlichkeit:** ICP-Fake-Default `?? 87` (LeadListRow) → `?? 0`. Restliche Fake-Defaults als [D12].
- **Deferred-Logic gepflegt:** [D6]–[D13].

## Was noch offen ist (Reihenfolge — siehe PROGRESS „Offen")
- **B. 820px-Info-Panel** (`HunterSidepanel`) an echte `contacts`/`companies` + Tabs an echte Tabellen. **← nächster Kandidat.**
- **C. Realtime** (`lib/realtime.ts`) + Cache-Invalidierung.
- **D. Signals/Follow-ups/Overview + AddSdrLeadPanel/Snooze** (Writes/Edge Functions).
- **Pipeline-Reste:** Task-Liste-Ansicht [D13], Stage-Writes [D8], Stagnation/Task-Logik [D9]/[D10] — an Edge Functions gebunden.

## Wichtige Entscheidungen heute
- **knowledge_base via Migration** (nicht loses SQL): idempotent, `docs/knowledge_base.md` = Sammlung, Migration = DB-Wahrheit.
- **Geteilter Query-/Mapper-Schnitt:** Liste + Kanban teilen `getDeals` + `getPipelineSettings` + `dealToPipelineRow`.
- **Filter-Stapelung:** `baseFilteredDeals` (Heat+Owner) → Liste/Kanban; `listDealRows` (+Stage) nur Liste. **Stage wirkt nicht aufs Kanban.**
- **Kanban-Spalten aus settings.pipeline_stages**, alle 7 (verloren = leer). Terminale-Stages-UX später.
- **Owner live**, aber **nur Ein-User-getestet** ([D7]).
- **Ehrlichkeits-Linie:** keine erfundenen Default-Scores (`null → 0/grau`), keine fingierten Heat-abgeleiteten Signale.

## Offene Fragen (Deferred Logic)
- [D1] Lifecycle ablösen vs. eigenes Feld · [D3] opt_out/archiviert-Filter · [D6] knowledge_base-Provisionierung pro Org
- [D7] Owner Multi-User-Verhalten (erst mit Team-Setup)

## Neue Komponenten / Library
- **Keine neue UI-Komponente.** `src/lib/hunterMappers.ts` erweitert (`dealToPipelineRow`, `PipelineRow`) — lib-Mapper, korrekt platziert.
- `structure-check` grün.

## Umgebungs-Hinweis
- **Preview-MCP defekt** (`EPERM: uv_cwd`) → kein Live-Browser-Snapshot; Verifikation via Build/Audit/REST + User-Gegencheck.
  Dev-Server: `npm run dev` (Port 5173), `.env.local` wird beim Start gelesen.

## Noch zu tun von dir
- `supabase db push` für **Migration 017** (3 Pipeline-knowledge_base-Einträge).
- Optional Count gegenchecken: `select count(*) from knowledge_base where organization_id = '00000000-0000-0000-0000-000000000001';` → erwartet **23** (1 Leads + 19 Backlog + 3 Pipeline).
