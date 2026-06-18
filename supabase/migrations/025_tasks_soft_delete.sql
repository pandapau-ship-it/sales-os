-- 025_tasks_soft_delete.sql
-- Soft-Delete für tasks: deleted_at gesetzt = gelöscht (ausgeblendet), NULL = aktiv.
-- Bewusst `deleted_at timestamptz` statt `status='deleted'` (CLAUDE.md-Prosa): hält
-- zusätzlich das WANN fest → Grundlage für Aufgaben-Historie (Aktivität-Tab) + Statistik.
-- Additiv, nullable, KEINE Datenänderung. Idempotent: ADD COLUMN IF NOT EXISTS.
-- Migration schreiben — `db push` macht der User.
--

alter table tasks add column if not exists deleted_at timestamptz;  -- NULL = aktiv; gesetzt = soft-gelöscht
