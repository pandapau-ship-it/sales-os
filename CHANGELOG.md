# Changelog

> Eintrag nach jedem Commit (→ CLAUDE.md Dokumentations-Standard).
> Format: `add:` neu · `update:` geändert · `fix:` behoben · `refactor:` · `docs:`
> Neueste oben.

## Unreleased

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
