/**
 * fieldImportance — EINE Quelle für „wie wichtig ist dieses Feld?" (projektweit, erweiterbar).
 *
 * Sie speist ZWEI Verbraucher — heute und später:
 *   1. HEUTE: die Vollständigkeits-Anzeige („Am meisten bringt jetzt: …") in
 *      `companyKnowledge.ts`. Die Rangfolge stand vorher hartkodiert im Berechnungs-Code;
 *      sie lebt jetzt ausschließlich hier.
 *   2. SPÄTER: der AI Chat. Bevor er eine Aktion ausführt, liest er dieselbe Registry und
 *      erkennt, was ihm fehlt → er FRAGT NACH statt zu blockieren oder zu erfinden
 *      (Regel „Progressive Ausführung", docs/ai_chat_bauplan_v1.md).
 * Kein zweites, paralleles System — wer eine Wichtigkeit ändert, ändert beide Verbraucher.
 *
 * WICHTIG — was `required` hier bedeutet (und was NICHT):
 *   `required` heißt **nicht** „Pflichtfeld im Formular". In „Mein Unternehmen" ist NICHTS
 *   Pflicht; der Nutzer darf alles leer lassen, die UI blockiert nie (bereichsweite Regel).
 *   `required` heißt: **ohne diese Angabe kann die zugehörige AI-Aktion nicht sinnvoll
 *   ausgeführt werden** — der Chat muss danach fragen, bevor er handelt.
 *
 * Feldpfade sind die in Migration 077 festgelegten, STABILEN Pfade. `<id>` ist ein Platzhalter
 * für die Datensatz-id — `pathFor()` bildet den konkreten Pfad, `templateOf()` den Rückweg.
 */

export type Importance = "required" | "recommended" | "optional";

export interface FieldImportanceEntry {
  /** Pfad-Vorlage mit `<id>`-Platzhalter, z.B. "product.<id>.benefit". STABIL — nie umbenennen. */
  path: string;
  importance: Importance;
  /** Warum diese Einstufung — erscheint im Chat als Begründung der Rückfrage. */
  reason: string;
  /** Rang innerhalb derselben Einstufung (kleiner = zuerst). Steuert den Wirkungshinweis. */
  order: number;
  /** i18n-Suffix des Hinweistexts der Vollständigkeits-Anzeige (`company.hint.<hintKey>`). */
  hintKey: string;
}

/**
 * Registry. Neue Felder (Slice 2 Personal Voice, Slice 3 Unternehmensprofil/ICPs/Personas)
 * werden hier ergänzt — nicht im UI-Code, nicht in der Berechnung.
 */
export const FIELD_IMPORTANCE: readonly FieldImportanceEntry[] = [
  {
    path: "product.<id>.name",
    importance: "required",
    reason: "Ohne Produktnamen kann keine Nachricht das Angebot benennen.",
    order: 1,
    hintKey: "name",
  },
  {
    path: "product.<id>.benefit",
    importance: "required",
    reason: "Der Hauptnutzen trägt jede Nachricht — ohne ihn bleibt der Text generisch.",
    order: 2,
    hintKey: "benefit",
  },
  {
    path: "product.<id>.audience",
    importance: "recommended",
    reason: "Die Zielgruppe entscheidet über Tonfall und Beispiele in der Ansprache.",
    order: 3,
    hintKey: "audience",
  },
  {
    path: "org.usps",
    importance: "recommended",
    reason: "Aus den USPs formuliert die AI den Pitch.",
    order: 4,
    hintKey: "usps",
  },
  {
    path: "product.<id>.description",
    importance: "recommended",
    reason: "Gibt der AI Kontext, was das Produkt überhaupt ist.",
    order: 5,
    hintKey: "description",
  },
  {
    path: "org.competitors",
    importance: "optional",
    reason: "Hilft nur bei der Einwand-Behandlung (Warum ihr statt X).",
    order: 6,
    hintKey: "competitorWhy",
  },
  {
    path: "product.<id>.price",
    importance: "optional",
    reason:
      "Preise sind selten verbindlich und standardmäßig für die AI gesperrt " +
      "(ai_may_reference_price) — bewusst KEIN Anreiz zum Ausfüllen.",
    order: 7,
    hintKey: "price",
  },
  {
    path: "product.<id>.price_model",
    importance: "optional",
    reason: "Nur relevant, wenn ein Preis genannt werden darf.",
    order: 8,
    hintKey: "priceModel",
  },
] as const;

const byPath = new Map(FIELD_IMPORTANCE.map((e) => [e.path, e]));

/** Konkreter Feldpfad aus Vorlage + Datensatz-id: "product.<id>.benefit" + "p1" → "product.p1.benefit". */
export function pathFor(template: string, id?: string): string {
  return id ? template.replace("<id>", id) : template;
}

/** Rückweg: "product.p1.benefit" → "product.<id>.benefit" (für Registry-Lookups). */
export function templateOf(path: string): string {
  return path.replace(/^product\.[^.]+\./, "product.<id>.");
}

/** Einstufung eines konkreten oder Vorlagen-Pfads. Unbekannt → undefined (nie raten). */
export function importanceOf(path: string): FieldImportanceEntry | undefined {
  return byPath.get(path) ?? byPath.get(templateOf(path));
}

/** Alle Einträge einer Stufe, in Wirkungs-Reihenfolge. */
export function fieldsByImportance(level: Importance): FieldImportanceEntry[] {
  return FIELD_IMPORTANCE.filter((e) => e.importance === level).sort((a, b) => a.order - b.order);
}

/** Registry-Reihenfolge: erst required, dann recommended, dann optional; innerhalb nach `order`. */
const RANK: Record<Importance, number> = { required: 0, recommended: 1, optional: 2 };
export const IMPORTANCE_ORDER: readonly FieldImportanceEntry[] = [...FIELD_IMPORTANCE].sort(
  (a, b) => RANK[a.importance] - RANK[b.importance] || a.order - b.order,
);
