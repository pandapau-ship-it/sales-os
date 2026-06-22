import { ArrowUpRight } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import { ChatActionPanel } from '@/components';
import type { ChatActionConfig } from '@/components';
import type { SignalActionData } from '@/lib/hunterMappers';

// Single-Source des Typs liegt in hunterMappers (mit `signalToActionData`); hier re-exportiert,
// damit Bestandsimporte über `@/components` weiter funktionieren.
export type { SignalActionData } from '@/lib/hunterMappers';

interface SignalActionDrawerProps {
  signal: SignalActionData | null;
  onClose: () => void;
  onApply?: (draft: string) => void;
  onEdit?: () => void;
  onIgnore?: () => void;
  onCreateTask?: () => void;
}

/**
 * SignalActionDrawer — Action Panel für LinkedIn-Signale (ChatActionPanel-Basis). Echte Felder
 * (Name/Firma/ICP/Aktionstext/Zeit) kommen aus `signalToActionData`. AI-Felder (Empfehlung/Draft/
 * Confidence/Reaktionsfenster) sind NULL → das Panel zeigt einen ehrlichen „Folgt"-Platzhalter
 * statt erfundenem Text (AI-Pipeline siehe PROGRESS [D5]).
 */
export default function SignalActionDrawer({
  signal,
  onClose,
  onApply,
  onCreateTask,
}: SignalActionDrawerProps) {
  const handle = signal
    ? `in/${signal.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join("")}`
    : "";
  const hasDraft = !!signal?.draft;

  const config: ChatActionConfig | null = signal
    ? {
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
        draft: signal.draft
          ? { channel: "linkedin", to: handle, body: signal.draft }
          : null,
        intro: hasDraft
          ? "Starkes Signal — ich habe eine passende LinkedIn-Nachricht vorbereitet:"
          : "Starkes Signal. Ein KI-Antwortentwurf folgt mit der AI-Pipeline — du kannst jetzt schon eine Task planen:",
        outro: hasDraft ? "Du kannst sie direkt senden, anpassen oder mir sagen, was ich ändern soll." : undefined,
        // Send-Aktionen brauchen einen echten Entwurf → erst mit AI-Pipeline. „Als Task planen" geht immer.
        actions: hasDraft
          ? [
              { label: "Auf LinkedIn senden", icon: <ArrowUpRight className="w-3.5 h-3.5" />, primary: true, toast: "Auf LinkedIn gesendet", run: onApply },
              { label: "Als Task planen", icon: <ArrowUpRight className="w-3.5 h-3.5" />, toast: "Task erstellt", run: () => onCreateTask?.() },
            ]
          : [],
      }
    : null;

  return <ChatActionPanel open={signal !== null} config={config} onClose={onClose} />;
}
