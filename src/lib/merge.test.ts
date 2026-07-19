import { describe, it, expect } from "vitest";
import {
  countFilled, pickPrimaryId, resolveMergeFields, findDuplicatePairs, findCompanyDuplicatePairs,
  diffFields, defaultMergeSide, CONTACT_FK_SIMPLE, CONTACT_FK_SPECIAL, COMPANY_FK,
} from "./merge";
import type { ExistingContact } from "./dedup";

describe("countFilled / pickPrimaryId", () => {
  const fields = ["first_name", "last_name", "email", "job_title"];
  it("zählt nur befüllte Felder", () => {
    expect(countFilled({ first_name: "A", last_name: "", email: null, job_title: "X" }, fields)).toBe(2);
  });
  it("der befülltere Datensatz wird Primär", () => {
    const a = { id: "a", first_name: "A", last_name: "B", email: "a@x.de", job_title: "" };
    const b = { id: "b", first_name: "A", last_name: "", email: "", job_title: "" };
    expect(pickPrimaryId(a, b, fields)).toBe("a");
  });
  it("bei Gleichstand gewinnt der ältere (created_at)", () => {
    const a = { id: "a", first_name: "A", created_at: "2026-05-01" };
    const b = { id: "b", first_name: "B", created_at: "2026-01-01" };
    expect(pickPrimaryId(a, b, ["first_name"])).toBe("b");
  });
});

describe("defaultMergeSide — K-6a-Vorauswahl (befüllter Wert gewinnt)", () => {
  it("Gewinner am Feld befüllt → winner", () => {
    expect(defaultMergeSide({ job_title: "CTO" }, { job_title: null }, "job_title")).toBe("winner");
  });
  it("Gewinner am Feld leer, Verlierer befüllt → loser (kein Datenverlust)", () => {
    expect(defaultMergeSide({ linkedin_url: null }, { linkedin_url: "ln" }, "linkedin_url")).toBe("loser");
    expect(defaultMergeSide({ city: "" }, { city: "Berlin" }, "city")).toBe("loser");
  });
  it("beide befüllt (abweichend) → winner (Gewinner-Wert vorbelegt, manuell überschreibbar)", () => {
    expect(defaultMergeSide({ first_name: "Thomas" }, { first_name: "Tom" }, "first_name")).toBe("winner");
  });
});

describe("resolveMergeFields — Auto-Default + Override", () => {
  const fields = ["first_name", "last_name", "email", "job_title"];
  it("Gewinner-Wert bleibt, Lücken werden aus dem Verlierer gefüllt", () => {
    const winner = { first_name: "Jürgen", last_name: "", email: "j@x.de", job_title: "Leiter" };
    const loser = { first_name: "J.", last_name: "Müller", email: "alt@x.de", job_title: "" };
    const patch = resolveMergeFields(winner, loser, fields);
    // last_name war leer → aus Verlierer gefüllt; first_name/email/job_title unverändert (kein Patch).
    expect(patch).toEqual({ last_name: "Müller" });
  });
  it("Override gewinnt über beide", () => {
    const winner = { first_name: "Jürgen", email: "j@x.de" };
    const loser = { first_name: "J.", email: "alt@x.de" };
    const patch = resolveMergeFields(winner, loser, ["first_name", "email"], { email: "neu@x.de" });
    expect(patch).toEqual({ email: "neu@x.de" });
  });
  it("kein Patch, wenn Gewinner bereits alles hat", () => {
    const winner = { first_name: "A", last_name: "B" };
    const loser = { first_name: "C", last_name: "D" };
    expect(resolveMergeFields(winner, loser, ["first_name", "last_name"])).toEqual({});
  });
});

describe("diffFields — Merge-Dialog Feld-Vergleich", () => {
  it("trennt abweichende von identischen Feldern (leer/case-insensitiv)", () => {
    const a = { first_name: "Tom", last_name: "Fischer", email: "t@x.de", phone: "" };
    const b = { first_name: "Thomas", last_name: "fischer", email: "t@x.de", phone: "" };
    const { differing, identical } = diffFields(a, b, ["first_name", "last_name", "email", "phone"]);
    expect(differing).toEqual(["first_name"]); // last_name gleich (case), email gleich, phone beide leer
    expect(identical).toEqual(["last_name", "email"]); // phone leer → nicht als „identisch" gelistet
  });
});

