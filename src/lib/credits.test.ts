import { describe, it, expect } from "vitest";
import {
  UNLIMITED,
  computeCreditCost,
  stueckCreditCost,
  isUnlimited,
  availableCredits,
  decideEntitlement,
  decideCreditCharge,
  resolveBillingConfig,
  buildFrozenChargeMeta,
  type BillingConfig,
} from "./credits";

// Diese Tests spiegeln die Akzeptanzkriterien aus
// docs/for_ai_sdr_vorab_entitlement_credits.md (Abschnitt 7) auf die reine
// Rechen-/Entscheidungslogik. Die atomare Abbuchung selbst ist eine DB-Eigenschaft
// (Row-Lock in consume_credits) und wird zur Laufzeit geprüft (Akzeptanz #4), nicht hier.

const CFG = { tokensPerCredit: 5000, minCreditsPerAction: 1 };

describe("computeCreditCost — Token→Credit-Formel (Abschnitt 3)", () => {
  it("7.200 Token → 2 Credits bei 5000/Credit (Akzeptanz #1)", () => {
    expect(computeCreditCost({ totalTokens: 7200, ...CFG })).toBe(2);
  });

  it("kleiner Call < 5.000 Token kostet exakt 1 Credit (Mindestregel, Akzeptanz #2)", () => {
    expect(computeCreditCost({ totalTokens: 3200, ...CFG })).toBe(1);
    expect(computeCreditCost({ totalTokens: 1, ...CFG })).toBe(1);
    expect(computeCreditCost({ totalTokens: 0, ...CFG })).toBe(1);
  });

  it("rundet auf (ceil) — 5.001 Token → 2 Credits", () => {
    expect(computeCreditCost({ totalTokens: 5001, ...CFG })).toBe(2);
    expect(computeCreditCost({ totalTokens: 10000, ...CFG })).toBe(2);
    expect(computeCreditCost({ totalTokens: 10001, ...CFG })).toBe(3);
  });

  it("model_credit_factor multipliziert (teures Modell 2.0)", () => {
    expect(computeCreditCost({ totalTokens: 5000, modelFactor: 2.0, ...CFG })).toBe(2);
    expect(computeCreditCost({ totalTokens: 2600, modelFactor: 2.0, ...CFG })).toBe(2); // 5200/5000→ceil=2
  });

  it("tokens_per_credit ist konfigurierbar ([D51]) — 10000/Credit halbiert die Kosten", () => {
    expect(
      computeCreditCost({ totalTokens: 12000, tokensPerCredit: 10000, minCreditsPerAction: 1 }),
    ).toBe(2);
  });

  it("schützt vor Division durch 0 (fällt auf Mindest-Credits zurück)", () => {
    expect(
      computeCreditCost({ totalTokens: 9999, tokensPerCredit: 0, minCreditsPerAction: 1 }),
    ).toBe(1);
  });
});

describe("stueckCreditCost — Nicht-AI (enrichment/email_verification)", () => {
  it("1 Vorgang = 1 Credit", () => {
    expect(stueckCreditCost()).toBe(1);
    expect(stueckCreditCost(1)).toBe(1);
  });
  it("mehrere Einheiten, Mindest-Floor greift", () => {
    expect(stueckCreditCost(5)).toBe(5);
    expect(stueckCreditCost(0, 1)).toBe(1);
  });
});

describe("Unbegrenzt (-1) — interner Plan blockiert nie", () => {
  it("isUnlimited erkennt -1", () => {
    expect(isUnlimited(UNLIMITED)).toBe(true);
    expect(isUnlimited(-1)).toBe(true);
    expect(isUnlimited(0)).toBe(false);
    expect(isUnlimited(500)).toBe(false);
  });

  it("availableCredits bei unbegrenzt → Infinity", () => {
    expect(
      availableCredits({ includedMonthly: -1, purchased: 0, usedThisPeriod: 999999 }),
    ).toBe(Infinity);
  });

  it("decideEntitlement: limit -1 → immer allowed (auch bei billing_enabled)", () => {
    expect(decideEntitlement({ billingEnabled: true, limit: -1, used: 10_000 })).toEqual({
      allowed: true,
      limit: -1,
      used: 10_000,
    });
  });

  it("decideCreditCharge: unbegrenzt → immer true", () => {
    expect(
      decideCreditCharge({
        billingEnabled: true,
        balance: { includedMonthly: -1, purchased: 0, usedThisPeriod: 10_000 },
        cost: 50,
      }),
    ).toBe(true);
  });
});

