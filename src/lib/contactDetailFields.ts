import type { ContactRow, CompanyRow } from "@/types/rows";
/**
 * contactDetailFields — Single Source für den Details-Tab (Person + Firma), geteilt von
 * HunterSidepanel UND FarmerSidepanel (Einheitsgebot — keine Dublette der Optionslisten/Spalten-
 * Mappings). Reine Datentabellen: Auswahl-Optionen, Feld→DB-Spalte-Mapping, Telefon-Typen + ein
 * pures Seed-Mapping (contactRow → editierbares details-Objekt). Schreibt nichts.
 */

export const ANREDE_OPTS = ['Herr', 'Frau', 'Divers'];
export const SENIORITY_OPTS = ['C-Level', 'VP', 'Director', 'Manager', 'IC', 'Founder'];
export const SPRACHE_OPTS = ['Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Andere'];
export const LAND_OPTS = ['Deutschland', 'Österreich', 'Schweiz', 'Andere'];
export const BRANCHE_OPTS = ['SaaS', 'Fintech', 'E-Commerce', 'Healthcare', 'Industrie', 'Andere'];
export const GROESSE_OPTS = ['1–10', '11–50', '51–200', '201–500', '500+'];
export const PHONE_TYPES = ['Mobil', 'Geschäftlich', 'Privat', 'Weitere'];

/** Details-Feld-Key → DB (Tabelle + Spalte). Ungemappte Keys (Klassifizierung) = nur lokal, kein Persist. */
export const DETAIL_MAP: Record<string, { table: 'contact' | 'company'; col: string }> = {
  anrede: { table: 'contact', col: 'salutation' },
  sprache: { table: 'contact', col: 'language' },
  vorname: { table: 'contact', col: 'first_name' },
  nachname: { table: 'contact', col: 'last_name' },
  jobtitel: { table: 'contact', col: 'job_title' },
  seniority: { table: 'contact', col: 'seniority' },
  abteilung: { table: 'contact', col: 'department' },
  stadt: { table: 'contact', col: 'city' },
  land: { table: 'contact', col: 'country' },
  twitter: { table: 'contact', col: 'twitter_handle' },
  firma: { table: 'company', col: 'name' },
  branche: { table: 'company', col: 'industry' },
  groesse: { table: 'company', col: 'size_range' },
  domain: { table: 'company', col: 'domain' },
  firmaStadt: { table: 'company', col: 'city' },
  firmaLand: { table: 'company', col: 'country' },
};

export type ContactDetailsState = {
  anrede: string; sprache: string; vorname: string; nachname: string; jobtitel: string;
  seniority: string; abteilung: string; stadt: string; land: string; twitter: string;
  firma: string; branche: string; groesse: string; domain: string; firmaStadt: string; firmaLand: string;
};

/** Seed der editierbaren Person-/Firmen-Stammdaten aus dem echten contactRow (getContactDetail).
 *  NULL → '' (kein Fake-Default). Klassifizierung (Lead Status/Subscription/ICP) wird vom Aufrufer
 *  ergänzt (Hunter = Lead Status, Farmer = Subscription — bewusst getrennt). */
export function seedContactDetails(contactRow: ContactRow | null): ContactDetailsState {
  const c = (contactRow ?? {}) as ContactRow;
  const co = (c.company ?? {}) as Partial<CompanyRow>;
  return {
    anrede: c.salutation ?? '', sprache: c.language ?? '',
    vorname: c.first_name ?? '', nachname: c.last_name ?? '',
    jobtitel: c.job_title ?? '', seniority: c.seniority ?? '',
    abteilung: c.department ?? '', stadt: c.city ?? '', land: c.country ?? '',
    twitter: c.twitter_handle ?? '',
    firma: co.name ?? '', branche: co.industry ?? '', groesse: co.size_range ?? '',
    domain: co.domain ?? '', firmaStadt: co.city ?? '', firmaLand: co.country ?? '',
  };
}
