import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar, Clock, Check, Bot,
  UserCheck, ArrowUpRight, RotateCw
} from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { ICPDonut } from '@/components/shared/ICPDonut';

export default function NewInPipelineCards({ onSelectLead }: { onSelectLead: (lead: any) => void }) {
  const { t } = useTranslation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const leads = [
    {
      id: 'l1',
      name: "Sarah Jenkins",
      title: "VP Sales EMEA",
      company: "Atrium GmbH",
      initials: "A",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      score: 92,
      stage: "Demo",
      heat: "Aktiv",
      heatColor: "bg-emerald-50 text-emerald-700 border-emerald-150",
      heatDot: "bg-emerald-500",
      days: "vor 2 Tagen",
      source: "Via AI SDR · Termin gebucht",
      sourceType: "ai_sdr",
      prepStatus: "ready",
      meetingText: "Demo · 12. Juni · 14:00",
      btnText: "Meeting-Prep ansehen →",
      btnType: "primary"
    },
    {
      id: 'l2',
      name: "Marcus Müller",
      title: "Head of Business Development",
      company: "LogixFlow GmbH",
      initials: "L",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      score: 68,
      stage: "Discovery",
      heat: "Warm",
      heatColor: "bg-amber-50 text-amber-700 border-amber-150",
      heatDot: "bg-amber-500",
      days: "vor 3 Tagen",
      source: "Via AI SDR · Termin gebucht",
      sourceType: "ai_sdr",
      prepStatus: "loading",
      meetingText: "Discovery · 14. Juni · 10:30",
      btnText: "Meeting-Prep generieren",
      btnType: "secondary_glow"
    },
    {
      id: 'l3',
      name: "Elena Rostova",
      title: "RevOps Specialist",
      company: "Quantum Dynamics",
      initials: "Q",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      score: 45,
      stage: "Proposal",
      heat: "Kalt",
      heatColor: "bg-blue-50 text-blue-700 border-blue-150",
      heatDot: "bg-blue-500",
      days: "vor 5 Tagen",
      source: "Manuell hinzugefügt",
      sourceType: "manual",
      prepStatus: "none",
      meetingText: null,
      btnText: "Termin vereinbaren →",
      btnType: "primary"
    }
  ];

  return (
    <div className="font-sans antialiased text-[var(--text-primary)]">
      <div className="max-w-[1040px] space-y-8">

        {/* Header Section */}
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('hunter.newPipeline.breadcrumb')}</span>
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 leading-tight">
            {t('hunter.newPipeline.title')}
          </h1>
          <p className="text-[13px] text-gray-400 font-medium">
            {t('hunter.newPipeline.subtitle')}
          </p>
        </header>

        {/* Dynamic Cards List — Kachel-Designvorgaben (rounded-12, shadow-card, border-card),
            2-Zeilen-Aufbau (Spec §5.1), Animationen bleiben erhalten. */}
        <section className="space-y-4">
          {leads.map(lead => (
            <div
              key={lead.id}
              className="bg-white rounded-[12px] shadow-[var(--shadow-card)] border border-[var(--border-card)] flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* LINE 1: Lead Info — Padding 16px */}
              <div className="px-4 pt-4 pb-4 flex items-center justify-between flex-wrap gap-4">

                {/* Left Side Profile Details */}
                <div className="flex items-center gap-4 min-w-[280px]">
                  <div className="relative shrink-0">
                    <Avatar name={lead.name} src={lead.avatar} size={40} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-[var(--text-primary)] leading-tight">{lead.name}</h3>
                    <p className="text-[12px] font-medium text-[var(--text-muted)] mt-1 truncate">{lead.title}</p>
                  </div>
                </div>

                {/* Score & Badges Row */}
                <div className="flex items-center gap-6 flex-wrap">

                  {/* ICP Donut (kanonisch) */}
                  <ICPDonut score={lead.score} />

                  {/* Company — dunkle Initial-Box + Teal-Name (Kachel-Vorgabe) */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-[var(--text-primary)] text-white text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0">
                      {lead.initials}
                    </div>
                    <span className="text-[14px] text-[var(--sherloq-primary)] font-semibold truncate max-w-[140px]">{lead.company}</span>
                  </div>

                  {/* Stage Badge (Neutral Outline) */}
                  <div>
                    <div className="px-3 py-1 rounded-full border border-gray-200 text-gray-500 text-[12px] font-bold bg-gray-50/50">
                      {lead.stage}
                    </div>
                  </div>

                  {/* Heat Badge */}
                  <div>
                    <div className={`px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1.5 border ${lead.heatColor}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${lead.heatDot}`}></div>
                      {lead.heat}
                    </div>
                  </div>

                  {/* Days Info & Arrow */}
                  <div className="flex items-center gap-4 ml-2">
                    <div className="text-right">
                      <p className="text-[12px] font-bold text-[var(--text-primary)] leading-none">{lead.days}</p>
                      <span className="text-[11px] text-gray-400 font-semibold mt-1 inline-block">{t('hunter.newPipeline.label')}</span>
                    </div>

                    <button
                      onClick={() => onSelectLead({ ...lead, type: 'lead' })}
                      className="w-10 h-10 rounded-full bg-[var(--signal-teal-bg)] hover:bg-[var(--signal-teal-bg)] hover:scale-105 text-[var(--sherloq-primary)] flex items-center justify-center transition-all border border-transparent shadow-sm"
                    >
                      <ArrowUpRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                </div>

              </div>

              {/* LINE 2: Note / Vermerk (Spec §5.1, Zeile 2) — Padding 16px */}
              <div className="bg-[var(--app-bg)] border-t border-[var(--border-card)] px-4 py-3 flex items-center justify-between flex-wrap gap-4">

                {/* Source & Status text details */}
                <div className="flex items-center gap-2.5 text-[12.5px] font-semibold text-gray-500 flex-wrap">

                  {/* Origin Icon */}
                  <div className="flex items-center gap-1.5">
                    {lead.sourceType === 'ai_sdr' ? (
                      <Bot size={15} className="text-[var(--sherloq-primary)]" />
                    ) : (
                      <UserCheck size={15} className="text-gray-500" />
                    )}
                    <span className="text-gray-800">{lead.source}</span>
                  </div>

                  {/* Separator Dot */}
                  <span className="text-gray-300">•</span>

                  {/* Prep Status — Spinner-Animation bleibt */}
                  {lead.prepStatus !== 'none' && (
                    <div className="flex items-center gap-1.5">
                      {lead.prepStatus === 'ready' ? (
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                          <span>{t('hunter.newPipeline.prepReady')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <Clock size={14} className="text-amber-500 shrink-0 animate-spin" strokeWidth={2.5} />
                          <span>{t('hunter.newPipeline.prepLoading')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Appointment detail block */}
                  {lead.meetingText && (
                    <div className="flex items-center gap-2 bg-[var(--signal-teal-bg)] border border-[var(--sherloq-primary)]/10 px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--sherloq-primary)] ml-2 shrink-0">
                      <Calendar size={13} className="shrink-0" />
                      <span>{lead.meetingText}</span>
                    </div>
                  )}

                </div>

                {/* Primary Action Button */}
                <div className="shrink-0">
                  {lead.btnType === 'primary' ? (
                    <button
                      onClick={() => triggerToast(t('hunter.newPipeline.toastActionDone', { action: lead.btnText }))}
                      className="px-4 py-1.5 bg-[var(--sherloq-primary)] hover:opacity-90 text-white rounded-full text-[11px] font-black transition-opacity shadow-sm"
                    >
                      {lead.btnText}
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerToast(t('hunter.newPipeline.toastPrepStarting'))}
                      className="px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-[11px] font-black transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      {/* Spinner-Animation bleibt */}
                      <RotateCw size={11} className="animate-spin text-[var(--sherloq-primary)]" />
                      {lead.btnText}
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))}
        </section>

      </div>

      {/* Global Toast — animate-bounce bleibt */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-950 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={14} className="text-emerald-400" strokeWidth={3} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
