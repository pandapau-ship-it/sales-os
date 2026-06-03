# Sales OS — Claude Persistent Memory

> Read this file before doing anything else in a new session. It is the single source of truth for how this project is built.

---

## Session Protocol

**At the start of every session:**
1. `git pull` — get latest changes
2. Read `CLAUDE.md` (this file)
3. Read `PROGRESS.md` — understand what's done and what's next

**Pflicht-Prüffrage VOR jeder neuen Komponente:**
> "Ist das eine interaktive Komponente?" — Modal, Dropdown, Tooltip, Select, Tabs, Popover, Sheet
> → JA: **STOP. Shadcn-Primitiv aus `src/components/ui/` verwenden. Niemals selbst bauen.**
> → Nicht installiert: `npx shadcn add [component]` ausführen, dann verwenden.
> → NEIN: Tailwind + CSS-Tokens wie gewohnt.

Diese Regel gilt absolut. Kein Ausnahme für "schneller selbst gebaut".

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
| Server-State | **TanStack Query** | Einzige Quelle für Server-Daten — kein `useEffect`+`fetch` (→ Performance & Data Loading) |
| Listen-Virtualisierung | **@tanstack/react-virtual** | Pflicht für Listen > 50 Zeilen |
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

**Badge / Status-Pill Muster (verbindlich für ALLE Screens):**

NIEMALS Emojis in Badges (✅ ✖️ 🆕 ⌛ etc.) — immer Lucide-Icons.

```tsx
// Jede Badge-Config gibt zurück: { bg, text, border, icon, label }
// icon = Lucide-Komponente, nie Emoji-String
<div className={`px-2.5 py-1 rounded-[7px] text-[11px] font-medium border flex items-center gap-1.5 w-fit ${cfg.bg} ${cfg.text} ${cfg.border}`}>
  {cfg.icon}   {/* z.B. <CheckCircle2 className="w-3 h-3" /> */}
  {cfg.label}
</div>
```

Heat-Badges (HOT/WARM/LUKEWARM/COLD) verwenden `●` CSS-Dot statt Icon:
```tsx
<div className={`... ${heat.bg} ${heat.text} ${heat.border}`}>
  <span style={{ color: heat.dot, fontSize: 8, lineHeight: 1 }}>●</span>
  {heat.label}
</div>
```

**Icon-Auswahl für Status-Badges:**
| Status | Icon | Farbe |
|--------|------|-------|
| Aktiv / Erfolg | `CheckCircle2` | `text-signal-success` |
| Trial / Neu | `Zap` | `text-signal-info` |
| Abgelaufen / Warten | `Clock` | `text-text-muted` |
| Cancelled / Fehler | `XCircle` | `text-signal-urgent` |
| Warnung | `AlertTriangle` | `text-signal-warn` |
| Signal / Hot | `Flame` | orange |

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
                     ⚠️ Nav-Mapping: ScreenHunting = "Hunter", ScreenFarming = "Farmer".
                     AI SDR Screen ist neu zu bauen. (Dateinamen ggf. später angleichen.)
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

### Primäre Navigation — exakt VIER Punkte

```
Mein Tag  |  AI SDR  |  Hunter  |  Farmer
```

Produktsatz dahinter:
> "AI SDR erzeugt Pipeline. Hunter gewinnt Deals.
>  Farmer entwickelt Kunden. Mein Tag sagt dir was heute zählt."

NICHT mehr: ~~Mein Tag | Hunting | Farming~~ (alte 3er-Struktur).
NICHT mehr primär: Marketing, Sherloq System → als **sekundäre** Bereiche
behandeln. Jira bleibt sekundär (eigener Pill, abgesetzt).

> ⚠️ Code-Stand: `TopBar.tsx` hat aktuell noch `Mein Tag | Hunting | Farming`.
> Muss bei der Umsetzung auf die 4 primären Punkte gebracht werden
> (AI SDR ist ein neuer Screen, Hunting→Hunter, Farming→Farmer).

### Top bar — `TopBar.tsx` (primary section navigation)
Horizontal pill navigation, absolut zentriert, Sliding-Pill-Animation.
- **4 primäre Sektionen als Pills**: Mein Tag · AI SDR · Hunter · Farmer
- **Jira / Marketing / Sherloq System** als sekundäre Pills (abgesetzt)
- **Right side**: Cmd+K pill button + user avatar
- Active pill: `var(--sherloq-primary)` + white text (Sliding-Pill)
- Inactive: transparent, gray text — zero borders

### Left sidebar — `Sidebar.tsx` (context-sensitive sub-nav)
Icon-only sidebar, ändert Inhalt je nach aktiver Sektion.
- Sub-nav je Sektion (z.B. Hunter → Signale · Stagnierende Deals · Follow-ups · Pipeline)
- Inbox-Icon zwischen AI SDR und Kalender (→ Inbox-Sektion)
- Utility-Buttons (Settings, Theme) unten gepinnt
- Mein Tag hat keine Sub-Items → nur Utility-Buttons

### Role-based access (`navConfig.tsx → roleAccess`)
- `solo` / `admin` → alle 4 primären Sektionen + sekundäre
- `hunter` → Mein Tag · AI SDR · Hunter · Jira
- `farmer` → Mein Tag · Farmer · Jira

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
- Navigation: "Mein Tag", "AI SDR", "Hunter", "Farmer", "Jira"
- Search: contact name, company, deal title (results appear while typing)
- Quick actions: "Neuer Kontakt", "Neue Task", "Deal gewonnen"

The AI Chat handles complex, context-dependent actions. Cmd+K handles speed.

**Cmd+K ist für Zugriff — nicht für Awareness.**
- Über Cmd+K erreichbar: alle Leads/Kunden/Kontakte/Companies/Deals, alle Signale,
  alle Automationen, Suche.
- Awareness entsteht NICHT über Cmd+K. Relevante Signale zeigt das System
  proaktiv in: **Mein Tag · AI SDR · Hunter · Farmer**.

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

> Subscription-Limits, Cache-Invalidierung und wie Realtime mit TanStack Query
> zusammenspielt → siehe **Performance & Data Loading** am Ende dieser Datei.

### 5. Offline Handling
- Toast wenn Verbindung verloren
- 3× Retry für Webhooks mit exponential backoff: `1s → 5s → 30s` (serverseitig)
- Vollständiger Refresh nach Reconnect
- `error_log` Tabelle für fehlgeschlagene Events

> Wie der User Fehler erlebt (Timeouts, Eskalation, Formulierung) → siehe
> **Fehlerbehandlung aus User-Sicht** am Ende dieser Datei.

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

> **Terminologie:** Das System verwendet `organization_id` / `organizations` als Standard.
> Ältere Abschnitte (Smart Lists, aiCall) wurden entsprechend aktualisiert.
> Niemals `workspace_id` neu einführen — immer `organization_id`.

Das System wird als vollständiges SaaS-Produkt betrieben.
Mehrere Kunden (Organisationen) teilen dieselbe Infrastruktur.
Kein Kunde darf Daten eines anderen Kunden sehen oder beeinflussen.

### 1. Multi-Tenancy — organization_id Pflichtfeld

JEDE Tabelle bekommt dieses Feld — keine Ausnahme:
```sql
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
```

Jeder Datensatz bekommt zusätzlich drei Ownership-Felder:
- `created_by UUID REFERENCES users(id)` — wer hat es angelegt
- `assigned_to UUID REFERENCES users(id)` — wer ist verantwortlich
- `organization_id UUID REFERENCES organizations(id)` — welche Organisation

```sql
organizations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  slug                    TEXT UNIQUE NOT NULL,        -- für Subdomain später
  plan                    TEXT DEFAULT 'starter',      -- free | starter | pro | enterprise
  plan_expires_at         TIMESTAMPTZ,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  max_users               INTEGER DEFAULT 5,
  max_leads_per_month     INTEGER DEFAULT 500,
  max_ai_calls_per_month  INTEGER DEFAULT 1000,
  onboarding_completed    BOOLEAN DEFAULT false,
  onboarding_step         INTEGER DEFAULT 0,
  brand_name              TEXT,                        -- White-Label vorbereitet
  brand_logo_url          TEXT,
  brand_primary_color     TEXT,
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now()
)
```

### 2. Row Level Security — auf jeder Tabelle

RLS muss auf JEDER Tabelle aktiviert sein. Kein direkter DB-Zugriff ohne Policy.

```sql
ALTER TABLE [tabelle] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON [tabelle]
  USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
```

Jede Supabase-Query im Frontend filtert zusätzlich auf `organization_id` — nie weglassen.
JWT enthält `organization_id` als Custom Claim.
Service Role Key nur in Edge Functions — nie im Client.

### 3. Benutzer & Einladungen

```sql
invitations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  email            TEXT NOT NULL,
  role             TEXT NOT NULL,      -- admin | member | viewer
  token            TEXT UNIQUE NOT NULL,
  invited_by       UUID REFERENCES users(id),
  accepted_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ DEFAULT now() + interval '7 days',
  created_at       TIMESTAMPTZ DEFAULT now()
)
```

Flow: Admin lädt ein → Email → User klickt Link → Registrierung → landet automatisch
in richtiger Organisation → Rolle wird aus Einladung übernommen.

### 4. Billing & Plan-Limits

```sql
-- Monatliche Nutzungs-Zähler für Plan-Limit-Enforcement:
api_usage (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  action_type      TEXT NOT NULL,  -- ai_call | sequence_step | lead_created | email_sent | linkedin_dm
  count            INTEGER DEFAULT 0,
  month            TEXT NOT NULL,  -- Format: '2025-06'
  UNIQUE(organization_id, action_type, month)
)
```

