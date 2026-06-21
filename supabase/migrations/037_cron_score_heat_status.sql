-- 037_cron_score_heat_status.sql
-- Täglicher Cron (03:00 UTC, eine Stunde nach score-deal-health), der die Edge Function
-- score-heat-status anstößt → contacts.heat_status aus last_contacted_at neu berechnen.
-- Voraussetzungen: Extensions pg_cron + pg_net; Secrets im Supabase Vault (Dashboard → Integrations → Vault):
--   'app_supabase_url' (= Projekt-URL) + 'app_service_role_key' (= Service-Role-Key).
-- Vault-Methode statt GUC (current_setting → permission denied auf Hosted Supabase), wie 035.
-- Idempotent: bestehenden Job vorher entplanen, dann neu planen.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- bestehenden Job (gleicher Name) entfernen, damit Re-Run nicht doppelt plant
do $$
begin
  if exists (select 1 from cron.job where jobname = 'score-heat-status-daily') then
    perform cron.unschedule('score-heat-status-daily');
  end if;
end $$;

select cron.schedule(
  'score-heat-status-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_supabase_url') || '/functions/v1/score-heat-status',
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
