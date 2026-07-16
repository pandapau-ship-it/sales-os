/**
 * Smoke-Test des Test-Fundaments (PROGRESS.md K-1a).
 *
 * Zweck: beweist, dass die Test-Infrastruktur trägt, BEVOR die [AUTO]-Tests der
 * Baupläne darauf aufsetzen (Testpläne: Send-Gates, Idempotenz, Duplikat-Kaskaden …).
 * Deshalb echte Projekt-Logik statt `expect(1+1)`: der Test beweist zugleich, dass
 * vitest läuft, TypeScript kompiliert und der `@`-Alias auflöst — auch transitiv,
 * denn heatUtils importiert seinerseits über `@/lib/constants`.
 *
 * Geprüft wird `getHeatColor` als Single-Source-Bridge (Daten-Enum → Heat-Key):
 * Label/Dot stammen aus HEAT_STATUS, nie aus der Komponente.
 */
import { describe, it, expect } from "vitest";
import { getHeatColor } from "@/lib/heatUtils";
import { HEAT_STATUS, HEAT_KEY_BY_STATUS } from "@/lib/constants";

describe("getHeatColor (Smoke: Test-Fundament K-1a)", () => {
  it("bildet jeden Daten-Status auf Label und Dot-Farbe aus HEAT_STATUS ab", () => {
    for (const [status, key] of Object.entries(HEAT_KEY_BY_STATUS)) {
      const result = getHeatColor(status);
      expect(result.label).toBe(HEAT_STATUS[key].label);
      expect(result.dot).toBe(HEAT_STATUS[key].color);
    }
  });

  it("fällt bei unbekanntem Status auf 'gone' zurück statt zu werfen", () => {
    const result = getHeatColor("KEIN_ECHTER_STATUS");
    expect(result.label).toBe(HEAT_STATUS.gone.label);
  });

  it("liefert für jeden Status vollständige Style-Klassen (keine leeren Werte)", () => {
    for (const status of Object.keys(HEAT_KEY_BY_STATUS)) {
      const { bg, text, border } = getHeatColor(status);
      expect(bg).toBeTruthy();
      expect(text).toBeTruthy();
      expect(border).toBeTruthy();
    }
  });
});
