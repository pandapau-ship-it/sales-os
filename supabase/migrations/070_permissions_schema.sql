-- 070_permissions_schema.sql
-- Settings SET-1 — Rechte-Fundament (Schema). Grundlage: docs/settings_bauplan_v1.md Abschnitt 2 + SET-1.
-- Zwei GLOBALE Katalog-Tabellen (Rollen-Matrix ist überall gleich → kein organization_id;
-- dokumentierte Ausnahme wie plans/billing_config → scripts/audit.ts GLOBAL_TABLES) +
-- Härtung der bestehenden per-Org-Tabelle user_permissions (007).

-- ── permission_catalog — Master-Liste gültiger Rechte (global, datengetrieben) ─
create table permission_catalog (
  permission  text primary key,
  description text not null
);
alter table permission_catalog enable row level security;
create policy "permission_catalog_read_all" on permission_catalog for select using (true);

insert into permission_catalog (permission, description) values
 ('rules.edit',              'Regeln/Actions/Schwellen/Automation-Defaults ändern'),
 ('campaigns.manage',        'Campaigns aktivieren/pausieren/verwalten'),
 ('templates.manage',        'Nachrichten-Templates verwalten'),
 ('pipeline.manage',         'Pipeline-Stages konfigurieren'),
 ('integrations.manage',     'Integrationen verbinden/trennen'),
 ('team.invite',             'Team-Mitglieder einladen/deaktivieren'),
 ('billing.approve_credits', 'Credit-Käufe freigeben'),
 ('billing.manage',          'Billing/Plan verwalten'),
 ('trash.purge',             'Endgültig löschen (Papierkorb leeren)'),
 ('export.all',              'Gesamt-Daten exportieren'),
 ('records.delete',          'Kontakte/Companies/Deals löschen (Soft-Delete)');

-- ── role_permissions — Rollen-Matrix (global, datengetrieben; neue Rolle/Recht = Daten) ─
create table role_permissions (
  role       text not null,   -- owner | admin | member | viewer (TEXT, kein enum → neue Rollen möglich)
  permission text not null references permission_catalog(permission) on delete cascade,
  primary key (role, permission)
);
alter table role_permissions enable row level security;
create policy "role_permissions_read_all" on role_permissions for select using (true);

-- Seed der Standard-Matrix (Spiegel src/lib/permissions.ts — keep in sync).
-- owner: ALLES.
insert into role_permissions (role, permission)
select 'owner', permission from permission_catalog;
-- admin: alles AUSSER billing.* (Owner-Sache).
insert into role_permissions (role, permission)
select 'admin', permission from permission_catalog where permission not like 'billing.%';
-- member: nur Export (arbeitet mit Daten, ändert keine Regeln/löscht keine Records).
insert into role_permissions (role, permission) values ('member', 'export.all');
-- viewer: keine erhöhten Rechte (nur lesen).

-- ── user_permissions härten (007): effect-Spalte (grant|deny) + UNIQUE + audit ─
-- effect ermöglicht SUBTRAKTION (einer Rolle ein Recht individuell ENTZIEHEN) — v1 nutzt nur 'grant',
-- die Tür bleibt offen (Guard rechnet deny > grant > Rolle).
alter table user_permissions add column if not exists effect text not null default 'grant';
alter table user_permissions add constraint user_permissions_effect_chk check (effect in ('grant', 'deny'));
-- ein Eintrag je (user, permission) — Grant ODER Deny, nie beides.
alter table user_permissions add constraint user_permissions_uq unique (user_id, permission);

-- Jede Rechteänderung protokollieren (audit_write aus 010, actor = auth.uid()).
drop trigger if exists trg_user_permissions_audit on user_permissions;
create trigger trg_user_permissions_audit
  after insert or update or delete on user_permissions
  for each row execute function audit_write();
