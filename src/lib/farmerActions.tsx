/**
 * farmerActions — Farmer-Pendant zu `signalActions.tsx` (D35 Phase-0-Muster) für die Farmer
 * Action Panels ([D34]). Baut aus einem Farmer-Signal eine `ChatActionConfig` für den
 * **unveränderten** Renderer `ChatActionPanel`.
 *
 * Disziplin (wie D35): Actions werden über **serialisierbare String-Keys** (`FarmerActionType`)
 * referenziert, NICHT als anonyme Closures — die Handler werden erst beim Dispatch gebunden
 * (`handlers`-Argument). So ist der spätere Sprung zu DB-Regeln (`signal_action_rules`, [D35]
 * Phase 1) trivial: gespeicherter `action_type`-String → Handler-Registry, kein Umbau der
 * Render-Schicht.
 *
 * HONESTY / Renderer-Vertrag (Option A): die KI-Felder (`recommendation`, `draft`) bleiben NULL
 * → das Panel zeigt einen ehrlichen „Folgt"-Platzhalter (kein Fake-Text), exakt wie Hunter heute.
 * Der Renderer blendet die Action-Buttons NUR bei vorhandenem echten Draft ein. Darum sind die
 * Actions hier **im Katalog bereits vollständig definiert** und werden je Signal-Typ
 * zusammengestellt — sie sind nur noch nicht sichtbar (warten auf den Draft) und erscheinen
 * **automatisch für Hunter UND Farmer**, sobald die AI-Pipeline ([D5]) einen Entwurf liefert.
 */
import type { ReactNode } from "react";
import { AlertTriangle, Snowflake, Zap, XCircle, Send, Phone, CheckSquare, Calendar } from "lucide-react";
import type { ChatActionConfig, ChatPanelAction } from "@/components/features/hunter/ChatActionPanel";
import { AI_PENDING_LABEL } from "@/lib/hunterMappers";

/** Farmer-Signal-Typen mit Action Panel ([D34]). Slice 1: churn_risk · going_cold. Slice 2: upsell_potential · cancelled. */
export type FarmerSignalKind = "churn_risk" | "going_cold" | "upsell_potential" | "cancelled";

/** Katalog möglicher Farmer-Actions (serialisierbar, DB-ready). Wächst mit Sending-Layer/AI-Pipeline. */
export type FarmerActionType =
  | "retention_message"
  | "reactivation_message"
  | "upsell_message"
  | "winback_call"
  | "create_task"
  | "snooze";

interface ActionCatalogEntry {
  label: string;
  icon: ReactNode;
  primary?: boolean;
  toast: string;
}

/** Serialisierbare Meta je Action-Type (kein `run` — Handler kommt beim Dispatch). */
export const FARMER_ACTION_CATALOG: Record<FarmerActionType, ActionCatalogEntry> = {
  retention_message:    { label: "Retention-Nachricht senden", icon: <Send className="w-3.5 h-3.5" />, primary: true, toast: "Retention-Nachricht gesendet" },
  reactivation_message: { label: "Reaktivierung senden",       icon: <Send className="w-3.5 h-3.5" />, primary: true, toast: "Reaktivierung gesendet" },
  upsell_message:       { label: "Upsell-Pitch senden",        icon: <Send className="w-3.5 h-3.5" />, primary: true, toast: "Upsell-Pitch gesendet" },
  winback_call:         { label: "Anruf protokollieren",       icon: <Phone className="w-3.5 h-3.5" />, primary: true, toast: "Anruf protokolliert" },
  create_task:          { label: "Task planen",                icon: <CheckSquare className="w-3.5 h-3.5" />, toast: "Task erstellt" },
  snooze:               { label: "Auf später (Snooze)",        icon: <Calendar className="w-3.5 h-3.5" />, toast: "Auf später verschoben" },
};

/** Beim Dispatch gebundene Handler je Action-Type (Closures bleiben hier — nie in Config/DB). */
export interface FarmerActionHandlers {
  retention_message?: (body: string) => void;
  reactivation_message?: (body: string) => void;
  upsell_message?: (body: string) => void;
  winback_call?: () => void;
  create_task?: () => void;
  snooze?: () => void;
}

/** Farmer-Signal-Datensatz (Mock bis Farmer-DB-Wiring; KI-Felder NULL bis AI-Pipeline [D5]). */
export interface FarmerActionData {
  kind: FarmerSignalKind;
  name: string;
  company: string;
  avatarUrl?: string;
  icpScore?: number;
  // churn_risk-Treiber
  churnScore?: number;
  lastLoginDays?: number;
  usageDropPct?: number;
  // going_cold (nur „Kunde wird kalt")
  lastContactDays?: number;
  // upsell_potential-Treiber
  seatUtilizationPct?: number;
  featureUsageUp?: boolean;
  nps?: number;
  // cancelled-Kontext
  cancelledDate?: string;
  cancelReason?: string;
  // KI-Felder — NULL bis AI-Pipeline [D5]
  aiRecommendation?: string;
  draft?: string | null;
  confidence?: number | null;
}

