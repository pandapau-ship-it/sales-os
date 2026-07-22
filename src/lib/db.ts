/**
 * db.ts — Datenzugriffsschicht (einzige Quelle für DB-Zugriffe).
 *
 * REGELN (siehe CLAUDE.md → "Service-Abstraktion"):
 *  - Komponenten importieren NUR aus `@/lib/*` — nie aus `@supabase/supabase-js`.
 *  - Die Supabase-Instanz wird AUSSCHLIESSLICH hier initialisiert (getSupabaseClient).
 *    auth.ts / storage.ts / realtime.ts holen den Client von hier.
 *  - Jede Abfrage hat einen klar benannten Export (getLeads, getContactById …).
 *
 * Wenn Supabase ausgetauscht wird, ändern wir nur diese vier lib-Dateien —
 * keine Komponente muss angefasst werden.
 *
 * STATUS: Phase 5 (Supabase) noch nicht gestartet → Funktionskörper liefern
 * aktuell Mock-Daten aus `@/data`. Beim Supabase-Einbau werden NUR die Körper
 * ersetzt; die Signaturen (Promise-basiert) bleiben gleich.
 */

import {
  INITIAL_LEADS,
  INITIAL_CUSTOMERS,
  INITIAL_TASKS,
  INITIAL_PRIORITIES,
  INITIAL_APPOINTMENTS,
  INITIAL_ALERT_BANNERS,
  INITIAL_MARKETING_IDEAS,
  INITIAL_KPIS,
} from "@/data";
import { WON_STAGE_SLUG, LOST_STAGE_SLUG } from "@/lib/hunterMappers";
import type { I18nText } from "@/lib/i18nText";
import {
  classifyDuplicate,
  type ContactCandidate,
  type ExistingContact,
  type DuplicateHit,
  type ContactMatchType,
} from "@/lib/dedup";
import {
  resolveOwner,
  DEFAULT_LEAD_ASSIGNMENT_STRATEGY,
  type LeadAssignmentStrategy,
} from "@/lib/leadAssignment";
// Direkt aus execute.ts (nicht via Barrel) — der Barrel re-exportiert parse.ts, das xlsx zieht;
// so bleibt xlsx aus dem db.ts-/Haupt-Bundle (Import-UI lädt parse.ts dynamisch, K-5 Build-Note).
import { extractEmailDomain, type ImportPlan } from "@/lib/import/execute";
import {
  MERGEABLE_CONTACT_FIELDS, MERGEABLE_COMPANY_FIELDS, CONTACT_FK_SIMPLE, COMPANY_FK,
  resolveMergeFields, findDuplicatePairs, findCompanyDuplicatePairs, type DuplicatePair,
} from "@/lib/merge";
import type {
  Lead,
  Customer,
  TaskItemType,
  PriorityItemType,
  AppointmentItemType,
  AlertBannerType,
  LinkedInPostIdea,
  KPIItemType,
} from "@/types";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Deal, Signal, PipelineStage, SignalWindow } from "@/types/hunter";
import type { ContactRow, CompanyRow, DealRow, CommunicationRow, TaskRow, DueTaskRow, NoteRow } from "@/types/rows";
import type { CompanyListRaw } from "@/lib/companiesMappers";
import type { CompanyActivityRow } from "@/lib/hunterMappers";
import {
  compileToPostgrest, validateFilter,
  type FilterDefinition, type FilterEntity, type FilterNode,
} from "@/lib/filter";
import {
  mergeGeneral, type GeneralSettings,
  mergeNav, type NavPreferences, NAV_PREF_KEY,
  type MyProfile,
} from "@/lib/settingsDefaults";

// ── Supabase Client — EINZIGER Init-Punkt im gesamten Projekt ────────────────
// createClient() läuft AUSSCHLIESSLICH hier (audit-erzwungen). auth/storage/
// realtime holen den Client nur über getSupabaseClient(). Env-tolerant: ohne
// gesetzte VITE_SUPABASE_*-Variablen (z.B. lokal in Phase 0) → null statt Crash.

let _client: SupabaseClient | null = null;
let _initialized = false;

/** True, wenn beide Supabase-Env-Variablen gesetzt sind. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

/**
 * Einziger Zugriffspunkt auf die Supabase-Instanz. Gibt `null` zurück, wenn die
 * Env nicht konfiguriert ist (Phase 0 ohne Backend) — Aufrufer behandeln null.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (_initialized) return _client;
  _initialized = true;
  if (!isSupabaseConfigured()) {
    if (import.meta.env.DEV) {
      console.warn("[db] Supabase-Env nicht gesetzt — Auth/DB inaktiv (Phase 0).");
    }
    return null;
  }
  _client = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      // Session über Reloads halten + Token automatisch erneuern; Magic-Link/OAuth
      // kehren mit der Session in der URL zurück → detectSessionInUrl liest sie aus ([D21]).
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
  return _client;
}

// Mock-Helfer: simuliert die asynchrone Supabase-Antwort (Microtask, kein Flash).
const ok = <T>(data: T): Promise<T> => Promise.resolve(data);

// Firmen-Auflösung über den Kontakt — EINHEITLICH in der ganzen App. contacts hat
// 2 FKs zu companies (company_id + primary_company_id) → expliziter !company_id-Hint
// nötig (sonst PostgREST PGRST201). Single-Source für Leads (getContacts) + Signals (getSignals).
// Firmen-Embed (additiv um Subscription- + MRR-Felder erweitert für Farmer; Hunter ignoriert die Extra-Felder).
const CONTACT_COMPANY_EMBED = "company:companies!company_id(name, website, domain, subscription_plan, subscription_status, subscription_since, mrr_monthly, arr_yearly)";

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getLeads(): Promise<Lead[]> {
  return ok(INITIAL_LEADS);
}

export async function getCustomers(): Promise<Customer[]> {
  return ok(INITIAL_CUSTOMERS);
}

export async function getContactById(id: string): Promise<Lead | Customer | null> {
  const all: (Lead | Customer)[] = [...INITIAL_LEADS, ...INITIAL_CUSTOMERS];
  return ok(all.find((p) => p.id === id) ?? null);
}

export async function getTasks(): Promise<TaskItemType[]> {
  return ok(INITIAL_TASKS);
}

export async function getPriorities(): Promise<PriorityItemType[]> {
  return ok(INITIAL_PRIORITIES);
}

export async function getAppointments(): Promise<AppointmentItemType[]> {
  return ok(INITIAL_APPOINTMENTS);
}

export async function getAlerts(): Promise<AlertBannerType[]> {
  return ok(INITIAL_ALERT_BANNERS);
}

export async function getMarketingIdeas(): Promise<LinkedInPostIdea[]> {
  return ok(INITIAL_MARKETING_IDEAS);
}

export async function getKpis(): Promise<KPIItemType[]> {
  return ok(INITIAL_KPIS);
}

// ── Writes ─────────────────────────────────────────────────────────────────
// Phase 5: schreiben in Supabase (+ audit_log via DB-Trigger). Aktuell geben sie
// das Ergebnis zurück; der React-State der App bleibt die Prototyp-Quelle.

export async function createLead(lead: Lead): Promise<Lead> {
  return ok(lead);
}

export async function updateLeadStage(
  leadId: string,
  newStage: Lead["pipelineStage"],
): Promise<{ id: string; pipelineStage: Lead["pipelineStage"] }> {
  return ok({ id: leadId, pipelineStage: newStage });
}

export async function setTaskCompleted(
  taskId: string,
  completed: boolean,
): Promise<{ id: string; completed: boolean }> {
  return ok({ id: taskId, completed });
}

export async function upgradeSubscription(
  customerId: string,
  newPlan: "Growth" | "Enterprise",
): Promise<{ id: string; subscriptionPlan: "Growth" | "Enterprise" }> {
  return ok({ id: customerId, subscriptionPlan: newPlan });
}

export async function publishMarketingPost(
  id: string,
  text: string,
): Promise<{ id: string; draft: string; status: string }> {
  return ok({ id, draft: text, status: "published" });
}

// ── Phase 1: typsichere Query-Helper (echte Supabase-Queries) ─────────────────
// Regeln: organization_id IMMER dabei · Keyset-Pagination (cursor auf created_at,
// nie OFFSET) · ohne konfigurierte Supabase-Env (Phase 0/1) → leeres Ergebnis.
// Diese ergänzen die Mock-Reads oben; in Phase 2 lösen sie sie schrittweise ab.

export interface ContactFilters {
  status?: string;
  heatStatus?: string;
  companyId?: string; // Kontakte einer bestimmten Firma (Companies-Detail → Kontakte-Tab)
  limit?: number;
  cursor?: string; // created_at des letzten Eintrags (Keyset)
}

export async function getContacts(
  organizationId: string,
  filters: ContactFilters = {},
): Promise<ContactRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  // Company-Name über den einheitlichen Embed (RLS greift auf companies mit) + Telefon (primäre Nummer
  // für die Telefon-Spalte) + Lead-Owner-Name (assigned_to → users) für die erweiterten Kontakte-Spalten.
  let q = client
    .from("contacts")
    .select(`*, ${CONTACT_COMPANY_EMBED}, contact_phones(id, number, label, is_primary), owner:users!assigned_to(full_name)`)
    .eq("organization_id", organizationId)
    .is("deleted_at", null); // Soft-Delete: gelöschte Kontakte nie ausliefern (058)
  if (filters.status) q = q.eq("contact_status", filters.status);
  if (filters.heatStatus) q = q.eq("heat_status", filters.heatStatus);
  if (filters.companyId) q = q.eq("company_id", filters.companyId);
  if (filters.cursor) q = q.lt("created_at", filters.cursor);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50);
  if (error) throw error;
  return (data ?? []) as unknown as ContactRow[];
}

export interface CompanyFilters {
  limit?: number;
  cursor?: string; // created_at des letzten Eintrags (Keyset)
}

/**
 * getCompanies — Companies-Liste (K-4a). Embed: contacts (Aggregat für Anzahl/letzter Kontakt/
 * In-Campaign-Erkennung) + deals (offene-Deals-Aggregat + Pipeline-Erkennung). RLS greift auf
 * die eingebetteten Tabellen mit. Ohne konfigurierte Supabase-Env → leeres Ergebnis.
 */
export async function getCompanies(
  organizationId: string,
  filters: CompanyFilters = {},
): Promise<CompanyListRaw[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client
    .from("companies")
    // contacts hat ZWEI FKs auf companies (company_id + primary_company_id) → Embed MUSS
    // den FK explizit hinten (`!company_id`), sonst PostgREST-Fehler „more than one relationship".
    // deleted_at im Kontakt-Embed → Mapper filtert gelöschte Kontakte aus dem Aggregat (NICHT als
    // PostgREST-Embed-Filter, der den Left-Join zum Inner-Join machen und „Ohne Kontakt"-Firmen ausblenden würde).
    .select(`*, contacts!company_id(id, contact_status, last_contacted_at, deleted_at), deals(id, stage, closed_at, deleted_at)`)
    .eq("organization_id", organizationId)
    .is("deleted_at", null); // Soft-Delete: gelöschte Companies nie ausliefern (058)
  if (filters.cursor) q = q.lt("created_at", filters.cursor);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50);
  if (error) throw error;
  return (data ?? []) as unknown as CompanyListRaw[];
}

/** getCompanyDetail — eine Company inkl. Aggregat-Embeds (Kopf/KPIs der Detailseite + Prefetch, K-4b). */
export async function getCompanyDetail(
  organizationId: string,
  companyId: string,
): Promise<CompanyListRaw | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("companies")
    // contacts hat ZWEI FKs auf companies (company_id + primary_company_id) → Embed MUSS
    // den FK explizit hinten (`!company_id`), sonst PostgREST-Fehler „more than one relationship".
    .select(`*, contacts!company_id(id, contact_status, last_contacted_at, deleted_at), deals(id, stage, closed_at, deleted_at)`)
    .eq("organization_id", organizationId)
    .eq("id", companyId)
    .is("deleted_at", null) // gelöschte Company → nicht gefunden (058)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as CompanyListRaw) ?? null;
}

// ── Company-Detail K-4b-2: Deals / Notizen / Aktivität ───────────────────────

/** getDealsByCompany — Deals einer Firma (Deals-Tab). Spiegel von getDealsByContact auf company_id. */
export async function getDealsByCompany(
  organizationId: string,
  companyId: string,
): Promise<DealRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("deals")
    .select(`*, owner:users(full_name)`)
    .eq("organization_id", organizationId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DealRow[];
}

/** getNotesByCompany — Notizen einer Firma (Notizen-Tab). Spiegel von getNotesByContact auf company_id. */
export async function getNotesByCompany(
  organizationId: string,
  companyId: string,
): Promise<NoteRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("notes")
    .select(`*, author:users(full_name)`)
    .eq("organization_id", organizationId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as NoteRow[];
}

