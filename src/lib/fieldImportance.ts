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

/**
 * Erlaubte Hinweis-Schlüssel (`company.hint.<hintKey>` in den Locales). Bewusst eine feste Union:
 * ein Tippfehler fällt so beim Bauen auf und nicht erst als fehlender Text in der Oberfläche.
 */
export type HintKey =
  | "name" | "benefit" | "audience" | "usps" | "description"
  | "competitorWhy" | "price" | "priceModel"
  // Personal Voice (Slice 2/3). Overview-Felder je eigener Key, Kanal-Felder teilen sich
  // einen Key über alle Kanäle (post/comment/dm/email) — der Hinweis benennt die Feld-ART.
  | "voiceBio" | "voiceThemes" | "voiceStyle" | "voiceTone"
  | "voiceSamples" | "voiceSentenceStyle" | "voiceHooks" | "voiceDosDonts";

export interface FieldImportanceEntry {
  /** Pfad-Vorlage mit `<id>`-Platzhalter, z.B. "product.<id>.benefit". STABIL — nie umbenennen. */
  path: string;
  importance: Importance;
  /** Warum diese Einstufung — erscheint im Chat als Begründung der Rückfrage. */
  reason: string;
  /** Rang innerhalb derselben Einstufung (kleiner = zuerst). Steuert den Wirkungshinweis. */
  order: number;
  /** i18n-Suffix des Hinweistexts der Vollständigkeits-Anzeige (`company.hint.<hintKey>`). */
  hintKey: HintKey;
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

  // ── Personal Voice (Slice 2/3, Migr. 078/079) ──────────────────────────────
  // Pfade sind LITERAL (kein <id>) und exakt die in 078/079 eingefrorenen.
  // Nichts required (bereichsweite Regel: kein Pflichtfeld). `recommended` zählt in den Ring,
  // `optional` nicht — so entsteht ein Anreiz für die wirksamsten Felder ohne Druck.
  { path: "voice.overview.bio",   importance: "recommended", order: 9,  hintKey: "voiceBio",
    reason: "Wer schreibt? Ohne Kurzprofil klingt jeder AI-Text beliebig." },
  { path: "voice.overview.style", importance: "recommended", order: 10, hintKey: "voiceStyle",
    reason: "Der Verkaufs-/Argumentationsstil prägt jede erzeugte Nachricht." },
  { path: "voice.overview.tone",  importance: "recommended", order: 11, hintKey: "voiceTone",
    reason: "Der Grundton entscheidet, ob die AI in deiner Stimme klingt." },
  { path: "voice.overview.themes", importance: "optional", order: 12, hintKey: "voiceThemes",
    reason: "Kernthemen helfen bei Aufhängern, sind aber nicht zwingend." },

  { path: "voice.post.samples",         importance: "recommended", order: 13, hintKey: "voiceSamples",
    reason: "Echte Beispiele sind das stärkste Signal für deinen Post-Stil." },
  { path: "voice.post.sentence_style",  importance: "recommended", order: 14, hintKey: "voiceSentenceStyle",
    reason: "Satzbau/Rhythmus prägen, wie ein Post von dir klingt." },
  { path: "voice.post.hooks",     importance: "optional", order: 15, hintKey: "voiceHooks",
    reason: "Aufhänger-Muster schärfen den Einstieg, sind aber optional." },
  { path: "voice.post.dos_donts", importance: "optional", order: 16, hintKey: "voiceDosDonts",
    reason: "Do's & Don'ts verfeinern nur — die AI schreibt auch ohne sie." },

  { path: "voice.comment.samples",        importance: "recommended", order: 17, hintKey: "voiceSamples",
    reason: "Echte Kommentar-Beispiele zeigen deinen Reply-Stil am besten." },
  { path: "voice.comment.sentence_style", importance: "recommended", order: 18, hintKey: "voiceSentenceStyle",
    reason: "Kommentare sind kürzer — der Satzbau ist hier besonders eigen." },
  { path: "voice.comment.hooks",     importance: "optional", order: 19, hintKey: "voiceHooks",
    reason: "Reaktionsmuster verfeinern nur, sind nicht zwingend." },
  { path: "voice.comment.dos_donts", importance: "optional", order: 20, hintKey: "voiceDosDonts",
    reason: "Do's & Don'ts verfeinern nur — die AI schreibt auch ohne sie." },

  { path: "voice.dm.samples",         importance: "recommended", order: 21, hintKey: "voiceSamples",
    reason: "Echte DM-Beispiele zeigen deinen 1:1-Ton am direktesten." },
  { path: "voice.dm.sentence_style",  importance: "recommended", order: 22, hintKey: "voiceSentenceStyle",
    reason: "DMs sind persönlich — der Satzbau macht den Unterschied." },
  { path: "voice.dm.hooks",     importance: "optional", order: 23, hintKey: "voiceHooks",
    reason: "Einstiegsmuster verfeinern nur, sind nicht zwingend." },
  { path: "voice.dm.dos_donts", importance: "optional", order: 24, hintKey: "voiceDosDonts",
    reason: "Do's & Don'ts verfeinern nur — die AI schreibt auch ohne sie." },

  { path: "voice.email.samples",        importance: "recommended", order: 25, hintKey: "voiceSamples",
    reason: "Der AI SDR mailt primär — echte E-Mail-Beispiele wiegen hier schwer." },
  { path: "voice.email.sentence_style", importance: "recommended", order: 26, hintKey: "voiceSentenceStyle",
    reason: "E-Mail-Satzbau prägt, wie deine Outreach-Mails klingen." },
  { path: "voice.email.hooks",     importance: "optional", order: 27, hintKey: "voiceHooks",
    reason: "Betreff-/Einstiegsmuster verfeinern nur, sind nicht zwingend." },
  { path: "voice.email.dos_donts", importance: "optional", order: 28, hintKey: "voiceDosDonts",
    reason: "Do's & Don'ts verfeinern nur — die AI schreibt auch ohne sie." },
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
