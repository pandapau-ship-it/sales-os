import { describe, it, expect } from "vitest";
import { reorderColumns, completeColumnOrder } from "./columnOrder";

// Spaltensatz wie in der Praxis: 6 Standard (Set A) + optionale Set-B-Spalten.
const SET_A = ["name", "status", "contactCount", "lastContact", "arr", "routing"];
const SET_B = ["email", "department", "tags", "phone"];
const CURRENT = [...SET_A, ...SET_B];

describe("completeColumnOrder", () => {
  it("ergänzt fehlende (Set-B-)IDs am Ende, wenn die gespeicherte Order unvollständig ist", () => {
    const saved = [...SET_A]; // gespeichert bevor Set-B existierte
    const complete = completeColumnOrder(CURRENT, saved);
    expect(complete).toEqual(CURRENT); // Set-B hinten angehängt
    expect(new Set(complete).size).toBe(CURRENT.length); // keine Duplikate
  });

  it("wirft veraltete IDs raus, die es nicht mehr gibt", () => {
    const saved = ["name", "veraltet", "status"];
    expect(completeColumnOrder(CURRENT, saved)).not.toContain("veraltet");
    expect(completeColumnOrder(CURRENT, saved)).toEqual([
      "name", "status", "contactCount", "lastContact", "arr", "routing", "email", "department", "tags", "phone",
    ]);
  });
});

describe("reorderColumns", () => {
  it("verschiebt eine Standard-Spalte (Set A)", () => {
    const next = reorderColumns(CURRENT, [], "routing", "name");
    expect(next).toEqual(["routing", "name", "status", "contactCount", "lastContact", "arr", "email", "department", "tags", "phone"]);
  });

  // DER BUG: Set-B-Spalte fehlt in der persistierten Order → muss trotzdem verschiebbar sein.
  it("verschiebt eine nachträglich sichtbar geschaltete Set-B-Spalte, die NICHT in der gespeicherten Order steht", () => {
    const savedPartial = [...SET_A]; // enthält KEINE Set-B-IDs (Kern des Bugs)
    const next = reorderColumns(CURRENT, savedPartial, "tags", "status");
    expect(next).not.toBeNull();
    // "tags" landet direkt vor "status" (an dessen bisheriger Position)
    expect(next!.indexOf("tags")).toBe(next!.indexOf("status") - 1);
    expect(next!).toContain("tags");
    // Vollständigkeit erhalten: alle aktuellen IDs, keine Duplikate
    expect(new Set(next!).size).toBe(CURRENT.length);
    expect([...next!].sort()).toEqual([...CURRENT].sort());
  });

  it("Reihenfolge bleibt nach dem Verschieben vollständig und stabil (self-healing)", () => {
    const next = reorderColumns(CURRENT, ["name"], "phone", "name")!;
    expect(next[0]).toBe("phone");
    expect(next[1]).toBe("name");
    expect([...next].sort()).toEqual([...CURRENT].sort());
  });

  it("gibt null zurück bei gleicher Quell-/Ziel-Spalte (kein setState)", () => {
    expect(reorderColumns(CURRENT, [], "name", "name")).toBeNull();
  });

  it("gibt null zurück, wenn eine ID nicht (mehr) existiert", () => {
    expect(reorderColumns(CURRENT, [], "unbekannt", "name")).toBeNull();
    expect(reorderColumns(CURRENT, [], "name", "unbekannt")).toBeNull();
  });
});
