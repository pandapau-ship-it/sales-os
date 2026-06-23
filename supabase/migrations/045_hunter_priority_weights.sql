-- 045_hunter_priority_weights.sql
-- Dringlichkeits-Score Hunter-Übersicht: Gewichte in settings.thresholds.hunter_priority_weights.
-- Single Source aller Score-Werte (nie im Code hardcodiert; via AI-Chat/Settings änderbar).
-- Idempotent: jsonb_set überschreibt den Schlüssel bei jedem Lauf mit dem kanonischen Wert.

update settings
set thresholds = jsonb_set(
  thresholds,
  '{hunter_priority_weights}',
  '{
    "linkedin_signal": 40,
    "overdue_task": 35,
    "stagnated": 30,
    "going_cold": 25,
    "no_task": 20,
    "arr_high_threshold": 100000,
    "arr_mid_threshold": 50000,
    "arr_high_mult": 1.5,
    "arr_mid_mult": 1.2,
    "icp_high_threshold": 80,
    "icp_mid_threshold": 60,
    "icp_high_mult": 1.3,
    "icp_mid_mult": 1.1,
    "overdue_bonus_days": 3,
    "overdue_bonus_points": 10,
    "stagnated_double_bonus": 15,
    "signal_age_penalty_per_day": 5
  }'::jsonb,
  true  -- create_missing
)
where organization_id = '00000000-0000-0000-0000-000000000001';
