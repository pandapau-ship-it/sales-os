-- 065_notifications_foundation.sql
-- Mitteilungs-Fundament N-S1 (docs/mitteilungssystem_bauplan_v1.md) — Tabellen + Idempotenz + RLS + Realtime + Seeds.
-- Additiv. category/source_type sind bewusst TEXT (KEIN enum/CHECK) → neue Quellen = nur Daten,
-- keine Migration (Zukunftsfähigkeits-Diagnose Punkt 2). Registry der bekannten Werte: src/lib/notifications.ts.
--
-- WICHTIG (Diagnose Punkt 5): der Idempotenz-/Update-Key enthält user_id — sonst würden
-- Mehr-Empfänger-Mitteilungen (eine Freigabe-Anfrage an mehrere Admins) fälschlich in EINE Zeile
-- zusammenfallen. source_id ist NOT NULL (Konvention: jeder Erzeuger liefert eine stabile ID).

-- ── notifications — user-gerichtete Mitteilungen (Glocke) ─────────────────────
create table notifications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid not null references users(id) on delete cascade,  -- Empfänger
  category         text not null,                    -- Registry (src/lib/notifications.ts), KEIN enum
  severity         text not null default 'normal',   -- low | normal | high | urgent (Registry)
  title            text not null,
  body             text,
  link             text,
  source_type      text not null,                    -- Namespace des Erzeugers (Registry)
  source_id        text not null,                    -- stabile ID des Quell-Objekts — NIE null (Kollisionsschutz)
  read_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Idempotenz-/Update-Key (N12) — MIT user_id (Diagnose Punkt 5). Gleiche Quelle+Kategorie+User
-- → dieselbe Zeile (Update), unterschiedliche User → getrennte Zeilen.
create unique index uq_notifications_idem
  on notifications (organization_id, user_id, source_type, source_id, category);

-- Pflicht-Indizes (Diagnose Punkt 3):
-- Badge-Count je User (nur Ungelesenes) — partiell:
create index idx_notifications_unread
  on notifications (organization_id, user_id) where read_at is null;
-- Verlauf / spätere AI-Chat-Abfragen:
create index idx_notifications_created
  on notifications (organization_id, created_at desc);

alter table notifications enable row level security;
-- User sieht nur die eigenen Mitteilungen (org-scoped + user-scoped).
create policy "notifications_own" on notifications
  using (organization_id = auth_org_id() and user_id = auth.uid());

-- ── activity_events — org-weiter Ambient-Feed (N3, gebündelt) ─────────────────
create table activity_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  event_type       text not null,                    -- Registry (src/lib/notifications.ts)
  summary          text not null,                    -- gebündelter Text ("3 Mails aus 'X' versendet")
  count            int not null default 1,           -- Bündelung pro Lauf/Batch
  link             text,
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index idx_activity_events_occurred
  on activity_events (organization_id, occurred_at desc);

alter table activity_events enable row level security;
create policy "activity_events_tenant_isolation" on activity_events
  using (organization_id = auth_org_id());

-- ── settings.notifications — Matrix Kategorie × Kanal (N6), additiv wie 064 ────
-- In-App ist IMMER an (nicht gespeichert). Gespeichert: E-Mail-Modus pro Kategorie + activity_feed.
alter table settings add column if not exists notifications jsonb default '{}'::jsonb;

update settings
set notifications = jsonb_build_object(
  'activity_feed', true,
  'email', jsonb_build_object(
    'approval',     'instant',   -- Braucht dich (Freigaben)
    'credit',       'instant',   -- Braucht dich (Geld)
    'system_alert', 'instant',   -- System (kritische Alarme, nie ganz abschaltbar)
    'job_result',   'digest',    -- System
    'report',       'digest',    -- Berichte
    'team',         'digest',    -- Team
    'mailbox',      'digest'     -- System (Warmup/Nudge)
  )
)
where not (coalesce(notifications, '{}'::jsonb) ? 'email');

-- ── Realtime DB-seitig aktivieren (Diagnose-Konsequenz 1) ─────────────────────
-- Damit die Akzeptanz "notify() erzeugt Realtime-Event" greift. Client-Channel = N-S2.
-- Idempotent: nur hinzufügen, wenn Publication existiert und Tabelle noch nicht Mitglied ist.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
     )
  then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
