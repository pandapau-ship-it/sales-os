# Session-Übergabe — 2026-06-22 (Teil 3: Auth/Org [D21] Scheiben 2–7 + D28/D29)

> Fortsetzung. Vorherige Übergaben: `session_uebergabe_2026-06-22.md` (bis Phase 3) und
> `session_uebergabe_2026-06-22_teil2.md` (= **[D27] Tech-Schuld**, auf separatem, noch nicht
> gemergtem Branch `chore/session-2026-06-22-teil2`). **[D27] wird hier nicht wiederholt.**
> Diese Übergabe dokumentiert die Arbeit **seit** `3ddf89b` ohne [D27]: Auth/2FA-Entscheidungen,
> D28, D29 und **Auth/Org [D21] Scheiben 2–7**.

## ⚠️ Branch-/Merge-Lage (wichtig zuerst)
- Diese Session liegt auf **`chore/session-2026-06-22-teil3`** und enthält **sowohl** die
  Session-Doku **als auch** den noch nicht gemergten Feature-Code von **Scheibe 7**
  (Invitations/Teams: Migr. 042/043, `TeamSettings`, db.ts-Funktionen, KB 044).
- Auf `main` sind bereits (direkt/teils via Merge): D21 Scheiben 2–6, D28, D29, die Auth/2FA-Entscheidungen.
- **Offene, nicht gemergte Branches:** `chore/session-2026-06-22-teil2` ([D27]-Doku) und der frühere
  Feature-Branch `feature/d21-invitations-teams` (Scheibe-7-WIP wurde auf teil3 übernommen).
- **Migrationen 042/043/044 sind NICHT gepusht** — `supabase db push` macht Oliver beim Sessionstart.

## Was seit der letzten Übergabe fertig wurde

### Auth/2FA-Entscheidungen (CLAUDE.md, `6196fac` auf main)
Login-Methoden, 2FA (TOTP, Owner Pflicht), Teams, Einladungs-Flow, Onboarding, Session-Länge +
`teams`/`team_members`-Tabellenspezifikation — als verbindlicher [D21]-Block in CLAUDE.md.

### [D28] / [D29] (Deferred dokumentiert)
- **[D28]** Performance-Optimierungen (Prefetching · Supabase Pro/Cold Starts · Realtime statt Polling).
- **[D29]** Einladungs-Mail via Edge Function (`auth.admin.inviteUserByEmail`, service_role → nur serverseitig).

### [D21] Auth/Org-Wiring — Scheiben 2–7
1. **Scheibe 2 — Login** (`main`): passwortloser Magic-Link-Entwurf → **korrigiert auf Email+Passwort +
   Google/Microsoft SSO + Passwort-Reset**. `lib/auth.ts` (`signInWithEmail`/`resetPassword`/`signInWithGoogle`/
   `signInWithMicrosoft`), neuer `Login.tsx` (Auge-Toggle, „Passwort vergessen"-Flow), `AuthCallback` +
   Route `/auth/callback`, db-Client-Auth-Optionen (`persistSession`/`autoRefreshToken`/`detectSessionInUrl`),
   `GoogleIcon`/`MicrosoftIcon` (Token-Farben) + Tokens `--brand-google`/`--brand-microsoft`.
2. **Scheibe 3 — Provisioning-Trigger** (`main`, Migr. **041**): `handle_new_user()` auf `auth.users` INSERT →
   neue Organization + `public.users` (role=owner). **Bereits per db push angewandt.**
3. **Scheibe 4 — `useCurrentOrg()`** (`main`): Session→`organization_id`+`role` aus `public.users`
   (`getUserOrgRole`), Fallback `DEMO_ORGANIZATION_ID`. TanStack Query, kein Consumer geändert.
4. **Scheibe 5 — Ersetzen** (`main`): `DEMO_ORGANIZATION_ID` → `useCurrentOrg()` in 5 Consumern
   (ReferenceScreens/HunterSidepanel/ScreenHunting/ExpandedCardContent/useModules). `lib/org.ts` bleibt Fallback.
5. **Scheibe 6 — Ownership** (`main`): `created_by`/`assigned_to`/`owner_id` aus `auth.uid()` in
   createNote/createTask/createCommunication/createDeal (optional, Fallback NULL). „Wer" im Aktivitäts-Log
   greift via `audit_write()`/`auth.uid()` automatisch mit Session.
6. **Scheibe 7 — Invitations + Teams** (**auf diesem Branch, nicht auf main**): Migr. **042**
   (`invitations`/`teams`/`team_members` + RLS + Indizes + Audit-Trigger; Token/Expiry als DB-Defaults) +
   **043** (Trigger-Einladungs-Pfad: Org+Rolle aus Einladung, `accepted_at` setzen). db.ts:
   `getTeamMembers`/`getInvitations`/`createInvitation`/`deleteInvitation`/`updateUserRole`. UI
   `features/settings/TeamSettings.tsx` unter `/app/settings`. KB **044** (Team & Einladungen).

## Neue Komponenten in der Library
- **`TeamSettings`** (`features/settings/`) — in Barrel (`@/components`) + CLAUDE-Komponententabelle eingetragen.
- **`AuthCallback`** (`auth/`) + **`GoogleIcon`/`MicrosoftIcon`** (`shared/BrandIcons`) — aus Scheibe 2.
- `useCurrentOrg` (`hooks/`) — Scheibe 4.

## Gate-Status
`npm run build` ✓ · `npm run audit` 0 FAIL (Token-Farben + Typo + Service-Abstraktion + Single-Source PASS) ·
`npm run structure-check` ✓.

## Offene Punkte / Nächste Schritte (Reihenfolge)
1. **`supabase db push`** für **042 + 043 + 044** (Oliver).
2. **Branch-Merges** entscheiden: `teil2` ([D27]-Doku), `teil3` (diese Session inkl. Scheibe-7-Code).
   Beim Mergen beider können sich PROGRESS.md/CHECKLIST.md leicht überlappen → ggf. kleiner Konflikt.
3. **[D29]** Einladungs-Mail Edge Function (`inviteUserByEmail`) + Email-Provider in Supabase.
4. **2FA (TOTP)** UI + Enforcement (Owner Pflicht).
5. **Member entfernen** (bewusst ausgelassen — keine db-Funktion spezifiziert; destruktiv/cascade).
6. Realtime (Phase 5), AI-Pipeline (löst „Folgt"-Platzhalter [D5]/[D26]).

## Wichtige Entscheidungen
- **Kein Magic Link** — B2B-Tool, tägliche Nutzung → Email+Passwort primär (+ SSO).
- **Einladungs-Mailversand braucht service_role** → nur Edge Function ([D29]); Client persistiert nur die Einladung.
- **Owner-Default für Deals:** manuell gewählter Owner gewinnt, sonst anlegender User.
- **`tasks` hat kein `created_by`** → Ownership landet in `assigned_to`.

## Offene Fragen
- Bei `db push`: Smoke-Test, dass eine Einladung → Registrierung den User der eingeladenen Org/Rolle zuordnet
  (keine neue Org), `invitations.accepted_at` gesetzt.
