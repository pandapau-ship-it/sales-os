-- 082_mein_unternehmen_icps_personas_rpcs.sql
-- „Mein Unternehmen" SLICE 3b-2/3 — Schreibwege für org_icps/org_personas (Migr. 081).
-- Nach dem products-Muster (077): je Objekt genau EIN validierter Schreibweg, security definer.
--   create_icp() / update_icp(id,patch) / delete_icp(id) — WEICH (is_active=false, wie delete_product)
--   create_persona(icp_id) / update_persona(id,patch) / delete_persona(id) — WEICH
-- Garantien je Schreibweg: settings.manage · Cross-Org-Guard (RLS greift bei security definer NICHT) ·
-- Key-Whitelist (unbekannt → Fehler) · Listen-Items müssen `id` tragen · field_meta[<feld>]=
-- {source:manual,locked:true} als Scan-Schutz (wie org_profile) · audit_log.
-- Die zulässigen Enum-Werte (fit_level/buying_role) bleiben die CHECKs aus 081 (Single Source) —
-- hier NICHT dupliziert; '' wird zu NULL gemappt (Leeren erlaubt).

-- ── create_icp() — leere Zielgruppe ─────────────────────────────────────────────────────────────
create or replace function create_icp()
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_id    uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'settings.manage') then raise exception 'Kein Recht (settings.manage)'; end if;

  insert into org_icps (organization_id) values (v_org) returning id into v_id;
  return v_id;
end;
$$;

-- ── update_icp(p_id, p_patch) — EINZIGER Schreibweg auf eine Zielgruppe ──────────────────────────
create or replace function update_icp(p_id uuid, p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_row_org uuid;
  v_old   jsonb;
  v_meta  jsonb := '{}'::jsonb;
  k text;
  v_item jsonb;
  c_list text[] := array['company_profile','fit_rationale','desired_outcomes','problems_solved'];
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'settings.manage') then raise exception 'Kein Recht (settings.manage)'; end if;

  select organization_id into v_row_org from org_icps where id = p_id;
  if v_row_org is null then raise exception 'ICP nicht gefunden'; end if;
  if v_row_org <> v_org then raise exception 'ICP gehoert zu einer anderen Organisation'; end if;

  -- Whitelist
  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('name','fit_level','company_profile','fit_rationale','desired_outcomes',
                 'problems_solved','is_active') then
      raise exception 'Unbekannter ICP-Key: %', k;
    end if;
  end loop;

  -- Listen müssen Arrays sein und jedes Item eine id tragen (Zuordnung beim Bearbeiten/Entfernen)
  foreach k in array c_list loop
    if p_patch ? k then
      if jsonb_typeof(p_patch->k) <> 'array' then raise exception '% muss eine Liste sein', k; end if;
      for v_item in select * from jsonb_array_elements(p_patch->k) loop
        if not (v_item ? 'id') then raise exception 'Listen-Eintrag in % ohne id', k; end if;
      end loop;
    end if;
  end loop;

  -- field_meta-Lock für berührte INHALTS-Felder (is_active ist Lifecycle, kein Inhalt)
  foreach k in array array['name','fit_level'] || c_list loop
    if p_patch ? k then
      v_meta := v_meta || jsonb_build_object(k,
        jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
    end if;
  end loop;

  select to_jsonb(t) - 'id' - 'organization_id' - 'field_meta' - 'created_at' - 'updated_at'
    into v_old from org_icps t where id = p_id;

  update org_icps set
    name             = case when p_patch ? 'name'             then coalesce(p_patch->>'name','')       else name end,
    fit_level        = case when p_patch ? 'fit_level'        then nullif(p_patch->>'fit_level','')    else fit_level end,
    company_profile  = case when p_patch ? 'company_profile'  then p_patch->'company_profile'          else company_profile end,
    fit_rationale    = case when p_patch ? 'fit_rationale'    then p_patch->'fit_rationale'            else fit_rationale end,
    desired_outcomes = case when p_patch ? 'desired_outcomes' then p_patch->'desired_outcomes'         else desired_outcomes end,
    problems_solved  = case when p_patch ? 'problems_solved'  then p_patch->'problems_solved'          else problems_solved end,
    is_active        = case when p_patch ? 'is_active'        then (p_patch->>'is_active')::boolean    else is_active end,
    field_meta       = coalesce(field_meta,'{}'::jsonb) || v_meta
  where id = p_id;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_actor, 'update_icp', 'org_icp', p_id, jsonb_build_object('patch', p_patch, 'old', v_old));
end;
$$;

