/**
 * LeadListRow — Lead-Listenzeile (Hunter „Leads"-Liste): collapsed Top-Row
 * (Avatar/ICP/Company/Stage/Heat/Zeit/Pfeil) + aufklappbarer Detailbereich
 * (KI-Kurzakte · Deal Details · Aktionen · Communication Chain).
 * Kanonischer Stand aus screens/ScreenHunting.tsx. Prop-driven (State/Handler beim Aufrufer).
 */
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Check, AlertTriangle, ChevronUp, ChevronDown, ArrowRight, Zap, Briefcase,
  Target, Mail, CalendarCheck, MessageSquare,
} from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import { ICPDonut } from "@/components/shared/ICPDonut";
import CommunicationChain from "@/components/shared/CommunicationChain";
import { HeatBadge, StageBadge } from '@/components';

export default function LeadListRow({
  lead, isExpanded, selected, onToggleExpand, onToggleSelect, onOpenInfo, onSelectCommunication,
}: {
  lead: any;
  isExpanded: boolean;
  selected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: (e: MouseEvent) => void;
  onOpenInfo: () => void;
  onSelectCommunication: any;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`group rounded-[12px] p-4 flex flex-col gap-4 shadow-[var(--shadow-card)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-[var(--border-card)] relative ${
        selected ? 'bg-[var(--signal-teal-bg)]' : 'bg-app-surface'
      }`}
      onClick={onToggleExpand}
    >
      {/* TOP ROW / COLLAPSED STATE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative transition-transform duration-300">

        {/* Select Checkbox (Hover/Selected state) */}
        <div
          onClick={onToggleSelect}
          className={`absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-[22px] h-[22px] rounded-md z-10 ${
            selected ? 'bg-[var(--sherloq-primary)] opacity-100 border-[var(--sherloq-primary)]' : 'bg-app-surface border-2 border-[var(--border)] hover:border-[var(--text-muted)]'
          }`}
        >
          {selected && <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />}
        </div>

        {/* Avatar & Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0 ml-0 group-hover:ml-8 transition-all duration-300">
          <div className="relative shrink-0">
            <Avatar name={lead.person.name} src={lead.person.avatarUrl} size={40} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-bold text-[var(--text-primary)] font-sans">{lead.person.name}</span>
            <span className="text-[12px] text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate">
              {lead.person.jobTitle}, {lead.person.company}
            </span>
          </div>
        </div>

        {/* ICP donut & Company Area */}
        <div className="hidden md:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
          <div className="w-[48px] flex items-center justify-center">
            <ICPDonut score={lead.icpScore ?? 87} />
          </div>

          <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
            <div className="bg-[var(--text-primary)] text-on-accent text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0">
              {lead.person.company.charAt(0).toUpperCase()}
            </div>
            <span className="text-[14px] text-[var(--sherloq-primary)] font-semibold w-[120px] truncate">{lead.person.company}</span>
          </div>
        </div>

        {/* Middle Stats (Simplified) */}
        <div className="hidden lg:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
          <div className="flex flex-col items-center justify-center w-[80px] relative h-full">
            <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">{t('hunter.common.stage')}</span>
            <StageBadge stage={lead.pipelineStage === 'pipeline' ? 'Demo' : 'Lead'} />
          </div>
          <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
            <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">{t('hunter.common.heat')}</span>
            <HeatBadge status={lead.heatStatus} />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-subtle)] shrink-0 justify-between md:justify-end">
          <div className="flex flex-col items-end hidden sm:flex w-[130px]">
            <span className="text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap">{t('hunter.common.ago', { label: '5 Tagen' })}</span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[var(--icp-low)] font-semibold text-[12px] whitespace-nowrap w-full">
              {t('hunter.common.daysInStage', { days: 8 })} <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center gap-3 relative w-[90px] justify-end">
            <button className="w-8 h-8 flex items-center justify-center text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--app-bg)]">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              className="w-10 h-10 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] hover:scale-105 transition-all flex items-center justify-center shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInfo();
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="flex flex-col gap-6 border-t border-[var(--border-subtle)] pt-5 mt-2" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Column (KI Kurzakte) */}
            <div className="md:col-span-7 bg-app-surface rounded-[12px] p-5 border border-[var(--border)]">
              <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--sherloq-primary)] uppercase tracking-wider mb-4">
                <Zap className="w-4 h-4 text-[var(--sherloq-primary)]" /> {t('hunter.common.kiKurzakte')}
              </div>
              <ul className="flex flex-col gap-3 text-[13px] text-[var(--text-body)] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
                  Hat Budget-Freeze bis Q3 bestätigt. Trotzdem starkes Interesse an Feature Y — fragte aktiv nach ROI-Zahlen.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
                  Persönlichkeit: Blau — analytisch, entscheidet auf Basis von Daten. Kein Smalltalk, direkt zum Punkt.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
                  Objection: Timing wegen Budget-Freeze. Echter Einwand — kein Vorwand. ROI-Argument ist der Schlüssel.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
                  Buying Signal: Demo sehr positiv, fragte nach Implementierungs-Zeitplan. Abschluss realistisch ab Q4.
                </li>
              </ul>
            </div>

            {/* Right Column (Deal Details & Aktionen) */}
            <div className="md:col-span-5 flex flex-col gap-5">
              {/* Deal Details */}
              <div className="bg-app-surface rounded-[12px] p-5 border border-[var(--border)]">
                <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-wider mb-4">
                  <Briefcase className="w-4 h-4" /> {t('hunter.leadCard.dealDetails')}
                </div>
                <div className="grid grid-cols-2 gap-4 text-[12px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">{t('hunter.leadCard.volume')}</span>
                    <span className="font-bold text-[var(--sherloq-primary)] text-[14px]">24.000 € ARR</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">{t('hunter.leadCard.duration')}</span>
                    <span className="font-bold text-[var(--text-primary)] text-[14px]">12 Monate</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">{t('hunter.common.stage')}</span>
                    <span className="font-bold text-[var(--icp-low)] text-[14px] flex items-center gap-1.5">
                      Demo <span className="font-semibold text-[var(--icp-low)]"><AlertTriangle className="w-3 h-3" /> 8T</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">{t('hunter.leadCard.probability')}</span>
                    <span className="font-bold text-[var(--text-primary)] text-[14px]">60%</span>
                  </div>
                </div>
              </div>

              {/* Aktionen */}
              <div className="bg-app-surface rounded-[12px] p-5 border border-[var(--border)]">
                <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-wider mb-4">
                  <Target className="w-4 h-4" /> {t('hunter.leadCard.actions')}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button className="flex-1 bg-app-surface border border-[var(--border)] text-[var(--text-body)] text-[12px] font-semibold py-2 rounded-[12px] hover:bg-[var(--app-bg)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                      <Mail className="w-3.5 h-3.5" /> {t('hunter.leadCard.mail')}
                    </button>
                    <button className="flex-1 bg-app-surface border border-[var(--border)] text-[var(--text-body)] text-[12px] font-semibold py-2 rounded-[12px] hover:bg-[var(--app-bg)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                      <CalendarCheck className="w-3.5 h-3.5" /> {t('hunter.leadCard.task')}
                    </button>
                    <button className="flex-1 bg-app-surface border border-[var(--border)] text-[var(--text-body)] text-[12px] font-semibold py-2 rounded-[12px] hover:bg-[var(--app-bg)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                      <ArrowRight className="w-3.5 h-3.5" /> {t('hunter.common.stage')}
                    </button>
                  </div>
                  <button className="w-full bg-app-surface border border-[var(--border)] hover:bg-[var(--app-bg)] text-[var(--text-primary)] font-bold text-[13px] py-2.5 rounded-[12px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                    <MessageSquare className="w-4 h-4 text-[var(--sherloq-primary)]" /> {t('hunter.leadCard.startAiChat')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Communication Chain */}
          <CommunicationChain
            personId={lead.id}
            onSelectCommunication={onSelectCommunication}
          />
        </div>
      )}
    </div>
  );
}
