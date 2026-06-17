/**
 * hunterMappers — DB-Zeilen → UI-Typen für den Hunter.
 *
 * Slice 1+2 (Leads-Tab, NUR Read): `contacts`-Zeile (org-gescoped, inkl. eingebettetem
 * Company-Namen) → `Lead` fürs Listing. heatStatus kommt jetzt echt aus der DB
 * (Slice 2). pipelineStage bleibt Platzhalter (Stage gehört zu Deals, späterer Slice).
 * Zeit-Felder werden in der Zeile (LeadListRow) ohnehin statisch gerendert, daher leer.
 */

import type { Lead, HeatStatus } from "@/types";
import type { LucideIcon } from "lucide-react";
import { signalMetaFor } from "@/lib/constants";

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

// ── Zentrale Kontakt-Auflösung (Single-Source für alle Tabs) ──────────────────
// Identitäts-/Status-Werte kommen IMMER vom Kontakt. heatStatus IMMER aus
// contacts.heat_status. Fehlende Werte → undefined (Regel „kein Wert → unsichtbar";
// wie der Render-Pfad das undefined behandelt, bleibt dort unverändert).
// Stage gehört dem Deal → NICHT Teil des Profils (kommt später über den Deal-Kontext).
export type ContactProfile = {
  avatarUrl?: string; // contacts hat kein Foto-Feld → Initiale
  name: string;
  initials: string;
  jobTitle: string;
  company: string;
  icpScore?: number;
  heatStatus?: HeatStatus;
  statusLabel?: string; // contact_status → Lifecycle-Label
};

export function contactToProfile(c: Record<string, any> | null | undefined): ContactProfile {
  const name = c
    ? [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Unbekannt"
    : "Unbekannt";
  const initials = name
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    avatarUrl: undefined,
    name,
    initials,
    jobTitle: c?.job_title ?? "",
    company: c?.company?.name ?? "",
    icpScore: typeof c?.icp_score === "number" ? c.icp_score : undefined,
    heatStatus: c?.heat_status ? DB_HEAT_TO_UI[c.heat_status] : undefined,
    statusLabel: c?.contact_status ? CONTACT_STATUS_LABEL[c.contact_status] : undefined,
  };
}

// Lead + Leads-Zeilen-spezifische Anzeigefelder (LeadListRow liest `lead: any`).
export type LeadRow = Lead & {
  contactStatusLabel?: string; // contact_status → Lifecycle-Label; undefined → kein Badge
  lastContactedAt: string | null; // ISO oder null → Zeit-Spalte rendert nichts
};

