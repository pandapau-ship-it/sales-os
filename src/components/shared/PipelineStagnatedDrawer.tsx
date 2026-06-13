import { Clock, Send, ArrowUpRight } from "lucide-react";
import ChatActionPanel from "@/components/shared/ChatActionPanel";
import type { ChatActionConfig } from "@/components/shared/ChatActionPanel";

interface StagnatedPerson {
  name: string;
  company: string;
  avatarUrl?: string;
  icpScore: number;
  daysStagnated: number;
  stageName: string;
  lastContactDays: number;
  arr: string;
  probability: string;
  aiRecommendation: string;
  aiInsight: string;
  tags: string[];
  confidence: number;
}

interface PipelineStagnatedDrawerProps {
  person: StagnatedPerson | null;
  onClose: () => void;
  onTakeAction: (text: string) => void;
}

/** Kanonische Stages (Spec §3.2) — kommen später aus settings.pipeline_stages. */
const PIPELINE_STAGES = ["Backlog", "Demo vereinbart", "Follow-up offen", "Onboarding offen", "Free Trial", "Gewonnen"];
function nextStageFor(current: string): string {
  const idx = PIPELINE_STAGES.findIndex((s) => s.toLowerCase().startsWith(current.trim().toLowerCase()));
  if (idx >= 0 && idx < PIPELINE_STAGES.length - 1) return PIPELINE_STAGES[idx + 1];
  return PIPELINE_STAGES[Math.min(Math.max(idx, 0) + 1, PIPELINE_STAGES.length - 1)];
}

/**
 * PipelineStagnatedDrawer — Action Panel für stagnierte Deals. Nutzt die gemeinsame
 * ChatActionPanel-Basis (identischer Aufbau/Design/Breite wie alle Action-Panels),
 * hier mit E-Mail-Reaktivierungs-Entwurf + „Senden + Stage wechseln".
 */
export default function PipelineStagnatedDrawer({ person, onClose, onTakeAction }: PipelineStagnatedDrawerProps) {
  const config: ChatActionConfig | null = person
    ? ((): ChatActionConfig => {
        const fn = person.name.split(" ")[0];
        const next = nextStageFor(person.stageName);
        const rcpt = `${person.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join(".")}@${person.company.toLowerCase().replace(/[^a-z]/g, "")}.de`;
        return {
          person: { name: person.name, company: person.company, avatarUrl: person.avatarUrl },
          headerBadge: { label: `ICP: ${person.icpScore}`, tone: "success" },
          statusDotTone: "urgent",
          banner: {
            tone: "urgent",
            icon: <Clock className="w-3 h-3" />,
            label: "Deal stagniert",
            text: `${person.daysStagnated} Tage in „${person.stageName}" · seit ${person.lastContactDays} Tagen kein Kontakt`,
          },
          recommendation: { text: person.aiRecommendation, confidence: person.confidence },
          draft: {
            channel: "email",
            to: rcpt,
            subject: "Kurzer Abgleich nach unserer Demo",
            body: `Hi ${fn},\n\nnach unserer Demo ist es etwas ruhig geworden — ich wollte kurz nachfassen, ob das Thema BDR-Ramp-up bei euch intern noch Priorität hat.\n\nGerne teile ich einen kompakten ROI-Überblick, zugeschnitten auf euer Team. Hättest du diese Woche 15 Minuten für einen kurzen Austausch?\n\nViele Grüße`,
            regenerated: `Hi ${fn},\n\ndanke nochmal für die Demo. Mich interessiert, ob das Thema intern weiter priorisiert wird — hast du diese Woche 15 Minuten für einen kurzen Abgleich? Ich bringe einen konkreten ROI-Case mit.\n\nViele Grüße`,
          },
          intro: `Der Deal stagniert seit ${person.daysStagnated} Tagen in „${person.stageName}". Ich habe einen Reaktivierungs-Entwurf vorbereitet:`,
          outro: "Du kannst die E-Mail direkt senden, anpassen oder mir sagen, was ich ändern soll.",
          actions: [
            { label: "E-Mail senden", icon: <Send className="w-3.5 h-3.5" />, primary: true, toast: "E-Mail gesendet", run: onTakeAction },
            { label: `Senden + Stage → ${next}`, icon: <ArrowUpRight className="w-3.5 h-3.5" />, toast: `Gesendet · Stage → ${next}`, run: onTakeAction },
          ],
        };
      })()
    : null;

  return <ChatActionPanel open={person !== null} config={config} onClose={onClose} />;
}
