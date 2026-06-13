import { FollowUpKaltCard } from './FollowUpKaltCard';
import type { Lead } from '@/types';

export const SequenceLeadCards = ({ onOutreachClick, onSelectLead }: { onOutreachClick?: (person: any) => void; onSelectLead?: (lead: Lead) => void }) => {
    return (
        <div className="w-full flex flex-col gap-4 mt-6">
            <FollowUpKaltCard
                onSelectLead={onSelectLead}
                name="Dr. Christian Brand"
                role="VP of Sales EMEA, LogixFlow GmbH"
                avatarInitials="CB"
                companyInitials="L"
                companyName="LogixFlow GmbH"
                companyBg="var(--text-primary)"
                icpScore={94}
                stage="Demo"
                daysInStage={3}
                timeAgoLabel="vor 3 Tagen"
                aiRecommendation="Cold Outreach LinkedIn"
                generatedMessage="Step 2 of 4. Next task in 2 days."
                onOutreachClick={() => onOutreachClick?.({
                  name: "Dr. Christian Brand",
                  company: "LogixFlow GmbH",
                  daysInStage: 32,
                  lastContactDays: 32,
                  lastContactChannel: "Email",
                  lastConversationSentiment: "Letztes Gespräch: Neutral · Demo positiv · Kein konkreter Next Step",
                  aiRecommendation: "LinkedIn Direktnachricht mit persönlichem Aufhänger — Abstand war lang genug.",
                  confidence: 83,
                  tags: ["Email-Kanal erschöpft", "LinkedIn noch nicht versucht", "ICP Score hoch (94)"]
                })}
            />
            <FollowUpKaltCard
                onSelectLead={onSelectLead}
                name="Marc Levigne"
                role="Sales Director France, DataPulse Corp"
                avatarInitials="ML"
                companyInitials="D"
                companyName="DataPulse Corp"
                companyBg="var(--text-primary)"
                icpScore={41}
                stage="Follow-up"
                daysInStage={8}
                timeAgoLabel="vor 8 Tagen"
                aiRecommendation="Demo Follow-up Multichannel"
                generatedMessage="LinkedIn DM due today."
                onOutreachClick={() => onOutreachClick?.({
                  name: "Marc Levigne",
                  company: "DataPulse Corp",
                  daysInStage: 8,
                  lastContactDays: 8,
                  lastContactChannel: "Email",
                  lastConversationSentiment: "Letztes Gespräch: Neutral · Demo offen · kein konkreter Next Step",
                  aiRecommendation: "Multichannel-Nachfass: kurzer LinkedIn-Touch mit Bezug auf die Demo, danach E-Mail mit CTA.",
                  confidence: 71,
                  tags: ["Follow-up offen", "Multichannel sinnvoll"]
                })}
            />
            <FollowUpKaltCard
                onSelectLead={onSelectLead}
                name="Elena Rostova"
                role="Head of Operations, Quantum Dynamics"
                avatarInitials="ER"
                companyInitials="Q"
                companyName="Quantum Dynamics"
                companyBg="var(--accent-purple)"
                icpScore={55}
                stage="Onboarding"
                daysInStage={32}
                timeAgoLabel="vor 32 Tagen"
                aiRecommendation="Channel switch to LinkedIn recommended."
                generatedMessage="Contact is getting cold."
                onOutreachClick={() => onOutreachClick?.({
                  name: "Elena Rostova",
                  company: "Quantum Dynamics",
                  daysInStage: 32,
                  lastContactDays: 32,
                  lastContactChannel: "Email",
                  lastConversationSentiment: "Letztes Gespräch: Neutral · seit 32 Tagen kein Kontakt",
                  aiRecommendation: "Reaktivierung über LinkedIn — E-Mail-Kanal erschöpft, persönlicher Aufhänger nötig.",
                  confidence: 80,
                  tags: ["Kalt", "E-Mail erschöpft", "LinkedIn noch nicht versucht"]
                })}
            />
        </div>
    );
};
