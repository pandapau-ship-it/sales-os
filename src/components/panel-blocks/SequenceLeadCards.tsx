import { useTranslation } from 'react-i18next';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import HunterCard, { type HunterCardData } from './HunterCard';
import EmptyState from '@/components/shared/EmptyState';
import { ACTION_ROW } from '@/lib/componentBehavior';
import type { DueTaskCardItem } from '@/lib/hunterMappers';
import type { Lead } from '@/types';

/** Kalender-Tage zwischen due_at und heute (0 = heute, >0 = überfällig). Kein Datum → null. */
function overdueDays(iso: string | null): number | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return null;
  const d0 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((t0.getTime() - d0.getTime()) / 86_400_000);
}

/**
 * SequenceLeadCards — Follow-ups-Tab. Datengetrieben über FÄLLIGE TASKS
 * (completed_at IS NULL AND due_at <= now()). Pro Task eine Karte: zentrale
 * Kontakt-Kachel (contactToProfile/contactActiveStage, unverändert wie überall) +
 * grauer Bereich mit Label „Fällige Task" + Task-Titel + Fälligkeit. Überfällig →
 * rot (Warnung), heute → amber. Pfeil → 820px-Panel bleibt sichtbar (Tür für später).
 * Snooze/Eskalation/„Start Outreach"/Stagnation bleiben deferred (nicht hier).
 * Leere Liste → EmptyState (gewollter Positivzustand: nichts zu tun).
 */
export const SequenceLeadCards = ({
  items,
  onSelectLead,
  onComplete,
}: {
  items?: DueTaskCardItem[];
  onSelectLead?: (lead: Lead) => void;
  /** Task erledigt (T4a): setzt completed_at → Karte verschwindet nach Invalidate. */
  onComplete?: (taskId: string) => void;
}) => {
  const { t } = useTranslation();

  if (!items || items.length === 0) {
    return (
      <div className="w-full mt-6">
        <EmptyState
          icon={<CheckCircle2 className="w-6 h-6" />}
          title={t('hunter.followUps.emptyTitle')}
          description={t('hunter.followUps.emptyDesc')}
        />
      </div>
    );
  }

  const buildLead = (it: DueTaskCardItem): Lead => ({
    id: it.id,
    // person.id = echte contact_id (Panel fetcht damit den Kontakt; Fallback task.id öffnet leeres Panel)
    person: { id: it.contactId ?? it.id, name: it.name, jobTitle: it.role, company: it.companyName, initials: it.initials },
    kurzakte: '', fullTimeline: [], engagementChain: [], lastTouchpoints: [],
    heatStatus: it.heatStatus ?? 'DEAD', heatScore: 0, icpScore: it.icpScore,
    lastActivity: '', pipelineStage: 'pipeline', signalsCount: 0, contactEmail: '',
  });

  return (
    <div className="w-full flex flex-col gap-4 mt-6">
      {items.map((it) => {
        const days = overdueDays(it.dueAt);
        const dueText =
          days == null ? ''
          : days <= 0 ? t('hunter.followUps.dueToday')
          : t('hunter.followUps.dueAgo', { label: t('hunter.common.daysAgo', { count: days }) });
        // Überfällig = Warnung → rot; heute fällig → amber. (CLAUDE.md: Rot nur für Warnungen.)
        const dueClass = days != null && days > 0 ? 'text-[var(--signal-urgent-text)]' : 'text-[var(--signal-warn-text)]';

        const data: HunterCardData = {
          id: it.id,
          name: it.name,
          jobTitle: it.role,
          company: it.companyName,
          icpScore: it.icpScore,       // fehlt → undefined → ICP-Ring unsichtbar
          stageLabel: it.stage ?? '',  // kein aktiver Deal → keine Stage
          heatStatus: it.heatStatus,   // echtes Heat; undefined → kein Badge
          timeLabel: '',               // Fälligkeit steht im grauen Bereich unten
        };

        const actionRow = (
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-warn-bg)] text-[var(--signal-warn-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
                <ClipboardList className="w-[11px] h-[11px]" /> {t('hunter.followUps.dueLabel')}
              </span>
              <span className={ACTION_ROW.strongText}>{it.taskTitle}</span>
              {dueText && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className={`text-[12.5px] font-bold ${dueClass}`}>{dueText}</span>
                </>
              )}
            </div>
            {onComplete && (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(it.id); }}
                className={`${ACTION_ROW.ctaSecondary} inline-flex items-center gap-1.5 shrink-0`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--signal-success-text)]" strokeWidth={2.5} />
                {t('hunter.followUps.markDone')}
              </button>
            )}
          </>
        );

        return (
          <HunterCard
            key={it.id}
            data={data}
            contactId={it.contactId}
            onOpenInfo={onSelectLead ? () => onSelectLead(buildLead(it)) : undefined}
            actionRow={actionRow}
          />
        );
      })}
    </div>
  );
};
