import { describe, it, expect } from "vitest";
import {
  SETTINGS_PAGES, SETTINGS_GROUP_ORDER, canSeeSettingsPage, visibleSettingsPages,
  type SettingsPage,
} from "./settingsNav";

const page = (over: Partial<SettingsPage>): SettingsPage => ({
  key: "x", group: "organisation", visibility: "self", built: true, ...over,
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

describe("Vollständige Settings-Navigation (SET-3, Bauplan Abschnitt 1)", () => {
  const owner = { isElevated: true, has: () => true };

  it("fünf Nav-Gruppen in Bauplan-Reihenfolge — 'personal' ist KEINE Nav-Gruppe", () => {
    expect([...SETTINGS_GROUP_ORDER]).toEqual([
      "organisation", "arbeitsweise", "ai", "verbindungen", "system",
    ]);
    expect(SETTINGS_GROUP_ORDER).not.toContain("personal");
  });

  it("ORGANISATION enthält Team & Rechte (nicht als eigene Top-Gruppe)", () => {
    const keys = visibleSettingsPages("organisation", owner).map((p) => p.key);
    expect(keys).toEqual(["allgemein", "unternehmensprofil", "team", "abo-credits", "papierkorb"]);
  });

  it("alle Gruppen sind befüllt (Hülle vollständig)", () => {
    for (const g of SETTINGS_GROUP_ORDER) {
      expect(visibleSettingsPages(g, owner).length, g).toBeGreaterThan(0);
    }
  });

  it("NUR 'team' ist gebaut — alles andere in der Haupt-Nav ausgegraut ('Folgt')", () => {
    const builtInNav = SETTINGS_PAGES.filter((p) => p.group !== "personal" && p.built).map((p) => p.key);
    expect(builtInNav).toEqual(["team"]);
  });

  it("Persönlich-Seiten bleiben Registry-Einträge mit Route auf /app/profil", () => {
    const personal = SETTINGS_PAGES.filter((p) => p.group === "personal");
    expect(personal.map((p) => p.key)).toEqual(["mein-profil", "ansicht", "sicherheit"]);
    expect(personal.every((p) => p.route === "/app/profil")).toBe(true);
  });

  it("SYSTEM nur für Owner/Admin sichtbar", () => {
    const member = { isElevated: false, has: (p: string) => p === "team.invite" };
    expect(visibleSettingsPages("system", member)).toEqual([]);
    expect(visibleSettingsPages("system", owner).map((p) => p.key)).toEqual(["status", "audit-log"]);
  });

  it("Member mit team.invite sieht Team, aber keine settings.manage-Seiten", () => {
    const member = { isElevated: false, has: (p: string) => p === "team.invite" };
    const keys = visibleSettingsPages("organisation", member).map((p) => p.key);
    expect(keys).toEqual(["team"]);
  });
});
