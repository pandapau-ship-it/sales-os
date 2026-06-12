-- 009_ai_chat_tables.sql
-- AI Chat: chat_sessions + chat_messages + custom_dashboards.
-- Maßgeblich: docs/sales_os_db_schema_v3.md
-- Hinweis: chat_messages hat KEINE organization_id — Tenant-Bezug via session_id.

-- ── chat_sessions ─────────────────────────────────────────────────────────────
create table chat_sessions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid references users(id) on delete set null,
  created_at       timestamptz default now()
);

-- ── chat_messages — gehört zur Session (org-Bezug indirekt) ──────────────────
create table chat_messages (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid references chat_sessions(id) on delete cascade,
  role               text,                    -- user | assistant
  content            jsonb,                   -- bei assistant: Array von Blöcken
  langfuse_trace_id  text,
  created_at         timestamptz default now()
);

-- ── custom_dashboards (v2/v3 — jetzt anlegen, Feature später) ────────────────
create table custom_dashboards (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid references users(id) on delete set null,
  name             text,
  layout           jsonb,                     -- [{widget_type, data_source, config, position}]
  is_shared        boolean,
  created_at       timestamptz default now()
);

create index idx_chat_sessions_org     on chat_sessions(organization_id);
create index idx_chat_messages_session on chat_messages(session_id);
create index idx_custom_dashboards_org on custom_dashboards(organization_id);
