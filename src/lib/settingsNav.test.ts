import { describe, it, expect } from "vitest";
import { SETTINGS_PAGES, canSeeSettingsPage, type SettingsPage } from "./settingsNav";

const page = (over: Partial<SettingsPage>): SettingsPage => ({
  key: "x", group: "workspace", visibility: "self", built: true, ...over,
});

describe("canSeeSettingsPage — Rollen-Sichtbarkeit baut auf SET-1-Katalog", () => {
  it("'self' → jede eingeloggte Person", () => {
    expect(canSeeSettingsPage(page({ visibility: "self" }), { isElevated: false, has: () => false })).toBe(true);
  });
  it("'elevated' → nur Owner/Admin", () => {
    const p = page({ visibility: "elevated" });
    expect(canSeeSettingsPage(p, { isElevated: true, has: () => false })).toBe(true);
    expect(canSeeSettingsPage(p, { isElevated: false, has: () => false })).toBe(false);
  });
  it("Permission → aus dem effektiven Rechte-Set (SET-1)", () => {
    const p = page({ visibility: "settings.manage" });
    expect(canSeeSettingsPage(p, { isElevated: false, has: (x) => x === "settings.manage" })).toBe(true);
    expect(canSeeSettingsPage(p, { isElevated: false, has: () => false })).toBe(false);
  });
  it("Allgemein braucht settings.manage, Mein Profil/Ansicht/Sicherheit sind self", () => {
    const byKey = Object.fromEntries(SETTINGS_PAGES.map((p) => [p.key, p]));
    expect(byKey["allgemein"].visibility).toBe("settings.manage");
    expect(byKey["mein-profil"].visibility).toBe("self");
    expect(byKey["ansicht"].visibility).toBe("self");
    expect(byKey["sicherheit"].visibility).toBe("self");
    expect(byKey["audit-log"].visibility).toBe("elevated");
  });
});
