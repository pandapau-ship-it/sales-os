/**
 * hunterMappers — DB-Zeilen → UI-Typen für den Hunter.
 *
 * Slice 1+2 (Leads-Tab, NUR Read): `contacts`-Zeile (org-gescoped, inkl. eingebettetem
 * Company-Namen) → `Lead` fürs Listing. heatStatus kommt jetzt echt aus der DB
 * (Slice 2). pipelineStage bleibt Platzhalter (Stage gehört zu Deals, späterer Slice).
 * Zeit-Felder werden in der Zeile (LeadListRow) ohnehin statisch gerendert, daher leer.
 */

import type { Lead, Customer, SherloqStatus, HeatStatus } from "@/types";
import type { DealStage } from "@/types/hunter";
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
// Single-Source der contact_status-Labels (Kopf-Badge via contactToProfile UND Details-Dropdown).
export const CONTACT_STATUS_LABEL: Record<string, string> = {
  ohne_campaign: "Neu",
  in_campaign: "Aktiv",
  pipeline: "In Pipeline",
  kunde: "Kunde",
  archiviert: "Inaktiv",
  opt_out: "Opt-out",
};
// Manuell im Dropdown wählbare Stati (opt_out ist rechtlicher Hard-Block → nicht manuell setzbar).
export const CONTACT_STATUS_SELECTABLE = ["ohne_campaign", "in_campaign", "pipeline", "kunde", "archiviert"] as const;

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
  // Kontaktwege (P2) — fehlend → undefined (Zeile/Icon unsichtbar). website = Firmen-Wert
  // (contacts hat keine eigene Website) aus dem company-Embed; sonst domain.
  email?: string;
  phones: { id: string; type: string; number: string; favorite: boolean }[]; // aus contact_phones (einzige Quelle)
  linkedinUrl?: string;
  website?: string;
};

/* single-source:allow-start — DIE zentrale Resolver-Region: HIER (und nur hier) ist
   der Roh-Zugriff auf gemeinsame Kontaktwerte erlaubt (Single-Source-Audit). */
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
  // Telefonnummern aus contact_phones (is_primary → favorite, label → type). Favorit zuerst.
  // Keine Nummern → leeres Array (Honesty). PH4: Legacy contacts.phone entfernt — einzige Quelle.
  const phonesRaw = Array.isArray(c?.contact_phones) ? c!.contact_phones : [];
  let phones = phonesRaw.map((p: any) => ({
    id: String(p.id),
    type: p.label || "Weitere",
    number: p.number ?? "",
    favorite: !!p.is_primary,
  }));
  if (phones.length && !phones.some((p) => p.favorite)) phones[0].favorite = true; // genau-1-Favorit absichern
  phones = phones.slice().sort((a, b) => Number(b.favorite) - Number(a.favorite)); // Favorit zuerst
  return {
    avatarUrl: undefined,
    name,
    initials,
    jobTitle: c?.job_title ?? "",
    company: c?.company?.name ?? "",
    icpScore: typeof c?.icp_score === "number" ? c.icp_score : undefined,
    heatStatus: c?.heat_status ? DB_HEAT_TO_UI[c.heat_status] : undefined,
    statusLabel: c?.contact_status ? CONTACT_STATUS_LABEL[c.contact_status] : undefined,
    email: c?.email || undefined,
    phones,
    linkedinUrl: c?.linkedin_url || undefined,
    website: c?.company?.website || c?.company?.domain || undefined, // Firmen-Website (Kontakt hat keine eigene)
  };
}
/* single-source:allow-end */

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

// Heat-Status (UI) → grober heatScore 0-5. Mock-Kompat: ScreenFarming.churnCount nutzt heatScore<=2,
// bis der Retention-Slice auf churn_score umstellt. Fehlend → 3 (neutral).
const HEAT_TO_SCORE: Record<HeatStatus, number> = { HOT: 5, WARM: 4, LUKEWARM: 3, COLD: 1, DEAD: 0 };

// companies.subscription_status (trial|active|churned) → Customer.sherloqStatus (UPPERCASE-Union).
// churned → CANCELLED (Badge „Gekündigt"). Kunde ohne Status → ACTIVE (Fallback, dokumentiert).
function subStatusToSherloq(s: string | null | undefined): SherloqStatus {
  if (s === "active") return "ACTIVE";
  if (s === "churned") return "CANCELLED";
  if (s === "trial") return "TRIAL";
  return "ACTIVE";
}

/**
 * customerRowToView — contacts-Zeile (status='kunde') → Customer-Sicht für den Farmer.
 * Reuse `contactToProfile` (Single Source für Identität/ICP/Heat/Status). Subscription kommt aus
 * dem company-Embed (primäre Company), Scores aus Migration 048 (NULL → undefined, Honesty).
 * Mock-only Felder (kurzakte/timeline/profilesAdded) bleiben leer — im Kunden-Tab nicht angezeigt.
 */
