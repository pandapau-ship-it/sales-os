/**
 * hunter.ts — DB-Typen für den Hunter-Screen (entsprechen den Supabase-Tabellen
 * aus docs/sales_os_db_schema_v3.md). Ersetzen schrittweise die UI-Mock-Typen
 * aus src/types.ts. Joined-Felder kommen aus den lib/db-Queries (select-Joins).
 */

export type DealStage =
  | "backlog"
  | "demo_vereinbart"
  | "followup_offen"
  | "onboarding_offen"
  | "free_trial"
  | "gewonnen"
  | "verloren";

export type HeatStatusSlug = "heiss" | "warm" | "lauwarm" | "kalt" | "tot";

export interface Company {
  id: string;
  organization_id: string;
  name: string;
  domain?: string;
  industry?: string;
  size_range?: string;
  country?: string;
  city?: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  linkedin_url?: string;
  job_title?: string;
  company_id?: string;
  contact_status: string;
  icp_score?: number;
  heat_status?: string;
  last_contacted_at?: string;
  last_reply_at?: string;
}

export interface Task {
  id: string;
  organization_id: string;
  contact_id?: string;
  deal_id?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  due_at?: string;
  completed_at?: string;
  priority: string;
  source?: string;
  created_at: string;
}

export interface Deal {
  id: string;
  organization_id: string;
  contact_id: string;
  company_id?: string;
  name: string;
  stage: DealStage;
  value?: number;
  probability: number;
  heat_status?: string;
  stagnation_days: number;
  stage_updated_at: string;
  owner_id: string;
  next_action?: string;
  next_action_due_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  contact?: Contact;
  company?: Company;
  tasks?: Task[];
}

export interface Signal {
  id: string;
  organization_id: string;
  contact_id?: string;
  company_id?: string;
  source: string;
  signal_type: string;
  signal_data: Record<string, unknown>;
  routed_to: string;
  created_at: string;
  // Joined
  contact?: Contact;
}

/** Eine Pipeline-Stage aus settings.pipeline_stages (Slug = Speicherwert, name = Anzeige). */
export interface PipelineStage {
  slug: DealStage;
  name: string;
  order: number;
  stagnation_days: number | null;
  probability: number;
}

/** Dringlichkeits-Window je Signaltyp aus settings.signal_windows (org-tunebar). */
export interface SignalWindow {
  signal_type: string;
  window_hours: number;
}
