# BETRIEB & ÜBERWACHUNG (OBSERVABILITY) — Kompakter Bauplan v1.1
# Sales OS · Juli 2026 · Kanonisches Build-Dokument für Claude Code
# Zweck: Wir wissen VOR unseren Kunden, wenn etwas kaputt ist. Ein System, das autonom
# E-Mails an echte Menschen sendet, darf niemals unbemerkt ausfallen oder fehlversenden.
# Timing (final): MINIMAL-Stufe (Slice B-1) vor AI-SDR-Slice-5 — schützt EUREN eigenen
# Betrieb + Mailbox-Reputation. VOLL-Ausbau (B-2/B-3) = einer der letzten Bausteine vor Launch.

---

## 1. ENTSCHEIDUNGEN (B1–B8)

| # | Entscheidung |
|---|---|
| B1 | **Fehler-Tracking:** Sentry (Free-Tier reicht lange) für Frontend UND Edge Functions. Jeder unbehandelte Fehler landet dort mit Kontext (function, org — NIE personenbezogene Inhalte/Mail-Texte ins Tracking). Alternativ gleichwertiges Tool — Entscheidung bei Diagnose, Abstraktion `lib/monitoring.ts`. |
| B2 | **Cron-Wächter (Dead-Man's-Switch):** Neue Tabelle `cron_runs` (job_name, started_at, finished_at, status, error, items_processed). JEDER Cron schreibt Start + Ende. Ein Watchdog-Cron (alle 15 Min) prüft: Hat jeder registrierte Job in seinem erwarteten Fenster erfolgreich gelaufen? (Erwartungs-Katalog in system_config: sequence_runner alle 5 Min, warmup täglich, briefing 07:00 …). Verletzung → Alarm (B3). **Der Watchdog selbst wird EXTERN überwacht:** kostenloser Uptime-Ping-Dienst ruft alle 15 Min einen Health-Endpoint — fällt Supabase/alles aus, meldet der externe Dienst. Ohne diese äußere Schicht überwacht sich das System nur selbst = blinder Fleck. |
| B3 | **Alarm-Kanal an EUCH:** Neue Tabelle `system_alerts` (severity: critical/warning/info, type, message, context, acknowledged_at). **In-App-Mitteilung ist der Pflichtkanal** (notify(), Kategorie System). Critical zusätzlich per E-Mail über den SYSTEM-Mail-Kanal (Masterplan Tabelle 1 — intern: kostenloser Dienst, Versand an die eigene Adresse; NIEMALS über User-/Kunden-Mailboxen, deren Reputation ist heilig). Ist der Mail-Kanal (noch) nicht eingerichtet: B-1 läuft In-App-only, dokumentierter Preis: Nacht-Ausfälle erst beim nächsten Öffnen sichtbar; Mail-Kanal wird spätestens in B-2 nachgezogen. Warning → In-App + Tages-Sammel-Mail (sofern Kanal aktiv). **Alarm-Regeln v1:** Cron ausgefallen · Bounce-/Spam-Rate-Spike über Schwelle · Mailbox automatisch pausiert · Webhook-Fehlerquote > X% · AI-Provider nicht erreichbar (nach Retries) · Queue-Stau (embedding_jobs/fällige Leads älter als Y) · Send-Gate-Verweigerungen häufen sich · Credit-/Kosten-Anomalie (Tagesverbrauch > Z× Durchschnitt — Runaway-Schutz). Alle Schwellen in system_config. |
| B4 | **System-Status-Seite:** Settings → System (nur Owner/Admin): letzte Läufe aller Crons (aus cron_runs), Queue-Längen, Mailbox-Gesundheit, offene Alerts mit Quittieren, Provider-Status. Ehrliche Zahlen, keine grünen Fake-Ampeln. |
| B5 | **Backups:** Supabase-Backups (PITR bzw. Daily je Plan) aktiv — prüfen, nicht annehmen. Plus: vierteljährlicher RESTORE-TEST (Backup in Wegwerf-Projekt einspielen, 5 Kern-Checks) — ein Backup, das nie zurückgespielt wurde, ist keins. Als wiederkehrender Termin dokumentiert. |
| B6 | **Staging, zweistufig:** Stufe 1 (JETZT, intern): Vercel-Preview pro Branch + bestehende Migrations-Disziplin genügt. Stufe 2 (PFLICHT vor erstem externen Kunden): zweites Supabase-Projekt als Staging-DB, Seed-Skript für realistische Testdaten, getrennte Secrets, Migrationen laufen IMMER zuerst dort. |
| B7 | **Runbooks:** docs/runbooks/ — kurze "Was tun wenn"-Anleitungen in einfacher Sprache für Oliver (Cron rot / Mailbox pausiert / Provider down / Restore nötig / Alarm quittieren). Claude Code schreibt sie beim jeweiligen Slice, Zielgruppe: Nicht-Programmierer. |
| B8 | **Timing verbindlich (zweistufig):** **Stufe MINIMAL (Slice B-1, PFLICHT vor AI-SDR-Slice-5, ~0,5 Session):** Cron-Wrapper + cron_runs (die Crons entstehen gerade sowieso — jetzt einbauen ist gratis, nachrüsten teuer) · Watchdog-Cron · Ausfall-/Fehler-Mail an Oliver über System-Mail-Kanal · AI-Provider-Check (B9). **Stufe VOLL (Slice B-2/B-3, als einer der LETZTEN Bausteine vor Launch):** Sentry-Feinausbau, Status-Seite, externer Uptime-Ping, system_alerts-UI mit Quittieren, Staging Stufe 2, Runbooks, Restore-Test, Alert-Kalibrierung. |
| B9 | **AI-/LLM-Überwachung (explizit):** Der zentrale aiCall()-Wrapper erfasst JEDEN AI-Aufruf: Fehler, Timeouts, Auth-Fehler (Key ungültig/abgelaufen), Quota-/Rate-Limit-Antworten, Latenz. Alarm-Regeln: (a) AI-Provider down oder Key ungültig → nach 3 Fehlversuchen in Folge CRITICAL-Mail ("Google AI nicht erreichbar — Mail-Generierung, Chat und Briefings betroffen") · (b) Fehlerquote eines Prompts > X% in 1h → Warning · (c) Latenz-Anomalie → Warning · (d) Embedding-Queue wächst statt zu schrumpfen → Warning. Zusätzlich täglicher Mini-Smoke-Test-Cron: 1 winziger Test-Call pro konfiguriertem Provider/Modell + 1 Test-Embedding — schlägt fehl → CRITICAL, BEVOR der erste User es merkt. Betroffene Features degradieren ehrlich (Fehler-Block/„AI derzeit nicht verfügbar", requires_human statt stiller Ausfall — nie so tun, als liefe alles). Gilt für ALLE konfigurierten LLM-Provider (Multi-LLM: jeder in settings hinterlegte Provider wird vom Smoke-Test abgedeckt). |

---

## 2. SLICES

### SLICE B-1 — MINIMAL-Überwachung (PFLICHT vor AI-SDR-Slice-5, ~0,5 Session)
Migration: cron_runs (+ system_alerts-Tabelle schlank, UI kommt später) · Cron-Wrapper-
Helper (Start/Ende/Fehler → cron_runs; EIN Helper, alle bestehenden + künftigen Crons
nutzen ihn) · Watchdog-Cron + Erwartungs-Katalog in system_config · **AI-Provider-
Überwachung (B9):** aiCall()-Fehlererfassung + täglicher Smoke-Test-Cron über alle
konfigurierten Provider + Embedding-Check · Critical-Mail an Oliver über System-Mail-
Kanal (transaktionaler Dienst, Key in Vault) + In-App-Mitteilung.
**Akzeptanz:** Cron absichtlich deaktiviert → binnen 15–30 Min Critical-Mail ·
Gemini-Key absichtlich ungültig gesetzt → nach Smoke-Test/3 Fehlversuchen Critical-Mail
mit Klartext, betroffene Features zeigen ehrlichen "AI nicht verfügbar"-Zustand statt
still zu scheitern · Alarm-Deduplizierung nachgewiesen (Dauerfehler = 1 Mail + Zähler,
nicht 200 Mails).
**Fallen:** Alarm-Müdigkeit ist der Tod jeder Überwachung — nur handlungsrelevante
Alerts, dedupliziert · System-Mails NIE über Nango/User-Mailboxen · keine Inhalte/PII
in Fehler-Logs · Smoke-Test-Calls minimal halten (wenige Token, zählt als System-
Verbrauch, nicht als User-Credits).

### SLICE B-2 — Ausbau (einer der LETZTEN Bausteine, mit/nach AI-SDR-Slice-12)
Sentry front+edge via lib/monitoring.ts (B1) · Status-Seite Settings → System (B4) ·
externer Uptime-Ping auf /health (B2-Außenschicht) · system_alerts-UI mit Quittieren ·
restliche Alarm-Regeln aus B3 (Bounce-Spike, Queue-Stau, Webhook-Quote, Kosten-Anomalie),
soweit nicht schon durch AI-SDR-Slices abgedeckt.

### SLICE B-3 — Launch-Härtung (Launch-Phase, mit Integrations-Endphase)
Staging Stufe 2 (zweites Supabase-Projekt, Seeds, getrennte Secrets, Migrationen immer
zuerst dort) · Runbooks komplett (B7) · Restore-Test #1 durchgeführt + protokolliert (B5) ·
**Security-Abschluss-Check (gebündelt, vor erstem externen Kunden):** Dependency-Audit
(npm audit + Supabase-Advisories) · Security-Header/CSP auf Vercel · RLS-Vollscan über
ALLE Tabellen (automatisiertes Skript: jede Tabelle gegen Fremd-Org-JWT testen) ·
Secrets-Inventur (nichts im Code/Repo) · Injection-Testkatalog erneut über alle
AI-Endpoints · öffentliche Endpoints härten (Unsubscribe, Webhooks: Rate-Limits +
Signaturen verifiziert) · Alert-Eskalation kalibrieren (was ist mit echten Kunden critical?).

---

## 3. GLOBALE REGEL (ab sofort, alle Baupläne)
Jeder neue Cron nutzt den Cron-Wrapper + Eintrag im Erwartungs-Katalog im selben PR.
Jede neue Edge Function nutzt captureError. Jeder neue kritische Pfad (Senden, Buchen,
Zahlen) definiert seinen Alarm-Fall. Ohne diese drei Punkte kein Merge — analog zur
Prompt-Regel C27.

---
*Sales OS · Betrieb & Überwachung v1.1 · Juli 2026 · B1–B9 final*
*Merksatz: Wir erfahren es zuerst — nie der Kunde.*
