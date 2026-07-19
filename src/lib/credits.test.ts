import { describe, it, expect } from "vitest";
import {
  UNLIMITED,
  computeCreditCost,
  stueckCreditCost,
  isUnlimited,
  availableCredits,
  decideEntitlement,
  decideCreditCharge,
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
