-- 036_communications.sql
-- Manuell protokollierte Kommunikations-Touchpoints (Email · LinkedIn · Anruf · Meeting).
-- Eigene Tabelle (NICHT audit_log — das bleibt System-/CRUD-Historie). Muster wie products/notes:
-- org_id NOT NULL + RLS (auth_org_id) + CASCADE + audit_write-Trigger.
--
-- Voraussetzung für score_heat_status(): nach jedem INSERT setzt ein Trigger
-- contacts.last_contacted_at auf occurred_at — NUR vorwärts (nie mit älterem Datum überschreiben).
--
-- Automatische Touchpoints (Gmail/Outlook via Nango/P7) landen später in derselben Tabelle.
-- Migration schreiben — `db push` entscheidet der User.
--

create table if not exists communications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  contact_id       uuid not null references contacts(id) on delete cascade,
  occurred_at      timestamptz not null default now(),
  channel          text not null check (channel in ('email', 'linkedin', 'call', 'meeting')),
  direction        text not null check (direction in ('outbound', 'inbound')),
  note             text,                                  -- optional
  created_by       uuid references users(id) on delete set null,  -- optional, [D21] (Auth-Wiring offen)
  created_at       timestamptz default now()
);

-- RLS: Mandanten-Isolation (Muster wie 011/028, auth_org_id()).
alter table communications enable row level security;
create policy "communications_tenant_isolation" on communications
  using (organization_id = auth_org_id());

-- Indizes: org · contact · der Feed-Query (contact + occurred_at DESC).
create index if not exists idx_communications_org      on communications(organization_id);
create index if not exists idx_communications_contact  on communications(contact_id);
create index if not exists idx_communications_feed     on communications(contact_id, occurred_at desc);

-- Audit-Trigger (security-definer audit_write aus 010), konsistent mit tasks/notes/deals.
drop trigger if exists trg_communications_audit on communications;
create trigger trg_communications_audit
  after insert or update or delete on communications
  for each row execute function audit_write();

-- contacts.last_contacted_at fortschreiben — NUR vorwärts (Datenquelle für Heat-Berechnung).
-- security definer: darf contacts trotz RLS aktualisieren (wie audit_write).
create or replace function bump_contact_last_contacted()
returns trigger as $$
begin
  update contacts
     set last_contacted_at = new.occurred_at
   where id = new.contact_id
     and organization_id = new.organization_id
     and (last_contacted_at is null or new.occurred_at > last_contacted_at);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_communications_bump_last_contacted on communications;
create trigger trg_communications_bump_last_contacted
  after insert on communications
  for each row execute function bump_contact_last_contacted();
