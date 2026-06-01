# Sales OS — Claude Persistent Memory

> Read this file before doing anything else in a new session. It is the single source of truth for how this project is built.

---

## Session Protocol

**At the start of every session:**
1. `git pull` — get latest changes
2. Read `CLAUDE.md` (this file)
3. Read `PROGRESS.md` — understand what's done and what's next

**At the end of every session:**
1. Update `PROGRESS.md` — what was completed, what's next, any blockers
2. `git add` + `git commit` + `git push`

**Session-Ende Checkliste (Pflicht — nach jeder Session abarbeiten):**
1. PROGRESS.md aktualisieren
2. Alle heute neu gebauten Komponenten in `src/lib/componentRegistry.ts` eintragen
3. Commit + Push zu GitHub

---

## Tech Stack (aktuell)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19 + TypeScript | Vite als Bundler |
| UI Framework | **shadcn/ui** | Primitives in `src/components/ui/` — niemals direkt editieren |
| Styling | **Tailwind CSS v4** | `@tailwindcss/vite` Plugin, kein `tailwind.config.ts` |
| Design Tokens | CSS Variables in `src/index.css` | Einzige Quelle aller visuellen Werte |
| Database | Supabase (PostgreSQL) | Auth built-in, RLS enabled, Realtime support |
| Hosting | Vercel | Auto-deploy on push to main |
| Version Control | GitHub | `pandapau-ship-it/sales-os` |
| AI Layer | Claude Routines | Daily sync at 07:00 — runs in Anthropic cloud |
| Auth | Supabase Auth | Email + password, Row Level Security |

---

## Design System Regeln (Non-Negotiable)

**Einzige Quelle aller visuellen Werte: `src/index.css` `:root` Block**
- Niemals Hex-Werte direkt im Code — immer CSS Variables oder Tailwind-Tokens
- Eine Farbe ändern = in `index.css :root` ändern = überall geändert

---

### Design Invariants — Niemals abweichen (auch nicht bei neuen Design-Uploads)

Diese Regeln gelten absolut. Wenn ein hochgeladenes Design-File davon abweicht,
wird das Design in unser System übersetzt — nicht umgekehrt.

**Radius-Hierarchie (von groß nach klein):**
| Element | Wert | Tailwind |
|---|---|---|
| Drawer, Modals | 16px | `rounded-[16px]` |
| Cards, Panels | 12px | `rounded-[12px]` |
| Nav-Container (Top-Nav & Sub-Nav) | 12px | `rounded-[12px]` |
| Nav-Tabs (aktiv/inaktiv) | 9px | `rounded-[9px]` |
| Buttons (primär/sekundär) | 10px | `rounded-[10px]` |
| Badges, Pills | 7px | `rounded-[7px]` |
| Count-Labels in Tabs | 5px | `rounded-[5px]` |
| Avatar-Quadrate | 10px | `rounded-[10px]` |
| Status-Punkte | 9999px | `rounded-pill` |

**Niemals:** `rounded-pill` für Nav-Container oder Nav-Tabs. `rounded-pill` nur für Status-Punkte, Checkboxen, Linien.

**Border-Hierarchie — was einen Rand bekommt, was nicht:**
| Element | Border | Warum |
|---|---|---|
| Cards / Lead-Kacheln | ✅ Ja — `border border-[var(--border-card)]` | Brauchen Abgrenzung auf weißem Grund |
| Top-Nav Container | ❌ Nein | Weißer Hintergrund auf #F8FAFC reicht als Kontrast |
| Sub-Nav Container | ❌ Nein | Sitzt auf App-Background, Hintergrundfarbe reicht |
| Heat / Status Badges | ✅ Ja — `border` mit jeweiliger Signal-Farbe | Klein, brauchen Kontur |
| Buttons (sekundär) | ✅ Ja | Abgrenzung ohne Fill |
| Buttons (primär) | ❌ Nein | Fill reicht |
| Expanded-Content-Bereiche | ✅ Ja — `border-t border-[#F1F3F5]` | Trenner, kein Kasten |

**Heat-Badge Muster (verbindlich für alle Screens):**
```tsx
// getHeatColor() gibt immer zurück: { bg, text, border, dot, label }
// NIEMALS emoji — immer CSS dot:
<div className={`px-2.5 py-1 rounded-[7px] text-[11px] font-medium border flex items-center gap-1.5 w-fit ${heat.bg} ${heat.text} ${heat.border}`}>
  <span style={{ color: heat.dot, fontSize: 8, lineHeight: 1 }}>●</span>
  {heat.label}
</div>
```

**Nav-Muster (verbindlich für Top-Nav UND alle Sub-Navs):**
```tsx
// Container: immer rounded-[12px], kein rounded-pill
<div className="flex gap-1 p-1 bg-app-surface rounded-[12px] w-fit items-center">
  // Tab: immer rounded-[9px], aktiv = bg-sherloq-primary text-white
  <button className={`px-3.5 py-1.5 text-[12px] font-medium rounded-[9px] ${isActive ? 'bg-sherloq-primary text-white' : 'text-text-body hover:bg-app-bg'}`}>
```

**Design-Uploads — Übersetzungsregel:**
Wenn ein Figma/Screenshot-Design hochgeladen wird:
1. Fremde Radius-Werte → nächstliegender Wert aus Radius-Hierarchie oben
2. Fremde Hex-Farben → nächstliegender Token aus `index.css :root`
3. Volle Pills für Navs → immer zu `rounded-[12px]` übersetzen
4. Borders überall → Border-Hierarchie oben anwenden
5. Emoji-Icons in Badges → immer CSS-Dot-Muster verwenden
6. Neue Komponente → sofort in `componentRegistry.ts` eintragen

