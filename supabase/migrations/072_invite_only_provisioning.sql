-- 072_invite_only_provisioning.sql
-- [D21] Login-Pflicht, Entscheidung B: INVITE-ONLY. handle_new_user() legt bei einem neuen
-- Auth-User OHNE gültige Einladung KEINE neue Organisation + keinen Owner mehr an (ersetzt 043).
--
-- Verhalten:
--   • Gültige Einladung für die Email → wie bisher: users-Row mit org+role aus der Einladung,
--     invitation.accepted_at setzen.
--   • KEINE Einladung → No-op (keine Org, keine users-Row). Der Auth-User existiert dann zwar
--     (Session vorhanden), ist aber keiner Org zugeordnet → die App zeigt das ProvisioningGate
--     („Zugang nur auf Einladung"), inkl. Logout. So entsteht KEINE automatische Org-Anlage.
--
-- Neue Organisationen entstehen künftig über den kontrollierten Onboarding-Flow (deferred, [O]),
-- nicht über Self-Signup. Trigger on_auth_user_created (041) bleibt bestehen.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role   text;
  v_invite uuid;
begin
  -- Idempotenz: Zeile existiert bereits → nichts tun.
  if exists (select 1 from public.users where id = new.id) then
    return new;
  end if;

  -- Einladungs-Pfad: offene, gültige Einladung für diese Email?
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

  -- INVITE-ONLY: keine Einladung → KEINE Org/User anlegen. App gated per ProvisioningGate.
  return new;
end;
$$;