/** createCompanyNote — Notiz an einer Firma anlegen (Spiegel von createNote auf company_id). */
export async function createCompanyNote(
  organizationId: string,
  companyId: string,
  body: string,
  createdBy?: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("notes").insert({
    organization_id: organizationId,
    company_id: companyId,
    content: body,
    created_by: createdBy ?? null,
  });
  if (error) throw error;
}

/**
 * getCompanyActivity — aggregierter Touchpoint-Feed ALLER Kontakte einer Firma (Aktivität-Tab).
 * EIN Query: communications ⋈ contacts (inner) gefiltert auf contacts.company_id. Jeder Eintrag
 * trägt den Kontaktnamen (für „Thomas Brand · LinkedIn Signal"). Neueste zuerst.
 */
export async function getCompanyActivity(
  organizationId: string,
  companyId: string,
  limit = 50,
): Promise<CompanyActivityRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("communications")
    .select("id, occurred_at, channel, direction, note, contact:contacts!inner(first_name, last_name, company_id)")
    .eq("organization_id", organizationId)
    .eq("contacts.company_id", companyId)
    .is("contacts.deleted_at", null) // Aktivität gelöschter Kontakte ausblenden (058)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as CompanyActivityRow[];
}

export interface NewCompanyInput {
  name: string;
  domain?: string;
  industry?: string;
  size_range?: string;
}

/** createCompany — neue Firma anlegen (K-4a Basis-Felder). Leere Felder werden weggelassen. */
export async function createCompany(
  organizationId: string,
  input: NewCompanyInput,
): Promise<{ id: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const clean = Object.fromEntries(Object.entries(input).filter(([, v]) => v != null && v !== ""));
  const { data, error } = await client
    .from("companies")
    .insert({ organization_id: organizationId, ...clean })
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

// ── Soft-Delete (058) — Kontakte + Companies. Einzel = Bulk mit einer id. ─────────
// Kein Hard-Delete: nur deleted_at/deleted_by setzen. audit_log-Eintrag (delete_<table>)
// entsteht automatisch über den audit_write-Trigger. KEINE Rollenprüfung ([D-delete-rights]).

/** softDeleteContacts — Kontakte soft-löschen (deleted_at/deleted_by). Leere Liste → no-op. */
export async function softDeleteContacts(
  organizationId: string,
  ids: string[],
  _deletedBy?: string | null, // Actor = auth.uid() serverseitig (SET-1), Param nur noch API-kompatibel
): Promise<void> {
  const client = getSupabaseClient();
  if (!client || ids.length === 0) return;
  // SET-1: server-erzwungen über RPC (has_permission('records.delete') + Org-Scope), nicht mehr direkter Update.
  const { error } = await client.rpc("soft_delete_contacts", { p_org: organizationId, p_ids: ids });
  if (error) throw error;
}

/**
 * softDeleteCompanies — Companies soft-löschen. Punkt 5 (bestätigt): KEINE Kaskade — verknüpfte
 * Kontakte bleiben bestehen und verlieren nur die company_id/primary_company_id-Verknüpfung
 * (analog „Company ohne Kontakte bleibt erhalten"). Deals bleiben ebenfalls unangetastet.
 */
export async function softDeleteCompanies(
  organizationId: string,
  ids: string[],
  _deletedBy?: string | null, // Actor = auth.uid() serverseitig (SET-1)
): Promise<void> {
  const client = getSupabaseClient();
  if (!client || ids.length === 0) return;
  // SET-1: RPC entkoppelt Kontakte + soft-löscht Companies (has_permission('records.delete') + Org-Scope).
  const { error } = await client.rpc("soft_delete_companies", { p_org: organizationId, p_ids: ids });
  if (error) throw error;
}

export interface DealFilters {
  stage?: string;
  ownerId?: string;
  limit?: number;
  cursor?: string;
}

// Join-Select: Deal + Kontakt + Company + offene Tasks (Tasks im JS gefiltert).
const DEAL_SELECT =
  `*, contact:contacts(*, ${CONTACT_COMPANY_EMBED}), company:companies(*), owner:users(full_name), tasks(*)`;

export async function getDeals(
  organizationId: string,
  filters: DealFilters = {},
): Promise<Deal[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client.from("deals").select(DEAL_SELECT).eq("organization_id", organizationId).is("deleted_at", null); // soft-gelöschte ausblenden
  if (filters.stage) q = q.eq("stage", filters.stage);
  if (filters.ownerId) q = q.eq("owner_id", filters.ownerId);
  if (filters.cursor) q = q.lt("created_at", filters.cursor);
  const { data, error } = await q
    // Stagnierendste zuerst, dann neueste (Keyset bleibt via created_at möglich).
    .order("stagnation_days", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50);
  if (error) throw error;
  const deals = (data ?? []) as unknown as Deal[];
  // nur offene Tasks pro Deal behalten
  for (const d of deals) d.tasks = (d.tasks ?? []).filter((t) => !t.completed_at);
  return deals;
}

/** Einzelner Deal mit allen Details (für das Info Panel). */
export async function getDealWithDetails(
  dealId: string,
  organizationId: string,
): Promise<Deal | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("deals")
    .select(DEAL_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", dealId)
    .is("deleted_at", null) // soft-gelöschte ausblenden
    .single();
  if (error) return null;
  return data as unknown as Deal;
}

/**
 * getNewInPipeline — „Neu in Pipeline"-Tab. Frisch angelegte Deals, neueste zuerst
 * (`created_at` desc). Embed: Kontakt (Identität/Heat/ICP zentral) inkl. Firma-Hint
 * + schlanker Deals-Embed für `contactActiveStage`. `source_lead_id` (Herkunft AI SDR
 * vs. manuell) kommt explizit mit. Das Zeitfenster (heute / 7T / 30T) filtert der
 * Screen client-seitig über `created_at` (Muster wie die Pipeline-Filter).
 */
export async function getNewInPipeline(
  organizationId: string,
): Promise<DealRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("deals")
    .select(
      `id, name, stage, created_at, source_lead_id, value, product, contact:contacts(*, ${CONTACT_COMPANY_EMBED}, deals(stage, updated_at, stage_updated_at, closed_at, created_at, deleted_at))`,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null) // soft-gelöschte ausblenden
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as DealRow[];
}

/**
 * getContactDetail — ein Kontakt für das 820px-Info-Panel (P1). Embed: Firma (einheitlich)
 * + lean Deals (für contactActiveStage) — gleiche Leitung wie getContacts/getFollowUps.
 * Kopf rendert via contactToProfile/contactActiveStage. Kein Treffer → null (Panel leer).
 */
export async function getContactDetail(
  organizationId: string,
  contactId: string,
): Promise<ContactRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("contacts")
    .select(
      // Firmen-Embed hier breiter als CONTACT_COMPANY_EMBED: der Details-Tab seedet/schreibt auch
      // Branche/Größe/Stadt/Land der Firma. + Subscription/MRR (Farmer Subscription-Tab, 8d) — Single
      // Source: Plan/Status/Aktiv-seit/MRR/ARR (Cent) aus companies, kein Doppel-Fetch.
      // import_batch: Dateiname des Ursprungs-Imports (System-Feld „Lead-Quelle" zeigt „Import (CSV) — datei.csv").
      `*, company:companies!company_id(name, website, domain, industry, size_range, city, country, subscription_plan, subscription_status, subscription_since, mrr_monthly, arr_yearly), deals(id, name, stage, updated_at, stage_updated_at, closed_at, created_at, deleted_at), contact_phones(id, number, label, is_primary, created_at), import_batch:import_batches!import_batch_id(filename)`,
    )
    .eq("organization_id", organizationId)
    .eq("id", contactId)
    .is("deleted_at", null) // gelöschter Kontakt → nicht gefunden (058)
    .single();
  if (error) return null;
  return (data as unknown as ContactRow) ?? null;
}

/**
 * updateContact — Stammdatenfelder eines Kontakts schreiben (Details-Tab / Inline-Edit). Nur die
 * übergebenen Felder (Partial), org-gescoped (RLS), Audit via Trigger. Aufrufer validiert vorher
 * (E-Mail/URL) und schreibt NULL statt Leerstring, wenn der User ein Feld geleert hat.
 */
export async function updateContact(
  contactId: string,
  organizationId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client || Object.keys(fields).length === 0) return;
  const { error } = await client
    .from("contacts")
    .update(fields)
    .eq("organization_id", organizationId)
    .eq("id", contactId);
  if (error) throw error;
}

/** updateCompany — Firmen-Stammdaten (Details-Tab Firma-Sektion). Wie updateContact, auf companies. */
export async function updateCompany(
  companyId: string,
  organizationId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client || Object.keys(fields).length === 0) return;
  const { error } = await client
    .from("companies")
    .update(fields)
    .eq("organization_id", organizationId)
    .eq("id", companyId);
  if (error) throw error;
}

// ── contact_phones Writes (PH3) ──────────────────────────────────────────────
// Hard-Delete (Migration 026 hat kein deleted_at). Genau-1-Favorit via partial
// unique index (… where is_primary) → vor jedem neuen Favorit erst alle false.
// Audit deckt der Trigger trg_contact_phones_audit ab. RLS = eingeloggte Org.

/** Neue Telefonnummer anlegen. isPrimary → vorher alle anderen entprimen (Constraint). */
export async function createContactPhone(
  organizationId: string,
  contactId: string,
  fields: { number: string; label?: string; isPrimary?: boolean },
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  if (fields.isPrimary) {
    const { error: e0 } = await client
      .from("contact_phones")
      .update({ is_primary: false })
      .eq("organization_id", organizationId)
      .eq("contact_id", contactId);
    if (e0) throw e0;
  }
  const { error } = await client.from("contact_phones").insert({
    organization_id: organizationId,
    contact_id: contactId,
    number: fields.number,
    label: fields.label ?? null,
    is_primary: !!fields.isPrimary,
  });
  if (error) throw error;
}

/** Nummer/Label einer bestehenden Telefonnummer aktualisieren. */
export async function updateContactPhone(
  organizationId: string,
  phoneId: string,
  fields: { number?: string; label?: string },
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const patch: Record<string, unknown> = {};
  if (fields.number !== undefined) patch.number = fields.number;
  if (fields.label !== undefined) patch.label = fields.label;
  if (Object.keys(patch).length === 0) return;
  const { error } = await client
    .from("contact_phones")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", phoneId);
  if (error) throw error;
}

/** Favorit/primäre Nummer setzen: erst alle des Kontakts false, dann diese true (Constraint-sicher). */
export async function setContactPhonePrimary(
  organizationId: string,
  contactId: string,
  phoneId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error: e0 } = await client
    .from("contact_phones")
    .update({ is_primary: false })
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId);
  if (e0) throw e0;
  const { error } = await client
    .from("contact_phones")
    .update({ is_primary: true })
    .eq("organization_id", organizationId)
    .eq("id", phoneId);
  if (error) throw error;
}

/** Telefonnummer löschen (Hard-Delete, kein deleted_at in 026). */
export async function deleteContactPhone(
  organizationId: string,
  phoneId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("contact_phones")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", phoneId);
  if (error) throw error;
}

/**
 * getDueTasks — fällige Tasks (Fundament für Follow-ups, T2). Definition:
 * `completed_at IS NULL AND due_at <= now()` — reiner Filter, keine Berechnung.
 * `due_at IS NULL` ist nie fällig (NULL-Vergleich) → fällt korrekt raus.
 * Embed: Kontakt (Identität/Heat/ICP zentral) inkl. Firma-Hint + schlanker
 * Deals-Embed → Stage via `contactActiveStage` (gleiche Leitung wie Signals/Follow-ups).
 * Sortierung: due_at aufsteigend (am längsten überfällig zuerst). Index: idx_tasks_org_due (021).
 */
export async function getDueTasks(
  organizationId: string,
  opts: { contactStatus?: string } = {},
): Promise<DueTaskRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const nowIso = new Date().toISOString();
  // contactStatus-Filter → inner-join auf contacts (sonst kein Filter auf das Embed möglich).
  // Ohne Filter: bisheriges Verhalten (Hunter) unverändert.
  const contactEmbed = opts.contactStatus
    ? `contact:contacts!inner(*, ${CONTACT_COMPANY_EMBED}, deals(stage, updated_at, stage_updated_at, closed_at, created_at, deleted_at))`
    : `contact:contacts(*, ${CONTACT_COMPANY_EMBED}, deals(stage, updated_at, stage_updated_at, closed_at, created_at, deleted_at))`;
  let q = client
    .from("tasks")
    .select(`id, title, due_at, priority, channel, ${contactEmbed}`)
    .eq("organization_id", organizationId)
    .is("deleted_at", null) // soft-gelöschte ausblenden
    .is("completed_at", null)
    .lte("due_at", nowIso);
  if (opts.contactStatus) q = q.eq("contact.contact_status", opts.contactStatus);
  const { data, error } = await q.order("due_at", { ascending: true }).limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as DueTaskRow[];
}