---

### Globale CSS-Klassen (immer bevorzugen)
```
.sherloq-card         — alle Cards und Kacheln
.sherloq-pill         — alle Status-Badges
.sherloq-btn-primary  — alle primären CTAs (gradient)
.sherloq-btn-secondary — alle sekundären Buttons
.pill-urgent / .pill-warn / .pill-success / .pill-info / .pill-cold / .pill-teal / .pill-muted
```

### Tailwind Token-Klassen (via @theme inline)
```
bg-sherloq-primary    text-sherloq-primary
bg-app-bg             bg-app-surface
text-text-primary     text-text-body     text-text-muted
border-border         border-border-strong
rounded-card (16px)   rounded-pill (9999px)   rounded-input (10px)
shadow-card           shadow-hover       shadow-brand      shadow-nav
text-signal-urgent    text-signal-warn   text-signal-success  text-signal-info
```

### Utility
- `cn()` aus `src/lib/utils.ts` für alle Klassen-Kombinationen
- shadcn Primitives in `src/components/ui/` — niemals direkt editieren

---

## Ordnerstruktur (aktuell)

```
src/
  components/
    ui/           ← shadcn Primitives (nicht anfassen)
    screens/      ← ScreenMyDay, ScreenHunting, ScreenFarming, ScreenMarketing, ScreenSherloqSystem, Jira
    layout/       ← TopBar, Sidebar
    shared/       ← CustomerDrawer, CommandPalette, CommunicationChain, ICPDonut
  lib/
    utils.ts      ← cn() Helper
  types.ts        ← NICHT anfassen (Referenz-Typen)
  data.ts         ← NICHT anfassen (Mock-Daten)
  App.tsx         ← Root, State-Verwaltung, Routing
  index.css       ← Design Tokens (einzige Quelle)
  main.tsx        ← NICHT anfassen
```

---

## Design Rules (Legacy — für Referenz)

**Single source of truth for all visual decisions: `src/index.css`** (ersetzt `src/theme.ts`)
- All colors, font sizes, spacing, radius values live there — never inline
- `theme.ts` extends Mantine's `createTheme()` — never override Mantine components with raw CSS
- Full docs: `docs/design-system.md`

**Font:** Plus Jakarta Sans (Google Fonts, loaded in `index.html`)

**Visual reference: Claude.ai's own navigation**
- Very compact, very clean, no oversized elements
- Font sizes: `xs`=11px (labels) · `sm`=13px (body/nav — PRIMARY) · `md`=14px · `lg`=16px
- Icon sizes: 16–18px — never larger unless hero/empty state
- Spacing: 4px grid — `xs`=4 · `sm`=8 · `md`=12 · `lg`=16 · `xl`=24
- Default radius: `md` = 8px

**What this is NOT:**
- No generic AI design (no purple gradients, no Inter font as hero choice, no oversized cards)
- No heavy borders or shadows — use only to establish hierarchy
- No empty dashboards — every screen has data or a concrete next action on first load

---

## Color System (from Sherloq Brand Identity)

Brand mood: **calm · intelligent · action-oriented**

### Primary — Sherloq Deep Teal
```
#EDF5F5 (0) · #C8E6E7 (1) · #9DD2D3 (2) · #67B8BA (3) · #3A9EA1 (4)
#2A8283 (5) · #185557 (6=PRIMARY) · #113F41 (7) · #0B2B2C (8) · #061617 (9)
```
`primaryColor: 'sherloq'` · `primaryShade: { light: 6, dark: 7 }`

### Semantic Colors (action + background)

| Name | Action | Background | Used for |
|---|---|---|---|
| `ai` | `#2563EB` | `#DBEAFE` | AI features, automation |
| `insight` | `#8B5CF6` | `#EDE9FE` | Analytics, kurzakte |
| `opportunity` | `#F59E0B` | `#FEF3C7` | Leads, upsell signals |
| `urgent` | `#E11D48` | `#FEF4E9` | Errors, churn critical |
| `growth` | `#10B961` | `#D1FAE5` | Won deals, success |
| `intelligence` | `#F274F6` | `#FFF4FE` | AI-generated content (sparingly) |

Strong orange accent: `#EA660B` (high-emphasis opportunity, at `opportunity[8]`)

### Domain Semantic Tokens (exported from theme.ts)

```typescript
import { heatStatusColors, dealStageColors, churnRiskColors, personalityColors } from './theme'
```

| Token | Keys |
|---|---|
| `heatStatusColors` | `heiss` · `warm` · `lauwarm` · `kalt` · `tot` |
| `dealStageColors` | `backlog` · `demo_vereinbart` · `followup_offen` · `onboarding_trial` · `gewonnen` · `verloren` |
| `churnRiskColors` | `low` · `medium` · `high` · `critical` |
| `personalityColors` | `rot` · `gelb` · `gruen` · `blau` |

---

## Navigation Architecture (Final — do not change)

**AppShell `layout="default"`** — header full-width at top, navbar below it on the left.

### Top bar — `TopNav.tsx` (primary section navigation)
Horizontal pill navigation spanning the full header width.
- **5 primary sections as pills**: Mein Tag · Hunting · Farming · Marketing · Sherloq System
- **Jira** as secondary pill (smaller, `topNavPillSecondary` class, separated by gap)
- **Right side**: Cmd+K pill button + user avatar
- Active pill: gradient `linear-gradient(135deg, #175253, #3f8383)` + white text
- Inactive: transparent background, gray text — zero borders, zero dividers

