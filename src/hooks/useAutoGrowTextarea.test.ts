import { describe, it, expect } from "vitest";
import { createCoupleGroup } from "./useAutoGrowTextarea";

/**
 * Kopplungs-Logik (dos_donts-Paar). Getestet wird die reine Gruppe ohne DOM-Layout: „Element" =
 * Objekt mit `style.height`. Kernzusagen: beide bekommen das Maximum · genau ein Ergebnis (keine
 * Rückkopplung/kein Aufschaukeln) · Abmelden rechnet neu · leere Gruppe schreibt nichts.
 */
type FakeEl = { style: { height: string } };
const el = (): FakeEl => ({ style: { height: "" } });
// createCoupleGroup ist auf HTMLTextAreaElement typisiert — im Test genügt das style.height-Duck-Typing.
const asTa = (e: FakeEl) => e as unknown as HTMLTextAreaElement;

describe("createCoupleGroup — Höhen-Kopplung des Paares", () => {
  it("beide Felder bekommen die Höhe des LÄNGEREN (Maximum)", () => {
    const g = createCoupleGroup();
    const a = el(), b = el();
    g.register(asTa(a)); g.register(asTa(b));
    g.report(asTa(a), 40);
    g.report(asTa(b), 90);
    expect(a.style.height).toBe("90px");
    expect(b.style.height).toBe("90px");
  });

  it("konvergiert zu GENAU EINEM Ergebnis — erneutes Melden desselben Inhalts ändert nichts (kein Zittern)", () => {
    const g = createCoupleGroup();
    const a = el(), b = el();
    g.register(asTa(a)); g.register(asTa(b));
    g.report(asTa(a), 60);
    g.report(asTa(b), 30);
    expect(a.style.height).toBe("60px");
    expect(b.style.height).toBe("60px");
    // Idempotenz: gleiche Meldung erneut → identisches Ergebnis, kein Aufschaukeln.
    g.report(asTa(a), 60);
    g.report(asTa(b), 30);
    expect(a.style.height).toBe("60px");
    expect(b.style.height).toBe("60px");
  });

  it("das kürzere Feld wächst mit, wenn das andere länger wird (bündig)", () => {
    const g = createCoupleGroup();
    const a = el(), b = el();
    g.register(asTa(a)); g.register(asTa(b));
    g.report(asTa(a), 40);
    g.report(asTa(b), 40);
    expect(a.style.height).toBe("40px");
    // b wächst → a zieht mit.
    g.report(asTa(b), 120);
    expect(a.style.height).toBe("120px");
    expect(b.style.height).toBe("120px");
  });

  it("Abmelden eines Feldes rechnet das Maximum neu", () => {
    const g = createCoupleGroup();
    const a = el(), b = el();
    g.register(asTa(a));
    const unregisterB = g.register(asTa(b));
    g.report(asTa(a), 50);
    g.report(asTa(b), 100);
    expect(a.style.height).toBe("100px");
    // b verschwindet (Tab-Wechsel/Unmount) → nur noch a zählt → neues Maximum 50.
    unregisterB();
    expect(a.style.height).toBe("50px");
  });

  it("leere/nullige Gruppe setzt keine Höhe (kein 0px-Kollaps)", () => {
    const g = createCoupleGroup();
    const a = el();
    g.register(asTa(a));
    g.report(asTa(a), 0); // noch keine echte Messung
    expect(a.style.height).toBe(""); // unangetastet
  });
});
