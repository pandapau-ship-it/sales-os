# Session-Übergabe 2026-07-23

> Scope dieser Übergabe: alle Commits seit `docs/session_uebergabe_2026-07-21.md`.
> Schwerpunkt: **Lifecycle-Regel-Baukasten L-2c → L-3 komplett (a–e)** inkl. Live-E2E-Funde,
> Security-Härtung, neuer `security-audit`-Agent und die Deeplinks (L-3e).

---

## Was fertig wurde

### Lifecycle-Baukasten — von L-2c bis L-3e komplett
- **L-2c (Backend-Vorschalt):** Bündelung (`notify`/`notify_urgent` = EINE Meldung je Regel/Lauf, inhaltsbasierter
  `bundleSourceId` → Crash-Retry-Dedup, Re-Fire = neue Meldung) · Dry-Run (read-only Trefferzahl) · `[D54]`-Strukturfehler.
  Service-Role-Guard format-agnostisch gemacht (neuer `sb_secret_`-Key ist kein JWT).
- **L-3a (Fundament):** Migr. 093 (`notify`-message optional + `upsert_lifecycle_rule` 3-arg mit `stale_write`-Guard) ·
  Read-Layer (`getLifecycleRules`/`getActionTypes`/`getLifecycleRuleLimit`/`dryRunLifecycleRule`) · `lib/lifecycle/config.ts`
  (Feld/Operator aus `FILTER_SCHEMA`) · i18n `lifecycle.*`.
- **L-3b (ConditionBuilder-Library):** `ConditionRow` · `ConditionBuilder` · `LiveMatchCount` — generisch, prop-driven,
  auch für dynamische Listen nutzbar. Entity-Farb-Tokens (Kontakt/Deal/Firma).
- **L-3c (Overview):** `RuleOverview` + `RuleCard` + 5 Vorlagen + Klartext-Zusammenfassung; Limit-Banner; `automation.manage`-Gate.
- **L-3d (3-Schritt-Editor):** `RuleEditor` (Anker → Bedingungen → Aktion), eigene Settings-Seite „Automatik-Regeln".
- **L-3e (Deeplinks, [D56]/[D57]):** Sprung aus gefeuerter Regel-Benachrichtigung in die gefilterte Kontakte-/Companies-Liste.
  `db.getRuleMatchTargets` (ledger-basiert, org-gescoped, Anker→Kontakt/Firma, `deleted_at`-gefiltert, Kontakt-Granularität) +
  geteilter `RuleMatchBanner` (5 ehrliche Zustände). Kette: edge `deeplinkFor` → `notify(p_link)` → `notifications.link` →
  `ScreenNotifications.navigate` → Ziel-Screen liest `?firedBy`.

### L-3d E2E-Funde (echter Backend-Walkthrough) — 4 Bugs, alle gebaut + gegatet + deployt
- **FUND 4/4b:** Evaluator ignorierte `deleted_at` (Anker-Reads + direkte FK-Mappings) → hätte auf gelöschte Datensätze
  gefeuert. Fix: 058-Muster nach `_shared/lifecycle/anchors.ts` (12 vitest-Fälle). Bestandsaufnahme über ALLE Orgs: **0 Schaden**.
- **FUND 1:** Browser-Dry-Run scheiterte an fehlendem CORS/OPTIONS. Fix: `corsHeaders` + Preflight; Deploy `--no-verify-jwt`
  (Function macht Auth selbst). Empirisch: server 200, Browser „Failed to fetch" → nach Fix erreichbar.
- **FUND 2+3:** enum+`in`/`not_in` erzeugte Skalar statt Array, freie Listen Komma-Freitext. Fix: `EnumMultiSelect` +
  `ChipInput` + Validierungs-Gating + „Nicht gespeichert"-Banner.
- **Security-Härtung:** `decodeJwtRole` (ungeprüfter JWT-Fallback) entfernt — Voraussetzung für `--no-verify-jwt`.
  Gefälschter service_role-JWT → live **403** belegt (pre-fix wäre 200 gewesen).

### Neuer Agent: `security-audit` (manuell, KEIN Gate)
`.claude/agents/security-audit.md` + CLAUDE.md-Block. Sucht **Invarianten-Drift** (7 Prüfbereiche, inkl. Frontend-seitige
Annahmen), belegt statt behauptet, Testdaten-zum-Beleg erlaubt (reversibel, hart aufräumen), fixt nichts. Läuft nur auf
ausdrückliche Nennung durch Oliver.

---

## Prinzipien-Gate (2b) — Lifecycle-Regel-Baukasten: **BESTANDEN** ✅
- **(1) Single Source ✅** — EINE Filter-Sprache `lib/filter` (+Deno-Spiegel); `action_types` als Daten; `compileToPostgrest`/
  Dry-Run EINE Trefferzahl-Quelle; `RuleMatchBanner`+`getRuleMatchTargets` geteilt; Anker-Reads zentral (`anchors.ts`);
  EIN Schreibweg `upsert_lifecycle_rule`.
- **(2) Performance ✅** — audit N+1 PASS; org+firedBy im Query-Key + `staleTime`; Dry-Run debounced; keine `SELECT *`.
  *Deferred:* Bulk-`lifecycle_mark_fired` schließt das at-least-once-Fenster bei Mid-Loop-Crash.
- **(3) Konfigurierbarkeit [D51] ✅** — Regeln SELBST sind Logik-als-Daten (chat-fähiger Schreibweg); Bedingungs-Schwellen
  aus `settings`. System-Enums (anchor_entity/Won-Lost/action-keys) bewusst kein Config. *Deferred:* score-`*` `deleted_at` ·
  Custom-Fields in `FILTER_SCHEMA` · CORS-Allowlist.
