# Session-Übergabe — 2026-06-25

> Spanne: seit `docs/session_uebergabe_2026-06-24_teil2.md` (Panel-Übergänge & Full-Bleed).
> Schwerpunkt: **Farmer Info-/Action-Panel + Follow-ups + Vollansicht + ScreenFarming-Verdrahtung**
> sowie **Panel-Performance** (Skeletons · Prefetch · placeholderData). Reine UI/Frontend-Arbeit,
> **kein DB-Wiring**. Eine KB-Migration (047) ist vorbereitet, aber **noch nicht gepusht**.

---

## 1. Was seit der letzten Übergabe fertig wurde

### Farmer Info-Panel [D33] — eigene `FarmerSidepanel`-Komponente (Mock)
- `features/farmer/FarmerSidepanel.tsx` — **eigene** Komponente (NICHT der alte `CustomerDrawer`, NICHT
  ein Hunter-Flag), analog `HunterSidepanel`. `variant='panel'|'full'`, typo-Kanon, Full-Bleed-Sheet.
- Panel-Tabs: Übersicht (AktiveSignale Churn/Upsell/Kalt/Gekündigt · OffeneTasks · KommunikationKompakt ·
  SubscriptionBox + UsageBox) · Aktivität · Kommunikation · Tasks · Subscription · Usage · Notizen.
- KontaktZeile im Panel-Header; reuse aller geteilten panel-blocks (DetailSection/DetailField/
  DetailPhoneList/NotizenListe/TasksListe/SubscriptionBox/UsageBox).

### Farmer Action-Panel [D34] — `FarmerActionDrawer` + `lib/farmerActions.tsx` (Option A)
- `lib/farmerActions.tsx`: Resolver `farmerActionConfig(signal, handlers)` + serialisierbares
  `FarmerActionType` / `FARMER_ACTION_CATALOG` (Spiegel von `signalActions.tsx`). Kinds:
  `churn_risk` · `going_cold` · `upsell_potential` · `cancelled`.
- `features/farmer/FarmerActionDrawer.tsx`: dünner Wrapper, rendert `ChatActionPanel` **unverändert**.
- **Option A (bewusst):** Renderer unverändert → Actions erscheinen erst mit echtem Draft; bis [D5]
  AI-Pipeline ehrliche „Folgt"-Platzhalter (recommendation = AI_PENDING_LABEL, draft null). Actions
  schon im Katalog → DB-ready.
- **Action-Panel-Breite app-weit auf 720px fix** vereinheitlicht (zentral in `ChatActionPanel`;
  zusätzlich NoTaskDrawer + ActionPanel).

### Farmer Follow-ups [D46] + Vollansicht [D47] (Mock)
- **[D46] Follow-ups-Tab:** fällige Tasks bei Kunden (`SequenceLeadCards`, 1:1 Hunter) + „Kunde wird
  kalt"-Kacheln (`FollowUpKaltCard`). Trennung **Retention/Churn = Risiko** vs. **Follow-ups = Aktion**;
  „Kunde wird kalt" liegt in Follow-ups; kein „Stagniert" (kein Deal/Stage).
- **[D47] Vollansicht:** `FarmerSidepanel variant='full'` + 7 Tabs + ArrowUpRight; Details via Library;
  SubscriptionBox compact. **Fix:** `createPortal(document.body)` gegen transform-Vorfahre (grauer
  Overlay-Bug); KontaktZeile-Hero entfernt → konsistent Hunter/Farmer (Kontaktdaten im Details-Tab).

### ScreenFarming verdrahtet (Slice 3)
- Kunden/Retention/Upsell/Signals → `openInfo()` öffnet `FarmerSidepanel` (Person-Shape via `itemToPerson`).
- Retention/Upsell/Übersicht-Signale-CTAs → `FarmerActionDrawer`.
- **#7** LinkedIn-Signal „Antworten" → `SignalActionDrawer` (reuse Hunter-Resolver, `AI_PENDING_LABEL`).

### Snooze + Ignorieren bei Signalen (Hunter + Farmer)
- `SNOOZE_MAX` / `SNOOZE_OPTIONS` → `lib/constants.ts` (**Single Source**); `FollowUpKaltCard` nutzt sie.
- **Snooze** 1:1 auf `LinkedinSignalCard` (Dropdown / Snoozed `opacity-60` / Eskaliert-Limit) — gilt
  automatisch für Hunter **und** Farmer (geteilter panel-block).
