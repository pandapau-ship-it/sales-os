-- 003_campaigns_sequences_leads.sql
-- campaigns → sequences → leads (in dieser Reihenfolge wegen FKs).
-- Maßgeblich: docs/sales_os_db_schema_v3.md

-- ── campaigns ─────────────────────────────────────────────────────────────────
create table campaigns (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  name              text not null,
  status            text default 'draft',     -- draft | active | paused | archived
  automation_level  text default 'semi',      -- manual | semi | auto
  intent_threshold  int default 70,           -- Confidence % ab dem AI handelt
  -- Targeting
  icp_filter        jsonb,                    -- {roles, industries, sizes, regions, min_icp_score}
  exclusions        jsonb,                    -- {customer_ids, deal_ids, domains}
  -- Lead Source
  lead_sources      text[],                   -- ['sherloq', 'csv', 'webhook', 'crm']
  -- Pitch
  pitch             jsonb,                    -- {product, main_pain, secondary_pain, value_prop, proof_points[], cta}
  -- Messaging Brief
  messaging_brief   jsonb,                    -- {tone, length, personalization_depth, forbidden_words[], sample_message}
  -- Sender Config
  sender_config     jsonb,                    -- {mailbox_id, linkedin_account_id, daily_*_limit, sending_window}
  -- Approval Rules
  approval_rules    jsonb,                    -- {require_approval_first_touch, _followup, _booking}
  created_by        uuid references users(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── sequences ─────────────────────────────────────────────────────────────────
create table sequences (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  campaign_id          uuid references campaigns(id) on delete cascade,
  name                 text,
  steps                jsonb not null,        -- [{step_number, channel, delay_days, template_id, fallback_channel}]
  max_steps            int default 5,
  followup_delay_days  int default 3,
  reactivation_days    int default 90,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ── leads — laufende Sequenz-Instanz pro Kontakt ──────────────────────────────
create table leads (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references organizations(id) on delete cascade,
  contact_id             uuid references contacts(id) on delete cascade,
  campaign_id            uuid references campaigns(id) on delete set null,
  sequence_id            uuid references sequences(id) on delete set null,

  sequence_step_current  int default 1,
  sequence_status        text default 'active',
                         -- active | paused | requires_human | completed | opted_out | bounced
  requires_human_reason  text,
                         -- reply_low_confidence | opt_out | bounce_hard | bounce_soft |
                         --   contact_data_missing | pipeline_suggestion | manual

  scheduled_at           timestamptz,         -- nächster fälliger Step-Zeitpunkt (wichtigster Index)
  last_step_sent_at      timestamptz,
  last_reply_at          timestamptz,
  last_open_at           timestamptz,
  open_count             int default 0,
  click_count            int default 0,

  intent_label           text,                -- interested | objection | not_now | opt_out | unclear
  intent_confidence      int,                 -- 0-100

  sherloq_signal_id      uuid,                -- FK → signals (in 004 ergänzt; Forward-Ref)
  ai_adjustments         jsonb default '[]',  -- Log aller AI-Anpassungen mit Begründung

  pipeline_stage         text,                -- null wenn kein Deal
  deal_id                uuid,                -- FK → deals (in 004 ergänzt; Forward-Ref)

  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create index idx_campaigns_org    on campaigns(organization_id);
create index idx_sequences_org    on sequences(organization_id);
create index idx_leads_org        on leads(organization_id);
create index idx_leads_contact    on leads(contact_id);
-- scheduled_at: wichtigster Index — sequence_runner liest fällige Steps alle 5 Min
create index idx_leads_scheduled  on leads(organization_id, scheduled_at);
create index idx_leads_status     on leads(organization_id, sequence_status);
