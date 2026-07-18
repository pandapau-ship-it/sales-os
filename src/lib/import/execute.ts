/**
 * import/execute.ts — Schicht 4 (Ausführungs-Planung) der Smart-Import-Engine (K-5).
 *
 * REIN + testbar: übersetzt die validierten Zeilen (Schicht 3) + die Pro-Zeile-Entscheidungen
 * des Users in einen konkreten Schreib-Plan. Kein DB-Zugriff — den macht `runImport` in db.ts.
 *
 * Entscheidungs-Modell (K8, ehrlich): NICHTS wird still verworfen, jede Zeile hat einen sichtbaren
 * Ausgang.
 *  - `valid`     → anlegen (Default), außer der User wählt „überspringen".
 *  - `duplicate` → überspringen (Default), außer der User wählt „trotzdem anlegen" (`create`).
 *  - `error`     → IMMER überspringen (eine ungültige Zeile lässt sich nicht anlegen; ein
 *                  „create"-Override wird bewusst ignoriert).
 *
 * Pro-Zeile „Zusammenführen" (Merge in einen bestehenden Kontakt) ist NICHT Teil von K-5 —
 * Merge ist ein eigener Slice (K-6, `merge_contacts`). Die Import-UI bietet es erst dann an.
 */

import type { MappedRecord, RowStatus, ValidatedRow } from "./types";

/** User-Override pro Zeile (Index → Wunsch). Fehlt ein Eintrag, gilt die Default-Politik. */
export type RowDecision = "create" | "skip";

/** Konkreter Schreib-Plan: was wird tatsächlich angelegt, was (und warum) übersprungen. */
export interface ImportPlan {
  /** Datensätze, die angelegt werden (in Datei-Reihenfolge). */
  toCreate: MappedRecord[];
  createCount: number;
  skippedDuplicate: number;
  skippedError: number;
  total: number;
}

/** Default-Ausgang einer Zeile nach Status (vor User-Override). */
function defaultDecision(status: RowStatus): RowDecision {
  return status === "valid" ? "create" : "skip";
}

/**
 * Schreib-Plan aus validierten Zeilen + optionalen Pro-Zeile-Overrides bauen.
 * `decisions` ist Zeilen-Index → Wunsch; Fehler-Zeilen bleiben IMMER übersprungen.
 */
export function buildImportPlan(
  rows: ValidatedRow[],
  decisions: Record<number, RowDecision> = {},
): ImportPlan {
  const toCreate: MappedRecord[] = [];
  let skippedDuplicate = 0;
  let skippedError = 0;

  for (const row of rows) {
    // Fehler-Zeilen sind nicht anlegbar — Override wird ignoriert (Honesty statt kaputter Insert).
    if (row.status === "error") {
      skippedError++;
      continue;
    }
    const decision = decisions[row.index] ?? defaultDecision(row.status);
    if (decision === "create") {
      toCreate.push(row.record);
    } else if (row.status === "duplicate") {
      skippedDuplicate++;
    }
    // valid + „skip" (User hat die Zeile bewusst abgewählt) → zählt in keiner Skip-Kategorie,
    // aber steckt im `total`-Delta (nicht angelegt, kein Duplikat, kein Fehler).
  }

  return {
    toCreate,
    createCount: toCreate.length,
    skippedDuplicate,
    skippedError,
    total: rows.length,
  };
}

/**
 * E-Mail → Domain (lowercase, ohne führendes „@"), für den Company-Domain-Match beim Import
 * (Schicht 4: bestehende Company über Domain finden, sonst über Name). null bei fehlender/
 * unplausibler Adresse.
 */
export function extractEmailDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  // Minimale Plausibilität: mindestens ein Punkt, keine Leerzeichen, nicht leer.
  if (!domain || domain.includes(" ") || !domain.includes(".")) return null;
  return domain;
}
