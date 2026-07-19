import { describe, it, expect } from "vitest";
import { ALERT_TEMPLATES, alertTemplateFor } from "./alertTemplates";

// Bauplan E: JEDE Alarm-Meldung muss WAS/Vermutung/Bedeutung in Klartext enthalten — kein Fall ohne Erklärung.
// (Spiegel des DB-Seeds cron_expectations, Migr. 068/069 — bei Änderung dort mitziehen.)

describe("ALERT_TEMPLATES — Klartext-Pflichtfelder (WAS/Vermutung/Bedeutung)", () => {
  it("deckt alle 7 überwachten Crons ab", () => {
    expect(Object.keys(ALERT_TEMPLATES).sort()).toEqual(
      [
        "cron-runs-cleanup",
        "credit-monthly-reset",
        "notifications-cleanup",
        "score-churn-risk-daily",
        "score-deal-health-daily",
        "score-heat-status-daily",
        "score-upsell-daily",
      ].sort(),
    );
  });

  it("jeder Eintrag hat alle drei Pflichtfelder, nicht-leer und in Klartext", () => {
    for (const [job, tpl] of Object.entries(ALERT_TEMPLATES)) {
      expect(tpl.what, `${job}.what`).toBeTruthy();
      expect(tpl.hypothesis, `${job}.hypothesis`).toBeTruthy();
      expect(tpl.meaning, `${job}.meaning`).toBeTruthy();
      // Klartext-Heuristik: Satz mit Leerzeichen, kein roher Funktionsname als einziger Inhalt.
      expect(tpl.what.length).toBeGreaterThan(15);
      expect(tpl.what).toMatch(/\s/);
      expect(tpl.hypothesis.length).toBeGreaterThan(15);
      expect(tpl.meaning.length).toBeGreaterThan(15);
    }
  });

  it("alertTemplateFor liefert Template bzw. null bei unbekanntem Job (nie erfinden)", () => {
    expect(alertTemplateFor("score-upsell-daily")?.what).toContain("Upsell");
    expect(alertTemplateFor("gibt-es-nicht")).toBeNull();
  });
});
