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
