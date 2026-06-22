import { Snowflake, Send, Calendar } from "lucide-react";
import { ChatActionPanel } from '@/components';
import type { ChatActionConfig } from '@/components';
import type { ColdPersonData } from '@/lib/hunterMappers';

// Single-Source des Typs liegt in hunterMappers (mit `contactToColdPerson`); hier re-exportiert.
export type { ColdPersonData } from '@/lib/hunterMappers';

export interface ContactColdDrawerProps {
  person: ColdPersonData | null;
  onClose: () => void;
}

/**
 * ContactColdDrawer — Action Panel für kalt werdende Kontakte (ChatActionPanel-Basis). Echte Felder
 * (Name/Firma/„vor X Tagen") aus `contactToColdPerson`. AI-Felder (Empfehlung/Draft/Confidence/
 * Kanal/Sentiment) sind NULL → das Panel zeigt einen ehrlichen „Folgt"-Platzhalter statt erfundenem
 * Text (AI-Pipeline siehe PROGRESS [D5]).
 */
export default function ContactColdDrawer({ person, onClose }: ContactColdDrawerProps) {
  const hasDraft = !!person?.draft;
  const handle = person
    ? `in/${person.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join("")}`
    : "";

  // Banner-Text nur aus echten Werten (fehlt → weglassen).
  const bannerText = person
    ? ([
        person.lastContactDays != null ? `Letzter Kontakt vor ${person.lastContactDays} Tagen` : null,
        person.lastContactChannel ? `via ${person.lastContactChannel}` : null,
        person.lastConversationSentiment ?? null,
      ].filter(Boolean).join(" · ") || "Kontakt ist kalt")
    : "";

  const config: ChatActionConfig | null = person
    ? {
        person: { name: person.name, company: person.company, avatarUrl: person.avatarUrl },
        headerBadge: { label: "Cold", tone: "cold" },
        statusDotTone: "cold",
        banner: {
          tone: "cold",
          icon: <Snowflake className="w-3 h-3" />,
          label: "Kontakt wird kalt",
          text: bannerText,
        },
        recommendation: { text: person.aiRecommendation, confidence: person.confidence ?? null },
        draft: person.draft ? { channel: "linkedin", to: handle, body: person.draft } : null,
        intro: hasDraft
          ? "Der Kontakt wird kalt. Ich habe eine Reaktivierungs-Nachricht vorbereitet:"
          : "Der Kontakt wird kalt. Ein KI-Reaktivierungsentwurf folgt mit der AI-Pipeline:",
        outro: hasDraft ? "Du kannst sie direkt senden, anpassen oder mir sagen, was ich ändern soll." : undefined,
        actions: hasDraft
          ? [
              { label: "Reaktivierung senden", icon: <Send className="w-3.5 h-3.5" />, primary: true, toast: "Reaktivierung gesendet" },
              { label: "Auf später (Snooze)", icon: <Calendar className="w-3.5 h-3.5" />, toast: "Auf später verschoben" },
            ]
          : [],
      }
    : null;

  return <ChatActionPanel open={person !== null} config={config} onClose={onClose} />;
}