- **Ignorieren** = lokaler `ignoredSignalIds`-Filter (Kachel verschwindet sofort, kein Toast/Dialog);
  Bulk-X verdrahtet in ScreenHunting (index-erhaltend per `null`-Render) + ScreenFarming.

### Hunter-Bugfixes + Deeplink-Highlight [D45]
- „Ansehen" (fällige Task → Tasks-Tab + Deeplink-Highlight). Pipeline-stagniert-CTA → `PipelineStagnatedDrawer`
  (Honesty-Muster) statt Task-Formular.
- **[D45] Deeplink-Highlight-Muster** als globale Regel: `useDeeplinkHighlight` + `.deeplink-flash`
  (`color-mix` aus `--sherloq-primary` ~12 %) + `highlightId`-Prop. Erste Anwendung = „Ansehen".

### Doku-Festlegungen [D43]/[D44]
- **[D43] Historisierung** (Snapshots + Event-Log, greift zuerst beim Farmer-DB-Wiring) — CLAUDE.md-Dauerregel.
- **[D44] Flexible Daten-Tabellen** (TanStack Table) — bei Kontakte/Companies-Phase.

### Panel-Performance (Skeletons · Prefetch · placeholderData)
- Neuer panel-block **`PanelSkeleton`** (Token-only `animate-pulse`, In-Panel-Box-Stil) in allen
  Info-Panel-Tabs während `isLoading` (statt leer) — HunterSidepanel (alle Tabs) + ExpandedCardContent.
- **Prefetch-on-hover:** `lib/prefetch.ts` → `prefetchContactPanel` (gleiche queryKeys wie das Panel),
  zentral in `HunterCard` (Single Source → alle Profilkarten), **120 ms Hover-Intent-Delay**.
- **`placeholderData: keepPreviousData`** auf allen per-Contact-Queries (HunterSidepanel + ExpandedCardContent).
- **Fix:** Mail in Farmer-KontaktZeile — synthetisierter Fallback (`vorname.nachname@company.com`) bis
  DB-Wiring; KontaktZeile selbst unberührt (Single Source).

---

## 2. Geänderte/neue Dateien (Code)

**Neu:**
- `src/components/features/farmer/FarmerSidepanel.tsx` · `FarmerActionDrawer.tsx`
- `src/lib/farmerActions.tsx` · `src/lib/prefetch.ts`
- `src/components/panel-blocks/PanelSkeleton.tsx`
- `supabase/migrations/047_knowledge_base_farmer_panels.sql` (**nicht gepusht**)

**Geändert (Auswahl):** `ScreenFarming.tsx` · `ScreenHunting.tsx` · `HunterSidepanel.tsx` ·
`ExpandedCardContent.tsx` · `HunterCard.tsx` · `LinkedinSignalCard.tsx` · `FollowUpKaltCard.tsx` ·
`lib/constants.ts` · `panel-blocks/index.ts` · `CLAUDE.md` · `PROGRESS.md` · `CHECKLIST.md` ·
`docs/knowledge_base.md`.

**Library:** neue Komponenten in `panel-blocks/index.ts` (PanelSkeleton) + CLAUDE.md-Tabellen
(neue Sektion `features/farmer/`: FarmerSidepanel + FarmerActionDrawer; PanelSkeleton-Zeile; Helfer-Zeile
um farmerActions + prefetch ergänzt). `audit.ts` IN_SCOPE enthält FarmerSidepanel/FarmerActionDrawer
bereits. `npm run structure-check` grün.

---

## 3. Gates
- `npm run build` ✓ · `npm run audit` ✓ (0 harte Verstöße, 4 bekannte WARN) · `npm run structure-check` ✓.
- Verifikation der UI lief über den **lokalen Dev-Server des Users** (Preview-MCP blockiert; Panels hinter
  `/app`-Auth-Wall, Port 5173 = User-Dev-Server).

---

## 4. Was noch offen ist (Reihenfolge)
1. **Farmer DB-Wiring** — echte Scores/Signale/Subscription. **Zuerst [D43] Historisierung** (Snapshot-/
   Event-Tabellen + Cron), bevor veränderliche Kundenwerte echt verdrahtet werden. Beim Wiring zwingend
   nachziehen (heute Mock, erscheint NICHT automatisch): **(a) KI-Kurzakte-Block** im FarmerSidepanel
   Übersicht-Tab fehlt · **(b) AktiveSignale-Flags** sind hardcodiert (`true`) → an echte Felder koppeln
   (`cancelled`/`churnRisk≥61`/`upsell≥70`/`goingCold`). (Details: PROGRESS [D47].)