### Left sidebar — `SubSidebar.tsx` (context-sensitive sub-nav)
Icon-only sidebar (68px wide) that changes content based on the active section.
- Shows sub-nav icons for the active section (e.g. Hunting → Lead-Liste, Pipeline, Sequenzen, Outreach)
- Active icon: gradient background + white icon
- Inactive: transparent, gray icon
- Utility buttons (Settings, Theme toggle) pinned to bottom
- Mein Tag has no sub-items → sidebar shows only utility buttons

### Role-based access (`navConfig.tsx → roleAccess`)
- `solo` / `admin` → all 5 sections + Jira
- `hunter` → Mein Tag · Hunting · Jira
- `farmer` → Mein Tag · Farming · Jira

---

## Design Vision — Hyper-Modern Floating UI (Binding for Every Component)

This is the permanent visual language of Sales OS. Every new component must follow these rules exactly.

### Backgrounds
- **Global app background**: always `var(--mantine-color-gray-0)` — never pure white
- **Cards, panels, sidebar, header**: white `#FFFFFF`, elevated above the gray background by shadow alone

### Active State (gradient — never plain green or black)
```css
background: linear-gradient(135deg, #175253, #3f8383);
color: white;
```
Used for: active nav pills, active sidebar icons, active tabs, primary CTA buttons.

### Typography
- Headers: `var(--mantine-color-gray-9)` (dark-9)
- Subtext / labels: `var(--mantine-color-gray-5)` (dimmed)
- All sizes from `theme.ts` — never new hex codes for text

### Geometry
- Cards: `radius="xl"` (24–32px) — extreme rounding everywhere
- Pills (nav, buttons, badges): `radius={9999}` — full pill shape, no exceptions
- Sidebar icon buttons: `border-radius: 10px` — soft square
- **No hard borders anywhere** — `withBorder={false}` on all AppShell parts, no CSS `border` lines

### Shadows (ultra-soft diffuse)
```css
/* Card / panel */
box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
/* Header */
box-shadow: 0 1px 20px -4px rgba(0, 0, 0, 0.06);
/* Sidebar */
box-shadow: 2px 0 20px -8px rgba(0, 0, 0, 0.06);
```
Never use heavy or sharp shadows.

### Dividers & Separators
- **Zero dividers** — no `<Divider>` components, no `withBorder`, no CSS border lines
- Separation achieved exclusively through spacing (`gap`, `padding`, `margin`)

### CSS Class Patterns (`shell.module.css`)
| Class | Purpose |
|---|---|
| `.topNavPill` | Primary section pill in header |
| `.topNavPillSecondary` | Jira / secondary pills (smaller) |
| `.sidebarItem` | Context sub-nav icon button (10px radius) |
| `.utilBtn` | Utility buttons (settings, theme — pill shape) |
| `.cmdK` / `.cmdKLabel` | Pill-shaped Cmd+K search trigger |
| `.logoArea` | Logo lockup flex container |

---

## UI Principles (Binding for Every Component)

### 1. Progressive Disclosure — Three Levels

**Level 1 — Always visible (zero click):**
Account name, last touchpoint, status signal (🔴🟡🟢), one-line Kurzakte, visual engagement chain. 20–30 accounts readable at a glance.

**Level 2 — One click (inline expand):**
Full Kurzakte (3–5 sentences), last 3 touchpoints, suggested next action with a direct button. No page change, no modal — expands in place.

**Level 3 — Conscious decision (deep dive):**
Full timeline, all communications, all tasks, all details. Separate drawer or panel. Rarely used but must be complete.

### 2. Actions Always Inline — Never Context Switch

Every action happens where the data is. The rep never leaves their current screen.
- Writing a follow-up → inline next to the account
- Changing deal stage → click directly on the status badge
- Setting a reminder → inline dialog, no separate form

**Rule: If an action requires a full page change, it's a design error.**

### 3. Signal, Not Data

Every displayed data point carries a meaning and an action recommendation. Never show neutral data.
- Not: "Last contact: May 14" → Instead: "12 days without contact — follow-up recommended 🟡"
- Not: "Stage: Proposal" → Instead: "8 days in Proposal — longer than average 🔴"

Color + icon + text together = always an action recommendation.

### 4. Cmd+K — Universal Navigation & Action Layer

From anywhere in the app. Cmd+K is **not** the AI chat — it's fast, predictable, direct.
- Navigation: "Mein Tag", "Hunter", "Farmer", "Jira"
- Search: contact name, company, deal title (results appear while typing)
- Quick actions: "Neuer Kontakt", "Neue Task", "Deal gewonnen"

The AI Chat handles complex, context-dependent actions. Cmd+K handles speed.

### 5. AI in Background — Human in Foreground

Claude works invisibly. The rep sees only results.
- Kurzakte updated automatically after every new communication — rep types nothing
- Next step suggested — rep confirms only
- Follow-ups pre-drafted — rep reviews and sends
- Reminders auto-set when signals require it

---

## Database — Key Tables

Full schema in `docs/database.md`. Key points:

- **`users`** — role field: `solo | hunter | farmer | admin`
- **`companies`** — `cluster TEXT[]` (array, multi-value), `kurzakte TEXT` (AI-maintained), `heat_status`, `churn_risk_level`
- **`contacts`** — `personality_type TEXT` (rot/gelb/gruen/blau, AI-derived), Sherloq usage fields — Kurzakte lebt in eigener Tabelle `kurzakte_entries` (Append-Only)
- **`communications`** — basis for engagement chain, heat status calc, Kurzakte updates
- **`pipeline_deals`** — `deal_volume` is a PostgreSQL generated column: `(mrr × contract_duration_months) + one_off`
- **`pipeline_stages`** — stages stored in DB, not hardcoded. `pipeline_deals.stage` stores the stage `id`, not the name
- **`tasks`** — never delete, only set `status = deleted`. System-generated tasks always have `suggested_channel` + `suggested_message`
- **`system_config`** — every configurable threshold/value lives here, not in code
- **`audit_log`** — every write (UI, chat, Cmd+K, routine) must create an entry here
- **`heat_status_config`** — thresholds for heiss/warm/lauwarm/kalt/tot (days since last contact)

