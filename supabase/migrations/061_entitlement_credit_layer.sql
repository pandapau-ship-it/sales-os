-- 061_entitlement_credit_layer.sql
-- Entitlement- & Credit-Layer — ADDITIV auf Migration 008 (Billing-Tabellen).
-- Grundlage: docs/for_ai_sdr_vorab_entitlement_credits.md (Option A).
-- NUR additiv: keine bestehende Spalte/Daten geändert.
--   (a) credit_transactions.metadata jsonb (echte Token-Zahlen pro AI-Bezug)
--   (b) settings.billing jsonb (Config-Heimat statt nicht-existenter system_config-Tabelle)
--   (c) Seeds: interner Plan (-1 = unbegrenzt), Subscription + credit_balance je Org, Billing-Config
--
-- HINWEIS RLS: bewusst NICHT hier — Migration 011 aktiviert RLS + Policies für ALLE 6
-- Billing-Tabellen bereits (organization_subscription/credit_balance/credit_transactions/addons
-- = org-Isolation via auth_org_id(); plans/plan_limits = plans_public_read/plan_limits_public_read).
-- Nichts zu ergänzen. plans/plan_limits bleiben die dokumentierte org_id-Ausnahme (scripts/audit.ts).
-- Functions (062) + Reset-Cron (063) folgen in eigenen Migrationen.

-- ── (a) credit_transactions.metadata — PFLICHT bei jedem AI-Bezug ─────────────
-- {model, input_tokens, output_tokens, total_tokens, raw_credit_calc,
--  langfuse_trace_id, function_name} — echte Werte aus der API-Response, nie geschätzt.
alter table credit_transactions add column if not exists metadata jsonb;

-- ── (b) settings.billing — Config-Heimat ([D51] Kategorie C, per Org) ─────────
-- Das Projekt hat KEINE system_config-Tabelle; die kanonische Config-Heimat ist
-- die settings-Tabelle (per Org, laufzeit-gelesen, chat-änderbar). Die in der
-- Doku als "system_config-Keys" genannten Werte leben daher hier als billing-JSONB:
-- {billing_enabled, tokens_per_credit, min_credits_per_action, model_credit_factors}.
alter table settings add column if not exists billing jsonb default '{}'::jsonb;

-- ── (c) SEEDS ────────────────────────────────────────────────────────────────

-- Interner Plan (fixe ID → idempotent). Preise 0, unbegrenzt via plan_limits.
insert into plans (id, name, price_monthly, price_yearly, base_seats, extra_seat_price)
values ('10000000-0000-0000-0000-000000000001', 'internal', 0, 0, -1, 0)
on conflict (id) do nothing;

-- plan_limits: -1 (unbegrenzt) für ALLE Features. Delete+Insert für den fixen
-- Plan = idempotent (plan_limits hat keinen Unique-Key auf (plan_id, feature)).
delete from plan_limits where plan_id = '10000000-0000-0000-0000-000000000001';
insert into plan_limits (plan_id, feature, limit_value)
select '10000000-0000-0000-0000-000000000001', f, -1
from unnest(array[
  'contacts','campaigns','mailboxes','seats',
  'ai_credits','enrichment_credits','email_verification_credits'
]) as f;

-- organization_subscription: JEDE existierende Org auf den internen Plan
-- (deckt Demo-Org + jede künftige Org ab). Idempotent via NOT EXISTS.
insert into organization_subscription (organization_id, plan_id, status)
select o.id, '10000000-0000-0000-0000-000000000001', 'active'
from organizations o
where not exists (
  select 1 from organization_subscription s where s.organization_id = o.id
);

-- credit_balance: je Org × Credit-Typ, included_monthly = -1 (unbegrenzt).
-- resets_at = nächster Monatsanfang (Reset-Cron 063 rollt dann weiter). Idempotent.
insert into credit_balance (organization_id, credit_type, included_monthly, purchased, used_this_period, resets_at)
select o.id, ct, -1, 0, 0, date_trunc('month', now()) + interval '1 month'
from organizations o
cross join unnest(array['ai','enrichment','email_verification']) as ct
where not exists (
  select 1 from credit_balance b
  where b.organization_id = o.id and b.credit_type = ct
);

-- Billing-Config je Org (Seed spiegelt die Code-Defaults in src/lib/credits.ts).
-- Nur setzen, wenn noch nicht vorhanden (bewahrt evtl. bereits kalibrierte Werte).
update settings
set billing = jsonb_build_object(
  'billing_enabled', false,
  'tokens_per_credit', 5000,
  'min_credits_per_action', 1,
  'model_credit_factors', '{}'::jsonb
)
where not (coalesce(billing, '{}'::jsonb) ? 'tokens_per_credit');
