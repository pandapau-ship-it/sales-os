-- 008_billing_tables.sql
-- Billing: plans + plan_limits (global) + organization_subscription + credits + addons.
-- Maßgeblich: docs/sales_os_db_schema_v3.md
-- Hinweis: plans/plan_limits sind GLOBAL (keine organization_id) — öffentlich lesbar.

-- ── plans — global, alle Tenants teilen die Plan-Katalog-Tabelle ─────────────
create table plans (
  id                uuid primary key default gen_random_uuid(),
  name              text,                     -- trial | starter | growth | scale
  price_monthly     int,                      -- in Cent
  price_yearly      int,
  base_seats        int,
  extra_seat_price  int,
  stripe_price_id   text,
  created_at        timestamptz default now()
);

-- ── plan_limits — global (pro Plan), öffentlich lesbar ───────────────────────
create table plan_limits (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid references plans(id) on delete cascade,
  feature      text,                          -- contacts | campaigns | mailboxes | ai_credits ...
  limit_value  int,                           -- -1 = unbegrenzt
  created_at   timestamptz default now()
);

-- ── organization_subscription — aktuelle Subscription pro Org ────────────────
create table organization_subscription (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references organizations(id) on delete cascade,
  plan_id                 uuid references plans(id) on delete set null,
  status                  text,               -- trial | active | past_due | cancelled
  trial_ends_at           timestamptz,
  current_period_end      timestamptz,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at              timestamptz default now()
);

-- ── credit_balance — Inklusiv-/Kauf-Kontingente pro Org & Credit-Typ ─────────
create table credit_balance (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  credit_type       text,                     -- ai | enrichment | email_verification
  included_monthly  int,
  purchased         int,
  used_this_period  int,
  resets_at         timestamptz,
  created_at        timestamptz default now()
);

-- ── credit_transactions — Verbrauch/Kauf-Log ─────────────────────────────────
create table credit_transactions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  credit_type      text,
  amount           int,                       -- negativ = verbraucht, positiv = gekauft
  reason           text,                      -- message_generation | enrichment | purchase
  reference_id     uuid,
  created_at       timestamptz default now()
);

-- ── addons — zugebuchte Module pro Org ───────────────────────────────────────
create table addons (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  addon_type       text,                      -- sherloq_signals | extra_mailbox | crm_sync
  status           text,
  price            int,
  activated_at     timestamptz,
  created_at       timestamptz default now()
);

create index idx_plan_limits_plan        on plan_limits(plan_id);
create index idx_org_subscription_org    on organization_subscription(organization_id);
create index idx_credit_balance_org      on credit_balance(organization_id);
create index idx_credit_transactions_org on credit_transactions(organization_id);
create index idx_addons_org              on addons(organization_id);