Vor jedem AI Call / Sequenz-Step: `api_usage` prüfen ob Monatslimit erreicht.
Bei Limit: User informieren — kein harter Fehler, kein Silent-Fail.

Stripe-Webhook (SPÄTER): `/functions/v1/webhook-stripe`
- `checkout.completed` → plan updaten + Module freischalten
- `subscription.cancelled` → plan auf 'free' setzen

### 5. DSGVO & Datenschutz

```sql
data_deletion_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  requested_by     UUID REFERENCES users(id),
  requested_at     TIMESTAMPTZ DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  status           TEXT DEFAULT 'pending'  -- pending | processing | completed
)
```

- Cascade Delete: Organization gelöscht → ALLE Daten dieser Org werden gelöscht
- Audit Log Retention: max. 24 Monate, dann automatisch gelöscht (Cron Job)
- Data Export DSGVO Art. 20 (SPÄTER): `export_organization_data(org_id)` Edge Function

### 6. Transactional Emails (SPÄTER)

Alle Emails über `sendEmail()` in `lib/email.ts` — kein direkter Provider-Aufruf.
Provider: Resend.com oder Postmark (provider-agnostisch wie alle anderen Integrationen).

Pflicht-Emails: Einladung, Passwort-Reset, Willkommen, requires_human Notification,
Termin-Bestätigung, Sequenz-Abschluss, Plan-Ablauf-Warnung (7 Tage vorher).

### 7. Security Grundregeln

- Kein API Key im Frontend-Code — ausnahmslos
- Alle sensitiven Calls über Supabase Edge Functions
- Alle Webhooks validieren Signature vor Verarbeitung
- Rate Limiting auf allen öffentlichen Endpunkten
- Felder-Editierbarkeit wird über `permissions` Tabelle gesteuert — nie hardcoden

### Was JETZT gebaut wird — was SPÄTER kommt

**JETZT (vor erstem DB-Commit — nicht verhandelbar):**
- `organizations` Tabelle anlegen (erste Tabelle überhaupt)
- `organization_id` in jede Tabelle
- RLS auf jeder Tabelle aktivieren
- `invitations` Tabelle anlegen
- `api_usage` Tabelle anlegen (leer)
- Cascade Delete auf allen Tabellen
- `organization_id` in JWT Custom Claim

**SPÄTER (vor Launch):**
- Stripe Integration + Webhooks
- Onboarding Wizard (5 Schritte)
- DSGVO Export/Löschungs-Flow
- Transactional Emails (`lib/email.ts`)
- Subdomain Support (`slug` bereits vorbereitet)
- White-Label Theming (`brand_*` bereits vorbereitet)

### Prüffrage vor jeder neuen Tabelle

1. Hat sie `organization_id`? → Wenn nein: hinzufügen
2. Ist RLS aktiviert + `org_isolation` Policy gesetzt? → Wenn nein: aktivieren
3. Hat sie `ON DELETE CASCADE`? → Wenn nein: hinzufügen
4. Ist sie im Data-Export enthalten? → Wenn nein: dokumentieren

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
  created_by      UUID REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  is_shared       BOOLEAN DEFAULT false,
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
- Listen gehören immer zu einer `organization_id` — nie global
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

### User-Settings — granular pro Funktion, immer vom User steuerbar

**Kernprinzip: Der User entscheidet pro Funktion ob Human-in-the-Loop oder vollautomatisch.**
Das gilt für jede einzelne Outreach-Funktion — kein globaler An/Aus-Schalter.
Einstellbar über die Settings-UI (nicht nur per AI Chat).

Diese Keys müssen beim DB-Setup in `system_config` eingefügt werden:

**AI SDR (automatische Lead-Akquise):**
| Key | Standard | Bedeutung |
|-----|----------|-----------|
| `automation_ai_sdr_lead_creation` | `semi_auto` | AI findet Lead → User bestätigt |
| `automation_ai_sdr_first_contact` | `manual` | Erstkontakt immer vom User freigegeben |
| `automation_ai_sdr_followup` | `semi_auto` | Follow-up vorbereitet, User bestätigt |
| `automation_ai_sdr_booking_link` | `semi_auto` | Buchungslink senden nach meeting_request |

**Hunter — Recommendation Agent für Deals/Pipeline (führt NICHTS automatisch aus):**
| Key | Standard | Bedeutung |
|-----|----------|-----------|
| `automation_hunter_stagnation_alert` | `semi_auto` | Stagnierender Deal → Empfehlung vorbereiten |
| `automation_hunter_followup_reco` | `semi_auto` | Fehlendes Follow-up → Empfehlung, User entscheidet |
| `automation_hunter_signal_reco` | `semi_auto` | Neues Signal zu Pipeline-Kontakt → Interpretation + Empfehlung |
| `automation_hunter_task_creation` | `semi_auto` | Task aus Empfehlung — User bestätigt |

Hunter sendet nie eigenständig Outreach. `full_auto` ist hier nicht zulässig —
maximal `semi_auto` (AI empfiehlt, Mensch führt aus).

**Farmer — Recommendation Agent für Bestandskunden (führt NICHTS automatisch aus):**
| Key | Standard | Bedeutung |
|-----|----------|-----------|
| `automation_farmer_churn_alert` | `semi_auto` | Churn-Risiko → Warnung + empfohlene Aktion |
| `automation_farmer_upsell_reco` | `semi_auto` | Upsell-Potenzial → Empfehlung vorbereiten |
| `automation_farmer_renewal_reco` | `semi_auto` | Renewal fällig → Empfehlung, User entscheidet |
| `automation_farmer_trial_reco` | `semi_auto` | Trial-Management → Empfehlung |

Farmer sendet nie eigenständig Outreach. `full_auto` nicht zulässig — maximal `semi_auto`.

**AI SDR ist der einzige Execution Agent** — nur hier ist `full_auto` für tatsächlichen
Outreach überhaupt zulässig (LinkedIn/Email senden). Hunter + Farmer empfehlen nur.

**Allgemein:**
| Key | Standard | Bedeutung |
|-----|----------|-----------|
| `automation_sequenz_execution` | `manual` | Globaler Fallback für Sequenz-Steps — wird pro Regel von `sequence_rules.execution_mode` überschrieben |
| `automation_outreach_linkedin` | `manual` | LinkedIn-Nachrichten senden |
| `automation_outreach_email` | `manual` | Emails senden |

Default ist immer `manual` — User muss aktiv auf `semi_auto` oder `full_auto` hochstufen.
Kein Feature startet automatisch ohne dass der User das explizit eingestellt hat.

Der User kann Werte über die Settings-UI oder per AI Chat ändern:
- "Stelle AI SDR Follow-ups auf vollautomatisch"
- "Hunter: Stagnations-Empfehlungen sollen automatisch vorbereitet werden, ich bestätige"
- "Farmer: Churn-Warnungen sofort, aber mit meiner Freigabe"

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

**Read / Query:**
| Function | Output |
|----------|--------|
| `get_contact_summary(contact_id)` | Kurzakte + Status + Signale |
| `get_pipeline_summary(user_id)` | Pipeline-Übersicht + Werte |
| `get_churn_risks(user_id)` | Alle Kunden mit Churn-Signal |
| `get_signals_today(user_id)` | Alle Signale des Tages |
| `get_smart_list(list_id)` | Dynamische Listen-Ergebnisse |
| `execute_action(action_type, payload)` | Universelle Aktions-Funktion |

**Sequenz Engine (→ siehe Sequenz Engine Sektion):**
| Function | Output |
|----------|--------|
| `process_new_lead(contact_id)` | Sequenz-Zuweisung + erster Task + AI-Entwurf |
| `classify_intent(communication_id)` | intent_detected + Folge-Aktion |
| `process_sequence_step(contact_sequence_id, step)` | Ausführung je nach execution_mode |

**Integrationen:**
| Function | Output |
|----------|--------|
| `webhook-booking` | Normalisiert Calendly/Cal.com → bookings Tabelle |
| `webhook-crm-sync` | Normalisiert HubSpot/Salesforce → lokale Tabellen |

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

---

## AI SDR Automation — Vollautomatischer Outreach (Pflichtregeln)

Das System wird schrittweise zu einem vollautomatischen AI SDR ausgebaut.
Ziel: Leads finden → anschreiben → Antworten verarbeiten → Termine buchen.
Jede Funktion die heute gebaut wird muss diese Zukunft ermöglichen.

### Sending Layer — provider-agnostisch

Welcher Provider für LinkedIn, Email oder Kalender verwendet wird
ist noch nicht entschieden. Code darf NIEMALS an einen Provider gekoppelt sein.

Jede ausgehende Nachricht speichert:

```sql
sending_channel     TEXT  -- linkedin_dm | linkedin_connection | email | whatsapp | sms
sending_provider    TEXT  -- unipile | gmail_api | outlook_api | calendly | tbd
external_message_id TEXT  -- ID beim Provider für Status-Tracking
delivery_status     TEXT  -- queued | sent | delivered | read | failed | bounced
sent_at             TIMESTAMPTZ
delivered_at        TIMESTAMPTZ
read_at             TIMESTAMPTZ
```

Neuen Provider einbinden = nur eine neue Provider-Klasse schreiben.
Keine Änderung an DB oder Business-Logic nötig.

