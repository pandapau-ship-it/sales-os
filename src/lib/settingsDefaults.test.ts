import { describe, it, expect } from "vitest";
import {
  GENERAL_DEFAULTS, mergeGeneral, NAV_HIDEABLE, NAV_DEFAULTS, mergeNav,
} from "./settingsDefaults";

describe("mergeGeneral — Defaults an EINER Stelle (Falle 3)", () => {
  it("null → volle Defaults", () => {
    expect(mergeGeneral(null)).toEqual(GENERAL_DEFAULTS);
  });
  it("Teil-Override: nur gesetzte Keys gewinnen, Rest Default", () => {
    expect(mergeGeneral({ language: "en" })).toEqual({ ...GENERAL_DEFAULTS, language: "en" });
    expect(mergeGeneral({ currency: "USD", timezone: "America/New_York" })).toEqual({
      ...GENERAL_DEFAULTS, currency: "USD", timezone: "America/New_York",
    });
  });
});

describe("mergeNav — Ansicht (rein visuell, settings nie versteckt, kein Eintrag verloren)", () => {
  it("null → Default (nichts versteckt, kanonische Reihenfolge)", () => {
    expect(mergeNav(null)).toEqual(NAV_DEFAULTS);
  });
  it("'settings' kann NIE ausgeblendet werden", () => {
    const r = mergeNav({ hidden: ["settings", "hunter"] });
    expect(r.hidden).not.toContain("settings");
    expect(r.hidden).toContain("hunter");
  });
  it("unbekannte Routen werden gefiltert (hidden + order)", () => {
    expect(mergeNav({ hidden: ["bogus"] }).hidden).toEqual([]);
    expect(mergeNav({ order: ["bogus", "hunter"] }).order).not.toContain("bogus");
  });
  it("Reihenfolge-Reparatur: gespeicherte zuerst, fehlende kanonisch angehängt — kein Eintrag verloren", () => {
    const r = mergeNav({ order: ["hunter", "farmer"] });
    expect(r.order.slice(0, 2)).toEqual(["hunter", "farmer"]);
    expect([...r.order].sort()).toEqual([...NAV_HIDEABLE].sort());
    expect(r.order.length).toBe(NAV_HIDEABLE.length);
  });
});
