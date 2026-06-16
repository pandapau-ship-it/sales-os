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

// contacts.contact_status → DE-Stage-Label (Leads-Zeile). Kontakt-Lifecycle, nicht
// Deal-Stage (die lebt auf deals, gehört in den Pipeline-Slice).
// TODO (Rechte/Filter-Phase, NICHT jetzt): opt_out ist ein Hard-Block (nie wieder
// Sequenz, Audit); offene Produktfrage, ob opt_out/archiviert im Leads-Tab
// überhaupt erscheinen oder rausgefiltert werden. Aktuell nur angezeigt. [[leads-tab-read]]
const CONTACT_STATUS_LABEL: Record<string, string> = {
  ohne_campaign: "Ohne Kampagne",
  in_campaign: "In Kampagne",
  pipeline: "Pipeline",
  kunde: "Kunde",
  archiviert: "Archiviert",
  opt_out: "Opt-out",
};

// Lead + Leads-Zeilen-spezifische Anzeigefelder (LeadListRow liest `lead: any`).
export type LeadRow = Lead & {
  contactStatusLabel: string; // contact_status → DE-Label (Stage-Badge)
  lastContactedAt: string | null; // ISO oder null → Zeile zeigt „—"
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
    contactStatusLabel: CONTACT_STATUS_LABEL[row.contact_status] ?? "—", // null/unbekannt → „—"
    lastContactedAt: row.last_contacted_at ?? null,
  };
}