### Antwort-Verarbeitung — Intent Detection

Jede eingehende Nachricht wird von AI klassifiziert.
Folgende Felder müssen in der `communications` Tabelle vorhanden sein:

```sql
intent_detected     TEXT     -- interested | not_interested | question |
                             --  meeting_request | objection | out_of_office | unclear
intent_confidence   NUMERIC  -- 0-100
auto_reply_sent     BOOLEAN DEFAULT false
auto_reply_content  TEXT
requires_human      BOOLEAN DEFAULT false
human_reviewed_at   TIMESTAMPTZ
human_reviewed_by   UUID REFERENCES users(id)
```

Regel: intent_confidence < 70 → requires_human = true
→ erscheint sofort in Mein Tag Zone 2 als Priorität
→ User entscheidet → AI lernt aus der Entscheidung

### AI SDR Flow

Der Flow läuft vollständig durch die bestehende Sequenz-Infrastruktur.
Keine separate SDR-Tabelle nötig — alles über sequences + communications.

```
Signal erkannt (via Sherloq oder andere Lead-Quelle)
→ Lead angelegt (source = ai_automated)
→ Sequenz startet (execution_mode = full_auto wenn eingestellt)
→ Nachricht gesendet → delivery_status getrackt
→ Antwort eingehend → intent_detected
→ interested        → nächster Schritt oder Buchungslink
→ meeting_request   → Kalender-Link automatisch gesendet (→ siehe CRM Sync & Kalender)
→ not_interested    → Sequenz pausiert, Lead archiviert
→ unclear           → requires_human = true → Mein Tag Priorität
```

Automation Modes (manual / semi_auto / full_auto) und execution_mode-Felder:
→ siehe **AI Automation Architecture** weiter oben — dort vollständig definiert.

### Eskalation zum Menschen — immer möglich

Auch bei full_auto gibt es immer einen Weg zum Menschen:
- requires_human = true → sofort in Mein Tag
- User kann jede automatische Konversation jederzeit übernehmen
- Übernahme wird geloggt: human_takeover_at, human_takeover_by
- Nach Übernahme läuft Sequenz nicht mehr automatisch weiter

### Prüffrage vor jeder neuen Sending-Funktion

*"Würde das auch funktionieren wenn wir morgen den Provider wechseln?"*
Wenn nein → Abstraktion fehlt. Provider-spezifischen Code in eigene
Klasse/Funktion auslagern, nie direkt in Business-Logic.

---

## Modularer Aufbau — Pflichtregeln (nie weglassen)

Das System ist modular aufgebaut. Jedes Modul kann eigenständig
aktiviert und verkauft werden. Kein Modul darf hart von einem
anderen abhängen — Abhängigkeiten laufen immer über die DB,
nie über direkten Code-Import.

### Modul-Tabelle — in DB von Anfang an anlegen

```sql
user_modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  module        TEXT NOT NULL,
  active        BOOLEAN DEFAULT false,
  activated_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ
)
```

Gültige Werte für `module`:
- `core`           — Pflicht, immer aktiv
- `ai_sdr`         — Lead-Quellen, Sequenzen, Outreach, Inbox, Kalender
- `hunting`        — Pipeline, Kanban, Signal-Kacheln, Follow-ups
- `farming`        — Churn Risk, Upsell, Trial Management
- `mein_tag`       — Morning Briefing, Prioritäten, Tasks
- `smart_lists`    — Dynamische Listen
- `reporting`      — KPIs, Analytics, Forecast
- `settings_admin` — Admin-Bereich für alle Regeln und Einstellungen
- `crm_sync`       — HubSpot / Salesforce Sync

### Modul-Prüfung — vor jedem Component-Render

Jede Komponente die zu einem Modul gehört prüft beim Laden:

```typescript
const { hasModule } = useModules()

if (!hasModule('hunting')) {
  return <UpgradePrompt module="hunting" />
}
```

`useModules()` liest aus `user_modules` Tabelle — gecacht,
kein API-Call bei jedem Render.

Kein Modul-Check = Fehler. Jede neue Komponente muss
ihrem Modul zugeordnet sein.

### Modul-Abhängigkeiten (Reihenfolge)

```
core
  └── ai_sdr          (Lead-Quellen → Sequenzen → Inbox → Kalender)
        └── hunting   (Pipeline, Signal-Kacheln, Follow-ups)
        └── farming   (Churn, Upsell, Trial)
        └── mein_tag  (Morning Briefing, Prioritäten)
              └── smart_lists   (dynamische Listen)
              └── reporting     (KPIs, Analytics)
              └── settings_admin
              └── crm_sync
```

`core` ist immer aktiv — kein Check nötig.
Alle anderen Module prüfen ob aktiv bevor sie rendern.

### Prüffrage vor jeder neuen Komponente

*"Zu welchem Modul gehört diese Komponente?"*
Wenn unklar → in `core` bis geklärt.
Kein Code ohne Modul-Zuordnung.

---

## CRM Sync & Kalender-Integration — Pflichtregeln

### CRM Sync — provider-agnostisch

Unterstützte Systeme (erweiterbar): HubSpot, Salesforce.
Welches aktiv ist steht in `system_config`:

```
crm_provider          TEXT     -- hubspot | salesforce | none
crm_sync_enabled      BOOLEAN  DEFAULT false
crm_sync_direction    TEXT     -- inbound | outbound | bidirectional
crm_last_synced_at    TIMESTAMPTZ
```

### Sync-Felder in allen relevanten Tabellen

```sql
crm_provider        TEXT       -- hubspot | salesforce
crm_external_id     TEXT       -- ID im externen System
crm_last_synced_at  TIMESTAMPTZ
crm_sync_status     TEXT       -- synced | pending | error | conflict
crm_sync_error      TEXT       -- Fehlermeldung wenn error
```

Konflikt-Regel: Sales OS gewinnt bei Konflikten (local-first) — bei wichtigen
Feldern (Deal-Stage, ARR, Email) entscheidet aber der User.
Vollständige Logik → siehe **Datenqualität & Duplikate** am Ende dieser Datei.

### Was synchronisiert wird

- **Kontakte:** Name, Email, Telefon, Jobtitel, Company, Deal Stage, letzte Aktivität
- **Companies:** Name, Website, Branche, Größe, Subscription Status (als Custom Field im CRM)
- **Deals:** Stage, ARR, MRR, Laufzeit, Probability, Lost Reason
- **Aktivitäten:** Outreach, Meetings, Tasks → CRM Activity Log

### Kalender-Integration — provider-agnostisch

Unterstützte Systeme (erweiterbar): Calendly, Cal.com, Google Calendar.

```sql
booking_provider      TEXT         -- calendly | cal_com | google_calendar | tbd
booking_link          TEXT         -- Link der automatisch verschickt wird
booking_status        TEXT         -- link_sent | booked | cancelled | rescheduled
booked_at             TIMESTAMPTZ
meeting_confirmed_at  TIMESTAMPTZ
```

### Automatischer Buchungs-Flow

```
intent_detected = meeting_request
→ booking_link aus system_config holen
→ Link in Antwort einfügen (execution_mode beachten)
→ Lead bucht → Webhook → booked_at gesetzt
→ Meeting in Mein Tag Zone 1
→ Meeting-Prep durch Claude Routine
→ Termin in CRM als Activity geloggt
```

### Webhook-Endpunkte als Supabase Edge Functions

```
POST /functions/v1/webhook-booking
  → normalisiert Calendly / Cal.com / Google Payload
  → schreibt in bookings Tabelle
  → triggert Meeting-Prep Routine

POST /functions/v1/webhook-crm-sync
  → empfängt Updates von HubSpot / Salesforce
  → normalisiert und schreibt in lokale Tabellen
  → Konflikt-Erkennung + Logging
```

### Prüffrage vor jeder Integration

*"Würde das auch funktionieren wenn wir HubSpot durch Salesforce ersetzen — oder Calendly durch Cal.com?"*
Wenn nein → Abstraktion fehlt. Provider-Logik in eigene
Klasse auslagern, nie direkt in Business-Logic.

---

## AI Call Abstraktion — Pflichtregeln (nie weglassen)

### Grundregel — kein direkter API-Aufruf außerhalb von lib/ai.ts

Kein Code im gesamten Projekt darf den Anthropic SDK oder andere AI Provider
direkt aufrufen. Ausnahmslos.

Alle AI-Calls laufen über eine zentrale Funktion:

```
src/lib/ai.ts          → aiCall()   (Frontend: Chat-Interpretation)
supabase/functions/    → aiCall()   (Edge Functions: Routinen, Kurzakte, Intent Detection)
```

Jede Komponente, jede Route, jede Claude Routine ruft
ausschließlich `aiCall()` auf — nie den Provider direkt.

### Warum

Langfuse wird später als Observability-Layer eingebaut.
Langfuse trackt: welche Prompts, welche Antworten, Kosten pro Call,
Latenz, Fehler, User-Sessions.

Wenn alle Calls über `aiCall()` laufen, ist die Langfuse-Integration
eine Änderung an **einer einzigen Datei**.
Kein Umbau, kein Suchen im Code, kein Risiko.

Zusätzlich: `aiCall()` schreibt automatisch in zwei Tabellen — siehe **SaaS-Readiness**:
- `ai_usage` (`organization_id + tokens_used + model`) — detailliertes per-Call Logging zur Kostenanalyse
- `api_usage` (`organization_id + action_type='ai_call' + count`) — monatliche Aggregation für Plan-Limit-Enforcement

