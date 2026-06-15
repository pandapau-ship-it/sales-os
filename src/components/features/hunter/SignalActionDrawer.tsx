import { Send, ArrowUpRight } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import ChatActionPanel from "@/components/features/hunter/ChatActionPanel";
import type { ChatActionConfig } from "@/components/features/hunter/ChatActionPanel";

/** Reine Daten von außen — das Panel hält keinen eigenen Datenzustand. */
export interface SignalActionData {
  name: string;
  company: string;
  avatarUrl?: string;
  icpScore: number;
  actionText: string;
  timeAgoLabel: string;
  timeLeftHours: number;
  windowHours: number;
  commentText?: string;
  aiRecommendation: string;
  confidence?: number;
}

interface SignalActionDrawerProps {
  signal: SignalActionData | null;
  /** Vorbefüllter AI-Entwurf (Phase 3: aus messages, status='draft'). */
  initialDraft?: string;
  onClose: () => void;
  onApply?: (draft: string) => void;
  onEdit?: () => void;
  onIgnore?: () => void;
  onCreateTask?: () => void;
}

/**
 * SignalActionDrawer — Action Panel für LinkedIn-Signale. Nutzt die gemeinsame
 * ChatActionPanel-Basis (identischer Aufbau/Design/Breite wie alle Action-Panels),
 * hier mit vorgefertigter LinkedIn-Nachricht passend zum Signal.
 */
export default function SignalActionDrawer({
  signal,
  initialDraft,
  onClose,
  onApply,
  onCreateTask,
}: SignalActionDrawerProps) {
  const config: ChatActionConfig | null = signal
    ? ((): ChatActionConfig => {
        const fn = signal.name.split(" ")[0];
        const handle = `in/${signal.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join("")}`;
        return {
          person: { name: signal.name, company: signal.company, avatarUrl: signal.avatarUrl },
          headerBadge: { label: `ICP: ${signal.icpScore}`, tone: "success" },
          statusDotTone: "info",
          banner: {
            tone: "info",
            icon: <LinkedinIcon className="w-3 h-3" />,
            label: "LinkedIn Signal",
            text: `${signal.actionText} · vor ${signal.timeAgoLabel} · ${signal.timeLeftHours}h Reaktionsfenster`,
          },
          recommendation: { text: signal.aiRecommendation, confidence: signal.confidence ?? 91 },
          draft: {
            channel: "linkedin",
            to: handle,
            body:
              initialDraft ??
              `Hi ${fn}, dein Beitrag passt genau zu unserem Thema — Sherloq verkürzt die BDR-Ramp-up-Zeit spürbar. Magst du dich diese Woche 15 Min kurz austauschen?`,
            regenerated: `Hi ${fn}, spannender Post! Genau dort setzt Sherloq an — wir bringen neue SDRs deutlich schneller auf Quote. Hättest du diese Woche 15 Minuten für einen kurzen Call?`,
          },
          intro: "Starkes Signal — ich habe eine passende LinkedIn-Nachricht vorbereitet:",
          outro: "Du kannst sie direkt senden, anpassen oder mir sagen, was ich ändern soll.",
          actions: [
            { label: "Auf LinkedIn senden", icon: <Send className="w-3.5 h-3.5" />, primary: true, toast: "Auf LinkedIn gesendet", run: onApply },
            { label: "Als Task planen", icon: <ArrowUpRight className="w-3.5 h-3.5" />, toast: "Task erstellt", run: () => onCreateTask?.() },
          ],
        };
      })()
    : null;

  return <ChatActionPanel open={signal !== null} config={config} onClose={onClose} />;
}
