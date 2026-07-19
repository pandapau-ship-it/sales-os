-- 071_permissions_functions.sql
-- Settings SET-1 — serverseitiger Wächter als Postgres-Funktionen (EINE Quelle für UI, RPC, später Chat).
-- security definer + auth.uid() als Actor → nicht spoofbar. Org-Scoping in jeder schreibenden Funktion.

-- ── has_permission — deny > grant > Rolle (org-implizit über user_id) ─────────
create or replace function has_permission(p_user uuid, p_permission text)
returns boolean language sql security definer set search_path = public stable as $$
  select case
    when exists (select 1 from user_permissions where user_id = p_user and permission = p_permission and effect = 'deny')  then false
    when exists (select 1 from user_permissions where user_id = p_user and permission = p_permission and effect = 'grant') then true
    when exists (
      select 1 from users u join role_permissions rp on rp.role = u.role
      where u.id = p_user and rp.permission = p_permission
    ) then true
    else false
  end;
$$;

-- Effektive Rechte eines Users (Rollen ∪ grants − denies) — fürs UI-Caching (ein Aufruf pro Session).
-- Client-seitig: NUR eigene Rechte, oder (Andockpunkt SET-3-UI) Elevated in DERSELBEN Org fremde Rechte.
-- Kein Cross-Org-Leak (security definer umgeht RLS → Org-Check hier zwingend).
create or replace function effective_permissions(p_user uuid)
returns text[] language plpgsql security definer set search_path = public stable as $$
declare v_actor uuid := auth.uid(); v_actor_role text; v_actor_org uuid; v_target_org uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  if v_actor <> p_user then
    select role, organization_id into v_actor_role, v_actor_org from users where id = v_actor;
    select organization_id into v_target_org from users where id = p_user;
    if v_actor_org is null or v_target_org is null or v_actor_org <> v_target_org then
      raise exception 'fremde Organisation';
    end if;
    if v_actor_role not in ('owner', 'admin') then raise exception 'kein Recht'; end if;
  end if;
  return (
    select coalesce(array_agg(distinct perm), '{}')
    from (
      select rp.permission as perm from users u join role_permissions rp on rp.role = u.role where u.id = p_user
      union
      select up.permission from user_permissions up where up.user_id = p_user and up.effect = 'grant'
    ) s
    where perm not in (select permission from user_permissions where user_id = p_user and effect = 'deny')
  );
end;
$$;

-- ── grant_permission / revoke_permission — Actor = auth.uid(), Cross-Org-Schutz + audit (Trigger) ─
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
  -- Admin-Hierarchie (CLAUDE.md): kein billing.*, nicht an/über Owner/Admins.
  if v_actor_role = 'admin' then
    if p_permission like 'billing.%' then raise exception 'Admin darf billing-Rechte nicht vergeben'; end if;
    if v_target_role in ('owner', 'admin') then raise exception 'Admin darf Owner/Admins keine Einzelrechte geben'; end if;
  end if;
  insert into user_permissions (organization_id, user_id, permission, effect, granted_by)
  values (v_target_org, p_target, p_permission, p_effect, v_actor)
  on conflict (user_id, permission) do update set effect = excluded.effect, granted_by = excluded.granted_by;
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
end;
$$;

-- ── [D-delete-rights] geschlossen: Löschen server-erzwungen (records.delete) ──
create or replace function soft_delete_contacts(p_org uuid, p_ids uuid[])
returns int language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_n int;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  if (select organization_id from users where id = v_actor) is distinct from p_org then raise exception 'fremde Organisation'; end if;
  if not has_permission(v_actor, 'records.delete') then raise exception 'Kein Recht zum Loeschen (records.delete)'; end if;
  update contacts set deleted_at = now(), deleted_by = v_actor
   where organization_id = p_org and id = any(p_ids) and deleted_at is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

create or replace function soft_delete_companies(p_org uuid, p_ids uuid[])
returns int language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_n int;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  if (select organization_id from users where id = v_actor) is distinct from p_org then raise exception 'fremde Organisation'; end if;
  if not has_permission(v_actor, 'records.delete') then raise exception 'Kein Recht zum Loeschen (records.delete)'; end if;
  -- Kontakte entkoppeln (nicht mitlöschen), dann Companies soft-löschen (Muster wie db.ts).
  update contacts set company_id = null where organization_id = p_org and company_id = any(p_ids);
  update contacts set primary_company_id = null where organization_id = p_org and primary_company_id = any(p_ids);
  update companies set deleted_at = now(), deleted_by = v_actor
   where organization_id = p_org and id = any(p_ids) and deleted_at is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ── set_user_role — nur Owner, Cross-Org-Schutz, Letzter-Owner-Schutz ────────
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
  -- Letzter-Owner-Schutz.
  if v_target_role = 'owner' and p_role <> 'owner' then
    select count(*) into v_owner_count from users where organization_id = v_target_org and role = 'owner';
    if v_owner_count <= 1 then raise exception 'Der letzte Owner kann nicht degradiert werden'; end if;
  end if;
  update users set role = p_role where id = p_target;
end;
$$;
