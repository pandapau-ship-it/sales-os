# DB-Wiring Kickoff — Phase 3 (Hunter) — Übergabe 2026-06-16

> **An den neuen Chat:** Diese Datei ist dein Auftrag + Kontext. Self-contained.
> Branch: `feature/phase-2-hunter`. Ziel: Hunter von Mock → Supabase verdrahten.

## LIES ZUERST (in dieser Reihenfolge)
1. `CLAUDE.md` — Architektur + harte Regeln (verbindlich)
2. `PROGRESS.md` + `CHECKLIST.md` — Stand / offen
3. `docs/sales_os_db_schema_v3.md` — maßgebliches Schema
4. `docs/sales_os_edge_functions_v2.md` + `docs/sales_os_crm_felder.md`
5. `src/lib/db.ts` — Service-Abstraktion (hier wird verdrahtet)

## KONTEXT (Stand 2026-06-16)
- Stack: React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + Supabase + Vercel.
- Phase 2 (Hunter-UI) ist **fertig & rein Mock**. Letzter Commit `96a38b6`, lokal == remote, `git status` clean.
- **PR #12 ist Draft — NICHT mergen** ohne Freigabe.
- Gates (müssen durchgehend grün bleiben): `npm run build` · `npm run audit` (0 FAIL) · `npm run structure-check`.

## WAS SCHON DA IST (nicht neu bauen)
- **Service-Layer `src/lib/db.ts`** — einzige Supabase-Init via `getSupabaseClient` (env-tolerant: ohne Keys läuft Mock aus `@/data`). Bereits angelegte Funktionen u.a.:
  `getLeads` · `getContacts` · `getDeals` · `getDealWithDetails` · `getSignals` · `getTasks` · `createTask` · `updateDealStage` · `createLead` · `updateLeadStage` · `setTaskCompleted` …
  Außerdem `lib/auth.ts` · `lib/storage.ts` · `lib/realtime.ts` · `lib/queryClient.ts`.
- **Org-Konstante** `src/lib/org.ts` → `DEMO_ORGANIZATION_ID` (Übergangslösung bis Auth→Org; im Query-Key IMMER `organization_id` mitführen).
- **Alle UI-Blöcke sind datengetrieben** (exportierter Typ + Default-Mock) — echte Daten via Props rein, Mock ist nur der Default:
  - `KommunikationVerlauf.tsx` → `KommunikationItem` (+ `DEFAULT_ITEMS`)
  - `AktivitaetsVerlauf.tsx` → `AktivitaetItem`
  - `TasksListe.tsx` → `TaskItem` (intern) · `TaskFormular.tsx` → `TaskFormInitial`
  - `NotizenListe.tsx` → `NotizItem`
  - `DealsListe.tsx` + `NewDealCard.tsx` → `DealDraft` (jetzt inkl. `name` + `product`; Produktkatalog `DEAL_PRODUCTS`)
  - Empty States existieren bereits (greifen automatisch bei leeren Arrays).
- **Routing:** `App.tsx` → `"hunter"` rendert `<HunterReference/>` (Referenz-Screen). Beim Wiring auf das echte `src/components/screens/ScreenHunting.tsx` umstellen.

## HARTE REGELN (aus CLAUDE.md — einhalten)
- Komponenten importieren **nur** aus `@/lib/*` — **nie** `@supabase/supabase-js` direkt. Business-Logic **nie** im Frontend (Heat/Churn/ICP/Scores → Edge Functions).
- **Multi-Tenancy:** JEDE Tabelle `organization_id NOT NULL` + RLS-Policy + `ON DELETE CASCADE`. JWT-Claim `org_id`. Jede Query zusätzlich auf `organization_id` filtern. `organization_id` **immer** im TanStack-Query-Key.
- Kein hardcodierter konfigurierbarer Wert → `system_config` (z.B. Produktkatalog `DEAL_PRODUCTS`, Stagnations-Schwellen, Token-Budgets). Deal-Felder `name`/`product` → `deals.name`/`deals.product`.
- Jeder Write → `audit_log` (+ `activity_log` wo passend); AI-Calls nur über `lib/ai.ts` (`aiCall`) + `api_usage` prüfen.
- Server-State **nur** über TanStack Query (kein `useEffect`+`fetch`). Realtime: 1 Subscription/Ansicht, gefiltert auf org, bei Unmount schließen. Keyset-Pagination (kein OFFSET). Listen > 50 virtualisieren.
- Neue UI-Komponente → richtige Struktur (`panel-blocks/` · `features/` · `panels/`) + Barrel + CLAUDE-Tabelle + `structure-check`.

## VORGEHEN (in Reihenfolge — jeweils grüne Gates + kurze Rückmeldung, NICHT mergen)
1. **Supabase-Setup prüfen/anlegen:** `organizations` + Multi-Tenant-Basis, dann Kern-Tabellen für Hunter (`contacts`, `companies`, `deals`[+`name`,`product`], `tasks`, `communications`, `activity_log`, `signals` …) inkl. `org_id`/RLS/CASCADE + Realtime-Publication. (Migrations.)
2. **Pre-Push-DB-Checkliste** je neuer Tabelle abarbeiten (CLAUDE.md): `org_id`+RLS+CASCADE, `audit_log`, `activity_log`, `system_config` statt hardcodiert, `knowledge_base`-Eintrag.
3. **`lib/db.ts`:** `getDeals`/`getTasks`/`getSignals`/`getContacts`… real implementieren (Supabase, org-gescoped, Keyset). Schreib-Funktionen (`createTask`/`updateDealStage`/`createDeal`…) mit `audit_log`.
4. **Hunter an echte Daten hängen:** Routing `App.tsx` → `ScreenHunting`; Blöcke per Props mit Query-Daten füllen (`KommunikationItem`/`AktivitaetItem`/`TaskItem`/`NotizItem`/`DealDraft`). TanStack Query bringt Loading/Skeleton; Empty States greifen automatisch.
5. **Realtime-Subscriptions** für die 7 Live-Tabellen; Cache-Invalidierung über `lib/realtime.ts`.

## ARBEITSWEISE
Kleine Schritte; nach jedem Schritt Build/Audit/Structure-Check grün + kurze Rückmeldung. Bei riskanten/irreversiblen DB-Aktionen (Drop/Migration-Rollback) **vorher rückfragen**. PR #12 offen lassen.

**Vorher klären:** Gibt es ein verbundenes Supabase-Projekt + `.env.local`-Keys? `src/lib/db.ts` ist env-tolerant (ohne Keys → Mock). Ohne Projekt+Migrations kann nur Schema/Migrations vorbereitet, aber nicht live getestet werden.

## ERSTER SCHRITT
Bestätige, dass du `CLAUDE.md` + `src/lib/db.ts` + `docs/sales_os_db_schema_v3.md` gelesen hast, und poste einen kurzen Umsetzungsplan für **Schritt 1** (Tabellen-Liste + Migrations-Reihenfolge). **Dann STOP und auf Freigabe warten.**