export interface SignalFilters {
  routedTo?: "hunter" | "farmer" | "ai_sdr" | "unrouted";
  processed?: boolean;
  limit?: number;
}

export async function getSignals(
  organizationId: string,
  filters: SignalFilters = {},
): Promise<Signal[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  // Kontakt + Firma (einheitlicher Embed) + lean Kontakt-Deals für die aktive-Deal-Stage.
  // created_at zusätzlich als Recency-Tiebreaker (siehe latestActiveDeal).
  let q = client
    .from("signals")
    .select(
      `*, contact:contacts(*, ${CONTACT_COMPANY_EMBED}, deals(stage, updated_at, stage_updated_at, closed_at, created_at, deleted_at))`,
    )
    .eq("organization_id", organizationId);
  if (filters.routedTo) q = q.eq("routed_to", filters.routedTo);
  if (filters.processed === false) q = q.is("processed_at", null);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50);
  if (error) throw error;
  return (data ?? []) as unknown as Signal[];
}

/** Stage wechseln + stage_updated_at = now(). Audit-Log via DB-Trigger (audit_write). */
export async function updateDealStage(
  dealId: string,
  newStage: string,
  organizationId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("deals")
    .update({ stage: newStage, stage_updated_at: new Date().toISOString(), stagnation_days: 0 })
    .eq("organization_id", organizationId)
    .eq("id", dealId);
  if (error) throw error;
  // Stagnation für genau diesen Deal neu bewerten (score_deal_health). Fire-and-forget: blockiert
  // den Stage-Write nicht, Fehler werden geschluckt (der tägliche Cron korrigiert ohnehin nach).
  // Hinweis: nach einem Stage-Wechsel ist stagnation_days bereits 0 → meist redundant, aber spec-konform.
  void client.functions.invoke("score-deal-health", { body: { organizationId, dealId } }).catch(() => {});
}

/**
 * updateDealWon — Deal gewonnen (P8-3). Setzt stage=gewonnen + closed_at=now()
 * (tatsächlicher Abschluss) + stage_updated_at + Stagnation-Reset. Eigene Funktion,
 * weil updateDealStage bewusst kein closed_at schreibt. Audit via DB-Trigger.
 */
export async function updateDealWon(
  dealId: string,
  organizationId: string,
  opts?: { wonReason?: string; wonNote?: string },
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { stage: WON_STAGE_SLUG, closed_at: now, stage_updated_at: now, stagnation_days: 0 };
  if (opts?.wonReason !== undefined) patch.won_reason = opts.wonReason.trim() || null; // leer → null
  if (opts?.wonNote !== undefined) patch.won_note = opts.wonNote.trim() || null;       // leer → null (kein Fake)
  const { error } = await client
    .from("deals")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", dealId);
  if (error) throw error;
}

/**
 * updateDealLost — Deal verloren (P8-3). Setzt stage=verloren + closed_at=now() +
 * lost_reason (Pflicht, App-seitig erzwungen) + optionale lost_note (eigene Spalte, NICHT
 * mehr an den Grund angehängt) + stage_updated_at + Stagnation-Reset. Audit via Trigger.
 */
export async function updateDealLost(
  dealId: string,
  organizationId: string,
  lostReason: string,
  lostNote?: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { stage: LOST_STAGE_SLUG, closed_at: now, lost_reason: lostReason, stage_updated_at: now, stagnation_days: 0 };
  if (lostNote !== undefined) patch.lost_note = lostNote.trim() || null; // leere Notiz → null (kein Fake)
  const { error } = await client
    .from("deals")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", dealId);
  if (error) throw error;
}

/**
 * completeTask — Task als erledigt markieren (`completed_at = now()`), org-gescoped.
 * Erster Schreib-Pfad (User-Write); Audit deckt der DB-Trigger `trg_tasks_audit` ab —
 * keine Edge Function. RLS verlangt eingeloggten User (org == auth_org_id()).
 * Danach fällt die Task aus getDueTasks → Follow-ups-Karte verschwindet.
 */
