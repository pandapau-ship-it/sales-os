-- 083_set4_settings_write_path.sql
-- SET-4 Fundament (1/2) — Schreibweg für den Regeln/Automation/Pipeline-Bereich.
-- (a) Drei neue Katalog-Rechte (rules.edit · pipeline.manage · automation.manage) — Muster wie 070/073.
-- (b) EIN validierter Schreibweg update_settings(p_patch): Key-Whitelist · Min/Max PRO FELD im RPC
--     (kein system_config, wie in der Diagnose bestätigt) · bereichs-spezifisches Rechte-Gate ·
--     audit_log (alt→neu) · Won/Lost-Schreibschutz.
-- Lesepfad bleibt getSettings (db.ts); dies ergänzt NUR das Schreiben. UI folgt in SET-4 (2/2).

-- ── (a) Rechte-Katalog erweitern (global, datengetrieben; Spiegel src/lib/permissions.ts) ─────────
insert into permission_catalog (permission, description) values
  ('rules.edit',        'Regeln & Schwellenwerte ändern (settings.thresholds)'),
  ('pipeline.manage',   'Pipeline-Stufen verwalten (settings.pipeline_stages)'),
  ('automation.manage', 'Automation-Standards ändern (settings.automation_defaults)')
on conflict (permission) do nothing;

-- Rollen-Matrix: Admin-Ebene (wie Automation/Pipeline/Produkte in der Rechte-Matrix) → owner + admin,
-- member/viewer: nein. Idempotent.
insert into role_permissions (role, permission)
select 'owner', p from unnest(array['rules.edit','pipeline.manage','automation.manage']) p
on conflict (role, permission) do nothing;
insert into role_permissions (role, permission)
select 'admin', p from unnest(array['rules.edit','pipeline.manage','automation.manage']) p
on conflict (role, permission) do nothing;

-- ── (b) Validierungs-Helfer (rein, werfen bei Verstoß; kein security definer nötig) ──────────────
-- Einzelwert muss Zahl in [lo,hi] sein.
create or replace function settings_chk_num(p_val jsonb, p_lo numeric, p_hi numeric, p_ctx text)
returns void language plpgsql as $$
begin
  if p_val is null or jsonb_typeof(p_val) <> 'number' then raise exception '% muss eine Zahl sein', p_ctx; end if;
  if (p_val::numeric) < p_lo or (p_val::numeric) > p_hi then
    raise exception '% muss zwischen % und % liegen (war %)', p_ctx, p_lo, p_hi, p_val::text;
  end if;
end;
$$;

-- Jeder Wert eines Objekts muss Zahl in [lo,hi] sein (Gewichte/Tages-Gruppen).
create or replace function settings_chk_num_group(p_obj jsonb, p_lo numeric, p_hi numeric, p_ctx text)
returns void language plpgsql as $$
declare k text; v jsonb;
begin
  if p_obj is null or jsonb_typeof(p_obj) <> 'object' then raise exception '% muss ein Objekt sein', p_ctx; end if;
  for k, v in select key, value from jsonb_each(p_obj) loop
    perform settings_chk_num(v, p_lo, p_hi, p_ctx || '.' || k);
  end loop;
end;
$$;

-- ── update_settings(p_patch) — EINZIGER Schreibweg auf settings (Regeln/Automation/Pipeline) ─────
create or replace function update_settings(p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_old   jsonb;
  k text;
  v_val jsonb;
  v_elem jsonb;
  v_slugs text[] := array[]::text[];
  -- Won/Lost = System-Invariante (Slug-Identität). Quelle: src/lib/hunterMappers.ts
  -- (WON_STAGE_SLUG/LOST_STAGE_SLUG) ↔ supabase/functions/_shared/terminalStages.ts. Dieser RPC ist der
  -- dritte, bewusst gespiegelte Ort für den SCHREIB-Schutz — ändert sich der Enum, alle drei gleich halten.
  c_won  constant text := 'gewonnen';
  c_lost constant text := 'verloren';
  -- Whitelist der zulässigen Zweitebene-Keys je Bereich (unbekannt → Fehler).
  c_thr  text[] := array['heat_status','timing_windows','churn_risk_threshold','upsell_threshold',
                         'health_critical','health_attention','churn_weights','upsell_weights',
                         'hunter_priority_weights','churn_suppresses_upsell','meeting_prep',
                         'soft_bounce_retry','mailbox_health','churn_risk','mein_tag_top5_priorities',
                         'health_formula'];
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
    -- Won/Lost dürfen weder gelöscht noch umbenannt (Slug entfernt) werden — beide MÜSSEN bleiben.
    if not (c_won = any(v_slugs)) then raise exception 'Won-Stufe (%) ist unantastbar und darf nicht entfernt/umbenannt werden', c_won; end if;
    if not (c_lost = any(v_slugs)) then raise exception 'Lost-Stufe (%) ist unantastbar und darf nicht entfernt/umbenannt werden', c_lost; end if;
  end if;

  -- ── Zeile sicherstellen + Alt-Werte fürs Audit ────────────────────────────────────────────────
  insert into settings (organization_id) values (v_org) on conflict (organization_id) do nothing;
  select jsonb_build_object('thresholds', thresholds, 'automation_defaults', automation_defaults,
                            'pipeline_stages', pipeline_stages)
    into v_old from settings where organization_id = v_org;

  -- Schreiben: thresholds/automation_defaults shallow-merge (volle Zweitebene-Objekte), pipeline_stages ersetzen.
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
