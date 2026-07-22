import { describe, it, expect } from "vitest";
import { calculatePriorityScore, PRIORITY_WEIGHTS_DEFAULT } from "./hunterMappers";
import type { ContactRow, SignalRow } from "@/types/rows";

/**
 * SET-4a (A→C): Das Signal-Frische-Fenster ist kein 24h-Literal mehr, sondern kommt als
 * `signal_fresh_hours` aus den (settings-gespeisten) Gewichten. Default bleibt 24h.
 * Minimaler Kontakt: heat 'warm' (kein going_cold), icp 50 (Mult 1.0), keine Deals →
 * NUR das Signal-Alter beeinflusst den Score.
 */
const H = 3_600_000;
const NOW = 1_700_000_000_000;
const contact = { id: "c1", heat_status: "warm", icp_score: 50 } as unknown as ContactRow;
const sigAged = (hours: number): SignalRow[] =>
  [{ created_at: new Date(NOW - hours * H).toISOString() } as unknown as SignalRow];

describe("calculatePriorityScore — signal_fresh_hours (SET-4a, A→C)", () => {
  it("nutzt signal_fresh_hours aus den Gewichten statt des früheren 24h-Literals", () => {
    // 30h altes Signal: bei 24h-Fenster NICHT frisch, bei 48h-Fenster frisch.
    const at24 = calculatePriorityScore(contact, [], sigAged(30), { signal_fresh_hours: 24 }, {}, NOW);
    const at48 = calculatePriorityScore(contact, [], sigAged(30), { signal_fresh_hours: 48 }, {}, NOW);
    expect(at48.signals).toContain("linkedin_signal");
    expect(at24.signals).not.toContain("linkedin_signal");
    expect(at48.score).toBeGreaterThan(at24.score);
  });

  it("Default (kein Gewicht) = 24h — 30h altes Signal ist NICHT frisch", () => {
    expect(PRIORITY_WEIGHTS_DEFAULT.signal_fresh_hours).toBe(24);
    const res = calculatePriorityScore(contact, [], sigAged(30), null, {}, NOW);
    expect(res.signals).not.toContain("linkedin_signal");
  });

  it("frisches Signal (10h) ist beim Default-24h-Fenster frisch → linkedin_signal aktiv", () => {
    const res = calculatePriorityScore(contact, [], sigAged(10), null, {}, NOW);
    expect(res.signals).toContain("linkedin_signal");
  });
});
