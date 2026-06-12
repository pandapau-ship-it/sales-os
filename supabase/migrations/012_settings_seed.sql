-- 012_settings_seed.sql
-- Seed für die Demo/Dev-Organization: settings = Single Source of Truth aller
-- entschiedenen Schwellenwerte. NICHTS hiervon im Frontend hardcodieren.
--
-- Kanonische Abweichungen vom Paket-Entwurf (Konflikt-Regel → kanonisch gewinnt):
--  • modules: kanonische useModules-Keys (core_crm, …) statt 'core'/'mein_tag'/…
--  • churn_risk: ZWEISCHICHTIG (basis + extended) statt altem flachen Punktesystem
--  • pipeline_stages: TOP-LEVEL-Spalte (nicht in thresholds verschachtelt)

-- Demo-Organization
insert into organizations (id, name, slug, plan) values (
  '00000000-0000-0000-0000-000000000001',
  'Demo Organization',
  'demo',
  'trial'
);

-- Settings (1 Zeile pro Org)
insert into settings (
  organization_id, modules, automation_defaults, thresholds, pipeline_stages, sending_defaults
) values (
  '00000000-0000-0000-0000-000000000001',

  -- modules — kanonische useModules-Keys (Trial: core_crm + ai_sdr + hunter aktiv)
  '{
    "core_crm": true,
    "ai_sdr": true,
    "hunter": true,
    "farmer": false,
    "enrichment": false,
    "email_verification": false,
    "sherloq_signals": false,
    "whitelabel": false,
    "ai_chat": false,
    "crm_sync": false
  }',

  -- automation_defaults
  '{
    "default_automation_level": "semi",
    "intent_threshold": 70,
    "reactivation_days": 90,
    "max_ai_adjustments_per_lead": 3,
    "followup_first_days": 3,
    "followup_second_days": 7,
    "max_auto_followups": 2,
    "answer_expected_default": true,
    "icp_score_threshold": 65,
    "onboarding_nudge_days": 3,
    "onboarding_task_days": 7,
    "trial_duration_days": 14,
    "trial_warning_first_days": 7,
    "trial_warning_second_days": 2,
    "trial_task_after_days": 1
  }',

  -- thresholds (OHNE pipeline_stages — die sind top-level)
  '{
    "heat_status": {
      "heiss_max_days": 3,
      "warm_max_days": 7,
      "lauwarm_max_days": 14,
      "kalt_max_days": 30,
      "tot_from_days": 31
    },
    "churn_risk": {
      "basis_weights": {
        "last_contact_over_30_days": 25,
        "no_reply_last_mail": 20,
        "overdue_tasks": 15,
        "no_activity_over_14_days": 20,
        "heat_cold_or_dead": 20
      },
      "extended_weights": {
        "last_login_over_30_days": 30,
        "usage_down_50_percent": 25,
        "open_support_tickets": 20,
        "contract_ends_60_days": 15,
        "cancellation_indicated": 30
      },
      "levels": { "low_max": 30, "medium_max": 60, "high_max": 85, "critical_from": 86 },
      "alert_from_level": "high"
    },
    "soft_bounce_retry": {
      "max_retries": 3,
      "delays_hours": [1, 4, 24]
    },
    "meeting_prep": {
      "touchpoints_count": 5
    },
    "mailbox_health": {
      "bounce_rate_alert_percent": 3,
      "bounce_rate_pause_percent": 5,
      "spam_rate_block_percent": 0.1
    },
    "mein_tag_top5_priorities": [
      {"rank": 1, "type": "requires_human",   "module": "ai_sdr"},
      {"rank": 2, "type": "churn_high",       "module": "farmer"},
      {"rank": 3, "type": "trial_expires_2d", "module": "farmer"},
      {"rank": 4, "type": "deal_stagnated",   "module": "hunter"},
      {"rank": 5, "type": "followup_overdue", "module": "hunter"}
    ]
  }',

  -- pipeline_stages (TOP-LEVEL) — Slug = Speicherwert, name = Anzeige
  '[
    {"slug": "backlog",          "name": "Backlog",          "order": 1, "stagnation_days": 7,    "probability": 10},
    {"slug": "demo_vereinbart",  "name": "Demo vereinbart",  "order": 2, "stagnation_days": 5,    "probability": 30},
    {"slug": "followup_offen",   "name": "Follow-up offen",  "order": 3, "stagnation_days": 3,    "probability": 50},
    {"slug": "onboarding_offen", "name": "Onboarding offen", "order": 4, "stagnation_days": 14,   "probability": 70},
    {"slug": "free_trial",       "name": "Free Trial",       "order": 5, "stagnation_days": 14,   "probability": 85},
    {"slug": "gewonnen",         "name": "Gewonnen",         "order": 6, "stagnation_days": null, "probability": 100},
    {"slug": "verloren",         "name": "Verloren",         "order": 7, "stagnation_days": null, "probability": 0}
  ]',

  -- sending_defaults — 50 Email/Tag, 20 LinkedIn/Tag, Mo-Fr 08-18, Warmup-Stufen
  '{
    "daily_email_limit": 50,
    "daily_linkedin_limit": 20,
    "sending_window": {
      "days": ["monday","tuesday","wednesday","thursday","friday"],
      "start_hour": 8,
      "end_hour": 18
    },
    "warmup_schema": [10, 20, 30, 40, 50]
  }'
);