2. **Hunter Trial-Kacheln [D36]/[D37]** (erst nach Farmer komplett).
3. **Lifecycle-Trigger [D38]** (trial → kunde: verschwindet aus Hunter, erscheint in Farmer).
4. **[D29]** Einladungs-Mail Edge Function.
5. **AI-Pipeline [D5]** — löst alle „Folgt"-Platzhalter (Kurzakte + Action-Drafts).
6. **[D40]** automation_rules Schema-Korrektur (mit Automation-Settings-UI).
7. **[D41]** Marketing/SherloqSystem Soft-Card-Sweep · **[D42]** TaskDrawer → `sheet`.
8. **[D45]** Deeplink-Highlight inkrementell an weiteren Sprung-Stellen anwenden.
9. **[D44]** TanStack-Table-Fundament bei Kontakte/Companies.

> **db push:** Migration **047** (KB Farmer-Panels) liegt bereit — **am Sessionstart `supabase db push`**.
> Reine knowledge_base-Daten (idempotent, ON CONFLICT DO UPDATE), kein Schema-Risiko.

---

## 5. Wichtige Entscheidungen
- **Farmer-Panels als eigene Komponenten** (`FarmerSidepanel`/`FarmerActionDrawer`), die geteilte
  panel-blocks/Renderer wiederverwenden — kein Hunter-Flag, kein Umbau des alten CustomerDrawer.
- **Option A** beim Action-Panel: `ChatActionPanel`-Renderer unverändert → Actions automatisch mit [D5].
- **Action-Panel-Breite 720px fix** (zentral; nie auf 50vw zurückdriften).
- **Snooze-Config Single Source** in `constants.ts`; **Ignorieren** = lokaler Filter (kein Backend).
- **Deeplink-Highlight** als globale Regel (zentral, nicht pro Stelle neu).
- **Prefetch zentral in HunterCard** (Single Source) statt pro Kartentyp; 120 ms Hover-Intent gegen
  Prefetch-Sturm. **Skeleton nur bei `isLoading`** + **placeholderData** für weiche Übergänge.

---

## 6. Offene Fragen
- Keine. Selbst-Screenshots weiterhin nicht möglich (Preview-MCP blockiert) → UI-Verifikation per User-HMR.

---

## 7. Deferred-Items (vollständig)
[D1]–[D31] · [D32] (bewusste Lücke) · **[D33] Farmer-Info-Panel ✅ gebaut (Mock)** ·
**[D34] Farmer-Action-Panel ✅ gebaut (Mock, Option A)** · [D35] Signal-Action-Resolver Phase 0 (erledigt) ·
[D36]/[D37] Hunter Trial-Kacheln · [D38] Lifecycle-Trigger · [D39] Farmer „Kunde wird kalt" (Teil von [D46]) ·
[D40] automation_rules Schema · [D41] Marketing/SherloqSystem Soft-Card-Sweep · [D42] TaskDrawer → `sheet` ·
[D43] Historisierung (Doku) · [D44] Flexible Daten-Tabellen (Doku) · **[D45] Deeplink-Highlight** (Muster +
erste Anwendung; inkrementell weiter) · **[D46] Farmer Follow-ups ✅ gebaut (Mock)** ·
**[D47] Farmer Vollansicht ✅ gebaut (Mock)**. (Details je Eintrag in PROGRESS.md → „Deferred Logic".)

---

## 8. Neue Library-Komponenten dieser Session
| Komponente | Ort | Zweck |
|---|---|---|
| `FarmerSidepanel` | `features/farmer/` | Farmer-Info-Panel (panel + full/Vollansicht), eigene Komponente |
| `FarmerActionDrawer` | `features/farmer/` | Farmer-Action-Panel (Wrapper um ChatActionPanel, 720px) |
| `farmerActions` | `lib/` | `farmerActionConfig` + `FARMER_ACTION_CATALOG` (Resolver) |
| `prefetch` | `lib/` | `prefetchContactPanel` — Panel-Daten on hover vorladen |
| `PanelSkeleton` | `panel-blocks/` | Lade-Platzhalter für Info-Panel-Tabs während `isLoading` |