export async function completeTask(
  taskId: string,
  organizationId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

// ── Notifications (N-S2) — reine RLS-Queries (notifications_own = org + user). ─
// Kein notify()-Aufruf hier: die Glocke LIEST/markiert-gelesen nur eigene Zeilen (RLS-geschützt).
// Ohne Login-Session (auth.uid() null) liefert RLS korrekt leer → Glocke bleibt leer, kein Fehler.
export interface NotificationRow {
  id: string;
  category: string;
  severity: string;
  title: string;
  body: string | null;
  link: string | null;
  source_type: string;
  source_id: string;
  read_at: string | null;
  created_at: string;
  /** Zeitpunkt der letzten Aktualisierung. Ändert sich NUR, wenn notify() dieselbe Mitteilung
   *  erneut auslöst (ON CONFLICT) — „gelesen markieren" fasst ihn nicht an. Basis der Zeitanzeige. */
  updated_at: string;
}

/** Mitteilungen des eingeloggten Users. mode 'unread' = Standardansicht (N13), 'history' = Verlauf (90T). */
export async function getNotifications(
  organizationId: string,
  mode: "unread" | "history" = "unread",
): Promise<NotificationRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client
    .from("notifications")
    .select("id, category, severity, title, body, link, source_type, source_id, read_at, created_at, updated_at")
    .eq("organization_id", organizationId);
  q = mode === "unread" ? q.is("read_at", null) : q.not("read_at", "is", null);
  // Nach updated_at sortieren, damit Position und angezeigte Zeit dieselbe Quelle haben:
  // eine erneut ausgelöste Mitteilung ist frische Aktivität und gehört nach oben.
  const { data, error } = await q.order("updated_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

/** Ungelesen-Count für das Glocken-Badge (leichte count-Query). */
export async function getUnreadNotificationCount(organizationId: string): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

/** Eine Mitteilung als gelesen markieren (N13: verschwindet danach aus der Standardansicht). */
export async function markNotificationRead(id: string, organizationId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .is("read_at", null); // idempotent: schon Gelesenes nicht anfassen
  if (error) throw error;
}

/** Alle ungelesenen Mitteilungen des Users als gelesen markieren. */
export async function markAllNotificationsRead(organizationId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .is("read_at", null);
  if (error) throw error;
}

/**
 * getTasksByContact — alle Tasks eines Kontakts fürs Panel (P3). Offene zuerst
 * (completed_at NULL), dann nach Fälligkeit; erledigte abgesetzt unten.
 * Embed: Deal-Name (Deal-Bezug) + Zuständige:r (assigned_to → users.full_name).
 */
export async function getTasksByContact(
  organizationId: string,
  contactId: string,
): Promise<TaskRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("tasks")
    .select(`*, deal:deals(name), assignee:users(full_name)`)
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId)
    .is("deleted_at", null) // soft-gelöschte ausblenden
    .order("completed_at", { ascending: true, nullsFirst: true }) // offene (NULL) zuerst
    .order("due_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as TaskRow[];
}

/**
 * softDeleteTask — Task ausblenden (soft delete): `deleted_at = now()`, org-gescoped.
 * Bleibt für Historie/Audit erhalten (Audit via DB-Trigger). Fällt danach aus allen
 * aktiven Task-Listen (deleted_at IS NULL-Filter). Harte Löschung NICHT vorgesehen.
 */
export async function softDeleteTask(
  taskId: string,
  organizationId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

/** Task anlegen (P3, erster Panel-Write). Audit-Log via DB-Trigger; RLS = eingeloggter User. */
export async function createTask(task: {
  organizationId: string;
  contactId?: string;
  dealId?: string;
  title: string;
  description?: string;
  channel?: string; // email | linkedin | phone | calendar | other (Caller mappt mail→email)
  dueAt: string;
  priority: string;
  source: "manual";
  assignedTo?: string; // [D21]: verantwortlicher User (= anlegender User); fehlt → NULL (Demo)
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("tasks").insert({
    organization_id: task.organizationId,
    contact_id: task.contactId ?? null,
    deal_id: task.dealId ?? null,
    assigned_to: task.assignedTo ?? null, // tasks hat kein created_by → assigned_to ist die User-Spalte
    title: task.title,
    description: task.description ?? null,
    channel: task.channel ?? null,
    due_at: task.dueAt,
    priority: task.priority,
    source: task.source,
  });
  if (error) throw error;
}

/**
 * updateTask — bestehende Task bearbeiten (P8): org-gescoped, Audit via DB-Trigger.
 * Spiegelt das createTask-Feldmapping; aktualisiert nur die im TaskFormular editierbaren
 * Felder (Titel/Beschreibung/Kanal/Fällig/Priorität/Deal). Kein `updated_at` (Spalte wie bei
 * completeTask/softDeleteTask nicht gesetzt; Historie kommt aus dem audit_log-Trigger).
 */
export async function updateTask(
  taskId: string,
  organizationId: string,
  patch: {
    title: string;
    description?: string;
    channel?: string; // email | linkedin | phone | calendar | other (Caller mappt mail→email)
    dueAt: string;
    priority: string;
    dealId?: string;
  },
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("tasks")
    .update({
      title: patch.title,
      description: patch.description ?? null,
      channel: patch.channel ?? null,
      due_at: patch.dueAt,
      priority: patch.priority,
      deal_id: patch.dealId ?? null,
    })
    .eq("id", taskId)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

/**
 * getNotesByContact — Notizen eines Kontakts fürs Panel (P4), neueste zuerst.
 * Embed: Autor (created_by → users.full_name; NULL → kein Autor angezeigt).
 */
export async function getNotesByContact(
  organizationId: string,
  contactId: string,
): Promise<NoteRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("notes")
    .select(`*, author:users(full_name)`)
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId)
    .is("deleted_at", null) // soft-gelöschte ausblenden
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as NoteRow[];
}

/** updateNote — Notiztext bearbeiten (P4b): setzt `content` + `updated_at = now()`, org-gescoped. */
export async function updateNote(
  noteId: string,
  organizationId: string,
  body: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("notes")
    .update({ content: body, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

/** softDeleteNote — Notiz ausblenden (P4b): `deleted_at = now()`, org-gescoped. Bleibt für Historie/Audit. */
export async function softDeleteNote(
  noteId: string,
  organizationId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

/**
 * createNote — manuelle Notiz anlegen (P4, User-Write). RLS = eingeloggter User.
 * HINWEIS: `notes` hat (anders als `tasks`) KEINEN audit_write-Trigger → dieser Write
 * landet NICHT im audit_log (für einfache User-Notizen akzeptiert; Trigger ggf. später).
 * createdBy ([D21]): users.id des anlegenden Users; fehlt → NULL (Demo-kompatibel).
 */
export async function createNote(
  organizationId: string,
  contactId: string,
  body: string,
  createdBy?: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("notes").insert({
    organization_id: organizationId,
    contact_id: contactId,
    content: body,
    created_by: createdBy ?? null,
  });
  if (error) throw error;
}

/**
 * getContactCommunications — protokollierte Touchpoints eines Kontakts (Kommunikations-Tab),
 * neueste zuerst. Explizite Felder (kein SELECT *), org-gescoped. Quelle: communications (036).
 */
export async function getContactCommunications(
  organizationId: string,
  contactId: string,
): Promise<CommunicationRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("communications")
    .select("id, contact_id, occurred_at, channel, direction, note, created_at")
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as CommunicationRow[];
}

/**
 * createCommunication — einen Touchpoint protokollieren. contacts.last_contacted_at wird per
 * DB-Trigger (036, nur vorwärts) gesetzt → speist die Heat-Berechnung. audit_log via Trigger.
 * createdBy ([D21]): users.id des protokollierenden Users; fehlt → NULL (Demo-kompatibel).
 */
export async function createCommunication(
  organizationId: string,
  contactId: string,
  input: { channel: string; direction: string; occurredAt: string; note?: string },
  createdBy?: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("communications").insert({
    organization_id: organizationId,
    contact_id: contactId,
    channel: input.channel,
    direction: input.direction,
    occurred_at: input.occurredAt,
    note: input.note?.trim() || null,
    created_by: createdBy ?? null,
  });
  if (error) throw error;
  // Heat für genau diesen Kontakt neu bewerten (score-heat-status). last_contacted_at wird per
  // DB-Trigger (036) gesetzt; diese Function liest es. Fire-and-forget: blockiert den Insert nicht,
  // Fehler werden geschluckt (der tägliche Cron korrigiert ohnehin nach).
  void client.functions.invoke("score-heat-status", { body: { organizationId, contactId } }).catch(() => {});
}

/**
 * getDealsByContact — Deals eines Kontakts fürs Panel (P5a, nur Read), neueste zuerst.
 * Embed: Owner (owner_id → users.full_name). Stage bleibt Slug → Anzeigename mappt der
 * Screen über settings.pipeline_stages (etablierte Stage-Auflösung).
 */
export async function getDealsByContact(
  organizationId: string,
  contactId: string,
): Promise<DealRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("deals")
    .select(`*, owner:users(full_name)`)
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId)
    .is("deleted_at", null) // soft-gelöschte ausblenden
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DealRow[];
}

/**
 * getActivityByContact — Aktivitäts-Feed eines Kontakts (Audit-Log). Sammelt die Audit-Einträge,
 * die zu diesem Kontakt gehören: der Kontakt selbst + seine Deals/Tasks/Notes (über deren id =
 * audit_log.entity_id). Soft-gelöschte Deals/Tasks/Notes werden BEWUSST mitgenommen — ihre Historie
 * (inkl. Lösch-Event) gehört in den Feed. Embed user:users(full_name) → „Wer" (NULL bei System/AI).
 * Neueste zuerst, auf 50 begrenzt.
 */
export async function getActivityByContact(
  organizationId: string,
  contactId: string,
): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  // Entity-IDs des Kontakts einsammeln (kein deleted_at-Filter → Lösch-Historie bleibt sichtbar).
  const [deals, tasks, notes] = await Promise.all([
    client.from("deals").select("id").eq("organization_id", organizationId).eq("contact_id", contactId),
    client.from("tasks").select("id").eq("organization_id", organizationId).eq("contact_id", contactId),
    client.from("notes").select("id").eq("organization_id", organizationId).eq("contact_id", contactId),
  ]);
  const ids = [
    contactId,
    ...((deals.data ?? []) as { id: string }[]).map((r) => r.id),
    ...((tasks.data ?? []) as { id: string }[]).map((r) => r.id),
    ...((notes.data ?? []) as { id: string }[]).map((r) => r.id),
  ];
  const { data, error } = await client
    .from("audit_log")
    .select("id, action, entity_type, entity_id, user_id, metadata, created_at, user:users(full_name)")
    .eq("organization_id", organizationId)
    .in("entity_id", ids)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

/** getProducts — aktive Produkte der Org (Katalog, P5b), nach Name. Speist das Deal-Produkt-Dropdown. */
export async function getProducts(
  organizationId: string,
): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("products")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** getOrgUsers — User der Organisation (P5c-1), nach Name. Speist das Deal-Owner-Dropdown. */
export async function getOrgUsers(
  organizationId: string,
): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("users")
    .select("id, full_name")
    .eq("organization_id", organizationId)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * getUserOrgRole — organization_id + role des eingeloggten Users aus public.users
 * ([D21], Single-Source fürs Session→Org-Wiring). null wenn kein Backend oder kein
 * passender users-Datensatz (dann greift im Hook der DEMO_ORGANIZATION_ID-Fallback).
 */
export async function getUserOrgRole(
  userId: string,
): Promise<{ organization_id: string; role: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("users")
    .select("organization_id, role")
    .eq("id", userId)
    .single();
  if (error) return null; // kein Treffer / RLS → Fallback im Hook
  return data as { organization_id: string; role: string };
}

// ── Team & Einladungen ([D21] Scheibe 7) ─────────────────────────────────────

/** getTeamMembers — alle User der Organisation (Settings → Team), älteste zuerst. */
export async function getTeamMembers(
  organizationId: string,
): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("users")
    .select("id, full_name, email, role, created_at, status, last_seen_at")
    .eq("organization_id", organizationId)
    .neq("status", "removed") // weich Entfernte erscheinen nicht mehr in der Team-Liste (Zeile bleibt)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ── SET-3: Mitglieder-Lebenszyklus (Migr. 076) — alle Guards serverseitig ────
/** Mitglied deaktivieren (Recht team.invite; letzter Owner + Selbst-Lockout serverseitig blockiert). */
export async function deactivateMember(target: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("deactivate_member", { p_target: target });
  if (error) throw error;
}

/** Mitglied wieder aktivieren. */
export async function reactivateMember(target: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("reactivate_member", { p_target: target });
  if (error) throw error;
}

/** Mitglied entfernen — WEICH (status='removed'), kein Hard-Delete: Zuordnungen bleiben intakt. */
export async function removeMember(target: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("remove_member", { p_target: target });
  if (error) throw error;
}

/** „Zuletzt aktiv"-Zeitstempel setzen (einmal pro Session; ohne Session serverseitig No-op). */
export async function setLastSeen(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.rpc("set_last_seen"); // Fehler bewusst ignoriert: reine Komfort-Info, nie blockierend
}

/**
 * Personen-gescopte Rechte-/Rollen-Historie (Personen-Detail, SET-3). Muster wie getActivityByContact:
 * audit_log-Einträge mit entity_type='user' + entity_id = betroffene Person, „Wer" via users-Embed.
 * Die VOLLE Audit-Log-Seite mit Filtern ist SET-6 — das hier ist bewusst nur der Personen-Ausschnitt.
 */
export async function getMemberAuditLog(
  organizationId: string,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("audit_log")
    .select("id, action, entity_type, entity_id, user_id, metadata, created_at, user:users(full_name)")
    .eq("organization_id", organizationId)
    .eq("entity_type", "user")
    .eq("entity_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

/** getInvitations — offene (noch nicht angenommene) Einladungen der Org, neueste zuerst. */
export async function getInvitations(
  organizationId: string,
): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("invitations")
    // token: für „Einladungslink kopieren" (Mailversand ist deferred [D29]) — RLS hält ihn org-intern.
    .select("id, email, role, created_at, expires_at, token")
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * createInvitation — Einladung anlegen (Settings → Team). Schreibt die invitations-Zeile;
 * token + expires_at (now()+7d) kommen aus DB-Defaults (042). Audit via Trigger.
 * HINWEIS: Der Einladungs-Mail-Versand läuft über die Supabase Admin-API
 * (auth.admin.inviteUserByEmail) und braucht den service_role-Key → NICHT im Client
 * möglich. Versand kommt als Edge Function (deferred); hier wird nur die Einladung
 * persistiert. Beim späteren Registrieren greift der Provisioning-Trigger (043).
 */
export async function createInvitation(
  _organizationId: string, // Org + Actor kommen serverseitig aus auth.uid() (SET-3, Migr. 076)
  email: string,
  role: string,
  _invitedBy?: string,
): Promise<"created" | "renewed" | "already_member"> {
  const client = getSupabaseClient();
  if (!client) return "created";
  // Server erzwingt Recht `team.invite`, Org-Scope und Dedup (schon Mitglied / offene Einladung erneuern).
  const { data, error } = await client.rpc("create_invitation", { p_email: email, p_role: role });
  if (error) throw error;
  return (data as "created" | "renewed" | "already_member") ?? "created";
}

/** deleteInvitation — offene Einladung zurückziehen, org-gescoped. */
export async function deleteInvitation(
  invitationId: string,
  organizationId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

/** updateUserRole — Rolle eines Mitglieds ändern. SET-1: server-erzwungen via set_user_role-RPC
 * (nur Owner, Cross-Org-Schutz, Letzter-Owner-Schutz) — nicht mehr direkter Update. */
export async function updateUserRole(
  userId: string,
  _organizationId: string, // Org-Scope serverseitig (Actor-Org == Ziel-Org)
  role: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("set_user_role", { p_target: userId, p_role: role });
  if (error) throw error;
}

// ── Rechte (SET-1) — RPC-Wrapper (Guard serverseitig) ────────────────────────
/** Effektive Rechte eines Users (Rollen ∪ grants − denies) — fürs UI-Caching (useEffectivePermissions). */
export async function getEffectivePermissions(userId: string): Promise<string[]> {
  const client = getSupabaseClient();
  if (!client || !userId) return [];
  const { data, error } = await client.rpc("effective_permissions", { p_user: userId });
  if (error) throw error;
  return (data as string[] | null) ?? [];
}

/** Einzelrecht zuweisen/entziehen (Actor = auth.uid()); effect 'grant' (Default) oder 'deny' (subtraktiv). */
export async function grantPermission(target: string, permission: string, effect: "grant" | "deny" = "grant"): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("grant_permission", { p_target: target, p_permission: permission, p_effect: effect });
  if (error) throw error;
}

/** Individuelles Einzelrecht wieder entfernen (zurück auf Rollen-Default). */
export async function revokePermission(target: string, permission: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("revoke_permission", { p_target: target, p_permission: permission });
  if (error) throw error;
}

/**
 * createDeal — neuen Deal anlegen (P5b, einfacher User-Write). Audit via DB-Trigger,
 * keine Edge Function. value: € → Cent (×100). stage = Default `backlog` (kein Stage-Wechsel).
 * owner_id bleibt NULL (vgl. [D21] — Auto-Set des Session-Users kommt mit Auth/Org-Wiring).
 * product = gewählter Name aus dem Katalog (konsistente Werte; deals.product bleibt Freitext).
 */
export async function createDeal(
  organizationId: string,
  deal: {
    name: string; product?: string; valueEur?: number; contactId?: string;
    companyId?: string; // K-4b-2: Deal direkt an einer Company (Companies-Detail → Deals-Tab)
    // Optionale Vertrags-/Forecast-Felder (Migration 029). Fehlen sie → null, nie 0.
    termMonths?: number; noticePeriodDays?: number; expectedCloseDate?: string;
    ownerId?: string; // P5c-1: manuell gewählter Owner; leer → null ([D21], kein Auto-Set)
    stage?: string; // P5c-2b: gewählte Stage (Slug); fehlt → Default 'backlog'
  },
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("deals").insert({
    organization_id: organizationId,
    contact_id: deal.contactId ?? null,
    company_id: deal.companyId ?? null,
    name: deal.name,
    product: deal.product || null,
    value: deal.valueEur != null ? Math.round(deal.valueEur * 100) : null,
    currency: "EUR",
    stage: deal.stage || "backlog",
    term_months: deal.termMonths ?? null, // Laufzeit (Monate) — null wenn leer
    notice_period_days: deal.noticePeriodDays ?? null, // Kündigungsfrist (Tage) — null wenn leer
    expected_close_date: deal.expectedCloseDate || null, // erw. Abschluss — null wenn leer
    owner_id: deal.ownerId || null, // gewählter Owner — null wenn nicht gewählt (kein Fake)
  });
  if (error) throw error;
}

/**
 * updateDeal — Deal bearbeiten (P5c-2, einfacher User-Write). Schreibt NUR editierbare
 * Felder; leer → null (Feld leeren erlaubt). NICHT angefasst: stage (P8), currency,
 * probability (Admin setzt sie pro Stage in den Pipeline-Settings, kein Deal-Feld),
 * mrr/arr (berechnet, keine Spalten), heat/stagnation/source, end_date/lost_reason (P8).
 * Audit via DB-Trigger. Scope hart auf org + id.
 */
export async function updateDeal(
  organizationId: string,
  dealId: string,
  deal: {
    name: string; product?: string; valueEur?: number; ownerId?: string;
    termMonths?: number; noticePeriodDays?: number; expectedCloseDate?: string;
  },
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("deals")
    .update({
      name: deal.name,
      product: deal.product || null,
      value: deal.valueEur != null ? Math.round(deal.valueEur * 100) : null,
      owner_id: deal.ownerId || null,
      term_months: deal.termMonths ?? null,
      notice_period_days: deal.noticePeriodDays ?? null,
      expected_close_date: deal.expectedCloseDate || null,
    })
    .eq("organization_id", organizationId)
    .eq("id", dealId);
  if (error) throw error;
}

/** softDeleteDeal — Deal ausblenden (P5c-3): `deleted_at = now()`, org-gescoped. Bleibt für
 *  Historie/Audit (Trigger trg_deals_audit aus 010). Harte Löschung NICHT vorgesehen. */
export async function softDeleteDeal(
  dealId: string,
  organizationId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  // SET-1: server-erzwungen über RPC (has_permission('records.delete') + Org-Scope) — records.delete
  // deckt laut Katalog „Kontakte/Companies/Deals löschen" ab.
  const { error } = await client.rpc("soft_delete_deals", { p_org: organizationId, p_ids: [dealId] });
  if (error) throw error;
}

/** settings.pipeline_stages (Anzeigenamen/Slugs/Schwellen). Caching am Call-Site (TanStack). */
export async function getPipelineSettings(
  organizationId: string,
): Promise<PipelineStage[]> {
  const settings = await getSettings(organizationId);
  return (settings?.pipeline_stages as PipelineStage[] | undefined) ?? [];
}

/** settings.thresholds.hunter_priority_weights (Dringlichkeits-Score, org-tunebar). null → Default im Mapper. */
export async function getHunterPriorityWeights(
  organizationId: string,
): Promise<Record<string, number> | null> {
  const settings = await getSettings(organizationId);
  const thresholds = settings?.thresholds as Record<string, unknown> | undefined;
  return (thresholds?.hunter_priority_weights as Record<string, number> | undefined) ?? null;
}

/** settings.signal_windows (Dringlichkeits-Window je signal_type, org-tunebar). */
export async function getSignalWindows(
  organizationId: string,
): Promise<SignalWindow[]> {
  const settings = await getSettings(organizationId);
  return (settings?.signal_windows as SignalWindow[] | undefined) ?? [];
}

/** Settings-Zeile der Org (Single Source of Truth aller Schwellenwerte). */
export async function getSettings(
  organizationId: string,
): Promise<Record<string, unknown> | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("settings")
    .select("*")
    .eq("organization_id", organizationId)
    .single();
  if (error) return null;
  return data;
}

/**
 * settings ändern (EIN Schreibweg, SET-4, RPC update_settings). patch-Top-Level ⊆
 * {thresholds, automation_defaults, pipeline_stages}. Serverseitig: bereichs-spezifisches Recht
 * (rules.edit / automation.manage / pipeline.manage) · Key-Whitelist · Min/Max pro Feld ·
 * Won/Lost-Schutz · audit_log. thresholds/automation_defaults als VOLLE Zweitebene-Objekte (shallow-merge).
 */
export async function updateSettings(patch: Record<string, unknown>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("update_settings", { p_patch: patch });
  if (error) throw error;
}

// ── Lifecycle-Trigger-Regeln (Baukasten L-1) ─────────────────────────────────
/** Bedingungen einer Regel (Option-B-Form): UND/ODER-Verknüpfung von Entitäts-Gruppen. */
export interface LifecycleRuleConditions {
  logic: "AND" | "OR";
  groups: Array<{ entity: FilterEntity; where: FilterNode }>;
}
/** Patch für upsertLifecycleRule (Mensch + KI-Chat). Siehe Chat-Aktions-Vertrag unten. */
export interface LifecycleRulePatch {
  name?: string;
  anchor_entity?: FilterEntity;
  conditions?: LifecycleRuleConditions;
  action?: { type: string; params?: Record<string, unknown> };
  priority?: number;
  is_active?: boolean;
  is_terminal?: boolean;
  trigger_event?: string;
}

/**
 * Lifecycle-Trigger-Regel anlegen/ändern — EIN Schreibweg für Mensch UND späteren KI-Chat.
 * Läuft über den security-definer-RPC `upsert_lifecycle_rule` (automation.manage-Gate,
 * Validierung der Option-B-Form, serverseitiger plan_limit-Blocker, audit via Trigger).
 *
 * CHAT-AKTIONS-VERTRAG (Chat-Aktions-Vertrag-Pflicht — Einstufung beim Bau festgelegt):
 *   required:    name · anchor_entity · conditions · action
 *   recommended: priority
 *   optional:    is_active · is_terminal · trigger_event
 * Fehlt ein `required`-Feld beim Anlegen → der RPC wirft (der Chat stellt EINE konkrete Rückfrage,
 * erfindet NIE einen Wert — Honesty). Fehlen nur recommended/optional → normal ausführen.
 *
 * `conditions` = Option-B: { logic, groups:[{ entity, where:<FilterNode> }] }; `where` ist ein Baum
 * der bestehenden Filter-Lib (Single Source). Feld-Whitelist wird hier via `validateFilter` je Gruppe
 * geprüft (gute Fehlermeldung) UND serverseitig grob im RPC + endgültig beim L-2-Auswerter (Compiler).
 *
 * @returns die Regel-ID (bei Anlegen neu, bei Update dieselbe) · null wenn kein Client.
 */
export async function upsertLifecycleRule(
  id: string | null,
  patch: LifecycleRulePatch,
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  // Client-seitige Validierung gegen die echte Filter-Lib: jede Gruppe muss eine gültige
  // FilterDefinition sein (Feld/Operator/Wert gegen filter/schema). Wirft bei Ungültigkeit.
  for (const g of patch.conditions?.groups ?? []) {
    validateFilter({ entity: g.entity, where: g.where });
  }
  const { data, error } = await client.rpc("upsert_lifecycle_rule", { p_id: id, p_patch: patch });
  if (error) throw error;
  return (data as string) ?? null;
}

/** Lifecycle-Regel löschen — RPC `delete_lifecycle_rule` (automation.manage, org-scoped, audit via Trigger). */
export async function deleteLifecycleRule(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("delete_lifecycle_rule", { p_id: id });
  if (error) throw error;
}

/** Aktive Module der Org (aus settings.modules) — Grundlage für useModules. */
export async function getModules(
  organizationId: string,
): Promise<Record<string, boolean>> {
  const settings = await getSettings(organizationId);
  return (settings?.modules as Record<string, boolean>) ?? {};
}

// ── K-1b: zentrale Daten-Functions (dünne DB-Schicht über den puren Libs) ─────
// find_duplicates (K2) und assign_lead_owner (K9) delegieren die eigentliche Logik an
// die getesteten puren Libs (dedup.ts / leadAssignment.ts). Hier NUR org-gescopter
// Datenzugriff — Single Source, callbar von Anlegen/Import/Webhook/Chat.

/**
 * find_duplicates (K2) — stärksten Duplikat-Treffer für einen Kontakt-Kandidaten finden.
 * Lädt eine bewusst breit gefasste, org-gescopte Kandidatenmenge (exakte E-Mail/LinkedIn +
 * Nachname-Vorfilter) und überlässt die Entscheidung dem puren `classifyDuplicate`.
 */
export async function findDuplicates(
  candidate: ContactCandidate,
  organizationId: string,
): Promise<DuplicateHit<ContactMatchType> | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const rows = new Map<string, ExistingContact>();
  const add = (list: unknown[] | null) => {
    for (const r of (list ?? []) as Record<string, unknown>[]) {
      const company = r.company as { name?: string } | null;
      rows.set(r.id as string, {
        id: r.id as string,
        email: (r.email as string) ?? null,
        linkedin_url: (r.linkedin_url as string) ?? null,
        first_name: (r.first_name as string) ?? null,
        last_name: (r.last_name as string) ?? null,
        company_name: company?.name ?? null,
      });
    }
  };
  const sel = "id, email, linkedin_url, first_name, last_name, company:companies!company_id(name)";
  const base = () => client.from("contacts").select(sel).eq("organization_id", organizationId).is("deleted_at", null).limit(50); // Soft-Delete: gelöschte nie als Duplikat (058)

  // Getrennte, parametrisierte Abfragen (kein .or()-String mit User-Werten → keine
  // PostgREST-Filter-Injection). Vereinigung → puren Klassifizierer entscheiden lassen.
  if (candidate.email?.trim()) add((await base().ilike("email", candidate.email.trim())).data);
  if (candidate.linkedin_url?.trim()) add((await base().ilike("linkedin_url", `%${candidate.linkedin_url.trim().replace(/^https?:\/\/(www\.)?/, "")}%`)).data);
  if (candidate.last_name?.trim()) add((await base().ilike("last_name", candidate.last_name.trim())).data);

  return classifyDuplicate(candidate, [...rows.values()]);
}

/**
 * assign_lead_owner (K9) — Owner nach der Org-Strategie (settings.lead_assignment_strategy)
 * bestimmen. round_robin-Basislogik via `resolveOwner`; keine Sales-User → null (unassigned).
 * Schreibt NICHT selbst — der Aufrufer (createContact, K-3) setzt assigned_to.
 */
export async function assignLeadOwner(organizationId: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const settings = await getSettings(organizationId);
  const strategy = ((settings?.lead_assignment_strategy as LeadAssignmentStrategy) ??
    DEFAULT_LEAD_ASSIGNMENT_STRATEGY);

  // Aktive Sales-User = owner/admin/member (Viewer kann keine Leads besitzen — Rechte-Matrix).
  // Stabile Reihenfolge für deterministisches Round-Robin.
  const { data: users } = await client
    .from("users")
    .select("id")
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin", "member"])
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  const ids = (users ?? []).map((u) => (u as { id: string }).id);

  // Zuletzt zugewiesener Owner = jüngster Kontakt mit assigned_to (Round-Robin-Fortsetzung).
  const { data: last } = await client
    .from("contacts")
    .select("assigned_to")
    .eq("organization_id", organizationId)
    .not("assigned_to", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastAssigned = (last as { assigned_to?: string } | null)?.assigned_to ?? null;

  return resolveOwner(strategy, ids, lastAssigned);
}

// ── K-3: user_preferences (USER-scoped Einstellungen, Migration 057) ──────────
// Persönlicher UI-State pro (User, Key) — z.B. 'table_views.contacts'. Getrennt von der
// Org-settings-Tabelle. RLS erzwingt eigene Zeilen; hier nur der org-/user-gescopte Zugriff.

/** Wert einer persönlichen Einstellung lesen (oder null). */
export async function getUserPreference<T = unknown>(
  userId: string,
  organizationId: string,
  key: string,
): Promise<T | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("user_preferences")
    .select("value")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("key", key)
    .maybeSingle();
  if (error) return null;
  return (data?.value as T) ?? null;
}

/** Persönliche Einstellung setzen (upsert auf (user_id, key)). */
export async function setUserPreference(
  userId: string,
  organizationId: string,
  key: string,
  value: unknown,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("user_preferences")
    .upsert({ user_id: userId, organization_id: organizationId, key, value }, { onConflict: "user_id,key" });
  if (error) throw error;
}

// ── Settings SET-2 — Allgemein · Mein Profil · Ansicht (nur Datengrundlage, kein UI) ──────────────
// Falle 2: Änderungen NUR über die zentralen RPCs (validiert + audit_log serverseitig) — nie rohes
// settings-JSONB aus Komponenten. Falle 3: Defaults an EINER Stelle (settingsDefaults.ts).

/** Allgemein (Merge-Lesen): settings.general + Org-Name + Logo, mit Defaults gefüllt. */
export async function getGeneralSettings(
  organizationId: string,
): Promise<GeneralSettings & { name: string | null; logo_url: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { ...mergeGeneral(null), name: null, logo_url: null };
  const [{ data: s }, { data: o }] = await Promise.all([
    client.from("settings").select("general").eq("organization_id", organizationId).maybeSingle(),
    client.from("organizations").select("name, branding").eq("id", organizationId).maybeSingle(),
  ]);
  const general = mergeGeneral((s?.general as Partial<GeneralSettings> | null) ?? null);
  const branding = (o?.branding as { logo_url?: string } | null) ?? null;
  return { ...general, name: (o?.name as string | null) ?? null, logo_url: branding?.logo_url ?? null };
}

/** Allgemein ändern (validiert + audit_log + settings.manage serverseitig). patch ⊆ {name,logo_url,language,timezone,date_format,currency}. */
export async function updateGeneralSettings(patch: Record<string, string>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("update_general_settings", { p_patch: patch });
  if (error) throw error;
}

/** Mein Profil lesen (eigener users-Datensatz). */
export async function getMyProfile(userId: string): Promise<(MyProfile & { role: string; email: string; created_at: string | null }) | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("users")
    .select("full_name, avatar_url, booking_provider, booking_link, signature, role, email, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as MyProfile & { role: string; email: string; created_at: string | null };
}

/** Profil-Statistik: eigene (assigned_to) Kontakte + deren distinct Companies (Zähl-Funktion, Migr. 074). */
export async function getProfileStats(): Promise<{ contacts: number; companies: number }> {
  const client = getSupabaseClient();
  if (!client) return { contacts: 0, companies: 0 };
  const { data, error } = await client.rpc("get_profile_stats");
  if (error || !data) return { contacts: 0, companies: 0 };
  const d = data as { contacts?: number; companies?: number };
  return { contacts: d.contacts ?? 0, companies: d.companies ?? 0 };
}

/** Mein Profil ändern (eigener Datensatz, validiert + audit_log serverseitig). patch ⊆ {full_name,avatar_url,booking_provider,booking_link,signature}. */
export async function updateMyProfile(patch: Record<string, string>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("update_my_profile", { p_patch: patch });
  if (error) throw error;
}

// ── „Mein Unternehmen" Slice 1: Produkte & Preise (Migr. 077) ─────────────────────────────────
// Schreiben läuft AUSSCHLIESSLICH über die RPCs — sie prüfen Recht (settings.manage), Org und
// Keys und schreiben audit_log. Kein direktes .update() auf products/org_profile von hier.

/** Ein Produkt im „Mein Unternehmen"-Sinn (AI-Kontext). Texte sind mehrsprach-fähig (I18nText). */
export interface ProductRow {
  id: string;
  name: string;
  description: I18nText;
  benefit: I18nText;
  audience: I18nText;
  price: string | null;
  price_model: string | null;
  /** Preis-Freigabe PRO Produkt — false = KI darf den Preis nie in Nachrichten nennen. */
  ai_may_reference_price: boolean;
}

/** Vollständiges Firmen-Profil (Settings → Mein Unternehmen → Unternehmensprofil, Slice 3a). */
export interface OrgProfile {
  summary: I18nText;
  product_service_model: I18nText;
  value_outcome: I18nText;
  usps: { id: string; text: I18nText }[];
  problems_solved: { id: string; text: I18nText }[];
  business_outcomes: { id: string; text: I18nText }[];
  offerings: { id: string; title: I18nText; text: I18nText }[];
  competitors: { id: string; name: string; why_us: I18nText; kind: "direct" | "adjacent" }[];
}
const EMPTY_ORG_PROFILE: OrgProfile = {
  summary: "", product_service_model: "", value_outcome: "",
  usps: [], problems_solved: [], business_outcomes: [], offerings: [], competitors: [],
};

/** Produkte der Org für die Settings-Seite (aktive, volle Felder — nicht das Deal-Dropdown). */
export async function getProductsFull(organizationId: string): Promise<ProductRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("products")
    .select("id, name, description, benefit, audience, price, price_model, ai_may_reference_price")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ProductRow[];
}

/** Volles Firmen-Profil (Überblick + Angebote). Leere Zeile → normalisierte Leer-Struktur (kein null). */
export async function getOrgProfile(organizationId: string): Promise<OrgProfile> {
  const client = getSupabaseClient();
  if (!client) return { ...EMPTY_ORG_PROFILE };
  const { data, error } = await client
    .from("org_profile")
    .select("summary, product_service_model, value_outcome, usps, problems_solved, business_outcomes, offerings, competitors")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...EMPTY_ORG_PROFILE };
  const row = data as Partial<OrgProfile>;
  return {
    summary: (row.summary as I18nText) ?? "",
    product_service_model: (row.product_service_model as I18nText) ?? "",
    value_outcome: (row.value_outcome as I18nText) ?? "",
    usps: (row.usps as OrgProfile["usps"] | null) ?? [],
    problems_solved: (row.problems_solved as OrgProfile["problems_solved"] | null) ?? [],
    business_outcomes: (row.business_outcomes as OrgProfile["business_outcomes"] | null) ?? [],
    offerings: (row.offerings as OrgProfile["offerings"] | null) ?? [],
    competitors: (row.competitors as OrgProfile["competitors"] | null) ?? [],
  };
}

/** Neues (leeres) Produkt anlegen — alle Inhalte optional. Gibt die neue id zurück. */
export async function createProduct(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc("create_product");
  if (error) throw error;
  return (data as string) ?? null;
}

/** Produkt-Feld(er) ändern. patch ⊆ {name,description,benefit,audience,price,price_model,ai_may_reference_price}. */
export async function updateProduct(id: string, patch: Record<string, unknown>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("update_product", { p_id: id, p_patch: patch });
  if (error) throw error;
}

/** Produkt entfernen — weich (is_active=false), damit alte Deals ihren Bezug behalten. */
export async function deleteProduct(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("delete_product", { p_id: id });
  if (error) throw error;
}

/**
 * org_profile-Felder ändern (EIN Schreibweg). patch ⊆ Whitelist der RPC:
 * Skalare {summary, product_service_model, value_outcome} +
 * Listen {usps, competitors, problems_solved, business_outcomes, offerings} —
 * Listen jeweils als VOLLE Liste (kein Merge). Serverseitig: settings.manage + field_meta-lock + audit_log.
 */
export async function updateOrgProfile(patch: Record<string, unknown>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("update_org_profile", { p_patch: patch });
  if (error) throw error;
}

// ── Zielgruppen & Personen (Mein Unternehmen 3b, Migr. 081/082) ──────────────
// Eigenständige, verschachtelte Datensätze (1:N) nach dem products-Muster: eigene Tabellen +
// create/update/delete-RPCs (settings.manage · Cross-Org-Guard · field_meta-lock · audit_log,
// weiches Löschen via is_active). Text-Listen [{id,text}] (KnowledgeListField-kompatibel).
// fit_level/buying_role sind feste System-Enums (CHECK in 081) — leer erlaubt (null).
// Der verschachtelte Lese-Query (getIcpsWithPersonas) folgt mit der UI (Slice 3b-3).
type ListText = { id: string; text: I18nText };

/** Zielgruppe (org_icps). fit_level = feste System-Kategorie (81) oder null (noch nicht bewertet). */
export interface IcpRow {
  id: string;
  name: string;
  description: string;              // Kurzbeschreibung (Subtext unter dem Namen, 086) — leer = ""
  fit_level: "high" | "medium" | "low" | null;
  company_profile: ListText[];
  fit_rationale: ListText[];
  desired_outcomes: ListText[];
  problems_solved: ListText[];
}

/** Person je Zielgruppe (org_personas). job_titles speist match_persona (AI SDR). */
export interface PersonaRow {
  id: string;
  icp_id: string;
  name: string;
  archetype: string;               // Archetyp (kurzes Label unter dem Namen, 086) — leer = ""
  buying_role: "decision_maker" | "influencer" | "champion" | "end_user" | "blocker" | null;
  job_titles: ListText[];
  responsibilities: ListText[];
  goals: ListText[];
  priorities: ListText[];
  core_problems: ListText[];
  objections: ListText[];
  exact_wording: ListText[];
  inferred_wording: ListText[];
}

/** Neue (leere) Zielgruppe anlegen — alle Inhalte optional. Gibt die neue id zurück. */
export async function createIcp(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc("create_icp");
  if (error) throw error;
  return (data as string) ?? null;
}

/** ICP-Feld(er) ändern (EIN Schreibweg). patch ⊆ {name,description,fit_level,company_profile,fit_rationale,desired_outcomes,problems_solved,is_active} — Listen als VOLLE Liste. */
export async function updateIcp(id: string, patch: Record<string, unknown>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("update_icp", { p_id: id, p_patch: patch });
  if (error) throw error;
}

/** Zielgruppe entfernen — weich (is_active=false). */
export async function deleteIcp(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("delete_icp", { p_id: id });
  if (error) throw error;
}

/** Neue (leere) Person unter einer Zielgruppe anlegen. Gibt die neue id zurück. */
export async function createPersona(icpId: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc("create_persona", { p_icp_id: icpId });
  if (error) throw error;
  return (data as string) ?? null;
}

/** Persona-Feld(er) ändern (EIN Schreibweg). patch ⊆ {name,archetype,buying_role,job_titles,…,is_active} — Listen als VOLLE Liste; icp_id ist nicht änderbar. */
export async function updatePersona(id: string, patch: Record<string, unknown>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("update_persona", { p_id: id, p_patch: patch });
  if (error) throw error;
}

/** Person entfernen — weich (is_active=false). */
export async function deletePersona(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("delete_persona", { p_id: id });
  if (error) throw error;
}

/** Eine Zielgruppe samt ihrer aktiven Personen (verschachtelt, für die 3b-3-UI). */
export interface IcpWithPersonas extends IcpRow {
  personas: PersonaRow[];
}

/**
 * Alle aktiven Zielgruppen der Org MIT eingebetteten aktiven Personen — EIN Query (kein N+1).
 * Supabase-Embed über die FK org_personas.icp_id. is_active wird eingebettet mitgelesen und in JS
 * gefiltert (robust über supabase-js-Versionen); Sortierung nach created_at (stabile Reihenfolge).
 */
export async function getIcpsWithPersonas(organizationId: string): Promise<IcpWithPersonas[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("org_icps")
    .select(
      "id, name, description, fit_level, company_profile, fit_rationale, desired_outcomes, problems_solved, created_at, " +
        "org_personas ( id, icp_id, name, archetype, buying_role, job_titles, responsibilities, goals, priorities, " +
        "core_problems, objections, exact_wording, inferred_wording, is_active, created_at )",
    )
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;

  // description/archetype sind nullable text in der DB → im UI-Typ als "" (KnowledgeField erwartet string).
  type RawPersona = Omit<PersonaRow, "archetype"> & { archetype: string | null; is_active: boolean; created_at: string };
  type RawIcp = Omit<IcpRow, "description"> & { description: string | null; created_at: string; org_personas: RawPersona[] | null };
  return ((data ?? []) as unknown as RawIcp[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    fit_level: row.fit_level,
    company_profile: row.company_profile ?? [],
    fit_rationale: row.fit_rationale ?? [],
    desired_outcomes: row.desired_outcomes ?? [],
    problems_solved: row.problems_solved ?? [],
    personas: (row.org_personas ?? [])
      .filter((p) => p.is_active)
      .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))
      .map((p) => ({
        id: p.id,
        icp_id: p.icp_id,
        name: p.name,
        archetype: p.archetype ?? "",
        buying_role: p.buying_role,
        job_titles: p.job_titles ?? [],
        responsibilities: p.responsibilities ?? [],
        goals: p.goals ?? [],
        priorities: p.priorities ?? [],
        core_problems: p.core_problems ?? [],
        objections: p.objections ?? [],
        exact_wording: p.exact_wording ?? [],
        inferred_wording: p.inferred_wording ?? [],
      })),
  }));
}

