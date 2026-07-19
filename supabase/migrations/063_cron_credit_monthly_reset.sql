-- 063_cron_credit_monthly_reset.sql
-- Monats-Reset der Credit-Verbräuche. Grundlage: docs/for_ai_sdr_vorab_entitlement_credits.md §6.
-- Beim internen Plan reine Formsache — läuft trotzdem, damit der Mechanismus ab Tag 1 bewiesen ist.
-- Cron-Muster wie 035/037/049/051, hier aber DB-intern (kein Edge-Call nötig).

-- Reset-Funktion: setzt used_this_period=0 und rollt resets_at um einen Monat weiter —
-- NUR für fällige Zeilen (resets_at <= now()). Dadurch idempotent: ein zweiter Lauf am
-- selben Tag findet keine fälligen Zeilen mehr → kein Doppel-Reset. Gibt die Anzahl
-- zurückgesetzter Zeilen zurück (für manuelle Auslösung / QA Akzeptanz #7).
create or replace function reset_credit_balances()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update credit_balance
     set used_this_period = 0,
         resets_at = resets_at + interval '1 month'
   where resets_at is not null
     and resets_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Cron: täglich 03:00 UTC. Läuft täglich, setzt aber nur fällige Perioden zurück
-- (Guard resets_at <= now()) → verträgt beliebige resets_at-Termine, bleibt idempotent.
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'credit-monthly-reset') then
    perform cron.unschedule('credit-monthly-reset');
  end if;
end $$;

select cron.schedule(
  'credit-monthly-reset',
  '0 3 * * *',
  $$ select reset_credit_balances(); $$
);
