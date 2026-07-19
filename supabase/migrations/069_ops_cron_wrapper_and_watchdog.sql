-- 069_ops_cron_wrapper_and_watchdog.sql
-- Betrieb B-1 — Cron-Wrapper, Retention, Umstellung der 2 DB-Crons, Watchdog (gebündelt) + Cron.
-- (Die 4 Edge-Crons 035/037/049/051 schreiben cron_runs in ihren Edge-Functions — separater Deploy.)

-- ── Cron-Wrapper-Helper (Start/Ende → cron_runs), aufrufbar von DB-Cron + Edge ─
create or replace function cron_run_start(p_job text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into cron_runs (job_name, status) values (p_job, 'running') returning id into v_id;
  return v_id;
end;
$$;

create or replace function cron_run_finish(p_run_id uuid, p_status text, p_error text default null, p_items int default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update cron_runs
     set finished_at = now(), status = coalesce(p_status, 'success'), error = p_error, items_processed = p_items
   where id = p_run_id;
end;
$$;

-- ── Retention (Punkt 3): Erfolgs-Läufe 7T, Fehler-Läufe 30T ──────────────────
create or replace function cleanup_cron_runs()
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  delete from cron_runs
   where (status = 'success' and started_at < now() - interval '7 days')
      or (status <> 'success' and started_at < now() - interval '30 days');
  get diagnostics v = row_count;
  return v;
end;
$$;

-- ── Watchdog: prüft Erwartungs-Katalog gegen cron_runs, BÜNDELT Ausfälle ──────
-- (Punkt 4) → EINE system_alerts-Zeile (aktualisiert, nicht angehäuft) + EIN notify() je Ops-Org.
create or replace function run_watchdog()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_violations text[] := '{}';
  v_bodies     text[] := '{}';
  r            record;
  v_count      int;
  v_title      text;
  v_body       text;
  v_ctx        jsonb;
  v_org        record;
  v_recipients uuid[];
begin
  for r in select * from cron_expectations where is_active loop
    if not exists (
      select 1 from cron_runs
      where job_name = r.job_name and status = 'success'
        and started_at > now() - make_interval(mins => r.max_interval_minutes)
    ) then
      v_violations := v_violations || r.job_name;
      v_bodies := v_bodies || ('• ' || r.alert_what
                               || E'\n  Vermutung: ' || r.alert_hypothesis
                               || E'\n  Bedeutung: ' || r.alert_meaning);
    end if;
  end loop;

  v_count := coalesce(array_length(v_violations, 1), 0);

  if v_count = 0 then
    -- Selbstheilung: offene cron_failed-Alarme quittieren, wenn wieder alles läuft.
    update system_alerts set acknowledged_at = now()
      where type = 'cron_failed' and acknowledged_at is null;
    return 0;
  end if;

  v_title := v_count || ' Betriebs-Job(s) nicht durchgelaufen';
  v_body  := array_to_string(v_bodies, E'\n\n');
  v_ctx   := jsonb_build_object('jobs', to_jsonb(v_violations), 'count', v_count);

  -- EINE offene cron_failed-Zeile: aktualisieren statt anhäufen.
  update system_alerts set message = v_title || E'\n\n' || v_body, context = v_ctx, created_at = now()
    where type = 'cron_failed' and acknowledged_at is null;
  if not found then
    insert into system_alerts (severity, type, message, context)
    values ('critical', 'cron_failed', v_title || E'\n\n' || v_body, v_ctx);
  end if;

  -- In-App-Pflichtkanal (B3): nur interne (Ops-)Orgs, Owner/Admins. Fixe source_id → N12-Update,
  -- eine gebündelte Mitteilung, kein Spam. (System-Mail-Kanal = B-2, hier bewusst In-App-only.)
  for v_org in
    select distinct u.organization_id as org_id
    from users u
    join organization_subscription os on os.organization_id = u.organization_id
    join plans p on p.id = os.plan_id and p.name = 'internal'
    where u.role in ('owner', 'admin')
  loop
    select coalesce(array_agg(u.id), '{}') into v_recipients
    from users u where u.organization_id = v_org.org_id and u.role in ('owner', 'admin');
    perform notify(v_org.org_id, 'system_alert', 'critical', v_title, v_body, null,
                   'system_alerts', 'ops-cron-watchdog', v_recipients);
  end loop;

  return v_count;
end;
$$;

-- ── DB-Cron 063 (credit-monthly-reset) auf den Wrapper umstellen ─────────────
do $$ begin
  if exists (select 1 from cron.job where jobname = 'credit-monthly-reset') then
    perform cron.unschedule('credit-monthly-reset');
  end if;
end $$;
select cron.schedule('credit-monthly-reset', '0 3 * * *', $c$
  do $w$
  declare v_run uuid; v_n int;
  begin
    v_run := cron_run_start('credit-monthly-reset');
    begin
      v_n := reset_credit_balances();
      perform cron_run_finish(v_run, 'success', null, v_n);
    exception when others then
      perform cron_run_finish(v_run, 'failed', sqlerrm, null);
    end;
  end $w$;
$c$);

-- ── DB-Cron 067 (notifications-cleanup) auf den Wrapper umstellen ─────────────
do $$ begin
  if exists (select 1 from cron.job where jobname = 'notifications-cleanup') then
    perform cron.unschedule('notifications-cleanup');
  end if;
end $$;
select cron.schedule('notifications-cleanup', '30 3 * * *', $c$
  do $w$
  declare v_run uuid; v_n int;
  begin
    v_run := cron_run_start('notifications-cleanup');
    begin
      v_n := cleanup_notifications();
      v_n := v_n + cleanup_activity_events();
      perform cron_run_finish(v_run, 'success', null, v_n);
    exception when others then
      perform cron_run_finish(v_run, 'failed', sqlerrm, null);
    end;
  end $w$;
$c$);

-- ── Retention-Cron (neu) + Registrierung im Erwartungs-Katalog ───────────────
insert into cron_expectations (job_name, max_interval_minutes, alert_what, alert_hypothesis, alert_meaning)
values ('cron-runs-cleanup', 1560,
  'Das tägliche Aufräumen der Cron-Lauf-Protokolle ist nicht durchgelaufen.',
  'Kurzer Datenbank-Ausfall oder ein Zugangsproblem.',
  'Die Lauf-Protokolle wachsen vorübergehend an — unkritisch, wird beim nächsten Lauf nachgeholt.')
on conflict (job_name) do nothing;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'cron-runs-cleanup') then
    perform cron.unschedule('cron-runs-cleanup');
  end if;
end $$;
select cron.schedule('cron-runs-cleanup', '15 3 * * *', $c$
  do $w$
  declare v_run uuid; v_n int;
  begin
    v_run := cron_run_start('cron-runs-cleanup');
    begin
      v_n := cleanup_cron_runs();
      perform cron_run_finish(v_run, 'success', null, v_n);
    exception when others then
      perform cron_run_finish(v_run, 'failed', sqlerrm, null);
    end;
  end $w$;
$c$);

-- ── Watchdog-Cron (alle 15 Min). Selbst NICHT im Erwartungs-Katalog (extern überwacht = B-2). ─
do $$ begin
  if exists (select 1 from cron.job where jobname = 'ops-watchdog') then
    perform cron.unschedule('ops-watchdog');
  end if;
end $$;
select cron.schedule('ops-watchdog', '*/15 * * * *', $c$
  do $w$
  declare v_run uuid; v_n int;
  begin
    v_run := cron_run_start('ops-watchdog');
    begin
      v_n := run_watchdog();
      perform cron_run_finish(v_run, 'success', null, v_n);
    exception when others then
      perform cron_run_finish(v_run, 'failed', sqlerrm, null);
    end;
  end $w$;
$c$);
