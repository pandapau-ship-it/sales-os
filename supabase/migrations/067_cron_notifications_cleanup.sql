-- 067_cron_notifications_cleanup.sql
-- Retention für Mitteilungen + Ambient-Feed. Grundlage: mitteilungssystem_bauplan_v1 N3/N13.
-- "Archivierung" aus dem Bauplan wird hier EXPLIZIT als DELETE definiert (keine Archiv-Tabelle —
-- das wäre ein Phantom-Feature ohne Nutzer-Fläche). Muster wie 063 (DB-interne Funktion + pg_cron).
-- Falls je eine echte Archiv-Ansicht gewünscht: additives Deferred, nicht jetzt.

-- Gelesene Mitteilungen älter als 90 Tage löschen (Verlauf-Tab deckt 90T, N13).
-- Ungelesenes bleibt IMMER erhalten (kein read_at → nie gelöscht).
create or replace function cleanup_notifications()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from notifications
   where read_at is not null
     and read_at < now() - interval '90 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Ambient-Feed-Einträge älter als 30 Tage löschen (N3, Retention 30 Tage).
create or replace function cleanup_activity_events()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from activity_events
   where occurred_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Täglicher Cron (03:30 UTC). Beide Retentions in einem Lauf. Idempotent (fenster-basiertes DELETE).
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'notifications-cleanup') then
    perform cron.unschedule('notifications-cleanup');
  end if;
end $$;

select cron.schedule(
  'notifications-cleanup',
  '30 3 * * *',
  $$ select cleanup_notifications(); select cleanup_activity_events(); $$
);
