-- 089_lifecycle_evaluator.sql
-- Lifecycle-Trigger-Baukasten — L-2a (Auswerter): DB-Teil.
-- KEIN neuer Cron: der Auswerter wird per VERKETTUNG von der letzten Score-Function (score-upsell)
-- angestoßen (immer direkt nach frischen Scores). Sicherheitsnetz: cron_expectations-Eintrag → der
-- Watchdog (069, alle 15 Min) alarmiert, falls die Kette reißt / der Auswerter ausbleibt.
--
-- Enthält:
--   (1) cron_expectations-Eintrag 'evaluate-lifecycle-rules' (Betrieb-B-1)
--   (2) lifecycle_mark_fired  — atomarer Upsert (matched=true, fired_count+1, action_result) je Feuer
--   (3) lifecycle_mark_rearmed — bulk matched=false (Datensatz matcht nicht mehr)
--   (4) Index für den prev-matched-Load
-- Die Auswerte-ENTSCHEIDUNG (Mengen-Algebra/Einmal-Feuer/Rangfolge/Batching) liegt in der Edge
-- (_shared/lifecycle/eval.ts, testbar); hier nur die atomaren DB-Writes.

-- ── (1) cron_expectations (Watchdog überwacht die Verkettung) ────────────────
insert into cron_expectations (job_name, max_interval_minutes, alert_what, alert_hypothesis, alert_meaning) values
 ('evaluate-lifecycle-rules', 1560,
  'Der tägliche Lifecycle-Auswerter (eigene Wenn-Dann-Regeln) ist nicht durchgelaufen.',
  'Möglicherweise ist die Verkettung nach dem letzten Score-Lauf (score-upsell) gerissen oder die Function schlug fehl.',
  'Eigene Regeln haben heute nicht gefeuert — erwartete Benachrichtigungen/Tasks bleiben aus, bis der Lauf nachgeholt wird.')
on conflict (job_name) do update
  set max_interval_minutes = excluded.max_interval_minutes, alert_what = excluded.alert_what,
      alert_hypothesis = excluded.alert_hypothesis, alert_meaning = excluded.alert_meaning, is_active = true;

-- ── (4) Index: prev-matched je Regel schnell laden ───────────────────────────
create index if not exists idx_lifecycle_rule_runs_matched
  on lifecycle_rule_runs (rule_id) where matched;

-- ── (2) lifecycle_mark_fired — atomarer Upsert je Feuer ──────────────────────
-- Idempotent-hart: der Fortschritt (matched=true) + fired_count-Inkrement passieren in EINEM Statement.
-- Aufruf nur intern (Edge/service_role). Defensiv gegen org-Mismatch der Regel.
create or replace function lifecycle_mark_fired(p_rule uuid, p_entity uuid, p_org uuid, p_result jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from lifecycle_rules where id = p_rule and organization_id = p_org) then
    raise exception 'lifecycle_mark_fired: Regel % gehoert nicht zu Org %', p_rule, p_org;
  end if;
  insert into lifecycle_rule_runs (organization_id, rule_id, entity_id, matched, fired_count, last_evaluated_at, last_fired_at, action_result)
  values (p_org, p_rule, p_entity, true, 1, now(), now(), p_result)
  on conflict (rule_id, entity_id) do update
    set matched = true,
        fired_count = lifecycle_rule_runs.fired_count + 1,
        last_evaluated_at = now(),
        last_fired_at = now(),
        action_result = excluded.action_result;
end;
$$;

-- ── (3) lifecycle_mark_rearmed — Datensätze, die nicht mehr matchen, scharf stellen ──
create or replace function lifecycle_mark_rearmed(p_rule uuid, p_entities uuid[], p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_entities is null or array_length(p_entities, 1) is null then return; end if;
  if not exists (select 1 from lifecycle_rules where id = p_rule and organization_id = p_org) then
    raise exception 'lifecycle_mark_rearmed: Regel % gehoert nicht zu Org %', p_rule, p_org;
  end if;
  update lifecycle_rule_runs
     set matched = false, last_evaluated_at = now()
   where rule_id = p_rule and entity_id = any(p_entities);
end;
$$;
