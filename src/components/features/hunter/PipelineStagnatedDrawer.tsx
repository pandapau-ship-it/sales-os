import { Clock, Send, ArrowUpRight } from "lucide-react";
import { ChatActionPanel } from '@/components';
import type { ChatActionConfig } from '@/components';
import { AI_PENDING_LABEL } from '@/lib/hunterMappers';

/**
 * StagnatedPerson — Datensatz fürs Stagniert-Action-Panel. KI-Felder sind OPTIONAL und bleiben
 * bis zur AI-Pipeline ([D5]) NULL → ehrlicher „Folgt"-Platzhalter (kein Fake-Draft), exakt wie
 * ContactColdDrawer/SignalActionDrawer/farmerActions.
 */
export interface StagnatedPerson {
  name: string;
  company: string;
  avatarUrl?: string;
  icpScore?: number;
  daysStagnated: number;
  stageName: string;
  lastContactDays?: number;
  // KI-Felder — NULL bis AI-Pipeline [D5]
  aiRecommendation?: string;
  draft?: string | null;
  confidence?: number | null;
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
 * PipelineStagnatedDrawer — Action Panel für stagnierte Deals (Spec: „Next Step"). Nutzt die
 * gemeinsame ChatActionPanel-Basis (UNVERÄNDERT — identischer Aufbau/Design/Breite wie alle
 * Action-Panels). HONESTY: Empfehlung/Entwurf sind „Folgt"-Platzhalter bis [D5]; die Send-/
 * Stage-Actions erscheinen automatisch, sobald ein echter KI-Draft existiert (wie bei Hunter/Farmer).
 */
export default function PipelineStagnatedDrawer({ person, onClose, onTakeAction }: PipelineStagnatedDrawerProps) {
  const config: ChatActionConfig | null = person
    ? ((): ChatActionConfig => {
        const next = nextStageFor(person.stageName);
        const rcpt = `${person.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join(".")}@${person.company.toLowerCase().replace(/[^a-z]/g, "")}.de`;
        const hasDraft = !!person.draft;
        // Banner-Text nur aus echten Werten (Honesty: fehlt → weglassen).
        const bannerText = [
          `${person.daysStagnated} Tage in „${person.stageName}"`,
          person.lastContactDays != null ? `seit ${person.lastContactDays} Tagen kein Kontakt` : null,
        ].filter(Boolean).join(" · ");
        return {
          person: { name: person.name, company: person.company, avatarUrl: person.avatarUrl },
          headerBadge: person.icpScore != null
            ? { label: `ICP: ${person.icpScore}`, tone: "success" }
            : { label: "Stagniert", tone: "urgent" },
          statusDotTone: "urgent",
          banner: {
            tone: "urgent",
            icon: <Clock className="w-3 h-3" />,
            label: "Deal stagniert",
            text: bannerText,
          },
          recommendation: { text: person.aiRecommendation ?? AI_PENDING_LABEL, confidence: person.confidence ?? null },
          draft: person.draft ? { channel: "email", to: rcpt, subject: "Kurzer Abgleich", body: person.draft } : null,
          intro: hasDraft
            ? `Der Deal stagniert seit ${person.daysStagnated} Tagen in „${person.stageName}". Ich habe einen Reaktivierungs-Entwurf vorbereitet:`
            : `Der Deal stagniert seit ${person.daysStagnated} Tagen in „${person.stageName}". Ein KI-Reaktivierungsentwurf folgt mit der AI-Pipeline:`,
          outro: hasDraft ? "Du kannst die E-Mail direkt senden, anpassen oder mir sagen, was ich ändern soll." : undefined,
          // Actions erscheinen nur mit echtem Draft (→ automatisch mit [D5]); vorher keine Send-Buttons.
          actions: hasDraft
            ? [
                { label: "E-Mail senden", icon: <Send className="w-3.5 h-3.5" />, primary: true, toast: "E-Mail gesendet", run: onTakeAction },
                { label: `Senden + Stage → ${next}`, icon: <ArrowUpRight className="w-3.5 h-3.5" />, toast: `Gesendet · Stage → ${next}`, run: onTakeAction },
              ]
            : [],
        };
      })()
    : null;

  return <ChatActionPanel open={person !== null} config={config} onClose={onClose} />;
}
