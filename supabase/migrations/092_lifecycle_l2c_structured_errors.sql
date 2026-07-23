-- 092_lifecycle_l2c_structured_errors.sql
-- Lifecycle-Baukasten L-2c — [D54] strukturierte, maschinell auswertbare Ablehnungsgründe für die
-- beiden Lifecycle-Schreib-RPCs. ERSTE Umsetzung des [D54]-Nachrüst-Musters → bewusst als VORLAGE
-- für die übrigen chat-fähigen RPCs (update_settings, update_voice_profile, update_org_profile, …) gebaut.
--
-- Muster (der eigentliche Kanal ist maschinenlesbar, NICHT der Freitext):
--   raise ... using errcode='P0001',
--        detail = '{"code":"<maschinen-code>","field":"<betroffenes feld>", …grenzen/erlaubte werte}',
--        hint   = '<eine konkrete Handlungsanweisung>';
--   → supabase-js liefert error.message (Alltagssatz) · error.details (JSON: code/field/limits) · error.hint.
--   Die UI parst error.details → übersetzt in Alltagssprache, statt am Fehlertext zu raten.

-- ── Wiederverwendbarer Strukturfehler-Werfer (die [D54]-Vorlage) ─────────────
create or replace function _structured_error(
  p_code text, p_message text, p_field text default null,
  p_detail jsonb default '{}'::jsonb, p_hint text default null
) returns void language plpgsql as $$
begin
  raise exception '%', p_message
    using errcode = 'P0001',
          detail = (jsonb_build_object('code', p_code, 'field', p_field) || coalesce(p_detail, '{}'::jsonb))::text,
          hint = coalesce(p_hint, '');
end;
$$;
comment on function _structured_error(text, text, text, jsonb, text) is
  '[D54] Wirft einen strukturierten Fehler: detail = JSON {code, field, …}, hint = Handlungsanweisung. Vorlage fuer alle chat-faehigen RPCs.';

