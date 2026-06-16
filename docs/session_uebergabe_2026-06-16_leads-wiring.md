# Session-Übergabe 2026-06-16 (Teil 2) — Hunter Leads-Tab auf echte DB-Daten

> Fortsetzung von `docs/session_uebergabe_2026-06-16_db-kickoff.md`.
> Branch: `feature/phase-2-hunter`. **PR #12 weiter Draft — NICHT mergen.**
> Letzter Commit dieser Session: siehe `git log` (Session-Ende-Commit).

## LIES ZUERST (neue Session)
1. `CLAUDE.md` (inkl. SESSION START → Verweis auf Deferred Logic)
2. `PROGRESS.md` → „Current Status", „Offen — Nächste Session", **„Offene Konzept-Entscheidungen / Deferred Logic"**
3. `docs/sales_os_db_schema_v3.md` · `src/lib/db.ts` · `src/lib/hunterMappers.ts`

## Was heute fertig wurde
- **Live-Setup:** `.env.local` (anon-Key, Projekt `qhcmruprfjunalgrhgcp`) → `db.ts` Live-Modus.
  Test-User `test@gosherloq.dev` / `Test1234!` (`public.users`, Demo-Org, role owner). Demo-Seed
  (5 companies / 8 contacts / 3 leads / 6 deals) — vom User im Supabase-SQL-Editor ausgeführt.
- **Migrationen 013 + 014** remote appliziert (knowledge_base + Audit-Trigger · deals.product).
- **Hunter Leads-Tab komplett auf echte Daten:**
  - `getContacts` (org-gescoped, Company-Name eingebettet mit FK-Hint `!company_id`).
  - Neuer Mapper `src/lib/hunterMappers.ts` (`contactRowToLead`).
  - `ScreenHunting` Leads-Tab via TanStack Query (`HunterReference`), Loading-Skeleton + Error.
  - Zeile zeigt echt: Name · Jobtitel · Firma (Initiale, ausgeblendet wenn keine Firma) · ICP ·
    **Heat** (DB-Enum → Badge-Farbe) · **Lifecycle-Status** (`contact_status` → Neu/Aktiv/In Pipeline/
    Kunde/Inaktiv/Opt-out) · „vor X Tagen" (`last_contacted_at`, NULL → nichts). Heading „STATUS".
- **2 Bugfixes:** getContacts-Embed-Mehrdeutigkeit (PGRST201) · `useModules` 404 (`user_modules`
  existiert nicht → `getModules`/`settings.modules` via TanStack; Demo-Org `farmer:true` gesetzt).
- **Deferred-Logic-Doku** (D1–D5) in PROGRESS + CLAUDE-Verweis.

## Was noch offen ist (Reihenfolge — siehe PROGRESS „Offen")
- **A. Pipeline-Tab auf echte `deals`** (`getDeals`, Stage/Owner/Value in **Cent→/100**, `deals.product`;
  Stagnations-Block kehrt hier zurück, Deferred [D4]).
- **B. 820px-Info-Panel** an echte `contacts`/`companies`-Felder + Tabs an echte Tabellen.
- **C. Realtime** (`lib/realtime.ts`) + Cache-Invalidierung.
- **D. Restliche Mock** (Signals/Follow-ups/Overview) + AddSdrLeadPanel/Snooze (Writes/Edge Functions).

## Wichtige Entscheidungen heute
- **Heat & Lifecycle = reine Anzeige-Maps** in `hunterMappers.ts` — Werte werden NICHT berechnet
  (Edge Functions später, Deferred [D1]/[D5]). Heat-Farben kanonisch: heiss=Engaged/**grün**, tot=Gone/grau.
  **Rot bleibt Warnungen vorbehalten** (kein Rot in der Kontaktzeile).
- **Lifecycle-Labels** aus `contact_status`: opt_out = **eigener Zustand** (rechtlicher Hard-Block),
  nicht mit „Inaktiv" verschmelzen. Unbekannt → kein Badge.
- **„XT in Stage"/Stagnation** ist ein **Deal**-Konzept → aus der Kontaktzeile entfernt, gehört in Pipeline.
- **i18n:** dedizierter Key `hunter.leadCard.statusLabel` (geteilter `hunter.common.stage` unberührt).
  Neue Keys nur in `de.json` (en/es via `fallbackLng=de`).
- **deals.product nullable, kein Default, kein FK** (Produktkatalog `products` kommt später separat).

## Offene Fragen (in Deferred Logic dokumentiert)
- [D1] Lifecycle: löst `contact_status` ab oder eigenes `lifecycle_stage`-Feld?
- [D3] Sollen `opt_out`/`archiviert`-Kontakte im Leads-Tab erscheinen oder rausgefiltert werden?

## Neue Komponenten / Library
- **Keine neue UI-Komponente.** Einziges neues Modul: `src/lib/hunterMappers.ts` (lib-Mapper,
  korrekt platziert; kein panel-block, daher kein Barrel-/Komponententabellen-Eintrag).
- `structure-check` grün.

## Umgebungs-Hinweis
- **Preview-MCP in dieser Umgebung defekt** (`EPERM: uv_cwd`) → kein Live-Browser-Snapshot möglich.
  Verifikation lief über Build/Audit/REST + visuellen Gegencheck durch den User. Dev-Server bei Bedarf
  via `npm run dev` (Port 5173); `.env.local` wird beim Start gelesen (Reload nach Code-Änderung).

## knowledge_base — Eintrag (im SQL-Editor ausführen, Demo-Org)
```sql
insert into knowledge_base (organization_id, feature, what, how, value, module) values (
  '00000000-0000-0000-0000-000000000001',
  'Hunter Leads-Liste (Live)',
  'Zeigt deine Leads als Live-Liste aus dem CRM: Name, Firma, Jobtitel, ICP-Score, Heat-Status und Lifecycle-Status (Neu/Aktiv/In Pipeline/Kunde) je Kontakt.',
  'Hunter öffnen → Tab „Leads". Jede Zeile zeigt den Kontakt mit Firmen-Initiale, ICP-Donut, Heat-Badge und Status; Zeile aufklappbar für Kurzakte/Deal/Verlauf.',
  'Du siehst auf einen Blick, welche Leads heiß sind und wo sie im Funnel stehen — ohne Tabellen zu pflegen. Spart tägliche CRM-Sucharbeit und sorgt dafür, dass kein warmer Lead liegen bleibt.',
  'hunter'
);
```
