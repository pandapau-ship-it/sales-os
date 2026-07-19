# Changelog

> Eintrag nach jedem Commit (→ CLAUDE.md Dokumentations-Standard).
> Format: `add:` neu · `update:` geändert · `fix:` behoben · `refactor:` · `docs:`
> Neueste oben.

## Unreleased

- **feat:** Entitlement- & Credit-Layer (Vorab-Migration vor AI-SDR-Slice-5, Option A).
  Additive Migrationen 061–063 auf den Billing-Tabellen (008): `credit_transactions.metadata`,
  `settings.billing` ([D51]-Config statt nicht-existenter `system_config`), Seeds (internal-Plan
  `-1`, Subscription + credit_balance je Org, Billing-Config). RLS war bereits vollständig in 011
  (plans/plan_limits global — dokumentierte audit-Ausnahme `GLOBAL_TABLES`). RPCs `check_entitlement` /
  `check_credit_balance` / `consume_credits` (atomar, security definer, intern blockiert nie).
  Monats-Reset-Cron. Formel-Spiegel `src/lib/credits.ts` (+19 Tests). `aiCall()`-Verdrahtung +
  Promo/Voucher (redemption_codes) als dokumentierte Haken. (docs §9)

- **docs:** Git-Workflow als harte Regel verankert — niemals direkt auf `main`,
  immer Feature-Branch (`feature/`·`fix/`·`chore/`), regelmäßige Commits. (CLAUDE.md Selbst-Wartung + Repository)
- **feat:** Service-Abstraktion `lib/db|auth|storage|realtime` — einzige Supabase-Swap-Stelle; audit-geprüft.
- **feat:** Dark Mode Basis (Tokens, `useTheme`, Sidebar-Toggle, FOUC-Guard); CustomerDrawer-Slide + Dark-Fixes.

- **docs:** Dokumentations-Standard in CLAUDE.md erweitert (Stripe/Linear/Vercel-Niveau);
  `/docs`-Struktur angelegt (modules, api, decisions); 6 ADRs geschrieben
  (Supabase, shadcn, Edge Functions, organization_id, Sending Layer, aiCall);
  Placeholder für setup/runbook/CONTRIBUTING/database/architecture; `llms.txt`; dieses CHANGELOG.
- **fix:** Emoji aus UI entfernt (ScreenFarming/Hunting/CustomerDrawer) → Lucide-Icons;
  `audit.ts` schließt `ScreenPlaceholder` als Helper sauber aus.
- **add:** `CHECKLIST.md` + `scripts/audit.ts` (`npm run audit`) — Selbst-Audit der 5 Pflicht-Prüffragen.
- **add:** Selbst-Wartung Pflichtregeln (höchste Priorität) als erste CLAUDE.md-Sektion.
- **update:** Agent-Architektur (AI SDR/Hunter/Farmer), Navigation 4-Punkte,
  Signal Routing, Hunter/Farmer als Recommendation Agents, Risk-Level Vorbereitung.
- **add:** Datenqualität & Duplikate, Notifications, Performance, Fehlerbehandlung,
  SaaS-Readiness, Dynamische Sequenzen, Sequenz Engine, AI Call Abstraktion, Modularer Aufbau.

## Frühere Phasen

Siehe `PROGRESS.md` für die Session-Historie (Design-Phase, shadcn-Migration,
Token-Zentralisierung, Build-Fixes).
