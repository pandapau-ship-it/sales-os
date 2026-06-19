-- 027_notes_edit_softdelete_audit.sql
-- notes: Soft-Delete + „bearbeitet am" + Audit (P4b).
--   deleted_at  → Soft-Delete (NULL = aktiv, gesetzt = gelöscht; Muster wie tasks/025).
--   updated_at  → „bearbeitet am" (notes hatte das nicht); wird in updateNote explizit gesetzt.
--   trg_notes_audit → schließt die bekannte Lücke (notes war bisher OHNE Audit-Trigger),
--     jetzt konsistent mit tasks (security-definer audit_write aus 010). Eine Zeile, kein Aufblähen.
-- Additiv, keine Datenänderung. Idempotent: ADD COLUMN IF NOT EXISTS + DROP/CREATE TRIGGER.
-- Migration schreiben — `db push` entscheidet der User.
--

alter table notes add column if not exists deleted_at timestamptz;  -- NULL = aktiv; gesetzt = soft-gelöscht
alter table notes add column if not exists updated_at timestamptz;  -- „bearbeitet am" (in updateNote gesetzt)

drop trigger if exists trg_notes_audit on notes;
create trigger trg_notes_audit
  after insert or update or delete on notes
  for each row execute function audit_write();
