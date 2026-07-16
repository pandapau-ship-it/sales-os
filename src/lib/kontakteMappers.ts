/**
 * kontakteMappers — contacts-Zeile → Kontakte-Listen-Sicht (K-3).
 *
 * Identität/ICP/Heat kommen aus der zentralen `contactToProfile` (Single Source, wie alle Tabs).
 * Zusätzlich Listen-spezifisch: lead_source, contact_status, Routing-Ziel (abgeleitet aus dem
 * Lifecycle-Status). Honesty: fehlende Werte → undefined/null (Spalte/Element blendet aus).
 */
import { contactToProfile } from "@/lib/hunterMappers";
import type { ContactRow } from "@/types/rows";

export type ContactRouting = "ai_sdr" | "hunter" | "farmer";

export interface KontakteRow {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  initials: string;
  avatarUrl?: string;
  icpScore?: number;
  /** contacts.lead_source (sherloq | csv_upload | crm_sync | manual | webhook_api) — undefined → keine Badge. */
  leadSource?: string;
  /** contacts.contact_status (ohne_campaign | in_campaign | pipeline | kunde | archiviert | opt_out). */
  contactStatus?: string;
  /** ISO oder null → „ZULETZT"-Spalte rendert nichts (Honesty). */
  lastContactedAt: string | null;
  /** Ableitung aus contact_status: wo wird der Kontakt aktuell bearbeitet. null → kein Chip. */
  routing: ContactRouting | null;
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
  return {
    id: row.id,
    name: p.name,
    jobTitle: p.jobTitle,
    company: p.company,
    initials: p.initials,
    avatarUrl: p.avatarUrl,
    icpScore: p.icpScore,
    leadSource: row.lead_source ?? undefined,
    contactStatus: row.contact_status ?? undefined,
    lastContactedAt: row.last_contacted_at ?? null,
    routing: routingFor(row.contact_status),
  };
}
