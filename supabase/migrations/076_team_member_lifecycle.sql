-- 076_team_member_lifecycle.sql
-- Settings SET-3 (Team & Rechte) — Backend. Mitglieder-Lebenszyklus + Einladungs-Dedup + Audit-Lücke.
--
-- Entscheidung A: KEIN Hard-Delete. „Entfernen" = weicher Status 'removed' (Zeile bleibt erhalten,
-- damit zugewiesene Kontakte/Deals/Tasks ihren Bezug behalten und die Historie lesbar bleibt).
-- Alle schreibenden Funktionen folgen dem SET-1-Muster: security definer · auth.uid() als Actor ·
-- Org-Scope · Recht `team.invite` (Katalog-Label: „Team einladen/deaktivieren") · audit_log.

-- ── Status-Spalte ────────────────────────────────────────────────────────────
alter table users add column if not exists status text not null default 'active';
alter table users add constraint users_status_chk check (status in ('active', 'deactivated', 'removed'));
create index if not exists idx_users_org_status on users (organization_id, status);

-- ── Hilfsfunktion: gemeinsame Guards für Mitglieder-Aktionen ─────────────────
-- Wirft bei jedem Verstoss. Gibt die Org des Actors zurueck.
create or replace function assert_member_action(p_target uuid, p_allow_self boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text; v_actor_org uuid; v_target_role text; v_target_org uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select role, organization_id into v_actor_role, v_actor_org from users where id = v_actor;
  select role, organization_id into v_target_role, v_target_org from users where id = p_target;
  if v_actor_org is null or v_target_org is null then raise exception 'unbekannter User'; end if;
  -- Cross-Org-Schutz (wie grant_permission)
  if v_actor_org <> v_target_org then raise exception 'fremde Organisation'; end if;
  if not has_permission(v_actor, 'team.invite') then raise exception 'Kein Recht (team.invite)'; end if;
  -- Lockout-Schutz: niemand kann sich selbst deaktivieren/entfernen
  if not p_allow_self and v_actor = p_target then
    raise exception 'Man kann sich nicht selbst deaktivieren oder entfernen';
  end if;
  -- Hierarchie: Admin fasst Owner nicht an
  if v_actor_role = 'admin' and v_target_role = 'owner' then
    raise exception 'Admin darf einen Owner nicht aendern';
  end if;
  return v_actor_org;
end;
$$;

-- ── Letzter-Owner-Schutz (gemeinsam für Rollenwechsel + Deaktivieren + Entfernen) ─
create or replace function assert_not_last_owner(p_target uuid, p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_target_role text; v_owner_count int;
begin
  select role into v_target_role from users where id = p_target;
  if v_target_role <> 'owner' then return; end if;
  select count(*) into v_owner_count from users
   where organization_id = p_org and role = 'owner' and status = 'active';
  if v_owner_count <= 1 then raise exception 'Der letzte Owner kann nicht deaktiviert oder entfernt werden'; end if;
end;
$$;

-- ── deactivate / reactivate / remove ─────────────────────────────────────────
create or replace function deactivate_member(p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid := assert_member_action(p_target);
begin
  perform assert_not_last_owner(p_target, v_org);
  update users set status = 'deactivated' where id = p_target;
  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, auth.uid(), 'deactivate_member', 'user', p_target, jsonb_build_object('status', 'deactivated'));
end;
$$;

create or replace function reactivate_member(p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid := assert_member_action(p_target);
begin
  update users set status = 'active' where id = p_target;
  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, auth.uid(), 'reactivate_member', 'user', p_target, jsonb_build_object('status', 'active'));
end;
$$;

-- Entfernen = weich (Entscheidung A). Kein delete: Zuordnungen/Historie bleiben intakt.
create or replace function remove_member(p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid := assert_member_action(p_target);
begin
  perform assert_not_last_owner(p_target, v_org);
  update users set status = 'removed' where id = p_target;
  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, auth.uid(), 'remove_member', 'user', p_target, jsonb_build_object('status', 'removed'));
end;
$$;

-- ── set_user_role: Letzter-Owner-Schutz vereinheitlichen + AUDIT ergänzen ────
-- (users hat keinen audit_write-Trigger → Rollenwechsel waren bisher NICHT protokolliert.)
create or replace function set_user_role(p_target uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text; v_actor_org uuid; v_target_role text; v_target_org uuid; v_owner_count int;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select role, organization_id into v_actor_role, v_actor_org from users where id = v_actor;
  select role, organization_id into v_target_role, v_target_org from users where id = p_target;
  if v_actor_org is null or v_target_org is null then raise exception 'unbekannter User'; end if;
  if v_actor_org <> v_target_org then raise exception 'fremde Organisation'; end if;
  if v_actor_role <> 'owner' then raise exception 'nur Owner darf Rollen aendern'; end if;
  if p_role not in ('owner', 'admin', 'member', 'viewer') then raise exception 'ungueltige Rolle'; end if;
  if v_target_role = 'owner' and p_role <> 'owner' then
    select count(*) into v_owner_count from users
     where organization_id = v_target_org and role = 'owner' and status = 'active';
    if v_owner_count <= 1 then raise exception 'Der letzte Owner kann nicht degradiert werden'; end if;
  end if;
  update users set role = p_role where id = p_target;
  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_actor_org, v_actor, 'set_user_role', 'user', p_target,
          jsonb_build_object('from', v_target_role, 'to', p_role));
end;
$$;

-- ── grant/revoke_permission: zusätzlicher personen-gescopter audit_log-Eintrag ─
-- Der Trigger auf user_permissions protokolliert die ZEILE (entity_id = row-id) — für die
-- Personen-Historie braucht es einen Eintrag mit entity_id = betroffener User.
create or replace function grant_permission(p_target uuid, p_permission text, p_effect text default 'grant')
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text; v_actor_org uuid; v_target_role text; v_target_org uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select role, organization_id into v_actor_role, v_actor_org from users where id = v_actor;
  select role, organization_id into v_target_role, v_target_org from users where id = p_target;
  if v_actor_org is null or v_target_org is null then raise exception 'unbekannter User'; end if;
  if v_actor_org <> v_target_org then raise exception 'Cross-Org-Rechtevergabe verweigert'; end if;
  if v_actor_role not in ('owner', 'admin') then raise exception 'kein Recht zur Rechtevergabe'; end if;
  if p_effect not in ('grant', 'deny') then raise exception 'ungueltiger effect'; end if;
  if not exists (select 1 from permission_catalog where permission = p_permission) then
    raise exception 'unbekanntes Recht: %', p_permission;
  end if;
  if v_actor_role = 'admin' then
    if p_permission like 'billing.%' then raise exception 'Admin darf billing-Rechte nicht vergeben'; end if;
    if v_target_role in ('owner', 'admin') then raise exception 'Admin darf Owner/Admins keine Einzelrechte geben'; end if;
  end if;
  insert into user_permissions (organization_id, user_id, permission, effect, granted_by)
  values (v_target_org, p_target, p_permission, p_effect, v_actor)
  on conflict (user_id, permission) do update set effect = excluded.effect, granted_by = excluded.granted_by;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_actor_org, v_actor, 'grant_permission', 'user', p_target,
          jsonb_build_object('permission', p_permission, 'effect', p_effect));
end;
$$;

create or replace function revoke_permission(p_target uuid, p_permission text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text; v_actor_org uuid; v_target_org uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select role, organization_id into v_actor_role, v_actor_org from users where id = v_actor;
  select organization_id into v_target_org from users where id = p_target;
  if v_actor_org is null or v_target_org is null then raise exception 'unbekannter User'; end if;
  if v_actor_org <> v_target_org then raise exception 'Cross-Org verweigert'; end if;
  if v_actor_role not in ('owner', 'admin') then raise exception 'kein Recht'; end if;
  delete from user_permissions where user_id = p_target and permission = p_permission;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_actor_org, v_actor, 'revoke_permission', 'user', p_target,
          jsonb_build_object('permission', p_permission));
end;
$$;

-- ── Einladung anlegen — server-erzwungen + Dedup ─────────────────────────────
-- Bisher schrieb der Client direkt in `invitations` (nur RLS, kein team.invite-Check, kein Dedup).
-- Rückgabe: 'created' | 'renewed' | 'already_member'.
create or replace function create_invitation(p_email text, p_role text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org uuid; v_email text := lower(trim(p_email)); v_existing uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'team.invite') then raise exception 'Kein Recht (team.invite)'; end if;
  if v_email = '' or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Ungueltige E-Mail-Adresse';
  end if;
  if p_role not in ('owner', 'admin', 'member', 'viewer') then raise exception 'ungueltige Rolle'; end if;

  -- Dedup 1: schon Mitglied dieser Org (aktiv oder deaktiviert)?
  if exists (select 1 from users where organization_id = v_org and lower(email) = v_email and status <> 'removed') then
    return 'already_member';
  end if;

  -- Dedup 2: offene Einladung vorhanden → erneuern statt Dublette anlegen.
  select id into v_existing from invitations
   where organization_id = v_org and lower(email) = v_email and accepted_at is null
   order by created_at desc limit 1;
  if v_existing is not null then
    update invitations set role = p_role, invited_by = v_actor, expires_at = now() + interval '7 days'
     where id = v_existing;
    return 'renewed';
  end if;

  insert into invitations (organization_id, email, role, invited_by) values (v_org, v_email, p_role, v_actor);
  return 'created';
end;
$$;

-- ── set_last_seen — „zuletzt aktiv"-Zeitstempel (vom Frontend pro Session gerufen) ─
create or replace function set_last_seen()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;   -- ohne Session: still nichts tun (kein Fehler)
  update users set last_seen_at = now() where id = auth.uid();
end;
$$;
