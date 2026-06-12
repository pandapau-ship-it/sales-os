-- 001_organizations_users.sql
-- Sales OS · Phase 1 · Datenschicht
-- Basis-Tabellen: organizations (Tenant-Wurzel) + users.
-- Maßgeblich: docs/sales_os_db_schema_v3.md
-- Hinweis: NICHT ausführen (Phase 1 = nur schreiben/committen).

-- ── organizations — Tenant-Wurzel (hat selbst KEINE organization_id) ──────────
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,           -- z.B. "acme-corp" → Subdomain
  plan        text default 'trial',           -- trial | starter | pro | enterprise
  settings    jsonb default '{}',             -- globale Org-Settings
  branding    jsonb default '{}',             -- Whitelabel: Farben, Logos, Fonts
  created_at  timestamptz default now()
);

-- ── users — = Supabase Auth UID, jedem Tenant zugeordnet ──────────────────────
create table users (
  id               uuid primary key,          -- = auth.users.id (Supabase Auth UID)
  organization_id  uuid not null references organizations(id) on delete cascade,
  email            text unique not null,
  full_name        text,
  avatar_url       text,
  role             text default 'member',     -- owner | admin | member | viewer
  last_seen_at     timestamptz,
  created_at       timestamptz default now()
);

create index idx_users_org on users(organization_id);
