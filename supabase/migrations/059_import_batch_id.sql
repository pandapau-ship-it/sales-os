-- 059_import_batch_id — Schicht 4 der Smart-Import-Engine (K-5, K4/K7).
--
-- Jeder beim Import NEU erstellte Datensatz trägt die Batch-ID → „Import rückgängig" (K4)
-- kann exakt die in diesem Batch erzeugten Zeilen soft-löschen (undoImport). Bestehende,
-- nur verknüpfte/aktualisierte Zeilen tragen die ID NICHT und bleiben beim Undo unberührt.
--
-- Additiv/low-risk: nullable Spalte + FK (on delete set null, damit ein gelöschter Batch
-- die Kontakte nicht mitreißt) + partieller Index (nur importierte Zeilen).

alter table contacts  add column if not exists import_batch_id uuid references import_batches(id) on delete set null;
alter table companies add column if not exists import_batch_id uuid references import_batches(id) on delete set null;

create index if not exists idx_contacts_import_batch  on contacts(import_batch_id)  where import_batch_id is not null;
create index if not exists idx_companies_import_batch on companies(import_batch_id) where import_batch_id is not null;
