-- 066_notifications_functions.sql
-- Zentrale Erzeuger-Helfer als Postgres-Funktionen (aufrufbar von SQL-Cron, Edge UND Frontend-RPC
-- = EINE Quelle, analog consume_credits). Grundlage: mitteilungssystem_bauplan_v1 N10/N12.

-- ── notify(...) — schreibt user-gerichtete Mitteilung(en), idempotent (N12) ───
-- Empfänger: explizite p_user_ids ODER Rollen-Fanout (p_role, alle mit Rolle in der Org).
-- Kanal-FAN-OUT (E-Mail/Push/Slack) ist bewusst NICHT hier: notify() schreibt NUR die In-App-Zeile
-- (Single Source), der Fan-out liest später die Matrix settings.notifications (N-S4). Prinzip
-- "Zeile schreiben → danach Fan-out" (Zukunftsfähigkeits-Diagnose Punkt 4) — Kanäle docken an,
-- ohne notify() umzubauen.
-- category/source_type werden NICHT gegen ein Enum geprüft (Punkt 2: neue Werte = nur Daten).
create or replace function notify(
  p_org          uuid,
  p_category     text,
  p_severity     text,
  p_title        text,
  p_body         text,
  p_link         text,
  p_source_type  text,
  p_source_id    text,
  p_user_ids     uuid[] default null,
  p_role         text   default null
)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipients uuid[];
begin
  -- Konvention (Diagnose Punkt 5): stabile source_id ist Pflicht — sonst Kollision im Idempotenz-Key.
  if p_source_id is null or p_source_id = '' then
    raise exception 'notify(): source_id ist Pflicht (Kollisionsschutz Idempotenz-Key)';
  end if;

  if p_user_ids is not null and array_length(p_user_ids, 1) is not null then
    v_recipients := p_user_ids;
  elsif p_role is not null then
    select coalesce(array_agg(id), '{}') into v_recipients
    from users where organization_id = p_org and role = p_role;
  else
    raise exception 'notify(): entweder p_user_ids oder p_role angeben';
  end if;

  -- Eine In-App-Zeile je (dedupliziertem) Empfänger. N12: gleiche
  -- (org,user,source_type,source_id,category) → Update + wieder ungelesen, nie zweite Zeile.
  return query
  insert into notifications (organization_id, user_id, category, severity, title, body, link, source_type, source_id)
  select p_org, r.u, p_category, coalesce(p_severity, 'normal'), p_title, p_body, p_link, p_source_type, p_source_id
  from (select distinct u from unnest(v_recipients) as u where u is not null) r
  on conflict (organization_id, user_id, source_type, source_id, category)
  do update set
    title      = excluded.title,
    body       = excluded.body,
    link       = excluded.link,
    severity   = excluded.severity,
    read_at    = null,
    updated_at = now()
  returning id;
end;
$$;

-- ── log_activity(...) — org-weiter Ambient-Feed-Eintrag (N3) ──────────────────
-- Ein Eintrag pro Lauf/Batch (Bündelung passiert im Erzeuger, nicht hier). Append (keine Idempotenz).
create or replace function log_activity(
  p_org        uuid,
  p_event_type text,
  p_summary    text,
  p_count      int  default 1,
  p_link       text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into activity_events (organization_id, event_type, summary, count, link)
  values (p_org, p_event_type, p_summary, coalesce(p_count, 1), p_link)
  returning id into v_id;
  return v_id;
end;
$$;
