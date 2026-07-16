-- 056_k1b_daten_fundament.sql
-- K-1b — Daten-Fundament für Kontakte & Companies (docs/kontakte_companies_bauplan_v1.md, SLICE K-1).
-- Additiv + eine strukturelle Ablösung. `db push` entscheidet der User (kein Auto-Push).
--
-- Enthält:
--  1) contacts.assigned_to + created_by (Ownership — K9 Lead-Assignment + SaaS-Readiness)
--  2) list_members (Join-Tabelle) — LÖST die Array-Spalte lists.contact_ids AB (Migration 005).
--     Kanonische Schema-Referenz nennt eine Join-Tabelle; FK+CASCADE verhindert verwaiste
--     Mitgliedschaften, K-6-Merge zieht Mitgliedschaften automatisch mit.
--  3) import_batches + import_templates (K4 rückholbarer Import, K5 Vorlagen-Wiedererkennung)
--  4) settings.lead_assignment_strategy (K9 — org-konfigurierbar, Default round_robin)
--
-- Muster gespiegelt aus 010 (update_updated_at / audit_write) + 011 (auth_org_id RLS).

-- ── 1) contacts: Ownership-Felder ────────────────────────────────────────────
-- assigned_to = verantwortlicher Owner (K9). created_by = wer angelegt hat (SaaS-Readiness).
-- on delete set null: User-Löschung verwaist den Kontakt nicht.
alter table contacts add column if not exists assigned_to uuid references users(id) on delete set null;
alter table contacts add column if not exists created_by  uuid references users(id) on delete set null;

create index if not exists idx_contacts_assigned   on contacts(organization_id, assigned_to);
create index if not exists idx_contacts_created_by on contacts(created_by);

-- ── 2) list_members — Join-Tabelle (löst lists.contact_ids ab) ────────────────
-- Eigene id, weil audit_write() new.id referenziert; unique(list_id, contact_id) hält
-- die Mitgliedschaft eindeutig. organization_id für RLS + Tenant-Isolation.
create table if not exists list_members (
  id               uuid primary key default gen_random_uuid(),
  list_id          uuid not null references lists(id)    on delete cascade,
  contact_id       uuid not null references contacts(id) on delete cascade,
  organization_id  uuid not null references organizations(id) on delete cascade,
  added_at         timestamptz default now(),
  unique (list_id, contact_id)
);

create index if not exists idx_list_members_list    on list_members(list_id);
create index if not exists idx_list_members_contact on list_members(contact_id);
create index if not exists idx_list_members_org     on list_members(organization_id);

-- Bestehende Array-Mitgliedschaften verlustfrei übernehmen, dann die Spalte entfernen.
-- Nur auf real existierende Kontakte (verwaiste Array-UUID würde sonst den FK verletzen und
-- die Migration abbrechen; on conflict fängt nur (list_id, contact_id)-Dubletten).
insert into list_members (list_id, contact_id, organization_id)
select l.id, c.id, l.organization_id
from lists l, unnest(l.contact_ids) as c_id
join contacts c on c.id = c_id
where l.contact_ids is not null
on conflict (list_id, contact_id) do nothing;

alter table lists drop column if exists contact_ids;

-- ── 3) import_templates + import_batches ─────────────────────────────────────
-- templates zuerst (import_batches referenziert sie).
-- source_signature = normalisierte Header-Signatur → zweiter Import derselben Struktur
-- erkennt die Vorlage wieder (K5-Akzeptanz).
create table if not exists import_templates (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  created_by        uuid references users(id) on delete set null,
  name              text not null,
  source_signature  text,                      -- normalisierte Header-Signatur zum Wiedererkennen
  mapping           jsonb not null default '{}', -- {sourceHeader: targetField}
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_import_templates_org        on import_templates(organization_id);
create index if not exists idx_import_templates_sig        on import_templates(organization_id, source_signature);
create index if not exists idx_import_templates_created_by on import_templates(created_by);

-- import_batches: jeder Import = ein Batch; erzeugte Datensätze tragen import_batch_id
-- (Spalte kommt mit dem Import-Slice K-5 an contacts/companies). undo_until = created_at + 7T (K4).
-- Zähler = echte Zahlen für den Import-Report (K8, keine Rundungen).
create table if not exists import_batches (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  created_by        uuid references users(id) on delete set null,
  source            text,                      -- csv_upload | excel | crm_sync | api
  filename          text,
  template_id       uuid references import_templates(id) on delete set null,
  status            text default 'completed',  -- completed | undone
  rows_created      int default 0,
  rows_updated      int default 0,             -- aktualisiert/zusammengeführt
  rows_skipped      int default 0,             -- Duplikat übersprungen
  rows_failed       int default 0,
  undo_until        timestamptz,               -- created_at + 7 Tage (K4 rückholbar)
  undone_at         timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_import_batches_org        on import_batches(organization_id, created_at);
create index if not exists idx_import_batches_created_by on import_batches(created_by);
create index if not exists idx_import_batches_template   on import_batches(template_id);

-- ── 4) settings.lead_assignment_strategy (K9) ────────────────────────────────
-- Org-konfigurierbar, laufzeit-gelesen (D51). Default round_robin unter aktiven Sales-Rollen.
-- Erweiterte Strategien (by_region | by_source | manual_only) = spätere Settings-Erweiterung.
-- add column mit default backfüllt bestehende settings-Zeilen automatisch auf 'round_robin'.
alter table settings add column if not exists lead_assignment_strategy text default 'round_robin';

-- ── updated_at-Trigger (neue Tabellen mit updated_at) ────────────────────────
create trigger trg_import_templates_updated_at before update on import_templates for each row execute function update_updated_at();
create trigger trg_import_batches_updated_at    before update on import_batches    for each row execute function update_updated_at();

-- ── Audit-Trigger (jeder Write landet in audit_log) ──────────────────────────
create trigger trg_list_members_audit     after insert or update or delete on list_members     for each row execute function audit_write();
create trigger trg_import_templates_audit  after insert or update or delete on import_templates for each row execute function audit_write();
create trigger trg_import_batches_audit    after insert or update or delete on import_batches   for each row execute function audit_write();

-- ── RLS (Tenant-Isolation, Muster aus 011) ───────────────────────────────────
alter table list_members enable row level security;
create policy "list_members_tenant_isolation" on list_members using (organization_id = auth_org_id());

alter table import_templates enable row level security;
create policy "import_templates_tenant_isolation" on import_templates using (organization_id = auth_org_id());

alter table import_batches enable row level security;
create policy "import_batches_tenant_isolation" on import_batches using (organization_id = auth_org_id());
