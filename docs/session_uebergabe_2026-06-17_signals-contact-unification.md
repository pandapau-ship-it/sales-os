# Session-Übergabe 2026-06-17 (Teil 2) — Signals-Tab live + Kontakt-Datenvereinheitlichung

> Fortsetzung von `docs/session_uebergabe_2026-06-17_pipeline.md`.
> Branch: `feature/phase-2-hunter`. **PR #12 weiter Draft — NICHT mergen.**

## LIES ZUERST (neue Session)
1. `CLAUDE.md` → **„KONTAKT-DATENVEREINHEITLICHUNG"** (Service-Abstraktion) + SESSION START (Deferred Logic).
2. `PROGRESS.md` → Current Status · „Offen" · **Deferred Logic [D1]–[D15]**.
3. `src/lib/hunterMappers.ts` (zentrale Auflösung) · `src/lib/db.ts` (Embeds) · `src/lib/constants.ts` (Signal-Meta).

## Was diese Session fertig wurde
- **Signals-Tab datengetrieben (S-0…S-2):**
  - S-0: i18n-Text-Templates je `signal_type` + `constants.SIGNAL_TYPE_META` (Icon/Channel-Label) + `settings.signal_windows`
    (Migr. 018) + `resolveSignalText`.
  - S-1: Signals-Seed (Migr. 019).
  - S-2: `getSignals` + `signalToCardProps`; `LinkedinSignalCard` heat/icp/channel prop-driven; Bulk-Select auf echte `signals.id`.
- **Kontakt-Datenvereinheitlichung (Slices A,1–5):**
  - **`contactToProfile(contact)` = Single-Source** für Name/Jobtitel/Firma/Initialen/ICP/Heat/Status. Alle drei Mapper
    (`contactRowToLead`, `dealToPipelineRow`, `signalToCardProps`) ziehen daraus — kein eigenes Herleiten mehr.
  - **Heat-Fix:** Pipeline-Heat jetzt aus `contacts.heat_status` (vorher fälschlich `deals.heat_status`).
  - **Stage zentral:** `latestActiveDeal()` / `contactActiveStage()` (zuletzt aktiver, nicht-terminaler Deal). Signals zeigt
    die aktive-Deal-Stage; Pipeline = konkreter Deal; Leads = Status.
  - **Cleanup:** Migr. 020 entfernt das kontaktlose Test-Signal (Fall existiert real nicht).
  - **Regeln in CLAUDE.md verankert.**

## DB-Stand
- Migrationen **001–020 remote applied** (018 signal_windows · 019 signals-seed · 020 remove contactless signal).
- knowledge_base-Einträge via Migration (015–017).

## Wichtige Entscheidungen / Regeln (jetzt in CLAUDE.md)
- `contactToProfile` ist die EINZIGE Quelle der Kontakt-Identitäts-/Statuswerte (gilt auch für Farmer/AI SDR).
- Heat IMMER aus `contacts.heat_status`, nie aus dem Deal.
- Stage = Deal-Eigenschaft; kontaktzentriert → `contactActiveStage` (zuletzt aktiver Deal); Leads = Status.
- „Zuletzt aktiver Deal" = jüngster nicht-terminaler (`stage ∉ {gewonnen, verloren}`, `closed_at IS NULL`);
  Recency `updated_at` → `stage_updated_at` → `created_at`; keine offenen Deals → keine Stage (unsichtbar).
- Universell: kein Wert → Element unsichtbar (Ausnahme Heat: immer echter Wert).

## Was noch offen ist
- **B. 820px-Info-Panel** an echte `contacts`/`companies` (nächster Kandidat).
- **C. Realtime** (`lib/realtime.ts`).
- **[D15]** Follow-ups + Neu-in-Pipeline (noch Mock) erben `contactActiveStage`/`contactToProfile` erst beim Daten-Wiring.
- Übrige Deferred [D1]–[D14] (berechnete Werte/Edge Functions, Stagnation/Task-Logik, Lifecycle-Automatik …).

## Offene Fragen
- [D1] Lifecycle ablösen vs. eigenes Feld · [D3] opt_out/archiviert-Filter · [D6] Org-Provisionierung (knowledge_base + signal_windows).

## Neue Komponenten / Library
- **Keine neue UI-Komponente.** Erweitert: `lib/hunterMappers.ts` (`contactToProfile`, `latestActiveDeal`, `contactActiveStage`,
  `signalToCardProps`, `resolveSignalText`), `lib/constants.ts` (`SIGNAL_TYPE_META`). Bestehende panel-blocks modifiziert.
  Structure-Check grün.

## Umgebungs-Hinweis
- Preview-MCP defekt (`EPERM: uv_cwd`) → kein Live-Browser-Snapshot; Verifikation via Build/Audit/REST. Dev-Server: `npm run dev` (5173).
