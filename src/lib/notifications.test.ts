import { describe, it, expect } from "vitest";
import {
  NOTIFICATION_SEVERITIES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_GROUPS,
  NOTIFICATION_SOURCE_TYPES,
  ACTIVITY_EVENT_TYPES,
  isKnownCategory,
  isKnownSeverity,
  groupOf,
  notificationIdempotencyKey,
  groupByNotificationGroup,
} from "./notifications";

// Diese Tests decken die reine Registry-/Key-Logik ab. Das DB-Verhalten von notify()/log_activity()
// (Erzeugen, Idempotenz-Upsert, Realtime, Cleanup — Akzeptanz a-d) wird zur Laufzeit per RPC gegen
// Remote verifiziert (wie beim Entitlement-Fundament), da plpgsql nicht in vitest läuft.

describe("Registry — bekannte Werte stabil & datengetrieben (Punkt 2)", () => {
  it("Severities vollständig", () => {
    expect([...NOTIFICATION_SEVERITIES]).toEqual(["low", "normal", "high", "urgent"]);
  });
  it("jede Kategorie hat eine gültige Anzeige-Gruppe + E-Mail-Default", () => {
    for (const [cat, cfg] of Object.entries(NOTIFICATION_CATEGORIES)) {
      expect(NOTIFICATION_GROUPS).toContain(cfg.group);
      expect(["instant", "digest", "off"]).toContain(cfg.emailDefault);
      expect(groupOf(cat)).toBe(cfg.group);
    }
  });
  it("Braucht-dich-Kategorien (approval/credit) sind E-Mail-instant", () => {
    expect(NOTIFICATION_CATEGORIES.approval.emailDefault).toBe("instant");
    expect(NOTIFICATION_CATEGORIES.credit.emailDefault).toBe("instant");
  });
  it("source_types + activity event types nicht leer", () => {
    expect(NOTIFICATION_SOURCE_TYPES.length).toBeGreaterThan(0);
    expect(ACTIVITY_EVENT_TYPES).toContain("auto_send");
  });
  it("Validatoren", () => {
    expect(isKnownCategory("approval")).toBe(true);
    expect(isKnownCategory("was_neues")).toBe(false); // unbekannt = kein Block, nur nicht-gemappt
    expect(isKnownSeverity("urgent")).toBe(true);
    expect(isKnownSeverity("panic")).toBe(false);
    expect(groupOf("was_neues")).toBeNull();
  });
});

describe("groupByNotificationGroup — 4 Gruppen, feste Reihenfolge, leere weg (N2)", () => {
  it("gruppiert in fester Reihenfolge, leere Gruppen weggelassen", () => {
    const items = [
      { id: "1", category: "team" },
      { id: "2", category: "approval" }, // braucht_dich
      { id: "3", category: "report" }, // berichte
    ];
    const g = groupByNotificationGroup(items);
    expect(g.map((x) => x.group)).toEqual(["braucht_dich", "berichte", "team"]); // system fehlt (leer)
    expect(g[0].items[0].id).toBe("2");
  });
  it("unbekannte category → Gruppe system (sichtbar, nie verschluckt)", () => {
    const g = groupByNotificationGroup([{ id: "x", category: "was_neues" }]);
    expect(g).toHaveLength(1);
    expect(g[0].group).toBe("system");
    expect(g[0].items[0].id).toBe("x");
  });
  it("leere Eingabe → keine Gruppen", () => {
    expect(groupByNotificationGroup([])).toEqual([]);
  });
});

describe("notificationIdempotencyKey — spiegelt DB-UNIQUE (Punkt 5)", () => {
  const base = {
    organizationId: "org1",
    userId: "u1",
    sourceType: "approval_requests",
    sourceId: "req-42",
    category: "approval",
  };

  it("enthält alle fünf Bestandteile", () => {
    const key = notificationIdempotencyKey(base);
    for (const part of ["org1", "u1", "approval_requests", "req-42", "approval"]) {
      expect(key).toContain(part);
    }
  });

  it("gleiche Parts → gleicher Key (Update-Fall N12)", () => {
    expect(notificationIdempotencyKey(base)).toBe(notificationIdempotencyKey({ ...base }));
  });

  it("ZWEI verschiedene User, gleiche Quelle+Kategorie → VERSCHIEDENE Keys (Punkt-5-Guard)", () => {
    const admin1 = notificationIdempotencyKey({ ...base, userId: "admin1" });
    const admin2 = notificationIdempotencyKey({ ...base, userId: "admin2" });
    expect(admin1).not.toBe(admin2); // sonst würden zwei Admins in EINE Zeile fallen
  });

  it("unterschiedliche source_id / category → unterschiedliche Keys", () => {
    expect(notificationIdempotencyKey(base)).not.toBe(
      notificationIdempotencyKey({ ...base, sourceId: "req-99" }),
    );
    expect(notificationIdempotencyKey(base)).not.toBe(
      notificationIdempotencyKey({ ...base, category: "credit" }),
    );
  });
});
