import { describe, it, expect } from "vitest";
import { pickRoundRobin, resolveOwner } from "./leadAssignment";

describe("pickRoundRobin (K9)", () => {
  const users = ["u1", "u2", "u3"];

  it("erster Lauf (kein lastAssigned) → erster User", () => {
    expect(pickRoundRobin(users, null)).toBe("u1");
  });

  it("reihum: nach u1 kommt u2, nach u2 u3", () => {
    expect(pickRoundRobin(users, "u1")).toBe("u2");
    expect(pickRoundRobin(users, "u2")).toBe("u3");
  });

  it("wrap-around: nach dem letzten wieder der erste", () => {
    expect(pickRoundRobin(users, "u3")).toBe("u1");
  });

  it("unbekannter lastAssigned (nicht mehr aktiv) → erster User", () => {
    expect(pickRoundRobin(users, "ausgeschieden")).toBe("u1");
  });

  it("keine Sales-User → null (Aufrufer: unassigned/manual)", () => {
    expect(pickRoundRobin([], "u1")).toBeNull();
  });

  it("ein einziger User → immer derselbe", () => {
    expect(pickRoundRobin(["solo"], "solo")).toBe("solo");
  });

  it("volle Runde verteilt jeden genau einmal", () => {
    let last: string | null = null;
    const seen: string[] = [];
    for (let i = 0; i < users.length; i++) {
      last = pickRoundRobin(users, last);
      seen.push(last!);
    }
    expect(seen.sort()).toEqual(["u1", "u2", "u3"]);
  });
});

describe("resolveOwner (K9)", () => {
  const users = ["u1", "u2"];

  it("round_robin nutzt die Reihum-Logik", () => {
    expect(resolveOwner("round_robin", users, "u1")).toBe("u2");
  });

  it("manual_only → kein Auto-Owner", () => {
    expect(resolveOwner("manual_only", users, null)).toBeNull();
  });

  it("noch nicht gebaute Strategien fallen dokumentiert auf round_robin zurück (kein stiller Fehler)", () => {
    expect(resolveOwner("by_region", users, null)).toBe("u1");
    expect(resolveOwner("by_source", users, "u1")).toBe("u2");
  });
});