### Aufbau lib/ai.ts

```typescript
// All AI provider calls go through here — never call Anthropic SDK directly.
// Single choke-point: add Langfuse / cost tracking / retry logic once, everywhere.

import Anthropic from '@anthropic-ai/sdk'

export interface AICallOptions {
  model?:     'claude-haiku-4-5' | 'claude-sonnet-4-5' | 'claude-opus-4-5'
  system?:    string
  messages:   Array<{ role: 'user' | 'assistant'; content: string }>
  maxTokens?: number
  // Langfuse tracing metadata — prepared, not yet active
  trace?: {
    name:            string   // e.g. 'chat-interpret' | 'kurzakte-update' | 'intent-detect'
    userId?:         string
    organizationId?: string
    sessionId?:      string
    metadata?:       Record<string, unknown>
  }
}

export interface AICallResult {
  content:      string
  inputTokens:  number
  outputTokens: number
  model:        string
  durationMs:   number
}

export async function aiCall(options: AICallOptions): Promise<AICallResult> {
  const start  = Date.now()
  const client = new Anthropic()

  const response = await client.messages.create({
    model:      options.model     ?? 'claude-haiku-4-5',
    max_tokens: options.maxTokens ?? 1024,
    system:     options.system,
    messages:   options.messages,
  })

  const durationMs = Date.now() - start
  const content    = response.content[0].type === 'text' ? response.content[0].text : ''

  // ── Langfuse trace (one-line change when ready) ────────────────────────
  // await langfuse.generation({ ...options.trace, input, output, usage, durationMs })

  // ── ai_usage: per-call logging for cost analysis (see SaaS-Readiness) ──
  // await supabase.from('ai_usage').insert({
  //   organization_id: options.trace?.organizationId,
  //   tokens_used:     response.usage.input_tokens + response.usage.output_tokens,
  //   model:           response.model,
  //   call_name:       options.trace?.name,
  // })
  // ── api_usage: monthly counter for plan-limit enforcement ─────────────
  // await incrementApiUsage(options.trace?.organizationId, 'ai_call')

  return {
    content,
    inputTokens:  response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model:        response.model,
    durationMs,
  }
}
```

### Modell-Wahl — Regel

| Aufgabe | Modell | Warum |
|---------|--------|-------|
| Chat-Interpretation (was will der User?) | `claude-haiku-4-5` | ~50-100 Token, Speed wichtiger als Tiefe |
| Kurzakte fortschreiben | `claude-haiku-4-5` | Günstiger, ausreichend für Zusammenfassung |
| Intent Detection (Antwort klassifizieren) | `claude-haiku-4-5` | Schnell, günstig, hohe Treffsicherheit |
| Personalisierte Mail generieren | `claude-sonnet-4-5` | Qualität sichtbar für den User |
| Komplexe Analyse / Forecast | `claude-sonnet-4-5` | Wenn Qualität wichtiger als Kosten |
| Niemals für Routine-Calls | `claude-opus-4-5` | Zu teuer für automatisierte Tasks |

### Prüffrage vor jedem neuen AI-Feature

*"Rufe ich den Anthropic SDK direkt auf?"*
Wenn ja → Stopp. Durch `aiCall()` ersetzen.

---

## Sequenz Engine — Pflichtregeln

Das System führt Outreach-Sequenzen vollautomatisch durch.
Kein manueller Trigger nötig — alles läuft über DB Triggers,
Edge Functions und Cron Jobs.

### Was Algorithmus ist — was AI ist

**ALGORITHMUS** (kein AI nötig — pure Logik):
- Neuen Lead erkennen → DB Trigger
- Sequenz-Regel prüfen → If-Then auf `sequence_rules` Tabelle
- Schritt fällig prüfen → Datum-Vergleich im Cron Job
- Delivery Status tracken → Webhook vom Provider
- Timer starten → Cron Job

**AI** (Claude via `aiCall()`):
- Nachricht schreiben → basierend auf Kurzakte + Persönlichkeitstyp + Signal
- Intent Detection → eingehende Antwort klassifizieren
- Antwort generieren → bei `full_auto` + `question` / `unclear`
- Sequenz-Vorschlag → wenn kein Regelwerk greift
- Kurzakte fortschreiben → nach jedem Touchpoint

**Faustregel:** Entscheidung braucht → AI. Datum/Regel prüft → Algorithmus.

### Sequenz-Regelwerk — sequence_rules Tabelle

```sql
sequence_rules (
  id              UUID PRIMARY KEY,
  trigger_type    TEXT,  -- linkedin_signal | trial_expired | cold_contact |
                         --  inbound | job_change | company_growing
  icp_min         INTEGER,  -- Mindest-ICP Score (z.B. 50)
  sequence_id     UUID REFERENCES sequences(id),
  execution_mode  TEXT,  -- manual | semi_auto | full_auto
                         -- überschreibt globalen system_config Key pro Regel
  priority        INTEGER,  -- welche Regel gewinnt bei mehreren Matches
  is_active       BOOLEAN DEFAULT true,
  created_by      UUID REFERENCES users(id)
)
```

Standard-Regeln (konfigurierbar in Settings UI):

| Trigger | Sequenz | execution_mode |
|---------|---------|----------------|
| `linkedin_signal` + ICP ≥ 60 | Cold LinkedIn | `semi_auto` |
| `trial_expired` | Trial Conversion | `full_auto` |
| `cold_contact` (>60 Tage) | Reaktivierung | `semi_auto` |
| `inbound` | Demo Follow-up | `semi_auto` |
| ICP < 50 | KEINE Sequenz | manuell entscheiden |
| kein Regel greift | Cold LinkedIn | `manual` |

### Edge Functions — Pflicht

Alle Sequenz-Logik läuft in Supabase Edge Functions.
Kein Business-Logic im Frontend. (→ vollständige Liste in MCP-Sektion)

**`process_new_lead(contact_id)`**
→ Prüft `sequence_rules`
→ Weist Sequenz zu (oder flaggt für manuell)
→ Erstellt ersten Schritt als Task
→ Ruft `aiCall()` für Nachricht-Entwurf auf
→ Speichert in `tasks.suggested_message`

**`classify_intent(communication_id)`**
→ Liest eingehende Antwort
→ Ruft `aiCall()` auf: `intent_detected` + `intent_confidence`
→ Bei confidence < 70: `requires_human = true`
→ Bei `meeting_request`: erstellt Task "Termin senden"
→ Bei `not_interested`: pausiert Sequenz
→ Schreibt Kurzakte fort

**`process_sequence_step(contact_sequence_id, step_number)`**
→ Prüft `execution_mode`
→ `full_auto`: sendet direkt via Sending Layer
→ `semi_auto`: flaggt als "wartet auf Bestätigung"
→ `manual`: erstellt Task für User

### Cron Job — täglich 07:00 Uhr

Läuft zusätzlich zur bestehenden Claude Routine.
Prüft für jeden aktiven `contact_sequence` Eintrag:

1. Ist nächster Schritt heute fällig?
   → Ja: ruft `process_sequence_step()` auf
2. Keine Antwort seit X Tagen?
   → X aus `system_config: followup_auto_days`
   → Status → `follow_up_needed`
3. Sequenz abgeschlossen ohne Response?
   → `status = 'completed_no_response'`
   → User-Notification in Mein Tag
4. Dynamische Regelprüfung (→ siehe Dynamische Sequenzen):
   → REGEL 1/2/3 prüfen, `next_step_date` + `sending_channel` anpassen
   → `dynamic_adjustment = true`, `adjustment_reason` setzen

### Kontext für AI Calls — immer vollständig

Jeder `aiCall()` für Outreach bekommt diesen Kontext:

```typescript
const context = {
  // Kontakt
  kurzakte:             contact.kurzakte,
  persoenlichkeitstyp:  contact.personality_type,
  letzteKommunikationen: last3Communications,
  bevorzugterKanal:     preferredChannel,

  // Signal
  ausloesesSignal:      lead.source_signal,  // z.B. "Hat auf LinkedIn Post kommentiert"

  // Sequenz
  sequenzSchritt:       currentStep,
  vorherigeNachrichten: previousMessages,

  // Company
  unternehmensanalyse:  company.unternehmensanalyse,
  branche:              company.industry,
  icpScore:             contact.icp_score,
}
```

Ohne vollständigen Kontext KEIN AI Call ausführen.
Fehlende Felder → Fallback-Text verwenden, nicht halluzinieren.

### Was im AI SDR Screen erscheint

AI SDR Screen (Execution Agent) zeigt: **Sequenzen · Outreach aktiv · Posteingang · Termine gebucht.**
Inhalt:
- `full_auto` Leads (AI arbeitet selbst)
- `semi_auto` Leads (AI hat vorbereitet, wartet auf Bestätigung)
- `requires_human` Leads (temporär, bis User entschieden hat)
- `manual` Leads bleiben im AI SDR Screen (Filter "Manuell" / "Alle"), erscheinen
  hervorgehoben wenn Aktion fällig — **nicht** in Hunter.

**Wichtig (Agent-Trennung):** Hunter ist KEIN Ort für neue Leads oder Sequenzen.
Hunter behandelt nur bestehende Deals/Opportunities (Recommendation Feed).
Sobald ein Lead zum Deal wird → Übergabe AI SDR → Hunter (siehe Signal Routing).

### Wo landen nicht zugeordnete Leads

Leads ohne Sequenz-Zuweisung bleiben **im AI SDR Screen → Filter "Ohne Sequenz"**.

