-- 087_set4a_signal_fresh_active_flags.sql
-- SET-4a (Regeln-Seite) — update_settings-Whitelist um drei thresholds-Keys erweitern:
--   signal_fresh_hours    — Signal-Frische-Fenster in Stunden (A→C: ersetzt den 24h-Literal in hunterMappers).
--                           Skalar, Min/Max 1–168.
--   churn_weights_active  — per-Signal An/Aus (Churn): { signal_key: boolean }. Default (Key fehlt) = aktiv.
--   upsell_weights_active — per-Signal An/Aus (Upsell): { signal_key: boolean }. Default (Key fehlt) = aktiv.
-- Die Score-Funktionen (score-churn-risk/score-upsell) überspringen deaktivierte Signale (weder available
-- noch earned). Bestandsdaten ohne diese Keys verhalten sich unverändert (alle Signale aktiv).
-- KEINE Tabelle/Spalte — nur der eine Schreibweg (Whitelist + Min/Max + audit), Rest von 083 unverändert.

create or replace function update_settings(p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_old   jsonb;
  k text;
  bk text;        -- Sub-Key innerhalb eines *_weights_active-Objekts
  v_val jsonb;
  v_elem jsonb;
  v_slugs text[] := array[]::text[];
  -- Won/Lost = System-Invariante (Slug-Identität). Quelle: src/lib/hunterMappers.ts
  -- (WON_STAGE_SLUG/LOST_STAGE_SLUG) ↔ supabase/functions/_shared/terminalStages.ts. Dieser RPC ist der
  -- dritte, bewusst gespiegelte Ort für den SCHREIB-Schutz — ändert sich der Enum, alle drei gleich halten.
  c_won  constant text := 'gewonnen';
  c_lost constant text := 'verloren';
  -- Whitelist der zulässigen Zweitebene-Keys je Bereich (unbekannt → Fehler). SET-4a: +signal_fresh_hours,
  -- +churn_weights_active, +upsell_weights_active.
  c_thr  text[] := array['heat_status','timing_windows','churn_risk_threshold','upsell_threshold',
                         'health_critical','health_attention','churn_weights','upsell_weights',
                         'hunter_priority_weights','churn_suppresses_upsell','meeting_prep',
                         'soft_bounce_retry','mailbox_health','churn_risk','mein_tag_top5_priorities',
                         'health_formula','signal_fresh_hours','churn_weights_active','upsell_weights_active'];
  c_auto text[] := array['default_automation_level','intent_threshold','reactivation_days',
                         'max_ai_adjustments_per_lead','followup_first_days','followup_second_days',
                         'max_auto_followups','answer_expected_default','icp_score_threshold',
                         'onboarding_nudge_days','onboarding_task_days','trial_duration_days',
                         'trial_warning_first_days','trial_warning_second_days','trial_task_after_days'];
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;

  -- Top-Level-Whitelist.
  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('thresholds','automation_defaults','pipeline_stages') then
      raise exception 'Unbekannter settings-Bereich: %', k;
    end if;
  end loop;

  -- Bereichs-spezifisches Rechte-Gate (nicht EIN settings.manage).
  if p_patch ? 'thresholds' and not has_permission(v_actor, 'rules.edit') then
    raise exception 'Kein Recht (rules.edit)'; end if;
  if p_patch ? 'pipeline_stages' and not has_permission(v_actor, 'pipeline.manage') then
    raise exception 'Kein Recht (pipeline.manage)'; end if;
  if p_patch ? 'automation_defaults' and not has_permission(v_actor, 'automation.manage') then
    raise exception 'Kein Recht (automation.manage)'; end if;

  -- ── thresholds validieren (Whitelist + Min/Max pro Feld) ───────────────────────────────────────
  if p_patch ? 'thresholds' then
    if jsonb_typeof(p_patch->'thresholds') <> 'object' then raise exception 'thresholds muss ein Objekt sein'; end if;
    for k in select jsonb_object_keys(p_patch->'thresholds') loop
      if not (k = any(c_thr)) then raise exception 'Unbekannter thresholds-Key: %', k; end if;
      v_val := (p_patch->'thresholds')->k;
      if k in ('heat_status','timing_windows') then
        perform settings_chk_num_group(v_val, 1, 365, 'thresholds.'||k);
      elsif k in ('churn_weights','upsell_weights','hunter_priority_weights') then
        perform settings_chk_num_group(v_val, 0, 1000, 'thresholds.'||k);
      elsif k in ('churn_risk_threshold','upsell_threshold','health_critical','health_attention') then
        perform settings_chk_num(v_val, 0, 100, 'thresholds.'||k);
      elsif k = 'signal_fresh_hours' then
        perform settings_chk_num(v_val, 1, 168, 'thresholds.signal_fresh_hours');
      elsif k in ('churn_weights_active','upsell_weights_active') then
        -- Objekt aus { signal_key: boolean }; jeder Wert muss ja/nein sein.
        if jsonb_typeof(v_val) <> 'object' then raise exception 'thresholds.% muss ein Objekt sein', k; end if;
        for bk in select jsonb_object_keys(v_val) loop
          if jsonb_typeof(v_val->bk) <> 'boolean' then raise exception 'thresholds.%.% muss ja/nein sein', k, bk; end if;
        end loop;
      elsif k = 'churn_suppresses_upsell' then
        if jsonb_typeof(v_val) <> 'boolean' then raise exception 'thresholds.churn_suppresses_upsell muss ja/nein sein'; end if;
      elsif k = 'meeting_prep' then
        perform settings_chk_num(v_val->'touchpoints_count', 1, 50, 'thresholds.meeting_prep.touchpoints_count');
      elsif k in ('soft_bounce_retry','mailbox_health','churn_risk') then
        if jsonb_typeof(v_val) <> 'object' then raise exception 'thresholds.% muss ein Objekt sein', k; end if;
      elsif k = 'mein_tag_top5_priorities' then
        if jsonb_typeof(v_val) <> 'array' then raise exception 'thresholds.mein_tag_top5_priorities muss eine Liste sein'; end if;
      elsif k = 'health_formula' then
        if jsonb_typeof(v_val) <> 'string' then raise exception 'thresholds.health_formula muss Text sein'; end if;
      end if;
    end loop;
  end if;

  -- ── automation_defaults validieren ────────────────────────────────────────────────────────────
  if p_patch ? 'automation_defaults' then
    if jsonb_typeof(p_patch->'automation_defaults') <> 'object' then raise exception 'automation_defaults muss ein Objekt sein'; end if;
    for k in select jsonb_object_keys(p_patch->'automation_defaults') loop
      if not (k = any(c_auto)) then raise exception 'Unbekannter automation_defaults-Key: %', k; end if;
      v_val := (p_patch->'automation_defaults')->k;
      if k = 'default_automation_level' then
        if (v_val#>>'{}') not in ('manual','semi','auto') then raise exception 'default_automation_level muss manual|semi|auto sein'; end if;
      elsif k = 'answer_expected_default' then
        if jsonb_typeof(v_val) <> 'boolean' then raise exception 'automation_defaults.answer_expected_default muss ja/nein sein'; end if;
      elsif k in ('intent_threshold','icp_score_threshold') then
        perform settings_chk_num(v_val, 0, 100, 'automation_defaults.'||k);
      elsif k in ('max_ai_adjustments_per_lead','max_auto_followups') then
        perform settings_chk_num(v_val, 0, 50, 'automation_defaults.'||k);
      else -- alle *_days-Felder
        perform settings_chk_num(v_val, 1, 365, 'automation_defaults.'||k);
      end if;
    end loop;
  end if;

  -- ── pipeline_stages validieren (+ Won/Lost-Schreibschutz) ─────────────────────────────────────
  if p_patch ? 'pipeline_stages' then
    if jsonb_typeof(p_patch->'pipeline_stages') <> 'array' then raise exception 'pipeline_stages muss eine Liste sein'; end if;
    for v_elem in select * from jsonb_array_elements(p_patch->'pipeline_stages') loop
      if jsonb_typeof(v_elem) <> 'object' or not (v_elem ? 'slug') or not (v_elem ? 'name') then
        raise exception 'Jede Pipeline-Stufe braucht slug + name'; end if;
      if length(coalesce(v_elem->>'slug','')) = 0 then raise exception 'Pipeline-Stufe ohne slug'; end if;
      if v_elem ? 'order' then perform settings_chk_num(v_elem->'order', 1, 99, 'pipeline_stages.order'); end if;
      if (v_elem->'stagnation_days') is not null and jsonb_typeof(v_elem->'stagnation_days') <> 'null' then
        perform settings_chk_num(v_elem->'stagnation_days', 1, 365, 'pipeline_stages.stagnation_days'); end if;
      if v_elem ? 'probability' then perform settings_chk_num(v_elem->'probability', 0, 100, 'pipeline_stages.probability'); end if;
      if (v_elem->>'slug') = any(v_slugs) then raise exception 'Doppelter Stufen-slug: %', v_elem->>'slug'; end if;
      v_slugs := array_append(v_slugs, v_elem->>'slug');
    end loop;
    if not (c_won = any(v_slugs)) then raise exception 'Won-Stufe (%) ist unantastbar und darf nicht entfernt/umbenannt werden', c_won; end if;
    if not (c_lost = any(v_slugs)) then raise exception 'Lost-Stufe (%) ist unantastbar und darf nicht entfernt/umbenannt werden', c_lost; end if;
  end if;

  -- ── Zeile sicherstellen + Alt-Werte fürs Audit ────────────────────────────────────────────────
  insert into settings (organization_id) values (v_org) on conflict (organization_id) do nothing;
  select jsonb_build_object('thresholds', thresholds, 'automation_defaults', automation_defaults,
                            'pipeline_stages', pipeline_stages)
    into v_old from settings where organization_id = v_org;

  update settings set
    thresholds          = case when p_patch ? 'thresholds'          then coalesce(thresholds,'{}'::jsonb) || (p_patch->'thresholds') else thresholds end,
    automation_defaults = case when p_patch ? 'automation_defaults' then coalesce(automation_defaults,'{}'::jsonb) || (p_patch->'automation_defaults') else automation_defaults end,
    pipeline_stages     = case when p_patch ? 'pipeline_stages'     then p_patch->'pipeline_stages' else pipeline_stages end,
    updated_at          = now()
  where organization_id = v_org;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_actor, 'update_settings', 'settings', v_org, jsonb_build_object('patch', p_patch, 'old', v_old));
end;
$$;
