import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HunterCard, { type HunterCardData } from '@/components/shared/HunterCard';
import { ACTION_ROW } from '@/lib/componentBehavior';
import type { Lead } from '@/types';

/**
 * PipelineStagniertCard — Pipeline-Task-Liste. Nutzt die geteilte HunterCard
 * (einheitliche Top-Row + Kurzansicht + grüner Pfeil) und liefert nur die
 * „Pipeline stagniert"-Action-Row.
 */
export const PipelineStagniertCard = ({ onTaskAnlegen, onSelectLead }: { onTaskAnlegen?: () => void; onSelectLead?: (lead: Lead) => void }) => {
  const { t } = useTranslation();

  const buildLead = (): Lead => ({
    id: 'pl-stagniert-cb',
    person: { id: 'pl-stagniert-cb', name: 'Christian Brand', jobTitle: 'VP of Sales EMEA', company: 'LogixFlow GmbH', initials: 'CB' },
    kurzakte: '', fullTimeline: [], engagementChain: [], lastTouchpoints: [],
    heatStatus: 'COLD', heatScore: 1, icpScore: 82, lastActivity: 'vor 14 Tagen',
    pipelineStage: 'pipeline', signalsCount: 1, contactEmail: '',
  });

  const data: HunterCardData = {
    id: 'pl-stagniert-cb',
    name: 'Christian Brand',
    jobTitle: 'VP of Sales EMEA',
    company: 'LogixFlow GmbH',
    icpScore: 82,
    stageLabel: 'Follow-up',
    heat: { bgClass: 'bg-[var(--signal-urgent-bg)]', textClass: 'text-[var(--icp-low)] border-[var(--signal-urgent-bg)]', label: t('hunter.heat.stagnated') },
    timeLabel: t('hunter.common.ago', { label: '14 Tagen' }),
    timeSubLabel: t('hunter.card.timeCritical'),
  };

  const actionRow = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-urgent-bg)] text-[var(--icp-low)] text-[10px] font-bold uppercase tracking-wider shrink-0">
          <AlertTriangle className="w-[11px] h-[11px]" /> {t('hunter.card.pipelineStagnated')}
        </span>
        <span className={ACTION_ROW.strongText}>{t('hunter.card.stagnatedHint')}</span>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onTaskAnlegen?.(); }} className={ACTION_ROW.ctaSecondary}>
        {t('hunter.card.action')}
      </button>
    </>
  );

  return (
    <HunterCard
      data={data}
      onOpenInfo={onSelectLead ? () => onSelectLead(buildLead()) : undefined}
      actionRow={actionRow}
      statusDotClass="bg-[var(--icp-low)]"
    />
  );
};