describe("FK-Kaskaden-Abdeckung (Akzeptanz: ein Verweistyp pro Testfall)", () => {
  it("Contact-Merge deckt alle contact_id-Tabellen ab", () => {
    const all = [...CONTACT_FK_SIMPLE, ...CONTACT_FK_SPECIAL];
    for (const t of ["communications", "contact_phones", "deals", "leads", "list_members", "messages", "notes", "signals", "tasks"]) {
      expect(all).toContain(t);
    }
  });
  it("list_members + contact_phones sind Sonderfälle (Konflikt-Handling), nicht simple", () => {
    expect(CONTACT_FK_SPECIAL).toContain("list_members"); // UNIQUE(list_id,contact_id)
    expect(CONTACT_FK_SPECIAL).toContain("contact_phones"); // is_primary-Konflikt
    expect(CONTACT_FK_SIMPLE).not.toContain("list_members");
  });
  it("Company-Merge deckt company_id + primary_company_id ab", () => {
    const cols = COMPANY_FK.map((f) => `${f.table}.${f.column}`);
    expect(cols).toContain("contacts.company_id");
    expect(cols).toContain("contacts.primary_company_id");
    expect(cols).toContain("deals.company_id");
  });
});

describe("findDuplicatePairs — sichere Paare (E-Mail/LinkedIn exakt)", () => {
  const c = (id: string, email?: string | null, linkedin?: string | null, first?: string): ExistingContact => ({
    id, email: email ?? null, linkedin_url: linkedin ?? null, first_name: first ?? null, last_name: null, company_name: null,
  });
  it("findet ein Paar bei gleicher E-Mail", () => {
    const pairs = findDuplicatePairs([c("1", "a@x.de"), c("2", "a@x.de"), c("3", "b@x.de")]);
    expect(pairs).toHaveLength(1);
    expect([pairs[0].aId, pairs[0].bId].sort()).toEqual(["1", "2"]);
    expect(pairs[0].level).toBe("sicher");
  });
  it("dedupliziert Paare (E-Mail UND LinkedIn gleich → nur ein Paar)", () => {
    const pairs = findDuplicatePairs([c("1", "a@x.de", "linkedin.com/in/a"), c("2", "a@x.de", "linkedin.com/in/a")]);
    expect(pairs).toHaveLength(1);
  });
  it("keine sicheren Paare ohne exakten E-Mail/LinkedIn-Treffer", () => {
    // Verschiedene E-Mails, verschiedene Namen/Firmen → gar kein Treffer.
    const a: ExistingContact = { id: "1", email: "a@x.de", linkedin_url: null, first_name: "Anna", last_name: "Alt", company_name: "Acme" };
    const b: ExistingContact = { id: "2", email: "b@x.de", linkedin_url: null, first_name: "Bert", last_name: "Berg", company_name: "Zeta" };
    expect(findDuplicatePairs([a, b])).toHaveLength(0);
  });

  it("findet ein MÖGLICH-Paar bei gleichem Name + gleicher Firma (ohne E-Mail/LinkedIn)", () => {
    const a: ExistingContact = { id: "1", email: null, linkedin_url: null, first_name: "Jürgen", last_name: "Müller", company_name: "Acme GmbH" };
    const b: ExistingContact = { id: "2", email: null, linkedin_url: null, first_name: "Jürgen", last_name: "Müller", company_name: "Acme" };
    const pairs = findDuplicatePairs([a, b]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].level).toBe("moeglich");
    expect(pairs[0].matchType).toBe("name_company");
  });

  it("ein SICHER-Paar wird NICHT zusätzlich als möglich gemeldet (Doppel-Vermeidung)", () => {
    const a: ExistingContact = { id: "1", email: "same@x.de", linkedin_url: null, first_name: "Jürgen", last_name: "Müller", company_name: "Acme" };
    const b: ExistingContact = { id: "2", email: "same@x.de", linkedin_url: null, first_name: "Jürgen", last_name: "Müller", company_name: "Acme" };
    const pairs = findDuplicatePairs([a, b]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].level).toBe("sicher");
  });
});

describe("findCompanyDuplicatePairs — exakte Domain", () => {
  it("findet ein Paar bei gleicher Domain (sicher)", () => {
    const pairs = findCompanyDuplicatePairs([
      { id: "1", name: "Acme GmbH", domain: "acme.de" },
      { id: "2", name: "Acme", domain: "acme.de" },
      { id: "3", name: "Other", domain: "other.de" },
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].level).toBe("sicher");
    expect(pairs[0].matchType).toBe("domain");
  });

  it("findet ein MÖGLICH-Paar bei ähnlichem Namen ohne Domain", () => {
    const pairs = findCompanyDuplicatePairs([
      { id: "1", name: "Acme GmbH", domain: null },
      { id: "2", name: "Acme", domain: null },
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].level).toBe("moeglich");
    expect(pairs[0].matchType).toBe("name");
  });
});
