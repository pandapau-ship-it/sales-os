-- 018_signal_windows.sql
-- settings.signal_windows: Dringlichkeits-Window (Stunden) je signal_type, org-tunebar.
-- Top-level jsonb-Block analog settings.pipeline_stages. Reader: db.getSignalWindows().
-- Idempotent: ADD COLUMN IF NOT EXISTS + UPDATE der Demo-Org-Zeile (re-runnable).
-- Migration schreiben — `db push` macht der User.
--
-- Hinweis: settings trägt update_updated_at + audit_write-Trigger (010) → die UPDATE
-- bumpt updated_at und schreibt einen audit_log-Eintrag (gewollt).

alter table settings add column if not exists signal_windows jsonb default '[]';

update settings set signal_windows = '[
  {"signal_type": "linkedin_post_commented", "window_hours": 72},
  {"signal_type": "linkedin_post_liked",     "window_hours": 48},
  {"signal_type": "linkedin_profile_view",   "window_hours": 48},
  {"signal_type": "job_change",              "window_hours": 168},
  {"signal_type": "company_growth",          "window_hours": 168},
  {"signal_type": "funding_round",           "window_hours": 336},
  {"signal_type": "tech_change",             "window_hours": 168},
  {"signal_type": "custom",                  "window_hours": 48}
]'::jsonb
where organization_id = '00000000-0000-0000-0000-000000000001';
