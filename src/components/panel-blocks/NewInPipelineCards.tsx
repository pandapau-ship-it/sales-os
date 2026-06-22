import { useTranslation } from 'react-i18next';
import { Bot, UserCheck, Inbox } from 'lucide-react';
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
 * created_at gefiltert; hier nur die Auswahl gerendert. Zeile 2 zeigt links die
 * Herkunft, in der Mitte echte Deal-Infos (Name · Betrag · Produkt — jeweils nur wenn
 * vorhanden, Honesty) und rechts den „Action starten"-Button (öffnet das Info-Panel,
 * gleiche Logik wie der grüne Pfeil). Termin-Datum, Prep-Status + AI-Begleittext bleiben
 * ausgeblendet (Logik/Tabellen fehlen → würde Daten vortäuschen, Deferred [D18]).
 * Leerer Zeitraum → EmptyState (gewollter Positivzustand).
 */
export default function NewInPipelineCards({
  items,
  period,
  onPeriodChange,
  onSelectLead,
  onCreateTask,
}: {
  items?: NewPipelineCardItem[];
  period: NewPipelinePeriod;
  onPeriodChange: (p: NewPipelinePeriod) => void;
  onSelectLead: (lead: Lead) => void;
  /** „Task anlegen" — öffnet das Info-Panel direkt auf dem Tasks-Tab mit offenem Anlegen-Formular (Deeplink initialAction='task'). */
  onCreateTask: (lead: Lead) => void;
}) {
  const { t } = useTranslation();

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
          <span className="typo-section-label text-text-muted">{t('hunter.newPipeline.breadcrumb')}</span>
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
          // „vor X Tagen" = echter letzter Kontakt (contacts.last_contacted_at), NICHT deal.created_at.
          // NULL oder 0 Tage → kein Zeit-Block (Honesty: kein Fake, kein „vor 0 Tagen").
          const days = daysSince(it.lastContactedAt);
          const hasLastContact = days != null && days >= 1;
          const data: HunterCardData = {
            id: it.id,
            name: it.name,
            jobTitle: it.role,
            company: it.companyName,
            icpScore: it.icpScore, // fehlt → undefined → ICP-Ring unsichtbar
            stageLabel: it.stage ?? '', // kein aktiver Deal → keine Stage
            heatStatus: it.heatStatus, // echtes Heat; undefined → kein Badge
            timeLabel: hasLastContact ? t('hunter.common.ago', { label: t('hunter.common.daysAgo', { count: days }) }) : '',
            timeSubLabel: hasLastContact ? <span className="text-text-muted font-semibold">{t('hunter.common.lastContactSub')}</span> : undefined,
          };

          // Echte Deal-Infos für die Mitte — nur vorhandene Teile (Honesty: kein „—", keine 0).
          // Betrag: deal.value ist Cent → /100, ganzzahlig (de-DE-Gruppierung) + „ €".
          const valueLabel = it.dealValue != null
            ? `${Math.round(it.dealValue / 100).toLocaleString('de-DE')} €`
            : null;
          const hasDealInfo = !!(it.dealName || valueLabel || it.dealProduct);

          // Action-Row = REFERENZ. Links (feste Breite → Deal-Infos starten bei jeder Karte
          // bündig in derselben Spalte): Herkunft (AI SDR / Manuell). Daneben linksbündig:
          // Deal-Name · Betrag (teal-Pill) · Produkt — jeweils nur wenn vorhanden.
          // Rechts: „Task anlegen" → öffnet das Info-Panel direkt auf dem Tasks-Tab
          // mit offenem Anlegen-Formular (Deeplink initialAction='task').
          const actionRow = (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 w-[180px] shrink-0">
                  {it.source === 'ai_sdr'
                    ? <Bot size={15} className="text-[var(--sherloq-primary)] shrink-0" />
                    : <UserCheck size={15} className="text-text-muted shrink-0" />}
                  <span className={`${ACTION_ROW.strongText} truncate`}>
                    {it.source === 'ai_sdr' ? t('hunter.newPipeline.sourceAiSdr') : t('hunter.newPipeline.sourceManual')}
                  </span>
                </div>

                {hasDealInfo && (
                  <div className="flex items-center gap-2 min-w-0">
                    {it.dealName && <span className={`${ACTION_ROW.text} truncate`}>{it.dealName}</span>}
                    {valueLabel && <span className="sherloq-pill pill-teal font-bold shrink-0">{valueLabel}</span>}
                    {it.dealProduct && <span className={`${ACTION_ROW.text} truncate`}>{it.dealProduct}</span>}
                  </div>
                )}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onCreateTask(buildLead(it)); }}
                className="px-4 py-1.5 bg-app-surface border border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)] hover:text-on-accent rounded-full text-[11px] font-black transition-colors shadow-sm cursor-pointer shrink-0 inline-flex items-center gap-1.5"
              >
                {t('hunter.newPipeline.btnCreateTask')} →
              </button>
            </>
          );

          return (
            <HunterCard
              key={it.id}
              data={data}
              contactId={it.contactId}
              onOpenInfo={() => onSelectLead(buildLead(it))}
              actionRow={actionRow}
            />
          );
        })}
      </div>
    </div>
  );
}
