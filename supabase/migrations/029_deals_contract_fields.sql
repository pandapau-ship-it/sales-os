-- 029_deals_contract_fields.sql
-- Drei neue Vertrags-/Forecast-Felder auf deals (Scheibe 1, reiner DB-Schritt).
--   term_months         → Laufzeit in Monaten
--   notice_period_days  → Kündigungsfrist in Tagen
--   expected_close_date → erwartetes Abschlussdatum (Forecast)
--     ≠ closed_at (tatsächlicher Abschluss) · ≠ end_date (Vertragsende/Churn).
-- ARR/MRR bekommen BEWUSST keine Spalten — werden später im Code aus value + term_months berechnet.
-- Additiv, nullable, KEIN Default, KEINE Datenänderung. RLS + Audit-Trigger unberührt
-- (rein additive Spalten auf bestehender Tabelle). Idempotent: ADD COLUMN IF NOT EXISTS.
--

alter table deals add column if not exists term_months         int;   -- Laufzeit in Monaten
alter table deals add column if not exists notice_period_days  int;   -- Kündigungsfrist in Tagen
alter table deals add column if not exists expected_close_date date;  -- erwartetes Abschlussdatum (Forecast)
