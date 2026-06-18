-- 028_products.sql
-- Produkt-Katalog als eigene Tabelle (Stammdaten je Org) — Umsetzung der dokumentierten
-- Architektur-Entscheidung (eigene Tabelle, NICHT system_config/settings).
-- Speist später das Produkt-Dropdown (P5b); deals.product (Freitext) bleibt vorerst bestehen.
-- Muster wie tasks/notes/deals: org_id NOT NULL + RLS + CASCADE + audit_write-Trigger.
-- `description` bewusst optional (nullable): nützlich für spätere Katalog-UI/Auswertung,
-- ohne die Tabelle zu überladen.
-- Additiv + Seed. Idempotent: IF NOT EXISTS + ON CONFLICT DO NOTHING (feste UUIDs).
-- Migration schreiben — `db push` entscheidet der User.
--

create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null,
  description      text,                       -- optional
  is_active        boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz
);

-- RLS: Mandanten-Isolation (Muster wie 011, auth_org_id()).
alter table products enable row level security;
create policy "products_tenant_isolation" on products
  using (organization_id = auth_org_id());

-- Index (org) + Audit-Trigger (security-definer audit_write aus 010), konsistent mit tasks/deals.
create index if not exists idx_products_org on products(organization_id);
drop trigger if exists trg_products_audit on products;
create trigger trg_products_audit
  after insert or update or delete on products
  for each row execute function audit_write();

-- Seed: die 6 Default-Produkte (aus der bisher hardcodierten Frontend-Liste DEAL_PRODUCTS)
-- für die Demo-Org. Feste UUIDs + ON CONFLICT DO NOTHING → idempotent (kein Duplikat bei Re-Run).
insert into products (id, organization_id, name) values
  ('77777777-7777-7777-7777-000000000001', '00000000-0000-0000-0000-000000000001', 'Starter'),
  ('77777777-7777-7777-7777-000000000002', '00000000-0000-0000-0000-000000000001', 'Growth'),
  ('77777777-7777-7777-7777-000000000003', '00000000-0000-0000-0000-000000000001', 'Scale'),
  ('77777777-7777-7777-7777-000000000004', '00000000-0000-0000-0000-000000000001', 'Enterprise'),
  ('77777777-7777-7777-7777-000000000005', '00000000-0000-0000-0000-000000000001', 'Enrichment Add-on'),
  ('77777777-7777-7777-7777-000000000006', '00000000-0000-0000-0000-000000000001', 'Signals Add-on')
on conflict (id) do nothing;
