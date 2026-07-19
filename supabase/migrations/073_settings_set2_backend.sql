-- 073_settings_set2_backend.sql
-- Settings SET-2 — NUR Backend/Datengrundlage (keine UI). Deckt „Allgemein" + „Mein Profil" ab.
-- „Ansicht" nutzt bestehendes user_preferences (057), „Sicherheit" bestehendes lib/auth (updatePassword).
-- Fallen (Bauplan §7): zentrale validierte Update-Functions + audit_log; nie rohes settings-JSONB aus UI.

-- ── Allgemein: settings.general (Sprache/Zeitzone/Datumsformat/Währung); Org-Name+Logo bleiben org-seitig ─
alter table settings add column if not exists general jsonb not null default '{}';

-- Defaults in bestehende Org-Settings seeden, ohne vorhandene Keys zu überschreiben (Default || Ist).
update settings
   set general = '{"language":"de","timezone":"Europe/Berlin","date_format":"DD.MM.YYYY","currency":"EUR"}'::jsonb
                 || coalesce(general, '{}'::jsonb);

-- ── Mein Profil: neue per-User-Felder (Booking-Quelle E3, Signatur). Voice = deferred (SET-KB-2). ─
alter table users add column if not exists booking_provider text;  -- calendly | cal_com | google_calendar
alter table users add column if not exists booking_link     text;
alter table users add column if not exists signature        text;

-- ── Neues Recht (SET-1-Katalog erweitern): Workspace/Allgemein-Einstellungen ändern (owner+admin) ─
insert into permission_catalog (permission, description)
values ('settings.manage', 'Workspace-/Allgemein-Einstellungen ändern (Sprache/Zeitzone/Logo/Org-Name)')
on conflict (permission) do nothing;
insert into role_permissions (role, permission)
  select 'owner', 'settings.manage' on conflict do nothing;
insert into role_permissions (role, permission)
  select 'admin', 'settings.manage' on conflict do nothing;

-- ── update_general_settings — validiert, org-gescoped, Recht settings.manage, audit_log ──────────
-- p_patch: beliebige Teilmenge aus {name, logo_url, language, timezone, date_format, currency}.
create or replace function update_general_settings(p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_name  text := p_patch->>'name';
  v_logo  text := p_patch->>'logo_url';
  v_gpatch jsonb := '{}'::jsonb;
  v_old   jsonb;
  k text;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'settings.manage') then raise exception 'Kein Recht (settings.manage)'; end if;

  -- Nur bekannte Keys zulassen (unbekannte → Fehler, kein stilles Schlucken).
  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('name','logo_url','language','timezone','date_format','currency') then
      raise exception 'Unbekannter Einstellungs-Key: %', k;
    end if;
  end loop;

  -- Validierung der Allgemein-Werte (Whitelist).
  if p_patch ? 'language'    and (p_patch->>'language')    not in ('de','en','es') then raise exception 'Ungueltige Sprache'; end if;
  if p_patch ? 'currency'    and (p_patch->>'currency')    not in ('EUR','USD','GBP','CHF') then raise exception 'Ungueltige Waehrung'; end if;
  if p_patch ? 'date_format' and (p_patch->>'date_format') not in ('DD.MM.YYYY','MM/DD/YYYY','YYYY-MM-DD') then raise exception 'Ungueltiges Datumsformat'; end if;
  if p_patch ? 'timezone'    and length(trim(coalesce(p_patch->>'timezone',''))) = 0 then raise exception 'Zeitzone leer'; end if;
  if p_patch ? 'name'        and length(trim(coalesce(v_name,''))) = 0 then raise exception 'Org-Name leer'; end if;

  -- general-Teil (Sprache/Zeitzone/Datumsformat/Währung) zusammenstellen.
  for k in select unnest(array['language','timezone','date_format','currency']) loop
    if p_patch ? k then v_gpatch := v_gpatch || jsonb_build_object(k, p_patch->>k); end if;
  end loop;

  -- Alt-Zustand fürs Audit.
  select jsonb_build_object('general', s.general, 'name', o.name, 'branding', o.branding)
    into v_old
  from organizations o left join settings s on s.organization_id = o.id
  where o.id = v_org;

  -- Anwenden: general (upsert, falls settings-Row fehlt) …
  if v_gpatch <> '{}'::jsonb then
    update settings set general = coalesce(general,'{}'::jsonb) || v_gpatch, updated_at = now()
     where organization_id = v_org;
    if not found then insert into settings (organization_id, general) values (v_org, v_gpatch); end if;
  end if;
  -- … Org-Name + Logo (Logo in branding.logo_url).
  if v_name is not null then update organizations set name = trim(v_name) where id = v_org; end if;
  if p_patch ? 'logo_url' then
    update organizations set branding = coalesce(branding,'{}'::jsonb) || jsonb_build_object('logo_url', v_logo) where id = v_org;
  end if;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_actor, 'update_general_settings', 'settings', v_org,
          jsonb_build_object('patch', p_patch, 'old', v_old));
end;
$$;

-- ── update_my_profile — eigener Datensatz (auth.uid()), validiert, audit_log ─────────────────────
-- p_patch: Teilmenge aus {full_name, avatar_url, booking_provider, booking_link, signature}.
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
  if v_bp is not null and v_bp <> '' and v_bp not in ('calendly','cal_com','google_calendar') then
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
