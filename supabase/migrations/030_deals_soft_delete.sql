-- 030_deals_soft_delete.sql
-- Soft-Delete für deals: deleted_at gesetzt = gelöscht (ausgeblendet), NULL = aktiv.
-- Muster wie tasks/025 + notes/027. Hält zusätzlich das WANN fest (Historie/Statistik).
-- Additiv, nullable, KEINE Datenänderung. Idempotent: ADD COLUMN IF NOT EXISTS.
-- KEIN neuer Trigger nötig: deals trägt den audit_write-Trigger (trg_deals_audit) bereits aus 010.
-- Reihenfolge zwingend: erst pushen (Spalte live), DANN filtert der Code auf deleted_at —
-- sonst würden Deals beim Filtern lautlos verschwinden. `db push` macht der User.
--

alter table deals add column if not exists deleted_at timestamptz;  -- NULL = aktiv; gesetzt = soft-gelöscht
