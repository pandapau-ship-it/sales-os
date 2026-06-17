/**
 * hunterMappers — DB-Zeilen → UI-Typen für den Hunter.
 *
 * Slice 1+2 (Leads-Tab, NUR Read): `contacts`-Zeile (org-gescoped, inkl. eingebettetem
 * Company-Namen) → `Lead` fürs Listing. heatStatus kommt jetzt echt aus der DB
 * (Slice 2). pipelineStage bleibt Platzhalter (Stage gehört zu Deals, späterer Slice).
 * Zeit-Felder werden in der Zeile (LeadListRow) ohnehin statisch gerendert, daher leer.
 */

import type { Lead, HeatStatus } from "@/types";

// DB-Enum (deutsch) → UI-HeatStatus. 1:1, alle 5 Stufen abgedeckt. Label/Farbe
// kommen via HEAT_KEY_BY_STATUS + HEAT_STATUS (heiss=Engaged/grün, tot=Gone/grau).
const DB_HEAT_TO_UI: Record<string, HeatStatus> = {
  heiss: "HOT",
  warm: "WARM",
  lauwarm: "LUKEWARM",
  kalt: "COLD",
  tot: "DEAD",
};

// contacts.contact_status → Lifecycle-Status-Label (Leads-Zeile, Klartext).
// Kontakt-Lifecycle, NICHT Deal-Stage (die lebt auf deals → Pipeline-Slice).
// opt_out bleibt eigener Zustand (rechtlicher Hard-Block, nie zu „Inaktiv" verschmelzen).
// Unbekannt/null → kein Label (Badge wird nicht gerendert).
// Aufgeschoben (Details in PROGRESS.md → "Offene Konzept-Entscheidungen / Deferred Logic"):
//   [D1] automatische Lifecycle-Übergänge (Edge Function) · [D2] Labels user-konfigurierbar
//   (settings) · [D3] opt_out/archiviert-Filter im Leads-Tab.
const CONTACT_STATUS_LABEL: Record<string, string> = {
  ohne_campaign: "Neu",
  in_campaign: "Aktiv",
  pipeline: "In Pipeline",
  kunde: "Kunde",
  archiviert: "Inaktiv",
  opt_out: "Opt-out",
};

// Lead + Leads-Zeilen-spezifische Anzeigefelder (LeadListRow liest `lead: any`).
export type LeadRow = Lead & {
  contactStatusLabel?: string; // contact_status → Lifecycle-Label; undefined → kein Badge
  lastContactedAt: string | null; // ISO oder null → Zeit-Spalte rendert nichts
};

export function contactRowToLead(row: Record<string, any>): LeadRow {
  const name =
    [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || "Unbekannt";
  const company = row.company?.name ?? "";
  const initials = name
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: row.id,
    person: { id: row.id, name, jobTitle: row.job_title ?? "", company, initials, avatarUrl: undefined },
    kurzakte: "",
    fullTimeline: [],
    engagementChain: [],
    lastTouchpoints: [],
    heatStatus: DB_HEAT_TO_UI[row.heat_status] ?? "DEAD", // null/unbekannt → Gone/grau (neutral)
    heatScore: 0, // von HeatBadge nicht genutzt; out of scope
    icpScore: typeof row.icp_score === "number" ? row.icp_score : undefined,
    lastActivity: "",
    pipelineStage: "lead", // Platzhalter (Deal-Stage gehört in den Pipeline-Slice)
    signalsCount: 0,
    contactEmail: row.email ?? "",
    contactStatusLabel: CONTACT_STATUS_LABEL[row.contact_status], // unbekannt → undefined (kein Badge)
    lastContactedAt: row.last_contacted_at ?? null,
  };
}

// ── Pipeline-Liste (Slice A, Read) ───────────────────────────────────────────
// Eine Deal-Zeile (aus getDeals, inkl. joined contact/company) → normalisierte Row.
// Geteilt mit Slice B (Kanban): der gruppiert dieselben Rows nach stageSlug.
export type PipelineRow = {
  id: string;
  dealName: string;
  contactName: string;
  contactJobTitle: string;
  initials: string;
  company: string;
  stageSlug: string;
  stageLabel: string; // aus settings.pipeline_stages (slug → name)
  valueEur: number | null; // deal.value ist Cent → bereits /100; null = kein Wert
  heatStatus: HeatStatus;
  icpScore: number | null; // deal.contact.icp_score; null → Donut zeigt 0/grau (Slice B)
  ownerLabel: string; // Slice A: „—" (kein users-Join; echte Owner via [D7])
};

export function dealToPipelineRow(
  deal: Record<string, any>,
  stageNameBySlug: Record<string, string>,
): PipelineRow {
  const c = deal.contact ?? {};
  const contactName =
    [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Unbekannt";
  const initials = contactName
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: deal.id,
    dealName: deal.name ?? "",
    contactName,
    contactJobTitle: c.job_title ?? "",
    initials,
    company: deal.company?.name ?? "",
    stageSlug: deal.stage,
    stageLabel: stageNameBySlug[deal.stage] ?? deal.stage, // Fallback: roher Slug
    valueEur: typeof deal.value === "number" ? deal.value / 100 : null,
    heatStatus: DB_HEAT_TO_UI[deal.heat_status] ?? "DEAD",
    icpScore: typeof c.icp_score === "number" ? c.icp_score : null,
    ownerLabel: "—",
  };
}
