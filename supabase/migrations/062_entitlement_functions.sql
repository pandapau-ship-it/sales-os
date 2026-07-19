-- 062_entitlement_functions.sql
-- Drei RPCs für Entitlement & Credits. Grundlage: docs/for_ai_sdr_vorab_entitlement_credits.md §4.
-- SPIEGEL von src/lib/credits.ts (Formel + Entscheidungslogik gleich halten!).
-- security definer: laufen unter Function-Owner (RLS-frei) — Enforcement passiert
-- explizit über die organization_id-Parameter, nicht implizit über RLS.
-- Kernregeln: intern blockiert NIE (billing_enabled=false → immer allowed);
-- unbegrenzt (-1) → immer allowed; kein Plan-Name-Stringvergleich (Abo-Draft A1) —
-- ausschließlich Feature-Limits aus plan_limits.

-- Billing-Config einer Org lesen (mit Code-Default-Fallback, spiegelt Seed 061).
create or replace function _billing_config(p_org uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'billing_enabled',       coalesce((s.billing->>'billing_enabled')::boolean, false),
    'tokens_per_credit',     coalesce(nullif((s.billing->>'tokens_per_credit')::numeric, 0), 5000),
    'min_credits_per_action',coalesce((s.billing->>'min_credits_per_action')::int, 1),
    'model_credit_factors',  coalesce(s.billing->'model_credit_factors', '{}'::jsonb)
  )
  from settings s where s.organization_id = p_org
  union all
  select jsonb_build_object(
    'billing_enabled', false, 'tokens_per_credit', 5000,
    'min_credits_per_action', 1, 'model_credit_factors', '{}'::jsonb
  )
  where not exists (select 1 from settings s where s.organization_id = p_org)
  limit 1;
$$;

-- ── check_entitlement(org, feature) → {allowed, limit, used} ──────────────────
create or replace function check_entitlement(p_org uuid, p_feature text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg     jsonb := _billing_config(p_org);
  v_billing boolean := (v_cfg->>'billing_enabled')::boolean;
  v_limit   int;
  v_used    int;
begin
  -- Limit aus dem aktiven Plan (jüngste Subscription). Kein Plan/Limit → als unbegrenzt behandeln.
  select pl.limit_value into v_limit
  from organization_subscription os
  join plan_limits pl on pl.plan_id = os.plan_id and pl.feature = p_feature
  where os.organization_id = p_org
  order by os.created_at desc
  limit 1;
  if v_limit is null then v_limit := -1; end if;

  -- used: für Credit-Features aus credit_balance; sonst 0 (Count-Enforcement später).
  select b.used_this_period into v_used
  from credit_balance b
  where b.organization_id = p_org
    and b.credit_type = case p_feature
      when 'ai_credits' then 'ai'
      when 'enrichment_credits' then 'enrichment'
      when 'email_verification_credits' then 'email_verification'
      else null end;
  v_used := coalesce(v_used, 0);

  return jsonb_build_object(
    'allowed', (not v_billing) or v_limit = -1 or v_used < v_limit,
    'limit',   v_limit,
    'used',    v_used
  );
end;
$$;

-- ── check_credit_balance(org, credit_type) → {allowed, included, purchased, used} ─
create or replace function check_credit_balance(p_org uuid, p_credit_type text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg       jsonb := _billing_config(p_org);
  v_billing   boolean := (v_cfg->>'billing_enabled')::boolean;
  v_included  int;
  v_purchased int;
  v_used      int;
  v_available numeric;
begin
  select b.included_monthly, b.purchased, b.used_this_period
    into v_included, v_purchased, v_used
  from credit_balance b
  where b.organization_id = p_org and b.credit_type = p_credit_type;

  if not found then
    return jsonb_build_object('allowed', not v_billing, 'included', 0, 'purchased', 0, 'used', 0);
  end if;

  if v_included = -1 then
    return jsonb_build_object('allowed', true, 'included', -1,
      'purchased', v_purchased, 'used', v_used, 'unlimited', true);
  end if;

  -- ZUKUNFTS-HAKEN (Promo/Voucher): available summiert die Grant-Quellen ADDITIV.
  -- Ein späterer Bonus-Topf (redemption_codes) wird hier als weiterer Summand
  -- ergänzt (+ coalesce(v_bonus,0)) — kein Umbau von consume/check nötig.
  v_available := v_included + v_purchased - v_used;

  return jsonb_build_object(
    'allowed',   (not v_billing) or v_available > 0,
    'included',  v_included,
    'purchased', v_purchased,
    'used',      v_used,
    'available', v_available
  );
end;
$$;

-- ── consume_credits(org, credit_type, reason, reference_id, metadata) ─────────
-- Atomare RPC: berechnet credit_cost (§3), erhöht used_this_period und schreibt
-- credit_transactions in EINEM Block. Kein SELECT-dann-UPDATE (Race) — die
-- UPDATE ... = used + cost Anweisung hält den Row-Lock → parallele Aufrufe exakt.
-- Zählt IMMER (auch unbegrenzt / billing aus) — die Zählung ist der Zweck.
-- Blockt NIE (intern) — Enforcement käme später über die check_*-Functions davor.
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
    v_cost := greatest(coalesce((p_metadata->>'units')::int, 1), v_min);
  end if;

  -- Atomare Abbuchung (Row-Lock via UPDATE ... = used + cost).
  update credit_balance
     set used_this_period = used_this_period + v_cost
   where organization_id = p_org and credit_type = p_credit_type
   returning used_this_period, included_monthly into v_new_used, v_included;

  -- Fehlt die Balance-Zeile → mit dieser Buchung anlegen (Zählung nie verlieren).
  if not found then
    insert into credit_balance (organization_id, credit_type, included_monthly,
                                purchased, used_this_period, resets_at)
    values (p_org, p_credit_type, 0, 0, v_cost,
            date_trunc('month', now()) + interval '1 month')
    returning used_this_period, included_monthly into v_new_used, v_included;
  end if;

  -- Transaktion IMMER schreiben (metadata = echte Token-Zahlen bei AI).
  insert into credit_transactions (organization_id, credit_type, amount, reason,
                                   reference_id, metadata)
  values (p_org, p_credit_type, -v_cost, p_reason, p_reference_id,
          p_metadata || jsonb_build_object('raw_credit_calc', v_cost))
  returning id into v_tx_id;

  return jsonb_build_object(
    'allowed',          true,            -- intern blockiert nie
    'credit_cost',      v_cost,
    'credit_type',      p_credit_type,
    'used_this_period', v_new_used,
    'unlimited',        (v_included = -1),
    'billing_enabled',  v_billing,
    'transaction_id',   v_tx_id
  );
end;
$$;
