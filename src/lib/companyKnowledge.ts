/**
 * companyKnowledge — Vollständigkeit + Wirkungshinweis für „Mein Unternehmen".
 *
 * REGELBASIERT, keine KI: die Reihenfolge unten ist eine bewusste Setzung, welches leere Feld
 * dem späteren AI SDR am meisten bringt. Grundlage ist der Pflicht-Kontext aus
 * `docs/ai_sdr_bauplan_v1.md` (generate_message): Nutzen + Zielgruppe tragen die Nachricht,
 * USPs liefern die Pitch-Formulierung, Wettbewerbs-Abgrenzung nur die Einwand-Behandlung.
 *
 * Der Preis steht bewusst NICHT in der Liste: er ist optional UND standardmäßig für die KI
 * gesperrt (`ai_may_reference_price`) — ihn anzumahnen wäre ein falscher Anreiz.
 *
 * Sanfter Anreiz, kein Zwang: es gibt in diesem Bereich keine Pflichtfelder.
 */
import { isEmptyText, type I18nText } from "./i18nText";

export interface KnowledgeProduct {
  id: string;
  name: string;
  description: I18nText;
  benefit: I18nText;
  audience: I18nText;
}

export interface KnowledgeInput {
  products: KnowledgeProduct[];
  usps: { text: I18nText }[];
  competitors: { name: string; why_us: I18nText }[];
}

/** Ein Hinweis auf das wirkungsvollste leere Feld. `productName` nur bei produktbezogenen Feldern. */
export interface CompletenessResult {
  filled: number;
  total: number;
  percent: number;
  /** i18n-Schlüssel-Suffix des nächsten Schritts — null, wenn alles Wesentliche gefüllt ist. */
  nextHint: "noProducts" | "benefit" | "audience" | "usps" | "description" | "competitorWhy" | null;
  /** Produktname für den Hinweis (leerer Name → null, dann formuliert die UI ohne Namen). */
  productName: string | null;
}

/**
 * Zählt gefüllte von relevanten Feldern und benennt den wirkungsvollsten nächsten Schritt.
 * Zählweise: je Produkt Beschreibung/Nutzen/Zielgruppe + USPs (als EIN Feld) + Wettbewerber
 * (als EIN Feld). Ohne Produkte gibt es nur die beiden Firmen-Felder — dann ist „Produkt anlegen"
 * der Hinweis, denn ohne Produkt hat die KI nichts zu erzählen.
 */
export function computeCompleteness(input: KnowledgeInput): CompletenessResult {
  const { products, usps, competitors } = input;

  const uspsFilled = usps.some((u) => !isEmptyText(u.text));
  const compFilled = competitors.some((c) => !isEmptyText(c.why_us));

  let filled = (uspsFilled ? 1 : 0) + (compFilled ? 1 : 0);
  let total = 2;
  for (const p of products) {
    total += 3;
    if (!isEmptyText(p.description)) filled++;
    if (!isEmptyText(p.benefit)) filled++;
    if (!isEmptyText(p.audience)) filled++;
  }

  const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
  const nameOf = (p: KnowledgeProduct) => (p.name.trim().length > 0 ? p.name.trim() : null);

  // Wirkungs-Reihenfolge — der erste Treffer gewinnt.
  if (products.length === 0) return { filled, total, percent, nextHint: "noProducts", productName: null };

  const missingBenefit = products.find((p) => isEmptyText(p.benefit));
  if (missingBenefit) return { filled, total, percent, nextHint: "benefit", productName: nameOf(missingBenefit) };

  const missingAudience = products.find((p) => isEmptyText(p.audience));
  if (missingAudience) return { filled, total, percent, nextHint: "audience", productName: nameOf(missingAudience) };

  if (!uspsFilled) return { filled, total, percent, nextHint: "usps", productName: null };

  const missingDesc = products.find((p) => isEmptyText(p.description));
  if (missingDesc) return { filled, total, percent, nextHint: "description", productName: nameOf(missingDesc) };

  if (competitors.length > 0 && !compFilled) {
    return { filled, total, percent, nextHint: "competitorWhy", productName: null };
  }
  return { filled, total, percent, nextHint: null, productName: null };
}
