# Session-Übergabe — 2026-06-27

> Spanne: seit `docs/session_uebergabe_2026-06-25.md`.
> **Aufräum-/Wartungs-Session** — kein neues Feature, keine neue Komponente, kein DB-Wiring,
> keine neue Regel. Zwei kleine Chores + die ausstehende db-push-Operation aus der Vorsession.

---

## 1. Was seit der letzten Übergabe fertig wurde

### Farmer Slice 4 — CustomerDrawer aus dem Farmer-Pfad entfernt
- In `ReferenceScreens.tsx → FarmerReference` war noch `<Drawer s={s}/>` (alter `CustomerDrawer`) +
  `onSelectCustomer={s.selectPerson}` gerendert — öffnete aber **nie**, weil `ScreenFarming` die Prop
  als unbenutzt aliased hatte und intern `FarmerSidepanel` öffnet.
- **Entfernt:** `<Drawer>` aus `FarmerReference`; `onSelectCustomer` komplett aus den `ScreenFarming`-Props
  (Interface + Destrukturierung) gestrichen — war voll toter Code.
- **CustomerDrawer bleibt bestehen** und importiert — wird weiter gerendert von **MeinTag**
  (`onPersonSelect`→`selectById`, **aktiv**, hat kein eigenes Panel) und **Hunter** (`<Drawer>` noch da;
  Hunter routet intern auf `HunterSidepanel`, CustomerDrawer dort ebenfalls toter Rest — bewusst
  out-of-scope gelassen). Endgültiges Löschen erst, wenn MeinTag/Hunter migriert sind.

### Repo-Hygiene — `supabase/.temp/` aus dem Git-Tracking
- `supabase/.temp/` (Supabase-CLI-Cache, wird bei jedem `db push`/`link` verändert) war getrackt (9 Dateien)
  und tauchte bei jedem `git add -A` auf.
- **`git rm -r --cached supabase/.temp/`** + Eintrag in `.gitignore` → nicht mehr versioniert, erscheint
  nicht mehr in `git status`. Dateien bleiben lokal auf Disk.

### Operatives (aus der 2026-06-25-Session nachgezogen)
- **Migration 047** (KB Farmer-Panels) via `supabase db push` remote angewendet → remote jetzt auf **047**.
- Remote-Branch `chore/session-2026-06-25` gelöscht.

---

## 2. Geänderte Dateien (Code)
| Datei | Änderung |
|---|---|
| `src/components/reference/ReferenceScreens.tsx` | `<Drawer s={s}/>` + `onSelectCustomer`-Prop aus `FarmerReference` entfernt (+ Kommentar) |
| `src/components/screens/ScreenFarming.tsx` | `onSelectCustomer` aus Props-Interface + Destrukturierung entfernt (toter Code) |
| `.gitignore` | `supabase/.temp/` ergänzt |
| `supabase/.temp/*` (9) | aus Git-Tracking entfernt (`--cached`) |

Keine neuen Komponenten → `src/components/index.ts` / „Verfügbare Komponenten" unverändert.
`npm run structure-check` grün.

---

## 3. Gates
- `npm run build` ✓ · `npm run audit` ✓ (0 harte Verstöße, 4 bekannte WARN) · `npm run structure-check` ✓ (PASS).

---

## 4. Was noch offen ist (Reihenfolge — unverändert zur 2026-06-25-Liste)
1. **Farmer DB-Wiring** — echte Scores/Signale/Subscription. **Zuerst [D43] Historisierung** (Snapshot-/
   Event-Tabellen + Cron). Beim Wiring nachziehen: **KI-Kurzakte-Block** + **AktiveSignale-Flags** an echte
   Felder koppeln (PROGRESS [D47]).
2. **Hunter Trial-Kacheln [D36]/[D37]** (erst nach Farmer komplett).
3. **Lifecycle-Trigger [D38]** (trial → kunde).
4. **[D29]** Einladungs-Mail Edge Function.
5. **AI-Pipeline [D5]** — löst alle „Folgt"-Platzhalter.
6. **[D40]** automation_rules Schema-Korrektur (mit Automation-Settings-UI).
7. **[D41]** Marketing/SherloqSystem Soft-Card-Sweep · **[D42]** TaskDrawer → `sheet`.
8. **[D45]** Deeplink-Highlight inkrementell an weiteren Sprung-Stellen.
9. **[D44]** TanStack-Table-Fundament bei Kontakte/Companies.
10. **Aufräum-Rest:** CustomerDrawer ganz entfernen, sobald MeinTag + Hunter auf eigene Panels migriert sind.

> **db push:** Nichts offen — remote ist auf **047**, keine neue Migration in dieser Session.

---

## 5. Wichtige Entscheidungen
- **CustomerDrawer wird nicht gelöscht**, nur aus dem Farmer-Pfad entkoppelt — MeinTag nutzt ihn aktiv,
  Hunter rendert ihn noch. Vollständiges Entfernen ist ein eigener späterer Schritt (nach Migration beider).
- **`supabase/.temp/` gehört nicht ins Repo** (per-clone CLI-Cache) → dauerhaft ignoriert.

---

## 6. Offene Fragen
- Keine.

---

## 7. Neue Library-Komponenten
- Keine. (Reine Aufräum-Session.)

---

## 8. Deferred-Items (vollständig, unverändert)
[D1]–[D31] · [D32] (bewusste Lücke) · **[D33] Farmer-Info-Panel ✅ gebaut (Mock; CustomerDrawer aus
Farmer-Pfad raus, Slice 4)** · **[D34] Farmer-Action-Panel ✅ gebaut (Mock, Option A)** · [D35]
Signal-Action-Resolver Phase 0 (erledigt) · [D36]/[D37] Hunter Trial-Kacheln · [D38] Lifecycle-Trigger ·
[D39] Farmer „Kunde wird kalt" (Teil von [D46]) · [D40] automation_rules Schema · [D41]
Marketing/SherloqSystem Soft-Card-Sweep · [D42] TaskDrawer → `sheet` · [D43] Historisierung (Doku) ·
[D44] Flexible Daten-Tabellen (Doku) · **[D45] Deeplink-Highlight** (Muster + erste Anwendung; inkrementell
weiter) · **[D46] Farmer Follow-ups ✅ gebaut (Mock)** · **[D47] Farmer Vollansicht ✅ gebaut (Mock)**.
(Details je Eintrag in PROGRESS.md → „Deferred Logic".)