// ── Personal Voice (Mein Unternehmen 2/3, Migr. 078/079) ─────────────────────
// Die eigene Schreibstimme des Users (pro User, visibility:'self'). Texte sind mehrsprach-fähig
// (I18nText — heute reiner String). Getrennt von contacts.personality_profile (Empfänger).

/**
 * Listen-Eintrag der Voice-Listenfelder (Kernthemen, Tonfall, Wortwahl, Hook-Strategien).
 * Stabile `id` (vom RPC 084 erzwungen) + `text` (mehrsprach-fähig). Format wie die org_profile-Listen.
 */
export interface VoiceListItem {
  id: string;
  text?: I18nText;
}
/**
 * Kanal „Overview" — Referenz-Design (084): Kurzprofil · Grundton · Kernthemen (Liste) · Verkaufsansatz.
 * (Der alte Sammel-Key `themes` wurde in Migr. 085 entfernt, nachdem `core_topics` befüllt war.)
 */
export interface VoiceOverview {
  bio?: I18nText;                 // Kurzprofil (Summary)
  tone?: I18nText;                // Grundton (General tone)
  core_topics?: VoiceListItem[];  // Kernthemen (Core topics) — Liste
  style?: I18nText;               // Verkaufsansatz (Sales Approach) — EIN Textfeld (Oliver-Entscheidung)
}
/**
 * Do's & Don'ts EINES Kanals — zwei benannte Teile DESSELBEN Feldes `dos_donts` (kein neues
 * DB-Feld, keine Migration). Jeder Teil ist mehrsprach-fähig (I18nText).
 */