export function customerRowToView(
  row: Record<string, any>,
  t: (key: string, opts?: Record<string, unknown>) => string,
): Customer {
  const p = contactToProfile(row);
  const sub = row.company ?? {};
  const planRaw = (sub.subscription_plan ?? "") as string;
  // Honesty: KEIN Default mehr — NULL/unbekannt → undefined (Anzeige blendet aus / zeigt „—"),
  // nie erfundenes „Growth". Single Source = companies.subscription_plan (identisch zu Panel-8d).
  const plan = (["Growth", "Enterprise", "Starter"] as const)
    .find((x) => x.toLowerCase() === planRaw.toLowerCase());
  return {
    id: row.id,
    person: { id: row.id, name: p.name, jobTitle: p.jobTitle, company: p.company, initials: p.initials, avatarUrl: p.avatarUrl },
    kurzakte: "",
    fullTimeline: [],
    engagementChain: [],
    lastTouchpoints: [],
    heatStatus: p.heatStatus ?? "DEAD",
    heatScore: p.heatStatus ? HEAT_TO_SCORE[p.heatStatus] : 3,
    icpScore: p.icpScore,
    lastActivity: "",
    pipelineStage: "pipeline",
    signalsCount: 0,
    contactEmail: p.email ?? "",
    // Farmer-spezifisch (echt):
    sherloqStatus: subStatusToSherloq(sub.subscription_status),
    lastLogin: lastContactedLabel(row, t), // echte „vor X Tagen" aus last_contacted_at; null → '' (Honesty)
    profilesAdded: 0,                       // Sherloq-Usage noch nicht in der DB (modul-gated, folgt)
    subscriptionPlan: plan,
    // Echte Scores (048; aktuell NULL bis die Score-Funktionen laufen → undefined). Honesty: nicht anzeigen.
    churnScore: typeof row.churn_score === "number" ? row.churn_score : undefined,
    upsellScore: typeof row.upsell_score === "number" ? row.upsell_score : undefined,
    healthScore: typeof row.health_score === "number" ? row.health_score : undefined,
    healthStatus: row.health_status ?? undefined,
    mrrMonthly: typeof sub.mrr_monthly === "number" ? sub.mrr_monthly : undefined, // companies.mrr_monthly (Cent); NULL → undefined
    scoreDrivers: Array.isArray(row.score_drivers) ? row.score_drivers : undefined,   // Churn-Treiber (Banner)
    upsellDrivers: Array.isArray(row.upsell_drivers) ? row.upsell_drivers : undefined, // Upsell-Treiber (Banner)
  };
}

// ── Deal-Resolver (zentrale Deal-Sicht — Pendant zu contactToProfile) ─────────
// EINE Quelle aller Deal-ANZEIGEwerte. Jeder Deal-Mapper/Block (rowToDealView,
// dealToPipelineRow, DealSetup, DealKurzinfo) zieht Wert/Stage/Owner/Probability/
// Laufzeit/… HIER raus — keine doppelte Feldlogik, kein Roh-Zugriff daneben.
// Honesty: fehlt ein Wert → undefined (Element wird ausgeblendet, nie 0/Platzhalter).
// MRR/ARR sind BERECHNET (keine DB-Spalten): mrr = value€ / term_months, arr = mrr×12;
// term_months fehlt/0 → mrr/arr = undefined.
export type DealView = {
  id: string;
  name: string;
  product?: string;
  valueEur?: number; // deals.value (Cent) / 100
  currency: string;
  stageSlug: string; // roher Slug (Gruppierung/Filter)
  stageLabel: string; // settings.pipeline_stages: slug → Anzeigename
  owner?: string; // owner_id → users.full_name (Anzeige)
  ownerId?: string; // deals.owner_id (Roh-ID — für Edit-Vorbelegung des Owner-Dropdowns)
  probability?: number; // ABGELEITET aus der Stage (settings.pipeline_stages), nicht aus deals.probability
  termMonths?: number; // Laufzeit (Monate)
  noticePeriodDays?: number; // Kündigungsfrist (Tage)
  expectedCloseDate?: string; // erwartetes Abschlussdatum (Forecast)
  closedAt?: string; // tatsächlicher Abschluss
  lostReason?: string; // deals.lost_reason (nur bei stage=verloren) — fehlt → ausgeblendet
  lostNote?: string; // deals.lost_note (optionaler Freitext beim Verlieren) — fehlt → ausgeblendet
  wonReason?: string; // deals.won_reason (optionaler Gewinn-Grund, Auswahl) — fehlt → ausgeblendet
  wonNote?: string; // deals.won_note (optionaler Freitext beim Gewinnen) — fehlt → ausgeblendet
  endDate?: string; // Vertragsende/Churn
  mrr?: number; // BERECHNET: valueEur / termMonths
  arr?: number; // BERECHNET: mrr × 12
  stagnationDays?: number; // deals.stagnation_days (Edge Function score-deal-health)
};

// Stagnations-Hinweis: Tage zurück, wenn Stage nicht terminal UND stagnation_days >= Schwelle
// (settings.pipeline_stages.stagnation_days). Sonst null → kein Hinweis. Schwelle nie hardcodiert.
export function stagnationFlag(
  stageSlug: string,
  stagnationDays: number | null | undefined,
  thresholds: Record<string, number | null>,
): number | null {
  if (isTerminalStage(stageSlug)) return null;
  const thr = thresholds[stageSlug];
  if (typeof thr !== "number") return null;
  const d = stagnationDays ?? 0;
  return d >= thr ? d : null;
}

