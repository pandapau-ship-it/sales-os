import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HunterCard, { type HunterCardData } from './HunterCard';
import { ACTION_ROW } from '@/lib/componentBehavior';
import type { StagnatedCardItem } from '@/lib/hunterMappers';

/** Ganze Tage seit `iso` (>= 0). Kein Datum → null. */
function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/**
 * PipelineStagniertCard — Pipeline-Task-Liste „stagnierende Deals". Prop-getrieben (echte
 * StagnatedCardItem aus getDeals → dealToStagnatedCard). Rendert eine Karte je Deal über die
 * geteilte HunterCard. Honesty/Signal-getrieben: leere Liste → die Komponente rendert NICHTS
 * (kein Platzhalter). Daten kommen ausschließlich vom Aufrufer — kein Mock mehr.
 */
export const PipelineStagniertCard = ({ items, onTaskAnlegen, onSelectLead }: {
  items: StagnatedCardItem[];
  onTaskAnlegen?: (item: StagnatedCardItem) => void;
  onSelectLead?: (item: StagnatedCardItem) => void;
}) => {
  const { t } = useTranslation();
  if (!items.length) return null; // Signal-getrieben: nichts zu zeigen → unsichtbar

  return (
    <>
      {items.map((it) => {
        // Profilzeile-Zeit IMMER aus contacts.last_contacted_at („vor X Tagen"), NICHT stagnationDays.
        // Die Stagnations-Tage stehen im Action-Streifen (stagnatedSince). „vor 0 Tagen"/NULL → unsichtbar.
        const days = daysSince(it.lastContactedAt);
        const hasLastContact = days != null && days >= 1;
        const data: HunterCardData = {
          id: it.dealId,
          name: it.name,
          jobTitle: it.jobTitle,
          company: it.companyName,
          icpScore: it.icpScore,                 // fehlt → Ring unsichtbar
          stageLabel: it.stageLabel ?? '',
          heatStatus: it.heatStatus,             // echtes contacts.heat_status; fehlt → kein Badge
          timeLabel: hasLastContact ? t('hunter.common.ago', { label: t('hunter.common.daysAgo', { count: days }) }) : '',
        };

        const actionRow = (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-urgent-bg)] text-[var(--icp-low)] text-[10px] font-bold uppercase tracking-wider shrink-0">
                <AlertTriangle className="w-[11px] h-[11px]" /> {t('hunter.card.pipelineStagnated')}
              </span>
              <span className={ACTION_ROW.strongText}>{t('hunter.card.stagnatedSince', { days: it.stagnationDays })}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onTaskAnlegen?.(it); }} className={ACTION_ROW.ctaSecondary}>
              {t('hunter.card.action')}
            </button>
          </>
        );

        return (
          <HunterCard
            key={it.dealId}
            data={data}
            contactId={it.contactId}
            onOpenInfo={onSelectLead ? () => onSelectLead(it) : undefined}
            actionRow={actionRow}
            statusDotClass="bg-[var(--icp-low)]"
          />
        );
      })}
    </>
  );
};
