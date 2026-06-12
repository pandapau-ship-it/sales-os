-- 007_new_tables_juni_2026.sql
-- Session Juni 2026: mailboxes, blacklisted_domains, churn_rules, upsell_rules,
-- user_permissions, daily_briefings + scheduled_tasks (neu, für Phase 3 AI Chat).
-- Maßgeblich: docs/sales_os_db_schema_v3.md + Phase-1-Paket.

-- ── mailboxes — Sending-Accounts inkl. Warmup/Health ─────────────────────────
create table mailboxes (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  provider             text,                  -- gmail | outlook
  email_address        text,
  status               text,                  -- active | warmup | paused | blocked
  warmup_phase         int,                   -- 1-5 (Tag-Bereich)
  current_daily_limit  int,                   -- aktuelles Limit (Warmup-abhängig)
  bounce_rate          numeric,               -- aktuelle Bounce Rate %
  spam_rate            numeric,
  created_at           timestamptz default now()
);

-- ── blacklisted_domains — GLOBAL (keine organization_id), org-übergreifend ────
create table blacklisted_domains (
  id          uuid primary key default gen_random_uuid(),
  domain      text unique not null,
  reason      text,                           -- disposable | spam | catch-all | manual
  created_at  timestamptz default now()
);

-- ── churn_rules (v2 — jetzt anlegen, Feature später) ─────────────────────────
create table churn_rules (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text,
  condition        jsonb,                     -- {field, operator, value}
  points           int,
  source           text,                      -- internal | sherloq | stripe
  is_active        boolean,
  created_by       uuid references users(id) on delete set null,
  created_at       timestamptz default now()
);

-- ── upsell_rules (v2 — jetzt anlegen, Feature später) ────────────────────────
create table upsell_rules (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text,
  condition        jsonb,
  points           int,
  source           text,
  is_active        boolean,
  created_by       uuid references users(id) on delete set null,
  created_at       timestamptz default now()
);

-- ── user_permissions — individuelle additive Rechte-Überschreibung (nur Owner) ─
create table user_permissions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid references users(id) on delete cascade,
  permission       text,                      -- z.B. 'automation_rules.edit'
  granted_by       uuid references users(id) on delete set null,  -- muss owner sein
  created_at       timestamptz default now()
);

-- ── daily_briefings — Mein Tag Top-5 (täglich generiert) ─────────────────────
create table daily_briefings (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid references users(id) on delete cascade,
  priorities       jsonb,                     -- [{type, contact_id, signal, reason, cta}]
  generated_at     timestamptz default now()
);

-- ── scheduled_tasks — wiederkehrende AI-Routinen (Phase 3 AI Chat) ───────────
create table scheduled_tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid references users(id) on delete set null,
  task_type        text not null,             -- briefing | blogpost | email_check | custom
  cron_expression  text,                      -- z.B. '0 8 * * 1-5' (Mo-Fr 08:00)
  prompt           text,                      -- was der User eingegeben hat
  output_channel   text[],                    -- ['email', 'in_app', 'slack']
  is_active        boolean default true,
  last_run_at      timestamptz,
  next_run_at      timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index idx_mailboxes_org        on mailboxes(organization_id);
create index idx_churn_rules_org      on churn_rules(organization_id);
create index idx_upsell_rules_org     on upsell_rules(organization_id);
create index idx_user_permissions_org on user_permissions(organization_id);
create index idx_daily_briefings_org  on daily_briefings(organization_id);
create index idx_scheduled_tasks_org  on scheduled_tasks(organization_id);
create index idx_scheduled_tasks_next on scheduled_tasks(next_run_at) where is_active = true;
