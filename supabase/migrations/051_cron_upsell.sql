-- 051_cron_upsell.sql
-- Täglicher Cron (05:00 UTC, nach score-churn-risk 04:00), der die Edge Function score-upsell anstößt
-- → contacts.upsell_score (+ upsell_drivers) neu berechnen.
-- Voraussetzungen: Extensions pg_cron + pg_net; Secrets im Supabase Vault:
--   'app_supabase_url' + 'app_service_role_key'. Vault-Methode wie 035/037/049. Idempotent.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'score-upsell-daily') then
    perform cron.unschedule('score-upsell-daily');
  end if;
end $$;

select cron.schedule(
  'score-upsell-daily',
  '0 5 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_supabase_url') || '/functions/v1/score-upsell',
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
