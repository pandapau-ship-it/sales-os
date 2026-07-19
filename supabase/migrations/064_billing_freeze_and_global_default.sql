-- 064_billing_freeze_and_global_default.sql
-- Zwei Fundament-Härtungen — ADDITIV auf 061-063 (die unangetastet bleiben).
-- Grundlage: Zukunftsfähigkeits-Diagnose Punkt 0 + Punkt 5.
--   TEIL A (Punkt 0): consume_credits friert die ZUM BUCHUNGSZEITPUNKT angewandten
--     Abrechnungs-Parameter (tokens_per_credit, model_factor, min_credits) in
--     credit_transactions.metadata ein → vergangene Buchungen bleiben für immer
--     erklärbar, eine spätere Preisänderung wirkt NIE rückwirkend.
--   TEIL B (Punkt 5): globaler Default-Layer (billing_config, org-unabhängig).
--     _billing_config liest global → per-Key-Override aus settings.billing.
--     Bereits geseedete settings.billing (061) bleiben als expliziter Override
--     bestehen (kein Verhaltenswechsel für existierende Orgs). NEUE Orgs erben global.
-- Rein additiv: keine bestehende Spalte/Daten geändert; nur create-or-replace + neue Tabelle.

-- ── TEIL B.1 — globale billing_config (Singleton, org-unabhängig) ─────────────
-- Globale Katalog-Tabelle OHNE organization_id (dokumentierte Ausnahme wie plans/plan_limits
-- → scripts/audit.ts GLOBAL_TABLES). Lesend für alle eingeloggten User, Write nur service_role.
create table if not exists billing_config (
  id                     int primary key default 1,
  billing_enabled        boolean not null default false,
  tokens_per_credit      numeric not null default 5000,
  min_credits_per_action int not null default 1,
  model_credit_factors   jsonb not null default '{}'::jsonb,
  updated_at             timestamptz default now(),
  constraint billing_config_singleton check (id = 1)  -- genau EINE globale Zeile
);

alter table billing_config enable row level security;
create policy "billing_config_read_all" on billing_config for select using (true);

-- Globaler Default spiegelt die Code-Defaults (src/lib/credits.ts) und den 061-Seed.
insert into billing_config (id, billing_enabled, tokens_per_credit, min_credits_per_action, model_credit_factors)
values (1, false, 5000, 1, '{}'::jsonb)
on conflict (id) do nothing;

-- ── TEIL B.2 — _billing_config: global → per-Key-Override aus settings.billing ─
-- Ersetzt die 062-Version (die nur per-Org las + Code-Default-Fallback).
-- Per-Key COALESCE: Org-Wert (settings.billing) gewinnt WENN gesetzt, sonst global,
-- sonst Code-Literal (letzter Fallback, falls die globale Zeile je fehlte).
-- → Bereits geseedete Orgs (voller billing-Block) nutzen weiter ihre Werte (Override).
-- → Neue Orgs ohne settings.billing erben komplett global. Einzelne Keys mischbar.
create or replace function _billing_config(p_org uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with g as (
    select billing_enabled, tokens_per_credit, min_credits_per_action, model_credit_factors
    from billing_config where id = 1
  ),
  o as (
    select billing from settings where organization_id = p_org
  )
  select jsonb_build_object(
    'billing_enabled',       coalesce((o.billing->>'billing_enabled')::boolean, g.billing_enabled, false),
    'tokens_per_credit',     coalesce(nullif((o.billing->>'tokens_per_credit')::numeric, 0), g.tokens_per_credit, 5000),
    'min_credits_per_action',coalesce((o.billing->>'min_credits_per_action')::int, g.min_credits_per_action, 1),
    'model_credit_factors',  coalesce(o.billing->'model_credit_factors', g.model_credit_factors, '{}'::jsonb)
  )
  from g
  full outer join o on true;
$$;

-- ── TEIL A — consume_credits: angewandte Parameter einfrieren ─────────────────
-- Identisch zu 062, ERGÄNZT nur die metadata um applied_tokens_per_credit /
-- applied_model_factor / applied_min_credits_per_action (eingefroren, pro Buchung).
-- Rein vorwärts: bestehende Zeilen unberührt, betrifft nur neue Buchungen ab jetzt.
create or replace function consume_credits(
  p_org          uuid,
  p_credit_type  text,
  p_reason       text,
  p_reference_id uuid  default null,
  p_metadata     jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg          jsonb := _billing_config(p_org);
  v_billing      boolean := (v_cfg->>'billing_enabled')::boolean;
  v_tpc          numeric := (v_cfg->>'tokens_per_credit')::numeric;
  v_min          int     := (v_cfg->>'min_credits_per_action')::int;
  v_model        text    := p_metadata->>'model';
  v_factor       numeric;
  v_total_tokens numeric;
  v_cost         int;
  v_included     int;
  v_new_used     int;
  v_tx_id        uuid;
begin
  if p_credit_type = 'ai' then
    v_factor := coalesce((v_cfg->'model_credit_factors'->>v_model)::numeric, 1.0);
    v_total_tokens := coalesce(
      (p_metadata->>'total_tokens')::numeric,
      coalesce((p_metadata->>'input_tokens')::numeric, 0)
        + coalesce((p_metadata->>'output_tokens')::numeric, 0)
    );
    v_cost := greatest(ceil((v_total_tokens / v_tpc) * v_factor)::int, v_min);
  else
    -- Nicht-AI (enrichment, email_verification): stückbasiert, 1 pro Vorgang.
    -- v_factor bleibt NULL (nicht anwendbar) → applied_model_factor = null (ehrlich).
    v_cost := greatest(coalesce((p_metadata->>'units')::int, 1), v_min);
  end if;

  -- Atomare Abbuchung (Row-Lock via UPDATE ... = used + cost).
  update credit_balance
     set used_this_period = used_this_period + v_cost
   where organization_id = p_org and credit_type = p_credit_type
   returning used_this_period, included_monthly into v_new_used, v_included;

  if not found then
    insert into credit_balance (organization_id, credit_type, included_monthly,
                                purchased, used_this_period, resets_at)
    values (p_org, p_credit_type, 0, 0, v_cost,
            date_trunc('month', now()) + interval '1 month')
    returning used_this_period, included_monthly into v_new_used, v_included;
  end if;

  -- Transaktion IMMER schreiben. metadata friert die ANGEWANDTEN Parameter ein →
  -- die Zeile bleibt für immer erklärbar, unabhängig von späteren settings/billing_config-Änderungen.
  insert into credit_transactions (organization_id, credit_type, amount, reason,
                                   reference_id, metadata)
  values (p_org, p_credit_type, -v_cost, p_reason, p_reference_id,
          p_metadata || jsonb_build_object(
            'raw_credit_calc',                v_cost,
            'applied_tokens_per_credit',      v_tpc,
            'applied_model_factor',           v_factor,
            'applied_min_credits_per_action', v_min
          ))
  returning id into v_tx_id;

  return jsonb_build_object(
    'allowed',          true,
    'credit_cost',      v_cost,
    'credit_type',      p_credit_type,
    'used_this_period', v_new_used,
    'unlimited',        (v_included = -1),
    'billing_enabled',  v_billing,
    'transaction_id',   v_tx_id
  );
end;
$$;
