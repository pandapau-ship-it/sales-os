/**
 * types/rows.ts — DB-Zeilen-Typen für die Mapper (K-1a2/K-3: ersetzt `Record<string, any>`).
 *
 * Basis sind die GENERIERTEN Supabase-Typen (`database.types.ts`, Single Source aus dem Schema).
 * Die Mapper erhalten Zeilen MIT Embeds (PostgREST-Joins: company, contact, owner, tasks, phones),
 * die in der reinen `Row` nicht stehen — hier als optionale Composite-Erweiterungen ergänzt.
 * Alle Embed-Felder optional/nullable (der Join kann fehlen).
 */
import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];

export type ContactRowBase = Tables["contacts"]["Row"];
export type CompanyRow = Tables["companies"]["Row"];
export type DealRowBase = Tables["deals"]["Row"];
export type TaskRow = Tables["tasks"]["Row"];
export type SignalRowBase = Tables["signals"]["Row"];
export type CommunicationRow = Tables["communications"]["Row"];
export type ContactPhoneRow = Tables["contact_phones"]["Row"];

/** Kontaktzeile inkl. optionaler Embeds (getContacts/getContactDetail): Firma, Telefonnummern, Deals. */
export type ContactRow = ContactRowBase & {
  company?: Partial<CompanyRow> | null;
  // CRM-Doku sieht Stadt/Land am Kontakt vor, contacts-Migration hat sie (noch) nicht → optional, [D-city].
  city?: string | null;
  country?: string | null;
  contact_phones?: Array<Partial<ContactPhoneRow>> | null;
  deals?: Array<Partial<DealRowBase>> | null;
};

/** Deal-Zeile inkl. optionaler Embeds (getDeals: contact/company/owner/tasks). */
export type DealRow = DealRowBase & {
  contact?: ContactRow | null;
  company?: Partial<CompanyRow> | null;
  owner?: { full_name?: string | null } | null;
  tasks?: Array<Partial<TaskRow>> | null;
};

/** Signal-Zeile inkl. optionalem Kontakt-Embed. */
export type SignalRow = SignalRowBase & {
  contact?: ContactRow | null;
};

/** Fällige-Task-Zeile inkl. optionalem Kontakt-Embed (getDueTasks). */
export type DueTaskRow = TaskRow & {
  contact?: ContactRow | null;
};

/** Notiz-Zeile inkl. optionalem Autor-Embed (getNotesByContact). */
export type NoteRow = Tables["notes"]["Row"] & {
  author?: { full_name?: string | null } | null;
};
