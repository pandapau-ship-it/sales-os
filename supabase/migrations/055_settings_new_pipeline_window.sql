-- 055_settings_new_pipeline_window.sql
-- [D51] Konfigurierbarkeit-als-Architektur: das „Neu in Pipeline"-Zeitfenster (vorher Literal
-- `period === "7d" ? 7 : 30` in hunterMappers) wird konfigurierbar — als zwei Keys im bestehenden
-- settings.thresholds.timing_windows (Single Source mit den Farmer-Zeitfenstern, Migration 054).
-- Frontend (ScreenHunting → newPipelineInPeriod) liest sie zur Laufzeit; Code-Literale 7/30 bleiben
-- nur als Per-Key-Fallback.
--
-- Idempotent: jsonb_set merged die zwei neuen Keys IN das vorhandene timing_windows-Objekt (coalesce
-- für den Fall, dass es fehlt), ohne last_contact_days/inactive_days/recent_contact_days zu verlieren.
-- trg_settings_audit (010) loggt den Write.

update settings
set thresholds = jsonb_set(
  thresholds,
  '{timing_windows}',
  coalesce(thresholds->'timing_windows', '{}'::jsonb) || '{
    "new_pipeline_short_days": 7,
    "new_pipeline_long_days": 30
  }'::jsonb,
  true
),
    updated_at = now();