---

## Coding Standards

### Comments: English, Always WHY Not WHAT
```typescript
// Good: filters contacts past heat threshold to trigger status update task
// Bad: loops through contacts
```

### No Hardcoded Values — Ever
Every configurable number, text, or threshold goes in `system_config` table.
```typescript
// Wrong:
const FOLLOWUP_DAYS = 5;

// Right:
const config = await getSystemConfig('followup_auto_days'); // default: 5
```

### Every Write Function Gets an Audit Log Entry
Every function that creates, updates, or deletes data must write to `audit_log`.
Implement via Supabase database trigger so nothing can be missed.

### Every Function Checks Permissions
```typescript
// Before any write operation:
await checkPermission(userId, resource, action); // throws if unauthorized
```

### Supabase Patterns
- Use RLS — `assigned_to = auth.uid()` for user-scoped data
- Admin sees all: RLS policy checks `users.role = 'admin'`
- Use Supabase realtime subscriptions for live updates (task completion, heat status changes)

### TypeScript
- Strict mode on
- All Supabase table types generated from schema (`supabase gen types typescript`)
- No `any` — use proper types or `unknown` with type guards

---

## Neue Design ZIPs — immer so vorgehen

1. Erst analysieren: welche Komponenten sind neu, welche existieren bereits?
2. Bestehende Komponenten nie neu bauen — nur neue umsetzen
3. Neue Komponenten immer mit unseren Tokens aus index.css umsetzen
4. Fremde Hex-Werte → nächstliegender Token aus unserem System
5. Nie neue CSS-Klassen außerhalb von globals.css anlegen
6. Immer Bestätigung einholen bevor gebaut wird

---

## Realtime Events & Webhooks — PFLICHT bei Datenbankbau

**NIEMALS Supabase verbinden ohne diese fünf Punkte vollständig implementiert.**

### 1. Supabase Realtime aktivieren
```sql
alter publication supabase_realtime add table
  contacts, companies, tasks, pipeline_deals,
  communications, kpis_daily, jira_tasks;
```

### 2. Webhook Endpunkte als Vercel API Routes

| Route | Body | Aktion |
|---|---|---|
| `POST /api/webhooks/sherloq-signal` | `{ contact_id, signal_type, payload }` | Signal in `communications` schreiben, Task erstellen, Signale-Feed aktualisieren |
| `POST /api/webhooks/sherloq-usage` | `{ contact_id, login_at, enrichments, messages, posts }` | `contacts` updaten, Churn Risk neu berechnen, Upsell Signal wenn Limit >80% |
| `POST /api/webhooks/email-received` | `{ contact_email, subject, body, sentiment }` | Communication erstellen, `followup_status` → `answered`, Kurzakte-Update triggern |
| `POST /api/webhooks/slack-message` | `{ contact_id, message, channel, direction }` | Communication erstellen, Heat Status prüfen, Kurzakte-Update triggern |
| `POST /api/webhooks/teams-message` | `{ contact_id, message, channel, direction }` | Communication erstellen, Heat Status prüfen, Kurzakte-Update triggern |
| `POST /api/webhooks/hubspot-update` | `{ contact_id, deal_id, field, old_value, new_value }` | `pipeline_deals` updaten, Stage-Änderung vorschlagen wenn relevant |
| `POST /api/webhooks/jira-update` | `{ jira_id, status, priority, assigned_to }` | `jira_tasks` updaten, Alert in Mein Tag wenn kritisch |
| `POST /api/webhooks/calendar-event` | `{ contact_id, event_type, start_time, title }` | Meeting-Prep vorbereiten, Communication erstellen, Stage-Änderung wenn Keywords (Demo, Onboarding, Trial) |

**Sicherheit:** Jeder Webhook prüft `x-webhook-secret` Header gegen Vercel Environment Variable. Ohne gültigen Secret → sofort `401`.

### 3. Database Triggers (immer mitbauen)
- **Cluster-Vererbung** — Company wird Customer → alle verknüpften Contacts automatisch mitziehen
- **Audit Log** — alle Tabellen schreiben automatisch in `audit_log`
- **Heat Status Timestamp** — `heat_status_updated_at` auf `now()` bei jeder Statusänderung
- **Updated At** — alle Tabellen mit `updated_at` Feld automatisch aktualisieren

### 4. Frontend Subscriptions
Jede Komponente die Live-Daten zeigt **muss** einen Supabase Channel haben. Pattern einmal definieren, überall anwenden — nie einzeln nachrüsten.

Betroffene Bereiche: Kacheln, Drawer, Mein Tag, Pipeline Kanban, Signale-Feed.

Ohne Subscriptions sieht der User veraltete Daten bis er die Seite neu lädt.

### 5. Offline Handling
- Toast wenn Verbindung verloren
- 3× Retry für Webhooks mit exponential backoff: `1s → 5s → 30s`
- Vollständiger Refresh nach Reconnect
- `error_log` Tabelle für fehlgeschlagene Events

---

## Key Business Logic

### Heat Status Calculation
Runs daily (Claude Routine). Compares `communications.occurred_at` (most recent per contact) against `heat_status_config` thresholds. When contact transitions from warm → kalt: auto-create task. When → tot: task + Churn Warning in Mein Tag.