export interface VoiceDosDonts {
  always?: I18nText; // „Das machst du immer"
  never?: I18nText;  // „Das machst du nie"
}
/**
 * Schreib-Kanal (Post/Comment/DM/Email) — an das Referenz-Design (084) angeglichen. Gemeinsame
 * Felder (Tonfall/Satzbau/Wortwahl/Emoji) plus KANAL-SPEZIFISCHES:
 *   post → hook_strategies · comment → engagement_patterns · dm/email → cta_style.
 * (Die alten Sammel-Keys `sentence_style`/`hooks` wurden in Migr. 085 entfernt.)
 */
export interface VoiceChannel {
  // gemeinsame Felder aller Kanäle
  tone_attributes?: VoiceListItem[];  // Tonfall — Liste
  sentence_structure?: I18nText;      // Satzbau — Text
  vocabulary?: VoiceListItem[];       // Wortwahl — Liste
  emoji_formatting?: I18nText;        // Emoji & Formatierung — Text
  dos_donts?: VoiceDosDonts;          // Do's & Don'ts (bewusster Zusatz je Kanal)
  samples?: I18nText;                 // Beispiele — Text
  // kanal-spezifisch (je nach Kanal genau eines gerendert)
  hook_strategies?: VoiceListItem[];  // nur post — Liste
  engagement_patterns?: I18nText;     // nur comment — Text
  cta_style?: I18nText;               // nur dm + email — Text
}
export type VoiceChannelKey = "post" | "comment" | "dm" | "email";

/** Voice-Profil des Users. Leere Zeile → alle Kanäle leer, primary_channel = 'email' (Default). */
export interface VoiceProfile {
  overview: VoiceOverview;
  post: VoiceChannel;
  comment: VoiceChannel;
  dm: VoiceChannel;
  email: VoiceChannel;
  primary_channel: VoiceChannelKey;
}

const EMPTY_VOICE_PROFILE: VoiceProfile = {
  overview: {},
  post: {},
  comment: {},
  dm: {},
  email: {},
  primary_channel: "email",
};

/**
 * getMyVoiceProfile — die EIGENE Voice-Zeile (RLS scopet ohnehin auf user_id=auth.uid()).
 * Existiert noch keine Zeile → normalisierte Leer-Struktur (kein null, kein Fake). org+user
 * werden zusätzlich explizit gefiltert (defensiv, wie getOrgProfileLite auf organization_id).
 */
