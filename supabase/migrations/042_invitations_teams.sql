-- 042_invitations_teams.sql
-- [D21] Scheibe 7: Team-Einladungen + Teams (gegenseitige Vertretung).
-- Multi-Tenant-Pflicht: organization_id + RLS (org_isolation) + ON DELETE CASCADE + Indizes.
-- Audit-Trigger auf invitations + teams (audit_write liest new.organization_id + new.id).

-- ── invitations — offene Team-Einladungen ────────────────────────────────────
create table if not exists invitations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  email            text not null,
  role             text not null default 'member',   -- owner | admin | member | viewer
  -- Token wird DB-seitig erzeugt (kein Service-Role im Client nötig). 64 hex-Zeichen.
  token            text unique not null
                     default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  invited_by       uuid references users(id) on delete set null,
  accepted_at      timestamptz,
  expires_at       timestamptz not null default now() + interval '7 days',
  created_at       timestamptz default now()
);
create index if not exists idx_invitations_org   on invitations(organization_id);
create index if not exists idx_invitations_email on invitations(lower(email));

-- ── teams — Teams innerhalb einer Org ────────────────────────────────────────
create table if not exists teams (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null,
  created_by       uuid references users(id) on delete set null,
  created_at       timestamptz default now()
);
create index if not exists idx_teams_org on teams(organization_id);

-- ── team_members — Zuordnung User ↔ Team ─────────────────────────────────────
create table if not exists team_members (
  team_id    uuid not null references teams(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  joined_at  timestamptz default now(),
  primary key (team_id, user_id)
);
create index if not exists idx_team_members_user on team_members(user_id);

-- ── RLS — Tenant-Isolation ───────────────────────────────────────────────────
alter table invitations enable row level security;
create policy "invitations_tenant_isolation" on invitations
  using (organization_id = auth_org_id());

alter table teams enable row level security;
create policy "teams_tenant_isolation" on teams
  using (organization_id = auth_org_id());

-- team_members hat selbst keine organization_id → über das zugehörige team scopen.
alter table team_members enable row level security;
create policy "team_members_tenant_isolation" on team_members
  using (exists (
    select 1 from teams t
    where t.id = team_members.team_id and t.organization_id = auth_org_id()
  ));

-- ── Audit-Trigger (invitations + teams; team_members hat kein id/organization_id) ─
create trigger trg_invitations_audit after insert or update or delete on invitations
  for each row execute function audit_write();
create trigger trg_teams_audit after insert or update or delete on teams
  for each row execute function audit_write();