### Kurzakte — How It Works

Living AI-maintained log per contact. After every new communication the AI adds a new entry — it never overwrites existing ones.

**Datenmodell:** Nicht `kurzakte TEXT` auf dem Kontakt, sondern eine eigene Tabelle:
```sql
kurzakte_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id),
  content     TEXT NOT NULL,
  source      TEXT NOT NULL,  -- 'ai' | 'manual'
  created_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID REFERENCES users(id)  -- null wenn source = 'ai'
)
```

**Warum Append-Only (nie überschreiben):**
- Löst das "Stille Post"-Problem: Fehler der AI akkumulieren sich nicht
- Die Tabelle IS die Versionshistorie — kein separates System nötig
- User kann jederzeit manuelle Einträge ergänzen
- Anzeige: letzte 3–5 Einträge, ältere per "Mehr anzeigen" erreichbar

**AI-Update-Ablauf:**
1. AI liest letzte 5 Einträge der Kurzakte als Kontext
2. AI liest neue Kommunikation
3. AI schreibt **einen neuen Eintrag** — kompakt, 1–3 Sätze
4. Niemals bestehende Einträge ändern oder löschen

**Content eines Eintrags:** Beziehungsqualität, Objections, Buying Signals, Persönlichkeitstyp, offene TODOs, empfohlener Next Step.

**Kosten mit claude-haiku** (empfohlen für Kurzakte-Updates):
- ~700 Token Input + ~300 Token Output = $0.00055 pro Update
- 100 Kontakte × täglich = ~**1.65 €/Monat pro User**
- 500 Kontakte × täglich = ~**8 €/Monat pro User**
- Haiku ist ~20× günstiger als Sonnet für diesen Task — Zusammenfassen braucht kein Sonnet

### Pipeline Deal — No Task Warning
Every active deal without an open task gets flagged: "⚠️ Keine Aufgabe hinterlegt". Appears on pipeline card, lead list, and in Mein Tag. Not a hard block — disappears only when a task is created.

### Cluster Cascade
When a Company's cluster changes to include "Customer", all linked Contacts automatically get "Customer" added to their cluster too. Implemented via Supabase trigger or Claude Routine.

### Personality Types (DISG-inspired, AI-derived)
- **Rot**: dominant, direct, results-oriented, minimal small talk
- **Gelb**: enthusiastic, creative, relationship-oriented, needs validation
- **Grün**: harmony-seeking, patient, needs time for decisions
- **Blau**: analytical, detail-oriented, needs facts and proof

---

## Documentation Standard

After every completed module, write docs under `/docs/modules/[module].md`.
Format (Stripe/Linear standard):
```
# Module Name
## Overview (2-3 sentences)
## How it works (step by step)
## Data Model (which tables/fields)
## Functions & Parameters
## Configuration (which system_config keys)
## Error Handling
## Examples
## Known Limitations
```

Doc files:
```
/docs/README.md              → project overview, setup
/docs/architecture.md        → full architecture, decisions
/docs/database.md            → complete schema, all tables, RLS
/docs/modules/mein-tag.md
/docs/modules/hunter.md
/docs/modules/farmer.md
/docs/modules/cmd-k.md
/docs/modules/routines.md
/docs/modules/ai-chat.md
/docs/api/function-reference.md   → all AI-chat callable functions
/docs/CHANGELOG.md
/llms.txt                    → AI-readable entry points (create at end)
```

---

## Build Order (from Briefing Section 22)

1. **Design First** — clickable prototype with dummy data, all screens, all states
2. **Finalize Schema** — based on what the design actually needs
3. **Supabase Setup** — tables incl. system_config, RLS, Auth
4. **Connect Frontend** — real data replacing dummies
5. **Claude Routine** — daily sync
6. **MCP Endpoints** — dashboard becomes its own API for Claude
7. **AI Chat + Function Calling** — after the base is stable
8. **Iterate** — add features, refine UI

---

## Repository

- GitHub: `pandapau-ship-it/sales-os`
- Vercel: connect via vercel.com/new → import from GitHub
- Branch strategy: `main` is always deployable. Feature branches for larger changes.

---

*Owner: Oliver (Prossi) | Created: Mai 2026 | Briefing status: Final*

---

## 9. AI Chat Architektur — Kernprinzip (NIEMALS abweichen)

### Grundprinzip: AI interpretiert — Browser rendert

Der AI-Chat-Call hat EINE einzige Aufgabe: die Nutzeranfrage interpretieren und einen strukturierten
JSON-Befehl zurückgeben. Er baut KEINE UI, er generiert KEINEN HTML-Code, er entscheidet NUR was
angezeigt wird.

Alle UI-Komponenten sind bereits fertig im Code — vorgebaut, unsichtbar. Der AI-Call kostet
~50-100 Token. Er gibt zurück:

```json
{ "render": "cold_leads", "filters": { "days": 14 } }
```

Der Browser liest das JSON und macht die richtige Komponente sichtbar. Kein Neu-Bauen,
kein zweiter AI-Call. Daten kommen live aus Supabase — kostet keine Token.

### Component Registry — Pflicht für jede neue Komponente

Jede neue Komponente die gebaut wird, wird SOFORT in der zentralen Registry registriert.
Die Registry liegt in: src/lib/componentRegistry.ts

