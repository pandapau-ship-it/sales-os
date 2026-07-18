-- 058 — Soft-Delete für contacts + companies.
-- Konzept: CLAUDE.md Admin-Regeln ("never delete, only set deleted") + ai_chat_bauplan C5.
-- Bewusst JETZT ohne Rollenprüfung/Papierkorb-UI (→ Settings SET-1/SET-3, [D-delete-rights]).
-- Kein Hard-Delete: Objekte bleiben in der DB (kein Datenverlust), Queries filtern deleted_at IS NULL.

alter table contacts  add column if not exists deleted_at timestamptz;                      -- NULL = aktiv
alter table contacts  add column if not exists deleted_by uuid references users(id);         -- wer gelöscht hat
alter table companies add column if not exists deleted_at timestamptz;
alter table companies add column if not exists deleted_by uuid references users(id);

-- Partielle Indizes: alle Listen-/Detail-/Such-Queries filtern deleted_at IS NULL
-- (Perf-Regel „Soft-Delete: deleted_at-Index Pflicht").
create index if not exists idx_contacts_not_deleted  on contacts  (organization_id) where deleted_at is null;
create index if not exists idx_companies_not_deleted on companies (organization_id) where deleted_at is null;

-- audit_write(): Soft-Delete (deleted_at NULL → gesetzt) als delete_<table> loggen statt update_<table>.
-- Generisch über to_jsonb → KEIN direkter Feldzugriff (sicher für Tabellen ohne deleted_at-Spalte).
-- Ersetzt die Funktion aus 010 unverändert bis auf die Soft-Delete-Erkennung; alle Trigger bleiben.
create or replace function audit_write()
returns trigger as $$
declare
  v_org uuid;
  v_id  uuid;
  v_action text;
begin
  if (tg_op = 'DELETE') then
    v_org := old.organization_id;
    v_id  := old.id;
  else
    v_org := new.organization_id;
    v_id  := new.id;
  end if;

  if (tg_op = 'UPDATE'
      and (to_jsonb(old) ->> 'deleted_at') is null
      and (to_jsonb(new) ->> 'deleted_at') is not null) then
    v_action := 'delete_' || tg_table_name;                 -- Soft-Delete → Delete-Semantik
  else
    v_action := lower(tg_op) || '_' || tg_table_name;        -- unverändert (insert_/update_/delete_)
  end if;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (
    v_org,
    auth.uid(),                                  -- null bei System-/AI-Aktionen
    v_action,
    tg_table_name,
    v_id,
    jsonb_build_object('op', tg_op)
  );

  if (tg_op = 'DELETE') then return old; else return new; end if;
end;
$$ language plpgsql security definer;