export function contactRowToLead(row: Record<string, any>): LeadRow {
  const p = contactToProfile(row); // zentrale Auflösung (Identität/Status/Heat/ICP)

  return {
    id: row.id,
    person: { id: row.id, name: p.name, jobTitle: p.jobTitle, company: p.company, initials: p.initials, avatarUrl: p.avatarUrl },
    kurzakte: "",
    fullTimeline: [],
    engagementChain: [],
    lastTouchpoints: [],
    heatStatus: p.heatStatus ?? "DEAD", // Leads-Optik unverändert: fehlend → Gone (Render-Hide später)
    heatScore: 0, // von HeatBadge nicht genutzt; out of scope
    icpScore: p.icpScore,
    lastActivity: "",
    pipelineStage: "lead", // Platzhalter (Deal-Stage gehört in den Pipeline-Slice)
    signalsCount: 0,
    contactEmail: row.email ?? "",
    contactStatusLabel: p.statusLabel, // aus zentraler Auflösung (contact_status → Label)
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
  icpScore: number | null; // deal.contact.icp_score; null → ICP-Ring nicht gerendert
  ownerId: string | null; // deals.owner_id (Filter-Key)
  ownerLabel: string; // owner:users.full_name (Slice C); null → „—" (kein Fake-Name)
};

export function dealToPipelineRow(
  deal: Record<string, any>,
  stageNameBySlug: Record<string, string>,
): PipelineRow {
  const p = contactToProfile(deal.contact); // zentrale Auflösung (Kontakt-Werte)
  return {
    id: deal.id,
    dealName: deal.name ?? "",
    contactName: p.name,
    contactJobTitle: p.jobTitle,
    initials: p.initials,
    company: p.company, // jetzt vom KONTAKT (nested embed), nicht vom Deal
    stageSlug: deal.stage,
    stageLabel: stageNameBySlug[deal.stage] ?? deal.stage, // Stage bleibt deal.stage (konkreter Deal)
    valueEur: typeof deal.value === "number" ? deal.value / 100 : null,
    heatStatus: p.heatStatus ?? "DEAD", // FIX: Heat aus contacts.heat_status (statt deals.heat_status); Fallback wie bisher
    icpScore: p.icpScore ?? null,
    ownerId: deal.owner_id ?? null,
    ownerLabel: deal.owner?.full_name ?? "—", // null → ehrliches „—", kein Fake-Name
  };
}

// ── Signals (S-0, nur Text-Auflösung; noch NICHT in der Karte verdrahtet) ─────
/**
 * resolveSignalText — i18n-Anzeige-Text eines Signals aus `signal_type` +
 * `signal_data.detail` (= {{topic}}). Reine Funktion (t injiziert → testbar).
 * Unbekannter/fehlender Typ → Fallback `custom`. Texte: i18n `hunter.signals.types.*`.
 */
export function resolveSignalText(
  signal: { signal_type?: string | null; signal_data?: { detail?: string } | null },
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const type = signal.signal_type || "custom";
  const topic = signal.signal_data?.detail ?? "";
  const key = `hunter.signals.types.${type}`;
  const text = t(key, { topic });
  // i18next gibt bei fehlendem Key den Key selbst zurück → auf `custom` zurückfallen.
  return text === key ? t("hunter.signals.types.custom", { topic }) : text;
}

/** Kurzformat „11m"/„2h"/„3d" aus einem ISO-Zeitstempel (sprachneutral). */
function relTimeShort(iso: string | null | undefined): string {
  if (!iso) return "";
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

/** Card-Props für die LinkedinSignalCard (S-2). Echte Felder + S-0-Helfer. */
export type SignalCardProps = {
  id: string;
  name: string;
  role: string;
  companyName: string;
  icpScore?: number; // fehlt/kein Kontakt → undefined → ICP-Ring nicht gerendert
  heatStatus?: HeatStatus; // undefined → kein Heat-Badge (z.B. kontaktloses Signal)
  actionText: string;
  channelLabelKey: string;
  channelIcon: LucideIcon;
  timeAgo: string;
  stage?: string; // Label des zuletzt aktiven Deals; kein aktiver Deal → undefined → kein Stage
};

// Terminal-Stages (kein „aktiver" Deal mehr).
const TERMINAL_STAGES = new Set(["gewonnen", "verloren"]);
const ms = (x: any) => new Date(x ?? 0).getTime();

/**
 * latestActiveDeal — jüngster NICHT-terminaler Deal eines Kontakts (offene Pipeline).
 * Terminal = stage gewonnen/verloren oder closed_at gesetzt. Recency: updated_at,
 * Tiebreaker stage_updated_at (Demo-Fall, wo updated_at ~uniform), dann created_at.
 * Keine/nur terminale Deals → null.
 */
export function latestActiveDeal(
  deals: Record<string, any>[] | null | undefined,
): Record<string, any> | null {
  const open = (deals ?? []).filter(
    (d) => !TERMINAL_STAGES.has(d.stage) && d.closed_at == null,
  );
  if (!open.length) return null;
  return open
    .slice()
    .sort(
      (a, b) =>
        ms(b.updated_at) - ms(a.updated_at) ||
        ms(b.stage_updated_at) - ms(a.stage_updated_at) ||
        ms(b.created_at) - ms(a.created_at),
    )[0];
}

/** Stage-Label des zuletzt aktiven Deals (aus settings.pipeline_stages). Kein aktiver Deal → undefined. */
export function contactActiveStage(
  contact: Record<string, any> | null | undefined,
  stageNameBySlug: Record<string, string>,
): string | undefined {
  const d = latestActiveDeal(contact?.deals);
  return d ? stageNameBySlug[d.stage] ?? d.stage : undefined;
}

// ── Follow-ups (Read): schlanke Karte = Kontakt-Kachel + Stage + Panel-Einstieg ──
export type FollowUpCardItem = {
  id: string;
  name: string;
  role: string; // jobTitle
  companyName: string;
  icpScore?: number;
  heatStatus?: HeatStatus;
  stage?: string; // zuletzt aktiver Deal; kein aktiver Deal → undefined → keine Stage
};

/** Kontakt (Heat Cold/Gone) → Follow-up-Card-Item. Identität/Heat/ICP zentral, Stage via active deal. */
export function contactToFollowUpCard(
  contact: Record<string, any>,
  stageNameBySlug: Record<string, string> = {},
): FollowUpCardItem {
  const p = contactToProfile(contact);
  return {
    id: contact.id,
    name: p.name,
    role: p.jobTitle,
    companyName: p.company,
    icpScore: p.icpScore,
    heatStatus: p.heatStatus,
    stage: contactActiveStage(contact, stageNameBySlug),
  };
}

// ── Neu in Pipeline (Read): frisch angelegter Deal → Kontakt-Kachel + Stage ──────
// „Neu in Pipeline" = kürzlich angelegte Deals (deals.created_at) als Info-/Übersicht.
// Identität/Heat/ICP zentral (contactToProfile), Stage = zuletzt aktiver Deal des
// Kontakts (contactActiveStage). Herkunft aus deals.source_lead_id (gesetzt → AI SDR,
// null → manuell). createdAt trägt den Zeitfilter + „vor X Tagen". Termin-Datum,
// Meeting-Prep-Status und AI-Begleittext sind bewusst NICHT hier (Logik/Tabellen
// fehlen → würde Daten vortäuschen; siehe PROGRESS → Deferred [D18]).
export type NewPipelineCardItem = {
  id: string; // deal.id
  name: string;
  role: string; // jobTitle
  companyName: string;
  initials: string;
  icpScore?: number;
  heatStatus?: HeatStatus;
  stage?: string; // zuletzt aktiver Deal des Kontakts; keiner → undefined → keine Stage
  createdAt: string | null; // deal.created_at (Zeitfilter + „vor X Tagen"); null → unsichtbar
  source: "ai_sdr" | "manual";
};

export function dealToNewPipelineRow(
  deal: Record<string, any>,
  stageNameBySlug: Record<string, string> = {},
): NewPipelineCardItem {
  const p = contactToProfile(deal.contact); // zentrale Auflösung (Identität/Status/Heat/ICP)
  return {
    id: deal.id,
    name: p.name,
    role: p.jobTitle,
    companyName: p.company,
    initials: p.initials,
    icpScore: p.icpScore,
    heatStatus: p.heatStatus,
    stage: contactActiveStage(deal.contact, stageNameBySlug),
    createdAt: deal.created_at ?? null,
    source: deal.source_lead_id ? "ai_sdr" : "manual",
  };
}

/** Zeitfenster des Neu-in-Pipeline-Tabs (client-seitiger Filter über deal.created_at). */
export type NewPipelinePeriod = "today" | "7d" | "30d";

/** True, wenn `createdAt` im gewählten Fenster liegt. Kein Datum → false (nie „neu" ohne Beleg). */
export function newPipelineInPeriod(
  createdAt: string | null | undefined,
  period: NewPipelinePeriod,
): boolean {
  if (!createdAt) return false;
  const at = new Date(createdAt).getTime();
  if (Number.isNaN(at)) return false;
  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return at >= start.getTime();
  }
  const days = period === "7d" ? 7 : 30;
  return at >= Date.now() - days * 86_400_000;
}

/**
 * signalToCardProps — signals-Zeile (inkl. contact+company+deals-Join) → Card-Props.
 * Identität/Status/Heat/ICP aus contactToProfile; Stage = zuletzt aktiver Deal des
 * Kontakts (kein aktiver Deal → undefined → Karte zeigt keinen Stage-Bereich).
 */
export function signalToCardProps(
  signal: Record<string, any>,
  t: (key: string, opts?: Record<string, unknown>) => string,
  stageNameBySlug: Record<string, string> = {},
): SignalCardProps {
  const p = contactToProfile(signal.contact); // zentrale Auflösung (Identität/Status/Heat/ICP)
  const meta = signalMetaFor(signal.signal_type);
  return {
    id: signal.id,
    name: p.name,
    role: p.jobTitle,
    companyName: p.company,
    icpScore: p.icpScore, // fehlt → undefined → Ring unsichtbar
    heatStatus: p.heatStatus, // immer contacts.heat_status; fehlt → undefined → Badge unsichtbar (kein Fake)
    actionText: resolveSignalText(signal, t),
    channelLabelKey: meta.channelLabelKey,
    channelIcon: meta.icon,
    timeAgo: relTimeShort(signal.created_at),
    stage: contactActiveStage(signal.contact, stageNameBySlug),
  };
}
