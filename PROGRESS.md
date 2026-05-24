# Sales OS — Progress Tracker

> Update this file at the end of every session. Read it at the start.

---

## Current Status: Phase 1 — Project Setup ✅

---

## Completed

### Session 1 — 2026-05-24
- [x] Node.js v24.16.0 installed via nvm
- [x] Vite + React + TypeScript project scaffolded (`npm create vite@latest`)
- [x] Mantine v8 installed: `@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/dates`, `@mantine/forms`, `@mantine/modals`, `@tabler/icons-react`, `dayjs`
- [x] `MantineProvider` + `ModalsProvider` + `Notifications` configured in `src/main.tsx`
- [x] Mantine CSS imports in place
- [x] Basic `AppShell` with navbar, header, dark/light mode toggle as placeholder `App.tsx`
- [x] `vercel.json` created (Vite build config + SPA rewrites)
- [x] GitHub repo created: `pandapau-ship-it/sales-os` (public)
- [x] Initial commits pushed to GitHub (vercel.json commit still needs push — token was auto-revoked)
- [x] `CLAUDE.md` created — full project briefing distilled
- [x] `PROGRESS.md` created (this file)

---

## Next Steps

### Immediate (next session start)
- [ ] Push all commits to GitHub (need new GitHub token or `gh auth login` in terminal)
- [ ] Connect repo to Vercel via vercel.com/new → import `pandapau-ship-it/sales-os`

### Phase 2 — Design System ✅ COMPLETE
- [x] `src/theme.ts` — full Mantine v8 theme from Sherloq Brand Identity
- [x] Color system: 7 custom color scales (sherloq, ai, insight, opportunity, urgent, growth, intelligence)
- [x] Domain tokens: heatStatusColors, dealStageColors, churnRiskColors, personalityColors
- [x] Typography: Plus Jakarta Sans, compact scale (11/13/14/16/18px)
- [x] Spacing: 4px grid (4/8/12/16/24px)
- [x] Shadows: brand-teal-tinted, 5 elevation levels
- [x] Component defaults: NavLink, Button, Badge, Card, Table, AppShell, etc.
- [x] `docs/design-system.md` — full documentation with examples
- [x] `index.html` — Plus Jakarta Sans via Google Fonts
- [x] `CLAUDE.md` — updated with all final color values

### Phase 3 — App Shell ✅ COMPLETE
- [x] `src/types/navigation.ts` — UserRole, MainNavId, MainNavItem, SubNavItem, CurrentUser types
- [x] `src/hooks/useCurrentUser.ts` — Mock user hook (replace with Supabase auth in Phase 5)
- [x] `src/components/shell/navConfig.tsx` — All nav items, sub-items, role access map, helpers
- [x] `src/components/shell/shell.module.css` — CSS module: nav pills, Cmd+K button, sidebar icons
- [x] `src/components/shell/TopBar.tsx` — Header with logo, horizontal pill-nav, Cmd+K, user avatar
- [x] `src/components/shell/SubSidebar.tsx` — Left icon sidebar (56px), context-sensitive sub-nav
- [x] `src/App.tsx` — AppShell wiring, role-based nav, auto-select first sub-item on section change
- [x] `src/App.css` — Cleaned (Vite template styles removed)
- [x] `.claude/launch.json` — Preview server config (npm path hardcoded for nvm)
- [x] TypeScript build: 0 errors ✓

**Navigation structure:**
- Primary: Mein Tag · Hunting · Farming · Marketing · Sherloq System
- Secondary (separated): Jira (smaller, gray pill when active)
- Role-based: solo/admin = all 5+Jira · hunter = Mein Tag+Hunting+Jira · farmer = Mein Tag+Farming+Jira
- Sub-nav: Hunting (4) · Farming (4) · Marketing (4) · Sherloq (4) · Jira (3) · Mein Tag (none)
- Cmd+K: placeholder button with ⌘K hint, wired to useHotkeys (mod+k captured)
- Dark/light toggle in bottom of SubSidebar

### Phase 4 — Real Page Stubs (next)
- [ ] Replace PlaceholderPage with real stub components per section
- [ ] Mein Tag: Morning briefing layout with section containers (dummy data)
- [ ] Hunting/Lead-Liste: Table skeleton with 3-level progressive disclosure structure
- [ ] Hunting/Pipeline: Kanban column skeleton
- [ ] Shared components: HeatBadge, StageBadge, EngagementChain, PersonalityDot

### Phase 3 — Supabase Setup
- [ ] Create Supabase project
- [ ] Run full schema SQL (all tables from briefing section 4)
- [ ] Set up RLS policies
- [ ] Configure Supabase Auth (email + password)
- [ ] Add `system_config` seed data (all default values from briefing section 17)
- [ ] Generate TypeScript types: `supabase gen types typescript`

### Phase 4 — Navigation & Shell
- [ ] Implement 3-tab navigation: Mein Tag / Hunter / Farmer
- [ ] Role-based nav rendering (solo/hunter/farmer/admin)
- [ ] Cmd+K command bar (search + navigation only, no AI)
- [ ] Secondary nav: Jira / Marketing / Sherloq / Admin (all placeholders initially)

### Phase 5 — Mein Tag Screen
- [ ] Today's calendar events (dummy data first)
- [ ] Meeting prep panel (inline expand)
- [ ] Daily priorities (max 5)
- [ ] Due tasks with suggested channel + message
- [ ] Churn warnings
- [ ] Upsell potentials

### Phase 6 — Hunter Screen
- [ ] Lead list (Level 1/2/3 progressive disclosure)
- [ ] Visual engagement chain (icon row of last communications)
- [ ] Pipeline / Kanban view with drag & drop
- [ ] Deal financials inline panel

### Phase 7 — Farmer Screen
- [ ] Customer list (same structure as Hunter, filtered by cluster = Customer)
- [ ] Heat status display + color coding
- [ ] Churn risk indicators
- [ ] Sherloq usage metrics per contact

---

## Blockers

- GitHub push of `vercel.json` commit pending (token revoked by GitHub secret scanning — share tokens via terminal, not chat)

---

## Notes & Decisions

- Token sharing in chat = auto-revoked by GitHub. Always use `gh auth login` in terminal for future auth.
- `pandapau-ship-it` is the GitHub username for this project.
- First commits (project scaffold + Mantine setup) ARE on GitHub. Only the `vercel.json` commit is missing.
