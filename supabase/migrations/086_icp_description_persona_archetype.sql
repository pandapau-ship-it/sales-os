-- 086_icp_description_persona_archetype.sql
-- „Mein Unternehmen" — Company Profile abschließen: zwei fehlende Referenz-Felder ergänzen.
--   org_icps.description   — ICP-KURZBESCHREIBUNG (einzeiliger Subtext unter dem Namen; Referenz
--                            00_Designs/CompanyProfile.tsx: „Software companies in the scaling phase …")
--   org_personas.archetype — Personen-ARCHETYP (kurzes Label; Referenz: „The Revenue Driver")
-- Beide: nullable text, KEIN Default-Text → bestehende Einträge bleiben ehrlich leer (nichts erfinden).
-- Analog zur bestehenden `name`-Spalte (text) — kurze Identitäts-/Label-Felder, kein Inhalts-Listen-Feld.
--
-- Schreibweg: NUR die bestehenden RPCs erweitert (create_/update_icp bzw. _persona) — EINZELN in die
-- Whitelist + field_meta-Lock aufgenommen, wie company_profile/fit_rationale. KEIN zweiter Schreibweg.
-- '' → NULL (nullif), damit „geleert" ehrlich null ist (wie fit_level/buying_role).

alter table org_icps     add column if not exists description text;
alter table org_personas add column if not exists archetype   text;

-- ── update_icp: + description (skalarer Text, wie name) ──────────────────────────────────────────
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

  -- Whitelist (+ description)
  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('name','description','fit_level','company_profile','fit_rationale','desired_outcomes',
                 'problems_solved','is_active') then
      raise exception 'Unbekannter ICP-Key: %', k;
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

  -- field_meta-Lock für berührte INHALTS-Felder (+ description; is_active bleibt Lifecycle)
  foreach k in array array['name','description','fit_level'] || c_list loop
    if p_patch ? k then
      v_meta := v_meta || jsonb_build_object(k,
        jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
    end if;
  end loop;

  select to_jsonb(t) - 'id' - 'organization_id' - 'field_meta' - 'created_at' - 'updated_at'
    into v_old from org_icps t where id = p_id;

  update org_icps set
    name             = case when p_patch ? 'name'             then coalesce(p_patch->>'name','')       else name end,
    description      = case when p_patch ? 'description'       then nullif(p_patch->>'description','')  else description end,
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

-- ── update_persona: + archetype (skalarer Text, wie name) ───────────────────────────────────────
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

  -- Whitelist (+ archetype; icp_id bleibt bewusst nicht änderbar)
  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('name','archetype','buying_role','job_titles','responsibilities','goals','priorities',
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

  foreach k in array array['name','archetype','buying_role'] || c_list loop
    if p_patch ? k then
      v_meta := v_meta || jsonb_build_object(k,
        jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
    end if;
  end loop;

  select to_jsonb(t) - 'id' - 'organization_id' - 'icp_id' - 'field_meta' - 'created_at' - 'updated_at'
    into v_old from org_personas t where id = p_id;

  update org_personas set
    name             = case when p_patch ? 'name'             then coalesce(p_patch->>'name','')     else name end,
    archetype        = case when p_patch ? 'archetype'        then nullif(p_patch->>'archetype','')  else archetype end,
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
