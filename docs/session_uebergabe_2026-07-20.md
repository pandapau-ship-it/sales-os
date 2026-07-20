# Session-Übergabe 2026-07-20 — Settings-Fundament (SET-1…SET-3), Login-Pflicht, Mitteilungen/Betrieb, „Mein Unternehmen" 1/3

> Spanne: seit Übergabe `2026-07-18` (Kontakte & Companies K-1…K-6). In dieser Spanne wurden **acht
> Feature-Merges** nach `main` gebracht — das Rechte- und Settings-Fundament, die erzwungene Anmeldung,
> das Mitteilungs- + Betriebs-Fundament und die erste Seite der Gruppe „Mein Unternehmen".
> Alles auf `main`, Gates durchgängig grün, alle Migrationen gepusht und live verifiziert.
> Detail-Einträge stehen im Body von `PROGRESS.md`.

**`main`-HEAD zum Zeitpunkt dieser Übergabe: `963b3a2`** (== `origin/main`).

---

## Was fertig wurde (alles in `main`)

### Rechte-Fundament — SET-1 (Migr. 070/071, Merge `b79b11c`)
Ein **echter serverseitiger Wächter** als Postgres-Funktionen, nicht nur UI-Ausblendung: `has_permission`
rechnet **deny > grant > Rolle**; `grant_permission`/`revoke_permission` prüfen Cross-Org und
Admin-Hierarchie; `set_user_role` ist owner-only mit Letzter-Owner-Schutz; `soft_delete_*` und Merge
erzwingen `records.delete`/`records.merge`. Datengetriebene Matrix (`permission_catalog` +
`role_permissions`), TS-Spiegel `lib/permissions.ts`, Hook `useEffectivePermissions`, UI-Gate
`RequiresPermission`. **Katalog bewusst klein** (nur heute existierende Rechte) — Zukunfts-Registry in PROGRESS.
Neue CLAUDE-Dauerregel: **Rechte-Check-Pflicht**.

### Login-Pflicht [D21] (Migr. 072, Merge `42381be`)
Login wird erzwungen (`Protected` unter `/app/*`), Reset-Flow vervollständigt, Logout im Avatar-Dropdown,
Dev-Bypass hinter explizitem Flag. **Invite-only:** `handle_new_user` legt ohne gültige Einladung keine
Org mehr an; der nicht-provisionierte Zustand wird sichtbar (`ProvisioningGate`) statt still auf die
Demo-Org auszuweichen. Neue CLAUDE-Dauerregel: **Öffentliche Routen** (explizit + vor dem Catch-all).

### Settings SET-2 — Backend + „Persönlich"-UI (Migr. 073/074, Merges `53e4123`, `0f16896`)
`settings.general` (Sprache/Zeitzone/Datumsformat/Währung), Profil-Spalten, Recht `settings.manage`,
validierte Update-RPCs mit `audit_log`. UI: **Mein Profil · Ansicht · Sicherheit** hinter dem Avatar.
Aus dem Live-Test entstand die Dauerregel **Nav-Sichtbarkeit = ZWEI Ebenen** (Firmen-Entitlement UND
persönliche Präferenz, UND-verknüpft, auf ALLEN Nav-Oberflächen).

