# Session-Übergabe — 2026-06-16 (Teil 2)

**Branch:** `feature/phase-2-hunter` · **Phase:** 2 (Hunter-Screen, UI/Mock) · **PR #12** (Draft, NICHT mergen)
**Gates:** `npm run build` · `npm run audit` · `npm run structure-check` — alle grün.
**Scope:** reine UI/Mock, **kein DB-Wiring**. Alle neuen Listen sind datengetrieben (`*Item`-Typen + Default-Mock) → echte Daten später 1:1 einspielbar.

---

## 1. Was heute fertig wurde

**Hunter Info-Panel — Tabs ausgebaut**
- **Kommunikation** → vertikaler **Zeitstrahl** mit grüner Verbindungslinie, direkt aufgeklappt, medium-spezifische Karten (Mail = E-Mail-Frame · LinkedIn = Chat-Bubble · Call = Call-Log · Meeting · Notiz). Karten einheitlich weiß.
- **Aktivität** → System-**Aktivitäts-Feed** (Deal angelegt + Kurzinfo/Datum, Stage-Wechsel, Task an/erledigt, Heat, Sequenz, Kontakt angelegt) mit Akteur — ab Tag 1 aus `activity_log` abbildbar.
- **Tasks** → Checkbox raus · aufklappbare Read-Only-Details · Bearbeiten/Löschen on-hover · „Neue Task"/Bearbeiten öffnen den neuen Block **`TaskFormular`** (Maske ohne Kontext-/KI-Meldungen). **`TaskAnlegenForm`** (NoTaskDrawer) nutzt jetzt denselben `TaskFormular` → eine Quelle.
- **Notizen** → Speicher-Icon raus · Inline-Composer („Neue Notiz") · Inline-Edit · **Datum + Uhrzeit** + Autor je Notiz.
- **Deal-Tab (neu)** → Block **`DealsListe`** (listet Deals, Bearbeiten/Löschen on-hover) + „Neuer Deal" über das geteilte **`NewDealCard`**-Formular.

**Übersicht interaktiv**
- Deal-Karte (`DealSetup`): Hover-Stift → Deal-Tab öffnet die Bearbeiten-Kachel direkt; Count-Badge bei mehreren Deals → Deal-Tab.
- Tasks (`OffeneTasks`): Checkbox raus, Hover-Aktionen (Bearbeiten/Löschen/**Erledigt**), Klick auf Kachel → Tasks-Tab, Stift → Task direkt im Edit.

**Footer-Quick-Actions** — LinkedIn → **Deal**; jeder Button öffnet sein Anlege-Panel: Task/Deal/Notiz im jeweiligen Tab, **Mail** = neuer Block **`MailComposer`** im Kommunikation-Tab.

**Deals global erweitert** — `DealDraft` + `name` + `product`; `NewDealCard` mit **Deal-Name**-Feld + **Produkt-Dropdown** (`DEAL_PRODUCTS` + „Eigenes Produkt…"). Anzeige mitgezogen (DealsListe-Karten, DealSetup).

**Empty States für alle Hunter-Tabs** (ScreenHunting) — Leads (+ „SDR Lead hinzufügen"), Signals, Follow-ups, Neu in Pipeline, **leere Kanban-Spalte** (+ „Deal anlegen"). `shared/EmptyState` um optionales `description` erweitert. **Mock-Daten unangetastet**, Empty State nur wenn das Array leer ist.

**Zwei globale Regeln**
- **Hover-Aktionen** — Edit/Löschen/Copy nur bei Hover (`HOVER_ACTIONS` in `lib/componentBehavior.ts`), app-weit angewandt, in CLAUDE.md verankert.
- **Icon-Tooltips** — neuer `shared/TooltipLayer` (portal, sofort, getönt) + `data-tip` auf allen Icon-Buttons; in `App.tsx` gemountet, in CLAUDE.md verankert.

**Tooling** — `npm run audit` um **Inline-Code-Check** erweitert (warnt bei >20-Z.-JSX-Blöcken in features/screens, die einen panel-block duplizieren).

---

## 2. Was noch offen ist
- **Vollansicht** (`variant="full"`): nur noch das **vollseiten-spezifische** Layout/Spacing der Tabs (Inhalte sind aufgewertet).
- **DB-Wiring (Phase 3):** Mock → echte Queries, props → `organizationId`/`userId`, TanStack Query (Skeleton/Loading), Realtime, Routing `HunterReference` → echtes `ScreenHunting`.
- **Snooze · Settings · AddSdrLeadPanel** echt verdrahten (`SnoozeSettings` noch nicht gemountet).
- **AI-Chat Red-Team-Gate** (`scripts/redteam-aichat.ts`) — Phase 7.

## 3. Nächste Schritte (Reihenfolge)
1. DB-Wiring starten: `deals` inkl. **`name` + `product`**; Produktkatalog (`DEAL_PRODUCTS`) → `system_config`.
2. Mock-Listen der Blöcke (Tasks/Notizen/Deals/Kommunikation/Aktivität) an echte Tabellen hängen (Typen stehen schon).
3. TanStack Query + Realtime; Routing auf echtes `ScreenHunting`.
4. Vollansicht-Tab-Layout finalisieren.

## 4. Wichtige Entscheidungen heute
- **Kommunikation ≠ Aktivität:** Kommunikation = externe Touchpoints (Zeitstrahl), Aktivität = eigene System-Events (`activity_log`, ab Tag 1 abbildbar).
- **Eine Quelle für Task-Maske:** `TaskFormular` wird in Info-Panel **und** Action-Panel (`TaskAnlegenForm`) genutzt → kein Divergieren.
- **Tooltips global via `data-tip` + `TooltipLayer`** statt nativem `title` (sofort, kein Clipping, kein Wrappen je Button).
- **Hover-Aktionen** als verbindliche globale Regel (`HOVER_ACTIONS`).
- **Deal-Datenmodell zentral** erweitert (Name/Produkt am `DealDraft`), Produkt mit Freitext-Option.
- **Pipeline (ScreenHunting)** nutzt lead-gebundenen `dealValue` (separater Mock) — bewusst **nicht** auf `DealDraft` umgestellt; greift automatisch, sobald die Pipeline echte Deals rendert.

## 5. Offene Fragen
- Soll die **Pipeline/Kanban** künftig echte Deals (mit Name/Produkt) statt lead-gebundenem `dealValue` rendern?
- Produktkatalog: fix in `system_config` pro Organization, oder aus einer `products`-Tabelle?
- Vollansicht langfristig eigene `features/hunter/`-Komposition (aus `HunterSidepanel` herauslösen)?

## 6. Neue Komponenten in der Library
| Komponente | Ort | Zweck |
|---|---|---|
| `TaskFormular` | `panel-blocks/` | Generische Task-Maske (Anlegen/Bearbeiten), ohne Kontext-/KI-Meldungen |
| `DealsListe` | `panel-blocks/` | Deal-Tab: Liste + Anlegen/Bearbeiten via `NewDealCard` |
| `MailComposer` | `panel-blocks/` | „Neue E-Mail"-Maske (An/Betreff/Nachricht) |
| `TooltipLayer` | `shared/` | Globaler Hover-Tooltip-Layer (`data-tip`, portal) — in `App.tsx` gemountet |

Geändert/erweitert: `NewDealCard` (Name+Produkt), `DealSetup`, `OffeneTasks`, `KommunikationVerlauf`, `AktivitaetsVerlauf`, `TasksListe`, `NotizenListe`, `TaskAnlegenForm`, `EmptyState`, `componentBehavior.ts` (`HOVER_ACTIONS`), `scripts/audit.ts` (Inline-Code-Check).

## 7. Pre-Push Checkliste (DB-Features)
**Nicht zutreffend** — heute ausschließlich UI/Mock, keine Tabellen/Edge-Functions/AI-Calls.
- activity_log · audit_log · knowledge_base · system_config · org_id/RLS/CASCADE · api_usage → **N/A** (kein DB-Write). knowledge_base-Seed für die heutigen Features in `docs/knowledge_base.md` vorbereitet.