export function dealToView(
  deal: Record<string, any>,
  stageNameBySlug: Record<string, string> = {},
  stageProbBySlug: Record<string, number> = {},
): DealView {
  const valueEur = typeof deal.value === "number" ? deal.value / 100 : undefined;
  // term_months muss > 0 sein, sonst ist mrr/arr nicht definiert (keine Division durch 0).
  const termMonths = typeof deal.term_months === "number" && deal.term_months > 0 ? deal.term_months : undefined;
  const mrr = valueEur != null && termMonths ? valueEur / termMonths : undefined;
  const arr = mrr != null ? mrr * 12 : undefined;
  // Probability ABGELEITET aus der Stage (Admin-Setting settings.pipeline_stages), nicht
  // aus deals.probability — analog MRR/ARR (computed, nicht gespeichert). Stage ohne
  // Probability in der Map → undefined (Honesty: Element ausgeblendet).
  const prob = stageProbBySlug[deal.stage];
  const probability = typeof prob === "number" ? prob : undefined;
  return {
    id: deal.id,
    name: deal.name ?? "",
    product: deal.product || undefined,
    valueEur,
    currency: deal.currency ?? "EUR",
    stageSlug: deal.stage ?? "",
    stageLabel: stageNameBySlug[deal.stage] ?? deal.stage ?? "",
    owner: deal.owner?.full_name || undefined,
    ownerId: deal.owner_id ?? undefined,
    probability,
    termMonths,
    noticePeriodDays: typeof deal.notice_period_days === "number" ? deal.notice_period_days : undefined,
    expectedCloseDate: deal.expected_close_date ?? undefined,
    closedAt: deal.closed_at ?? undefined,
    lostReason: deal.lost_reason ?? undefined,
    lostNote: deal.lost_note ?? undefined,
    wonReason: deal.won_reason ?? undefined,
    wonNote: deal.won_note ?? undefined,
    endDate: deal.end_date ?? undefined,
    mrr,
    arr,
    stagnationDays: typeof deal.stagnation_days === "number" ? deal.stagnation_days : undefined,
  };
}

// ── Pipeline-Liste (Slice A, Read) ───────────────────────────────────────────
// Eine Deal-Zeile (aus getDeals, inkl. joined contact/company) → normalisierte Row.
// Geteilt mit Slice B (Kanban): der gruppiert dieselben Rows nach stageSlug.
export type PipelineRow = {
  id: string;
  contactId: string | null; // zugrundeliegender Kontakt (für Panel-Fetch / Single-Source-Kopf)
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
  stagnationDays: number; // deals.stagnation_days (für Stagnations-Hinweis an der Stage)
};

