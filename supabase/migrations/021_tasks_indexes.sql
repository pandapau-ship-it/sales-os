-- 021_tasks_indexes.sql
-- Performance-Indizes auf tasks für den späteren Fällig-Filter
-- (completed_at IS NULL AND due_at <= now()) + Kontakt-/Deal-Bezug (Follow-ups,
-- Neu-in-Pipeline „Keine Task"). org_id führt jede Query (RLS + Filter), darum
-- composite Indizes mit organization_id als Leitspalte. Ergänzen die single-column
-- idx_tasks_* aus 005 (org/contact/deal) — speziell fehlt bisher jeder due_at-Index.
-- Reine Index-Migration: KEINE Datenänderung. Idempotent: CREATE INDEX IF NOT EXISTS.
-- Migration schreiben — `db push` macht der User.
--

create index if not exists idx_tasks_org_due     on tasks(organization_id, due_at);
create index if not exists idx_tasks_org_deal    on tasks(organization_id, deal_id);
create index if not exists idx_tasks_org_contact on tasks(organization_id, contact_id);
