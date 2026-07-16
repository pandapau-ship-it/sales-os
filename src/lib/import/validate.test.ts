import { describe, it, expect } from "vitest";
import { validateRow, validateImport, summarize } from "./validate";
import type { MappedRecord } from "./types";
import type { ExistingContact } from "@/lib/dedup";

const existing: ExistingContact[] = [
  { id: "c1", email: "max@acme.io", linkedin_url: null, first_name: "Max", last_name: "Muster", company_name: "Acme GmbH" },
];

describe("validateRow (K-5 Schicht 3)", () => {
  it("gültige Zeile (Name vorhanden, kein Duplikat) → valid", () => {
    const r = validateRow(0, { first_name: "Neu", last_name: "Person" }, existing);
    expect(r.status).toBe("valid");
  });

  it("Pflichtfeld fehlt (nur Vorname, kein LinkedIn) → error (K1)", () => {
    const r = validateRow(0, { first_name: "Nur" }, existing);
    expect(r.status).toBe("error");
    expect(r.errors?.last_name).toBeTruthy();
  });

  it("ungültige E-Mail → error", () => {
    const r = validateRow(0, { first_name: "A", last_name: "B", email: "kaputt" }, existing);
    expect(r.status).toBe("error");
    expect(r.errors?.email).toBeTruthy();
  });

  it("ungültige LinkedIn-URL → error", () => {
    const r = validateRow(0, { first_name: "A", last_name: "B", linkedin_url: "nichturl" }, existing);
    expect(r.status).toBe("error");
    expect(r.errors?.linkedin_url).toBeTruthy();
  });

  it("E-Mail-Duplikat gegen Bestand → duplicate (sicher, K2)", () => {
    const r = validateRow(0, { first_name: "X", last_name: "Y", email: "MAX@acme.io" }, existing);
    expect(r.status).toBe("duplicate");
    expect(r.duplicate).toMatchObject({ level: "sicher", matchType: "email", matchedId: "c1" });
  });

  it("Fehler schlägt Duplikat: ungültige Zeile bleibt error, nicht duplicate", () => {
    const r = validateRow(0, { first_name: "X", last_name: "Y", email: "max@acme.io", linkedin_url: "kaputt" }, existing);
    expect(r.status).toBe("error");
  });
});

describe("validateImport — Intra-Datei-Duplikate", () => {
  it("zweite identische E-Mail in der Datei → duplicate", () => {
    const records: MappedRecord[] = [
      { first_name: "Neu", last_name: "Eins", email: "neu@x.io" },
      { first_name: "Neu", last_name: "Zwei", email: "neu@x.io" }, // gleiche Mail
    ];
    const rows = validateImport(records, []);
    expect(rows[0].status).toBe("valid");
    expect(rows[1].status).toBe("duplicate");
  });

  it("verschiedene Kontakte bleiben beide valid", () => {
    const rows = validateImport(
      [
        { first_name: "A", last_name: "Eins", email: "a@x.io" },
        { first_name: "B", last_name: "Zwei", email: "b@x.io" },
      ],
      [],
    );
    expect(rows.every((r) => r.status === "valid")).toBe(true);
  });
});

describe("summarize — Report (K8, echte Zahlen)", () => {
  it("zählt valid/error/duplicate", () => {
    const rows = validateImport(
      [
        { first_name: "Gut", last_name: "Zeile" }, // valid
        { first_name: "Nur" }, // error (kein Nachname/LinkedIn)
        { first_name: "Max", last_name: "Muster", email: "max@acme.io" }, // duplicate
      ],
      existing,
    );
    const rep = summarize(rows);
    expect(rep).toEqual({ total: 3, valid: 1, error: 1, duplicate: 1 });
  });
});
