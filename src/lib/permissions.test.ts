import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  effectivePermissions,
  hasPermission,
  isElevatedRole,
} from "./permissions";

describe("Rollen-Matrix (Spiegel role_permissions-Seed, 070/073) — heute-existierende Rechte", () => {
  it("Katalog = die 4 Basis-Rechte + SET-4 (rules.edit, pipeline.manage, automation.manage)", () => {
    expect([...PERMISSIONS].sort()).toEqual(
      ["automation.manage", "pipeline.manage", "records.delete", "records.merge",
       "rules.edit", "settings.manage", "team.invite"],
    );
  });
  it("SET-4-Rechte nur owner/admin (member/viewer NICHT) — Migr. 083", () => {
    for (const p of ["rules.edit", "pipeline.manage", "automation.manage"]) {
      expect(hasPermission("owner", p)).toBe(true);
      expect(hasPermission("admin", p)).toBe(true);
      expect(hasPermission("member", p)).toBe(false);
      expect(hasPermission("viewer", p)).toBe(false);
    }
  });
  it("owner hat ALLE Rechte", () => {
    expect([...ROLE_PERMISSIONS.owner].sort()).toEqual([...PERMISSIONS].sort());
  });
  it("admin hat alle Rechte (keines ist billing)", () => {
    expect(ROLE_PERMISSIONS.admin).toContain("records.delete");
    expect(ROLE_PERMISSIONS.admin).toContain("records.merge");
    expect(ROLE_PERMISSIONS.admin).toContain("team.invite");
    expect(ROLE_PERMISSIONS.admin).toContain("settings.manage");
  });
  it("settings.manage nur owner/admin (member/viewer NICHT) — SET-2", () => {
    expect(hasPermission("owner", "settings.manage")).toBe(true);
    expect(hasPermission("admin", "settings.manage")).toBe(true);
    expect(hasPermission("member", "settings.manage")).toBe(false);
    expect(hasPermission("viewer", "settings.manage")).toBe(false);
  });
  it("member = keine erhöhten Rechte, viewer = nichts", () => {
    expect(ROLE_PERMISSIONS.member).toEqual([]);
    expect(ROLE_PERMISSIONS.viewer).toEqual([]);
  });
  it("records.delete nur owner/admin (member/viewer NICHT) — [D-delete-rights]", () => {
    expect(hasPermission("owner", "records.delete")).toBe(true);
    expect(hasPermission("admin", "records.delete")).toBe(true);
    expect(hasPermission("member", "records.delete")).toBe(false);
    expect(hasPermission("viewer", "records.delete")).toBe(false);
  });
  it("records.merge nur owner/admin (Duplikat-Merge existiert heute) — Teil-D-Scan", () => {
    expect(hasPermission("owner", "records.merge")).toBe(true);
    expect(hasPermission("admin", "records.merge")).toBe(true);
    expect(hasPermission("member", "records.merge")).toBe(false);
    expect(hasPermission("viewer", "records.merge")).toBe(false);
  });
});

describe("effectivePermissions — deny > grant > Rolle (Spiegel has_permission SQL)", () => {
  it("Einzel-Grant erweitert additiv (Member bekommt records.delete)", () => {
    expect(hasPermission("member", "records.delete")).toBe(false);
    expect(hasPermission("member", "records.delete", [{ permission: "records.delete", effect: "grant" }])).toBe(true);
  });
  it("Deny entzieht ein Rollen-Recht (subtraktiv) — deny gewinnt", () => {
    expect(hasPermission("admin", "records.delete")).toBe(true);
    expect(hasPermission("admin", "records.delete", [{ permission: "records.delete", effect: "deny" }])).toBe(false);
  });
  it("Deny gewinnt auch über Grant derselben Permission", () => {
    const ov = [
      { permission: "records.merge", effect: "grant" as const },
      { permission: "records.merge", effect: "deny" as const },
    ];
    expect(hasPermission("member", "records.merge", ov)).toBe(false);
  });
  it("unbekannte Rolle → keine Rechte", () => {
    expect(effectivePermissions("was_neues").size).toBe(0);
  });
});

describe("isElevatedRole — ersetzt verstreute role===-Checks", () => {
  it("owner/admin elevated, member/viewer nicht", () => {
    expect(isElevatedRole("owner")).toBe(true);
    expect(isElevatedRole("admin")).toBe(true);
    expect(isElevatedRole("member")).toBe(false);
    expect(isElevatedRole("viewer")).toBe(false);
  });
});