Dort: AI schlägt Sequenz vor (basierend auf `sequence_rules`)
User bestätigt oder weist manuell zu.
Kein Lead startet Outreach ohne aktive Sequenz.

### Durchgelaufene Sequenzen ohne Response

```
status = 'completed_no_response'
→ Lead wandert in Reaktivierungs-Pool
→ User-Notification in Mein Tag:
   "X Leads haben nicht reagiert — reaktivieren oder archivieren?"
→ Nie löschen — immer in DB behalten
→ Bei neuem Sherloq-Signal → taucht automatisch wieder auf
```

---

## Dynamische Sequenzen — Pflichtregeln

Sequenzen sind nicht statisch. Das System passt Timing und Kanal
automatisch an basierend auf Prospect-Verhalten.
Kein ML nötig — pure Algorithmus-Logik via Cron Job (→ Punkt 4 im Sequenz-Cron).

### Drei Basis-Regeln (konfigurierbar in system_config)

**REGEL 1 — Mehrfach gelesen, keine Antwort:**
```
WENN delivery_status = 'read'
UND  read_count >= system_config.sequence_dynamic_read_threshold (Default: 2)
UND  keine Antwort seit 2 Tagen
DANN Kanal wechseln (email → linkedin_dm oder umgekehrt)
     Nachricht-Kontext: "Hat Nachricht mehrfach gelesen aber nicht geantwortet"
     Flag im AI SDR Screen: "Kanal angepasst — Email → LinkedIn"
```

**REGEL 2 — Connection angenommen, DM nicht geöffnet:**
```
WENN linkedin_connected = true
UND  dm_opened = false
UND  Tage seit Connection >= system_config.sequence_dynamic_early_followup (Default: 3)
DANN next_step_date auf heute setzen (früher als geplant)
     Kürzere direktere Nachricht generieren
```

**REGEL 3 — Kein Engagement auf keinem Kanal:**
```
WENN email_opened = false
UND  dm_read = false
UND  Tage seit letztem Schritt >= system_config.sequence_dynamic_no_engage_days (Default: 5)
DANN contact_sequence.status = 'paused_no_engagement'
     Notification in Mein Tag: "Lead reagiert nicht — pausieren oder weiterführen?"
     User entscheidet — nie automatisch archivieren
```

### system_config Keys für dynamische Sequenzen

```
sequence_dynamic_read_threshold     INTEGER  DEFAULT 2
sequence_dynamic_early_followup     INTEGER  DEFAULT 3
sequence_dynamic_no_engage_days     INTEGER  DEFAULT 5
sequence_dynamic_enabled            BOOLEAN  DEFAULT true
```

### Wo die Anpassung sichtbar wird

Wenn Schritt automatisch angepasst wurde:
- Lead-Zeile zeigt Info-Badge: "Angepasst" (`Clock` Icon, grau, klein)
- Side Panel zeigt: "Kanal gewechselt weil: [Grund]"
- Audit Log: `source = 'dynamic_rule'`, `rule_triggered = 'REGEL_1'`

---

## Tages-Fortschritt — Pflichtregeln

Der User muss jederzeit wissen ob er mit seinen Tages-Aktionen fertig ist.

### Was zählt als "Tages-Aktion"

**Zählt:**
- `requires_human = true` → User hat entschieden (`approved_by IS NOT NULL`)
- `execution_mode = 'semi_auto'` → User hat bestätigt und gesendet
- `follow_up_needed` → User hat abgearbeitet ODER übersprungen

**Zählt NICHT:**
- `full_auto` Aktionen (AI macht selbst — kein User-Input nötig)
- Passive Status (gesendet, gelesen, wartet)

### Berechnung — Supabase View, nie im Frontend

```sql
-- Tages-Aktionen gesamt (für diesen User heute)
daily_actions_total = COUNT(tasks)
  WHERE assignee_id = current_user
  AND   due_date = TODAY
  AND   (requires_human = true OR execution_mode = 'semi_auto')

-- Tages-Aktionen erledigt
daily_actions_completed = COUNT(tasks)
  WHERE assignee_id = current_user
  AND   due_date = TODAY
  AND   completed_at IS NOT NULL
  AND   DATE(completed_at) = TODAY
```

Reset täglich um 00:00 Uhr via Cron Job.
**Berechnung als Supabase View — kein Frontend-Calc.**

### Wo der Fortschritt angezeigt wird

1. **AI SDR Screen** (rechts vom Live-Summary): "1 von 3 heute erledigt"
2. **Sequenz-Filter-Leiste** (dezent, rechts): Progressbar teal, füllt sich bei Erledigung
3. **Mein Tag Zone 2** (AI SDR Bereich): gleiche Logik, gleiche Daten

---

## Inbox (Posteingang) — Pflichtregeln

### Grundregel — ein universaler Posteingang

Es gibt NUR EINEN Posteingang im gesamten System.
Kein separater "AI SDR Inbox" und "manueller Inbox".
Alles läuft in eine Inbox — sortiert nach Intent und Dringlichkeit.

### Platzierung

Eigenes Icon in der linken Sidebar.
Position: zwischen AI SDR Icon und Kalender Icon.
Badge mit Zahl wenn ungelesene Antworten vorhanden (rot, `rounded-pill`).
Badge verschwindet wenn alle Antworten verarbeitet sind.

### Was im Posteingang erscheint

**Phase 2 (jetzt):**
- Alle Antworten auf AI SDR Outreach (alle Sequenzen)
- `requires_human` Eskalationen

**Phase 3 (später — kein Umbau nötig):**
- Alle eingehenden LinkedIn Nachrichten
- Alle eingehenden Emails
- Manuelle Kontakt-Antworten

### Sortierung (immer diese Reihenfolge)

| Priorität | Intent | Icon | Farbe |
|-----------|--------|------|-------|
| 1 | `requires_human = true` — du bist dran | `AlertTriangle` | rot |
| 2 | `meeting_request` — Termin-Anfrage | `CalendarCheck` | teal |
| 3 | `interested` — Interessiert | `CheckCircle2` | grün |
| 4 | `question` — Frage | `HelpCircle` | blau |
| 5 | `not_interested` — Nicht interessiert | `XCircle` | grau |

Niemals Emoji in der Sortieranzeige — Lucide-Icons gemäß Badge/Icon-Regel.

### DB-Felder — Ergänzung zur communications Tabelle

Die folgenden Felder ergänzen die bestehenden Intent-Felder
(`intent_detected`, `intent_confidence`, `requires_human` etc. — siehe AI SDR Automation):

```sql
-- Ergänzung in communications Tabelle:
inbox_read          BOOLEAN DEFAULT false
inbox_processed     BOOLEAN DEFAULT false
inbox_processed_at  TIMESTAMPTZ
inbox_processed_by  UUID REFERENCES users(id)
```

### Verknüpfung mit Sequenz

- Antwort in Inbox → zeigt welche Sequenz + welcher Schritt
- Klick "Antworten" → Side Panel öffnet Sequenz-Kontext
- Nach Verarbeitung: verschwindet aus Inbox + Sequenz-Status updated

### Prüffrage

*"Könnte dieser eingehende Kanal später auch im Posteingang erscheinen?"*
Wenn ja → `communications` Tabelle nutzen + `inbox_read` Feld setzen.
Kein separater Inbox-Mechanismus pro Feature.

---

## Fehlerbehandlung aus User-Sicht — Pflichtregeln (nie weglassen)

> Viele Produkte machen das schlecht. Hier nicht. Der User sieht nie einen
> technischen Grund — er sieht immer **was er tun kann**.

### Grundprinzip

1. **Die App friert nie ein.** Jede Operation endet garantiert — harter Timeout.
2. **Fehlgeschlagenes wird ein sichtbarer Status, kein Spinner.**
3. **Der User sieht immer: was ist passiert + genau eine Handlung.**
4. **Das Wort "Fehler" / "Error" kommt in der UI NIE vor.** Zu negativ.

### Timeout — Spinner hat IMMER ein Ende

Jede asynchrone Operation hat einen harten Timeout (Standard: **8 Sekunden**)
via `AbortController`. Niemals ein Spinner ohne Timeout.

```typescript
// Pflicht-Muster für jeden fetch / Supabase-Call mit Ladeanzeige:
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 8000)
// ... call mit { signal: controller.signal }
// finally: clearTimeout(timeout)
```

Nach 8 Sekunden ohne Antwort → Spinner stoppt zwingend, Meldung mit Aktion erscheint.
Ein hängender Request darf nie React-State blockieren oder Memory leaken.

### Der Eskalations-Ablauf (4 Stufen)

| Stufe | Wann | Was der User sieht |
|-------|------|--------------------|
| 0 — Optimistisch | Sofort bei Aktion | Ergebnis erscheint direkt (z.B. "wird gesendet") — App bleibt bedienbar |
| 1 — Auto-Retry | 1× automatisch, unsichtbar, im Hintergrund | nichts — läuft mit eigenem Timeout |
| 2 — Manuell | Auto-Retry fehlgeschlagen | "Hat gerade nicht geklappt" + Button **"Nochmal versuchen"** |
| 3 — Eskalation | Auch manuell fehlgeschlagen | Aktion wird sichtbar als **offen** markiert (gelbes Badge, persistenter Status) + konkrete Lösung |

