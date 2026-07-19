/**
 * credits.ts — Credit-Kosten- & Entitlement-Entscheidungslogik (geteilte Referenz).
 *
 * SPIEGEL-PRINZIP (wie hunterMappers WON/LOST ↔ supabase/functions/_shared/terminalStages.ts):
 * Dieselbe Formel/Entscheidung lebt serverseitig in den Postgres-RPCs
 * (supabase/migrations/062_entitlement_functions.sql → consume_credits /
 * check_entitlement / check_credit_balance). Ändert sich hier etwas, MUSS die
 * SQL-Seite gleich mitgezogen werden (und umgekehrt).
 *
 * Rollen-Trennung:
 *  - Der SQL-Pfad ist die LAUFZEIT-WAHRHEIT: die atomare Abbuchung + der
 *    credit_transactions-Write passieren in der DB (race-frei via Row-Lock).
 *  - Diese TS-Datei ist die Referenz für Schätzung/Anzeige (aiCall-Haken beim
 *    ersten echten AI-Call-Slice, UI zeigt Credits statt Token [D51]/Honesty)
 *    und macht die reine Rechen-/Entscheidungslogik [AUTO]-testbar.
 *
 * [D51]: Alle Parameter (tokens_per_credit, min_credits_per_action,
 * model_credit_factors, billing_enabled) sind Laufzeit-Config aus settings.billing
 * (per Org) — hier NUR als Eingabe-Parameter, NIE als hartes Verhaltens-Literal.
 */

/** included_monthly = -1 bedeutet: unbegrenzt (interner Plan). */
export const UNLIMITED = -1;

export interface CreditCostInput {
  totalTokens: number;
  tokensPerCredit: number; // settings.billing.tokens_per_credit (Seed-Default 5000)
  modelFactor?: number; // settings.billing.model_credit_factors[model] ?? 1.0
  minCreditsPerAction: number; // settings.billing.min_credits_per_action (Seed-Default 1)
}

/**
 * AI-Credit-Kosten: raw = (total / tokens_per_credit) * factor;
 * cost = max(ceil(raw), min_credits_per_action). Spiegelt consume_credits (SQL).
 */
export function computeCreditCost(i: CreditCostInput): number {
  const factor = i.modelFactor ?? 1.0;
  if (i.tokensPerCredit <= 0) return i.minCreditsPerAction; // Schutz vor Division durch 0
  const raw = (i.totalTokens / i.tokensPerCredit) * factor;
  return Math.max(Math.ceil(raw), i.minCreditsPerAction);
}

/**
 * Nicht-AI-Credits (enrichment, email_verification): stückbasiert — 1 Credit pro
 * Vorgang (oder metadata.units), keine Token-Logik. Spiegelt consume_credits (SQL, else-Zweig).
 */
export function stueckCreditCost(units = 1, minCreditsPerAction = 1): number {
  return Math.max(units, minCreditsPerAction);
}

export interface BalanceState {
  includedMonthly: number; // -1 = unbegrenzt
  purchased: number;
  usedThisPeriod: number;
  /**
   * ZUKUNFTS-HAKEN (Promo/Voucher, spätere Billing-/Launch-Phase): additiver
   * Bonus-Topf, z.B. aus einer künftigen redemption_codes-Einlösung. Default 0 →
   * heute wirkungslos. availableCredits summiert ihn additiv → ein späteres
   * Code-System dockt an, OHNE consume_credits/check_credit_balance umzubauen.
   */
  bonus?: number;
}

export function isUnlimited(includedMonthly: number): boolean {
  return includedMonthly === UNLIMITED;
}

/**
 * Verfügbare Credits. Unbegrenzt → Infinity. Sonst additive Summe aller
 * Grant-Quellen minus Verbrauch (Bonus-Topf additiv — siehe BalanceState.bonus).
 */
