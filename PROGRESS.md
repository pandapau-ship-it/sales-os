# Sales OS — Progress Tracker

> Update this file at the end of every session. Read it at the start.

---

## Current Status: Design Token System vollständig ✅ → Phase 5 (Supabase + echte Daten) next

---

## Completed

### Session 1 — 2026-05-24
- [x] Node.js v24.16.0 installed via nvm
- [x] Vite + React + TypeScript project scaffolded
- [x] Mantine v8 installiert und konfiguriert
- [x] `AppShell` mit navbar, header, dark/light mode
- [x] `vercel.json` erstellt (Vite build config + SPA rewrites)
- [x] GitHub repo erstellt: `pandapau-ship-it/sales-os` (public)
- [x] `CLAUDE.md` + `PROGRESS.md` erstellt

### Session 2 — 2026-05-25 — Hyper-Modern Floating UI
- [x] Komplettes Navigation-Redesign: Pill-TopBar + Icon-Sidebar
- [x] Gradient Active States: `linear-gradient(135deg, #175253, #3f8383)`
- [x] `CLAUDE.md` — "Design Vision Hyper-Modern Floating UI" permanent festgeschrieben

### Session 3 — 2026-05-26 — Realtime & Framework Switch
- [x] `CLAUDE.md` — "Realtime Events & Webhooks" Sektion (8 Webhook-Endpunkte, Supabase Subscriptions, Offline Handling)
- [x] Mantine vollständig entfernt → shadcn/ui + Tailwind CSS v4
- [x] `src/lib/utils.ts` — `cn()` Helper (clsx + tailwind-merge)
- [x] `components.json` — shadcn Konfiguration
- [x] `vite.config.ts` — `@` Alias → `src/`
- [x] `tsconfig.app.json` — Paths-Mapping, verbatimModuleSyntax

### Session 4 — 2026-05-28 — ZIP-Migration (Design Token System + Ordnerstruktur)

#### Schritt 2 — Design Tokens (src/index.css) ✅
- [x] Komplettes CSS-Token-System:
  - Brand: `--sherloq-primary`, `--sherloq-gradient`, `--sherloq-light`
  - Surfaces: `--app-bg`, `--surface`, `--surface-secondary`
  - Text: `--text-primary`, `--text-body`, `--text-muted`
  - Borders, Radien, Shadows, Signal Colors (urgent/warn/success/info/cold/teal)
- [x] `@theme inline` Block → Tailwind-Utility-Klassen (`bg-sherloq-primary`, `shadow-card` etc.)
- [x] Globale Utility-Klassen: `.sherloq-card`, `.sherloq-pill`, `.sherloq-btn-primary`, `.sherloq-btn-secondary`, `.pill-urgent` etc.

#### Schritt 3 — Tailwind v4 ✅
- `tailwind.config.ts` entfällt in v4 → `@theme inline` in CSS erledigt dasselbe nativ

#### Schritt 4 — Ordnerstruktur + Datenmigration ✅
- [x] `src/types.ts` → Referenz-Version (HeatStatus: HOT/WARM/LUKEWARM/COLD/DEAD, vollständige Interfaces)
- [x] `src/data.ts` → Referenz-Version (INITIAL_LEADS, INITIAL_CUSTOMERS, INITIAL_TASKS, alle 8 Exports, 518 Zeilen)
- [x] Neue Ordnerstruktur:
  ```
  src/components/
    ui/        ← shadcn Primitives
    screens/   ← ScreenMyDay, ScreenHunting, ScreenFarming, ScreenMarketing, ScreenSherloqSystem, Jira
    layout/    ← TopBar, Sidebar
    shared/    ← CustomerDrawer, CommandPalette, CommunicationChain, ICPDonut
  ```
- [x] Alle Import-Pfade angepasst (`@/types`, `@/data`, `@/components/shared/...`)
- [x] `import type` für alle Type-Only-Imports (verbatimModuleSyntax)
- [x] Fehlende Lucide-Icons ersetzt: `Linkedin` → `Link2`, `Slack` → `Hash`

