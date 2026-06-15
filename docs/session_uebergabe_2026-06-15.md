# Session-Übergabe — 2026-06-15

**Branch:** `feature/phase-2-hunter` · **Phase:** 2 (Hunter UI) · **Status:** Build grün · Audit 0 FAIL · alles Mock (kein DB-Wiring)
**Letzter Commit (vor Session-Ende):** `7823986`

---

## ✅ Heute fertig

Thema der Session: die **Kontakt-Vollansicht** (Vollbild-Profil) gebaut und den **Details-Tab**
auf State-of-the-Art-Niveau (Attio/Clay) gebracht.

- **Vollansicht über ↗** — `shared/HunterSidepanel` bekam Prop **`variant: 'panel' | 'full'`**.
  Derselbe Body (Fragmente `identityBlock` · `statusBadgesInner` · `contactPill` · `tabNav` ·
  `tabContent`) rendert als 820px-Sheet **oder** als Vollseite. ↗ oben rechts im Info-Panel öffnet
  die Vollseite; ← geht zurück zum Panel (Sheet wird ausgeblendet, `open={isOpen && !showVollansicht}`),
  ✕ schließt ganz (neue Prop `onExit`).
- **Echte-Seiten-Mechanik** — **ein** Scroll-Container, **native Scrollbar** (kein
  Panel-Inner-Scroll); die frühere weiße Topbar-Leiste ist raus → dezente Steuer-Zeile (← / ✕);
  Tabs als **seitenbreite sticky** Leiste; Hero (Avatar · Name · ICP · Status/Heat/Stage · Aktionen)
  **randlos** direkt in die Seite integriert (keine Hero-Kachel).
- **Details-Tab** (neuer erster Tab, nur Vollansicht) — alle Kontakt-/Firmen-/CRM-Felder
  (CLAUDE.md → CRM FELDER): **Person · Firma · Klassifizierung · Notizen · System** (zugeklappt).
  - **Read-Mode** als Standard: Werte ohne Input-Rahmen.
  - Klick/Stift → **Inline-Edit direkt im Feld** (kein Bearbeiten-Popup wie im Panel; Escape bricht ab).
  - Leere Felder → kleiner **„+ Hinzufügen"**-Link; leer + weggeklickt → verschwindet wieder.
  - **Copy** bei E-Mail/LinkedIn/Web/Domain (+ Toast „Kopiert ✓"), Icons direkt hinter dem Wert.
  - System-Status (Contact Status/Heat/E-Mail verifiziert) als **read-only Badges**
    (`StageBadge`/`HeatBadge`/`StatusBadge`), keine Eingabefelder.
  - **Kontaktdaten** (E-Mail/LinkedIn/Web/Telefon) in dezenter **grauer Sub-Kachel** (`bg-app-bg`) —
    nur dieser Bereich grau, Rest weiß.
- **Telefon-Management** (`DetailPhoneList`) — mehrere Nummern, **Favorit-Stern** (primär),
  Typ je Nummer, Inline-Edit, Copy + Löschen, **„+ Nummer hinzufügen"** (neue Zeile auto-fokussiert;
  bleibt sie leer → beim Wegklicken automatisch verworfen).

---

## 🧱 Neue Komponenten in der Library (`panel-blocks/`)

Alle global, prop-driven, Tokens-only, Dark-Mode automatisch:

