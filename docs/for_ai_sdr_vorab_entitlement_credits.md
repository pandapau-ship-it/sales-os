# FOR AI SDR — VORAB-MIGRATION: ENTITLEMENT- & CREDIT-LAYER (inkl. Token→Credit-Umrechnung)
# Sales OS · Juli 2026 · PFLICHT VOR AI-SDR-SLICE-5 · geschätzt 1 Session · baureif
# Kontext: Abo-Verwaltung DRAFT v0.9 (A1–A3) — dies ist deren "Phase JETZT".
# Dieses Dokument ist vollständig und eigenständig — Claude Code braucht nur dies + CLAUDE.md.

---

## ZIEL
Das Verbrauchs- und Berechtigungs-Fundament anlegen, damit
(a) der AI SDR sein Credit-Metering hat,
(b) echte Token-Kosten ab Tag 1 gemessen werden (Preis-Kalibrierung),
(c) User NIEMALS Token sehen — nur Credits (feste Umrechnung, Abschnitt 3),
(d) Billing später ohne Umbau andockt.
KEINE Paywalls, KEIN Stripe, NICHTS blockiert (interne Nutzung).

## REGELN
CLAUDE.md-Invarianten gelten (organization_id, RLS, versionierte Migration — nächste
Nummer vor Start prüfen), Diagnose-First (existieren Teile der Tabellen bereits?),
eigener Branch, Green Gates, STOP + QA am Ende. Abweichung nötig → Rückfrage an Oliver.

---

## 1. MIGRATION — 6 TABELLEN
Struktur 1:1 aus `docs/sherloq_os_pricing_konzept.md` Abschnitt 10:
plans · plan_limits · organization_subscription · credit_balance ·
credit_transactions · addons.

Ergänzungen gegenüber der Pricing-Doku:
```
credit_transactions
+ metadata jsonb
  -- {model, input_tokens, output_tokens, total_tokens,
  --  raw_credit_calc, langfuse_trace_id, function_name}
  -- echte Token-Zahlen aus der API-Response — PFLICHT bei jedem AI-Bezug
```
RLS: plans/plan_limits sind globale Katalog-Tabellen — lesend für alle eingeloggten
User, schreibend nur service_role; organization_id entfällt dort bewusst
(dokumentierte Ausnahme → in audit.ts-Ausnahmeliste eintragen, sonst blockt der
Pre-Push-Hook). Alle anderen Tabellen: Standard-RLS mit organization_id.

## 2. SEEDS
- plans-Zeile `internal` + plan_limits mit limit_value = -1 (unbegrenzt) für ALLE
  Features: contacts · campaigns · mailboxes · seats · ai_credits ·
  enrichment_credits · email_verification_credits (Liste aus Pricing-Doku).
- Eure Org + Demo-Org → organization_subscription auf `internal`, status 'active'.
- credit_balance-Zeilen für beide Orgs, alle credit_types, included_monthly = -1.
- system_config-Einträge:
```
billing_enabled            = false
tokens_per_credit          = 5000      -- Umrechnung, siehe Abschnitt 3
min_credits_per_action     = 1
model_credit_factors       = {}        -- optional: {"model-x": 2.0} für teure Modelle
```

## 3. TOKEN→CREDIT-UMRECHNUNG (verbindlich)
**Prinzip: Der User sieht NIE Token. Credits sind die einzige sichtbare Einheit —
überall im UI, in Warnungen, im Chat, in Abrechnungen.** Token existieren nur intern
(metadata) für unsere Kosten-Kalibrierung.

Formel pro AI-Aufruf:
```
total_tokens  = input_tokens + output_tokens            (aus der API-Response, nie geschätzt)
raw           = (total_tokens / tokens_per_credit) * model_credit_factor(model, default 1.0)
credit_cost   = max(ceil(raw), min_credits_per_action)  -- aufrunden, mindestens 1
```
- Startwert tokens_per_credit = 5000: damit kostet eine typische Aktion
  (Mail generieren ≈ 3–5k Token inkl. Kontext) ≈ 1 Credit — das erhält das einfache
  mentale Modell "1 Aktion ≈ 1 Credit" aus der Pricing-Doku, große Aktionen
  (Bulk-Analysen, lange Briefings) kosten fair entsprechend mehr.
- ALLE drei Parameter leben in system_config — Kalibrierung später ohne Code-Änderung
  aus den echten Verbrauchsdaten (genau dafür wird ab Tag 1 gezählt). [D51]
