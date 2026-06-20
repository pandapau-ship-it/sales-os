-- 035_cron_score_deal_health.sql
-- Täglicher Cron (02:00 UTC), der die Edge Function score-deal-health anstößt → Stagnation neu berechnen.
-- Voraussetzungen: Extensions pg_cron + pg_net; GUCs app.supabase_url + app.service_role_key gesetzt
--   (alter database … set app.supabase_url = '…'; alter database … set app.service_role_key = '…';).
-- Idempotent: bestehenden Job vorher entplanen, dann neu planen. NICHT pushen ohne gesetzte GUCs/Extensions.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- bestehenden Job (gleicher Name) entfernen, damit Re-Run nicht doppelt plant
do $$
begin
  if exists (select 1 from cron.job where jobname = 'score-deal-health-daily') then
    perform cron.unschedule('score-deal-health-daily');
  end if;
end $$;

select cron.schedule(
  'score-deal-health-daily',
  '0 2 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/score-deal-health',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'organizationId', '00000000-0000-0000-0000-000000000001'
    )
  );
  $$
);