```typescript
// Every component that the AI Chat can show must be registered here.
// The AI returns a render key — the registry maps it to the component.
export const COMPONENT_REGISTRY = {
  leads_today:    { component: 'LeadList',      filter: 'today' },
  cold_leads:     { component: 'LeadList',      filter: 'cold' },
  stagnating:     { component: 'LeadList',      filter: 'stagnating' },
  churn_risks:    { component: 'CustomerList',  filter: 'churn' },
  upsell:         { component: 'CustomerList',  filter: 'upsell' },
  pipeline:       { component: 'PipelineChart', filter: null },
  contact_detail: { component: 'ContactDrawer', filter: null },
  mail_drafts:    { component: 'MailDraftList', filter: null },
  // Neue Komponenten immer hier eintragen — nie vergessen.
}
```

Wenn eine neue Seite oder Komponente gebaut wird: Registry-Eintrag ist Pflicht.
Claude Code darf KEINE Komponente bauen die nicht in der Registry steht.
Claude Code erinnert den User am Session-Ende aktiv daran: welche Komponenten heute gebaut wurden und ob sie bereits in der Registry stehen.

### Drei Antwort-Typen des AI-Chats

**Typ 1 — Text** (keine Daten nötig)
Trigger: Erklärungen, Definitionen, allgemeine Fragen
Token-Kosten: ~50-100
Beispiele: "Was ist Churn Rate?", "Erkläre mir Heat Status", "Wie funktioniert die Pipeline?"
Verhalten: Antwort erscheint nur im Chat. Kein Panel, keine Komponente.

**Typ 2 — Daten anzeigen** (Komponente + Supabase-Query)
Trigger: Konkrete Datenanfragen mit oder ohne Filter
Token-Kosten: ~50-100 (nur Interpretation)
Beispiele: "Zeig kalte Leads", "Wer stagniert seit 10 Tagen?", "Meine Pipeline diese Woche"
Verhalten: AI gibt render-key + filter zurück. Browser holt Daten aus Supabase.
Komponente wird sichtbar. Daten werden live geladen.

**Typ 3 — Workflow** (mehrstufig, höhere Token-Kosten)
Trigger: Aktionen auf einer angezeigten Liste, Bulk-Operationen
Token-Kosten: ~200-400 pro Kontakt (akzeptabel, einmalig)
Beispiele: "Schreib allen eine personalisierte Mail", "Erstelle für jeden eine Task"
Verhalten: AI liest Kurzakte + Kommunikationshistorie aus Supabase pro Kontakt.
Generiert individuellen Inhalt. Zeigt Ergebnisse als editierbare Liste.
User reviewed, bestätigt, sendet — alles auf einer Seite ohne Seitenwechsel.

### Workflow-Beispiel: Kalt-Liste → personalisierte Mails → versenden

```
Schritt 1: "Zeig mir alle kalten Leads älter als 14 Tage"
  → AI: { render: "cold_leads", filters: { min_days: 14 } }
  → Supabase Query läuft, Liste erscheint oben
  → Token-Kosten: ~80

Schritt 2: "Schreib jedem eine personalisierte Mail"
  → AI liest pro Kontakt: Kurzakte, letzter Touchpoint, Persönlichkeitstyp
  → Generiert individuelle Mail basierend auf Kontext
  → Mails erscheinen als editierbare Kacheln oben
  → Token-Kosten: ~300 pro Kontakt (bei 5 Kontakten: ~1.500 Token)

Schritt 3: User reviewed, bearbeitet einzelne Mails inline

Schritt 4: "Sende alle" oder einzeln bestätigen
  → Versand via Unipile API (LinkedIn DM) oder SMTP (Email)
  → Kommunikation wird automatisch in communications-Tabelle geschrieben
  → Token-Kosten: 0 (kein AI-Call nötig)
```

### Wo der AI-Chat sitzt — UI-Platzierung

Der Chat ist KEIN vollständiger Screen — er ist eine Schicht über der App.

Optionen (Entscheidung noch offen, Infrastruktur für alle vorbereiten):
- Floating Button unten rechts → öffnet Chat-Panel
- Feste Leiste unten → immer sichtbar, minimierbar
- Cmd+K → öffnet Chat-Modus (getrennt von Navigation/Suche)

WICHTIG: Cmd+K und AI-Chat sind STRIKT getrennt.
- Cmd+K = Navigation + Schnellaktionen (kein AI, direkte Ausführung)
- AI-Chat = Interpretation + Workflows + Analyse (kein direktes Navigieren)

### Token-Kosten Übersicht (Orientierung für Entscheidungen)

| Aktion | Token-Kosten | Wann |
|---|---|---|
| Frage interpretieren | ~50-100 | Jede Anfrage |
| Daten anzeigen | ~50-100 | Typ 2 Anfragen |
| 1 Mail generieren | ~200-400 | Typ 3 Workflow |
| 10 Mails generieren | ~2.000-4.000 | Typ 3 Bulk |
| Kurzakte fortschreiben | ~300-500 | Via Routine, nicht Chat |
| Supabase Query | 0 | Immer kostenlos |
| UI rendern | 0 | Immer kostenlos |

Bulk-Aktionen (>10 Kontakte gleichzeitig) immer mit Bestätigung:
"Du bist dabei X Mails zu generieren — das kostet ca. Y Token. Fortfahren?"

### Sicherheitsregeln für den AI-Chat

- Destruktive Aktionen (Löschen, Massenupdates) immer mit Bestätigung — auch im Chat
- Versand von Nachrichten immer mit Preview + expliziter Bestätigung pro Kontakt ODER Bulk-Bestätigung
- AI schreibt NIE direkt in die Datenbank — immer via definierte Supabase Functions
- Jede AI-Chat-Aktion wird im audit_log gespeichert (source: 'ai_chat')

---

## 10. SaaS-Readiness — Technische Grundregeln

