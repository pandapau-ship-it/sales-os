-- 026_contact_phones.sql
-- Mehrfach-Telefonnummern pro Kontakt (PH1 — nur DB-Grundlage; Anzeige/Schreiben = PH2/PH3 mit P8).
-- Eigene Sub-Tabelle (Architektur-Muster wie notes/tasks/lists): org_id NOT NULL + RLS + CASCADE.
-- Einzel-Favorit pro Kontakt via partial unique index. Audit via audit_write-Trigger (wie tasks).
-- Daten-Migration: bestehende contacts.phone als is_primary-Nummer übernehmen (idempotent).
-- contacts.phone BLEIBT als Legacy/Kompatibilität (NICHT droppen — Cleanup = PH4 nach P8).
-- Additiv + reine Daten-Migration. Migration schreiben — `db push` entscheidet der User.
--

create table if not exists contact_phones (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  contact_id       uuid not null references contacts(id) on delete cascade,
  number           text not null,
  label            text,                       -- Mobil | Geschäftlich | Privat | Weitere
  is_primary       boolean default false,
  created_at       timestamptz default now()
);

-- RLS: Mandanten-Isolation (Muster wie 011, auth_org_id()).
alter table contact_phones enable row level security;
create policy "contact_phones_tenant_isolation" on contact_phones
  using (organization_id = auth_org_id());

-- Indizes: org+contact (RLS/Lookup) + max. 1 Favorit pro Kontakt.
create index if not exists idx_contact_phones_org on contact_phones(organization_id, contact_id);
create unique index if not exists uniq_contact_phones_primary on contact_phones(contact_id) where is_primary;

-- Audit: jeder Write landet in audit_log (security-definer audit_write aus 010), wie tasks.
create trigger trg_contact_phones_audit
  after insert or update or delete on contact_phones
  for each row execute function audit_write();

-- Daten-Migration: bestehende Einzel-Nummer → erste/Favorit-Nummer. Idempotent:
-- nur wenn der Kontakt noch keine Telefon-Zeile hat (Re-Run fügt nichts doppelt ein).
insert into contact_phones (organization_id, contact_id, number, is_primary)
select c.organization_id, c.id, c.phone, true
from contacts c
where c.phone is not null
  and c.phone <> ''
  and not exists (select 1 from contact_phones p where p.contact_id = c.id);
