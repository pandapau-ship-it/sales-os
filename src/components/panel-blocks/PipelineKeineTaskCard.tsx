import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HunterCard, { type HunterCardData } from './HunterCard';
import { ACTION_ROW } from '@/lib/componentBehavior';
import type { NoTaskCardItem } from '@/lib/hunterMappers';

/** Ganze Tage seit `iso` (>= 0). Kein Datum → null. */
function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/**
 * PipelineKeineTaskCard — Pipeline-Task-Liste „Deals ohne offene Task". Prop-getrieben (echte
 * NoTaskCardItem aus getDeals → dealToNoTaskCard). Rendert eine Karte je Deal über die geteilte
 * HunterCard. Honesty/Signal-getrieben: leere Liste → die Komponente rendert NICHTS. „vor X Tagen"
 * = letzter Kontakt (contacts.last_contacted_at); NULL/0 Tage → kein Zeit-Block. Kein Mock mehr.
 */
export const PipelineKeineTaskCard = ({ items, onTaskAnlegen, onSelectLead }: {
  items: NoTaskCardItem[];
  onTaskAnlegen?: (item: NoTaskCardItem) => void;
  onSelectLead?: (item: NoTaskCardItem) => void;
}) => {
  const { t } = useTranslation();
  if (!items.length) return null; // Signal-getrieben: nichts zu zeigen → unsichtbar

  return (
    <>
      {items.map((it) => {
        const days = daysSince(it.lastContactedAt);
        const hasLastContact = days != null && days >= 1; // „vor 0 Tagen" unterdrücken
        const data: HunterCardData = {
          id: it.dealId,
          name: it.name,
          jobTitle: it.jobTitle,
          company: it.companyName,
          icpScore: it.icpScore,
          stageLabel: it.stageLabel ?? '',
          heatStatus: it.heatStatus,
          timeLabel: hasLastContact ? t('hunter.common.ago', { label: t('hunter.common.daysAgo', { count: days }) }) : '',
          timeSubLabel: hasLastContact ? <span className="text-text-muted font-semibold">{t('hunter.common.lastContactSub')}</span> : undefined,
        };

        const actionRow = (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-warn-bg)] text-[var(--icp-medium)] text-[10px] font-bold uppercase tracking-wider shrink-0">
                <AlertTriangle className="w-[11px] h-[11px]" /> {t('hunter.card.noTask')}
              </span>
              <span className={ACTION_ROW.strongText}>{t('hunter.card.noTaskHint')}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onTaskAnlegen?.(it); }} className={ACTION_ROW.ctaSecondary}>
              {t('hunter.card.createTask')}
            </button>
          </>
        );

        return (
          <HunterCard
            key={it.dealId}
            data={data}
            onOpenInfo={onSelectLead ? () => onSelectLead(it) : undefined}
            actionRow={actionRow}
            statusDotClass="bg-[var(--icp-medium)]"
          />
        );
      })}
    </>
  );
};