- Jede Tabelle bekommt von Anfang an eine `workspace_id UUID NOT NULL REFERENCES workspaces(id)`. Keine Ausnahme.
- Jede RLS-Policy prüft immer zwei Bedingungen: `assigned_to = auth.uid()` UND `workspace_id = current_workspace_id()`. Nie nur eine.
- Jede Supabase-Query im Frontend filtert immer zusätzlich auf `workspace_id` — nie weglassen.
- Eine Tabelle `workspaces` wird als erstes angelegt — vor allen anderen Tabellen.
- Eine Tabelle `workspace_members` verknüpft User mit Workspaces und deren Rolle darin.
- AI-Kosten werden pro Workspace getrackt — jeder API-Call schreibt `tokens_used + workspace_id` in eine `ai_usage` Tabelle.
- Plan-Limits werden in `workspaces.plan` gespeichert — alle Features prüfen vor Ausführung ob das Limit erreicht ist.
- Kein Feature wird gebaut ohne diese Prüfung: funktioniert das auch wenn `workspace_id` eines anderen Kunden drin steht?
- **Felder-Editierbarkeit:** Kein Feld wird im Code als "nicht editierbar" fest verdrahtet. Welche Felder der User bearbeiten kann wird ausschließlich über die `permissions` Tabelle gesteuert. Neue Edit-Funktionen sind jederzeit ohne Datenbankumbau ergänzbar.
- **Rollen & Ownership:** Jeder Datensatz in jeder Tabelle bekommt von Anfang an drei Felder:
  - `created_by UUID REFERENCES users(id)` — wer hat es angelegt
  - `assigned_to UUID REFERENCES users(id)` — wer ist verantwortlich
  - `workspace_id UUID REFERENCES workspaces(id)` — welcher Workspace

  Die konkreten Rollen und ihre Rechte werden später in der `permissions` Tabelle definiert — die Infrastruktur ist aber von Tag 1 vorhanden. Kein Feature wird gebaut ohne diese drei Felder. Keine Ausnahme.

---

## 11. Kommunikations-Infrastruktur — Webhook & Parser

**Grundprinzip:** Die Kommunikations-Infrastruktur ist kanalagnostisch gebaut. Egal ob die Daten von Unipile, Gmail API, Microsoft Graph oder einem anderen Kanal kommen — sie landen immer gleich in der `communications` Tabelle. Der Rest des Systems weiß nicht woher die Daten kommen.

**Webhook-Endpunkt:** Eine zentrale Vercel Function `/api/webhooks/communications` empfängt alle eingehenden Events — egal von welcher Quelle. Jede Quelle bekommt ihren eigenen Parser, aber denselben Endpunkt.

**Parser-Struktur:** Für jeden Kanal gibt es einen eigenen Parser unter `src/lib/parsers/`. Jeder Parser gibt dasselbe Format zurück:
```ts
{ contact_id, company_id, channel, direction, subject, summary, sentiment, occurred_at, raw_content }
```

**Neue Kanäle ergänzen:** Neuen Parser unter `src/lib/parsers/[kanal].ts` anlegen, im zentralen Webhook-Router registrieren. Kein anderer Code muss angefasst werden.

**Supabase Trigger:** Nach jedem neuen Eintrag in `communications` feuert automatisch ein Trigger — dieser stößt die Kurzakte-Fortschreibung an und prüft ob ein Follow-up Timer gestartet werden muss.

**Aktuell geplante Quellen:**
- Unipile (LinkedIn, WhatsApp, Email, Slack in einem)
- Gmail API direkt (Fallback falls kein Unipile)
- Microsoft Graph direkt (Fallback falls kein Unipile)

**LinkedIn-Hinweis:** LinkedIn-Nachrichten sind ohne Unipile oder offizielle LinkedIn-Partnerschaft nicht zugänglich. Die Infrastruktur ist so gebaut dass Unipile jederzeit ergänzt werden kann — aber nie vorausgesetzt wird.

---

## 12. Smart Lists — KI-gesteuerte dynamische Listen

Smart Lists können auf zwei Wegen erstellt werden — beide schreiben in dieselbe Tabelle:

1. **Per AI Chat** — *"Erstelle mir eine Liste aller Kunden die Analytics noch nicht genutzt haben."* Die AI schreibt die Filter als JSONB, Supabase führt die Query aus.
2. **Per UI (kommt noch)** — User baut die Liste manuell über einen Filter-Builder. Ergebnis: dasselbe JSONB-Format in derselben Tabelle.

Kein Unterschied im Datenmodell — nur der Erstellungsweg ist anders.

### Schema

```sql
-- Die Liste selbst (Regel-Definition)
smart_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  filters      JSONB NOT NULL,   -- Filterregeln als JSON (kein SQL)
  entity_type  TEXT NOT NULL,    -- 'contacts' | 'companies' | 'deals'
  created_by   UUID REFERENCES users(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  is_shared    BOOLEAN DEFAULT false,
  last_run_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
)

-- Gecachte Ergebnisse der Liste
smart_list_members (
  list_id    UUID REFERENCES smart_lists(id) ON DELETE CASCADE,
  entity_id  UUID NOT NULL,
  added_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (list_id, entity_id)
)
```

### JSONB Filter-Format

```json
{
  "entity_type": "contacts",
  "rules": [
    { "field": "feature_usage.analytics", "operator": "never" },
    { "field": "status",                  "operator": "eq", "value": "aktiv" }
  ],
  "logic": "AND"
}
```

### Render Keys

| Key | Beschreibung |
|-----|-------------|
| `smart_list` | AI erstellt neue Liste, zeigt Ergebnis sofort |
| `smart_list_result` | Bestehende Liste öffnen + Re-Run Option |