/** Action-Type-Liste → fertige `ChatPanelAction[]` (Katalog-Meta + gebundener `run`). */
function buildActions(types: FarmerActionType[], handlers: FarmerActionHandlers): ChatPanelAction[] {
  const runFor: Record<FarmerActionType, ChatPanelAction["run"]> = {
    retention_message: handlers.retention_message,
    reactivation_message: handlers.reactivation_message,
    upsell_message: handlers.upsell_message,
    winback_call: handlers.winback_call ? () => handlers.winback_call!() : undefined,
    create_task: handlers.create_task ? () => handlers.create_task!() : undefined,
    snooze: handlers.snooze ? () => handlers.snooze!() : undefined,
  };
  return types.map((type) => ({ ...FARMER_ACTION_CATALOG[type], run: runFor[type] }));
}

/** Pro Signal-Typ: Badge/Banner/Tone/Intro + Action-Types (nur mit Draft → erscheinen mit [D5]). */
function specFor(signal: FarmerActionData): {
  tone: "urgent" | "cold" | "success";
  label: string;
  icon: ReactNode;
  bannerText: string;
  intro: string;
  draftTypes: FarmerActionType[]; // Actions, sobald ein KI-Draft existiert
} {
  const join = (parts: (string | null)[], fallback: string) => parts.filter(Boolean).join(" · ") || fallback;
  switch (signal.kind) {
    case "churn_risk":
      return {
        tone: "urgent", label: "Churn Risk", icon: <AlertTriangle className="w-3 h-3" />,
        bannerText: join([
          signal.churnScore != null ? `Churn-Score ${signal.churnScore}` : null,
          signal.lastLoginDays != null ? `Login vor ${signal.lastLoginDays} Tagen` : null,
          signal.usageDropPct != null ? `Usage −${signal.usageDropPct}%` : null,
        ], "Churn-Risiko erkannt"),
        intro: "Dieser Kunde zeigt Churn-Signale. Ein KI-Retention-Entwurf folgt mit der AI-Pipeline:",
        draftTypes: ["retention_message", "create_task", "snooze"],
      };
    case "going_cold":
      return {
        tone: "cold", label: "Kunde wird kalt", icon: <Snowflake className="w-3 h-3" />,
        bannerText: signal.lastContactDays != null ? `Letzter Kontakt vor ${signal.lastContactDays} Tagen` : "Kunde wird kalt",
        intro: "Der Kunde wird kalt. Ein KI-Reaktivierungsentwurf folgt mit der AI-Pipeline:",
        draftTypes: ["reactivation_message", "snooze"],
      };
    case "upsell_potential":
      return {
        tone: "success", label: "Upsell Potential", icon: <Zap className="w-3 h-3" />,
        bannerText: join([
          signal.seatUtilizationPct != null ? `Seat-Auslastung ${signal.seatUtilizationPct}%` : null,
          signal.featureUsageUp ? "Feature-Nutzung gestiegen" : null,
          signal.nps != null ? `NPS ${signal.nps}` : null,
        ], "Upsell-Potenzial erkannt"),
        intro: "Dieser Kunde zeigt Upsell-Signale. Ein KI-Pitch-Entwurf folgt mit der AI-Pipeline:",
        draftTypes: ["upsell_message", "create_task"],
      };
    case "cancelled":
      return {
        tone: "urgent", label: "Gekündigt", icon: <XCircle className="w-3 h-3" />,
        bannerText: join([
          signal.cancelledDate ? `Kündigung zum ${signal.cancelledDate}` : null,
          signal.cancelReason ?? null,
        ], "Vertrag gekündigt"),
        intro: "Der Kunde hat gekündigt — am besten persönlich anrufen (Win-Back). Ein KI-Gesprächsleitfaden folgt mit der AI-Pipeline:",
        // Gekündigt = anrufen, keine Nachricht → kein Draft; Actions sind dennoch DB-ready im Katalog.
        draftTypes: ["winback_call", "create_task"],
      };
  }
}

/**
 * farmerActionConfig — Farmer-Signal → `ChatActionConfig`. HEUTE hardcodierte Regeln je `kind`
 * (siehe `specFor`); SPÄTER aus `signal_action_rules` ([D35]). Banner-Text nur aus echten Werten
 * (Honesty). Action-Types werden — wie bei Hunter — nur mit echtem Draft zusammengestellt
 * (`hasDraft`), damit sie automatisch mit der AI-Pipeline ([D5]) erscheinen.
 */
export function farmerActionConfig(
  signal: FarmerActionData | null,
  handlers: FarmerActionHandlers,
): ChatActionConfig | null {
  if (!signal) return null;

  const spec = specFor(signal);
  const handle = `in/${signal.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join("")}`;
  const hasDraft = !!signal.draft;

  return {
    person: { name: signal.name, company: signal.company, avatarUrl: signal.avatarUrl },
    headerBadge: { label: spec.label, tone: spec.tone },
    statusDotTone: spec.tone,
    banner: { tone: spec.tone, icon: spec.icon, label: spec.label, text: spec.bannerText },
    recommendation: { text: signal.aiRecommendation ?? AI_PENDING_LABEL, confidence: signal.confidence ?? null },
    draft: signal.draft ? { channel: "linkedin", to: handle, body: signal.draft } : null,
    intro: spec.intro,
    outro: hasDraft ? "Du kannst sie direkt senden, anpassen oder mir sagen, was ich ändern soll." : undefined,
    actions: buildActions(hasDraft ? spec.draftTypes : [], handlers),
  };
}
