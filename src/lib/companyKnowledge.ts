/**
 * companyKnowledge — Vollständigkeit + Wirkungshinweis für „Mein Unternehmen".
 *
 * REGELBASIERT, keine KI. Die Rangfolge („was bringt am meisten?") steht NICHT mehr hier,
 * sondern in der zentralen Registry `fieldImportance.ts` — dieselbe Quelle, die später der
 * AI Chat liest, um bei fehlenden Pflichtangaben nachzufragen statt zu blockieren.
 * Kein zweites, paralleles System.
 *
 * Gezählt werden `required` + `recommended`. `optional` (Preis, Preis-Modell, Wettbewerber-
 * Begründung) fließt bewusst NICHT in die Quote ein — sonst entstünde Druck, Felder zu füllen,
 * die niemand braucht (Preise sind zudem standardmäßig für die AI gesperrt).
 *
 * Sanfter Anreiz, kein Zwang: es gibt in diesem Bereich keine Pflichtfelder.
 */
import { isEmptyText, type I18nText } from "./i18nText";
import { IMPORTANCE_ORDER, importanceOf, pathFor, type Importance } from "./fieldImportance";

export interface KnowledgeProduct {
  id: string;
  name: string;
  description: I18nText;
  benefit: I18nText;
  audience: I18nText;
  price?: string | null;
  price_model?: string | null;
}

export interface KnowledgeInput {
  products: KnowledgeProduct[];
  usps?: { text: I18nText }[];
  competitors?: { name: string; why_us: I18nText }[];
}

/**
 * Welche Felder zählen mit? Eine Seite darf nur über das urteilen, was sie auch ANBIETET —
 * sonst entsteht ein Hinweis auf ein Feld, das man dort gar nicht ausfüllen kann (so geschehen,
 * als USPs von der Produktseite auf die Company-Profile-Seite umzogen).
 */
export type KnowledgeScope = "all" | "product" | "org";

/** Ein konkret fehlendes Feld — Grundlage für Hinweis (heute) und Chat-Rückfrage (später). */
export interface MissingField {
  /** Konkreter, stabiler Feldpfad, z.B. "product.p1.benefit". */
  path: string;
  importance: Importance;
  reason: string;
  /** i18n-Suffix (`company.hint.<hintKey>`). */
  hintKey: string;
  /** Menschlicher Bezug für die Rückfrage („welches Produkt?"), null bei Firmen-Feldern. */
  subject: string | null;
}

export interface CompletenessResult {
  filled: number;
  total: number;
  percent: number;
  /** Wirkungsvollster nächster Schritt — null, wenn required+recommended vollständig sind. */
  nextHint: string | null;
  productName: string | null;
  /** Alle fehlenden Felder in Registry-Reihenfolge (required zuerst). */
  missing: MissingField[];
}

/** Ist dieser konkrete Feldwert leer? Zentral, damit Hinweis und Zählung nie auseinanderlaufen. */
function valueOf(input: KnowledgeInput, template: string, product?: KnowledgeProduct): I18nText | boolean {
  switch (template) {
    case "product.<id>.name": return product?.name ?? "";
    case "product.<id>.benefit": return product?.benefit;
    case "product.<id>.audience": return product?.audience;
    case "product.<id>.description": return product?.description;
    case "product.<id>.price": return product?.price ?? "";
    case "product.<id>.price_model": return product?.price_model ?? "";
    case "org.usps": return (input.usps ?? []).some((u) => !isEmptyText(u.text));
    case "org.competitors": return (input.competitors ?? []).some((c) => !isEmptyText(c.why_us));
    default: return "";
  }
}

const isFilled = (v: I18nText | boolean): boolean =>
  typeof v === "boolean" ? v : !isEmptyText(v);

/**
 * Zählt gefüllte von relevanten Feldern (required+recommended) und benennt den wirkungsvollsten
 * nächsten Schritt. Ohne Produkte gibt es nur die Firmen-Felder — dann ist „Produkt anlegen"
 * der Hinweis, denn ohne Produkt hat die AI nichts zu erzählen.
 */
export function computeCompleteness(
  input: KnowledgeInput,
  scope: KnowledgeScope = "all",
): CompletenessResult {
  const missing: MissingField[] = [];
  let filled = 0;
  let total = 0;

  for (const entry of IMPORTANCE_ORDER) {
    const isProductField = entry.path.startsWith("product.");
    if (scope === "product" && !isProductField) continue;
    if (scope === "org" && isProductField) continue;
    const targets: (KnowledgeProduct | undefined)[] = isProductField ? input.products : [undefined];
    for (const p of targets) {
      const counts = entry.importance !== "optional";
      const ok = isFilled(valueOf(input, entry.path, p));
      if (counts) {
        total++;
        if (ok) filled++;
      }
      if (!ok) {
        missing.push({
          path: pathFor(entry.path, p?.id),
          importance: entry.importance,
          reason: entry.reason,
          hintKey: entry.hintKey,
          subject: p ? (p.name.trim() || null) : null,
        });
      }
    }
  }

  const percent = total === 0 ? 0 : Math.round((filled / total) * 100);

  if (input.products.length === 0) {
    return { filled, total, percent, nextHint: "noProducts", productName: null, missing };
  }
  // Der Wirkungshinweis nennt NUR required/recommended. Optionales (Preis, Preis-Modell,
  // Wettbewerber-Begründung) taucht in `missing` auf, drängt aber niemanden — sonst würde die
  // Anzeige zum Ausfüllen genau der Felder auffordern, die die Registry als „kein Anreiz" führt.
  const next = missing.find((m) => m.importance !== "optional") ?? null;
  return {
    filled, total, percent,
    nextHint: next ? next.hintKey : null,
    productName: next?.subject ?? null,
    missing,
  };
}

/**
 * Für den KÜNFTIGEN AI Chat: welche PFLICHT-Angaben fehlen, bevor eine Aktion sinnvoll
 * ausführbar ist? Der Chat fragt danach — er blockiert nicht wegen fehlender `recommended`/
 * `optional`-Felder und erfindet nichts (Regel „Progressive Ausführung", ai_chat_bauplan).
 * Heute nur als Lese-Funktion + Test vorhanden; der Chat selbst existiert noch nicht.
 */
export function missingRequired(input: KnowledgeInput, scope: KnowledgeScope = "all"): MissingField[] {
  return computeCompleteness(input, scope).missing.filter((m) => m.importance === "required");
}

/** Einstufung eines konkreten Feldpfads (Durchreichung, damit Verbraucher nur EIN Modul kennen). */
export { importanceOf };
