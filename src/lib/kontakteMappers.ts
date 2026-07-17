/**
 * kontakteMappers — contacts-Zeile → Kontakte-Listen-Sicht (K-3).
 *
 * Identität/ICP/Heat kommen aus der zentralen `contactToProfile` (Single Source, wie alle Tabs).
 * Zusätzlich Listen-spezifisch: lead_source, contact_status, Routing-Ziel (abgeleitet aus dem
 * Lifecycle-Status). Honesty: fehlende Werte → undefined/null (Spalte/Element blendet aus).
 */
import { contactToProfile } from "@/lib/hunterMappers";
import type { ContactRow } from "@/types/rows";
import type { HeatStatus } from "@/types";

export type ContactRouting = "ai_sdr" | "hunter" | "farmer";

export interface KontakteRow {
  id: string;
  // Identität (Single Source: contactToProfile)
  name: string;
  jobTitle: string;
  company: string;
  initials: string;
  avatarUrl?: string;
  icpScore?: number;
  heatStatus?: HeatStatus;
  /** contacts.lead_source (sherloq | csv_upload | crm_sync | manual | webhook_api) — undefined → keine Badge. */
  leadSource?: string;
  /** contacts.contact_status (ohne_campaign | in_campaign | pipeline | kunde | archiviert | opt_out). */
  contactStatus?: string;
  /** ISO oder null → „ZULETZT"-Spalte rendert nichts (Honesty). */
  lastContactedAt: string | null;
  /** Ableitung aus contact_status: wo wird der Kontakt aktuell bearbeitet. null → kein Chip. */
  routing: ContactRouting | null;
  // ── Erweiterte Spalten (Set B, K-3 Phase C) — default ausgeblendet. Fehlt der Wert → undefined (Honesty). ──
  email?: string;
  linkedinUrl?: string;
  salutation?: string;
  seniority?: string;
  department?: string;
  language?: string;
  twitterHandle?: string;
  /** lead_status: Qualifizierungsstufe (lead/qualified_lead/mql/sql/customer/churned) — ≠ contactStatus. */
  leadStatus?: string;
  /** email_verification_status: valid/invalid/catch-all/unknown/… */
  emailVerifiedStatus?: string;
  lastReplyAt: string | null;
  tags?: string[];
  /** contacts.assigned_to → users.full_name (Lead-Owner). */
  ownerName?: string;
  /** Primäre Telefonnummer (contact_phones, is_primary bevorzugt). */
  phonePrimary?: string;
  createdAt: string | null;
}

/** Lifecycle-Status → aktueller Bearbeitungs-Ort (Routing-Chip). Kein eindeutiges Ziel → null. */
export function routingFor(contactStatus: string | null | undefined): ContactRouting | null {
  switch (contactStatus) {
    case "in_campaign":
      return "ai_sdr";
    case "pipeline":
      return "hunter";
    case "kunde":
      return "farmer";
    default:
      return null; // ohne_campaign / archiviert / opt_out → kein Routing-Ziel
  }
}

export function contactToKontakteRow(row: ContactRow): KontakteRow {
  const p = contactToProfile(row);
  // Primäre Telefonnummer: is_primary bevorzugt, sonst erste vorhandene.
  const phones = row.contact_phones ?? [];
  const primaryPhone = phones.find((ph) => ph?.is_primary)?.number ?? phones[0]?.number ?? undefined;
  return {
    id: row.id,
    name: p.name,
    jobTitle: p.jobTitle,
    company: p.company,
    initials: p.initials,
    avatarUrl: p.avatarUrl,
    icpScore: p.icpScore,
    heatStatus: p.heatStatus,
    leadSource: row.lead_source ?? undefined,
    contactStatus: row.contact_status ?? undefined,
    lastContactedAt: row.last_contacted_at ?? null,
    routing: routingFor(row.contact_status),
    // Set B (default ausgeblendet) — leere Werte bleiben undefined (Zelle rendert nichts).
    email: row.email ?? undefined, // single-source-ok: Roh-CRM-Feld für eigene Spalte
    linkedinUrl: row.linkedin_url ?? undefined, // single-source-ok: Roh-CRM-Feld für eigene Spalte
    salutation: row.salutation ?? undefined, // single-source-ok: Roh-CRM-Feld
    seniority: row.seniority ?? undefined, // single-source-ok: Roh-CRM-Feld
    department: row.department ?? undefined, // single-source-ok: Roh-CRM-Feld
    language: row.language ?? undefined, // single-source-ok: Roh-CRM-Feld
    twitterHandle: row.twitter_handle ?? undefined, // single-source-ok: Roh-CRM-Feld
    leadStatus: row.lead_status ?? undefined, // single-source-ok: Qualifizierungsstufe
    emailVerifiedStatus: row.email_verification_status ?? undefined, // single-source-ok: System-Status
    lastReplyAt: row.last_reply_at ?? null,
    tags: row.tags ?? undefined,
    ownerName: row.owner?.full_name ?? undefined,
    phonePrimary: primaryPhone,
    createdAt: row.created_at ?? null,
  };
}
