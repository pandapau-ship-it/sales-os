-- 006_automation_rules_settings.sql
-- automation_rules + sequence_rules + settings + audit_log.
-- Maßgeblich: docs/sales_os_db_schema_v3.md

-- ── automation_rules — globaler Risk-Level-Override pro Org ───────────────────
create table automation_rules (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  risk_level           text not null,         -- low | medium | high
  action_type          text not null,
                       -- connection_request | first_touch | followup | reply | inmail |
                       --   booking_link | lead_to_deal | confirm_meeting | cancel_meeting |
                       --   crm_overwrite | opt_out | delete | escalation
  is_auto_allowed      boolean not null,
  confidence_threshold int,                   -- null bei low/high, relevant bei medium
  created_at           timestamptz default now()
);

-- ── sequence_rules — dynamische Anpassungs-Regeln ────────────────────────────
create table sequence_rules (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text,
  trigger_signal   text,
                   -- mail_opened_twice | mail_opened_three_times | linkedin_seen_no_reply |
                   --   no_open_two_mails | post_reaction
  action           jsonb,                     -- {type: 'adjust_text'|'change_channel'|'ab_subject', params}
  is_active        boolean default true,
  created_at       timestamptz default now()
);

-- ── settings — 1 Zeile pro Org (Single Source of Truth aller Schwellenwerte) ──
create table settings (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null unique references organizations(id) on delete cascade,
  modules              jsonb default '{}',    -- {core_crm, ai_sdr, hunter, farmer, ...}
  automation_defaults  jsonb default '{}',    -- {default_automation_level, intent_threshold, ...}
  thresholds           jsonb default '{}',    -- {heat_status, churn_risk, soft_bounce_retry, ...}
  pipeline_stages      jsonb default '[]',    -- TOP-LEVEL: [{slug, name, order, stagnation_days, probability}]
  sending_defaults     jsonb default '{}',    -- {daily_email_limit, daily_linkedin_limit, sending_window}
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ── audit_log — read-only, jeder kritische Write landet hier (via Trigger) ────
create table audit_log (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid references users(id) on delete set null,  -- null bei AI-Aktionen
  action           text not null,             -- opt_out_confirmed | deal_created | ...
  entity_type      text,                      -- contact | lead | deal | campaign | ...
  entity_id        uuid,
  metadata         jsonb,
  created_at       timestamptz default now()
);

create index idx_automation_rules_org on automation_rules(organization_id);
create index idx_sequence_rules_org   on sequence_rules(organization_id);
create index idx_settings_org         on settings(organization_id);
create index idx_audit_log_org        on audit_log(organization_id);
create index idx_audit_log_entity     on audit_log(organization_id, entity_type, entity_id);
