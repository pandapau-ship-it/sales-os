-- 004_messages_signals_deals.sql
-- signals + deals + messages. Danach Forward-FKs auf leads ergänzen.
-- Tabellenname: `deals` (kanonisch laut db_schema_v3 — NICHT 'pipeline_deals').
-- Maßgeblich: docs/sales_os_db_schema_v3.md

-- ── signals — eingehende Intent-Signale (Sherloq u.a.) ────────────────────────
create table signals (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  contact_id          uuid references contacts(id) on delete set null,  -- null wenn unbekannt
  company_id          uuid references companies(id) on delete set null,
  source              text default 'sherloq', -- sherloq | manual | webhook
  signal_type         text not null,
                      -- linkedin_profile_view | linkedin_post_liked | linkedin_post_commented |
                      --   job_change | company_growth | funding_round | tech_change | custom
  signal_data         jsonb,                  -- {source_url, detail, timestamp, raw_payload}
  sherloq_contact_id  text,
  sherloq_signal_id   text,                   -- Original-ID bei Sherloq
  routed_to           text,                   -- ai_sdr | hunter | farmer | unrouted
  processed_at        timestamptz,
  created_at          timestamptz default now()
);

-- ── deals — Pipeline-Deals (stage = Slug, Anzeige aus settings.pipeline_stages) ─
create table deals (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  contact_id          uuid references contacts(id) on delete set null,
  company_id          uuid references companies(id) on delete set null,
  name                text not null,
  -- SLUG (lowercase_underscore) = Speicherwert; Anzeigename aus settings.pipeline_stages[].name
  -- backlog | demo_vereinbart | followup_offen | onboarding_offen | free_trial | gewonnen | verloren
  stage               text default 'backlog',
  value               bigint,                 -- in Cent
  currency            text default 'EUR',
  probability         int default 10,         -- Win-% 0–100 (erbt Stage-Default, pro Deal überschreibbar)
  heat_status         text,                   -- heiss | warm | lauwarm | kalt | tot
  stagnation_days     int default 0,
  stage_updated_at    timestamptz,            -- wann Stage zuletzt geändert (für Stagnation)
  end_date            timestamptz,            -- Vertragsende (für Churn-Signal)
  owner_id            uuid references users(id) on delete set null,
  source_lead_id      uuid references leads(id) on delete set null,
  meeting_prep        jsonb,                  -- generiertes Meeting-Briefing
  next_action         text,
  next_action_due_at  timestamptz,
  closed_at           timestamptz,
  lost_reason         text,                   -- Pflicht bei stage = 'verloren' (App-seitig erzwungen)
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── messages — Kommunikation (outbound/inbound, alle Kanäle) ──────────────────
create table messages (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  lead_id              uuid references leads(id) on delete set null,
  contact_id           uuid references contacts(id) on delete set null,
  direction            text not null,         -- outbound | inbound
  channel              text not null,         -- email | linkedin | sms
  status               text default 'draft',
                       -- draft | scheduled | sent | delivered | opened | clicked |
                       --   replied | bounced_soft | bounced_hard | failed
  subject              text,                  -- nur Email
  body                 text not null,
  body_html            text,
  sent_at              timestamptz,
  opened_at            timestamptz,
  clicked_at           timestamptz,
  replied_at           timestamptz,
  bounce_type          text,                  -- soft | hard | null
  bounce_reason        text,
  error_message        text,
  provider_message_id  text,                  -- ID beim Sending Provider
  sequence_step        int,
  generated_by         text default 'ai',     -- ai | human
  approved_by          uuid references users(id) on delete set null,
  created_at           timestamptz default now()
);

-- Forward-FKs auf leads (signals + deals existieren jetzt)
alter table leads add constraint fk_leads_signal
  foreign key (sherloq_signal_id) references signals(id) on delete set null;
alter table leads add constraint fk_leads_deal
  foreign key (deal_id) references deals(id) on delete set null;

create index idx_deals_org      on deals(organization_id);
create index idx_deals_stage    on deals(organization_id, stage);
create index idx_signals_org    on signals(organization_id);
create index idx_signals_contact on signals(organization_id, contact_id);
create index idx_messages_org   on messages(organization_id);
create index idx_messages_lead  on messages(lead_id);