### Settings SET-3 — Team & Rechte (Migr. 076, Merge `ad34c94`)
Mitglieder-Lebenszyklus (aktiv/deaktiviert/**weich entfernt**), Server-Wächter (Cross-Org · `team.invite` ·
Selbst-Lockout · Admin≠Owner · letzter Owner), Einladungs-Dedup. **Zwei Protokollier-Lücken geschlossen:**
`set_user_role` schrieb gar kein `audit_log`, `grant/revoke_permission` protokollierte nur die Rechte-Zeile
statt der Person. UI: vollständige Settings-Shell (alle Gruppen, Ungebautes ausgegraut + „Folgt"),
Mitglieder-Seite, Personen-Detail mit **datengetriebener** Rechte-Liste (`PERMISSIONS.map()`).

### Mitteilungen + Betrieb (Merges `d0bf6f3`, `3b5dc9f`)
Text-Clamp behoben, **Alarm-Texte in Klartext** (was lief nicht · was bedeutet das · was ist zu tun),
relative Zeit basiert jetzt auf `updated_at` (eine erneut ausgelöste Meldung wirkte fälschlich uralt).

### „Mein Unternehmen" 1/3 — Produkte & Preise (Migr. 077, Merge `963b3a2`)
Siehe PROGRESS-Eintrag. Kern: `org_profile` mit `field_meta.locked` als Schutz vor dem späteren
Website-Scan · `products` **additiv** erweitert statt zweiter Tabelle · **`ai_may_reference_price`** pro
Produkt (Default false) als harte Bedingung im AI-SDR-Bauplan · ein validierter Schreibweg · Texte als
`jsonb` (Mehrsprach-Andockhaken).

---

## Wichtige Entscheidungen dieser Spanne

| Thema | Entscheidung |
|---|---|
| `user_permissions.effect` | `deny` bleibt im Schema/Guard, **v1 nutzt nur `grant`** — spätere Subtraktion ohne Migration möglich. Ersetzt die alte Zusage „nie subtraktiv" (jetzt v1-Betriebsregel). |
| Zugang | **Invite-only** — neue Orgs entstehen künftig nur über den Onboarding-Flow, nicht per Self-Signup. |
| „Persönlich" in Settings | **Keine** eigene Nav-Gruppe — ein dezenter Verweis auf `/app/profil`. |
| Produkt-Daten | `products` erweitern statt `product_info` — sonst fände der Nutzer sein Produkt nicht im Deal-Dropdown wieder. |
| Preise & KI | Preisnennung ist **pro Produkt** freizugeben, Default aus. |
| Feld-Muster „Mein Unternehmen" | Durchgehend **sichtbare** graue Felder (kein Read-Mode/Stift) — verbindlich auch für Slice 2/3. |
| Aktions-Ebene der Wichtigkeits-Registry | **Option A**: keine leere Struktur auf Vorrat; entsteht mit dem Chat-Tool-Layer. |

**Zwei neue projektweite Dauerregeln** (CLAUDE.md): **Chat-Aktions-Vertrag-Pflicht** (jede chat-fähige
Funktion legt beim Bau required/recommended/optional fest) und **Progressive Ausführung**
(`ai_chat_bauplan` 5a: ausführen was geht · nachfragen bei Pflichtangaben · **nie erfinden**).

---

## Was offen ist / Deferred

- **Mein Unternehmen Slice 2** (Personal Voice, fünf Kanäle inkl. `email`, Live-Beispiel „So klingt das")
  und **Slice 3** (Unternehmensprofil + `org_icps`/`org_personas`). **Bis Slice 3 sind USPs + Wettbewerber
  über keine Oberfläche erreichbar** — bewusst so (Backend existiert, nur das UI-Zuhause wechselt).
- **Settings SET-4/5/6** (Regeln · Automation · Pipeline · Mein Tag · AI-Sektionen · Verbindungen ·
  Papierkorb · Audit-Log-Seite · Status-Seite B-4).
- **Chat-Aktions-Verträge nachziehen** für alle vor der Regel gebauten Funktionen (25 RPCs + 40
  `db.ts`-Schreibwege) — gebündelt beim AI-Chat-Baustein, Liste steht in PROGRESS.
- **[KB-DEFERRED]:** Knowledge-Base bleibt bis zum AI-Chat/RAG-Slice **Seed-only** (`docs/knowledge_base.md`),
  danach eine gebündelte idempotente Migration.
- **chore:** ~22 Copy-Paste-Stellen des `FIELD`-Kanons auf die zentrale Konstante ziehen.
- **[KONFIG-AUDIT]** vormerken: die Wirkungs-Reihenfolge der Vollständigkeits-Hinweise ist hartkodiert.
- Weiterhin offen aus früheren Spannen: `[D-details-persist]`, `[D-mock-hunter-feed]`, `[D29]`
  Einladungs-Mailversand, MFA-Zwang (B-3).

---

## Hinweis zur Arbeitsweise (aus dieser Spanne gelernt)

Zwei Fehler wurden **nicht** von den Gates gefunden, sondern erst im Live-Test bzw. durch die Subagents:
das falsche **Feld-Muster** (Felder existierten erst nach einem Klick — kein Test prüft so etwas) und ein
**grüner Regressionstest, der den Bug nie erreichte**. Dazu ein Verfahrensfehler: `npm run lint | tail -1`
schnitt eine echte Fehlermeldung ab. Konsequenz: Gate-Ausgaben **vollständig** lesen, und bei
Verhaltens-Fixes die **Gegenprobe** fahren (Test muss auf dem alten Code rot sein).

---

## Nachtrag — „Mein Unternehmen" 2/3 „Personal Voice" (fertig + gemergt 20.07.2026)

Zweite Seite der Gruppe „Mein Unternehmen". Die eigene Schreibstimme **pro User**
(`visibility:'self'`), klar getrennt von `contacts.personality_profile` (Empfänger).

**DB (gepusht + remote verifiziert):**
- **078** `voice_profiles` — `organization_id`+`user_id` NOT NULL (CASCADE), RLS pro-User
  (`user_id=auth.uid() AND organization_id=auth_org_id()`), `UNIQUE(org,user)`, `field_meta`-locked
  (wie 077), updated_at-/audit-Trigger. `primary_channel` bewusst kein UI (Feld liegt ungenutzt).
- **079** `update_voice_profile` — **einziger** Schreibweg, Self-Service (kein `settings.manage`),
  Top-**und** Sub-Key-Whitelist, `field_meta`-locked pro Feld, **Shallow-Merge je Kanal**
  (save-on-blur-sicher), `audit_log`. **Live per self-abortierendem DO-Block getestet** (gültiger
  Patch → locked/manual · unbekannter Key wirft · Shallow-Merge bewiesen · fremde Identität
  abgewiesen; Rollback ohne Rückstand — die einzige Business-Logik des Slices, ohne Unit-Test).

**UI (`features/settings/PersonalVoicePage`):** 5 Kanäle **overview + post/comment/dm/email**
(`email` die bewusste 5. Ergänzung) via `PanelTabs`; je Feld `KnowledgeField`. Kanal-Felder:
Schreibstil · Aufmacher · **„Das machst du immer" (✓) / „…nie" (⚠)** — zwei benannte Teile im
**selben** Feld `dos_donts` (`{always,never}`, keine Migration) · **Beispiele ganz unten**. Voice-Karte
+ **AI-Voice-Trainer nebeneinander (6/6)**; die Trainer-Kachel ist eine **bewusste Einzelfall-Ausnahme**
(Original-Dunkel-Optik türkis, Tokens `--voice-trainer-*` in `index.css`, **kein Hex im JSX**) mit **zwei
echten `ui/button`** (size sm, gefüllt+hell, rounded-full). Alle KI-Aktionen bleiben `AI_PILL_PENDING`
„Folgt" bis `lib/ai.ts`. Vollständigkeits-Ring über **dieselbe Registry** (`fieldImportance.ts` +20
Voice-Felder, neuer Scope `"voice"` in `computeCompleteness`). `KI ausfüllen`-Pill im Kanäle-Header.

**Reusable dabei entstanden:** `SettingsCard` um optionale `headerAction`/`className` erweitert (via `cn`) ·
`KnowledgeField` um optionalen Label-`icon`. **Honesty:** leere Voice → ehrlicher Leerzustand; Jobtitel/Firma
nur bedingt (users-Tabelle hat die Spalten nicht → korrekt unsichtbar, Logik vorbereitet, `// single-source-ok`).
i18n `voice.*` in de/en/es. Render-Tests (15) + Voice-Scope-Tests; Gates grün, test-runner + auditor PASS,
5 Tabs + Trainer je Screenshot live-verifiziert.

**Offen:** Slice 3 (Unternehmensprofil + `org_icps`/`org_personas` + Umzug USPs/Wettbewerber) ·
**[D-voice-admin-help]** (Owner/Admin hilft neuem Mitglied bei leerer Voice) bewusst deferred.

## Neue Entscheidung dieser Runde
| Thema | Entscheidung |
|---|---|
| AI-Voice-Trainer-Optik | **Bewusste Einzelfall-Ausnahme** von „keine Original-Farben": genau diese eine Kachel bekommt die dunkle Referenz-Optik (türkis), token-basiert in `index.css`. Überall sonst neutrale Tokens. |
| Do's & Don'ts | Zwei benannte UI-Teile („immer"/„nie") im **selben** DB-Feld `dos_donts` — keine neue Migration. |
| Trainer-Buttons | Echte `ui/button` (size sm), bleiben **disabled/„Folgt"** bis `lib/ai.ts` (Honesty). |

---

## Session-Ende-Nachtrag (20.07.2026, Ende) — Team & Rechte + Housekeeping

Nach Personal Voice folgte in derselben Session eine kleine SET-3-Verbesserung, dann Merge + Push.

### Team & Rechte — Mitglieder-Zeile Feinschliff (gemergt + gepusht)
Drei Verbesserungen an der Mitglieder-Zeile (`TeamMembersPage`), alle mit **Wiederverwendung** statt Neubau:
1. **Zeilen-Hover** `hover:bg-app-bg transition-colors` (bestehendes Hover-Muster).
2. **Expliziter „Rechte anzeigen"-Knopf** je Zeile (ShieldCheck + kompaktes Sekundär-Muster) — öffnet
   dasselbe Rechte-Panel wie der Name-Klick, macht die Klickbarkeit sichtbar.
3. **Rollen-Badge vor den Aktiv-Status** verschoben, als bestehendes `StatusBadge`: **nur „Owner"**
   dezent farbig (`tone="info"` — bewusst distinkt von grün-Aktiv und teal-KI), andere neutral/grau
   (`muted`); keine „Rolle"/„Status"-Überschriften. Inline-Rollen-Select bleibt erhalten.
- Render-Test (3) neu (die Seite hatte keinen). i18n `settings.members.viewPermissions` de/en/es.
- **Visuelle Grenze (ehrlich):** im Dev-Bypass ohne Session liefert die RLS 0 Mitglieder-Zeilen →
  kein Live-Screenshot der Zeile möglich; die drei Änderungen sind per Render-Test verifiziert.

### Git / Deploy
`main` == `origin/main` (gepusht `ed22b1f..96dec0e`): Personal Voice (feat+merge) UND Team&Rechte
(fix+merge) zusammen. `--no-ff`-Merges, Branches gelöscht. Vercel-Deploy triggert automatisch.
Migr. 078/079 waren bereits live (früher gepusht), kein weiterer db push.

### Modul-Abschluss-Gate — Personal Voice: BESTANDEN ✅
(1) Single Source · (2) Performance · (3) Konfigurierbarkeit (für Inhalt/Schreibpfad) · (4) Honesty —
volle Tabelle in `CHECKLIST.md` (Gate-Läufe). **Deferred:** [KONFIG-AUDIT] die Feld-Wichtigkeits-Rangfolge
der 20 Voice-Felder in `fieldImportance.ts` ist Code-Literal (B, treibt nur den Vollständigkeits-Hinweis) —
gleicher Deferred wie Slice 1; **[D-voice-admin-help]** (Owner/Admin hilft neuem Mitglied bei leerer Voice).

### Knowledge Base — bewusst seed-only (keine Migration)
Der Personal-Voice-Eintrag wurde als **Seed** in `docs/knowledge_base.md` ergänzt. Eine KB-**Migration**
wird **NICHT** angelegt: [KB-DEFERRED] (Oliver, 18.07.) hält die KB bis zum AI-Chat/RAG-Slice seed-only,
dann gebündelt als EINE idempotente Migration. Konflikt mit dem Session-Ende-Standard-Schritt bewusst
zugunsten der neueren, spezifischen Entscheidung aufgelöst.

### Chat-Merkliste nachgetragen
`update_voice_profile` (RPC, Liste A) + `updateVoiceProfile`/`getMyVoiceProfile` (db.ts, Liste B) in die
PROGRESS-Bestandsliste „Chat-Aktions-Verträge — nachzuholende Bestands-Funktionen" aufgenommen (noch NICHT
klassifiziert — kommt beim AI-Chat-Bau).

### Offen / nächste Schritte
1. **Mein Unternehmen Slice 3** — Unternehmensprofil + `org_icps`/`org_personas` + Umzug USPs/Wettbewerber.
2. Settings SET-4/5/6 (Regeln · Automation · Pipeline · Mein Tag · AI · Verbindungen · Papierkorb · Audit-Log · Status B-4).
3. Deferred: [D-voice-admin-help] · [KONFIG-AUDIT] Feld-Ranking · [D29] Invite-Mail · MFA-Zwang B-3.
