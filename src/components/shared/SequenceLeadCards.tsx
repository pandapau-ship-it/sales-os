import { FollowUpKaltCard } from './FollowUpKaltCard';

export const SequenceLeadCards = ({ onOutreachClick }: { onOutreachClick?: (person: any) => void }) => {
    return (
        <div className="w-full flex flex-col gap-6 mt-6">
            <FollowUpKaltCard
                name="Dr. Christian Brand"
                role="VP of Sales EMEA, LogixFlow GmbH"
                avatarInitials="CB"
                avatarBg="#10b981"
                companyInitials="L"
                companyName="LogixFlow GmbH"
                companyBg="#111827"
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
                name="Marc Levigne"
                role="Sales Director France, DataPulse Corp"
                avatarInitials="ML"
                avatarBg="#2563eb"
                companyInitials="D"
                companyName="DataPulse Corp"
                companyBg="#111827"
                icpScore={41}
                stage="Follow-up"
                daysInStage={8}
                timeAgoLabel="vor 8 Tagen"
                aiRecommendation="Demo Follow-up Multichannel"
                generatedMessage="LinkedIn DM due today."
            />
            <FollowUpKaltCard
                name="Elena Rostova"
                role="Head of Operations, Quantum Dynamics"
                avatarInitials="ER"
                avatarBg="#8b5cf6"
                companyInitials="Q"
                companyName="Quantum Dynamics"
                companyBg="#581c87"
                icpScore={55}
                stage="Onboarding"
                daysInStage={32}
                timeAgoLabel="vor 32 Tagen"
                aiRecommendation="Channel switch to LinkedIn recommended."
                generatedMessage="Contact is getting cold."
            />
        </div>
    );
};
