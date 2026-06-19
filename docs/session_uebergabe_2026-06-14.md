# Session-Übergabe — 2026-06-14

**Branch:** `feature/phase-2-hunter` · **Phase:** 2 (Hunter UI) · **Status:** Build grün · Audit 0 FAIL · alles Mock (kein DB-Wiring)
**Letzter Commit:** `bc46b49`

---

## ✅ Heute fertig

**Vormittag (Teil 1)**
- Komponenten-Struktur (`panels/` · `panel-blocks/` · `features/[modul]/`) + CLAUDE.md-Pflicht.
- `AddSdrLeadPanel` (Popup → Action-Side-Panel, Progressive Disclosure, Owner-Pflicht, Stage↔Deal-Kopplung).
- Heat-Status neu (Engaged/Warm/Cooling/Cold/Gone, zentral in `lib/constants.ts`, Tokens Light+Dark, Dot-Kreis).
- `HeatBadge` + `StageBadge` (panel-blocks, randlos, app-weit) + Audit-Check „keine alten Heat-Labels".
- Snooze (Regelwerk, 3 Zustände in Follow-up-Kacheln, `SnoozeSettings`-Design).
- knowledge_base als Seed-Datei; `value`-Feld kundenorientiert (Regel).

**Nachmittag (Teil 2)**
- **Navigation zentralisiert** — `src/lib/navBehavior.ts` (`NAV`): Top-Nav · Hunter-/Farmer-Sub-Nav · Sidebar lesen aus EINER Quelle. Top-Nav `rounded-full`-Pills (+30px oben, größere Schrift/Padding), Sub-Navs kompakt (`NAV.subTab`), Sidebar stärker abgerundet. CLAUDE.md-Regel + Radius-Hierarchie angepasst.
- **Erledigt-Aktion** — zentrale `panel-blocks/ErledigtAction` (Button + shadcn Popover, RadioGroup „Was hast du gemacht?" + immer sichtbares Notizfeld). Einmal in `ChatActionPanel` → erscheint in Signal/Stagniert/Kalt. shadcn `radio-group` ergänzt.
- **Popover-Fokus-Fix (systemweit)** — `ui/popover` `portal`-Prop; Eingaben in Popovern innerhalb modaler Sheets sind jetzt tippbar (Kontaktfelder `EditableInline`/`PhoneField` + Erledigt-Notiz auf `portal={false}`). Neuer Audit-Check „Popover-Eingabe fokussierbar" (FAIL) + CLAUDE.md-Regel.
- **AI-Chat Guardrails & Restriktionen** dokumentiert (CLAUDE.md §9) + **Red-Team-Gate** (`npm run redteam`, Phase 7) geplant.

---

## 🔧 Noch offen

- **Vollansicht (Kontakt-Detail, Vollbild) NEU bauen** — erster Entwurf (`ScreenVollansicht` + 13 `Voll*`-Blocks) wurde **bewusst verworfen + gelöscht** (`bc46b49`). Neu: aus `panel-blocks/` komponieren, Tokens-only, über ↗ im Info-Panel öffnen. Atome bleiben: `KontaktZeile`/`PanelTabs`/`HeatBadge`/`StageBadge`/`KiKurzakte`.
- Snooze · `SnoozeSettings` · `AddSdrLeadPanel` verdrahten (system_config / Edge Functions); `SnoozeSettings` noch nicht gemountet (kein Settings-Screen).
- Empty/Loading-States für alle Hunter-Tabs.
- AI-Chat **Red-Team-Gate** (`scripts/redteam-aichat.ts`) bauen — Phase 7.
- DB-Wiring Phase 3 (Mock → echte Queries, RLS, TanStack Query, Realtime).
- PR #12 (Draft) offen lassen — nicht mergen ohne Freigabe.

---

## ➡️ Nächste Schritte (Reihenfolge)

1. **Vollansicht neu bauen** (aus panel-blocks, über ↗ verdrahtet).
2. Settings-Screen-Grundgerüst + `SnoozeSettings` einhängen.
3. Empty/Loading-States ergänzen.
4. DB-Wiring Phase 3 starten (`organizations`+RLS → Queries → TanStack Query).
5. Snooze/AddSdrLead/Settings + Erledigt verdrahten (`system_config`, Edge Functions, Kurzakte-Insert).
6. AI-Chat (Phase 7): Guardrails umsetzen + Red-Team-Gate ins Merge-Gate.

---

## 🧭 Wichtige Entscheidungen heute

- **Navigation = eine Stilquelle** (`NAV`), Top-Nav als Pill (`rounded-full`) — bewusst die alte „nie rounded-pill für Nav"-Invariante für die Top-Nav ersetzt (neueste Entscheidung gewinnt → CLAUDE.md angeglichen).
- **Erledigt gehört ins Action-Panel** (bei der AI-Empfehlung), NICHT in den Chat/Composer — und nicht in den „Kein Task"-Panel (kein Entwurf). Eine Quelle → alle Panels.
- **Popover-Eingabe-Regel:** Popover mit Input/Textarea im modalen Sheet → `portal={false}` (sonst Fokusfalle). Per Audit erzwungen.
- **Vollansicht-Erstentwurf verworfen** — wird neu gebaut.
- **knowledge_base `value` = Kundennutzen/Pitch** (nie technisch).
- Heat-Daten-Enum bleibt; neue Labels via Bridge `heatFor()`. `--color-muted` zu Heat-„Gone"-Grau umgewidmet. Audit-Verbot alter Heat-Labels **ohne „Aktiv"** (legit Abo-/Task-Status).

---

## ❓ Offene Fragen (noch nicht entschieden)

- **Vollansicht:** finaler Aufbau/Design + ob die bestehenden Info-Panel-Blöcke (KiKurzakte etc.) 1:1 wiederverwendet werden (Inhalt ändert sich) oder eigene Blocks bekommen.
- **KiKurzakte:** sollen „Aktualisieren"-Button + hervorgehobener „Next Step" zentral in `KiKurzakte` ergänzt werden (wirkt dann auch im Info-Panel)?
- **`SnoozeSettings` / Automation-Settings:** wo wird der Settings-Screen platziert (eigener Screen vs. Sektion)?

---

## 📋 Pre-Push Checkliste (DB-Features)

Heute **keine** DB-Features — alles UI/Design/Doku. Daher:
- activity_log → **n/a** · audit_log → **n/a**
- knowledge_base → **✓** (Seed `docs/knowledge_base.md`, heute als SQL-Inserts ergänzt)
- system_config statt hardcodiert → **✓** (Snooze-Limits als Defaults mit Kommentar; Nav-Werte sind reine UI-Tokens)
- organization_id + RLS + CASCADE → **n/a** (keine neue Tabelle)
- api_usage vor AI Calls → **n/a** (keine AI Calls)

→ Keine offene DB-Pflicht.
