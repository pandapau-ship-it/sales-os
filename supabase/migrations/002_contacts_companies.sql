-- 002_contacts_companies.sql
-- companies + contacts. companies zuerst (contacts referenziert companies).
-- Maßgeblich: docs/sales_os_db_schema_v3.md

-- ── companies ─────────────────────────────────────────────────────────────────
create table companies (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  name                 text not null,
  domain               text,
  industry             text,
  size_range           text,                  -- 1-10 | 11-50 | 51-200 | 201-500 | 500+
  country              text,
  city                 text,
  linkedin_url         text,
  website              text,
  crm_id               text,
  annual_revenue       bigint,
  tech_stack           text[],
  subscription_plan    text,                  -- Plan-Name wenn Kunde (z.B. 'growth')
  -- Enum: trial | active | churned (KEIN 'paused'). Anzeige DE: Trial / Aktiv / Gekündigt
  subscription_status  text check (subscription_status in ('trial', 'active', 'churned')),
  subscription_since   timestamptz,
  tags                 text[],
  notes                text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ── contacts ──────────────────────────────────────────────────────────────────
create table contacts (
  id                         uuid primary key default gen_random_uuid(),
  organization_id            uuid not null references organizations(id) on delete cascade,
  first_name                 text,
  last_name                  text,
  email                      text,
  linkedin_url               text,
  phone                      text,
  job_title                  text,
  seniority                  text,            -- C-Level | VP | Director | Manager | IC | Founder
  company_id                 uuid references companies(id) on delete set null,
  primary_company_id         uuid references companies(id) on delete set null, -- Cluster-Vererbung
  contact_status             text default 'ohne_campaign',
                             -- ohne_campaign | in_campaign | pipeline | kunde | archiviert | opt_out
  lead_source                text,            -- sherloq | csv_upload | crm_sync | manual | webhook_api
  icp_score                  int,             -- 0-100, optional
  heat_status                text,            -- heiss | warm | lauwarm | kalt | tot
  lead_status                text default 'lead',
                             -- lead | qualified_lead | mql | sql | customer | churned
  sherloq_contact_id         text,
  enrichment_sources         text[],
  tags                       text[],
  notes                      text,
  last_contacted_at          timestamptz,
  last_reply_at              timestamptz,
  opt_out_at                 timestamptz,
  opt_out_reason             text,
  automation_override        text,            -- manual | semi | auto | null (null = global Default)
  personality_profile        jsonb,           -- {style, decision, tempo} (3 Dimensionen, kein DISG)
  personality_confidence     int,             -- 0-100
  personality_sources        text[],          -- ['messages', 'sherloq']
  personality_updated_at     timestamptz,
  email_verified             boolean default null,  -- true | false | null (ungeprüft)
  email_verification_date    timestamptz,
  email_verification_source  text,            -- syntax | zerobounce | manual
  email_verification_status  text,            -- valid | invalid | catch-all | unknown | spamtrap
  email_suggestion           text,            -- did_you_mean Korrektur
  created_at                 timestamptz default now(),
  updated_at                 timestamptz default now()
);

create index idx_companies_org     on companies(organization_id);
create index idx_contacts_org      on contacts(organization_id);
create index idx_contacts_company  on contacts(company_id);
create index idx_contacts_heat     on contacts(organization_id, heat_status);
create index idx_contacts_status   on contacts(organization_id, contact_status);