### Regeln

- AI schreibt JSONB-Filter — kein SQL, kein direkter DB-Zugriff
- Listen gehören immer zu einem `workspace_id` — nie global
- `last_run_at` wird bei jedem Re-Run aktualisiert
- `smart_list_members` wird bei Re-Run vollständig neu befüllt (TRUNCATE + INSERT)

---

## AI Automation Architecture — Pflichtregeln (nie weglassen)

Das System wird schrittweise zu einem vollautomatischen AI-Agenten ausgebaut.
Jede Funktion die heute gebaut wird, muss diese Zukunft ermöglichen — ohne Umbau.

### Pflichtfelder für JEDE Aktion (Task, Outreach, Sequenz-Step, Follow-up)

Jede Tabelle die Aktionen speichert (`tasks`, `contact_sequences`, `communications`) muss enthalten:

```
source          TEXT    -- manual | ai_suggested | ai_automated
execution_mode  TEXT    -- manual | semi_auto | full_auto
executed_by     UUID    -- user_id ODER 'ai' als Marker
approved_by     UUID    -- user_id wenn bestätigt, null wenn nicht nötig
approved_at     TIMESTAMPTZ -- wann bestätigt, null wenn full_auto oder manual
```

Kein Task, keine Outreach, kein Sequenz-Step darf ohne diese 5 Felder gebaut werden.

### Automation Modes — was sie bedeuten

| Mode | Bedeutung |
|------|-----------|
| `manual` | AI schlägt vor, User entscheidet und führt aus |
| `semi_auto` | AI bereitet vollständig vor, User sieht es und bestätigt mit einem Klick |
| `full_auto` | AI führt direkt aus, kein User-Eingriff, wird nur geloggt |

### User-Settings — in system_config von Anfang an anlegen

Diese Keys müssen beim DB-Setup in `system_config` eingefügt werden:

| Key | Standard |
|-----|----------|
| `automation_sequenz_execution` | `manual` |
| `automation_outreach_linkedin` | `manual` |
| `automation_outreach_email` | `manual` |
| `automation_follow_up` | `semi_auto` |
| `automation_task_creation` | `semi_auto` |

Der User kann diese Werte später per AI Chat ändern:
- "Stelle LinkedIn Outreach auf semi_auto"
- "Aktiviere vollautomatische Follow-ups"

### Was JETZT gebaut wird — was SPÄTER kommt

**JETZT (Infrastruktur):**
- Felder in allen relevanten Tabellen
- `system_config` Keys anlegen
- Jede Funktion prüft `execution_mode` bevor sie ausführt

**SPÄTER (wenn bereit):**
- Tatsächliches Senden via LinkedIn/Email API
- Approval-Flow UI (Bestätigungs-Inbox)
- Full-Auto Engine in Claude Routines

### Prüffrage vor jeder neuen Funktion

Bevor du eine neue Aktion baust: *"Könnte die AI das eines Tages automatisch ausführen?"*
Wenn ja → `execution_mode`, `source`, `approved_by`, `executed_by` müssen in die Tabelle.

---

## MCP & Externe Schnittstellen — Pflichtregeln

Das System wird später als MCP Server betrieben und eine direkte
Schnittstelle zu Sherloq via MCP erhalten. Jede Funktion die heute
gebaut wird muss das ermöglichen — ohne Umbau.

### Grundregel — kein Business-Logic im Frontend

Kein berechneter Wert darf direkt im React-Code entstehen.
Alles was berechnet, aggregiert oder transformiert wird läuft in:
- Supabase Database Functions
- Supabase Edge Functions

Beispiele die **NICHT** im Frontend passieren dürfen:
- Heat-Status Berechnung
- Churn-Score Berechnung
- ICP-Score Berechnung
- Sequenz-Step Logik
- Signal-Erkennung

### Edge Functions — von Anfang an als API-Endpunkte bauen

Jede Edge Function wird so gebaut als würde sie auch extern aufgerufen:
- Klare Input/Output Parameter (JSON)
- Authentifizierung via Bearer Token (Supabase Auth)
- Fehlerbehandlung mit klaren HTTP Status Codes
- Kein hardcodierter State

Diese Edge Functions sind später automatisch der MCP Server —
die Endpunkte existieren bereits, nur der MCP-Wrapper kommt dazu.

### Supabase Edge Functions die von Anfang an so gebaut werden

| Function | Output |
|----------|--------|
| `get_contact_summary(contact_id)` | Kurzakte + Status + Signale |
| `get_pipeline_summary(user_id)` | Pipeline-Übersicht + Werte |
| `get_churn_risks(user_id)` | Alle Kunden mit Churn-Signal |
| `get_signals_today(user_id)` | Alle Signale des Tages |
| `get_smart_list(list_id)` | Dynamische Listen-Ergebnisse |
| `execute_action(action_type, payload)` | Universelle Aktions-Funktion |

### Was JETZT gebaut wird — was SPÄTER kommt

**JETZT:**
- Alle Business-Logic in Supabase Functions, nie im Frontend
- Edge Functions mit sauberen JSON Ein-/Ausgaben
- Auth via Supabase Bearer Token auf allen Functions

**SPÄTER:**
- MCP Server Wrapper über bestehende Edge Functions
- Sherloq Schnittstelle via MCP (Signale, Usage-Daten, Enrichments)
- Externe Tool-Integration (andere AI Agents, n8n, Zapier)

### Prüffrage vor jeder neuen Funktion

*"Könnte ein externer MCP Client diese Funktion aufrufen?"*
Wenn ja → muss als Edge Function gebaut werden, nicht als Frontend-Logik.
