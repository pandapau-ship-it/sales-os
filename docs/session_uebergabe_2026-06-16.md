# Session-Übergabe — 2026-06-16

**Branch:** `feature/phase-2-hunter` · **Phase:** 2 (Hunter UI) · **Status:** Build · Audit · Structure-Check grün · alles Mock (kein DB-Wiring)

Thema: **Komponenten-Struktur aufräumen + panel-block-Library finalisieren.** Reiner Refactor —
**kein Design-/Verhaltens-Change** (Markup byte-identisch, blockweise mit Preview bestätigt).

---

## ✅ Heute fertig

**Tote Dateien + Orphans gelöscht** (vorher je 0 Importe verifiziert)
- `shell/` komplett (alte Shell-Variante, ersetzt durch `layout/`)
- `shared/InfoPanel` · `EngagementChain` · `HeatDot` · `ChannelIcon` · `ScoreRing`
- `features/hunter/HunterInfoPanel` · `HunterActionPanel` (verwaiste Komposition) · `features/settings/SnoozeSettings`

**Komponenten in die richtige Struktur verschoben** (Import-Pfade projektweit angepasst)
- → `panel-blocks/`: `HunterCard` · `SignalRow` · `FollowUpKaltCard` · `PipelineStagniertCard` ·
  `PipelineKeineTaskCard` · `LinkedinSignalCard` · `NewInPipelineCards` · `SequenceLeadCards`
- → `features/hunter/`: `HunterSidepanel` · `ChatActionPanel` · 4 Drawer (`SignalActionDrawer`,
  `PipelineStagnatedDrawer`, `ContactColdDrawer`, `NoTaskDrawer`, `TaskDrawer`)

**HunterSidepanel + ChatActionPanel komplett auf panel-blocks** (Weg B + Weg A, je Block mit Preview)
- Extrahiert: `EditableInline`, `PhoneField` (820px-Inline-Edit/Telefon)
- Übersicht-Tab: `KiKurzakte` · `AktiveSignale` · `DealSetup` · `OffeneTasks` · `ActiveSequenceChain` · `KommunikationPreview`
- Header/Tabs: `KontaktZeile` (interaktiv) · `PanelTabs`
- Tab-Bodies als **neue** Blöcke: `TasksListe` · `KommunikationVerlauf` · `AktivitaetsVerlauf` · `NotizenListe`
- Action-Panel: `ActionComposer` · `ActionFooter`
- **Prinzip:** jeder panel-block auf dem reichsten/kanonischen Stand — nie Funktion/Design verloren.

**Library finalisiert**
- `panel-blocks/index.ts` **Barrel** (Default-/Named-Exports + Typen) → `import { HeatBadge, DetailField } from '@/components/panel-blocks'`

**shared/ bereinigt**
- `ActionPanel` (Orphan) **gelöscht** · `FunnelAnalysis` → `features/hunter/` · `PersonalityBadge`
  → `panel-blocks/` (künftiger Block) · `BrandIcons` als legitimes shared-Util (Allowlist)

**Structure-Check (neu)**
- `scripts/structure-check.sh` + `npm run structure-check` — **FAIL** wenn `.tsx` falsch in `shared/`
  liegen (Allowlist im Script). Im **Pre-Push-Hook** nach der DB-Checkliste; **Teil des Merge-Gates**.
  Blockt nur **mit** Terminal, sonst nur Anzeige.

---

## 🔧 Noch offen

- **Vollansicht — restliche Tabs aufwerten** (Übersicht/Kommunikation/… aktuell aus dem Panel; reicheres Vollseiten-Layout optional).
- Geteilte Fragmente `identityBlock`/`statusBadgesInner` bleiben bewusst lokal in `HunterSidepanel`
  (Panel **und** Vollansicht) — optional später als `PanelHeader`-Variante.
- Snooze · `AddSdrLeadPanel` · Erledigt verdrahten (`system_config`/Edge Functions); `SnoozeSettings`
  wurde als Orphan **gelöscht** — beim Settings-Screen neu/aus panel-blocks aufbauen.
- Empty/Loading-States · AI-Chat Red-Team-Gate (Phase 7) · DB-Wiring Phase 3.
- **PR #12** (Draft) offen lassen — nicht mergen ohne Freigabe.

---

## ➡️ Nächste Schritte (Reihenfolge)

1. Settings-Screen-Grundgerüst (Snooze/Automation neu einhängen).
2. Empty/Loading-States ergänzen.
3. DB-Wiring Phase 3 starten (`organizations`+RLS → Queries → TanStack Query); Details-Tab-Felder an `contacts`/`companies`.
4. AI-Chat (Phase 7): Guardrails + Red-Team-Gate ins Merge-Gate.

---

## 🧭 Wichtige Entscheidungen heute

- **panel-blocks = Single Source** für alle Inhalts-Blöcke; `features/hunter/`-Dateien komponieren nur.
  Inline-Block, der ein panel-block sein sollte → wird extrahiert (kanonisch = der reichste Stand).
- **Kanonik-Regel:** wo Inline reicher als der (alte) panel-block war, wurde der **panel-block angehoben** — nie umgekehrt.
- **Vollansicht** bleibt `HunterSidepanel` `variant="full"` (kein separates `ScreenVollansicht`).
- **Struktur erzwungen** per `structure-check` im Pre-Push-Hook + Merge-Gate.
- `shared/` enthält nur echte Atome (Avatar/BrandLogo/BrandIcons/LinkedinIcon/Toast/EmptyState/
  CommandPalette/ICPDonut/CommunicationChain/CustomerDrawer/Badge).

---

## ❓ Offene Fragen (noch nicht entschieden)

- Bekommen die übrigen Vollansicht-Tabs ein eigenes, reicheres Layout (statt 1:1 Panel-Inhalt)?
- `identityBlock`/`statusBadgesInner` als `PanelHeader`-Variante herauslösen — jetzt oder später?
- `PersonalityBadge` (jetzt panel-block, noch ungenutzt): wann ans Persönlichkeits-Feature anbinden?

---

## 🧱 Neue/relocatete Komponenten in der Library

- **Neu (panel-blocks):** `EditableInline` · `PhoneField` · `TasksListe` · `KommunikationVerlauf` ·
  `AktivitaetsVerlauf` · `NotizenListe` · `index.ts` (Barrel)
- **Angehoben (kanonisch):** `KiKurzakte` · `KontaktZeile`
- **Verschoben → panel-blocks/:** `HunterCard` · `SignalRow` · 6 Karten · `PersonalityBadge`
- **Verschoben → features/hunter/:** `HunterSidepanel` · `ChatActionPanel` · 4 Drawer · `FunnelAnalysis`

---

## 📋 Pre-Push Checkliste (DB-Features)

Heute **keine** DB-Features — reiner Struktur-/Komponenten-Refactor. Daher:
- activity_log · audit_log · system_config · org_id+RLS+CASCADE · api_usage → **n/a**
- knowledge_base → **✓** (interner `core`-Eintrag zur panel-block-Library/Structure-Check)

→ Keine offene DB-Pflicht. **Structure-Check** ✓ · **Build** ✓ · **Audit** 0 FAIL.