export function dealToPipelineRow(
  deal: Record<string, any>,
  stageNameBySlug: Record<string, string>,
): PipelineRow {
  const p = contactToProfile(deal.contact); // zentrale Auflösung (Kontakt-Werte)
  const d = dealToView(deal, stageNameBySlug); // zentrale Auflösung (Deal-Werte) — keine doppelte Logik
  return {
    id: deal.id,
    contactId: deal.contact?.id ?? null,
    dealName: d.name,
    contactName: p.name,
    contactJobTitle: p.jobTitle,
    initials: p.initials,
    company: p.company, // jetzt vom KONTAKT (nested embed), nicht vom Deal
    stageSlug: d.stageSlug,
    stageLabel: d.stageLabel, // Stage = konkreter Deal (über dealToView)
    valueEur: d.valueEur ?? null, // DealView: undefined → null (PipelineRow-Vertrag)
    heatStatus: p.heatStatus ?? "DEAD", // FIX: Heat aus contacts.heat_status (statt deals.heat_status); Fallback wie bisher
    icpScore: p.icpScore ?? null,
    ownerId: deal.owner_id ?? null,
    ownerLabel: d.owner ?? "—", // null → ehrliches „—", kein Fake-Name
    stagnationDays: typeof deal.stagnation_days === "number" ? deal.stagnation_days : 0,
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

/**
 * Ganze Tage seit `iso` (>= 0); kein/ungültiges Datum → null.
 * Aus dem Render heraus `nowMs` aus `useNowMs()` übergeben — der Default liest die
 * Uhr und wäre dort unrein (react-hooks/purity).
 */
export function daysSinceIso(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!iso) return null;
  const ms = nowMs - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * Profilzeilen-Zeit „vor X Tagen" — IMMER aus `contacts.last_contacted_at` (Single Source).
 * NULL oder „vor 0 Tagen" → '' (Element bleibt unsichtbar, Honesty). Gilt für ALLE Hunter-Kacheln.
 */
export function lastContactedLabel(
  contact: Record<string, any> | null | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const days = daysSinceIso(contact?.last_contacted_at);
  return days != null && days >= 1
    ? t("hunter.common.ago", { label: t("hunter.common.daysAgo", { count: days }) })
    : "";
}

/** Card-Props für die LinkedinSignalCard (S-2). Echte Felder + S-0-Helfer. */
export type SignalCardProps = {
  id: string;
  contactId?: string; // zugrundeliegender Kontakt (für Panel-Fetch / Single-Source-Kopf)
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

// Terminal-Stages (kein „aktiver" Deal mehr) — SINGLE SOURCE für die ganze App.
// `as const satisfies readonly DealStage[]` bindet die Slugs an die kanonische
// DealStage-Union (types/hunter.ts) → kann nicht stillschweigend von ihr driften.
// Won/Lost einzeln benannt, damit Won-only-Checks (isWon) ebenfalls aus einer Quelle kommen.
export const WON_STAGE_SLUG = "gewonnen" as const;
export const LOST_STAGE_SLUG = "verloren" as const;
export const TERMINAL_STAGE_SLUGS = [WON_STAGE_SLUG, LOST_STAGE_SLUG] as const satisfies readonly DealStage[];
/** true, wenn der Slug eine Terminal-Stage (gewonnen/verloren) ist. */
export const isTerminalStage = (slug: string): boolean =>
  (TERMINAL_STAGE_SLUGS as readonly string[]).includes(slug);
const ms = (x: any) => new Date(x ?? 0).getTime();

/* single-source:allow-start — Stage-Resolver (zentrale Quelle der aktiven-Deal-Stage). */
/**
 * latestActiveDeal — jüngster NICHT-terminaler Deal eines Kontakts (offene Pipeline).
 * Terminal = stage gewonnen/verloren oder closed_at gesetzt; soft-gelöscht (deleted_at)
 * zählt nie. Recency: updated_at, Tiebreaker stage_updated_at (Demo-Fall, wo updated_at
 * ~uniform), dann created_at. Keine/nur terminale Deals → null.
 */
export function latestActiveDeal(
  deals: Record<string, any>[] | null | undefined,
): Record<string, any> | null {
  const open = (deals ?? []).filter(
    (d) => !isTerminalStage(d.stage) && d.closed_at == null && d.deleted_at == null,
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
/* single-source:allow-end */

// ── Neu in Pipeline (Read): frisch angelegter Deal → Kontakt-Kachel + Stage ──────
// „Neu in Pipeline" = kürzlich angelegte Deals (deals.created_at) als Info-/Übersicht.
// Identität/Heat/ICP zentral (contactToProfile), Stage = zuletzt aktiver Deal des
// Kontakts (contactActiveStage). Herkunft aus deals.source_lead_id (gesetzt → AI SDR,
// null → manuell). createdAt trägt den Zeitfilter + „vor X Tagen". Termin-Datum,
// Meeting-Prep-Status und AI-Begleittext sind bewusst NICHT hier (Logik/Tabellen
// fehlen → würde Daten vortäuschen; siehe PROGRESS → Deferred [D18]).
export type NewPipelineCardItem = {
  id: string; // deal.id
  contactId?: string; // zugrundeliegender Kontakt (für Panel-Fetch / Single-Source-Kopf)
  name: string;
  role: string; // jobTitle
  companyName: string;
  initials: string;
  icpScore?: number;
  heatStatus?: HeatStatus;
  stage?: string; // zuletzt aktiver Deal des Kontakts; keiner → undefined → keine Stage
  createdAt: string | null; // deal.created_at (Zeitfilter der Query); null → unsichtbar
  lastContactedAt: string | null; // contacts.last_contacted_at → „Letzter Kontakt vor X"; null → unsichtbar
  source: "ai_sdr" | "manual";
  dealName?: string; // deal.name; fehlt → ausgeblendet (Honesty)
  dealValue?: number; // deal.value in Cent; fehlt → ausgeblendet
  dealProduct?: string; // deal.product; fehlt → ausgeblendet
};

export function dealToNewPipelineRow(
  deal: Record<string, any>,
  stageNameBySlug: Record<string, string> = {},
): NewPipelineCardItem {
  const p = contactToProfile(deal.contact); // zentrale Auflösung (Identität/Status/Heat/ICP)
  return {
    id: deal.id,
    contactId: deal.contact?.id,
    name: p.name,
    role: p.jobTitle,
    companyName: p.company,
    initials: p.initials,
    icpScore: p.icpScore,
    heatStatus: p.heatStatus,
    stage: contactActiveStage(deal.contact, stageNameBySlug),
    createdAt: deal.created_at ?? null,
    lastContactedAt: deal.contact?.last_contacted_at ?? null, // echtes contacts.last_contacted_at (via contact-Embed)
    source: deal.source_lead_id ? "ai_sdr" : "manual",
    dealName: deal.name ?? undefined,
    dealValue: deal.value ?? undefined,
    dealProduct: deal.product ?? undefined,
  };
}

// ── Fällige Tasks (T1, Read-Infrastruktur) ───────────────────────────────────
// Pro fälliger Task eine Karte: Kontakt-Kachel oben (zentrale Leitung) + grauer
// Bereich „Fällige Task" mit Titel + Fälligkeit. Fundament für den Follow-ups-Tab
// (T2 hängt die Karten an); hier NUR Query + Mapper (noch nicht verdrahtet).
export type DueTaskCardItem = {
  id: string; // task.id
  contactId?: string; // zugrundeliegender Kontakt (für Panel-Fetch / Single-Source-Kopf)
  name: string;
  role: string; // jobTitle
  companyName: string;
  initials: string;
  icpScore?: number;
  heatStatus?: HeatStatus;
  stage?: string; // zuletzt aktiver Deal des Kontakts; keiner → undefined → keine Stage
  taskTitle: string;
  dueAt: string | null; // task.due_at (ISO) → Fälligkeit; null → unsichtbar
};

/** Fällige Task (inkl. contact+company+deals-Embed) → Karte. Identität/Heat/ICP zentral, Stage via active deal. */
export function taskToDueCard(
  task: Record<string, any>,
  stageNameBySlug: Record<string, string> = {},
): DueTaskCardItem {
  const p = contactToProfile(task.contact); // zentrale Auflösung (Identität/Status/Heat/ICP)
  return {
    id: task.id,
    contactId: task.contact?.id,
    name: p.name,
    role: p.jobTitle,
    companyName: p.company,
    initials: p.initials,
    icpScore: p.icpScore,
    heatStatus: p.heatStatus,
    stage: contactActiveStage(task.contact, stageNameBySlug),
    taskTitle: task.title ?? "",
    dueAt: task.due_at ?? null,
  };
}

/** Zeitfenster des Neu-in-Pipeline-Tabs (client-seitiger Filter über deal.created_at). */
export type NewPipelinePeriod = "today" | "7d" | "30d";

/** True, wenn `createdAt` im gewählten Fenster liegt. Kein Datum → false (nie „neu" ohne Beleg).
 * [D51]: die Tage-Fenster hinter „7d"/„30d" kommen aus settings (`windows`); Literale 7/30 nur Per-Key-Fallback. */
export function newPipelineInPeriod(
  createdAt: string | null | undefined,
  period: NewPipelinePeriod,
  windows?: { shortDays?: number; longDays?: number },
): boolean {
  if (!createdAt) return false;
  const at = new Date(createdAt).getTime();
  if (Number.isNaN(at)) return false;
  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return at >= start.getTime();
  }
  const days = period === "7d" ? (windows?.shortDays ?? 7) : (windows?.longDays ?? 30);
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
    contactId: signal.contact?.id,
    name: p.name,
    role: p.jobTitle,
    companyName: p.company,
    icpScore: p.icpScore, // fehlt → undefined → Ring unsichtbar
    heatStatus: p.heatStatus, // immer contacts.heat_status; fehlt → undefined → Badge unsichtbar (kein Fake)
    actionText: resolveSignalText(signal, t),
    channelLabelKey: meta.channelLabelKey,
    channelIcon: meta.icon,
    // Profilzeile: „vor X Tagen" IMMER aus contacts.last_contacted_at (Single Source) — nie Signal-Alter („6d").
    timeAgo: lastContactedLabel(signal.contact, t),
    stage: contactActiveStage(signal.contact, stageNameBySlug),
  };
}

// ── Pipeline-Task-Karten (Stagniert · Keine Task) ────────────────────────────
// Aus rohen getDeals-Rows abgeleitet (stagnation_days + tasks-Embed). Identität/Heat/ICP
// zentral über contactToProfile; Stage-Label über stageNameBySlug (deal.stage → Anzeige).
export type StagnatedCardItem = {
  dealId: string;
  contactId?: string;
  name: string;
  jobTitle: string;
  companyName: string;
  initials: string;
  icpScore?: number;
  heatStatus?: HeatStatus;
  stageLabel?: string;        // deal.stage → Anzeigename; fehlt → kein Badge
  stagnationDays: number;     // deal.stagnation_days (Action-Streifen — NICHT die Profilzeilen-Zeit)
  lastContactedAt: string | null; // contacts.last_contacted_at → Profilzeile „vor X Tagen" (Single Source)
};

export function dealToStagnatedCard(
  deal: Record<string, any>,
  stageNameBySlug: Record<string, string> = {},
): StagnatedCardItem {
  const p = contactToProfile(deal.contact);
  return {
    dealId: deal.id,
    contactId: deal.contact?.id,
    name: p.name,
    jobTitle: p.jobTitle,
    companyName: p.company,
    initials: p.initials,
    icpScore: p.icpScore,
    heatStatus: p.heatStatus,
    stageLabel: stageNameBySlug[deal.stage] ?? undefined,
    stagnationDays: deal.stagnation_days ?? 0,
    lastContactedAt: deal.contact?.last_contacted_at ?? null,
  };
}

// „Keine Task" ist KONTAKT-zentriert (nicht Deal-zentriert): eine Kachel pro Kontakt,
// der ≥1 aktiven Deal hat und auf KEINEM dieser Deals eine offene Task. Die Kachel listet
// alle aktiven Deals des Kontakts (eine Task deckt alle ab — SDR denkt in Personen).
export type NoTaskDealRef = { name: string; stageLabel?: string; stagnationDays: number };
export type NoTaskCardItem = {
  contactId: string;
  name: string;
  jobTitle: string;
  companyName: string;
  initials: string;
  icpScore?: number;
  heatStatus?: HeatStatus;
  lastContactedAt: string | null; // contacts.last_contacted_at → „Letzter Kontakt vor X"; null → unsichtbar
  deals: NoTaskDealRef[];          // alle aktiven Deals des Kontakts (für die kompakte Deals-Zeile)
};

export function contactToNoTaskCard(
  contact: Record<string, any>,
  deals: Record<string, any>[],
  stageNameBySlug: Record<string, string> = {},
): NoTaskCardItem {
  const p = contactToProfile(contact);
  return {
    contactId: contact.id,
    name: p.name,
    jobTitle: p.jobTitle,
    companyName: p.company,
    initials: p.initials,
    icpScore: p.icpScore,
    heatStatus: p.heatStatus,
    lastContactedAt: contact.last_contacted_at ?? null,
    deals: deals.map((d) => ({
      name: d.name,
      stageLabel: stageNameBySlug[d.stage] ?? undefined,
      stagnationDays: d.stagnation_days ?? 0,
    })),
  };
}

// ── Kommunikation (036) ──────────────────────────────────────────────────────
// DB-Row aus `communications` → View für den Kommunikations-Tab. Schmal: manuell
// protokollierte Touchpoints tragen nur Kanal/Richtung/Zeit/Notiz (keine Mock-Rich-Felder).
export type CommunicationChannel = "email" | "linkedin" | "call" | "meeting";
export type CommunicationDirection = "outbound" | "inbound";

export interface CommunicationView {
  id: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  occurredAt: string; // ISO
  note?: string;      // fehlt → kein Notiz-Body (kein Fake)
}

export function communicationToView(row: Record<string, any>): CommunicationView {
  return {
    id: String(row.id),
    channel: row.channel as CommunicationChannel,
    direction: row.direction as CommunicationDirection,
    occurredAt: String(row.occurred_at),
    note: row.note ?? undefined,
  };
}

// ── Action-Opener (Signal · Kalt) ────────────────────────────────────────────
// Daten für SignalActionDrawer / ContactColdDrawer. Echte Felder aus Kontakt/Signal;
// AI-Felder (Empfehlung/Draft/Confidence/Reaktionsfenster) bleiben NULL → die Panels
// zeigen einen ehrlichen „Folgt"-Platzhalter (AI-Pipeline siehe PROGRESS [D5]). Kein Fake-Text.
export const AI_PENDING_LABEL = "[D5] KI-Empfehlung folgt";

export interface SignalActionData {
  name: string;
  company: string;
  avatarUrl?: string;
  icpScore?: number;            // fehlt → Badge ausgeblendet
  actionText: string;
  timeAgoLabel: string;
  timeLeftHours?: number | null; // null → Reaktionsfenster ausgeblendet
  windowHours?: number | null;
  commentText?: string;
  aiRecommendation: string;     // Platzhalter, bis AI-Pipeline da ist
  confidence?: number | null;   // null → „Folgt"-Badge statt „X% sicher"
  draft?: string | null;        // null → kein Entwurf, „Draft generieren" disabled
}

/** Echtes Signal → SignalActionData. AI-Felder = ehrliche Platzhalter ([D5]). */
export function signalToActionData(
  signal: Record<string, any>,
  t: (key: string, opts?: Record<string, unknown>) => string,
): SignalActionData {
  const p = contactToProfile(signal.contact);
  return {
    name: p.name,
    company: p.company,
    avatarUrl: p.avatarUrl,
    icpScore: p.icpScore,
    actionText: resolveSignalText(signal, t),
    timeAgoLabel: relTimeShort(signal.created_at),
    timeLeftHours: null, // Reaktionsfenster-Logik fehlt → ausgeblendet
    windowHours: null,
    aiRecommendation: AI_PENDING_LABEL,
    confidence: null,
    draft: null,
  };
}

export interface ColdPersonData {
  name: string;
  company: string;
  avatarUrl?: string;
  lastContactDays: number | null;        // aus last_contacted_at; null → ausgeblendet
  lastContactChannel?: string | null;    // aus letztem communications-Eintrag (Embed fehlt → null)
  lastConversationSentiment?: string | null;
  aiRecommendation: string;              // Platzhalter ([D5])
  confidence?: number | null;
  tags?: string[];
  draft?: string | null;
}

/** Kalter Kontakt → ColdPersonData. AI-Felder = ehrliche Platzhalter ([D5]). */
export function contactToColdPerson(contact: Record<string, any>): ColdPersonData {
  const p = contactToProfile(contact);
  const lc = contact?.last_contacted_at
    ? Math.max(0, Math.floor((Date.now() - new Date(contact.last_contacted_at).getTime()) / 86_400_000))
    : null;
  return {
    name: p.name,
    company: p.company,
    avatarUrl: p.avatarUrl,
    lastContactDays: lc,
    lastContactChannel: null, // getContacts embeddet keine communications → ausgeblendet (Honesty)
    lastConversationSentiment: null,
    aiRecommendation: AI_PENDING_LABEL,
    confidence: null,
    tags: [],
    draft: null,
  };
}

// ── Hunter-Übersicht: Dringlichkeits-Score (zentrale Priorisierung) ───────────
// Client-seitig aus rawDeals + signals berechnet. ALLE Gewichte aus
// settings.thresholds.hunter_priority_weights (nie hardcodiert) — Defaults nur Fallback.
// Score = (Basis-Punkte + Zeitdruck-Bonus) × ARR-Mult × ICP-Mult. Mehrere Signale addieren.
export type PriorityWeights = {
  linkedin_signal: number; overdue_task: number; stagnated: number; going_cold: number; no_task: number;
  arr_high_threshold: number; arr_mid_threshold: number; arr_high_mult: number; arr_mid_mult: number;
  icp_high_threshold: number; icp_mid_threshold: number; icp_high_mult: number; icp_mid_mult: number;
  overdue_bonus_days: number; overdue_bonus_points: number; stagnated_double_bonus: number;
  signal_age_penalty_per_day: number;
};

export const PRIORITY_WEIGHTS_DEFAULT: PriorityWeights = {
  linkedin_signal: 40, overdue_task: 35, stagnated: 30, going_cold: 25, no_task: 20,
  arr_high_threshold: 100000, arr_mid_threshold: 50000, arr_high_mult: 1.5, arr_mid_mult: 1.2,
  icp_high_threshold: 80, icp_mid_threshold: 60, icp_high_mult: 1.3, icp_mid_mult: 1.1,
  overdue_bonus_days: 3, overdue_bonus_points: 10, stagnated_double_bonus: 15,
  signal_age_penalty_per_day: 5,
};

/** Aktive Signal-Schlüssel (für Tooltip + Sortier-Nachweis). */
export type PrioritySignalKey = "linkedin_signal" | "overdue_task" | "stagnated" | "going_cold" | "no_task";
export type PriorityResult = { score: number; signals: PrioritySignalKey[]; arr: number; icpScore?: number };

const PRIORITY_DAY_MS = 86_400_000;

/**
 * calculatePriorityScore — Dringlichkeit eines Kontakts aus seinen aktiven Deals + Signalen.
 * `deals` = aktive (nicht-terminale) Deals des Kontakts (mit `tasks(*)`-Embed). `signals` =
 * Signal-Rows des Kontakts (created_at für Alter). Heat über contactToProfile (Single Source,
 * kein Roh-`heat_status`). `now` injizierbar (Tests). Score 0 → Kontakt erscheint nicht.
 */
export function calculatePriorityScore(
  contact: Record<string, any>,
  deals: Record<string, any>[],
  signals: Record<string, any>[],
  weights: Partial<PriorityWeights> | null | undefined,
  stagnationBySlug: Record<string, number | null | undefined> = {},
  now: number = Date.now(),
): PriorityResult {
  const w = { ...PRIORITY_WEIGHTS_DEFAULT, ...(weights ?? {}) };
  const p = contactToProfile(contact);
  const active: PrioritySignalKey[] = [];
  let base = 0;
  let bonus = 0;

  // Signal-Alter: frischestes Signal. < 24h → Hot-Punkte; sonst Alters-Malus pro Tag.
  const sigTimes = signals
    .map((s) => new Date(s.created_at ?? s.occurred_at ?? 0).getTime())
    .filter((tms) => !Number.isNaN(tms) && tms > 0);
  if (sigTimes.length) {
    const ageH = (now - Math.max(...sigTimes)) / 3_600_000;
    if (ageH < 24) { base += w.linkedin_signal; active.push("linkedin_signal"); }
    else { bonus -= Math.floor(ageH / 24) * w.signal_age_penalty_per_day; }
  }

  // Offene Tasks über alle Deals des Kontakts (completed_at & deleted_at NULL).
  const openTasks = deals.flatMap((d) =>
    ((d.tasks as Record<string, any>[]) ?? []).filter((tk) => tk.completed_at == null && tk.deleted_at == null));
  const overdue = openTasks.filter((tk) => tk.due_at && new Date(tk.due_at).getTime() < now);
  if (overdue.length) {
    base += w.overdue_task; active.push("overdue_task");
    const maxDays = Math.max(...overdue.map((tk) => Math.floor((now - new Date(tk.due_at).getTime()) / PRIORITY_DAY_MS)));
    if (maxDays > w.overdue_bonus_days) bonus += w.overdue_bonus_points;
  }

  // Stagnation: Deal über Stage-Schwelle. Doppelte Schwelle → Extra-Bonus.
  const stagnated = deals.filter((d) => (d.stagnation_days ?? 0) >= (stagnationBySlug[d.stage] ?? 7));
  if (stagnated.length) {
    base += w.stagnated; active.push("stagnated");
    if (stagnated.some((d) => (d.stagnation_days ?? 0) >= 2 * (stagnationBySlug[d.stage] ?? 7))) bonus += w.stagnated_double_bonus;
  }

  // Wird kalt (Heat COLD/DEAD) — Single Source über contactToProfile.
  if (p.heatStatus === "COLD" || p.heatStatus === "DEAD") { base += w.going_cold; active.push("going_cold"); }

  // Aktiver Deal, aber keine offene Task.
  if (deals.length && openTasks.length === 0) { base += w.no_task; active.push("no_task"); }

  // Multiplikatoren: ARR (Σ aktiver Deal-Werte in €) + ICP. Beide multiplizieren.
  const arr = deals.reduce((sum, d) => sum + (typeof d.value === "number" ? d.value : 0), 0) / 100;
  const arrMult = arr > w.arr_high_threshold ? w.arr_high_mult : arr > w.arr_mid_threshold ? w.arr_mid_mult : 1;
  const icp = p.icpScore;
  const icpMult = icp != null && icp > w.icp_high_threshold ? w.icp_high_mult
    : icp != null && icp > w.icp_mid_threshold ? w.icp_mid_mult : 1;

  const score = Math.max(0, Math.round((base + bonus) * arrMult * icpMult));
  return { score, signals: active, arr, icpScore: icp };
}

// ── Farmer-Übersicht: Top-5-Priorisierung (Pendant zu calculatePriorityScore, über KUNDEN) ──
// Geld-Logik (PROGRESS [D47] „Farmer Übersicht Top-5"): verlorenes Geld (gekündigt) > bedrohtes
// Geld (churn) > kühlende Beziehung (kalt) > Wachstumschance (upsell) > Routine (Task).
// ADDITIV + Honesty: churn_score/upsell_score NULL → Signal inaktiv (kein Fehler). Heute laufen
// 3 Signale (cancelled/going_cold/overdue_task), nach dem Score-Slice automatisch 5.
export type FarmerPrioritySignal = "cancelled" | "churn_risk" | "going_cold" | "upsell" | "overdue_task";

/** Dominanz-Reihenfolge (Index 0 = wichtigster) → bestimmt die Render-Kachel + Primär-Sortierung. */
export const FARMER_SIGNAL_ORDER: FarmerPrioritySignal[] = [
  "cancelled", "churn_risk", "going_cold", "upsell", "overdue_task",
];

export type FarmerPriorityWeights = {
  cancelled: number; churn_risk: number; going_cold: number; upsell: number; overdue_task: number;
  churn_threshold: number; upsell_threshold: number;
};
// Defaults nur Fallback — Override via settings.thresholds.farmer_priority_weights (wenn geseedet).
export const FARMER_PRIORITY_WEIGHTS_DEFAULT: FarmerPriorityWeights = {
  cancelled: 50, churn_risk: 40, going_cold: 30, upsell: 20, overdue_task: 10,
  churn_threshold: 61, upsell_threshold: 70,
};

export type FarmerPriorityResult = {
  score: number;                          // Σ aktiver Signal-Gewichte (Tiebreaker, NIE als Badge)
  signals: FarmerPrioritySignal[];        // ALLE aktiven Signale (Scoring/Top-5; ungefiltert)
  displaySignals: FarmerPrioritySignal[]; // Anzeige-Signale nach Vorrang-Regel (Retention vor Expansion)
  dominantSignal: FarmerPrioritySignal | null; // höchstpriorisiertes aktives Signal → Kachel-Wahl
  mrr: number;                            // mrr_monthly (Cent) für Tiebreaker (mehr Umsatz = wichtiger)
  churnScore?: number;
  upsellScore?: number;
};

/**
 * INVARIANTE Churn-Vorrang: Bei aktivem Churn Risk ODER Gekündigt wird Upsell als
 * Handlungsempfehlung unterdrückt (Retention vor Expansion — man verkauft keinem Kunden
 * mehr, der gerade abwandert). Single Source für Panel UND Kachel-Ebene. Scoring (`signals`/
 * `score`/`dominantSignal`) bleibt unberührt; nur die ANZEIGE filtert.
 * [D51] Konfig-Prinzip: die Regel-LOGIK bleibt hier (Single Source), nur der SCHALTER
 * `churnSuppressesUpsell` kommt aus settings (`thresholds.churn_suppresses_upsell`, Default true,
 * laufzeit-gelesen) — so kann der Chat sie pro Org abschalten, ohne Code. Default true = aktueller Stand.
 */
export function applyFarmerDisplayPrecedence(active: FarmerPrioritySignal[], churnSuppressesUpsell = true): FarmerPrioritySignal[] {
  if (!churnSuppressesUpsell) return active; // Org hat den Vorrang abgeschaltet → nichts filtern
  const retentionActive = active.includes("cancelled") || active.includes("churn_risk");
  return active.filter((s) => !(s === "upsell" && retentionActive));
}

/**
 * calculateFarmerPriority — Dringlichkeit eines Bestandskunden aus seinen Farmer-Signalen.
 * `customer` = gemappte Kunden-Sicht (customerRowToView). `hasOverdueTask` extern (Tasks hängen
 * nicht am Customer). NULL-Scores → Signal inaktiv (Honesty). score 0 / dominantSignal null →
 * Kunde erscheint nicht im Top-5.
 */
export function calculateFarmerPriority(
  customer: Customer,
  weights?: Partial<FarmerPriorityWeights> | null,
  opts?: { hasOverdueTask?: boolean; churnSuppressesUpsell?: boolean },
): FarmerPriorityResult {
  const w = { ...FARMER_PRIORITY_WEIGHTS_DEFAULT, ...(weights ?? {}) };
  const active: FarmerPrioritySignal[] = [];
  let score = 0;

  // 1. Gekündigt — Subscription churned (verlorenes Geld).
  if (customer.sherloqStatus === "CANCELLED") { active.push("cancelled"); score += w.cancelled; }
  // 2. Churn Risk — churn_score ≥ Schwelle. NULL → inaktiv (kein Fehler).
  if (typeof customer.churnScore === "number" && customer.churnScore >= w.churn_threshold) { active.push("churn_risk"); score += w.churn_risk; }
  // 3. Kunde wird kalt — Heat COLD.
  if (customer.heatStatus === "COLD") { active.push("going_cold"); score += w.going_cold; }
  // 4. Upsell — upsell_score ≥ Schwelle. NULL → inaktiv.
  if (typeof customer.upsellScore === "number" && customer.upsellScore >= w.upsell_threshold) { active.push("upsell"); score += w.upsell; }
  // 5. Fällige Task — extern ermittelt (Tasks nicht am Customer-Embed).
  if (opts?.hasOverdueTask) { active.push("overdue_task"); score += w.overdue_task; }

  const dominantSignal = FARMER_SIGNAL_ORDER.find((s) => active.includes(s)) ?? null;
  return { score, signals: active, displaySignals: applyFarmerDisplayPrecedence(active, opts?.churnSuppressesUpsell ?? true), dominantSignal, mrr: customer.mrrMonthly ?? 0, churnScore: customer.churnScore, upsellScore: customer.upsellScore };
}
