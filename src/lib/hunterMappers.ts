/**
 * hunterMappers — DB-Zeilen → UI-Typen für den Hunter.
 *
 * Slice 1 (Leads-Tab, NUR Read): `contacts`-Zeile (org-gescoped, inkl. eingebettetem
 * Company-Namen) → `Lead` fürs Listing. Bewusst noch KEINE Heat-/Stage-Ableitung:
 * heatStatus/heatScore/pipelineStage sind Platzhalter — die echte Heat-Verdrahtung
 * kommt in Slice 2. Zeit-Felder werden in der Zeile (LeadListRow) ohnehin statisch
 * gerendert, daher hier leer.
 */

import type { Lead, HeatStatus } from "@/types";

// Platzhalter bis Slice 2 (Heat). Nicht aus DB abgeleitet.
const PLACEHOLDER_HEAT: HeatStatus = "WARM";

export function contactRowToLead(row: Record<string, any>): Lead {
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
    heatStatus: PLACEHOLDER_HEAT, // Slice 2
    heatScore: 0, // Slice 2
    icpScore: typeof row.icp_score === "number" ? row.icp_score : undefined,
    lastActivity: "",
    pipelineStage: "lead", // Platzhalter — Leads-Tab zeigt Stage „Lead"
    signalsCount: 0,
    contactEmail: row.email ?? "",
  };
}
