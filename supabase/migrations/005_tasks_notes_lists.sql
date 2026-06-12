-- 005_tasks_notes_lists.sql
-- tasks + notes + lists. Maßgeblich: docs/sales_os_db_schema_v3.md

-- ── tasks ─────────────────────────────────────────────────────────────────────
create table tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  contact_id       uuid references contacts(id) on delete set null,
  deal_id          uuid references deals(id) on delete set null,
  assigned_to      uuid references users(id) on delete set null,
  title            text not null,
  description      text,
  due_at           timestamptz,
  completed_at     timestamptz,
  priority         text default 'medium',     -- low | medium | high
  source           text,                      -- ai | manual | crm_sync
  created_at       timestamptz default now()
);

-- ── notes ─────────────────────────────────────────────────────────────────────
create table notes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  contact_id       uuid references contacts(id) on delete set null,
  company_id       uuid references companies(id) on delete set null,
  deal_id          uuid references deals(id) on delete set null,
  created_by       uuid references users(id) on delete set null,
  content          text not null,
  created_at       timestamptz default now()
);

-- ── lists — statisch (contact_ids) oder dynamisch (filter_config) ─────────────
create table lists (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null,
  type             text default 'static',     -- static | dynamic
  filter_config    jsonb,                     -- bei dynamic: Filterregeln
  contact_ids      uuid[],                    -- bei static: manuell gepflegte Liste
  is_team_list     boolean default false,
  created_by       uuid references users(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index idx_tasks_org     on tasks(organization_id);
create index idx_tasks_contact on tasks(contact_id);
create index idx_tasks_deal    on tasks(deal_id);
create index idx_notes_org     on notes(organization_id);
create index idx_lists_org     on lists(organization_id);