**Genau EIN automatischer Retry im Frontend.** Mehr = Retry-Storm bei echtem Ausfall.
Ernsthaftes Retry-mit-Backoff gehört serverseitig (Edge Function / Cron Job —
siehe Offline Handling: `3× Retry 1s→5s→30s`).

### Fehlgeschlagenes wird ein DB-Status — kein Hintergrundprozess

Persistenter Zustand überlebt Reload und Tab-Schließen.
Niemals nur im Browser-Speicher "auf Erfolg warten".

- Sending Layer scheitert → `delivery_status = 'failed'` in DB + gelbes Badge in der Zeile
- Edge Function scheitert dauerhaft → Eintrag in `error_log`, Cron Job räumt später auf
- So kann das System die offene Aktion später automatisch nachholen oder der User sieht sie jederzeit wieder

### Formulierung — konkret pro Fehlertyp

Nie der Grund. Immer die Handlung. Nie das Wort "Fehler".

| Situation | NICHT | SONDERN |
|-----------|-------|---------|
| Daten laden gescheitert | "Error 503 / Fehler beim Laden" | "Konnte gerade nicht geladen werden" + **Nochmal laden** |
| Verbindung weg | "Network Error" | "Verbindung unterbrochen — Seite neu laden" |
| Senden gescheitert (Stufe 2) | "Senden fehlgeschlagen" | "Hat gerade nicht geklappt" + **Nochmal senden** |
| Dauerhaft gescheitert (Stufe 3) | "Fehler — bitte später" | "Wir konnten das noch nicht abschließen — du kannst weitermachen, die Aktion bleibt gespeichert" |
| Unlösbar / System down | "Internal Server Error" | "Das müssen wir uns ansehen — bitte kurz deinem Admin Bescheid geben" (+ Admin-Kontakt direkt) |
| Plan-Limit erreicht | "Quota exceeded" | "Du hast dein Monatslimit erreicht — Plan upgraden oder bis [Datum] warten" |

Verbotene Wörter in der UI: `Error`, `Fehler`, `Exception`, `Failed`, `null`,
Statuscodes (`404`, `500`, `503`), Stacktraces, Provider-Namen ("Anthropic API …").

### Pro Fehler-Quelle — was passiert

| Quelle | Verhalten |
|--------|-----------|
| **API / Supabase Query** | Timeout 8s → Stufe 2 Meldung + Nochmal-laden. Daten bleiben optimistisch sichtbar wenn vorhanden (stale-while-error). |
| **Edge Function** | 1× Frontend-Retry → bei Fehlschlag `error_log` + Stufe 3. Server-Backoff übernimmt das Nachholen. |
| **AI Call (`aiCall()`)** | Niemals roher Fehler an den User. Fehlt Kontext → Fallback-Text. API down → bei Outreach: Schritt bleibt `draft`/offen, kein halluzinierter Text. Bei Chat: "Konnte das gerade nicht verarbeiten — nochmal fragen". |
| **Sending Layer** | `delivery_status = 'failed'` + gelbes Badge in der Lead-Zeile. Inbox/Mein Tag zeigt "1 Nachricht konnte nicht raus — nochmal senden?". Nie still verschlucken. |

### Ausnahme — Optimistic UI nur bei reversiblen Aktionen

Optimistisch (Stufe 0) nur wo ein sauberer Rollback möglich ist (Lead anlegen,
Task abhaken, Notiz). Bei unwiderruflichen / sensiblen Aktionen (Massenversand,
Plan-Wechsel, Löschen) bewusst ein kurzer Blocking-State **mit Bestätigung** —
lieber 2 Sekunden warten als eine falsch gesendete Nachricht zurücknehmen müssen.

### Prüffrage vor jeder neuen async-Funktion

*"Was sieht der User wenn das 8 Sekunden hängt oder dauerhaft scheitert?"*
Wenn die Antwort "Spinner" oder "Fehlermeldung mit Grund" ist → nicht fertig.

---

## Performance & Data Loading — Pflichtregeln (nie weglassen)

> So bauen es die besten Teams (Linear, Vercel, Superhuman). Nicht Premature
> Optimization — sondern die richtigen Default-Entscheidungen von Tag 1, damit
> das System bei 10 Leads gleich gebaut ist wie bei 50.000.

### Server-State — immer TanStack Query (React Query)

Kein `useEffect` + `useState` + `fetch` für Server-Daten. Ausnahmslos.
TanStack Query ist die einzige Quelle für Server-State — es liefert Caching,
Dedup, Background-Refetch, und exakt das Timeout/Retry/stale-while-error Verhalten
aus **Fehlerbehandlung aus User-Sicht** kostenlos.

```typescript
// Pflicht-Pattern. organization_id IMMER im Query-Key (Multi-Tenant Cache-Isolation):
useQuery({
  queryKey: ['leads', orgId, filters],
  queryFn: ({ signal }) => fetchLeads(orgId, filters, signal), // signal = 8s Timeout
  staleTime: 30_000,
})
```

**Warum `organization_id` im Key Pflicht ist:** Ohne ihn zeigt der Cache beim
Org-Wechsel die Daten des falschen Kunden. Multi-Tenancy gilt auch im Cache.

### Caching — staleTime nach Daten-Volatilität

| Daten | staleTime | Begründung |
|-------|-----------|------------|
| Referenzdaten (`system_config`, `pipeline_stages`, `user_modules`) | `5 min` | Ändern sich fast nie |
| Listen (Leads, Kunden, Inbox) | `30 s` | Realtime invalidiert ohnehin sofort |
| Detail (Kurzakte, Contact Drawer) | `60 s` | Beim Öffnen frisch genug |
| KPIs / Dashboards | `2 min` | Aggregation, nicht sekundenkritisch |
| `gcTime` (alle) | `5 min` | Cache-Speicher nach Unmount |

**Realtime ist die primäre Invalidierung — nicht der Timer.** Ein Realtime-Event
schreibt direkt in den Query-Cache (`setQueryData`) oder invalidiert den Key.
staleTime ist nur das Fallback wenn kein Event kommt.

### Pagination — Cursor/Keyset, niemals OFFSET

`OFFSET` wird bei großen Tabellen linear langsamer (DB muss alle übersprungenen
Zeilen lesen). Keyset-Pagination bleibt konstant schnell.

```typescript
// RICHTIG — Keyset auf (created_at, id), stabil sortiert:
.order('created_at', { ascending: false }).order('id').gt('id', lastCursor).limit(50)
// FALSCH — .range(offset, offset+50) bei wachsenden Tabellen
```

`useInfiniteQuery` + Infinite-Scroll (kein klassisches Seiten-Blättern).

| Liste | Seitengröße |
|-------|-------------|
| Lead-Liste / Kunden-Liste | `50` |
| Inbox | `25` |
| Signal-Kacheln / Feed | `30` |
| Pipeline-Kanban (pro Spalte) | `20`, Rest per "mehr laden" |

### Virtualisierung — Listen > 50 sichtbare Zeilen

Lange Listen rendern nur den sichtbaren Bereich (`@tanstack/react-virtual`).
500 Leads im DOM = ruckelndes Scrollen und Memory-Last. Virtualisiert = konstant.

Pflicht für: Lead-Liste, Kunden-Liste, Signal-Kacheln-Feed, Inbox.
Nicht nötig für: kurze Listen (Tasks in Mein Tag, Pipeline-Spalten < 20).

### Realtime — bounded, nicht pro Zeile

- **Eine** Subscription pro aktiver Listen-Ansicht, gefiltert auf `organization_id`
  (+ relevanter Filter), nie eine pro Lead-Zeile.
- Max. ~5 gleichzeitige Channels offen. Channel bei Component-Unmount **immer**
  schließen (`removeChannel`) — sonst WebSocket-Leak.
- Realtime-Payload aktualisiert den React-Query-Cache direkt — löst KEINEN
  zusätzlichen Refetch aus (Payload enthält die neue Row schon).
- Realtime nur für die 7 Tabellen aus **Realtime Events** (`contacts`, `companies`,
  `tasks`, `pipeline_deals`, `communications`, `kpis_daily`, `jira_tasks`).
  Alles andere: normaler Query + staleTime, kein Channel.

### Code-Splitting — pro Modul lazy laden

Jedes Modul (`ai_sdr`, `hunting`, `farming`, `reporting` …) wird per `React.lazy()`
geladen. Der User lädt nie Code für Module die er nicht hat (→ **Modularer Aufbau**).
Route-Level Splitting + `<Suspense>` mit Skeleton (nicht Spinner).

### Datenbank — Indizes & N+1

- **Index auf `organization_id` in JEDER Tabelle** — steht in jeder RLS-Policy und
  jeder Query, ohne Index ist jede Query ein Full-Scan.
- Composite-Indizes für häufige Filter: `(organization_id, heat_status)`,
  `(organization_id, created_at DESC)`, `(organization_id, assigned_to)`.
- Cursor-Spalten indizieren: `(created_at, id)`.
- **Nie N+1:** Supabase nested-select (`select('*, company:companies(*)')`) statt
  Schleife mit Einzel-Queries. Eine Query, nicht 50.

### Bilder & Layout-Shift

- Avatare/Bilder: `loading="lazy"` + feste `width`/`height` (kein Layout-Shift).
- Skeleton-Loader statt Spinner für initiales Laden (gefühlte Performance).

### Optimistic Updates — sofort reagieren

Mutationen (Task abhaken, Stage ändern, Lead anlegen) aktualisieren den Cache
optimistisch via `onMutate` → die UI reagiert in 0 ms (→ Stufe 0 in der
Fehlerbehandlung). Rollback in `onError`. Nur bei reversiblen Aktionen.

