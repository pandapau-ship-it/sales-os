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
 * PipelineKeineTaskCard — Pipeline-Task-Liste „Kontakte ohne offene Task". KONTAKT-zentriert
 * (nicht Deal-zentriert): EINE Karte je Kontakt, der ≥1 aktiven Deal hat und auf keinem davon
 * eine offene Task — die Karte listet alle aktiven Deals des Kontakts (eine Task deckt alle ab).
 * Prop-getrieben (NoTaskCardItem aus getDeals → contactToNoTaskCard). Signal-getrieben: leere
 * Liste → rendert NICHTS. „vor X Tagen" = letzter Kontakt (last_contacted_at); NULL/0 → kein Block.
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
          id: it.contactId,
          name: it.name,
          jobTitle: it.jobTitle,
          company: it.companyName,
          icpScore: it.icpScore,
          stageLabel: '', // Kontakt-Karte zeigt keine einzelne Stage (Deals stehen in der Action-Row)
          heatStatus: it.heatStatus,
          timeLabel: hasLastContact ? t('hunter.common.ago', { label: t('hunter.common.daysAgo', { count: days }) }) : '',
          timeSubLabel: hasLastContact ? <span className="text-text-muted font-semibold">{t('hunter.common.lastContactSub')}</span> : undefined,
        };

        // Kompakte Deals-Zeile: „PayGuard (Demo) · LogixFlow (Backlog)".
        const dealsLine = it.deals
          .map((d) => (d.stageLabel ? `${d.name} (${d.stageLabel})` : d.name))
          .join(' · ');

        const actionRow = (
          <>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-warn-bg)] text-[var(--icp-medium)] text-[10px] font-bold uppercase tracking-wider shrink-0">
                  <AlertTriangle className="w-[11px] h-[11px]" /> {t('hunter.card.noTask')}
                </span>
                <span className={ACTION_ROW.strongText}>{t('hunter.card.noTaskFollowup')}</span>
              </div>
              <span className="text-[12px] text-text-muted truncate">
                {t('hunter.card.deals')}: {dealsLine}
              </span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onTaskAnlegen?.(it); }} className={ACTION_ROW.ctaSecondary}>
              {t('hunter.card.createTask')}
            </button>
          </>
        );

        return (
          <HunterCard
            key={it.contactId}
            data={data}
            contactId={it.contactId}
            onOpenInfo={onSelectLead ? () => onSelectLead(it) : undefined}
            actionRow={actionRow}
            statusDotClass="bg-[var(--icp-medium)]"
          />
        );
      })}
    </>
  );
};