- **(4) Honesty ✅** — Deeplink deckt alle Zustände ehrlich ab (nie leeres Nichts); Kontakt-Granularität (Auditor-Fund C
  behoben); Evaluator feuert nicht auf gelöschte Anker; `[D54]`-Strukturfehler statt stummem Scheitern.

---

## Was noch offen ist (Reihenfolge)
1. **Zwei Deploys (OLIVER-Entscheidung):**
   a) `git push` main → Vercel (Frontend hängt bei L-3c; alles seit L-3d ist unpushed, `origin/main` = `edb870b`).
   b) `supabase functions deploy evaluate-lifecycle-rules --no-verify-jwt` — deployte **v4** hat FUND-Fixes, aber **nicht**
      die L-3e-Deeplink-Zeilen → live schreibt der Evaluator noch `link=null`.
2. **Kleine [BAU]-Slices (gereiht, QUEUED):** score-`*`-Crons `deleted_at` (058-Muster) · ACL-Audit aller Funktionen
   (drop+create nimmt GRANTs mit) · CORS-Allowlist statt `*` (sobald Prod-Domain final) · Custom-Fields in `FILTER_SCHEMA`.
3. **L-3f (KI-Regel-Generierung)** — „Regel in Alltagssprache beschreiben" → eigener Slice NACH dem produktweiten AI-Layer (`lib/ai.ts`).
4. **Anon-Key-Negativtest** des Evaluators (offener Haken aus dem Deploy) + Bulk-`lifecycle_mark_fired`-Härtung.

---

## Wichtige Entscheidungen
- **Deeplink ledger-basiert (Option A):** Zielmenge aus `lifecycle_rule_runs` (matched=true), NIE aus der URL (die wäre eingefroren).
- **Org-Isolation bei Nutzereingabe:** `firedBy` kommt aus der URL → `getRuleMatchTargets` filtert zusätzlich zur RLS explizit
  `organization_id` (Defense-in-Depth). RLS empirisch belegt (`as_foreign_org=0`).
- **Zählung in Kontakt-Granularität:** bei anchor `deals` verdichten mehrere Deals auf einen Kontakt — `matchedTotal`/`unavailable`
  zählen Kontakte, nie Deals (sonst falscher „gelöscht"-Wert). Auditor-Fund C, vor Merge behoben, live belegt.
- **KEIN Vergangenheits-Cleanup** bei FUND 4 (destruktiv) — stattdessen Read-Only-Zensus über alle Orgs (0 Schaden).
- **`security-audit` ist kein Gate** — nur manuell, ergänzt test-runner/auditor.

---

## Prinzipien-Gate offene Punkte / Deferred-Items (vollständig)
- **[D51]-Deferred (Lifecycle):** score-`*` `deleted_at` · Custom-Fields in `FILTER_SCHEMA` · CORS-Allowlist.
- **[D54]** (Chat-Fehler-Rückmeldung) im Evaluator umgesetzt; Bestands-Schreibwege weiterhin im eigenen Nachrüst-Slice.
- **[D56]/[D57]** (Deeplink-Routing + Bündelung) — mit L-3e umgesetzt.
- **[D5]** (KI/aiCall) — L-3f + alle „Folgt"-KI-Aktionen hängen daran.

---

## Neue Komponenten (Library)
**panel-blocks/** — `ConditionRow` · `ConditionBuilder` · `EnumMultiSelect` · `ChipInput` · `LiveMatchCount` · `RuleMatchBanner`.
**features/settings/lifecycle/** — `RuleOverview` · `RuleCard` · `RuleEditor`.
Alle in CLAUDE.md „Verfügbare panel-blocks"/„features/settings" eingetragen, im Barrel, in `audit.ts` IN_SCOPE (Typo-Kanon).

## Neue db.ts-Funktion
`getRuleMatchTargets(ruleId, org)` — read-only Deeplink-Resolver (org-gescoped, Anker-Auflösung, `deleted_at`-Filter).
Auf der Chat-Bestandsliste vermerkt (read-only, keine Vertrag-Pflicht).

## Neue Migration (NICHT gepusht — db push macht Oliver am Sessionstart)
`094_knowledge_base_lifecycle_rules.sql` — 2 KB-Einträge (Automatik-Regeln WENN-DANN · Sprung aus Regel-Benachrichtigung),
idempotent (UNIQUE(org,feature) + ON CONFLICT). Seed-Spiegel in `docs/knowledge_base.md` ergänzt.

---

## Offene Fragen
- Wann die zwei Deploys (Push + Edge-Redeploy) gefahren werden — beides deine Entscheidung.
- Reihenfolge der QUEUED-Kleinslices (score-`*` `deleted_at` vs. ACL-Audit) — Vorschlag: ACL-Audit zuerst (systemisch, Sicherheit).

---

## Betriebs-Check (auf Nachfrage)
Watchdog-Glockenmeldung „1 Betriebs-Job(s) nicht durchgelaufen" = **Altstand vom 2026-07-19 15:15** (heute 17:33 gelesen),
NICHT von vor 20 h. `system_alerts` leer (kein aktiver Alarm), seit 22.07. 06:00 keine neue Notification. Die reguläre
Tages-Kette lief seither sauber: score-upsell-daily 07-23 05:00 → evaluate-lifecycle-rules 05:00 (beide success). Kein
Zusammenhang mit heutiger Arbeit.
