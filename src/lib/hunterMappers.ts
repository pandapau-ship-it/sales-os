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
    heatStatus: DB_HEAT_TO_UI[row.heat_status] ?? "DEAD", // null/unbekannt → Gone/grau (neutral)
    heatScore: 0, // von HeatBadge nicht genutzt; out of scope
    icpScore: typeof row.icp_score === "number" ? row.icp_score : undefined,
    lastActivity: "",
    pipelineStage: "lead", // Platzhalter — Leads-Tab zeigt Stage „Lead"
    signalsCount: 0,
    contactEmail: row.email ?? "",
  };
}