- Nicht-AI-Credits (enrichment, email_verification) bleiben stückbasiert: 1 Credit
  = 1 Vorgang, keine Token-Logik.
- ⚠ Falle: NIEMALS Token-Werte in UI-Strings, Blocks, Mitteilungen oder Fehlermeldungen
  ausgeben — auch nicht "zur Transparenz". Nur Credits.

## 4. FUNCTIONS
- `check_entitlement(org_id, feature)` → {allowed, limit, used}; bei limit -1 immer allowed.
- `check_credit_balance(org_id, credit_type)` → {allowed, included, purchased, used};
  bei -1 immer allowed.
- `consume_credits(org_id, credit_type, reason, reference_id, metadata)` — atomare
  Postgres-RPC: berechnet credit_cost nach Abschnitt 3 (Token aus metadata),
  schreibt credit_transactions-Zeile (amount = -credit_cost) UND erhöht
  credit_balance.used_this_period in EINEM Statement-Block.
  Bei unbegrenzt: trotzdem vollständige Zeile schreiben (Zählung ist der Zweck!),
  nie blocken. Bei billing_enabled=false: NIEMALS blocken, egal was.
  ⚠ Falle: kein SELECT-dann-UPDATE (Race Condition) — eine RPC.
- ⚠ Falle: kein Plan-Name-Stringvergleich irgendwo im Code ("if plan == 'growth'") —
  ausschließlich Feature-Limits über diese Functions (Abo-Draft A1).

## 5. lib/ai.ts — aiCall() ERWEITERN
Nach jedem erfolgreichen AI-Call automatisch:
`consume_credits(org, 'ai', reason: function_name, reference_id, metadata: {model,
input_tokens, output_tokens, total_tokens, langfuse_trace_id, function_name})`.
Token aus dem usage-Feld der API-Response. Ein Fehler beim Zählen darf den
eigentlichen Call NICHT scheitern lassen (fire-and-forget + Error-Log).
Damit ist die Zählung eine EINZIGE zentrale Stelle — kein Feature implementiert
eigenes Metering.

## 6. MONATS-RESET-CRON
credit_balance: used_this_period → 0 an resets_at, resets_at + 1 Monat.
Beim internen Plan reine Formsache — läuft trotzdem, damit der Mechanismus ab Tag 1
bewiesen ist. Idempotent (mehrfacher Lauf am selben Tag = kein Doppel-Reset).

## 7. AKZEPTANZ (STOP + Screenshot-QA an Oliver)
1. Beliebiger AI-Call (z.B. Kurzakte generieren) erzeugt credit_transactions-Zeile mit
   ECHTEN input/output_tokens, Modellname, Trace-ID und korrekt berechnetem credit_cost
   (Beispiel nachrechnen: 7.200 Token → 2 Credits bei 5000/Credit).
2. Kleiner Call (< 5.000 Token) kostet exakt 1 Credit (Mindestregel).
3. check_entitlement für die interne Org liefert allowed bei jedem Feature.
4. 2 parallele consume_credits-Aufrufe → 2 saubere Zeilen, Zähler exakt korrekt.
5. Simulierter Test-Plan mit ai_credits-Limit 1: zweiter Aufruf liefert allowed=false —
   aber NUR wenn billing_enabled testweise true; bei false weiterhin allowed
   (Kernanforderung: intern blockiert NIE etwas).
6. Kein Token-Wert in irgendeinem UI-Text auffindbar (grep über i18n + Komponenten).
7. Monats-Reset-Cron manuell ausgelöst → used_this_period = 0, resets_at verschoben.
8. npm run build + npm run audit grün (audit-Ausnahmen für plans/plan_limits eingetragen).

## 8. DANACH
PROGRESS.md: "Entitlement- & Credit-Layer ✓ (inkl. Token→Credit-Umrechnung) —
AI SDR Slice 5 entblockt." CHANGELOG-Eintrag. Regel für alle künftigen Features:
Enforcement-Punkte (Abo-Draft A4) rufen check_entitlement/check_credit_balance von
Anfang an — die Antwort ist intern immer ja, der Aufruf ist trotzdem Pflicht.

---
*Sales OS · FOR AI SDR — Vorab-Migration Entitlement & Credits · Juli 2026 · baureif*
*Parameter tokens_per_credit/Faktoren: Startwerte — Kalibrierung nach echten Daten via system_config*
