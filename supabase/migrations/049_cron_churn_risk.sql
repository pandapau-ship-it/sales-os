-- 049_cron_churn_risk.sql
-- Täglicher Cron (04:00 UTC, eine Stunde nach score-heat-status), der die Edge Function
-- score-churn-risk anstößt → contacts.churn_score (+ score_drivers, data_sources) neu berechnen.
-- Voraussetzungen: Extensions pg_cron + pg_net; Secrets im Supabase Vault (Dashboard → Integrations → Vault):
--   'app_supabase_url' (= Projekt-URL) + 'app_service_role_key' (= Service-Role-Key).
-- Vault-Methode statt GUC (current_setting → permission denied auf Hosted Supabase), wie 035/037.
-- Idempotent: bestehenden Job vorher entplanen, dann neu planen.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- bestehenden Job (gleicher Name) entfernen, damit Re-Run nicht doppelt plant
do $$
begin
  if exists (select 1 from cron.job where jobname = 'score-churn-risk-daily') then
    perform cron.unschedule('score-churn-risk-daily');
  end if;
end $$;

select cron.schedule(
  'score-churn-risk-daily',
  '0 4 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_supabase_url') || '/functions/v1/score-churn-risk',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'app_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'organizationId', '00000000-0000-0000-0000-000000000001'
    )
  );
  $$
);