### Prüffrage vor jeder Liste / jedem Daten-Screen

*"Funktioniert das noch flüssig bei 10.000 Zeilen?"*
Wenn die Antwort "alle laden und rendern" ist → Pagination + Virtualisierung fehlen.

---

## Notifications — Pflichtregeln (Infrastruktur jetzt, Regeln später)

> **Kernprinzip:** Die Verkabelung (Tabellen, abstrakte Kanäle, Event-Typen) steht
> von Tag 1. Die konkreten Versand-Regeln (wann, wo, wie oft) sind reine Config —
> jederzeit änderbar ohne Code-Umbau. Wie `aiCall()` und `sendEmail()`:
> ein zentraler Choke-Point, Provider/Kanäle als Adapter dahinter.

### Grundregel — kein direkter Notification-Versand außerhalb von lib/notify.ts

Kein Code feuert direkt eine Email/Push/Slack-Nachricht. Ausnahmslos.
Alles läuft über `notify()`. Neuer Kanal = neuer Adapter, kein Umbau am Rest.

```typescript
// lib/notify.ts — einziger Eintrittspunkt für jede Benachrichtigung.
// Schreibt IMMER zuerst in die notifications Tabelle, fächert dann nach
// notification_preferences auf die aktiven Kanäle auf.
notify({
  organizationId,
  userId,
  event: 'requires_human',     // aus dem Event-Katalog
  payload: { contactId, sequenceId },
})
```

### notifications Tabelle — Single Source (jedes Event landet hier zuerst)

```sql
notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id),       -- Empfänger
  event            TEXT NOT NULL,                    -- Event-Katalog (siehe unten)
  payload          JSONB NOT NULL,                   -- contactId, sequenceId, etc.
  title            TEXT NOT NULL,                    -- vorformuliert (User-Sicht-Regeln)
  body             TEXT,
  priority         TEXT DEFAULT 'normal',            -- low | normal | high | urgent
  read             BOOLEAN DEFAULT false,            -- In-App gelesen
  read_at          TIMESTAMPTZ,
  channels_sent    TEXT[],                           -- ['in_app','email'] — was tatsächlich raus ging
  created_at       TIMESTAMPTZ DEFAULT now()
)
```

Die Glocke in der Sidebar liest aus dieser Tabelle (`read = false` → Badge-Count).

### notification_preferences — die Regeln (später frei konfigurierbar)

```sql
notification_preferences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id),
  event            TEXT NOT NULL,                    -- welcher Event-Typ
  channel          TEXT NOT NULL,                    -- in_app | email | push | slack | teams
  enabled          BOOLEAN DEFAULT true,
  frequency        TEXT DEFAULT 'instant',           -- instant | hourly_batch | daily_digest | off
  only_when_offline BOOLEAN DEFAULT false,           -- z.B. Email nur wenn nicht in-App aktiv
  UNIQUE(user_id, event, channel)
)
```

**Diese Tabelle entscheidet alles Spätere** — welches Event auf welchem Kanal,
sofort vs. gebündelt vs. Digest, nur-wenn-offline. Drehen = Zeile ändern, kein Deploy.

### Event-Katalog — die Auslöser (erweiterbar, ein Eintrag = neues Event)

| Event | Wann | Default-Priorität |
|-------|------|-------------------|
| `requires_human` | AI unsicher (`intent_confidence < 70`) | high |
| `meeting_booked` | Lead bucht Termin (Booking-Webhook) | high |
| `reply_received` | Antwort auf Outreach eingegangen | normal |
| `churn_alert` | Heat → kalt/tot, Churn-Signal | high |
| `sequence_completed` | Sequenz durch, kein Response | low |
| `sequence_paused` | Dynamische Regel pausiert (kein Engagement) | normal |
| `daily_briefing` | Morning Briefing fertig (07:00 Routine) | low |
| `plan_limit_reached` | Monatslimit erreicht | high |
| `plan_expiring` | Plan läuft in 7 Tagen ab | normal |
| `task_overdue` | Task überfällig | normal |
| `duplicate_review` | Möglicher Duplikat-Datensatz (→ Datenqualität) | high |
| `crm_conflict` | CRM-Sync Konflikt bei wichtigem Feld | high |
| `data_ingest_failed` | Eingehende Daten unvollständig/kaputt | normal |

Jedes `→ Notification in Mein Tag` im restlichen Dokument feuert über genau diese
Events — kein separater Mechanismus pro Feature.

### Kanäle — abstrakte Adapter hinter notify()

| Kanal | Phase | Adapter |
|-------|-------|---------|
| `in_app` | JETZT | Glocke in Sidebar + Mein Tag — liest `notifications` Tabelle live (Realtime) |
| `email` | SPÄTER | über `lib/email.ts` (Resend/Postmark) |
| `push` | SPÄTER | Web Push / Mobile (provider-agnostisch) |
| `slack` / `teams` | SPÄTER | als **ausgehender** Notification-Kanal an den User — nicht zu verwechseln mit `communications` (eingehende Prospect-Nachrichten) |

### Was JETZT gebaut wird — was SPÄTER kommt

**JETZT (Infrastruktur):**
- `notifications` + `notification_preferences` Tabellen
- `lib/notify.ts` mit `notify()` — schreibt in `notifications`, In-App funktioniert
- Glocke in Sidebar zeigt echten Badge-Count (`read = false`), live via Realtime
- Event-Katalog als TypeScript-Enum
- Alle bestehenden "→ Mein Tag" Stellen feuern über `notify()`

**SPÄTER (reine Config + Adapter):**
- Email/Push/Slack/Teams Adapter
- Versand-Regeln pro Event/Kanal/Häufigkeit in `notification_preferences`
- Quiet Hours, Rate-Limiting (z.B. max 1 `churn_alert` pro Kunde/Tag)
- Bündelung (`hourly_batch`, `daily_digest`) via Cron Job
- User-Settings-UI zum Einstellen der Preferences

### Prüffrage vor jedem neuen Notification-Auslöser

*"Feuere ich über `notify()` mit einem Event aus dem Katalog?"*
Wenn nein → Stopp. Niemals direkt Email/Push/In-App schreiben.
Neuer Auslöser → Event in den Katalog, nicht in den Code hardcoden.

---

## Datenqualität & Duplikate — Pflichtregeln (nie weglassen)

> **Kernprinzip:** Bei Unschärfe entscheidet IMMER der User. Das System löst
> Duplikate oder Konflikte niemals still im Hintergrund auf — es erkennt sie,
> meldet sie (via `notify()`), und legt sie dem User zur Entscheidung vor.
> Ein doppelt angeschriebener Prospect ist ein Reputations-Killer — lieber einmal
> nachfragen als zweimal senden.

### 1. Ingestion-Validierung — bevor irgendwas geschrieben wird

Jeder eingehende Datensatz (Sherloq-Webhook, CRM-Sync, Import) wird VOR dem
Schreiben validiert. Kaputte Daten landen nie in der DB.

- Pflichtfelder vorhanden? (Name, mind. ein Kanal: Email ODER LinkedIn)
- Email valides Format? Telefon plausibel?
- Unbekannte/fehlende Felder → `null`, nie raten, nie halluzinieren
- Validierung fehlgeschlagen → Eintrag in `error_log` + `notify()` Event
  `data_ingest_failed`, **nicht** in die produktiven Tabellen

### 2. Duplikat-Erkennung — Email primär, Company fuzzy

Reihenfolge der Matching-Stärke:

1. **Email exakt** (normalisiert: lowercase, trim) → stärkstes Signal, sehr wahrscheinlich Duplikat
2. **LinkedIn-URL exakt** → ebenso stark
3. **Name + Company (normalisiert)** → Verdacht, dem User vorlegen

**Company-Normalisierung VOR dem Vergleich — Pflicht:**
Rechtsformen und Schreibvarianten entfernen, dann vergleichen. So fällt auf dass
"Acme GmbH" und "Acme" derselbe Kunde sind.

```
Normalisierung (Company):
- lowercase, trim, Mehrfach-Leerzeichen weg
- Rechtsform-Suffixe entfernen: GmbH, AG, UG, GmbH & Co. KG, e.K.,
  Inc, Inc., LLC, Ltd, Ltd., Corp, Co., S.A., B.V., S.r.l., Pty, …
- Satzzeichen entfernen (. , & -)
- "Acme GmbH" → "acme"   |   "Acme, Inc." → "acme"   →  MATCH-Verdacht
```

Gleiches Prinzip für Personen-Namen (Titel weg: Dr., Prof.; Umlaute normalisieren).

Ergebnis ist nie binär "Duplikat ja/nein", sondern ein **Confidence-Wert**:
- Email/LinkedIn exakt → high → Standard: zusammenführen, aber Hinweis
- Name + normalisierte Company gleich → medium → **User entscheidet**
- nur Name gleich, Company unklar → low → als Verdacht markieren, nicht blocken

### 3. Auflösung — der User entscheidet (nie Auto-Merge im Zweifel)

Bei medium/low Confidence: kein Schreiben, kein zweiter Lead, kein zweiter
Sequenz-Start. Stattdessen Eintrag in `merge_candidates` + Hinweis an den User.

