-- 090_lifecycle_l2b_handlers.sql
-- Lifecycle-Baukasten L-2b — DB-Teil der Gruppe-1-Aktions-Handler (create_task/add_tag/add_to_list).
--
-- Enthält:
--   (1) tasks.source_ref + Unique-Index — strikte create_task-Idempotenz (Crash-Retry-sicher, D1)
--   (2) upsert_lifecycle_rule: applies_to BEIDSEITIG erzwingen (Write-Zeit; Auswerter defensiv separat) (D2)
--   (3) 3 Aktionen INTERIM coming_soon (Dispatch existiert erst mit dem Function-Deploy; 091 → active) (D4)
--   (4) atomare, idempotente Handler-RPCs: lifecycle_create_task / _add_tag / _add_to_list (+ audit 'routine')
-- Die Aktions-ENTSCHEIDUNG (welcher Datensatz feuert) bleibt in der Edge (_shared/lifecycle/eval.ts);
-- hier nur die atomaren DB-Writes über BESTEHENDE Tabellen (tasks · contacts/companies.tags · list_members) — Single Source.

-- ── (1) tasks.source_ref — Dedup je Feuer-Instanz (rule:entity:fired_count) ───
alter table tasks add column if not exists source_ref text;
-- Unique NUR über non-null (NULLs sind in Unique-Indizes distinkt → Bestands-Tasks unberührt).
create unique index if not exists uq_tasks_source_ref on tasks(source_ref);