-- ── delete_icp(p_id) — WEICH (is_active=false), wie delete_product ───────────────────────────────
create or replace function delete_icp(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform update_icp(p_id, jsonb_build_object('is_active', false));
end;
$$;

-- ── create_persona(p_icp_id) — leere Person unter einer Zielgruppe ───────────────────────────────
create or replace function create_persona(p_icp_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_icp_org uuid;
  v_id    uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'settings.manage') then raise exception 'Kein Recht (settings.manage)'; end if;

  -- Die Ziel-Zielgruppe muss existieren UND derselben Org gehören (Cross-Org-Guard).
  select organization_id into v_icp_org from org_icps where id = p_icp_id;
  if v_icp_org is null then raise exception 'ICP nicht gefunden'; end if;
  if v_icp_org <> v_org then raise exception 'ICP gehoert zu einer anderen Organisation'; end if;

  insert into org_personas (organization_id, icp_id) values (v_org, p_icp_id) returning id into v_id;
  return v_id;
end;
$$;

-- ── update_persona(p_id, p_patch) — EINZIGER Schreibweg auf eine Person ──────────────────────────
create or replace function update_persona(p_id uuid, p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_row_org uuid;
  v_old   jsonb;
  v_meta  jsonb := '{}'::jsonb;
  k text;
  v_item jsonb;
  c_list text[] := array['job_titles','responsibilities','goals','priorities','core_problems',
                         'objections','exact_wording','inferred_wording'];
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'settings.manage') then raise exception 'Kein Recht (settings.manage)'; end if;

  select organization_id into v_row_org from org_personas where id = p_id;
  if v_row_org is null then raise exception 'Persona nicht gefunden'; end if;
  if v_row_org <> v_org then raise exception 'Persona gehoert zu einer anderen Organisation'; end if;

  -- Whitelist (icp_id ist bewusst NICHT änderbar — eine Person bleibt bei ihrer Zielgruppe)
  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('name','buying_role','job_titles','responsibilities','goals','priorities',
                 'core_problems','objections','exact_wording','inferred_wording','is_active') then
      raise exception 'Unbekannter Persona-Key: %', k;
    end if;
  end loop;

  foreach k in array c_list loop
    if p_patch ? k then
      if jsonb_typeof(p_patch->k) <> 'array' then raise exception '% muss eine Liste sein', k; end if;
      for v_item in select * from jsonb_array_elements(p_patch->k) loop
        if not (v_item ? 'id') then raise exception 'Listen-Eintrag in % ohne id', k; end if;
      end loop;
    end if;
  end loop;

  foreach k in array array['name','buying_role'] || c_list loop
    if p_patch ? k then
      v_meta := v_meta || jsonb_build_object(k,
        jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
    end if;
  end loop;

  select to_jsonb(t) - 'id' - 'organization_id' - 'icp_id' - 'field_meta' - 'created_at' - 'updated_at'
    into v_old from org_personas t where id = p_id;

  update org_personas set
    name             = case when p_patch ? 'name'             then coalesce(p_patch->>'name','')     else name end,
    buying_role      = case when p_patch ? 'buying_role'      then nullif(p_patch->>'buying_role','') else buying_role end,
    job_titles       = case when p_patch ? 'job_titles'       then p_patch->'job_titles'             else job_titles end,
    responsibilities = case when p_patch ? 'responsibilities' then p_patch->'responsibilities'       else responsibilities end,
    goals            = case when p_patch ? 'goals'            then p_patch->'goals'                  else goals end,
    priorities       = case when p_patch ? 'priorities'       then p_patch->'priorities'             else priorities end,
    core_problems    = case when p_patch ? 'core_problems'    then p_patch->'core_problems'          else core_problems end,
    objections       = case when p_patch ? 'objections'       then p_patch->'objections'             else objections end,
    exact_wording    = case when p_patch ? 'exact_wording'    then p_patch->'exact_wording'          else exact_wording end,
    inferred_wording = case when p_patch ? 'inferred_wording' then p_patch->'inferred_wording'       else inferred_wording end,
    is_active        = case when p_patch ? 'is_active'        then (p_patch->>'is_active')::boolean  else is_active end,
    field_meta       = coalesce(field_meta,'{}'::jsonb) || v_meta
  where id = p_id;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_actor, 'update_persona', 'org_persona', p_id, jsonb_build_object('patch', p_patch, 'old', v_old));
end;
$$;

-- ── delete_persona(p_id) — WEICH (is_active=false) ──────────────────────────────────────────────
create or replace function delete_persona(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform update_persona(p_id, jsonb_build_object('is_active', false));
end;
$$;
