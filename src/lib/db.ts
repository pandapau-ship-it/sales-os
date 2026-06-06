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
  INITIAL_SIGNALS,
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
  SignalEvent,
} from "@/types";

// ── Supabase Client — EINZIGER Init-Punkt im gesamten Projekt ────────────────
// Phase 5: echten Client hier aktivieren. Bis dahin wirft getSupabaseClient(),
// damit niemand versehentlich gegen eine nicht-konfigurierte DB läuft.
//
//   import { createClient, type SupabaseClient } from "@supabase/supabase-js";
//   let client: SupabaseClient | null = null;
//   export function getSupabaseClient(): SupabaseClient {
//     if (!client) {
//       client = createClient(
//         import.meta.env.VITE_SUPABASE_URL,
//         import.meta.env.VITE_SUPABASE_ANON_KEY,
//       );
//     }
//     return client;
//   }

/** Platzhalter-Client-Typ bis @supabase/supabase-js installiert ist (Phase 5). */
export type DbClient = unknown;

let _client: DbClient | null = null;

/**
 * Einziger Zugriffspunkt auf die Supabase-Instanz. auth/storage/realtime nutzen
 * ausschließlich diese Funktion — nie createClient() direkt.
 */
export function getSupabaseClient(): DbClient {
  if (_client) return _client;
  throw new Error(
    "Supabase ist noch nicht konfiguriert (Phase 5). " +
      "db.ts liefert aktuell Mock-Daten — getSupabaseClient() erst nach Setup nutzen.",
  );
}

// Mock-Helfer: simuliert die asynchrone Supabase-Antwort (Microtask, kein Flash).
const ok = <T>(data: T): Promise<T> => Promise.resolve(data);

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

export async function getSignals(): Promise<SignalEvent[]> {
  return ok(INITIAL_SIGNALS);
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
