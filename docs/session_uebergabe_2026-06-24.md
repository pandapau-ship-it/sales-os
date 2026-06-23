# Session-Übergabe — 2026-06-24

> Spanne: seit `docs/session_uebergabe_2026-06-23.md`. Schwerpunkt: **app-weites Elevation- &
> Radius-System** (Konsistenz-Sweep + drei Audit-Wächter). Zusätzlich: gestrige Session
> (`chore/session-2026-06-23-farmer`) nach `main` konsolidiert.

---

## 1. Was diese Session fertig wurde

### Elevation-System (CLAUDE Design Invariants)
- **3 Ebenen, nie mischen:** Base (Tabellen/Listen — nur Zeilen-Trenner) · Card (Seiten-Kachel =
  `border-card` + `shadow-card` + `hover:shadow-hover` · **In-Panel-Box = nur `border-card`, KEIN
  Schatten**) · Float (Panel/Dropdown/Toast = `shadow-dropdown`). Grundsatz: **Elevation einmal pro
  Kontext**, Trennung innen via Haarlinie + Weißraum + Label, nie Schatten-im-Schatten.
- Token **`--border-card` 0.07 → 0.11** (light) / 0.06 → 0.10 (dark) — spürbare Haarlinie.
- Neue Quellen in `componentBehavior.ts`: **`CARD_PANEL`** (In-Panel-Box) + **`TABLE`** (container/header/row).

### Sweep (alle In-Panel-Boxen + Container + Tabelle)
- panel-blocks: DealsListe · DealSetup · NewDealCard · OffeneTasks · KommunikationVerlauf/Preview/Kompakt ·
  AktivitaetsVerlauf · NotizenListe · TasksListe · KiKurzakte · MailComposer · TaskFormular ·
  TaskAnlegenForm · ExpandedCardContent · KontaktZeile · AktiveSignale → border-card, Schatten raus.
- `DetailSection` mit `variant="panel"|"page"` (Vollansicht = page mit Schatten).
- **Pipeline-Tabelle** → `TABLE.container/header/row`. **KPI/Kanban/Übersicht-Container**
  (KpiCard, Kanban-Spalten/Deal-Karten, FunnelAnalysis, FarmerHealthOverview, MeinTag) → Ebene 1 (Rahmen + Schatten).
- CustomerDrawer: Karten `rounded-[14px]→[12px]`, border-border→border-card, `--shadow-panel` (ungenutzt) entfernt.
- **Feld-Labels Mono → Sans** (`typo-field-label`, Single Source → alle 7 Nutzer; CLAUDE Typo-Kanon angeglichen).
- 4 echte Verstöße in AI-SDR-Drawern gefixt (TaskEntwurfForm ×2, TaskDrawer, AddSdrLeadPanel).

### Radius-System
- Hierarchie offiziell um **8px** (Inputs/kleine Buttons) + **6px** (Checkboxen/Icon-Buttons/Mini-Badges).
- **Benannte Tailwind-Radien app-weit normalisiert** (`rounded-xl/2xl/lg/md` → explizite px; 15 Dateien).
  Chat-Bubble bleibt asymmetrisch via expliziter px (`rounded-[16px] rounded-tr-[6px]`).

### Audit-Wächter (FAIL) — `scripts/audit.ts`
- „Elevation: keine rohen Shadow-Stufen" (shadow-sm/md/lg/xl/2xl + `shadow-[0…]`).
- „Elevation: Border ≠ Hintergrundfarbe" (border-`signal-*-bg` = bg).
- „Radius: keine benannten Tailwind-Radien".
- Ausnahmen sauber (Buttons/Avatare/Pills/Footer/Toasts/Tooltips/Chat-Bubbles, `ui/`). In CHECKLIST +
  CLAUDE „Pre-Commit Visual Check" verankert (`npm run audit`-Pflicht).

### Konsolidierung
- Branch `chore/session-2026-06-23-farmer` (gestern nie gemergt) → `main` gemergt: **2026-06-23-Übergabe**,
  **[D40]** automation_rules, **KB-Migration 046** sind jetzt auf main (PROGRESS-Konflikt union-aufgelöst:
  D40+D41+D42, Anker [D1]–[D42]).

---

## 2. Was noch offen ist
- **Farmer DB-Wiring** (echte Scores/Signale; [D33] Info-Panel auf typo-Standard, [D34] Action-Panel).
- **Hunter Trial-Kacheln [D36]/[D37]** + **Lifecycle-Trigger [D38]** + Farmer „Kunde wird kalt" [D39].
- **[D40]** automation_rules-Schema-Korrektur (mit Automation-Settings-UI).
- **[D41]** Marketing/SherloqSystem Soft-Card-Sweep · **[D42]** TaskDrawer → shadcn Sheet.
- **[D29]** Einladungs-Mail Edge Function · AI-Pipeline ([D5]).
- **db push Migration 046** (KB Farmer) — am Sessionstart.

## 3. Nächste Schritte (Reihenfolge)
1. **`supabase db push`** Migration 046 (am Sessionstart).
2. **Farmer DB-Wiring** (inkl. [D33]/[D34]).
3. **Hunter Trial-Kacheln [D36]/[D37]** → **Lifecycle-Trigger [D38]**.
4. Bei AI-SDR-/Automation-Phase: [D40] automation_rules-Schema + [D42] TaskDrawer-Sheet.

## 4. Wichtige Entscheidungen
- **Elevation einmal pro Kontext** — In-Panel-Boxen ohne Schatten (Panel liefert Elevation); kein Schatten-im-Schatten.
- **Feld-Labels = Sans** (Monospace nur für Werte, nie Beschriftungen).
- **Radius-Hierarchie** um 6px/8px erweitert (entspricht Realität); benannte Tailwind-Radien verboten → nur explizite px.
- **Chat-Bubble** = legitime Sonderform (asymmetrische Ecken), via expliziter px statt named radius.
- `chore/session-*`-Branches gehören nach main (Konvention) — gestriger wurde nachgezogen.

## 5. Offene Fragen
- Heat-Labels app-weit eindeutschen (aktuell kanonisch „Cold" etc.) — wann/ob? (eigener Slice)
- Signals-Tab später echte DB-Signale oder Mock bis Ingest?

## 6. Neue Komponenten in der Library
- **Keine neuen Komponenten** diese Session. Neu in `componentBehavior.ts`: Konstanten `CARD_PANEL` + `TABLE`
  (mit Kommentar-Header, Single Source). `DetailSection` um `variant`-Prop erweitert.

## 7. Deferred-Items (vollständig)
[D1]–[D31] · [D32] bewusste Lücke · [D33] Farmer Info-Panel typo-Standard · [D34] Farmer Action-Panel ·
[D35] Signal-Action-Rules (Phase 0 ✅) · [D36] Hunter „Trial läuft aus" · [D37] Hunter „Trial abgelaufen" ·
[D38] Lifecycle-Trigger Trial→Kunde · [D39] Farmer Retention „Kunde wird kalt" · **[D40]** automation_rules-Schema ·
**[D41]** Marketing/SherloqSystem Elevation-Sweep · **[D42]** TaskDrawer → shadcn Sheet. Höchster Tag: **[D42]**.

---

## 8. Pre-Push (DB-Features)
Diese Session **kein neues DB-Feature** (reines Frontend/Design-System). Einziges DB-Artefakt auf main:
KB-Migration **046** (aus der gestrigen Session konsolidiert) — **noch nicht db-gepusht** (db push am Sessionstart).
Keine neuen Komponenten → audit.ts IN_SCOPE unverändert.