describe("billing_enabled=false — intern blockiert NIE (Kernanforderung)", () => {
  it("decideEntitlement: über Limit, aber billing aus → allowed", () => {
    expect(decideEntitlement({ billingEnabled: false, limit: 1, used: 99 }).allowed).toBe(true);
  });
  it("decideCreditCharge: leeres Guthaben, aber billing aus → true", () => {
    expect(
      decideCreditCharge({
        billingEnabled: false,
        balance: { includedMonthly: 0, purchased: 0, usedThisPeriod: 0 },
        cost: 5,
      }),
    ).toBe(true);
  });
});

describe("Enforcement NUR wenn billing_enabled=true (Akzeptanz #5)", () => {
  it("ai_credits-Limit 1, used 1 → allowed=false", () => {
    expect(decideEntitlement({ billingEnabled: true, limit: 1, used: 1 }).allowed).toBe(false);
  });
  it("ai_credits-Limit 1, used 0 → allowed=true", () => {
    expect(decideEntitlement({ billingEnabled: true, limit: 1, used: 0 }).allowed).toBe(true);
  });
  it("kein Guthaben mehr → charge verweigert", () => {
    expect(
      decideCreditCharge({
        billingEnabled: true,
        balance: { includedMonthly: 5, purchased: 0, usedThisPeriod: 5 },
        cost: 1,
      }),
    ).toBe(false);
  });
});

// ── Migration 064 — Fundament-Härtung ────────────────────────────────────────

const GLOBAL: BillingConfig = {
  billingEnabled: false,
  tokensPerCredit: 5000,
  minCreditsPerAction: 1,
  modelCreditFactors: {},
};

describe("Punkt 5 — resolveBillingConfig: global → per-Key-Override", () => {
  it("Org OHNE Override erbt komplett global", () => {
    expect(resolveBillingConfig(GLOBAL, null)).toEqual(GLOBAL);
    expect(resolveBillingConfig(GLOBAL, {})).toEqual(GLOBAL);
  });

  it("Org MIT eigenem Eintrag nutzt weiterhin ihren Override (voller Block)", () => {
    const org: Partial<BillingConfig> = {
      billingEnabled: true,
      tokensPerCredit: 2500,
      minCreditsPerAction: 2,
      modelCreditFactors: { "expensive-model": 3 },
    };
    expect(resolveBillingConfig(GLOBAL, org)).toEqual(org);
  });

  it("partieller Override: gesetzte Keys gewinnen, Rest erbt global", () => {
    const r = resolveBillingConfig(GLOBAL, { tokensPerCredit: 8000 });
    expect(r.tokensPerCredit).toBe(8000); // Override
    expect(r.minCreditsPerAction).toBe(1); // global
    expect(r.billingEnabled).toBe(false); // global
    expect(r.modelCreditFactors).toEqual({}); // global
  });

  it("billing_enabled=false als expliziter Override wird respektiert (nicht als 'ungesetzt')", () => {
    const g2: BillingConfig = { ...GLOBAL, billingEnabled: true };
    expect(resolveBillingConfig(g2, { billingEnabled: false }).billingEnabled).toBe(false);
  });

  it("tokensPerCredit<=0 gilt als ungesetzt → global (Schutz wie SQL nullif)", () => {
    expect(resolveBillingConfig(GLOBAL, { tokensPerCredit: 0 }).tokensPerCredit).toBe(5000);
  });

  it("änderung am globalen Default trägt zu erbenden Orgs, nicht zu Override-Orgs", () => {
    const g2: BillingConfig = { ...GLOBAL, tokensPerCredit: 2500 };
    expect(resolveBillingConfig(g2, null).tokensPerCredit).toBe(2500); // erbt neuen Default
    expect(resolveBillingConfig(g2, { tokensPerCredit: 5000 }).tokensPerCredit).toBe(5000); // Override bleibt
  });
});

