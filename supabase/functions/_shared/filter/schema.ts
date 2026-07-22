// MIRROR von src/lib/filter/schema.ts — Deno-Edge kann src/ nicht importieren (Präzedenz terminalStages.ts).
// EXAKT in Sync halten mit der Quelle; erzwungen durch den Parity-Test (mirror-parity.test.ts).
/**
 * filter/schema.ts — Whitelist: welche Felder je Entität filterbar sind + welcher Typ.
 *
 * DIES IST DIE SICHERHEITSGRENZE. Ein Feld ist NUR filterbar, wenn es hier steht; ein
 * Operator NUR anwendbar, wenn er für den Feldtyp erlaubt ist. Alles andere lehnt der
 * Validator ab (validate.ts). Kein freies SQL, keine dynamischen Spaltennamen aus Nutzer-
 * eingaben — Feldnamen kommen ausschließlich aus dieser Datei.
 *
 * Feldnamen = echte DB-Spalten (contacts/companies/deals, Migration 002/004 + 056). Neue
 * filterbare Felder → hier ergänzen (eine Quelle), nie am Validator/Compiler vorbei.
 */

import type { FilterEntity, FilterOperator } from "./types.ts";

export type FieldType = "text" | "number" | "boolean" | "date" | "enum" | "text[]";

export interface FieldSpec {
  type: FieldType;
  /** nur für enum: zulässige Werte (zusätzliche Validierung). */
  enumValues?: readonly string[];
}

// Welche Operatoren pro Feldtyp erlaubt sind. Geschlossen — nichts anderes durchläuft.
export const OPERATORS_BY_TYPE: Record<FieldType, readonly FilterOperator[]> = {
  text: ["eq", "neq", "contains", "starts_with", "in", "not_in", "is_empty", "is_not_empty"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "not_in", "is_empty", "is_not_empty"],
  date: ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"],
  boolean: ["eq", "neq", "is_empty", "is_not_empty"],
  enum: ["eq", "neq", "in", "not_in", "is_empty", "is_not_empty"],
  "text[]": ["has_any", "is_empty", "is_not_empty"],
};

const CONTACT_FIELDS: Record<string, FieldSpec> = {
  first_name: { type: "text" },
  last_name: { type: "text" },
  email: { type: "text" },
  linkedin_url: { type: "text" }, // filterbar (u.a. „Ohne Kontaktweg": email + linkedin_url beide is_empty)
  job_title: { type: "text" },
  seniority: { type: "text" },
  city: { type: "text" },
  country: { type: "text" },
  icp_score: { type: "number" },
  // Berechnete Scores (täglich per Cron befüllt, Migr. 048) — filterbar für Lifecycle-Trigger,
  // z.B. „WENN churn_score >= 61". Echte contacts-Spalten, kein neuer Wert.
  churn_score: { type: "number" },
  upsell_score: { type: "number" },
  health_score: { type: "number" },
  heat_status: { type: "enum", enumValues: ["heiss", "warm", "lauwarm", "kalt", "tot"] },
  contact_status: {
    type: "enum",
    enumValues: ["ohne_campaign", "in_campaign", "pipeline", "kunde", "archiviert", "opt_out"],
  },
  lead_status: {
    type: "enum",
    enumValues: ["lead", "qualified_lead", "mql", "sql", "customer", "churned"],
  },
  lead_source: {
    type: "enum",
    enumValues: ["sherloq", "csv_upload", "crm_sync", "manual", "webhook_api"],
  },
  email_verified: { type: "boolean" },
  assigned_to: { type: "text" }, // uuid als opaker String — nur eq/in sinnvoll
  tags: { type: "text[]" },
  last_contacted_at: { type: "date" },
  last_reply_at: { type: "date" },
  created_at: { type: "date" },
};

const COMPANY_FIELDS: Record<string, FieldSpec> = {
  name: { type: "text" },
  domain: { type: "text" },
  industry: { type: "text" },
  size_range: { type: "enum", enumValues: ["1-10", "11-50", "51-200", "201-500", "500+"] },
  country: { type: "text" },
  city: { type: "text" },
  subscription_plan: { type: "text" },
  subscription_status: { type: "enum", enumValues: ["trial", "active", "churned"] },
  annual_revenue: { type: "number" },
  tags: { type: "text[]" },
  created_at: { type: "date" },
};

const DEAL_FIELDS: Record<string, FieldSpec> = {
  stage: { type: "text" },
  value: { type: "number" },
  probability: { type: "number" },
  stagnation_days: { type: "number" }, // täglich per Cron befüllt (score-deal-health, Migr. 004) — filterbar
  created_at: { type: "date" },
  closed_at: { type: "date" },
};

export const FILTER_SCHEMA: Record<FilterEntity, Record<string, FieldSpec>> = {
  contacts: CONTACT_FIELDS,
  companies: COMPANY_FIELDS,
  deals: DEAL_FIELDS,
};

/** FieldSpec für (Entität, Feld) — oder null, wenn das Feld nicht filterbar ist. */
export function getFieldSpec(entity: FilterEntity, field: string): FieldSpec | null {
  return FILTER_SCHEMA[entity]?.[field] ?? null;
}

/** Prüft, ob der Operator für den Feldtyp erlaubt ist. */
export function operatorAllowed(type: FieldType, operator: FilterOperator): boolean {
  return OPERATORS_BY_TYPE[type].includes(operator);
}