```sql
merge_candidates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  new_payload      JSONB NOT NULL,        -- der eingehende Datensatz
  existing_id      UUID,                  -- der mutmaßliche Bestandskontakt
  match_reason     TEXT,                  -- z.B. "Name + Company (normalisiert) gleich"
  confidence       TEXT NOT NULL,         -- high | medium | low
  status           TEXT DEFAULT 'pending',-- pending | merged | kept_separate | dismissed
  resolved_by      UUID REFERENCES users(id),
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
)
```

Der User sieht (wo/wie ist später egal — Review-Bereich, Pop-up, Inbox-Eintrag):
> "Möglicherweise schon vorhanden: **Acme GmbH** ↔ **Acme**.
>  Zusammenführen oder getrennt behalten?"

Entscheidung: **Zusammenführen** · **Getrennt behalten** · **Ignorieren**.
Ausgelöst über `notify()` Event `duplicate_review`. Bis zur Entscheidung startet
**keine Sequenz** für den neuen Datensatz (kein Doppel-Outreach).

### 4. Merge-Logik — wenn als gleich bestätigt

Bei Bestätigung "Zusammenführen": kein zweiter Datensatz, sondern Anreicherung
des bestehenden.

- Neues Signal/Communication an bestehenden Kontakt anhängen (nie überschreiben)
- Fehlende Felder am Bestand auffüllen, vorhandene **nicht** überschreiben
  (Bestand gewinnt — der User hat ihn bewusst gepflegt)
- Kurzakte-Eintrag: "Aus weiterer Quelle ergänzt am …"
- Läuft bereits eine Sequenz → weiterlaufen lassen, **keine zweite** starten
- `audit_log`: `source = 'merge'`, beide IDs festhalten

### 5. CRM-Sync Konflikte — Feld-Ebene, local-first mit Hinweis

Verfeinerung der Regel "Sales OS gewinnt" (war zu pauschal):

- **Kein Konflikt** (nur eine Seite geändert) → still übernehmen
- **Echter Konflikt** (beide Seiten dasselbe Feld seit letztem Sync geändert):
  → Default: local (Sales OS) gewinnt, `crm_sync_status = 'conflict'` setzen
  → **aber** bei wichtigen Feldern (Deal-Stage, ARR, Email) → `notify()` Event
    `crm_conflict` → User entscheidet welcher Wert gilt
  → Welche Felder "wichtig" sind: konfigurierbar in `system_config`
- Jeder Konflikt wird geloggt (`crm_sync_error` / `audit_log`), nie still verworfen

### Prüffrage vor jedem Daten-Schreibvorgang aus externer Quelle

*"Könnte dieser Datensatz schon existieren — exakt ODER unscharf (Rechtsform,
Schreibweise)?"*
Wenn ja und unsicher → `merge_candidates` + `notify()`, niemals still anlegen
und niemals automatisch eine Sequenz darauf starten.

---

## Agent-Architektur — drei klar getrennte Rollen (fundamental)

Das System hat drei AI-Agenten mit **unterschiedlichem Verhalten**. Die Trennung
ist absolut: Execution vs. Recommendation. Verwechslung = Architektur-Fehler.

```
AI SDR   = Execution Agent      → führt Outreach SELBST aus (autonom/bestätigt)
Hunter   = Recommendation Agent → erkennt · interpretiert · empfiehlt (Deals)
Farmer   = Recommendation Agent → erkennt · interpretiert · empfiehlt (Bestandskunden)
```

### AI SDR = Execution Agent (Anfang des Funnels)

Führt Outreach selbst aus — autonom oder mit Bestätigung. Einziger Agent
bei dem `full_auto` für echten Versand zulässig ist.

Zuständig für:
- Neue Leads via Sherloq Signals
- Outreach-Sequenzen (LinkedIn, Email)
- Follow-ups in aktiven Sequenzen
- Reply Handling + Intent Detection
- Terminbuchung
- Leads die noch keinen Deal haben

Screen: **Sequenzen · Outreach aktiv · Posteingang · Termine gebucht.**

### Hunter = Recommendation Agent (Deals & Pipeline)

Arbeitet an bestehenden Opportunities/Deals. Führt **NICHTS** automatisch aus —
erkennt, interpretiert, empfiehlt. Mensch entscheidet.

Zuständig für:
- Stagnierende Deals
- Fehlende Follow-ups bei Opportunities
- Neue Signals zu Pipeline-Kontakten
- AI-Empfehlungen für nächste Schritte
- Individuelle Aktionen die kein Standard-Outreach sind

**Hunter ist KEIN Ort für Sequenzen oder Cold Outreach.**
Recommendation Feed: `Signal → AI Interpretation → Empfehlung → Mensch entscheidet`

Beispiele:
- "Deal Acme stagniert seit 8 Tagen — persönliches LinkedIn Follow-up empfohlen"
- "Lead hat mit Competitor interagiert — individuelle Reaktion, keine Sequenz"
- "Demo vor 5 Tagen, kein Next Step — konkrete Agenda senden"

### Farmer = Recommendation Agent (Bestandskunden)

Wie Hunter, aber für Bestandskunden. Führt **NICHTS** automatisch aus.

Zuständig für:
- Churn Risk (kein Login, Usage Drop, Downgrade)
- Upsell-Potential (Feature-Nutzung, Seat-Gaps)
- Trial Management · Renewal · Retention

Gleiche Logik: `Signal → AI Interpretation → Empfehlung → Mensch entscheidet`

Beispiele:
- "Kunde 14 Tage kein Login — kein generischer Check-in, Hinweis auf Feature X"
- "Downgrade erkannt — Retention-Mail vorbereiten, nicht automatisch senden"
- "Mehr Sales-Mitarbeiter als Seats — Upsell-Potenzial erkannt"

---

## Signal Routing — Pflicht-Entscheidungsbaum

Jedes Signal wird nach Kontext geroutet. **Kein Signal erscheint an zwei Orten
gleichzeitig.**

```
Signal zu neuem Lead (noch kein Deal)        → AI SDR
Signal zu Lead bereits in Sequenz            → AI SDR (im Sequenzkontext)
Signal zu Pipeline-Opportunity / Deal        → Hunter
Signal zu Bestandskunde                      → Farmer
Bestehender Lead wird jetzt Deal             → Übergabe AI SDR → Hunter
```

Routing-Logik muss in `process_new_lead()` und `classify_intent()` Edge Functions
implementiert sein (→ Sequenz Engine).

`signals` Tabelle braucht:
```sql
routed_to       TEXT          -- ai_sdr | hunter | farmer
routed_at       TIMESTAMPTZ
routing_reason  TEXT          -- warum dieses Routing
```

---

## Automation Risk-Level — Vorbereitung (Schwellen noch zu definieren)

> ⚠️ Die genauen Risk-Schwellenwerte sind **noch nicht definiert** — werden vom
> User später festgelegt (Entscheidungsliste `entscheidungen_v2.md` Punkt 20).
> **Bis dahin: alle Aktionen `semi_auto` als Default — nie `full_auto` ohne
> explizite User-Freigabe.**

Architektonisch jetzt vorbereiten, in `system_config`:
```sql
automation_risk_low_actions    TEXT  -- komma-getrennte Liste (noch zu definieren)
automation_risk_medium_actions TEXT  -- komma-getrennte Liste (noch zu definieren)
automation_risk_high_actions   TEXT  -- komma-getrennte Liste (noch zu definieren)
```

Grundprinzip (Details offen):
- **Low Risk** → darf später automatisch laufen (z.B. Task erstellen)
- **Medium Risk** → Semi-Auto (AI draftet, Mensch bestätigt)
- **High Risk** → immer Approval (z.B. Downgrade, Key Accounts)

Gilt für AI SDR UND Hunter UND Farmer.
Bei Hunter/Farmer ist `full_auto` ohnehin nie zulässig (Recommendation only).

---

## Hunter Screen — UI-Struktur (Recommendation Feed)

Hunter ist **kein Sequenz-Screen**. Hunter ist ein Recommendation Feed.

Aufbau:
- Nav-Kacheln (Sub-Nav): **[Signale] [Stagnierende Deals] [Follow-ups] [Pipeline]**
- Hauptinhalt: Empfehlungs-Kacheln — `Signal → Interpretation → Empfehlung`
- Jede Kachel: AI-Empfehlung inline · Mensch **bestätigt oder verwirft**
- Side Panel: Kontakt-Detail + Kurzakte + History + "Empfehlung ausführen"

Kein Sequenz-Feed, keine Automation-Toggles für Outreach.
Nur: **erkennen → empfehlen → Mensch entscheidet.**

---

## Farmer Screen — UI-Struktur (Recommendation Feed, Bestandskunden)

Wie Hunter, explizit als Recommendation Agent.

Aufbau:
- Nav-Kacheln (Sub-Nav): **[Signale] [Churn & Trials] [Upsell]**
- Hauptinhalt: Signal-Kacheln mit AI-Empfehlung inline
- Gleiche Logik wie Hunter, aber für Bestandskunden

---

## Mein Tag — Klarstellung (aggregierter Tages-Feed)

Mein Tag ist **kein eigener Sales-Bereich** und **keine eigene Datenquelle**.
Es ist der priorisierte Tages-Feed **über alle Bereiche**.

Zeigt nur was heute menschliche Aufmerksamkeit braucht — aggregiert aus:
- **AI SDR:** `requires_human` Eskalationen
- **Hunter:** stagnierende Deals + fehlende Follow-ups
- **Farmer:** Churn Risk + Upsell
- **Termine + Meeting-Prep**

Keine eigene Datenquelle — alles aus AI SDR, Hunter, Farmer aggregiert
(→ Notifications-Events feuern hierher).