export async function getMyVoiceProfile(
  organizationId: string,
  userId: string,
): Promise<VoiceProfile> {
  const client = getSupabaseClient();
  if (!client) return { ...EMPTY_VOICE_PROFILE };
  const { data, error } = await client
    .from("voice_profiles")
    .select("overview, post, comment, dm, email, primary_channel")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...EMPTY_VOICE_PROFILE };
  const row = data as Partial<VoiceProfile>;
  return {
    overview: (row.overview as VoiceOverview | null) ?? {},
    post: (row.post as VoiceChannel | null) ?? {},
    comment: (row.comment as VoiceChannel | null) ?? {},
    dm: (row.dm as VoiceChannel | null) ?? {},
    email: (row.email as VoiceChannel | null) ?? {},
    primary_channel: (row.primary_channel as VoiceChannelKey | null) ?? "email",
  };
}

/**
 * updateVoiceProfile — EINZIGER Schreibweg (Self-Service, kein settings.manage). Der Server
 * merged Kanäle SHALLOW (nur gelieferte Sub-Felder) und sperrt field_meta pro Feld → save-on-blur
 * je Feld ist rennsicher. patch ⊆ {overview, post, comment, dm, email, primary_channel}, wobei
 * jeder Kanal ⊆ seinen erlaubten Sub-Feldern ist.
 */
export async function updateVoiceProfile(patch: Record<string, unknown>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.rpc("update_voice_profile", { p_patch: patch });
  if (error) throw error;
}

/** Ansicht (Nav-Sichtbarkeit+Reihenfolge) lesen — Merge/Reparatur, `settings` nie versteckt. */
export async function getNavPreferences(userId: string, organizationId: string): Promise<NavPreferences> {
  const raw = await getUserPreference<Partial<NavPreferences>>(userId, organizationId, NAV_PREF_KEY);
  return mergeNav(raw);
}

/** Ansicht setzen — vor dem Speichern normalisiert (settings nie versteckt, kein Eintrag verloren). Persönlicher UI-State (kein audit). */
export async function setNavPreferences(userId: string, organizationId: string, prefs: Partial<NavPreferences>): Promise<void> {
  await setUserPreference(userId, organizationId, NAV_PREF_KEY, mergeNav(prefs));
}

// ── K-3 CP4: Kontakt anlegen (voller Pfad — Validierung/Dedup passieren im UI) ────
/** Firma per Name finden (case-insensitiv) oder anlegen → company_id. Leer → null. */
export async function findOrCreateCompany(organizationId: string, name: string): Promise<string | null> {
  const client = getSupabaseClient();
  const n = name.trim();
  if (!client || !n) return null;
  const { data: existing } = await client
    .from("companies").select("id").eq("organization_id", organizationId).is("deleted_at", null).ilike("name", n).limit(1).maybeSingle(); // gelöschte Company nicht wiederbeleben (058)
  if (existing) return (existing as { id: string }).id;
  const { data, error } = await client
    .from("companies").insert({ organization_id: organizationId, name: n }).select("id").single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export interface NewContactInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  linkedin_url?: string;
  salutation?: string;
  job_title?: string;
  seniority?: string;
  department?: string;
  company_id?: string | null;
  city?: string;
  country?: string;
  tags?: string[];
  notes?: string;
  /** Telefonnummern (contact_phones) — Zusatzfeld, NICHT Teil der K1-Pflichtlogik. */
  phones?: Array<{ number: string; label?: string; isPrimary?: boolean }>;
}

/** Herkunfts-Optionen: manuelles Anlegen (Default) vs. Import (lead_source='csv' + Batch-ID). */
export interface CreateContactOpts {
  leadSource?: string;
  importBatchId?: string | null;
}

/**
 * Kontakt anlegen — EINE zentrale Anlege-Function (K1/K7, keine Kopien). Default:
 * lead_source='manual', contact_status='ohne_campaign', Owner via assign_lead_owner (K9),
 * created_by = eingeloggter User. Audit via DB-Trigger. Validierung (K1) + Duplikat-Check (K2)
 * macht der Aufrufer VORHER (Anlege-Panel bzw. Import-Schicht 3). Der Import ruft dieselbe
 * Function mit `{ leadSource:'csv', importBatchId }` — kein zweiter Insert-Pfad.
 */
export async function createContact(
  organizationId: string,
  input: NewContactInput,
  createdBy: string | null,
  opts?: CreateContactOpts,
): Promise<{ id: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const assigned_to = await assignLeadOwner(organizationId);
  // Telefonnummern liegen NICHT auf contacts, sondern in contact_phones → vor dem Insert trennen.
  const { phones, ...contactFields } = input;
  const clean = Object.fromEntries(Object.entries(contactFields).filter(([, v]) => v != null && v !== ""));
  const record: Record<string, unknown> = { organization_id: organizationId, ...clean, lead_source: opts?.leadSource ?? "manual", contact_status: "ohne_campaign", assigned_to, created_by: createdBy };
  // import_batch_id NUR beim Import setzen — der manuelle Anlege-Pfad referenziert die Spalte NICHT
  // und bleibt so unabhängig von Migration 059 (die noch nicht gepusht ist).
  if (opts?.importBatchId) record.import_batch_id = opts.importBatchId;
  const { data, error } = await client
    .from("contacts")
    .insert(record)
    .select("id")
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  // Telefonnummern nachziehen (nur echte, nicht-leere Nummern) — Primär-Flag bleibt erhalten.
  for (const p of phones ?? []) {
    if (p.number.trim()) await createContactPhone(organizationId, id, { number: p.number.trim(), label: p.label, isPrimary: p.isPrimary });
  }
  return { id };
}

// ── Import-Ausführung (K-5 Schicht 4) ─────────────────────────────────────────
// Übersetzt einen puren Schreib-Plan (lib/import/execute.buildImportPlan) in echte DB-Writes:
// Batch-Kopf → Kontakte anlegen (dieselbe createContact-Function, lead_source='csv' + Batch-ID)
// → Company-Domain-Match → echte Zähler (K8). Undo soft-löscht nur die im Batch NEU erstellten
// Zeilen (K4). Duplikat-Check (K2) + Validierung (K1) laufen VORHER in Schicht 3 (validate.ts).

/**
 * Vergleichs-Universum für den Duplikat-Check einer ganzen Datei (Schicht 3, K2) in EINER
 * Query laden — nicht pro Zeile (kein N+1). Org-gescopt, gelöschte ausgeschlossen (058).
 */
export async function loadDedupUniverse(organizationId: string): Promise<ExistingContact[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("contacts")
    .select("id, email, linkedin_url, first_name, last_name, company:companies!company_id(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => {
    const company = r.company as { name?: string } | null;
    return {
      id: r.id as string,
      email: (r.email as string) ?? null,
      linkedin_url: (r.linkedin_url as string) ?? null,
      first_name: (r.first_name as string) ?? null,
      last_name: (r.last_name as string) ?? null,
      company_name: company?.name ?? null,
    };
  });
}

/**
 * Company für eine Import-Zeile auflösen (Bauplan Schicht 4): (1) Domain-Match aus der E-Mail →
 * bestehende Company verknüpfen · (2) sonst Name-Match · (3) sonst neu anlegen (NUR wenn ein
 * Firmenname in der Datei steht) — die neue Company trägt die Batch-ID (Undo). Kein Name +
 * kein Domain-Treffer → kein Company-Bezug (null).
 */
async function resolveCompanyForImport(
  organizationId: string,
  name: string | undefined,
  email: string | undefined,
  importBatchId: string,
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const n = (name ?? "").trim();
  const domain = extractEmailDomain(email);
  // 1) Domain-Match — bestehende Company über die E-Mail-Domain (nur Companies mit gepflegter Domain).
  if (domain) {
    const { data } = await client
      .from("companies").select("id").eq("organization_id", organizationId).is("deleted_at", null)
      .ilike("domain", domain).limit(1).maybeSingle();
    if (data) return (data as { id: string }).id;
  }
  if (!n) return null;
  // 2) Name-Match — bestehende Company über den Namen.
  const { data: byName } = await client
    .from("companies").select("id").eq("organization_id", organizationId).is("deleted_at", null)
    .ilike("name", n).limit(1).maybeSingle();
  if (byName) return (byName as { id: string }).id;
  // 3) Neu anlegen (Name aus der Datei) — Batch-ID für Undo; Domain bewusst NICHT gesetzt
  //    (companies.domain hat eine Unique-Constraint → kein Import-Crash durch Kollision).
  const { data: created, error } = await client
    .from("companies").insert({ organization_id: organizationId, name: n, import_batch_id: importBatchId })
    .select("id").single();
  if (error) throw error;
  return (created as { id: string }).id;
}

/** Ergebnis eines Import-Laufs (echte Zahlen, K8). */
export interface ImportExecutionResult {
  batchId: string;
  created: number;
  /** Duplikate + Fehler + bewusst abgewählte Zeilen (alles, was nicht angelegt wurde). */
  skipped: number;
  /** Insert-Fehler ZUR LAUFZEIT (kaputte Einzelzeile stoppt den Import nicht). */
  failed: number;
}

/**
 * Import ausführen (Schicht 4). Legt einen `import_batches`-Kopf an (undo_until = +7 Tage, K4),
 * schreibt jede Plan-Zeile über die zentrale `createContact`-Function (lead_source='csv',
 * import_batch_id) inkl. Company-Domain-Match, und trägt die echten Zähler nach. Der Aufrufer
 * (Import-UI/Edge) reicht den Plan aus `buildImportPlan` + den validierten Zeilen herein.
 * `onProgress` wird nach JEDER Zeile aufgerufen (done/total) → echter Fortschritt in der UI,
 * kein Fake-Balken.
 */
export async function runImport(
  organizationId: string,
  createdBy: string | null,
  plan: ImportPlan,
  meta: { filename?: string } = {},
  onProgress?: (done: number, total: number) => void,
): Promise<ImportExecutionResult | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const undoUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: batch, error: batchErr } = await client
    .from("import_batches")
    .insert({ organization_id: organizationId, created_by: createdBy, source: "csv_upload", filename: meta.filename ?? null, status: "completed", undo_until: undoUntil })
    .select("id").single();
  if (batchErr) throw batchErr;
  const batchId = (batch as { id: string }).id;

  const total = plan.toCreate.length;
  let created = 0;
  let failed = 0;
  let done = 0;
  for (const record of plan.toCreate) {
    try {
      const company_id = await resolveCompanyForImport(organizationId, record.company_name, record.email, batchId);
      const input: NewContactInput = {
        first_name: record.first_name,
        last_name: record.last_name,
        email: record.email,
        linkedin_url: record.linkedin_url,
        job_title: record.job_title,
        seniority: record.seniority,
        city: record.city,
        country: record.country,
        notes: record.notes,
        company_id,
        tags: record.tags ? record.tags.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        phones: record.phone ? [{ number: record.phone, isPrimary: true }] : undefined,
      };
      const res = await createContact(organizationId, input, createdBy, { leadSource: "csv_upload", importBatchId: batchId });
      if (res) created++;
      else failed++;
    } catch {
      failed++; // K8: kaputte Zeile ehrlich zählen, Import läuft weiter
    }
    done++;
    onProgress?.(done, total);
  }

  const skipped = plan.total - plan.createCount; // Duplikate + Fehler + abgewählte
  await client.from("import_batches")
    .update({ rows_created: created, rows_skipped: skipped, rows_failed: failed, updated_at: new Date().toISOString() })
    .eq("id", batchId);

  return { batchId, created, skipped, failed };
}

/**
 * Import rückgängig (K4, bis 7 Tage). Soft-löscht NUR die in diesem Batch neu erstellten
 * Kontakte + Companies (verknüpfte/aktualisierte bleiben — Merge ist nicht trennbar). Außerhalb
 * der Undo-Frist: wirft; bereits rückgängig: no-op. audit_log entsteht über den 058-Trigger.
 */
export async function undoImport(
  batchId: string,
  undoneBy: string | null,
): Promise<{ removedContacts: number } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data: batch } = await client
    .from("import_batches").select("id, status, undo_until").eq("id", batchId).maybeSingle();
  if (!batch) return null;
  const b = batch as { status: string | null; undo_until: string | null };
  if (b.status === "undone") return { removedContacts: 0 };
  if (b.undo_until && new Date(b.undo_until).getTime() < Date.now()) throw new Error("undo_window_expired");

  const nowIso = new Date().toISOString();
  const { data: removed } = await client
    .from("contacts").update({ deleted_at: nowIso, deleted_by: undoneBy })
    .eq("import_batch_id", batchId).is("deleted_at", null).select("id");
  await client
    .from("companies").update({ deleted_at: nowIso, deleted_by: undoneBy })
    .eq("import_batch_id", batchId).is("deleted_at", null);
  await client
    .from("import_batches").update({ status: "undone", undone_at: nowIso, updated_at: nowIso }).eq("id", batchId);
  return { removedContacts: ((removed ?? []) as unknown[]).length };
}