#### Schritt 5 — TopBar neu gebaut ✅
- [x] 56px sticky, transparent (kein weißer Hintergrund), z-30
- [x] Links: Teal-Kreis "S" + "Sherloq" semibold 14px + "SALES OS" 10px uppercase mono
- [x] Mitte (absolut zentriert): Pill-Container mit shadow-nav, 3 Tabs — Mein Tag (Sun) · Hunting (Target) · Farming (Sprout)
- [x] Rechts: "Suchen..." ⌘K Pill (180px) + Avatar "OS" (32px, teal rund)
- [x] Aktiver Tab: `var(--sherloq-primary)` + weiß · Inaktiv: `var(--text-body)` + hover
- [x] TypeScript: 0 Errors ✓

#### App.tsx ✅
- [x] Vollständige State-Verwaltung: leads, customers, tasks, priorities, alerts, appointments, marketingIdeas
- [x] Progressive Disclosure Drawer (Level 3): CustomerDrawer
- [x] CommandPalette via `onOpenCommandPalette` Prop
- [x] Settings Modal

---

#### Schritt 6 — Token-Migration aller Komponenten ✅
- [x] Alle hardcodierten Hex-Werte in `screens/` und `shared/` durch Design Tokens ersetzt:
  - Brand: `bg-sherloq-primary`, `text-sherloq-primary`, `var(--sherloq-gradient)`
  - Surface: `bg-app-bg`, `bg-app-surface`
  - Text: `text-text-primary`, `text-text-body`, `text-text-muted`
  - Border: `border-border`, `border-sherloq-primary`
  - Signal: `text-signal-urgent/success/info/cold`, `bg-[var(--signal-*-bg)]`
  - Radius: `rounded-pill` (war `rounded-full`), `rounded-card` (war `rounded-xl/2xl`)
  - Shadow: `shadow-card` (war `shadow-lg/md`)
- [x] `CLAUDE.md` aktualisiert mit neuem Tech Stack, Design System Regeln, Ordnerstruktur
- [x] TypeScript: 0 Errors ✓

---

## Nächste Schritte — Phase 5

### Supabase Setup
- [ ] Supabase Projekt erstellen
- [ ] Schema SQL ausführen (alle Tabellen aus Briefing)
- [ ] RLS Policies einrichten
- [ ] Supabase Auth konfigurieren (Email + Passwort)
- [ ] `system_config` Seed-Daten
- [ ] TypeScript Types generieren: `supabase gen types typescript`

### Vercel Deployment
- [ ] vercel.com/new → Import von GitHub `pandapau-ship-it/sales-os`
- [ ] Environment Variables setzen (Supabase URL + Key)
- [ ] Auto-Deploy testen

### Realtime & Webhooks (bereits in CLAUDE.md dokumentiert)
- [ ] 8 Webhook-Endpunkte als Vercel API Routes implementieren
- [ ] Supabase Realtime aktivieren für alle relevanten Tabellen
- [ ] Frontend Subscriptions in betroffenen Komponenten

---

## Tech Stack (aktuell)
- React 19 + Vite + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- shadcn/ui (Primitives in `src/components/ui/`)
- Design Tokens: `src/index.css` CSS Variables + `@theme inline`
- `@` Alias → `src/`

## Design System Regeln (aktiv)
- **Niemals Hex-Werte direkt** — immer CSS Variables oder Tailwind-Tokens
- Globale Klassen: `.sherloq-card`, `.sherloq-pill`, `.sherloq-btn-primary`, `.sherloq-btn-secondary`, `.pill-urgent` etc.
- `cn()` aus `src/lib/utils.ts` für alle Klassen-Kombinationen
- Eine Farbe ändern = in `index.css :root` ändern = überall geändert

## GitHub
- Repo: `pandapau-ship-it/sales-os`
- Branch: `main`