-- ── upsert_lifecycle_rule — identische Logik wie 090, Fehler jetzt strukturiert ([D54]) ──
create or replace function upsert_lifecycle_rule(p_id uuid, p_patch jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org uuid;
  v_ex lifecycle_rules%rowtype;
  v_name text; v_anchor text; v_conditions jsonb; v_action jsonb; v_action_type text; v_applies text[];
  v_trigger text; v_priority int; v_is_active boolean; v_is_terminal boolean;
  v_missing text[]; v_limit int; v_count int; v_id uuid;
begin
  if v_actor is null then
    perform _structured_error('not_authenticated', 'Nicht angemeldet.', null, '{}'::jsonb, 'Bitte neu anmelden.');
  end if;
  if not has_permission(v_actor, 'automation.manage') then
    perform _structured_error('permission_denied', 'Dir fehlt das Recht, Automatik-Regeln zu verwalten.',
      'automation.manage', '{}'::jsonb, 'Bitte einen Administrator um das Recht "automation.manage".');
  end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then
    perform _structured_error('unknown_org', 'Deine Organisation ist unbekannt.');
  end if;

  if p_id is null then
    v_missing := array(select k from unnest(array['name','anchor_entity','conditions','action']) k
                       where not (p_patch ? k));
    if array_length(v_missing, 1) is not null then
      perform _structured_error('missing_required_fields', 'Es fehlen Pflichtangaben zum Anlegen der Regel.',
        null, jsonb_build_object('fields', to_jsonb(v_missing)), 'Bitte alle Pflichtfelder ausfuellen.');
    end if;
  else
    select * into v_ex from lifecycle_rules where id = p_id and organization_id = v_org;
    if not found then
      perform _structured_error('rule_not_found', 'Diese Regel wurde nicht gefunden.', 'id',
        jsonb_build_object('id', p_id), 'Vermutlich bereits geloescht.');
    end if;
  end if;

  v_name        := coalesce(p_patch->>'name', v_ex.name);
  v_anchor      := coalesce(p_patch->>'anchor_entity', v_ex.anchor_entity);
  v_conditions  := coalesce(p_patch->'conditions', v_ex.conditions);
  v_action      := coalesce(p_patch->'action', v_ex.action);
  v_trigger     := coalesce(p_patch->>'trigger_event', v_ex.trigger_event, 'schedule');
  v_priority    := coalesce((p_patch->>'priority')::int, v_ex.priority, 100);
  v_is_active   := coalesce((p_patch->>'is_active')::boolean, v_ex.is_active, true);
  v_is_terminal := coalesce((p_patch->>'is_terminal')::boolean, v_ex.is_terminal, false);

  if v_name is null or trim(v_name) = '' then
    perform _structured_error('name_empty', 'Die Regel braucht einen Namen.', 'name');
  end if;
  if v_anchor not in ('contacts', 'companies', 'deals') then
    perform _structured_error('invalid_anchor', 'Ungueltige Datenart fuer die Regel.', 'anchor_entity',
      jsonb_build_object('allowed', jsonb_build_array('contacts', 'companies', 'deals'), 'given', v_anchor));
  end if;
  if v_trigger not in ('schedule', 'contact_status_changed', 'score_updated', 'signal_created') then
    perform _structured_error('invalid_trigger', 'Ungueltiger Ausloeser.', 'trigger_event',
      jsonb_build_object('allowed', jsonb_build_array('schedule','contact_status_changed','score_updated','signal_created'), 'given', v_trigger));
  end if;
  -- Grammatik der Bedingungen: Roh-Fehler des Validators in einen strukturierten Grund wrappen.
  begin
    perform _lifecycle_validate_conditions(v_conditions);
  exception when others then
    perform _structured_error('invalid_conditions', 'Die Bedingungen sind ungueltig: ' || sqlerrm, 'conditions',
      jsonb_build_object('reason', sqlerrm), 'Bitte Feld/Operator/Wert je Bedingung pruefen.');
  end;

  v_action_type := v_action->>'type';
  if v_action_type is null then
    perform _structured_error('action_type_missing', 'Der Regel fehlt eine Aktion.', 'action.type');
  end if;
  select applies_to into v_applies from action_types where key = v_action_type and status = 'active';
  if v_applies is null then
    perform _structured_error('action_unavailable', 'Diese Aktion ist nicht verfuegbar.', 'action.type',
      jsonb_build_object('action', v_action_type), 'Bitte eine verfuegbare Aktion waehlen (nicht ausgegraute).');
  end if;
  if not (v_anchor = any(v_applies)) then
    perform _structured_error('action_not_applicable', 'Diese Aktion passt nicht zur gewaehlten Datenart.',
      'action.type', jsonb_build_object('action', v_action_type, 'anchor', v_anchor, 'applies_to', to_jsonb(v_applies)),
      'Bitte eine Aktion waehlen, die zur Datenart passt.');
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
        perform _structured_error('rule_limit_reached', 'Das Regel-Limit deines Plans ist erreicht.', null,
          jsonb_build_object('limit', v_limit, 'current', v_count),
          'Bitte eine bestehende Regel loeschen oder den Plan upgraden.');
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

-- ── delete_lifecycle_rule — strukturierte Fehler ([D54]) ─────────────────────
create or replace function delete_lifecycle_rule(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_org uuid; v_deleted uuid;
begin
  if v_actor is null then
    perform _structured_error('not_authenticated', 'Nicht angemeldet.', null, '{}'::jsonb, 'Bitte neu anmelden.');
  end if;
  if not has_permission(v_actor, 'automation.manage') then
    perform _structured_error('permission_denied', 'Dir fehlt das Recht, Automatik-Regeln zu verwalten.',
      'automation.manage', '{}'::jsonb, 'Bitte einen Administrator um das Recht "automation.manage".');
  end if;
  select organization_id into v_org from users where id = v_actor;
  delete from lifecycle_rules where id = p_id and organization_id = v_org returning id into v_deleted;
  if v_deleted is null then
    perform _structured_error('rule_not_found', 'Diese Regel wurde nicht gefunden.', 'id',
      jsonb_build_object('id', p_id), 'Vermutlich bereits geloescht.');
  end if;
  -- audit via Trigger (DELETE)
end;
$$;
