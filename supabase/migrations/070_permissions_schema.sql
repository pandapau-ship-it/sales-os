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

-- KATALOG-UMFANG v1 (Entscheidung 19.07.2026, Teil-D-Scan): NUR heute-existierende Features.
-- Zukünftige Rechte (rules.edit · campaigns.manage · templates.manage · pipeline.manage ·
-- integrations.manage · billing.manage · billing.approve_credits · trash.purge · export.all ·
-- audit.view · settings.manage · branding.manage · lists.share) entstehen MIT ihrem Modul —
-- Registry in PROGRESS.md „Rechte-Katalog — Zukunfts-Registry". Katalog nie auf Vorrat füllen.
insert into permission_catalog (permission, description) values
 ('team.invite',             'Team-Mitglieder einladen/deaktivieren'),
 ('records.delete',          'Kontakte/Companies/Deals löschen (Soft-Delete)'),
 ('records.merge',           'Duplikate zusammenführen (Kontakte/Companies)');

-- ── role_permissions — Rollen-Matrix (global, datengetrieben; neue Rolle/Recht = Daten) ─
create table role_permissions (
  role       text not null,   -- owner | admin | member | viewer (TEXT, kein enum → neue Rollen möglich)
  permission text not null references permission_catalog(permission) on delete cascade,
  primary key (role, permission)
);
alter table role_permissions enable row level security;
create policy "role_permissions_read_all" on role_permissions for select using (true);

-- Seed der Standard-Matrix (Spiegel src/lib/permissions.ts — keep in sync).
-- Alle drei v1-Rechte sind Admin-Ebene (Einladen/Löschen/Merge) → owner + admin; member/viewer: keine.
-- owner: ALLES.
insert into role_permissions (role, permission)
select 'owner', permission from permission_catalog;
-- admin: alles AUSSER billing.* (Owner-Sache; v1 enthält keine billing-Rechte → faktisch alle drei).
insert into role_permissions (role, permission)
select 'admin', permission from permission_catalog where permission not like 'billing.%';
-- member / viewer: keine erhöhten Rechte in v1 (Basis-CRUD läuft ohne Katalog-Recht; Export/Regeln
-- /Löschen sind entweder nicht gebaut oder Admin-Ebene). Erweitert sich mit den künftigen Modulen.

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
