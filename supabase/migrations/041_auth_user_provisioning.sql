-- 041_auth_user_provisioning.sql
-- [D21] Provisioning-Trigger: neue Supabase-Auth-Registrierung → public.users + Org.
--
-- Bei jedem INSERT in auth.users (Sign-up via Email+Passwort ODER Google/Microsoft SSO):
--   1. neue organization anlegen (erster User einer neuen Org)
--   2. public.users-Zeile anlegen (id = auth.uid), role = 'owner'
-- security definer → Trigger umgeht RLS (auth_org_id() ist beim Insert noch leer).
-- Idempotent: existiert die users-Zeile schon (z.B. erneutes Feuern), passiert nichts.
-- Demo-Org (00000000-0000-0000-0000-000000000001) wird NICHT angefasst.
--
-- Einladungs-Pfad (Migration invitations, später): kommt ein User per Einladung,
-- soll statt einer neuen Org die organization_id + role aus der Einladung übernommen
-- werden. Platzhalter unten markiert die Stelle — noch nicht aktiv.

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
begin
  -- Idempotenz: Zeile existiert bereits → nichts tun.
  if exists (select 1 from public.users where id = new.id) then
    return new;
  end if;

  -- ── Einladungs-Pfad (Platzhalter, später aktivieren) ──────────────────────
  -- if exists (select 1 from public.invitations where email = new.email
  --            and accepted_at is null and expires_at > now()) then
  --   → organization_id + role aus der Einladung übernehmen, KEINE neue Org,
  --     invitations.accepted_at = now() setzen, dann users-Insert mit der Org-Rolle.
  --   return new;
  -- end if;

  -- ── Neue Organisation (erste Registrierung = Owner) ───────────────────────
  v_org_name := coalesce(nullif(new.raw_user_meta_data->>'org_name', ''), 'Meine Organisation');

  -- Slug muss unique + not null sein (kein Default in organizations): aus dem Namen
  -- ableiten + kurzer eindeutiger Suffix → Kollision praktisch ausgeschlossen.
  v_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'org';
  end if;
  v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into organizations (name, slug, plan)
  values (v_org_name, v_slug, 'trial')
  returning id into v_org_id;

  -- ── public.users-Zeile (id = auth.uid) ────────────────────────────────────
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

-- Trigger neu setzen (idempotent).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
