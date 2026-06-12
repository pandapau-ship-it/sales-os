-- 011_rls_policies.sql
-- Row Level Security: jede Tabelle aktivieren + Tenant-Isolation-Policy.
--
-- Hilfsfunktion auth_org_id() (security definer) liefert die organization_id des
-- aktuellen Users OHNE RLS-Rekursion auf users (der Inline-Subselect aus dem Paket
-- würde sich auf der users-Policy selbst rekursiv aufrufen).
create or replace function auth_org_id()
returns uuid as $$
  select organization_id from users where id = auth.uid();
$$ language sql stable security definer;

-- ── Tenant-Isolation (alle Tabellen mit organization_id) ─────────────────────
-- Ohne WITH CHECK gilt die USING-Bedingung auch für INSERT (Postgres-Default).

alter table users enable row level security;
create policy "users_tenant_isolation" on users using (organization_id = auth_org_id());

alter table contacts enable row level security;
create policy "contacts_tenant_isolation" on contacts using (organization_id = auth_org_id());

alter table companies enable row level security;
create policy "companies_tenant_isolation" on companies using (organization_id = auth_org_id());

alter table campaigns enable row level security;
create policy "campaigns_tenant_isolation" on campaigns using (organization_id = auth_org_id());

alter table sequences enable row level security;
create policy "sequences_tenant_isolation" on sequences using (organization_id = auth_org_id());

alter table leads enable row level security;
create policy "leads_tenant_isolation" on leads using (organization_id = auth_org_id());

alter table messages enable row level security;
create policy "messages_tenant_isolation" on messages using (organization_id = auth_org_id());

alter table signals enable row level security;
create policy "signals_tenant_isolation" on signals using (organization_id = auth_org_id());

alter table deals enable row level security;
create policy "deals_tenant_isolation" on deals using (organization_id = auth_org_id());

alter table tasks enable row level security;
create policy "tasks_tenant_isolation" on tasks using (organization_id = auth_org_id());

alter table notes enable row level security;
create policy "notes_tenant_isolation" on notes using (organization_id = auth_org_id());

alter table lists enable row level security;
create policy "lists_tenant_isolation" on lists using (organization_id = auth_org_id());

alter table automation_rules enable row level security;
create policy "automation_rules_tenant_isolation" on automation_rules using (organization_id = auth_org_id());

alter table sequence_rules enable row level security;
create policy "sequence_rules_tenant_isolation" on sequence_rules using (organization_id = auth_org_id());

alter table settings enable row level security;
create policy "settings_tenant_isolation" on settings using (organization_id = auth_org_id());

alter table audit_log enable row level security;
create policy "audit_log_tenant_isolation" on audit_log using (organization_id = auth_org_id());

alter table mailboxes enable row level security;
create policy "mailboxes_tenant_isolation" on mailboxes using (organization_id = auth_org_id());

alter table churn_rules enable row level security;
create policy "churn_rules_tenant_isolation" on churn_rules using (organization_id = auth_org_id());

alter table upsell_rules enable row level security;
create policy "upsell_rules_tenant_isolation" on upsell_rules using (organization_id = auth_org_id());

alter table user_permissions enable row level security;
create policy "user_permissions_tenant_isolation" on user_permissions using (organization_id = auth_org_id());

alter table daily_briefings enable row level security;
create policy "daily_briefings_tenant_isolation" on daily_briefings using (organization_id = auth_org_id());

alter table scheduled_tasks enable row level security;
create policy "scheduled_tasks_tenant_isolation" on scheduled_tasks using (organization_id = auth_org_id());

alter table organization_subscription enable row level security;
create policy "org_subscription_tenant_isolation" on organization_subscription using (organization_id = auth_org_id());

alter table credit_balance enable row level security;
create policy "credit_balance_tenant_isolation" on credit_balance using (organization_id = auth_org_id());

alter table credit_transactions enable row level security;
create policy "credit_transactions_tenant_isolation" on credit_transactions using (organization_id = auth_org_id());

alter table addons enable row level security;
create policy "addons_tenant_isolation" on addons using (organization_id = auth_org_id());

alter table chat_sessions enable row level security;
create policy "chat_sessions_tenant_isolation" on chat_sessions using (organization_id = auth_org_id());

alter table custom_dashboards enable row level security;
create policy "custom_dashboards_tenant_isolation" on custom_dashboards using (organization_id = auth_org_id());

-- ── Sonderfall: organizations — User sieht nur die eigene Org ────────────────
alter table organizations enable row level security;
create policy "organizations_self" on organizations using (id = auth_org_id());

-- ── Sonderfall: chat_messages — kein organization_id, Bezug über Session ─────
alter table chat_messages enable row level security;
create policy "chat_messages_via_session" on chat_messages
  using (session_id in (select id from chat_sessions where organization_id = auth_org_id()));

-- ── Sonderfall: globale Tabellen — öffentlich lesbar, Writes nur via Admin/Seed
alter table plans enable row level security;
create policy "plans_public_read" on plans for select using (true);

alter table plan_limits enable row level security;
create policy "plan_limits_public_read" on plan_limits for select using (true);

alter table blacklisted_domains enable row level security;
create policy "blacklisted_domains_public_read" on blacklisted_domains for select using (true);