- **`DetailField`** — Profil-Feld im Read-Mode (Inline-Edit, `options`=Dropdown, `copyable`+`onCopy`,
  `href`=Link, `readonly`=System grau, leer → „+ Hinzufügen").
- **`DetailSection`** — Profil-Sektion (weiße Karte, Titel+Icon, optional `collapsible`/`defaultCollapsed`, 1/2-Spalten).
- **`StatusBadge`** — generisches Status-Badge (Tone success/warn/urgent/info/teal/muted, Icon ODER Dot).
- **`DetailPhoneList`** — Telefonliste (Favorit, Typ, Inline-Edit, Copy/Löschen, Hinzufügen).

→ In CLAUDE.md unter **„Verfügbare panel-blocks"** eingetragen.

---

## 🔧 Noch offen

- **Vollansicht — restliche Tabs aufwerten**: Übersicht/Kommunikation/Aktivität/Tasks/Notizen sind
  aktuell 1:1 aus dem 820px-Panel übernommen; für die Vollseite noch aufzuwerten.
- Snooze · `SnoozeSettings` · `AddSdrLeadPanel` verdrahten (system_config / Edge Functions); `SnoozeSettings` noch nicht gemountet.
- Empty/Loading-States für alle Hunter-Tabs.
- AI-Chat **Red-Team-Gate** (`scripts/redteam-aichat.ts`) — Phase 7.
- DB-Wiring Phase 3 (Mock → echte Queries, RLS, TanStack Query, Realtime).
- **PR #12** (Draft) offen lassen — nicht mergen ohne Freigabe.

---

## ➡️ Nächste Schritte (Reihenfolge)

1. **Vollansicht restliche Tabs** aufwerten (aus `panel-blocks/` komponieren, kein Inline-Block).
2. Settings-Screen-Grundgerüst + `SnoozeSettings` einhängen.
3. Empty/Loading-States ergänzen.
4. DB-Wiring Phase 3 starten (`organizations`+RLS → Queries → TanStack Query); Details-Tab-Felder
   an echte `contacts`/`companies`-Felder hängen.
5. Snooze/AddSdrLead/Settings + Erledigt verdrahten (`system_config`, Edge Functions, Kurzakte-Insert).
6. AI-Chat (Phase 7): Guardrails umsetzen + Red-Team-Gate ins Merge-Gate.

---

## 🧭 Wichtige Entscheidungen heute

- **Vollansicht = `HunterSidepanel` `variant="full"`**, **kein** separates `ScreenVollansicht`
  (alter Entwurf bleibt verworfen). Gleicher Body, andere Hülle. (Optional später in `features/hunter/` herauslösen.)
- **Echte Seite, nicht Panel-Scroll**: ein Scroll-Container, native Scrollbar, sticky Tabs, Hero randlos
  integriert (keine weiße Hero-Kachel).
- **Details-Tab = Read-Mode + Inline-Edit direkt im Feld** (kein Popup — bewusst anders als das 820px-Panel,
  das Popover nutzt). System-gesetzte Status → Badges, nicht editierbar.
- **Kein farbiger Akzent-Border** (z.B. teal links) an Detail-Karten — wirkt „nach AI". Gruppierung über
  Spacing + **graue Sub-Kachel nur um den Kontakt-Datenblock**.
- **Navigation/Schließen-Logik**: ← zurück zum Panel · ✕ schließt ganz (`onExit`).

---

## ❓ Offene Fragen (noch nicht entschieden)

- Sollen die übrigen Tabs der Vollansicht ein eigenes, reicheres Layout bekommen (statt 1:1 Panel-Inhalt)?
- Wird die Vollansicht später aus `HunterSidepanel` in eine eigenständige `features/hunter/`-Komposition
  herausgelöst (Trennung Panel ↔ Vollseite) oder bleibt die `variant`-Lösung dauerhaft?
- Details-Tab: Feld-Reihenfolge/Gruppierung final? (aktuell sinnvoll, aber nicht mit Fach-User abgestimmt)

---

## 📋 Pre-Push Checkliste (DB-Features)

Heute **keine** DB-Features — alles UI/Design (Vollansicht + panel-blocks). Daher:
- activity_log → **n/a** · audit_log → **n/a**
- knowledge_base → **✓** (Seed `docs/knowledge_base.md`, Abschnitt 2026-06-15 + SQL-Inserts)
- system_config statt hardcodiert → **n/a** (reine UI-Tokens; Dropdown-Optionen als dokumentierter Fallback bis Enums aus DB)
- organization_id + RLS + CASCADE → **n/a** (keine neue Tabelle)
- api_usage vor AI Calls → **n/a** (keine AI Calls)

→ Keine offene DB-Pflicht.
