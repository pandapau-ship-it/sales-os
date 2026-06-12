-- 010_indexes_triggers.sql
-- Trigger: updated_at automatisch + Audit-Log bei jedem Write der Kern-Entitäten.
-- (Tabellen-spezifische Indexe liegen jeweils in ihrer Migration.)

-- ── updated_at — einmal definieren, überall nutzen ───────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger NUR für Tabellen, die eine updated_at-Spalte haben (db_schema_v3):
create trigger trg_contacts_updated_at        before update on contacts        for each row execute function update_updated_at();
create trigger trg_companies_updated_at       before update on companies       for each row execute function update_updated_at();
create trigger trg_campaigns_updated_at       before update on campaigns       for each row execute function update_updated_at();
create trigger trg_sequences_updated_at       before update on sequences       for each row execute function update_updated_at();
create trigger trg_leads_updated_at           before update on leads           for each row execute function update_updated_at();
create trigger trg_deals_updated_at           before update on deals           for each row execute function update_updated_at();
create trigger trg_lists_updated_at           before update on lists           for each row execute function update_updated_at();
create trigger trg_settings_updated_at        before update on settings        for each row execute function update_updated_at();
create trigger trg_scheduled_tasks_updated_at before update on scheduled_tasks for each row execute function update_updated_at();

-- ── Audit-Log — jeder Write der Kern-Entitäten landet in audit_log ───────────
-- security definer, damit der Insert in audit_log unabhängig von RLS gelingt.
create or replace function audit_write()
returns trigger as $$
declare
  v_org uuid;
  v_id  uuid;
begin
  if (tg_op = 'DELETE') then
    v_org := old.organization_id;
    v_id  := old.id;
  else
    v_org := new.organization_id;
    v_id  := new.id;
  end if;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (
    v_org,
    auth.uid(),                                  -- null bei System-/AI-Aktionen
    lower(tg_op) || '_' || tg_table_name,        -- z.B. insert_contacts
    tg_table_name,
    v_id,
    jsonb_build_object('op', tg_op)
  );

  if (tg_op = 'DELETE') then return old; else return new; end if;
end;
$$ language plpgsql security definer;

-- Audit-Trigger für die mutierbaren Kern-Entitäten (nicht audit_log selbst):
create trigger trg_contacts_audit  after insert or update or delete on contacts  for each row execute function audit_write();
create trigger trg_companies_audit after insert or update or delete on companies for each row execute function audit_write();
create trigger trg_deals_audit     after insert or update or delete on deals     for each row execute function audit_write();
create trigger trg_leads_audit     after insert or update or delete on leads     for each row execute function audit_write();
create trigger trg_campaigns_audit after insert or update or delete on campaigns for each row execute function audit_write();
create trigger trg_tasks_audit     after insert or update or delete on tasks     for each row execute function audit_write();
create trigger trg_lists_audit     after insert or update or delete on lists     for each row execute function audit_write();
create trigger trg_settings_audit  after insert or update or delete on settings  for each row execute function audit_write();
