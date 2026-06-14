# Session-Übergabe — 2026-06-14

**Branch:** `feature/phase-2-hunter` · **Phase:** 2 (Hunter UI) · **Status:** Build grün · Audit 0 FAIL · alles Mock (kein DB-Wiring)
**Letzter Commit:** `4e2bbd9` (vor den Session-Ende-Checks)

---

## ✅ Heute fertig geworden

1. **Komponenten-Struktur eingeführt** (`panels/` · `panel-blocks/` · `features/[modul]/`) + als CLAUDE.md-Pflicht verankert.
2. **AddSdrLeadPanel** — „+ SDR Lead hinzufügen" von Popup → **Action-Side-Panel (50vw)**, komponiert aus `panel-blocks/` (`PanelField` · `PhoneNumbersField` · `NewDealCard`). **Progressive Disclosure** (3 Stufen), Pflichtfelder Owner·Vorname·Nachname·E-Mail/LinkedIn·Firma, Stage↔Deal-Kopplung mit Hinweis-Banner.
3. **Heat-Status neu** — Engaged/Warm/Cooling/Cold/Gone, zentral in `src/lib/constants.ts` (`HEAT_STATUS` + Bridge `heatFor()`), Farb-Tokens Light+Dark, app-weit ersetzt, Dot-Kreis statt `●`.
4. **HeatBadge + StageBadge** (`panel-blocks/`) — randlos, Hintergrund 10% Opacity, Dot+Text, `rounded-full`; app-weit verdrahtet; neuer Audit-Check „keine alten Heat-Labels"; CLAUDE.md Badge-Regel.
5. **Snooze** — Regelwerk + `system_config`-Keys in CLAUDE.md; **3 Zustände interaktiv** in den Follow-up-Kacheln (Mock-State); Settings-Sektion `SnoozeSettings` (Design).

**Neue Dateien:** `panels/{InfoPanel,ActionPanel}` · `panel-blocks/{PanelField,PhoneNumbersField,NewDealCard,HeatBadge,StageBadge}` · `features/hunter/AddSdrLeadPanel` · `features/settings/SnoozeSettings` · `lib/constants.ts` · `docs/knowledge_base.md`.

---

## 🔧 Noch offen

- **Nicht gemountet:** `SnoozeSettings` (es gibt noch keinen Settings-Screen). Einhängen, sobald Settings → Automation existiert (`<SnoozeSettings />`).
- **Reine UI/Mock, Logik fehlt:** Snooze-State, AddSdrLeadPanel-Speichern, SnoozeSettings-Speichern → beim DB-Wiring an Edge Functions / `system_config` hängen.
- **Empty States** für alle Hunter-Tabs (aktuell keine).
- **DB-Wiring (Phase 3):** Mock → echte Queries, `organizationId`/`userId`, TanStack Query, Realtime, Routing `HunterReference` → echtes `ScreenHunting`.
- **PR #12** (Draft) offen lassen — **nicht mergen** ohne Freigabe.

---

## ➡️ Nächste Schritte (in Reihenfolge)

1. **Empty/Loading-States** für Hunter-Tabs ergänzen (vor DB, damit DB-Wiring sie direkt füllt).
2. **Settings-Screen-Grundgerüst** anlegen und `SnoozeSettings` einhängen.
3. **DB-Wiring Phase 3 starten:** `organizations`/Kerntabellen + RLS, dann `getDeals`/`getSignals`/`getPipelineSettings`, TanStack Query.
4. **Snooze + AddSdrLead + Settings verdrahten:** `system_config`-Keys (`snooze_max_count`/`_days`/`_escalation_type`) anlegen, Edge Functions für Lead-/Deal-Anlage.
5. Heat-/Stage-Berechnung in Edge Functions (nie im Frontend) — `score_heat_status()`.

---

## 🧭 Wichtige Entscheidungen heute

- **Heat-Daten-Enum bleibt** (`HOT/WARM/LUKEWARM/COLD/DEAD`); die neuen Labels/Keys (engaged…) werden via Bridge `HEAT_KEY_BY_STATUS`/`heatFor()` gemappt — kein invasiver Datenumbau.
- **`--color-muted` umgewidmet** zu Heat-„Gone"-Grau (das ungenutzte `bg-muted`-Utility aus `@theme inline` entfernt); `text-muted-foreground` unberührt.
- **Audit-Verbot ohne „Aktiv":** Die Spec listet 8 alte Heat-Labels — „Aktiv" wurde **bewusst ausgenommen**, weil es legitim für Abo-/Task-/Sequence-Status genutzt wird (CLAUDE.md schreibt Subscription „Aktiv" vor). Verboten sind 7: Kalt/Stabil/Rückläufig/Ruhend/Hot/Lukewarm/Dead. Dokumentiert in Audit-Kommentar + CLAUDE.md.
- **Snooze ins echte Follow-up-Kachel** statt Standalone-Demo (auf Wunsch); Limits (3 / 7T) als benannte Defaults mit „später aus system_config".
- **Badges grundsätzlich randlos** (10%-Hintergrund + Dot + Text) — Border nur noch für Buttons/Cards/Inputs (CLAUDE.md Badge-Regel).

---

## 📋 Pre-Push Checkliste (DB-Features)

Heute **keine** DB-Features — alle Änderungen sind UI/Design/Doku. Daher:

- ☐→ **n/a** activity_log — keine DB-Schreibvorgänge
- ☐→ **n/a** audit_log — keine DB-Schreibvorgänge
- ☑ knowledge_base — als Seed-Datei `docs/knowledge_base.md` angelegt (DB folgt Phase 5)
- ☑ system_config statt hardcodiert — Snooze-Limits als benannte Defaults mit Kommentar „später aus system_config" (Mock-Phase, kein Runtime-Config nötig)
- ☐→ **n/a** organization_id + RLS + CASCADE — keine neue Tabelle
- ☐→ **n/a** api_usage vor AI Calls — keine AI Calls

→ Keine offene DB-Pflicht. Push erlaubt.
