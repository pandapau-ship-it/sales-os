import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Check, Bot, UserCheck, Inbox } from 'lucide-react';
import HunterCard, { type HunterCardData } from './HunterCard';
import EmptyState from '@/components/shared/EmptyState';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ACTION_ROW } from '@/lib/componentBehavior';
import type { NewPipelineCardItem, NewPipelinePeriod } from '@/lib/hunterMappers';
import type { Lead } from '@/types';

/** Ganze Tage seit `iso` (>= 0). Kein Datum → null → „vor X Tagen" bleibt unsichtbar. */
function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * NewInPipelineCards — Hunter → „Neu in Pipeline". Datengetrieben: frisch angelegte
 * Deals (deals.created_at) als Kontakt-Kachel (contactToProfile) + Stage (contactActiveStage)
 * über die zentrale Leitung. Herkunft „Via AI SDR" vs. „Manuell hinzugefügt" aus
 * deals.source_lead_id. Zeitfilter (heute / 7 Tage / 30 Tage) wird im Screen über
 * created_at gefiltert; hier nur die Auswahl gerendert. Meeting-Prep-/Termin-Buttons +
 * Pfeil bleiben als Tür sichtbar (Klick → Platzhalter-Toast). Termin-Datum, Prep-Status
 * + AI-Begleittext sind ausgeblendet (Logik/Tabellen fehlen → würde Daten vortäuschen,
 * Deferred [D18]). Leerer Zeitraum → EmptyState (gewollter Positivzustand).
 */
export default function NewInPipelineCards({
  items,
  period,
  onPeriodChange,
  onSelectLead,
}: {
  items?: NewPipelineCardItem[];
  period: NewPipelinePeriod;
  onPeriodChange: (p: NewPipelinePeriod) => void;
  onSelectLead: (lead: Lead) => void;
}) {
  const { t } = useTranslation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const list = items ?? [];

  const buildLead = (it: NewPipelineCardItem): Lead => ({
    id: it.id,
    // person.id = echte contact_id (Panel fetcht damit den Kontakt; Fallback deal.id öffnet leeres Panel)
    person: { id: it.contactId ?? it.id, name: it.name, jobTitle: it.role, company: it.companyName, initials: it.initials },
    kurzakte: '',
    fullTimeline: [],
    engagementChain: [],
    lastTouchpoints: [],
    heatStatus: it.heatStatus ?? 'DEAD',
    heatScore: 0,
    icpScore: it.icpScore,
    lastActivity: '',
    pipelineStage: 'pipeline',
    signalsCount: 0,
    contactEmail: '',
  });

  return (
    <div className="font-sans antialiased text-[var(--text-primary)]">
      {/* Header + Zeitfilter */}
      <header className="flex items-end justify-between gap-4 mb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('hunter.newPipeline.breadcrumb')}</span>
          <h1 className="text-[28px] font-extrabold tracking-tight text-text-primary leading-tight">{t('hunter.newPipeline.title')}</h1>
          <p className="text-[13px] text-text-muted font-medium">{t('hunter.newPipeline.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] font-bold text-text-muted">{t('hunter.newPipeline.filterLabel')}</span>
          <Select value={period} onValueChange={(v) => onPeriodChange(v as NewPipelinePeriod)}>
            <SelectTrigger className="w-[170px] rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t('hunter.newPipeline.periodToday')}</SelectItem>
              <SelectItem value="7d">{t('hunter.newPipeline.period7d')}</SelectItem>
              <SelectItem value="30d">{t('hunter.newPipeline.period30d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Karten — volle Breite (= Leads), einheitliche HunterCard */}
      <div className="flex flex-col gap-4">
        {list.length === 0 ? (
          <EmptyState icon={<Inbox className="w-6 h-6" />} title={t('hunter.newPipeline.emptyTitle')} description={t('hunter.newPipeline.emptyDesc')} />
        ) : list.map((it) => {
          const days = daysSince(it.createdAt);
          const data: HunterCardData = {
            id: it.id,
            name: it.name,
            jobTitle: it.role,
            company: it.companyName,
            icpScore: it.icpScore, // fehlt → undefined → ICP-Ring unsichtbar
            stageLabel: it.stage ?? '', // kein aktiver Deal → keine Stage
            heatStatus: it.heatStatus, // echtes Heat; undefined → kein Badge
            timeLabel: days != null ? t('hunter.common.ago', { label: t('hunter.common.daysAgo', { count: days }) }) : '',
            timeSubLabel: <span className="text-text-muted font-semibold">{t('hunter.newPipeline.label')}</span>,
          };

          // Action-Row = REFERENZ. Links: Herkunft (AI SDR / Manuell). Rechts: Türen
          // (Meeting-Prep · Termin vereinbaren) — Funktion folgt, Klick → Platzhalter.
          const actionRow = (
            <>
              <div className="flex items-center gap-1.5 min-w-0">
                {it.source === 'ai_sdr'
                  ? <Bot size={15} className="text-[var(--sherloq-primary)] shrink-0" />
                  : <UserCheck size={15} className="text-text-muted shrink-0" />}
                <span className={ACTION_ROW.strongText}>
                  {it.source === 'ai_sdr' ? t('hunter.newPipeline.sourceAiSdr') : t('hunter.newPipeline.sourceManual')}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); triggerToast(t('hunter.newPipeline.toastSoon')); }}
                  className={`${ACTION_ROW.ctaSecondary} inline-flex items-center gap-1.5`}
                >
                  <Calendar size={13} className="text-[var(--sherloq-primary)]" />
                  {t('hunter.newPipeline.btnMeetingPrep')}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); triggerToast(t('hunter.newPipeline.toastSoon')); }}
                  className={ACTION_ROW.ctaPrimary}
                >
                  {t('hunter.newPipeline.btnSchedule')}
                </button>
              </div>
            </>
          );

          return (
            <HunterCard
              key={it.id}
              data={data}
              onOpenInfo={() => onSelectLead(buildLead(it))}
              actionRow={actionRow}
            />
          );
        })}
      </div>

      {/* Toast — Platzhalter (Funktion folgt mit Task-System / Kalender-Integration) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-on-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={14} className="text-[var(--signal-success-text)]" strokeWidth={3} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