describe("Punkt 0 — buildFrozenChargeMeta: angewandte Parameter eingefroren, nie rückwirkend", () => {
  it("friert die zum Buchungszeitpunkt angewandten Parameter ein", () => {
    const cfgA = resolveBillingConfig(GLOBAL, null); // tpc 5000
    const cost = computeCreditCost({
      totalTokens: 7200,
      tokensPerCredit: cfgA.tokensPerCredit,
      modelFactor: 1.0,
      minCreditsPerAction: cfgA.minCreditsPerAction,
    });
    const frozen = buildFrozenChargeMeta({
      tokensPerCredit: cfgA.tokensPerCredit,
      modelFactor: 1.0,
      minCreditsPerAction: cfgA.minCreditsPerAction,
      creditCost: cost,
    });
    expect(frozen).toEqual({
      raw_credit_calc: 2,
      applied_tokens_per_credit: 5000,
      applied_model_factor: 1.0,
      applied_min_credits_per_action: 1,
    });
  });

  it("spätere Config-Änderung ändert die ALTE eingefrorene Buchung NICHT, neue nutzt neuen Wert", () => {
    // Buchung 1 unter Faktor/Preis A (tpc 5000)
    const costA = computeCreditCost({ totalTokens: 7200, tokensPerCredit: 5000, minCreditsPerAction: 1 });
    const frozenA = buildFrozenChargeMeta({ tokensPerCredit: 5000, modelFactor: 1.0, minCreditsPerAction: 1, creditCost: costA });
    // Config ändert sich auf B (tpc 2500) → neue Buchung teurer
    const costB = computeCreditCost({ totalTokens: 7200, tokensPerCredit: 2500, minCreditsPerAction: 1 });
    const frozenB = buildFrozenChargeMeta({ tokensPerCredit: 2500, modelFactor: 1.0, minCreditsPerAction: 1, creditCost: costB });
    // Alte Buchung unverändert (X/A), neue nutzt B:
    expect(frozenA.applied_tokens_per_credit).toBe(5000);
    expect(frozenA.raw_credit_calc).toBe(2);
    expect(frozenB.applied_tokens_per_credit).toBe(2500);
    expect(frozenB.raw_credit_calc).toBe(3); // 7200/2500 → ceil 3
  });

  it("Nicht-AI: applied_model_factor = null (Faktor nicht anwendbar)", () => {
    const frozen = buildFrozenChargeMeta({ tokensPerCredit: 5000, modelFactor: null, minCreditsPerAction: 1, creditCost: 1 });
    expect(frozen.applied_model_factor).toBeNull();
  });
});

describe("ZUKUNFTS-HAKEN Bonus-Topf (Promo/Voucher) — additiv, heute wirkungslos", () => {
  it("bonus fehlt/0 → keine Wirkung", () => {
    expect(
      availableCredits({ includedMonthly: 10, purchased: 0, usedThisPeriod: 10 }),
    ).toBe(0);
  });
  it("bonus wird additiv berücksichtigt (spätere redemption_codes-Einlösung)", () => {
    expect(
      availableCredits({ includedMonthly: 10, purchased: 0, usedThisPeriod: 10, bonus: 25 }),
    ).toBe(25);
    expect(
      decideCreditCharge({
        billingEnabled: true,
        balance: { includedMonthly: 10, purchased: 0, usedThisPeriod: 10, bonus: 25 },
        cost: 20,
      }),
    ).toBe(true);
  });
});