// ── Duplikate verwalten + Merge (K-6a) ────────────────────────────────────────
// Paar-Findung (sichere Treffer: E-Mail/LinkedIn bzw. Domain exakt) + Merge mit vollständiger
// FK-Kaskade auf den Gewinner + Soft-Delete des Verlierers. Match-/Feld-Logik ist rein (lib/merge,
// lib/dedup) — hier nur DB-Zugriff. audit_log via Trigger (058: Soft-Delete = delete_<table>).

export interface DuplicatePairView { a: ContactRow; b: ContactRow; level: DuplicatePair["level"]; matchType: string }

/** Sichere Kontakt-Duplikat-Paare der Org (E-Mail/LinkedIn exakt). Name-Fuzzy = Folge-Punkt (K-6). */
export async function getDuplicatePairs(organizationId: string): Promise<DuplicatePairView[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("contacts")
    .select("*, company:companies!company_id(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  if (error) throw error;
  const rows = (data ?? []) as unknown as ContactRow[];
  const byId = new Map(rows.map((r) => [(r as { id: string }).id, r]));
  const existing = rows.map((r) => {
    const c = r as Record<string, unknown>;
    const company = c.company as { name?: string } | null;
    return { id: c.id as string, email: (c.email as string) ?? null, linkedin_url: (c.linkedin_url as string) ?? null, first_name: (c.first_name as string) ?? null, last_name: (c.last_name as string) ?? null, company_name: company?.name ?? null };
  });
  return findDuplicatePairs(existing)
    .map((p) => ({ a: byId.get(p.aId)!, b: byId.get(p.bId)!, level: p.level, matchType: p.matchType }))
    .filter((p) => p.a && p.b);
}

/** Sichere Company-Duplikat-Paare der Org (Domain exakt). */
export interface CompanyDuplicatePairView { a: CompanyRow; b: CompanyRow; level: DuplicatePair["level"]; matchType: string }

export async function getCompanyDuplicatePairs(organizationId: string): Promise<CompanyDuplicatePairView[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("companies").select("*").eq("organization_id", organizationId).is("deleted_at", null);
  if (error) throw error;
  const rows = (data ?? []) as unknown as CompanyRow[];
  const byId = new Map(rows.map((r) => [(r as { id: string }).id, r]));
  return findCompanyDuplicatePairs(rows.map((r) => { const c = r as Record<string, unknown>; return { id: c.id as string, name: (c.name as string) ?? null, domain: (c.domain as string) ?? null }; }))
    .map((p) => ({ a: byId.get(p.aId)!, b: byId.get(p.bId)!, level: p.level, matchType: p.matchType }))
    .filter((p) => p.a && p.b);
}

/**
 * Zwei Kontakte zusammenführen (K-6a). Gewinner erbt aufgelöste Feldwerte (Auto-Default „Bestand
 * gewinnt, Lücken füllen" + Pro-Feld-Override); ALLE FK-Verweise des Verlierers wandern zum Gewinner
 * (list_members konfliktbereinigt, contact_phones entprimärt); Verlierer → Soft-Delete. audit via Trigger.
 */
export async function mergeContacts(
  organizationId: string, winnerId: string, loserId: string,
  overrides: Record<string, unknown>, mergedBy: string | null,
): Promise<{ winnerId: string } | null> {
  const client = getSupabaseClient();
  if (!client || winnerId === loserId) return null;
  // SET-1: Vorab-Gate — Merge (mehrstufige Orchestrierung) erfordert serverseitig records.merge.
  const { error: permErr } = await client.rpc("assert_permission", { p_permission: "records.merge" });
  if (permErr) throw permErr;
  const { data: recs, error: loadErr } = await client
    .from("contacts").select("*").eq("organization_id", organizationId).in("id", [winnerId, loserId]).is("deleted_at", null);
  if (loadErr) throw loadErr;
  const winner = (recs ?? []).find((r) => (r as { id: string }).id === winnerId) as Record<string, unknown> | undefined;
  const loser = (recs ?? []).find((r) => (r as { id: string }).id === loserId) as Record<string, unknown> | undefined;
  if (!winner || !loser) return null;

  // 1) Feldwerte auflösen + auf den Gewinner schreiben (nur der minimale Patch).
  const patch = resolveMergeFields(winner, loser, MERGEABLE_CONTACT_FIELDS, overrides);
  if (Object.keys(patch).length) await client.from("contacts").update(patch).eq("id", winnerId);

  // 2) Einfache FK-Tabellen: contact_id des Verlierers → Gewinner.
  for (const table of CONTACT_FK_SIMPLE) {
    await client.from(table).update({ contact_id: winnerId }).eq("contact_id", loserId);
  }
  // 3) list_members: UNIQUE(list_id,contact_id) → Konflikte (Gewinner schon in Liste) erst entfernen.
  const { data: winnerLists } = await client.from("list_members").select("list_id").eq("contact_id", winnerId);
  const winnerListIds = (winnerLists ?? []).map((r) => (r as { list_id: string }).list_id);
  if (winnerListIds.length) await client.from("list_members").delete().eq("contact_id", loserId).in("list_id", winnerListIds);
  await client.from("list_members").update({ contact_id: winnerId }).eq("contact_id", loserId);
  // 4) contact_phones: Nummern des Verlierers übernehmen, aber entprimären (Gewinner-Primär bleibt).
  await client.from("contact_phones").update({ contact_id: winnerId, is_primary: false }).eq("contact_id", loserId);

  // 5) Verlierer soft-löschen (audit_log delete_contacts via 058-Trigger).
  await client.from("contacts").update({ deleted_at: new Date().toISOString(), deleted_by: mergedBy }).eq("id", loserId);
  return { winnerId };
}

/** Zwei Companies zusammenführen (K-6a). Analog: Feld-Merge + company_id/primary_company_id-Kaskade + Soft-Delete. */
export async function mergeCompanies(
  organizationId: string, winnerId: string, loserId: string,
  overrides: Record<string, unknown>, mergedBy: string | null,
): Promise<{ winnerId: string } | null> {
  const client = getSupabaseClient();
  if (!client || winnerId === loserId) return null;
  // SET-1: Vorab-Gate — Merge erfordert serverseitig records.merge.
  const { error: permErr } = await client.rpc("assert_permission", { p_permission: "records.merge" });
  if (permErr) throw permErr;
  const { data: recs, error: loadErr } = await client
    .from("companies").select("*").eq("organization_id", organizationId).in("id", [winnerId, loserId]).is("deleted_at", null);
  if (loadErr) throw loadErr;
  const winner = (recs ?? []).find((r) => (r as { id: string }).id === winnerId) as Record<string, unknown> | undefined;
  const loser = (recs ?? []).find((r) => (r as { id: string }).id === loserId) as Record<string, unknown> | undefined;
  if (!winner || !loser) return null;

  const patch = resolveMergeFields(winner, loser, MERGEABLE_COMPANY_FIELDS, overrides);
  if (Object.keys(patch).length) await client.from("companies").update(patch).eq("id", winnerId);

  for (const { table, column } of COMPANY_FK) {
    await client.from(table).update({ [column]: winnerId }).eq(column, loserId);
  }
  await client.from("companies").update({ deleted_at: new Date().toISOString(), deleted_by: mergedBy }).eq("id", loserId);
  return { winnerId };
}

// ── Listen (K-3b) ────────────────────────────────────────────────────────────
// Statisch = manuelle Mitglieder (list_members). Dynamisch = filter_config (K-2 FilterDefinition),
// LIVE ausgewertet über compileToPostgrest (kein Cron, kein materialisiertes list_members). Quelle
// bleibt filter_config → spätere AI-SDR-Materialisierung ohne Umbau (Bauplan K6). Org-gescoped, RLS.

export type ListType = "static" | "dynamic";

export interface ListView {
  id: string;
  name: string;
  type: ListType;
  filterConfig: FilterDefinition | null;
  isTeamList: boolean;
  memberCount: number;
}

export async function getLists(organizationId: string): Promise<ListView[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("lists")
    .select("id, name, type, filter_config, is_team_list")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Array<{ id: string; name: string; type: string | null; filter_config: unknown; is_team_list: boolean | null }>;

  // Statische Counts: alle list_members der Org EINMAL holen und tallyen (kein N+1).
  const countByList = new Map<string, number>();
  const staticIds = rows.filter((r) => (r.type ?? "static") !== "dynamic").map((r) => r.id);
  if (staticIds.length) {
    const { data: mem, error: e2 } = await client
      .from("list_members").select("list_id").eq("organization_id", organizationId).in("list_id", staticIds);
    if (e2) throw e2;
    for (const m of (mem ?? []) as Array<{ list_id: string }>) countByList.set(m.list_id, (countByList.get(m.list_id) ?? 0) + 1);
  }

  // Dynamische Counts: je Liste eine head-Count-Query über den kompilierten Filter (Listen sind wenige).
  const dynamic = rows.filter((r) => r.type === "dynamic");
  await Promise.all(dynamic.map(async (r) => {
    const def = r.filter_config as FilterDefinition | null;
    if (!def) { countByList.set(r.id, 0); return; }
    let expr: string;
    try { expr = compileToPostgrest(def); } catch { countByList.set(r.id, 0); return; }
    const { count } = await client
      .from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null).or(expr); // dynamische Liste zählt keine gelöschten (058)
    countByList.set(r.id, count ?? 0);
  }));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type === "dynamic" ? "dynamic" : "static",
    filterConfig: (r.filter_config as FilterDefinition | null) ?? null,
    isTeamList: !!r.is_team_list,
    memberCount: countByList.get(r.id) ?? 0,
  }));
}

export async function createList(
  organizationId: string,
  input: { name: string; type: ListType; filterConfig?: FilterDefinition | null; isTeamList?: boolean },
  createdBy: string | null,
): Promise<{ id: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("lists")
    .insert({
      organization_id: organizationId,
      name: input.name,
      type: input.type,
      filter_config: (input.type === "dynamic" ? input.filterConfig ?? null : null) as never,
      is_team_list: input.isTeamList ?? false,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

/** Nur für STATISCHE Listen — dynamische verwalten ihre Mitglieder über die Regel. */
export async function addToList(organizationId: string, listId: string, contactIds: string[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !contactIds.length) return;
  const rows = contactIds.map((cid) => ({ organization_id: organizationId, list_id: listId, contact_id: cid }));
  const { error } = await client.from("list_members").upsert(rows, { onConflict: "list_id,contact_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function deleteList(organizationId: string, listId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("lists").delete().eq("organization_id", organizationId).eq("id", listId);
  if (error) throw error;
}

export async function renameList(organizationId: string, listId: string, name: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("lists").update({ name }).eq("organization_id", organizationId).eq("id", listId);
  if (error) throw error;
}

/** Mitgliedschaft aufheben (nur STATISCHE Listen) — löscht NUR die list_members-Zeile, nie den Kontakt. */
export async function removeFromList(organizationId: string, listId: string, contactIds: string[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !contactIds.length) return;
  const { error } = await client
    .from("list_members").delete()
    .eq("organization_id", organizationId).eq("list_id", listId).in("contact_id", contactIds);
  if (error) throw error;
}

/** Mitglieder einer Liste als volle ContactRows. Statisch: list_members-Join · dynamisch: Live-Filter. */
export async function getListMembers(
  organizationId: string,
  list: { id: string; type: ListType; filterConfig: FilterDefinition | null },
): Promise<ContactRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  if (list.type === "dynamic") {
    if (!list.filterConfig) return [];
    let expr: string;
    try { expr = compileToPostgrest(list.filterConfig); } catch { return []; }
    const { data, error } = await client
      .from("contacts").select(`*, ${CONTACT_COMPANY_EMBED}`).eq("organization_id", organizationId).is("deleted_at", null).or(expr).limit(1000); // dynamische Liste ohne gelöschte (058)
    if (error) throw error;
    return (data ?? []) as unknown as ContactRow[];
  }
  const { data, error } = await client
    .from("list_members")
    .select(`contact:contacts!contact_id(*, ${CONTACT_COMPANY_EMBED})`)
    .eq("organization_id", organizationId).eq("list_id", list.id).limit(1000);
  if (error) throw error;
  // Statische Liste: gelöschte Kontakte ausblenden (058) — Embed-Filter würde den Join brechen, daher in JS.
  return ((data ?? []) as unknown as Array<{ contact: (ContactRow & { deleted_at?: string | null }) | null }>)
    .map((r) => r.contact)
    .filter((c): c is ContactRow => !!c && !c.deleted_at) as unknown as ContactRow[];
}
