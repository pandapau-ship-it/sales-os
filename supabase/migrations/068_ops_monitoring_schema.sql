-- 068_ops_monitoring_schema.sql
-- Betrieb & Überwachung B-1 (docs/betrieb_ueberwachung_bauplan_v1.md) — Schema.
-- Drei GLOBALE Tabellen (system-weit, KEIN organization_id — Betrieb betrifft uns/die Infrastruktur,
-- nicht eine Kunden-Org; dokumentierte Ausnahme wie plans/billing_config → scripts/audit.ts GLOBAL_TABLES).
--
-- ERWARTUNGS-KATALOG (Design-Entscheidung, Punkt 7): eigene Tabelle `cron_expectations` (job_name PK)
-- statt globalem JSONB — query-freundlich für den Watchdog-Join, und ein neuer Cron registriert sich
-- mit EINEM INSERT (Daten, kein Code; [D51]-Prinzip). Enthält zugleich die Klartext-Template-Felder
-- (WAS/Vermutung/Bedeutung, Bauplan E) — der Watchdog (DB) braucht sie zur Laufzeit; TS-Spiegel für
-- UI/Tests liegt in src/lib/alertTemplates.ts (keep in sync).

-- ── cron_runs — Roh-Telemetrie pro Cron-Lauf (Watchdog-Basis, B2) ─────────────
create table cron_runs (
  id              uuid primary key default gen_random_uuid(),
  job_name        text not null,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  status          text not null default 'running',  -- running | success | failed
  error           text,
  items_processed int,
  created_at      timestamptz not null default now()
);
-- Indizes (Skalierung, Punkt 3): letzter Lauf je Job (Watchdog) + Fehler-Filter.
create index idx_cron_runs_job on cron_runs (job_name, started_at desc);
create index idx_cron_runs_status on cron_runs (status);

alter table cron_runs enable row level security;
create policy "cron_runs_read_all" on cron_runs for select using (true); -- global, Write nur service_role

-- ── system_alerts — abgeleitete Betriebs-Alarme an UNS (B3), schlank ──────────
create table system_alerts (
  id              uuid primary key default gen_random_uuid(),
  severity        text not null,                    -- critical | warning | info (TEXT, kein enum)
  type            text not null,                    -- cron_failed | ... (erweiterbar als Daten)
  message         text not null,                    -- Klartext (WAS/Vermutung/Bedeutung, gebündelt)
  context         jsonb,                            -- z.B. { jobs: [...] }
  acknowledged_at timestamptz,
  created_at      timestamptz not null default now()
);
-- Offene (unquittierte) Alarme schnell finden (Status-Seite B-4 + Watchdog-Upsert).
create index idx_system_alerts_open on system_alerts (type, created_at desc) where acknowledged_at is null;

alter table system_alerts enable row level security;
create policy "system_alerts_read_all" on system_alerts for select using (true); -- global, Write nur service_role

-- ── cron_expectations — Erwartungs-Katalog + Klartext-Templates ───────────────
create table cron_expectations (
  job_name             text primary key,
  max_interval_minutes int not null,               -- Job muss binnen dieses Fensters erfolgreich gelaufen sein
  is_active            boolean not null default true,
  alert_what           text not null,              -- Bauplan E: WAS ist betroffen (Klartext)
  alert_hypothesis     text not null,              -- Bauplan E: Vermutung, woran es liegt
  alert_meaning        text not null               -- Bauplan E: Bedeutung für Betrieb/Nutzer
);

alter table cron_expectations enable row level security;
create policy "cron_expectations_read_all" on cron_expectations for select using (true); -- global

-- Seed: die 6 bestehenden Crons (alle täglich → 26h-Fenster, großzügig gegen Deploy-/Zeitzonen-Lag).
-- Klartext gespiegelt in src/lib/alertTemplates.ts.
insert into cron_expectations (job_name, max_interval_minutes, alert_what, alert_hypothesis, alert_meaning) values
 ('score-deal-health-daily', 1560,
  'Der tägliche Deal-Gesundheits-Check (Stagnations-Erkennung) ist nicht durchgelaufen.',
  'Möglicherweise war die Datenbank kurz nicht erreichbar oder ein Zugangsschlüssel ist abgelaufen.',
  'Stagnations-Hinweise auf Deals könnten heute veraltet sein, bis der nächste Lauf erfolgreich ist.'),
 ('score-heat-status-daily', 1560,
  'Die tägliche Heat-Status-Berechnung der Kontakte ist nicht durchgelaufen.',
  'Wahrscheinlich ein kurzer Ausfall der Datenbank oder ein abgelaufener Zugangsschlüssel.',
  'Die Heat-Anzeigen (Engaged/Warm/Cold …) könnten veraltet sein, bis der nächste Lauf klappt.'),
 ('score-churn-risk-daily', 1560,
  'Die tägliche Churn-Risiko-Berechnung der Bestandskunden ist nicht durchgelaufen.',
  'Möglicherweise ein kurzer Datenbank-Ausfall oder ein Zugangsproblem.',
  'Churn-Warnungen im Farmer könnten veraltet sein, bis der nächste Lauf erfolgreich ist.'),
 ('score-upsell-daily', 1560,
  'Die tägliche Upsell-Potenzial-Berechnung ist nicht durchgelaufen.',
  'Vermutlich ein kurzer Datenbank- oder Zugangs-Aussetzer.',
  'Upsell-Hinweise im Farmer könnten veraltet sein, bis der nächste Lauf klappt.'),
 ('credit-monthly-reset', 1560,
  'Der tägliche Wächter für den Credit-Verbrauchs-Reset ist nicht durchgelaufen.',
  'Kurzer Datenbank-Ausfall oder ein Zugangsproblem.',
  'Am Monatswechsel könnten die Credit-Zähler nicht korrekt auf 0 zurückgesetzt werden.'),
 ('notifications-cleanup', 1560,
  'Das tägliche Aufräumen alter Mitteilungen und Aktivitäten ist nicht durchgelaufen.',
  'Kurzer Datenbank-Ausfall oder ein Zugangsproblem.',
  'Alte Mitteilungen sammeln sich vorübergehend an — unkritisch, wird beim nächsten Lauf nachgeholt.');