export function availableCredits(b: BalanceState): number {
  if (isUnlimited(b.includedMonthly)) return Infinity;
  return b.includedMonthly + b.purchased + (b.bonus ?? 0) - b.usedThisPeriod;
}

export interface EntitlementDecision {
  allowed: boolean;
  limit: number;
  used: number;
}

/**
 * Feature-Entitlement. billing_enabled=false → IMMER allowed (intern blockiert nie).
 * limit=-1 (unbegrenzt) → immer allowed. Spiegelt check_entitlement (SQL).
 */
export function decideEntitlement(opts: {
  billingEnabled: boolean;
  limit: number;
  used: number;
}): EntitlementDecision {
  const unlimited = opts.limit === UNLIMITED;
  const allowed = !opts.billingEnabled || unlimited || opts.used < opts.limit;
  return { allowed, limit: opts.limit, used: opts.used };
}

/**
 * Credit-Bezug erlaubt? billing_enabled=false → immer true (intern blockiert nie).
 * Unbegrenzt → immer true. Sonst: genug verfügbar (inkl. Bonus-Topf).
 * Spiegelt die allowed-Logik von check_credit_balance (SQL).
 */
export function decideCreditCharge(opts: {
  billingEnabled: boolean;
  balance: BalanceState;
  cost: number;
}): boolean {
  if (!opts.billingEnabled) return true;
  if (isUnlimited(opts.balance.includedMonthly)) return true;
  return availableCredits(opts.balance) >= opts.cost;
}

// ── Migration 064 — Fundament-Härtung ────────────────────────────────────────

export interface BillingConfig {
  billingEnabled: boolean;
  tokensPerCredit: number;
  minCreditsPerAction: number;
  modelCreditFactors: Record<string, number>;
}

/**
 * Punkt 5 — Globaler Default + per-Key-Override. Spiegelt `_billing_config` (SQL, 064):
 * pro Key gewinnt der Org-Override (settings.billing) WENN gesetzt, sonst der globale Default.
 * `tokensPerCredit <= 0` gilt als „nicht gesetzt" (Schutz, wie SQL `nullif(...,0)`).
 * Eine Org OHNE Override erbt komplett global; einzelne Keys sind mischbar.
 */
export function resolveBillingConfig(
  global: BillingConfig,
  orgOverride: Partial<BillingConfig> | null | undefined,
): BillingConfig {
  const o = orgOverride ?? {};
  return {
    billingEnabled: o.billingEnabled ?? global.billingEnabled,
    tokensPerCredit:
      o.tokensPerCredit != null && o.tokensPerCredit > 0 ? o.tokensPerCredit : global.tokensPerCredit,
    minCreditsPerAction: o.minCreditsPerAction ?? global.minCreditsPerAction,
    modelCreditFactors: o.modelCreditFactors ?? global.modelCreditFactors,
  };
}

export interface FrozenChargeMeta {
  raw_credit_calc: number;
  applied_tokens_per_credit: number;
  applied_model_factor: number | null; // null für Nicht-AI (Faktor nicht anwendbar)
  applied_min_credits_per_action: number;
}

/**
 * Punkt 0 — Rückwirkungsfreiheit. Spiegelt die metadata-Ergänzung in `consume_credits` (SQL, 064):
 * die ZUM BUCHUNGSZEITPUNKT angewandten Parameter werden eingefroren in die Transaktion geschrieben.
 * Eine spätere Config-Änderung wirkt NIE rückwirkend — die Zeile bleibt für immer erklärbar.
 */
export function buildFrozenChargeMeta(opts: {
  tokensPerCredit: number;
  modelFactor: number | null;
  minCreditsPerAction: number;
  creditCost: number;
}): FrozenChargeMeta {
  return {
    raw_credit_calc: opts.creditCost,
    applied_tokens_per_credit: opts.tokensPerCredit,
    applied_model_factor: opts.modelFactor,
    applied_min_credits_per_action: opts.minCreditsPerAction,
  };
}
