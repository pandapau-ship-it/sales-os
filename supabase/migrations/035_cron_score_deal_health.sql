-- 035_cron_score_deal_health.sql
-- Täglicher Cron (02:00 UTC), der die Edge Function score-deal-health anstößt → Stagnation neu berechnen.
-- Voraussetzungen: Extensions pg_cron + pg_net; Secrets im Supabase Vault (Dashboard → Integrations → Vault):
--   'app_supabase_url' (= Projekt-URL) + 'app_service_role_key' (= Service-Role-Key).
-- Vault-Methode statt GUC (current_setting → permission denied auf Hosted Supabase).
-- Idempotent: bestehenden Job vorher entplanen, dann neu planen.

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
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_supabase_url') || '/functions/v1/score-deal-health',
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
