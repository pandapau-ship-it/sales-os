import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  effectivePermissions,
  hasPermission,
  isElevatedRole,
} from "./permissions";

describe("Rollen-Matrix (Spiegel role_permissions-Seed, 070)", () => {
  it("owner hat ALLE Rechte", () => {
    expect([...ROLE_PERMISSIONS.owner].sort()).toEqual([...PERMISSIONS].sort());
  });
  it("admin hat alles AUSSER billing.*", () => {
    expect(ROLE_PERMISSIONS.admin).not.toContain("billing.manage");
    expect(ROLE_PERMISSIONS.admin).not.toContain("billing.approve_credits");
    expect(ROLE_PERMISSIONS.admin).toContain("records.delete");
    expect(ROLE_PERMISSIONS.admin).toContain("team.invite");
  });
  it("member = nur export.all, viewer = nichts", () => {
    expect(ROLE_PERMISSIONS.member).toEqual(["export.all"]);
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
  it("Einzel-Grant erweitert additiv (Member bekommt rules.edit)", () => {
    expect(hasPermission("member", "rules.edit")).toBe(false);
    expect(hasPermission("member", "rules.edit", [{ permission: "rules.edit", effect: "grant" }])).toBe(true);
  });
  it("Deny entzieht ein Rollen-Recht (subtraktiv) — deny gewinnt", () => {
    expect(hasPermission("admin", "records.delete")).toBe(true);
    expect(hasPermission("admin", "records.delete", [{ permission: "records.delete", effect: "deny" }])).toBe(false);
  });
  it("Deny gewinnt auch über Grant derselben Permission", () => {
    const ov = [
      { permission: "campaigns.manage", effect: "grant" as const },
      { permission: "campaigns.manage", effect: "deny" as const },
    ];
    expect(hasPermission("member", "campaigns.manage", ov)).toBe(false);
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