-- ── (2) upsert_lifecycle_rule — + applies_to-Erzwingung (Anker ∈ Aktion.applies_to) ──
create or replace function upsert_lifecycle_rule(p_id uuid, p_patch jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org uuid;
  v_ex lifecycle_rules%rowtype;
  v_name text; v_anchor text; v_conditions jsonb; v_action jsonb; v_action_type text; v_applies text[];
  v_trigger text; v_priority int; v_is_active boolean; v_is_terminal boolean;
  v_limit int; v_count int; v_id uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  perform assert_permission('automation.manage');
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannte Organisation'; end if;

  if p_id is null then
    if not (p_patch ? 'name' and p_patch ? 'anchor_entity' and p_patch ? 'conditions' and p_patch ? 'action') then
      raise exception 'Pflichtfelder fehlen: name, anchor_entity, conditions, action';
    end if;
  else
    select * into v_ex from lifecycle_rules where id = p_id and organization_id = v_org;
    if not found then raise exception 'Regel nicht gefunden oder fremde Organisation'; end if;
  end if;

  v_name        := coalesce(p_patch->>'name', v_ex.name);
  v_anchor      := coalesce(p_patch->>'anchor_entity', v_ex.anchor_entity);
  v_conditions  := coalesce(p_patch->'conditions', v_ex.conditions);
  v_action      := coalesce(p_patch->'action', v_ex.action);
  v_trigger     := coalesce(p_patch->>'trigger_event', v_ex.trigger_event, 'schedule');
  v_priority    := coalesce((p_patch->>'priority')::int, v_ex.priority, 100);
  v_is_active   := coalesce((p_patch->>'is_active')::boolean, v_ex.is_active, true);
  v_is_terminal := coalesce((p_patch->>'is_terminal')::boolean, v_ex.is_terminal, false);

  if v_name is null or trim(v_name) = '' then raise exception 'name darf nicht leer sein'; end if;
  if v_anchor not in ('contacts', 'companies', 'deals') then raise exception 'anchor_entity ungueltig: %', v_anchor; end if;
  if v_trigger not in ('schedule', 'contact_status_changed', 'score_updated', 'signal_created') then
    raise exception 'trigger_event ungueltig: %', v_trigger;
  end if;
  perform _lifecycle_validate_conditions(v_conditions);
  v_action_type := v_action->>'type';
  if v_action_type is null then raise exception 'action.type fehlt'; end if;
  select applies_to into v_applies from action_types where key = v_action_type and status = 'active';
  if v_applies is null then
    raise exception 'Aktion nicht verfuegbar: % (unbekannt oder noch nicht freigeschaltet)', v_action_type;
  end if;
  -- applies_to: Anker muss zur Aktion passen (z.B. add_tag nicht auf deals). Write-Zeit-Ablehnung.
  if not (v_anchor = any(v_applies)) then
    raise exception 'Aktion % ist fuer Anker % nicht anwendbar', v_action_type, v_anchor;
  end if;

  if p_id is null then
    select pl.limit_value into v_limit
    from organization_subscription os
    join plan_limits pl on pl.plan_id = os.plan_id and pl.feature = 'lifecycle_rules'
    where os.organization_id = v_org order by os.created_at desc limit 1;
    if v_limit is null then v_limit := -1; end if;
    if v_limit >= 0 then
      select count(*) into v_count from lifecycle_rules where organization_id = v_org;
      if v_count >= v_limit then
        raise exception 'Regel-Limit erreicht (% von %). Bitte upgraden oder eine bestehende Regel loeschen.', v_count, v_limit;
      end if;
    end if;
  end if;

  if p_id is null then
    insert into lifecycle_rules (organization_id, name, anchor_entity, conditions, action,
                                 trigger_event, priority, is_active, is_terminal, created_by)
    values (v_org, v_name, v_anchor, v_conditions, v_action,
            v_trigger, v_priority, v_is_active, v_is_terminal, v_actor)
    returning id into v_id;
  else
    update lifecycle_rules
      set name = v_name, anchor_entity = v_anchor, conditions = v_conditions, action = v_action,
          trigger_event = v_trigger, priority = v_priority, is_active = v_is_active,
          is_terminal = v_is_terminal, updated_at = now()
      where id = p_id and organization_id = v_org
      returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- ── (3) INTERIM: 3 Aktionen coming_soon, bis der Dispatch (Function-Deploy) sie ausführt (091 → active) ──
update action_types set status = 'coming_soon' where key in ('create_task', 'add_tag', 'add_to_list');

-- ── (4) Handler-RPCs (atomar, idempotent, org-defensiv, audit 'routine') ─────
-- create_task: Insert-if-not-exists über source_ref (Crash-Retry-sicher). Edge löst contact_id/deal_id/assigned_to je Anker auf.
create or replace function lifecycle_create_task(
  p_org uuid, p_source_ref text, p_contact_id uuid, p_deal_id uuid, p_assigned_to uuid,
  p_title text, p_due_at timestamptz, p_priority text
) returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_title is null or trim(p_title) = '' then raise exception 'create_task: title fehlt'; end if;
  insert into tasks (organization_id, contact_id, deal_id, assigned_to, title, due_at, priority, source, source_ref)
  values (p_org, p_contact_id, p_deal_id, p_assigned_to, p_title, p_due_at, coalesce(p_priority, 'medium'), 'routine', p_source_ref)
  on conflict (source_ref) do nothing
  returning id into v_id;
  if v_id is not null then
    insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
    values (p_org, null, 'lifecycle_task_created', 'task', v_id, jsonb_build_object('source_ref', p_source_ref));
  end if;
end;
$$;

-- add_tag: Append nur wenn fehlend (idempotent). Nur contacts/companies.
create or replace function lifecycle_add_tag(p_org uuid, p_entity uuid, p_entity_type text, p_tag text)
returns void language plpgsql security definer set search_path = public as $$
declare v_changed int := 0;
begin
  if p_tag is null or p_tag = '' then raise exception 'add_tag: tag fehlt'; end if;
  if p_entity_type = 'contacts' then
    update contacts set tags = array_append(coalesce(tags, '{}'), p_tag)
      where id = p_entity and organization_id = p_org and not (p_tag = any(coalesce(tags, '{}')));
    get diagnostics v_changed = row_count;
  elsif p_entity_type = 'companies' then
    update companies set tags = array_append(coalesce(tags, '{}'), p_tag)
      where id = p_entity and organization_id = p_org and not (p_tag = any(coalesce(tags, '{}')));
    get diagnostics v_changed = row_count;
  else
    raise exception 'add_tag: entity_type % nicht unterstuetzt', p_entity_type;
  end if;
  if v_changed > 0 then
    insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
    values (p_org, null, 'lifecycle_tag_added', p_entity_type, p_entity, jsonb_build_object('tag', p_tag));
  end if;
end;
$$;

-- add_to_list: nur STATISCHE Liste gleicher Org; Mitgliedschaft in der Join-Tabelle list_members
-- (056 löste die Array-Spalte lists.contact_ids ab — kanonische Single Source). Idempotent über
-- unique(list_id, contact_id) + on-conflict-do-nothing. Dynamische Liste → strukturierter Fehler.
create or replace function lifecycle_add_to_list(p_org uuid, p_list_id uuid, p_contact uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_type text; v_list_org uuid; v_changed int := 0;
begin
  select type, organization_id into v_type, v_list_org from lists where id = p_list_id;
  if v_list_org is null then raise exception 'add_to_list: Liste nicht gefunden'; end if;
  if v_list_org <> p_org then raise exception 'add_to_list: Liste gehoert anderer Organisation'; end if;
  if v_type <> 'static' then
    raise exception 'add_to_list: nur statische Listen (dynamische berechnen ihre Mitglieder live ueber die Filter-Lib)';
  end if;
  insert into list_members (list_id, contact_id, organization_id)
  values (p_list_id, p_contact, p_org)
  on conflict (list_id, contact_id) do nothing;
  get diagnostics v_changed = row_count;
  if v_changed > 0 then
    insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
    values (p_org, null, 'lifecycle_list_add', 'list', p_list_id, jsonb_build_object('contact_id', p_contact));
  end if;
end;
$$;
