-- 074_settings_set2_fixes.sql
-- SET-2 „Mein Profil"-Fixes: (1) booking_provider auf E3-Kanon korrigieren ('calcom' | 'external');
-- (2) get_profile_stats() — Zähl-Abfrage (eigene Kontakte + deren Companies) für die Profil-Statistik.

-- ── (1) update_my_profile: booking_provider-Whitelist auf E3 ('calcom' | 'external') ─────────────
-- E3 (ai_sdr_bauplan): 'calcom' = Cal.com · 'external' = beliebiger Link (HubSpot/Google/Outlook …).
-- Das AI-Studio-Design hatte fälschlich Calendly/Cal.com/Google Calendar — hier korrigiert.
create or replace function update_my_profile(p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_old   jsonb;
  k text;
  v_bp text := p_patch->>'booking_provider';
  v_bl text := p_patch->>'booking_link';
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;

  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('full_name','avatar_url','booking_provider','booking_link','signature') then
      raise exception 'Unbekannter Profil-Key: %', k;
    end if;
  end loop;

  if p_patch ? 'full_name' and length(coalesce(p_patch->>'full_name','')) > 200 then raise exception 'Name zu lang'; end if;
  if p_patch ? 'signature' and length(coalesce(p_patch->>'signature','')) > 2000 then raise exception 'Signatur zu lang'; end if;
  if v_bp is not null and v_bp <> '' and v_bp not in ('calcom','external') then
    raise exception 'Ungueltiger Booking-Provider';
  end if;
  if v_bl is not null and v_bl <> '' and v_bl !~* '^https?://' then raise exception 'Booking-Link muss eine URL sein'; end if;

  select jsonb_build_object('full_name', full_name, 'avatar_url', avatar_url,
                            'booking_provider', booking_provider, 'booking_link', booking_link,
                            'signature', signature)
    into v_old from users where id = v_actor;

  update users set
    full_name        = case when p_patch ? 'full_name'        then p_patch->>'full_name'        else full_name end,
    avatar_url       = case when p_patch ? 'avatar_url'       then p_patch->>'avatar_url'       else avatar_url end,
    booking_provider = case when p_patch ? 'booking_provider' then nullif(v_bp,'')              else booking_provider end,
    booking_link     = case when p_patch ? 'booking_link'     then nullif(v_bl,'')              else booking_link end,
    signature        = case when p_patch ? 'signature'        then nullif(p_patch->>'signature','') else signature end
  where id = v_actor;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_actor, 'update_my_profile', 'user', v_actor,
          jsonb_build_object('patch', p_patch, 'old', v_old));
end;
$$;

-- ── (2) get_profile_stats — eigene (assigned_to) Kontakte + deren distinct Companies ─────────────
-- Nutzt auth.uid() (eigene Zahlen), org-gescoped. Reine Zähl-Abfrage auf Bestehendem, keine neue Tabelle.
create or replace function get_profile_stats()
returns json language plpgsql security definer set search_path = public stable as $$
declare v_actor uuid := auth.uid(); v_org uuid;
begin
  if v_actor is null then return json_build_object('contacts', 0, 'companies', 0); end if;
  select organization_id into v_org from users where id = v_actor;
  return json_build_object(
    'contacts',  (select count(*) from contacts
                   where organization_id = v_org and assigned_to = v_actor and deleted_at is null),
    'companies', (select count(distinct company_id) from contacts
                   where organization_id = v_org and assigned_to = v_actor and deleted_at is null and company_id is not null)
  );
end;
$$;
