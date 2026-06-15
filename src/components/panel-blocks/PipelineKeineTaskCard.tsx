import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HunterCard, { type HunterCardData } from '@/components/panel-blocks/HunterCard';
import { ACTION_ROW } from '@/lib/componentBehavior';
import type { Lead } from '@/types';

/**
 * PipelineKeineTaskCard — Pipeline-Task-Liste. Nutzt die geteilte HunterCard
 * und liefert nur die „Keine Task"-Action-Row.
 */
export const PipelineKeineTaskCard = ({ onTaskAnlegen, onSelectLead }: { onTaskAnlegen?: () => void; onSelectLead?: (lead: Lead) => void }) => {
  const { t } = useTranslation();

  const buildLead = (): Lead => ({
    id: 'pl-keinetask-sj',
    person: { id: 'pl-keinetask-sj', name: 'Sarah Jenkins', jobTitle: 'Head of Business Development', company: 'CloudSphere', initials: 'SJ' },
    kurzakte: '', fullTimeline: [], engagementChain: [], lastTouchpoints: [],
    heatStatus: 'WARM', heatScore: 3, icpScore: 65, lastActivity: 'vor 3 Tagen',
    pipelineStage: 'pipeline', signalsCount: 1, contactEmail: '',
  });

  const data: HunterCardData = {
    id: 'pl-keinetask-sj',
    name: 'Sarah Jenkins',
    jobTitle: 'Head of Business Development',
    company: 'CloudSphere',
    icpScore: 65,
    stageLabel: 'Lead',
    heat: { bgClass: 'bg-[var(--signal-warn-bg)]', textClass: 'text-[var(--icp-medium)] border-[var(--signal-warn-bg)]', label: t('hunter.heat.stable') },
    timeLabel: t('hunter.common.ago', { label: '3 Tagen' }),
    timeSubLabel: <span className="text-text-muted font-semibold">{t('hunter.card.newInPipeline')}</span>,
  };

  const actionRow = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-warn-bg)] text-[var(--icp-medium)] text-[10px] font-bold uppercase tracking-wider shrink-0">
          <AlertTriangle className="w-[11px] h-[11px]" /> {t('hunter.card.noTask')}
        </span>
        <span className={ACTION_ROW.strongText}>{t('hunter.card.noTaskHint')}</span>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onTaskAnlegen?.(); }} className={ACTION_ROW.ctaSecondary}>
        {t('hunter.card.createTask')}
      </button>
    </>
  );

  return (
    <HunterCard
      data={data}
      onOpenInfo={onSelectLead ? () => onSelectLead(buildLead()) : undefined}
      actionRow={actionRow}
      statusDotClass="bg-[var(--icp-medium)]"
    />
  );
};
