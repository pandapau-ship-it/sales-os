-- 048_farmer_scores.sql
-- Farmer-DB-Wiring Slice 1 (rein DB): Score-Felder auf contacts + MRR/ARR auf companies + Settings-Seed.
-- Additiv, nullable, idempotent (ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS).
--
-- RLS + Audit bleiben UNBERÜHRT — bereits aktiv und decken additive Spalten automatisch mit ab:
--   • contacts : RLS "contacts_tenant_isolation" (011) + Trigger trg_contacts_audit → audit_write() (010)
--   • companies: RLS "companies_tenant_isolation" (011) + Trigger trg_companies_audit → audit_write() (010)
--   AFTER-ROW-Trigger gelten für die ganze Zeile inkl. neuer Spalten → KEIN neuer Trigger nötig.
-- Vorlage-Muster: 042 (org_id + RLS + Index) · 029 (rein additive ALTER auf bestehender Tabelle).

-- ── a) contacts — Score-Felder (berechnet von Edge Functions in Slice 2) ──────────
alter table contacts add column if not exists churn_score   int;   -- 0-100 (score_churn_risk)
alter table contacts add column if not exists upsell_score  int;   -- 0-100 (score_upsell)
alter table contacts add column if not exists health_score  int;   -- 0-100 (calculate_health_score)
alter table contacts add column if not exists health_status text
  check (health_status in ('gesund', 'aufmerksamkeit', 'kritisch'));
alter table contacts add column if not exists score_drivers jsonb;  -- [{signal, points, source}] → Hover-Tooltip
alter table contacts add column if not exists data_sources  text[]; -- ['messages','sherloq'] (Honesty: Datenbasis)

create index if not exists idx_contacts_churn  on contacts(organization_id, churn_score);
create index if not exists idx_contacts_upsell on contacts(organization_id, upsell_score);

-- ── b) companies — MRR/ARR (Kunden-/Subscription-Ebene, in Cent) ──────────────────
-- ARR/MRR auf Deal-Ebene bleiben berechnet (029) — DIESE Felder sind die Subscription-Ebene:
-- Übergangslösung „aus Deal" → später „bestätigt" (AM) → „stripe" (Webhook). Quelle in mrr_source.
alter table companies add column if not exists mrr_monthly int;   -- monatlich wiederkehrender Umsatz (Cent)
alter table companies add column if not exists arr_yearly  int;   -- jährlich wiederkehrender Umsatz (Cent)
alter table companies add column if not exists mrr_source  text
  check (mrr_source in ('deal', 'confirmed', 'stripe'));  -- NULL bis MRR wirklich gesetzt wird

create index if not exists idx_companies_mrr on companies(organization_id, mrr_monthly);

-- ── c) Settings-Seed — Schwellen + Gewichte für die Score-Funktionen (Slice 2) ────
-- UPDATE auf die bestehende(n) settings-Zeile(n) (kein INSERT). Shallow-Merge (||) ergänzt NUR
-- diese Top-Level-Keys in thresholds — vorhandene (heat_status etc.) bleiben unangetastet.
-- Idempotent: erneuter Lauf setzt dieselben Werte. trg_settings_audit (010) loggt den Write.
update settings
set thresholds = thresholds || '{
  "churn_risk_threshold": 61,
  "upsell_threshold": 70,
  "health_critical": 40,
  "health_attention": 70,
  "churn_weights": {
    "last_contact": 25,
    "no_reply": 20,
    "overdue_tasks": 15,
    "inactive_days": 20,
    "heat_cold": 20
  },
  "upsell_weights": {
    "reply_rate": 20,
    "recent_contact": 15,
    "heat_hot": 20,
    "positive_sentiment": 25,
    "no_upsell_attempt": 15,
    "active_deal": 10
  },
  "health_formula": "100 - churn + (upsell * 0.2)"
}'::jsonb,
    updated_at = now();
