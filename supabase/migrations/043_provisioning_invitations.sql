-- 043_provisioning_invitations.sql
-- [D21] Scheibe 7: handle_new_user() um den Einladungs-Pfad erweitern (ersetzt 041er Version).
--
-- Registriert sich ein User und es gibt eine offene, gültige Einladung für seine Email:
--   → organization_id + role aus der Einladung übernehmen (KEINE neue Org)
--   → invitations.accepted_at = now() setzen
-- Sonst wie 041: neue Org anlegen, erster User = Owner.
-- Idempotent, security definer. Trigger selbst (on_auth_user_created) bleibt aus 041 bestehen.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id   uuid;
  v_org_name text;
  v_slug     text;
  v_role     text;
  v_invite   uuid;
begin
  -- Idempotenz: Zeile existiert bereits → nichts tun.
  if exists (select 1 from public.users where id = new.id) then
    return new;
  end if;

  -- ── Einladungs-Pfad: offene, gültige Einladung für diese Email? ───────────
  select id, organization_id, role
    into v_invite, v_org_id, v_role
  from public.invitations
  where lower(email) = lower(new.email)
    and accepted_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if v_invite is not null then
    insert into public.users (id, organization_id, email, full_name, avatar_url, role)
    values (
      new.id,
      v_org_id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
      coalesce(v_role, 'member')
    )
    on conflict (id) do nothing;

    update public.invitations set accepted_at = now() where id = v_invite;
    return new;
  end if;

  -- ── Sonst: neue Organisation (erste Registrierung = Owner) ────────────────
  v_org_name := coalesce(nullif(new.raw_user_meta_data->>'org_name', ''), 'Meine Organisation');

  v_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'org';
  end if;
  v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into organizations (name, slug, plan)
  values (v_org_name, v_slug, 'trial')
  returning id into v_org_id;

  insert into public.users (id, organization_id, email, full_name, avatar_url, role)
  values (
    new.id,
    v_org_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    'owner'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
