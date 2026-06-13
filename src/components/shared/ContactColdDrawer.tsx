import { Snowflake, Send, Calendar } from "lucide-react";
import ChatActionPanel from "@/components/shared/ChatActionPanel";
import type { ChatActionConfig } from "@/components/shared/ChatActionPanel";

interface ColdPerson {
  name: string;
  company: string;
  avatarUrl?: string;
  daysInStage: number;
  lastContactDays: number;
  lastContactChannel: string;
  lastConversationSentiment: string;
  aiRecommendation: string;
  confidence: number;
  tags: string[];
}

export interface ContactColdDrawerProps {
  person: ColdPerson | null;
  onClose: () => void;
}

/**
 * ContactColdDrawer — Action Panel für kalt werdende Kontakte. Nutzt die gemeinsame
 * ChatActionPanel-Basis (identischer Aufbau/Design/Breite wie alle Action-Panels),
 * hier mit vorgefertigter Reaktivierungs-Nachricht.
 */
export default function ContactColdDrawer({ person, onClose }: ContactColdDrawerProps) {
  const config: ChatActionConfig | null = person
    ? ((): ChatActionConfig => {
        const fn = person.name.split(" ")[0];
        const handle = `in/${person.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join("")}`;
        return {
          person: { name: person.name, company: person.company, avatarUrl: person.avatarUrl },
          headerBadge: { label: "Cold", tone: "cold" },
          statusDotTone: "cold",
          banner: {
            tone: "cold",
            icon: <Snowflake className="w-3 h-3" />,
            label: "Kontakt wird kalt",
            text: `Letzter Kontakt vor ${person.lastContactDays} Tagen via ${person.lastContactChannel} · ${person.lastConversationSentiment}`,
          },
          recommendation: { text: person.aiRecommendation, confidence: person.confidence },
          draft: {
            channel: "linkedin",
            to: handle,
            body: `Hi ${fn}, wollte mich kurz melden — habt ihr das Thema BDR-Effizienz intern weiterverfolgt? Ich teile gern einen frischen Impuls dazu. Diese Woche 15 Min Zeit?`,
            regenerated: `Hi ${fn}, lange nichts gehört! Bei euch im Fokus ist BDR-Effizienz ja weiterhin relevant — ich hätte einen konkreten Ansatz. Magst du dich diese Woche kurz austauschen?`,
          },
          intro: `Der Kontakt wird kalt (letzter Kontakt vor ${person.lastContactDays} Tagen). Ich habe eine Reaktivierungs-Nachricht vorbereitet:`,
          outro: "Du kannst sie direkt senden, anpassen oder mir sagen, was ich ändern soll.",
          actions: [
            { label: "Reaktivierung senden", icon: <Send className="w-3.5 h-3.5" />, primary: true, toast: "Reaktivierung gesendet" },
            { label: "Auf später (Snooze)", icon: <Calendar className="w-3.5 h-3.5" />, toast: "Auf später verschoben" },
          ],
        };
      })()
    : null;

  return <ChatActionPanel open={person !== null} config={config} onClose={onClose} />;
}
