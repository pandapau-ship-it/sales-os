/**
 * signalActions — Phase-0-Vorbereitung für dynamische Signal-Action-Rules ([D35]).
 *
 * HEUTE: EIN hardcodierter Resolver (`signalActionConfig`) statt Inline-Config im Drawer.
 * ZIEL (Phase 1, [D35]): derselbe Resolver liest seine Regeln aus der DB
 * (`signal_action_rules`) statt aus dieser Datei — die Render-Schicht (`ChatActionPanel`)
 * bleibt dabei unverändert. Nur die Datenquelle des Resolvers wird getauscht.
 *
 * Disziplin (der eigentliche Sinn von Phase 0): Actions werden über **serialisierbare
 * String-Keys** (`SignalActionType`) referenziert, NICHT als anonyme Closures. Die konkreten
 * Handler werden erst beim Dispatch gebunden (`handlers`-Argument). So ist der spätere Sprung
 * zu DB-Regeln (gespeicherter `action_type`-String → Handler-Registry) trivial — kein Umbau
 * der Render-Schicht nötig.
 */
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import type { ChatActionConfig, ChatPanelAction } from "@/components/features/hunter/ChatActionPanel";
import type { SignalActionData } from "@/lib/hunterMappers";

/** Katalog möglicher Signal-Actions (serialisierbar). Wächst mit Sending-Layer/AI-Pipeline. */
export type SignalActionType = "send_linkedin" | "create_task";

interface ActionCatalogEntry {
  label: string;
  icon: ReactNode;
  primary?: boolean;
  toast: string;
}

/** Serialisierbare Meta je Action-Type (kein `run` — Handler kommt beim Dispatch). */
export const SIGNAL_ACTION_CATALOG: Record<SignalActionType, ActionCatalogEntry> = {
  send_linkedin: { label: "Auf LinkedIn senden", icon: <ArrowUpRight className="w-3.5 h-3.5" />, primary: true, toast: "Auf LinkedIn gesendet" },
  create_task:   { label: "Als Task planen",     icon: <ArrowUpRight className="w-3.5 h-3.5" />, toast: "Task erstellt" },
};

/** Beim Dispatch gebundene Handler je Action-Type (Closures bleiben hier — nie in Config/DB). */
export interface SignalActionHandlers {
  send_linkedin?: (body: string) => void;
  create_task?: () => void;
}

/** Action-Type-Liste → fertige `ChatPanelAction[]` (Katalog-Meta + gebundener `run`). */
function buildActions(types: SignalActionType[], handlers: SignalActionHandlers): ChatPanelAction[] {
  const runFor: Record<SignalActionType, ChatPanelAction["run"]> = {
    send_linkedin: handlers.send_linkedin,
    create_task: handlers.create_task ? () => handlers.create_task!() : undefined,
  };
  return types.map((type) => ({ ...SIGNAL_ACTION_CATALOG[type], run: runFor[type] }));
}

/**
 * signalActionConfig — Signal → `ChatActionConfig`. HEUTE eine hardcodierte Regel
 * (LinkedIn-Signal); SPÄTER aus `signal_action_rules` ([D35]). AI-Felder bleiben ehrliche
 * Platzhalter bis zur AI-Pipeline ([D5]).
 */
export function signalActionConfig(
  signal: SignalActionData | null,
  handlers: SignalActionHandlers,
): ChatActionConfig | null {
  if (!signal) return null;

  const handle = `in/${signal.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join("")}`;
  const hasDraft = !!signal.draft;
  // Hardcodierte Regel (Phase 0): mit Entwurf → Senden + Task; ohne → keine Send-Action
  // (Send braucht echten Draft → erst mit AI-Pipeline). „Als Task planen" geht über den Footer.
  const actionTypes: SignalActionType[] = hasDraft ? ["send_linkedin", "create_task"] : [];

  return {
    person: { name: signal.name, company: signal.company, avatarUrl: signal.avatarUrl },
    headerBadge: signal.icpScore != null
      ? { label: `ICP: ${signal.icpScore}`, tone: "success" }
      : { label: "Signal", tone: "info" },
    statusDotTone: "info",
    banner: {
      tone: "info",
      icon: <LinkedinIcon className="w-3 h-3" />,
      label: "LinkedIn Signal",
      text: `${signal.actionText} · vor ${signal.timeAgoLabel}`
        + (signal.timeLeftHours != null ? ` · ${signal.timeLeftHours}h Reaktionsfenster` : ""),
    },
    recommendation: { text: signal.aiRecommendation, confidence: signal.confidence ?? null },
    draft: signal.draft ? { channel: "linkedin", to: handle, body: signal.draft } : null,
    intro: hasDraft
      ? "Starkes Signal — ich habe eine passende LinkedIn-Nachricht vorbereitet:"
      : "Starkes Signal. Ein KI-Antwortentwurf folgt mit der AI-Pipeline — du kannst jetzt schon eine Task planen:",
    outro: hasDraft ? "Du kannst sie direkt senden, anpassen oder mir sagen, was ich ändern soll." : undefined,
    actions: buildActions(actionTypes, handlers),
  };
}
