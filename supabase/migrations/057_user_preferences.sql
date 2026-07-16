-- 057_user_preferences.sql
-- Persönliche (USER-scoped) Einstellungen — bewusst getrennt von der Org-`settings`-Tabelle
-- (getrennte Besitzer: Org vs. User, saubere Rechte-Prüfung). Trägt jetzt `table_views.contacts`
-- (K-3: Spalten/Reihenfolge/Breiten/Sortierung/Seitengröße pro User), später auch
-- Navigation-Sichtbarkeit (settings_bauplan „Persönlich → Ansicht") + Chat-Präferenzen (C24).
-- Einmal bauen, dreimal nutzen. `db push` entscheidet der User.

create table if not exists user_preferences (
  user_id          uuid not null references users(id) on delete cascade,
  organization_id  uuid not null references organizations(id) on delete cascade,
  key              text not null,               -- z.B. 'table_views.contacts'
  value            jsonb not null default '{}',
  updated_at       timestamptz default now(),
  primary key (user_id, key)                    -- eine Zeile pro (User, Key)
);

create index if not exists idx_user_preferences_org on user_preferences(organization_id);

-- updated_at automatisch (Funktion aus 010).
create trigger trg_user_preferences_updated_at before update on user_preferences for each row execute function update_updated_at();

-- Bewusst KEIN audit_write-Trigger: reiner persönlicher UI-State (kein Geschäfts-Write), und
-- audit_write() referenziert new.id — die gibt es hier nicht (Composite-PK). org_isolation +
-- own-row-RLS genügen.

-- RLS: nur eigene Zeilen (user_id = auth.uid()) UND innerhalb der eigenen Org.
-- users.id == auth.uid() (db_schema_v3: „id = Supabase Auth UID"). auth_org_id() aus 011.
alter table user_preferences enable row level security;
create policy "user_preferences_own" on user_preferences
  using (user_id = auth.uid() and organization_id = auth_org_id());
