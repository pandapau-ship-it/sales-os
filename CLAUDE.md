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

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19 + TypeScript | Vite as bundler |
| UI Framework | **Mantine v8** | Docs: mantine.dev — read before building any component |
| Styling | Mantine v8 only | No Tailwind. No custom CSS unless unavoidable. |
| Database | Supabase (PostgreSQL) | Auth built-in, RLS enabled, Realtime support |
| Hosting | Vercel | Auto-deploy on push to main |
| Version Control | GitHub | `pandapau-ship-it/sales-os` |
| AI Layer | Claude Routines | Daily sync at 07:00 — runs in Anthropic cloud |
| Auth | Supabase Auth | Email + password, Row Level Security |

---

## Design Rules (Non-Negotiable)

**Single source of truth for all visual decisions: `src/theme.ts`**
- All colors, font sizes, spacing, radius values live there — never inline
- `theme.ts` extends Mantine's `createTheme()` — never override Mantine components with raw CSS

**Visual reference: Claude.ai's own navigation**
- Very compact, very clean, no oversized elements
- Font sizes: use Mantine's `xs` and `sm` — never `lg` or `xl` for body/navigation text
- Icon sizes: 16–18px — never larger unless it's a hero/empty state
- Lots of white space, clear hierarchy — dense information without feeling cramped

**What this is NOT:**
- No generic AI design (no purple gradients, no Inter font as hero choice, no oversized cards)
- No heavy borders or shadows everywhere — use them only to establish hierarchy
- No empty dashboards — every screen has data or a concrete next action on first load

---

## Navigation Structure

Exactly **3 primary navigation points** — never more:

```
☀️ Mein Tag    |    🎯 Hunter    |    🌱 Farmer
```

Secondary (via sub-nav or Cmd+K only):
- 🎫 Jira Board
- 📣 Marketing Board (placeholder)
- 🔍 Sherloq Board (placeholder)
- ⚙️ Admin / Settings

Navigation renders dynamically based on `users.role`:
- `solo` → all three + all boards
- `hunter` → Hunter + Mein Tag
- `farmer` → Farmer + Mein Tag
- `admin` → everything + Admin

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
- **`contacts`** — `personality_type TEXT` (rot/gelb/gruen/blau, AI-derived), `kurzakte TEXT`, Sherloq usage fields
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

## Key Business Logic

### Heat Status Calculation
Runs daily (Claude Routine). Compares `communications.occurred_at` (most recent per contact) against `heat_status_config` thresholds. When contact transitions from warm → kalt: auto-create task. When → tot: task + Churn Warning in Mein Tag.

### Kurzakte — How It Works
Living AI-maintained file per contact and per company. After every new communication:
1. Claude reads existing Kurzakte
2. Claude reads new communication (email, transcript, etc.)
3. Claude extends — never overwrites. New insights added, outdated assessments corrected.
Content: relationship quality, objections, buying signals, personality type, open TODOs, recommended next step.

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
