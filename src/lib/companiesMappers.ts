/**
 * companiesMappers — companies-Zeile → Companies-Listen-Sicht (K-4a).
 *
 * Analog zu kontakteMappers: eine Roh-DB-Zeile (companies + eingebettete contacts/deals-Aggregate)
 * wird auf eine flache Tabellen-Sicht gemappt. Der abgeleitete Company-Lifecycle-Status
 * (`companyStatus`) ist die Single Source für Status-Badge UND Routing-Chip — nie doppelt
 * hergeleitet. Honesty: fehlende Werte → undefined/null → Spalte/Element blendet aus.
 */
import { isTerminalStage } from "@/lib/hunterMappers";
import type { CompanyRow } from "@/types/rows";
import type { ContactRouting } from "@/lib/kontakteMappers";

/** Eingebettete Aggregat-Felder aus getCompanies (contacts/deals der Company). */
export interface CompanyContactEmbed { id: string; contact_status: string | null; last_contacted_at: string | null }
export interface CompanyDealEmbed { id: string; stage: string | null; closed_at: string | null; deleted_at: string | null }
export type CompanyListRaw = CompanyRow & {
  contacts?: CompanyContactEmbed[] | null;
  deals?: CompanyDealEmbed[] | null;
};

/** Abgeleiteter Company-Lifecycle. Nur aus echten Daten — kein Rateweg. */
export type CompanyStatusKind =
  | "kunde" | "churned" | "trial" | "pipeline" | "in_campaign" | "ohne_kontakt" | "neu";

export interface CompanyStatus {
  kind: CompanyStatusKind;
  tone: "success" | "warn" | "urgent" | "info" | "teal" | "muted";
  /** Ziel-Screen für den Routing-Chip (RoutingChip blendet nicht gebaute Ziele selbst aus). */
  routing: ContactRouting | null;
}

export interface CompaniesRow {
  id: string;
  // Identität
  name: string;
  industry?: string;
  sizeRange?: string;
  city?: string;
  country?: string;
  /** „Stadt, Land" zusammengesetzt — leer → undefined (Spalte rendert nichts). */
  location?: string;
  // Kontakt/Kanäle
  domain?: string;
  website?: string;
  linkedinUrl?: string;
  // Aggregate (echt gezählt)
  contactCount: number;
  openDealsCount: number;
  /** MAX(last_contacted_at) der verknüpften Kontakte, ISO oder null → „ZULETZT" rendert nichts. */
  lastContactAt: string | null;
  // Umsatz (Cent)
  arr?: number;
  mrr?: number;
  annualRevenue?: number;
  // Subscription
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  // Abgeleiteter Status (Single Source für Badge + Routing)
  status: CompanyStatus;
  // Weitere Set-B-Felder
  techStack?: string[];
  tags?: string[];
  crmId?: string;
  createdAt: string | null;
}

/**
 * companyStatus — leitet den Lifecycle-Status EINMAL zentral ab (Single Source).
 * Reihenfolge = Geld-/Lifecycle-Vorrang: Subscription (Kunde/Gekündigt/Trial) → offener Deal
 * (Pipeline) → Kontakt in Campaign (AI SDR) → ohne Kontakt → neu.
 */
export function companyStatus(raw: CompanyListRaw): CompanyStatus {
  const sub = raw.subscription_status;
  if (sub === "active") return { kind: "kunde", tone: "success", routing: "farmer" };
  if (sub === "churned") return { kind: "churned", tone: "urgent", routing: "farmer" };
  if (sub === "trial") return { kind: "trial", tone: "info", routing: "farmer" };

  const deals = raw.deals ?? [];
  const hasOpenDeal = deals.some((d) => !isTerminalStage(d.stage ?? "") && d.closed_at == null && d.deleted_at == null);
  if (hasOpenDeal) return { kind: "pipeline", tone: "info", routing: "hunter" };

  const contacts = raw.contacts ?? [];
  const hasInCampaign = contacts.some((c) => c.contact_status === "in_campaign");
  if (hasInCampaign) return { kind: "in_campaign", tone: "teal", routing: "ai_sdr" };

  if (contacts.length === 0) return { kind: "ohne_kontakt", tone: "muted", routing: null };
  return { kind: "neu", tone: "muted", routing: null };
}

/** Jüngstes ISO-Datum aus einer Liste (für „letzter Kontakt" der Company). */
function maxIso(dates: (string | null)[]): string | null {
  let max: string | null = null;
  for (const d of dates) if (d && (!max || d > max)) max = d;
  return max;
}

export function companyToCompaniesRow(raw: CompanyListRaw): CompaniesRow {
  const contacts = raw.contacts ?? [];
  const deals = raw.deals ?? [];
  const city = raw.city ?? undefined;
  const country = raw.country ?? undefined;
  return {
    id: raw.id,
    name: raw.name,
    industry: raw.industry ?? undefined,
    sizeRange: raw.size_range ?? undefined,
    city,
    country,
    location: [city, country].filter(Boolean).join(", ") || undefined,
    domain: raw.domain ?? undefined,
    website: raw.website ?? undefined,
    linkedinUrl: raw.linkedin_url ?? undefined,
    contactCount: contacts.length,
    openDealsCount: deals.filter((d) => !isTerminalStage(d.stage ?? "") && d.closed_at == null && d.deleted_at == null).length,
    lastContactAt: maxIso(contacts.map((c) => c.last_contacted_at)),
    arr: raw.arr_yearly ?? undefined,
    mrr: raw.mrr_monthly ?? undefined,
    annualRevenue: raw.annual_revenue ?? undefined,
    subscriptionPlan: raw.subscription_plan ?? undefined,
    subscriptionStatus: raw.subscription_status ?? undefined,
    status: companyStatus(raw),
    techStack: raw.tech_stack ?? undefined,
    tags: raw.tags ?? undefined,
    crmId: raw.crm_id ?? undefined,
    createdAt: raw.created_at ?? null,
  };
}

/** Cent → „X €" (de-DE). null/undefined → undefined (Honesty). */
export function formatEuroCents(cents: number | null | undefined): string | undefined {
  if (cents == null) return undefined;
  return `${Math.round(cents / 100).toLocaleString("de-DE")} €`;
}
