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
): Promise<Record<string, unknown>[]> {
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
  return data ?? [];
}

/**
 * getContactDetail — ein Kontakt für das 820px-Info-Panel (P1). Embed: Firma (einheitlich)
 * + lean Deals (für contactActiveStage) — gleiche Leitung wie getContacts/getFollowUps.
 * Kopf rendert via contactToProfile/contactActiveStage. Kein Treffer → null (Panel leer).
 */
export async function getContactDetail(
  organizationId: string,
  contactId: string,
): Promise<Record<string, unknown> | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("contacts")
    .select(
      // Firmen-Embed hier breiter als CONTACT_COMPANY_EMBED: der Details-Tab seedet/schreibt auch
      // Branche/Größe/Stadt/Land der Firma.
      `*, company:companies!company_id(name, website, domain, industry, size_range, city, country), deals(id, name, stage, updated_at, stage_updated_at, closed_at, created_at, deleted_at), contact_phones(id, number, label, is_primary, created_at)`,
    )
    .eq("organization_id", organizationId)
    .eq("id", contactId)
    .single();
  if (error) return null;
  return data ?? null;
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
): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("tasks")
    .select(
      `id, title, due_at, priority, channel, contact:contacts(*, ${CONTACT_COMPANY_EMBED}, deals(stage, updated_at, stage_updated_at, closed_at, created_at, deleted_at))`,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null) // soft-gelöschte ausblenden
    .is("completed_at", null)
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return data ?? [];
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

/**
 * getTasksByContact — alle Tasks eines Kontakts fürs Panel (P3). Offene zuerst
 * (completed_at NULL), dann nach Fälligkeit; erledigte abgesetzt unten.
 * Embed: Deal-Name (Deal-Bezug) + Zuständige:r (assigned_to → users.full_name).
 */
export async function getTasksByContact(
  organizationId: string,
  contactId: string,
): Promise<Record<string, unknown>[]> {
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
  return data ?? [];
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
 * getNotesByContact — Notizen eines Kontakts fürs Panel (P4), neueste zuerst.
 * Embed: Autor (created_by → users.full_name; NULL → kein Autor angezeigt).
 */
export async function getNotesByContact(
  organizationId: string,
  contactId: string,
): Promise<Record<string, unknown>[]> {
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
  return data ?? [];
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
): Promise<Record<string, unknown>[]> {
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
  return data ?? [];
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
): Promise<Record<string, unknown>[]> {
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
  return data ?? [];
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
    .select("id, full_name, email, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
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
    .select("id, email, role, created_at, expires_at")
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
  organizationId: string,
  email: string,
  role: string,
  invitedBy?: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("invitations").insert({
    organization_id: organizationId,
    email: email.trim().toLowerCase(),
    role,
    invited_by: invitedBy ?? null,
  });
  if (error) throw error;
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

/** updateUserRole — Rolle eines Mitglieds ändern (nur Owner, RLS/Rechte serverseitig), org-gescoped. */
export async function updateUserRole(
  userId: string,
  organizationId: string,
  role: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("users")
    .update({ role })
    .eq("id", userId)
    .eq("organization_id", organizationId);
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
  const { error } = await client
    .from("deals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", dealId)
    .eq("organization_id", organizationId);
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

/** Aktive Module der Org (aus settings.modules) — Grundlage für useModules. */
export async function getModules(
  organizationId: string,
): Promise<Record<string, boolean>> {
  const settings = await getSettings(organizationId);
  return (settings?.modules as Record<string, boolean>) ?? {};
}
