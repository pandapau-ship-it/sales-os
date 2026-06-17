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
      // eslint-disable-next-line no-console
      console.warn("[db] Supabase-Env nicht gesetzt — Auth/DB inaktiv (Phase 0).");
    }
    return null;
  }
  _client = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
  return _client;
}

// Mock-Helfer: simuliert die asynchrone Supabase-Antwort (Microtask, kein Flash).
const ok = <T>(data: T): Promise<T> => Promise.resolve(data);

// Firmen-Auflösung über den Kontakt — EINHEITLICH in der ganzen App. contacts hat
// 2 FKs zu companies (company_id + primary_company_id) → expliziter !company_id-Hint
// nötig (sonst PostgREST PGRST201). Single-Source für Leads (getContacts) + Signals (getSignals).
const CONTACT_COMPANY_EMBED = "company:companies!company_id(name)";

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
  limit?: number;
  cursor?: string; // created_at des letzten Eintrags (Keyset)
}

export async function getContacts(
  organizationId: string,
  filters: ContactFilters = {},
): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  // Company-Name über den einheitlichen Embed (RLS greift auf companies mit).
  let q = client
    .from("contacts")
    .select(`*, ${CONTACT_COMPANY_EMBED}`)
    .eq("organization_id", organizationId);
  if (filters.status) q = q.eq("contact_status", filters.status);
  if (filters.heatStatus) q = q.eq("heat_status", filters.heatStatus);
  if (filters.cursor) q = q.lt("created_at", filters.cursor);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50);
  if (error) throw error;
  return data ?? [];
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
  let q = client.from("deals").select(DEAL_SELECT).eq("organization_id", organizationId);
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
    .single();
  if (error) return null;
  return data as unknown as Deal;
}

export interface SignalFilters {
  routedTo?: "hunter";
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
      `*, contact:contacts(*, ${CONTACT_COMPANY_EMBED}, deals(stage, updated_at, stage_updated_at, closed_at, created_at))`,
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
}

/** Task anlegen. Audit-Log via DB-Trigger. */
export async function createTask(task: {
  organizationId: string;
  contactId?: string;
  dealId?: string;
  title: string;
  description?: string;
  dueAt: string;
  priority: string;
  source: "manual";
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("tasks").insert({
    organization_id: task.organizationId,
    contact_id: task.contactId ?? null,
    deal_id: task.dealId ?? null,
    title: task.title,
    description: task.description ?? null,
    due_at: task.dueAt,
    priority: task.priority,
    source: task.source,
  });
  if (error) throw error;
}

/** settings.pipeline_stages (Anzeigenamen/Slugs/Schwellen). Caching am Call-Site (TanStack). */
export async function getPipelineSettings(
  organizationId: string,
): Promise<PipelineStage[]> {
  const settings = await getSettings(organizationId);
  return (settings?.pipeline_stages as PipelineStage[] | undefined) ?? [];
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

/** Aktive Module der Org (aus settings.modules) — Grundlage für useModules. */
export async function getModules(
  organizationId: string,
): Promise<Record<string, boolean>> {
  const settings = await getSettings(organizationId);
  return (settings?.modules as Record<string, boolean>) ?? {};
}
