import { FollowUpKaltCard } from './FollowUpKaltCard';
import EmptyState from '@/components/shared/EmptyState';
import { CheckCircle2 } from 'lucide-react';
import type { Lead } from '@/types';
import type { FollowUpCardItem } from '@/lib/hunterMappers';

/**
 * SequenceLeadCards — Follow-ups-Tab. Datengetrieben: zeigt echte Follow-up-Kontakte
 * (Heat Cold/Gone) als schlanke FollowUpKaltCard (Kontakt-Kachel + Stage + Panel-Einstieg).
 * Snooze/Eskalation/Outreach/Stagnation sind ausgeblendet (`showActions={false}`, [D16]).
 * Leere Liste → EmptyState (gewollter Positivzustand: nichts zu tun).
 */
export const SequenceLeadCards = ({
  items,
  onSelectLead,
}: {
  items?: FollowUpCardItem[];
  onSelectLead?: (lead: Lead) => void;
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="w-full mt-6">
        <EmptyState
          icon={<CheckCircle2 className="w-6 h-6" />}
          title="Keine offenen Follow-ups"
          description="Erledigte Aufgaben gut gemacht"
        />
      </div>
    );
  }
  return (
    <div className="w-full flex flex-col gap-4 mt-6">
      {items.map((it) => (
        <FollowUpKaltCard
          key={it.id}
          name={it.name}
          role={it.role}
          companyName={it.companyName}
          icpScore={it.icpScore}
          heatStatus={it.heatStatus}
          stage={it.stage}
          showActions={false}
          onSelectLead={onSelectLead}
        />
      ))}
    </div>
  );
};
