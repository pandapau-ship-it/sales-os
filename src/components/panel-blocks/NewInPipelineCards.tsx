import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Check, Bot, UserCheck, RotateCw } from 'lucide-react';
import { HunterCard } from '@/components';
import type { HunterCardData } from '@/components';
import { ACTION_ROW } from '@/lib/componentBehavior';
import type { Lead } from '@/types';

function deriveInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function NewInPipelineCards({ onSelectLead }: { onSelectLead: (lead: Lead) => void }) {
  const { t } = useTranslation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const leads = [
    {
      id: 'l1', name: "Sarah Jenkins", title: "VP Sales EMEA", company: "Atrium GmbH",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      score: 92, stage: "Demo", heatKey: "engaged" as const,
      days: "vor 2 Tagen", source: "Via AI SDR · Termin gebucht", sourceType: "ai_sdr",
      prepStatus: "ready", meetingText: "Demo · 12. Juni · 14:00", btnText: "Meeting-Prep ansehen →", btnType: "primary",
    },
    {
      id: 'l2', name: "Marcus Müller", title: "Head of Business Development", company: "LogixFlow GmbH",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      score: 68, stage: "Discovery", heatKey: "warm" as const,
      days: "vor 3 Tagen", source: "Via AI SDR · Termin gebucht", sourceType: "ai_sdr",
      prepStatus: "loading", meetingText: "Discovery · 14. Juni · 10:30", btnText: "Meeting-Prep generieren", btnType: "secondary_glow",
    },
    {
      id: 'l3', name: "Elena Rostova", title: "RevOps Specialist", company: "Quantum Dynamics",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      score: 45, stage: "Proposal", heatKey: "cold" as const,
      days: "vor 5 Tagen", source: "Manuell hinzugefügt", sourceType: "manual",
      prepStatus: "none", meetingText: null, btnText: "Termin vereinbaren →", btnType: "primary",
    },
  ];

  const buildLead = (lead: typeof leads[number]): Lead => ({
    id: lead.id,
    person: { id: lead.id, name: lead.name, jobTitle: lead.title, company: lead.company, avatarUrl: lead.avatar, initials: deriveInitials(lead.name) },
    kurzakte: "",
    fullTimeline: [],
    engagementChain: [],
    lastTouchpoints: [],
    heatStatus: "WARM",
    heatScore: 3,
    icpScore: lead.score,
    lastActivity: lead.days,
    pipelineStage: "pipeline",
    signalsCount: 1,
    contactEmail: "",
  });

  return (
    <div className="font-sans antialiased text-[var(--text-primary)]">
      {/* Header */}
      <header className="space-y-1 mb-6">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('hunter.newPipeline.breadcrumb')}</span>
        <h1 className="text-[28px] font-extrabold tracking-tight text-text-primary leading-tight">{t('hunter.newPipeline.title')}</h1>
        <p className="text-[13px] text-text-muted font-medium">{t('hunter.newPipeline.subtitle')}</p>
      </header>

      {/* Karten — volle Breite (= Leads), einheitliche HunterCard */}
      <div className="flex flex-col gap-4">
        {leads.map((lead) => {
          const data: HunterCardData = {
            id: lead.id,
            name: lead.name,
            jobTitle: lead.title,
            company: lead.company,
            avatarUrl: lead.avatar,
            icpScore: lead.score,
            stageLabel: lead.stage,
            heatStatus: lead.heatKey,
            timeLabel: lead.days,
            timeSubLabel: <span className="text-text-muted font-semibold">{t('hunter.newPipeline.label')}</span>,
          };

          // Action-Row = REFERENZ für alle Action-Rows.
          const actionRow = (
            <>
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <div className="flex items-center gap-1.5">
                  {lead.sourceType === 'ai_sdr'
                    ? <Bot size={15} className="text-[var(--sherloq-primary)]" />
                    : <UserCheck size={15} className="text-text-muted" />}
                  <span className={ACTION_ROW.strongText}>{lead.source}</span>
                </div>
                <span className="text-icon-muted">•</span>
                {lead.prepStatus !== 'none' && (
                  lead.prepStatus === 'ready' ? (
                    <div className="flex items-center gap-1.5 text-[var(--signal-success-text)] text-[12.5px] font-semibold">
                      <Check size={14} className="text-[var(--signal-success-text)] shrink-0" strokeWidth={3} />
                      <span>{t('hunter.newPipeline.prepReady')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[var(--signal-warn-text)] text-[12.5px] font-semibold">
                      <Clock size={14} className="text-[var(--signal-warn-text)] shrink-0 animate-spin" strokeWidth={2.5} />
                      <span>{t('hunter.newPipeline.prepLoading')}</span>
                    </div>
                  )
                )}
                {lead.meetingText && (
                  <div className="flex items-center gap-2 bg-[var(--signal-teal-bg)] border border-[var(--sherloq-primary)]/10 px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--sherloq-primary)] ml-1 shrink-0">
                    <Calendar size={13} className="shrink-0" />
                    <span>{lead.meetingText}</span>
                  </div>
                )}
              </div>

              <div className="shrink-0">
                {lead.btnType === 'primary' ? (
                  <button onClick={(e) => { e.stopPropagation(); triggerToast(t('hunter.newPipeline.toastActionDone', { action: lead.btnText })); }} className={ACTION_ROW.ctaPrimary}>
                    {lead.btnText}
                  </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); triggerToast(t('hunter.newPipeline.toastPrepStarting')); }} className={`${ACTION_ROW.ctaSecondary} flex items-center gap-1.5`}>
                    <RotateCw size={11} className="animate-spin text-[var(--sherloq-primary)]" />
                    {lead.btnText}
                  </button>
                )}
              </div>
            </>
          );

          return (
            <HunterCard
              key={lead.id}
              data={data}
              onOpenInfo={() => onSelectLead(buildLead(lead))}
              actionRow={actionRow}
            />
          );
        })}
      </div>

      {/* Toast — animate-bounce bleibt */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-on-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={14} className="text-emerald-400" strokeWidth={3} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
