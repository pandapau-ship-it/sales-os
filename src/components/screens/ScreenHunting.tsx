/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Mail, 
  MessageSquare, 
  ArrowRight,
  ChevronLeft,
  Plus,
  Briefcase,
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  CalendarCheck,
  Check,
  Trash,
  Clock,
  PenTool,
  TrendingUp,
  X
} from 'lucide-react';
import type { Lead } from '@/types';
import { ICPDonut } from '@/components/shared/ICPDonut';
import CommunicationChain from '@/components/shared/CommunicationChain';
import { SequenceLeadCards } from '@/components/shared/SequenceLeadCards';
import NewInPipelineCards from '@/components/shared/NewInPipelineCards';
import { PipelineStagniertCard } from '@/components/shared/PipelineStagniertCard';
import { PipelineKeineTaskCard } from '@/components/shared/PipelineKeineTaskCard';
import FunnelAnalysis from '@/components/shared/FunnelAnalysis';

import Avatar from '@/components/shared/Avatar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import AddSdrLeadPanel from '@/components/features/hunter/AddSdrLeadPanel';
import { getHeatColor } from '@/lib/heatUtils';
import TaskDrawer from '@/components/shared/TaskDrawer';
import { LinkedinSignalCard } from '@/components/shared/LinkedinSignalCard';
import SignalActionDrawer from '@/components/shared/SignalActionDrawer';
import type { SignalActionData } from '@/components/shared/SignalActionDrawer';
import HunterCard from '@/components/shared/HunterCard';
import HunterSidepanel from '@/components/shared/HunterSidepanel';
import { ACTION_ROW } from '@/lib/componentBehavior';
import PipelineStagnatedDrawer from '@/components/shared/PipelineStagnatedDrawer';
import ContactColdDrawer from '@/components/shared/ContactColdDrawer';
import NoTaskDrawer from '@/components/shared/NoTaskDrawer';

interface ScreenHuntingProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStage: (leadId: string, newStage: string) => void;
  onAddLead: (lead: Lead) => void;
  onSelectCommunication?: (personId: string, tpId: string) => void;
  onOpenCopilot?: (context?: 'elena' | 'marc') => void;
}

// Pipeline-Stage-Slug → Anzeigename (wie die Kanban-Spalten; später aus settings.pipeline_stages).
const STAGE_LABELS: Record<string, string> = {
  lead: 'Backlog',
  pipeline: 'Demo vereinbart',
  signal: 'Follow-up offen',
  sequence: 'Onboarding offen',
  trial: 'Free Trial',
};
// Mock-Deal-Owner (Phase 3: aus deals.owner / users). Deterministisch je Lead.
const DEAL_OWNERS = ['Oliver Sand', 'Lena Brandt', 'Marc Vogel'];
const ownerForLead = (id: string) =>
  DEAL_OWNERS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % DEAL_OWNERS.length];

export default function ScreenHunting({
  leads,
  onUpdateLeadStage,
  onAddLead,
  onSelectCommunication,
}: ScreenHuntingProps) {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<'overview' | 'new_leads' | 'leads' | 'pipeline' | 'signals' | 'sequences' | 'follow_ups'>('leads');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({ lead: true, pipeline: true, signal: true, sequence: false, trial: false });
  // Pipeline-Tab: Listenansicht ↔ Kanban (Toggle); 'tasks' = jetzige Task-Liste (per Button).
  const [pipelineView, setPipelineView] = useState<'list' | 'kanban' | 'tasks'>('list');
  const [dealOwnerFilter, setDealOwnerFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  // Task-Ansicht auf einen einzelnen Task fokussiert (aus Kanban-Pill heraus geöffnet).
  const [focusedTask, setFocusedTask] = useState<'stagniert' | 'keine_task' | null>(null);
  // Pro Kanban-Spalte: nur Karten mit Action-Bedarf zeigen (Toggle über die Action-Badge).
  const [actionFilterCols, setActionFilterCols] = useState<Record<string, boolean>>({});
  const openTaskCount = 2; // Mock — Phase 3: COUNT(tasks WHERE status='open')
  // Listenansicht: Deals nach Owner + Stage gefiltert.
  const pipelineDeals = leads.filter((l) =>
    (stageFilter === 'all' || l.pipelineStage === stageFilter) &&
    (dealOwnerFilter === 'all' || ownerForLead(l.id) === dealOwnerFilter)
  );
  
  // Local state for Quick Lead Adder Dialog
  const [showAddModal, setShowAddModal] = useState(false);

  const [taskLead, setTaskLead] = useState<{name: string, company: string, initials: string, color: string} | null>(null);
  const [taskTitle] = useState('Erster Outreach empfohlen — LinkedIn DM');
  const [taskNote] = useState('Hallo Sarah,\n\nich habe gerade gesehen, dass CloudSphere stark skaliert. Da wir viele BDR-Teams im selben Bereich unterstützen, dachte ich, ein kurzer Connect macht Sinn.\n\nViele Grüße');

  const [selectedSignal, setSelectedSignal] = useState<SignalActionData | null>(null);
  const [selectedStagnatedPerson, setSelectedStagnatedPerson] = useState<any | null>(null);
  const [selectedColdPerson, setSelectedColdPerson] = useState<any | null>(null);
  const [selectedNoTaskPerson, setSelectedNoTaskPerson] = useState<any | null>(null);
  // Info-Panel (§22.1, 820px) — vorerst NUR im Leads-Tab inline rechts neben der Liste.
  const [infoPanelLead, setInfoPanelLead] = useState<Lead | null>(null);

  const toggleLeadSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
    );
  };
  const selectAll = () => setSelectedLeadIds(leads.map(l => l.id));
  const deselectAll = () => setSelectedLeadIds([]);

  // Signals-Auswahl (gleiche Mechanik wie Leads). IDs = Namen der Signal-Kacheln.
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const signalIds = ['Maja Voje', 'Sarah Jenkins', 'Marc Levigne', 'Elena Rostova', 'Dr. Christian Brand'];
  const toggleSignalSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSignalIds(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };
  const selectAllSignals = () => setSelectedSignalIds(signalIds);
  const deselectAllSignals = () => setSelectedSignalIds([]);

  // Minimaler Lead für das Info-Panel (Übersicht-Demokarten; später aus DB).
  const makeLead = (id: string, name: string, jobTitle: string, company: string, initials: string, icpScore: number): Lead => ({
    id,
    person: { id, name, jobTitle, company, initials },
    kurzakte: '', fullTimeline: [], engagementChain: [], lastTouchpoints: [],
    heatStatus: 'WARM', heatScore: 3, icpScore, lastActivity: '',
    pipelineStage: 'pipeline', signalsCount: 1, contactEmail: '',
  });

  const menuItems = [
    { id: 'overview', label: t('hunter.tabs.overview'), count: null },
    { id: 'signals', label: t('hunter.tabs.signals'), count: 5 },
    { id: 'new_leads', label: t('hunter.tabs.newInPipeline'), count: null },
    { id: 'leads', label: t('hunter.tabs.leads'), count: leads.length },
    { id: 'follow_ups', label: t('hunter.tabs.followUps'), count: 2 },
    { id: 'pipeline', label: t('hunter.tabs.pipelineKanban'), count: null },
  ];




  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">{t('hunter.title')}</h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{t('hunter.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)]/95 text-on-accent text-[12px] font-semibold px-4 py-2 rounded-full cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t('hunter.addSdrLead')}</span>
        </button>
      </div>

      {/* Sub-Navigation (Section 12) */}
      <div className="flex gap-1 p-1 bg-app-surface rounded-[12px] shadow-[var(--shadow-card)] w-fit items-center">
        {menuItems.map((item) => {
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              style={isActive ? { background: "var(--sherloq-gradient)" } : undefined}
              className={`px-4.5 py-1.5 text-[12px] font-medium transition-all rounded-[9px] cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'text-on-accent shadow-sm'
                  : 'text-[var(--text-body)] hover:bg-[var(--app-bg)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{item.label}</span>
              {item.count !== null && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-[5px] ${isActive ? 'bg-app-surface text-[var(--sherloq-primary)]' : 'bg-[var(--border)] text-[var(--text-body)]'}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. VIEW OVERVIEW */}
      {subTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* KPI Cards oben */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            
            {/* KPI Card 1: Pipeline-Wert */}
            <div className="bg-app-surface rounded-[12px] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold text-text-muted uppercase tracking-widest">
                  {t('hunter.overview.pipelineValue')}
                </span>
                <div className="w-8 h-8 rounded-[12px] bg-[var(--signal-success-bg)] text-[var(--sherloq-primary)] flex items-center justify-center shrink-0">
                  <TrendingUp size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <div className="text-[32px] font-extrabold text-text-primary tracking-tighter leading-none mb-1">
                  € 284.500
                </div>
                <div className="text-[11px] font-semibold text-[var(--signal-success-text)] flex items-center gap-1.5">
                  <span><TrendingUp className="w-3 h-3" /> {t('hunter.overview.pipelineValueTrend')}</span>
                </div>
              </div>
            </div>

            {/* KPI Card 2: Deals in Gefahr */}
            <div className="bg-app-surface rounded-[12px] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold text-text-muted uppercase tracking-widest">
                  {t('hunter.overview.dealsAtRisk')}
                </span>
                <div className="w-8 h-8 rounded-[12px] bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)] flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <div className="text-[32px] font-extrabold text-[var(--signal-urgent-text)] tracking-tighter leading-none mb-1">
                  4
                </div>
                <div className="text-[11px] font-semibold text-text-muted">
                  {t('hunter.overview.stagnatedOver7Days')}
                </div>
              </div>
            </div>

            {/* KPI Card 3: Heisse Signale */}
            <div className="bg-app-surface rounded-[12px] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold text-text-muted uppercase tracking-widest">
                  {t('hunter.overview.hotSignals')}
                </span>
                <div className="w-8 h-8 rounded-[12px] bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] flex items-center justify-center shrink-0">
                  <Zap size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <div className="text-[32px] font-extrabold text-[var(--sherloq-primary)] tracking-tighter leading-none mb-1">
                  7
                </div>
                <div className="text-[11px] font-semibold text-text-muted">
                  {t('hunter.overview.activeSignalsToday')}
                </div>
              </div>
            </div>

            {/* KPI Card 4: Follow-ups heute */}
            <div className="bg-app-surface rounded-[12px] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold text-text-muted uppercase tracking-widest">
                  {t('hunter.overview.followUpsToday')}
                </span>
                <div className="w-8 h-8 rounded-[12px] bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] flex items-center justify-center shrink-0">
                  <Clock size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <div className="text-[32px] font-extrabold text-text-primary tracking-tighter leading-none mb-1">
                  5
                </div>
                <div className="text-[11px] font-semibold text-text-muted">
                  {t('hunter.overview.dueBy1800')}
                </div>
              </div>
            </div>

          </div>

          <FunnelAnalysis />

          <div className="mt-2 flex flex-col gap-4">
            
            {/* SIGNALS SECTION */}
            <div className="mb-4">
              <LinkedinSignalCard
                name="Maja Voje"
                role="GTM Strategist"
                avatarUrl="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120"
                companyInitials="GL"
                companyName="Growth Lab"
                stage="Onboarding"
                icpScore={92}
                timeAgo="11m"
                timeAgoLabel="11 Min"
                timeLeftHours={4}
                windowHours={72}
                actionText="Hat auf Kommentar geantwortet — GTM Strategie"
                commentText="Anze Voje postete über GTM Strategien für 2026 — Maja Voje antwortete und verknüpfte das Thema mit Sales Enablement."
                quoteText="The first working week of 2026 is wrapping up..."
                aiRecommendation="Idealer Zeitpunkt — Post-Thema passt direkt zu Sherloq. Maja ist gerade aktiv. Persönlichkeit Blau: sachlicher Einstieg mit konkretem Bezug zum Post."
                onActNow={setSelectedSignal}
                onOpenInfo={setInfoPanelLead}
              />
            </div>


            <HunterCard
              data={{
                id: "ov-sarah", name: "Sarah Jenkins", jobTitle: "Head of Business Development", company: "CloudSphere", icpScore: 65, stageLabel: "Lead",
                heat: { bgClass: "bg-[var(--signal-warn-bg)]", textClass: "text-[var(--icp-medium)] border-[var(--signal-warn-bg)]", label: t("hunter.heat.stable") },
                timeLabel: t("hunter.common.ago", { label: "3 Tagen" }),
                timeSubLabel: <span className="text-text-muted font-semibold">{t("hunter.common.newInPipeline")}</span>,
              }}
              onOpenInfo={() => setInfoPanelLead(makeLead("ov-sarah", "Sarah Jenkins", "Head of Business Development", "CloudSphere", "SJ", 65))}
              statusDotClass="bg-[var(--icp-medium)]"
              actionRow={<>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-warn-bg)] text-[var(--icp-medium)] text-[10px] font-bold uppercase tracking-wider shrink-0"><AlertTriangle className="w-[11px] h-[11px]" /> {t("hunter.leadCard.noTask")}</span>
                  <span className={ACTION_ROW.strongText}>{t("hunter.leadCard.noTaskHint")}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedNoTaskPerson({ name: "Sarah Jenkins", company: "CloudSphere" }); }} className={ACTION_ROW.ctaSecondary}>{t("hunter.leadCard.createTask")}</button>
              </>}
            />

            <HunterCard
              data={{
                id: "ov-marc", name: "Marc Levigne", jobTitle: "Sales Director France", company: "DataPulse Corp", icpScore: 41, stageLabel: "Follow-up",
                heat: { bgClass: "bg-[var(--signal-info-bg)]", textClass: "text-[var(--signal-info-text)] border-[var(--signal-info-bg)]", label: t("hunter.heat.resting") },
                timeLabel: t("hunter.common.ago", { label: "12 Tagen" }),
                timeSubLabel: <>{t("hunter.common.daysInStage", { days: 12 })} <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} /></>,
              }}
              onOpenInfo={() => setInfoPanelLead(makeLead("ov-marc", "Marc Levigne", "Sales Director France", "DataPulse Corp", "ML", 41))}
              statusDotClass="bg-[var(--signal-info-text)]"
              actionRow={<>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-urgent-bg)] text-[var(--icp-low)] text-[10px] font-bold uppercase tracking-wider shrink-0"><Clock className="w-[11px] h-[11px]" /> {t("hunter.leadCard.stagnated")}</span>
                  <span className={ACTION_ROW.strongText}>{t("hunter.leadCard.stagnatedHint")}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedStagnatedPerson({
                  name: "Marc Levigne", company: "DataPulse Corp", icpScore: 41,
                  daysStagnated: 12, stageName: "Follow-up offen", lastContactDays: 12,
                  arr: "8.000€", probability: "50%",
                  aiRecommendation: "Kanalwechsel empfehlen — nach 12 Tagen ohne Reaktion ein kurzer, konkreter Nachfass mit klarem CTA.",
                  aiInsight: "Follow-up offen seit 12 Tagen · letzter Kontakt ohne Antwort",
                  tags: ["Follow-up überfällig", "Kanalwechsel sinnvoll"], confidence: 76,
                }); }} className={ACTION_ROW.ctaSecondary}>{t("hunter.leadCard.nextStep")}</button>
              </>}
            />

            <HunterCard
              data={{
                id: "ov-elena", name: "Elena Rostova", jobTitle: "Head of Operations", company: "Quantum Dynamics", icpScore: 55, stageLabel: "Onboarding",
                heat: { bgClass: "bg-[var(--signal-info-bg)]", textClass: "text-[var(--signal-info-text)] border-[var(--signal-info-bg)]", label: t("hunter.heat.cold") },
                timeLabel: t("hunter.common.ago", { label: "32 Tagen" }),
                timeSubLabel: <>{t("hunter.common.daysInStage", { days: 32 })} <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} /></>,
              }}
              onOpenInfo={() => setInfoPanelLead(makeLead("ov-elena", "Elena Rostova", "Head of Operations", "Quantum Dynamics", "ER", 55))}
              statusDotClass="bg-[var(--signal-info-text)]"
              actionRow={<>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0"><PenTool className="w-[11px] h-[11px]" /> {t("hunter.leadCard.cold")}</span>
                  <span className={ACTION_ROW.strongText}>{t("hunter.leadCard.coldHint")}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0"><button onClick={(e) => { e.stopPropagation(); setSelectedColdPerson({
                  name: "Elena Rostova", company: "Quantum Dynamics",
                  daysInStage: 32, lastContactDays: 32, lastContactChannel: "Email",
                  lastConversationSentiment: "Letztes Gespräch: Neutral · seit 32 Tagen kein Kontakt",
                  aiRecommendation: "Reaktivierung über LinkedIn — E-Mail-Kanal erschöpft, persönlicher Aufhänger nötig.",
                  confidence: 80, tags: ["Kalt", "E-Mail erschöpft", "LinkedIn noch nicht versucht"],
                }); }} className={ACTION_ROW.ctaSecondary}>{t("hunter.leadCard.startOutreach")}</button><button onClick={(e) => e.stopPropagation()} className={ACTION_ROW.ctaSecondary}>{t("hunter.common.snooze")}</button></div>
              </>}
            />

          </div>
        </div>
      )}

      {subTab === 'follow_ups' && (
        <SequenceLeadCards onOutreachClick={(person) => setSelectedColdPerson(person)} onSelectLead={setInfoPanelLead} />
      )}

      {/* NEW LEADS VIEW */}
      {subTab === 'new_leads' && (
        <NewInPipelineCards onSelectLead={setInfoPanelLead} />
      )}

      {/* 2. VIEW LEADS (LIST) */}
      {subTab === 'leads' && (
        <div className="flex flex-col gap-4">

          {/* List Actions / Select All Bar */}
          <div className={`transition-all duration-300 flex items-center justify-between px-2 ${selectedLeadIds.length > 0 ? 'opacity-100 h-10 mb-2' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={selectedLeadIds.length === leads.length ? deselectAll : selectAll}
                className="flex items-center justify-center w-[22px] h-[22px] rounded-md bg-[var(--sherloq-primary)] border border-[var(--sherloq-primary)]"
              >
                <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />
              </button>
              <span className="text-[13px] font-bold text-[var(--text-primary)]">
                {t('hunter.leadCard.selected', { count: selectedLeadIds.length, noun: selectedLeadIds.length === 1 ? t('hunter.leadCard.leadSingular') : t('hunter.leadCard.leadPlural') })}
              </span>
              <button onClick={deselectAll} className="ml-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-body)] font-semibold underline underline-offset-2">{t('hunter.leadCard.deselect')}</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-app-surface border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Target className="w-3.5 h-3.5" /> {t('hunter.leadCard.addToCampaign')}
              </button>
              <button className="bg-app-surface border border-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {leads.map((lead) => {
            const isExpanded = expandedLeadId === lead.id;

            return (
              <div
                key={lead.id}
                className={`group rounded-[12px] p-4 flex flex-col gap-4 shadow-[var(--shadow-card)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-[var(--border-card)] relative ${
                  selectedLeadIds.includes(lead.id) ? 'bg-[var(--signal-teal-bg)]' : 'bg-app-surface'
                }`}
                onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
              >
                {/* TOP ROW / COLLAPSED STATE */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative transition-transform duration-300">
                  
                  {/* Select Checkbox (Hover/Selected state) */}
                  <div 
                    onClick={(e) => toggleLeadSelection(lead.id, e)}
                    className={`absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-[22px] h-[22px] rounded-md z-10 ${
                      selectedLeadIds.includes(lead.id) ? 'bg-[var(--sherloq-primary)] opacity-100 border-[var(--sherloq-primary)]' : 'bg-app-surface border-2 border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    {selectedLeadIds.includes(lead.id) && <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />}
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
                      <div className="px-3 py-1 rounded-full bg-[var(--app-bg)] text-[var(--text-body)] text-[12px] font-semibold border border-[var(--border)]">
                        {lead.pipelineStage === 'pipeline' ? 'Demo' : 'Lead'}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
                      <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">{t('hunter.common.heat')}</span>
                      <div className={`px-3 py-1 rounded-full text-[12px] font-semibold border flex items-center gap-1.5 ${getHeatColor(lead.heatStatus).bg} ${getHeatColor(lead.heatStatus).text}`}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getHeatColor(lead.heatStatus).dot }} />
                        {getHeatColor(lead.heatStatus).label}
                      </div>
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
                          setInfoPanelLead(lead);
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
          })}
        </div>
      )}

      {/* 3. VIEW PIPELINE (KANBAN BOARD) */}
      {subTab === 'pipeline' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
            <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
              {t('hunter.pipeline.title')}
            </h2>

            <div className="flex items-center gap-2">
              {/* Task-Liste-Button mit Anzahl offener Tasks → öffnet die Task-Ansicht */}
              <button
                onClick={() => { setFocusedTask(null); setPipelineView('tasks'); }}
                className={`px-3.5 py-1.5 rounded-[10px] text-[13px] font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
                  pipelineView === 'tasks'
                    ? 'bg-[var(--sherloq-primary)] text-on-accent border-[var(--sherloq-primary)]'
                    : 'bg-app-surface text-[var(--text-body)] border-[var(--border)] hover:bg-[var(--app-bg)]'
                }`}
              >
                {t('hunter.pipeline.taskList')}
                <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                  pipelineView === 'tasks' ? 'bg-on-accent/20 text-on-accent' : 'bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]'
                }`}>
                  {openTaskCount}
                </span>
              </button>

              {/* Toggle: Listenansicht ↔ Kanban */}
              <div className="flex bg-[var(--app-bg)] rounded-[10px] p-1 border border-[var(--border)]">
                <button
                  onClick={() => setPipelineView('list')}
                  className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all cursor-pointer ${
                    pipelineView === 'list'
                      ? 'bg-app-surface shadow-sm text-[var(--sherloq-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
                  }`}
                >
                  {t('hunter.pipeline.listView')}
                </button>
                <button
                  onClick={() => setPipelineView('kanban')}
                  className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all cursor-pointer ${
                    pipelineView === 'kanban'
                      ? 'bg-app-surface shadow-sm text-[var(--sherloq-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
                  }`}
                >
                  {t('hunter.pipeline.kanban')}
                </button>
              </div>
            </div>
          </div>

          {pipelineView === 'tasks' ? (
            <div className="flex flex-col gap-4 w-full pb-8">
              {focusedTask && (
                <button onClick={() => setFocusedTask(null)} className="text-[12px] font-bold text-[var(--sherloq-primary)] hover:underline flex items-center gap-1.5 w-fit cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> Alle Tasks anzeigen
                </button>
              )}
              {(!focusedTask || focusedTask === 'stagniert') && (
              <PipelineStagniertCard onSelectLead={setInfoPanelLead} onTaskAnlegen={() => setSelectedStagnatedPerson({
                name: "Dr. Christian Brand",
                company: "LogixFlow GmbH",
                avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
                icpScore: 87,
                daysStagnated: 8,
                stageName: "Demo",
                lastContactDays: 8,
                arr: "12.500€",
                probability: "100%",
                aiRecommendation: "Kanalwechsel zu LinkedIn — Email ohne Response. Persönliche Nachricht mit Bezug auf letztes Gespräch.",
                aiInsight: "Letztes Meeting: Demo positiv · Budget-Freeze erwähnt · Entscheider eingebunden",
                tags: ["Email erschöpft", "LinkedIn noch nicht versucht", "ICP Score hoch"],
                confidence: 87
              })} />
              )}
              {(!focusedTask || focusedTask === 'keine_task') && (
              <PipelineKeineTaskCard onSelectLead={setInfoPanelLead} onTaskAnlegen={() => setSelectedNoTaskPerson({
                name: "Sarah Jenkins",
                company: "CloudSphere"
              })} />
              )}
            </div>
          ) : pipelineView === 'kanban' ? (
            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-6 items-start min-h-[600px] w-full hide-scrollbar">
              {[
                { id: 'lead', title: 'Backlog', prev: null, next: 'pipeline' },
                { id: 'pipeline', title: 'Demo vereinbart', prev: 'lead', next: 'signal' },
                { id: 'signal', title: 'Follow-up offen', prev: 'pipeline', next: 'sequence' },
                { id: 'sequence', title: 'Onboarding offen', prev: 'signal', next: 'trial' },
                { id: 'trial', title: 'Free Trial', prev: 'sequence', next: null }
              ].map((col) => {
                const colLeads = leads.filter(l => l.pipelineStage === col.id).sort((a, b) => (b.icpScore ?? 0) - (a.icpScore ?? 0));
                const count = colLeads.length;
                const isExpanded = expandedCols[col.id];
                const actionsCount = colLeads.filter(l => l.heatStatus === 'HOT' || l.heatStatus === 'WARM').length;
                const totalValue = colLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
                const actionActive = !!actionFilterCols[col.id];
                const displayLeads = actionActive ? colLeads.filter(l => l.heatStatus === 'HOT' || l.heatStatus === 'WARM') : colLeads;

                return (
                  <div key={col.id} className="flex-1 min-w-[290px] w-[290px] max-w-[290px] flex flex-col h-fit transition-all duration-300 relative">
                    {/* Column Header */}
                    <div className="bg-app-surface rounded-[12px] p-4 shadow-[var(--shadow-card)] mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[15px] text-[var(--text-primary)]">{col.title}</h3>
                          <div className="min-w-[24px] h-6 px-1.5 rounded-full border border-border text-text-muted text-[11px] font-semibold flex items-center justify-center bg-app-bg shadow-sm">
                            {count}
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedCols(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                          className="w-7 h-7 rounded-full bg-app-bg hover:bg-app-bg flex items-center justify-center border border-transparent hover:border-border transition-colors z-10 cursor-pointer shadow-sm"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronLeft className="w-4 h-4 text-text-muted" />}
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[34px] font-extrabold leading-none tracking-tight text-[var(--text-primary)]">{count}</span>
                          <span className="text-[12px] text-text-muted font-medium">{t('hunter.pipeline.opportunities')}</span>
                        </div>
                        <div className="text-[14px] font-bold text-[var(--text-primary)] mt-1">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalValue)}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center border-t border-border-subtle pt-3">
                        <span className="text-[11px] text-text-muted font-medium">{t('hunter.common.status')}</span>
                        {actionsCount > 0 ? (
                          <button
                            onClick={() => {
                              setActionFilterCols(prev => ({ ...prev, [col.id]: !prev[col.id] }));
                              setExpandedCols(prev => ({ ...prev, [col.id]: true }));
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm border transition-colors cursor-pointer ${
                              actionActive
                                ? 'bg-[var(--signal-urgent-text)] text-on-accent border-[var(--signal-urgent-text)]'
                                : 'bg-app-surface text-[var(--signal-urgent-text)] border-[var(--signal-urgent-bg)] hover:bg-[var(--signal-urgent-bg)]'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${actionActive ? 'bg-on-accent' : 'bg-[var(--icp-low)]'}`}></div>
                            {actionsCount} {actionsCount !== 1 ? t('hunter.pipeline.actionsPlural') : t('hunter.pipeline.actions')}
                          </button>
                        ) : (
                          <div className="bg-app-surface text-[var(--icp-high)] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm border border-[var(--icp-high)]/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('hunter.pipeline.inFlow')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cards List (Only if expanded) */}
                    {isExpanded && (
                      <div className="flex flex-col gap-3">
                        {displayLeads.map(lead => {
                          // Karten-Signal: stagnierter Deal oder fehlende Task (klickbar → Task-Liste).
                          let pill: { label: string; task: 'stagniert' | 'keine_task'; colorClass: string; icon: any } | null = null;
                          if (lead.heatStatus === 'HOT') pill = { label: 'Deal stagniert', task: 'stagniert', colorClass: 'text-[var(--signal-urgent-text)] bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)]', icon: <Clock className="w-3 h-3" /> };
                          else if (lead.heatStatus === 'WARM') pill = { label: 'Task fehlt', task: 'keine_task', colorClass: 'text-[var(--signal-warn-text)] bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)]', icon: <AlertTriangle className="w-3 h-3" /> };
                          
                          return (
                            <div key={lead.id} className="bg-app-surface rounded-[12px] p-4 shadow-[var(--shadow-card)] hover:shadow-md transition-all duration-300 relative group">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <Avatar name={lead.person.name} src={lead.person.avatarUrl} size={40} />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-[13px] text-[var(--text-primary)] leading-tight truncate">{lead.person.name}</span>
                                    <span className="text-[11px] text-[var(--sherloq-primary)] leading-tight truncate mt-0.5">{lead.person.company}</span>
                                    {lead.dealValue && (
                                      <span className="text-[11px] font-bold text-[var(--text-primary)] mt-1">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(lead.dealValue)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="w-[38px] flex items-center justify-center shrink-0">
                                  <ICPDonut score={lead.icpScore ?? 75} />
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center mt-2 pt-2">
                                {pill ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setFocusedTask(pill!.task); setPipelineView('tasks'); }}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity ${pill.colorClass}`}
                                  >
                                    {pill.icon}
                                    <span>{pill.label}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                ) : <div />}
                                
                                <div className="flex items-center gap-2">
                                  {col.prev && (
                                    <button 
                                      onClick={() => onUpdateLeadStage(lead.id, col.prev!)}
                                      className="w-7 h-7 rounded-full bg-[var(--app-bg)] hover:bg-[var(--border)] text-[var(--text-muted)] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                                    >
                                      <ArrowLeft className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {col.next && (
                                    <button 
                                      onClick={() => onUpdateLeadStage(lead.id, col.next!)}
                                      className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)] text-on-accent flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                                    >
                                      <ArrowRight className="w-3 h-3 stroke-[3]" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-8">
              {/* Filter: Deal Owner + Stage */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12px] font-bold text-text-muted">Filter:</span>
                <Select value={dealOwnerFilter} onValueChange={setDealOwnerFilter}>
                  <SelectTrigger className="w-[190px] rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Deal Owner</SelectItem>
                    {DEAL_OWNERS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[190px] rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Stages</SelectItem>
                    {Object.entries(STAGE_LABELS).map(([id, label]) => (<SelectItem key={id} value={id}>{label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <span className="text-[12px] text-text-muted ml-auto font-medium">{pipelineDeals.length} Deals</span>
              </div>

              {/* Deals-Tabelle */}
              <div className="bg-app-surface rounded-[12px] border border-border shadow-[var(--shadow-card)] overflow-hidden">
                <div className="grid grid-cols-[2.2fr_1.4fr_1.2fr_1fr_1.2fr_auto] gap-4 px-4 py-2.5 bg-app-bg border-b border-border text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                  <span>Kontakt</span>
                  <span>Stage</span>
                  <span>Deal Owner</span>
                  <span>Wert</span>
                  <span>Heat</span>
                  <span className="w-8" />
                </div>
                {pipelineDeals.map((lead) => {
                  const heat = getHeatColor(lead.heatStatus);
                  return (
                    <div key={lead.id} className="grid grid-cols-[2.2fr_1.4fr_1.2fr_1fr_1.2fr_auto] gap-4 px-4 py-3 items-center border-b border-border-subtle last:border-0 hover:bg-app-bg transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={lead.person.name} src={lead.person.avatarUrl} size={32} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-text-primary truncate">{lead.person.name}</div>
                          <div className="text-[11px] text-text-muted truncate">{lead.person.company}</div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-app-bg text-text-body text-[11px] font-semibold border border-border truncate max-w-full">
                          {STAGE_LABELS[lead.pipelineStage] ?? lead.pipelineStage}
                        </span>
                      </div>
                      <span className="text-[12px] text-text-body font-medium truncate">{ownerForLead(lead.id)}</span>
                      <span className="text-[12px] font-bold text-text-primary">
                        {lead.dealValue ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(lead.dealValue) : '—'}
                      </span>
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border w-fit ${heat.bg} ${heat.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: heat.dot }} />
                          {heat.label}
                        </span>
                      </div>
                      <button
                        onClick={() => setInfoPanelLead(lead)}
                        className="w-8 h-8 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-all flex items-center justify-center shadow-sm cursor-pointer shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {pipelineDeals.length === 0 && (
                  <div className="px-4 py-10 text-center text-[13px] text-text-muted">Keine Deals für diese Filter.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SIGNALS TAB */}
      {subTab === 'signals' && (
        <div className="flex flex-col gap-4">

          {/* Bulk-Aktionsleiste — gleiche Leiste wie bei Leads */}
          <div className={`transition-all duration-300 flex items-center justify-between px-2 ${selectedSignalIds.length > 0 ? 'opacity-100 h-10 mb-2' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={selectedSignalIds.length === signalIds.length ? deselectAllSignals : selectAllSignals}
                className="flex items-center justify-center w-[22px] h-[22px] rounded-md bg-[var(--sherloq-primary)] border border-[var(--sherloq-primary)]"
              >
                <Check className="w-3.5 h-3.5 text-on-accent" strokeWidth={3} />
              </button>
              <span className="text-[13px] font-bold text-[var(--text-primary)]">
                {t('hunter.signals.selected', { count: selectedSignalIds.length, noun: selectedSignalIds.length === 1 ? t('hunter.signals.signalSingular') : t('hunter.signals.signalPlural') })}
              </span>
              <button onClick={deselectAllSignals} className="ml-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-body)] font-semibold underline underline-offset-2">{t('hunter.signals.deselect')}</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-app-surface border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <X className="w-3.5 h-3.5" /> {t('hunter.signals.ignore')}
              </button>
              <button className="bg-app-surface border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Clock className="w-3.5 h-3.5" /> {t('hunter.signals.snooze')}
              </button>
              <button className="bg-app-surface border border-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <LinkedinSignalCard
            name="Maja Voje"
            selected={selectedSignalIds.includes("Maja Voje")}
            onToggleSelect={(e) => toggleSignalSelection("Maja Voje", e)}
            onOpenInfo={setInfoPanelLead}
            onActNow={setSelectedSignal}
            role="GTM Strategist"
            avatarUrl="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120"
            companyInitials="GL"
            companyName="Growth Lab"
            stage="Onboarding"
            icpScore={92}
            timeAgo="11m"
            timeAgoLabel="11 Min"
            timeLeftHours={4}
            windowHours={72}
            actionText="Hat auf Kommentar geantwortet — GTM Strategie"
            commentText="Anze Voje postete über GTM Strategien für 2026 — Maja Voje antwortete und verknüpfte das Thema mit Sales Enablement."
            quoteText="The first working week of 2026 is wrapping up..."
            aiRecommendation="Idealer Zeitpunkt — Post-Thema passt direkt zu Sherloq. Maja ist gerade aktiv. Persönlichkeit Blau: sachlicher Einstieg mit konkretem Bezug zum Post."
          />
          <LinkedinSignalCard
            name="Sarah Jenkins"
            selected={selectedSignalIds.includes("Sarah Jenkins")}
            onToggleSelect={(e) => toggleSignalSelection("Sarah Jenkins", e)}
            onOpenInfo={setInfoPanelLead}
            onActNow={setSelectedSignal}
            role="VP of Sales"
            companyInitials="CS"
            companyName="CloudSphere"
            stage="Trial"
            icpScore={85}
            timeAgo="2h"
            timeLeftHours={20}
            windowHours={48}
            actionText="Neuer Beitrag — BDR Skalierung"
            commentText="Sarah hat einen neuen LinkedIn Beitrag über die Skalierung von BDR-Teams im EMEA-Raum veröffentlicht."
            quoteText="Building a high-performing BDR team takes time, but what if..."
            aiRecommendation="Hohe Relevanz! Sie thematisiert BDR Skalierung. Ein Reply, der Sherloqs schnelle Ramp-up Zeit erwähnt, wäre perfekt."
          />
          <LinkedinSignalCard
            name="Marc Levigne"
            selected={selectedSignalIds.includes("Marc Levigne")}
            onToggleSelect={(e) => toggleSignalSelection("Marc Levigne", e)}
            onOpenInfo={setInfoPanelLead}
            onActNow={setSelectedSignal}
            role="CPO"
            companyInitials="DP"
            companyName="DataPulse Corp"
            stage="Proposal"
            icpScore={78}
            timeAgo="5h"
            timeLeftHours={43}
            windowHours={48}
            actionText="Hat Beitrag geliked — Sales Ops Trends"
            commentText="Marc hat den aktuellen Beitrag von Gartner Analysten zu Sales Ops Automation Tendenzen 2026 geliked."
            aiRecommendation="Er recherchiert weiter. Ideal um jetzt mit echten Case Studies zu Sherloqs Automatisierung nachzuhaken."
          />
          <LinkedinSignalCard
            name="Elena Rostova"
            selected={selectedSignalIds.includes("Elena Rostova")}
            onToggleSelect={(e) => toggleSignalSelection("Elena Rostova", e)}
            onOpenInfo={setInfoPanelLead}
            onActNow={setSelectedSignal}
            role="Head of SDR"
            companyInitials="QD"
            companyName="Quantum Dynamics"
            stage="Cold"
            icpScore={88}
            timeAgo="1d"
            timeLeftHours={48}
            windowHours={72}
            actionText="Firmen-News: Series B Funding"
            commentText="Quantum Dynamics hat auf LinkedIn die erfolgreiche Series B in Höhe von €18M verkündet."
            aiRecommendation="Nutze diesen Trigger für einen neuen Kanal! Gratuliere zur Finanzierungsrunde per LinkedIn Message."
          />
          <LinkedinSignalCard
            name="Dr. Christian Brand"
            selected={selectedSignalIds.includes("Dr. Christian Brand")}
            onToggleSelect={(e) => toggleSignalSelection("Dr. Christian Brand", e)}
            onOpenInfo={setInfoPanelLead}
            onActNow={setSelectedSignal}
            role="CEO"
            companyInitials="NX"
            companyName="Nexus"
            stage="Active"
            icpScore={95}
            timeAgo="15m"
            timeLeftHours={8}
            windowHours={24}
            actionText="Hat Profil besucht"
            commentText="Christian hat gerade dein LinkedIn Profil besucht, kurz nachdem du den Vorschlag per E-Mail gesendet hast."
            aiRecommendation="Sofort nachfassen! Er prüft gerade deine Authentizität und Lösung. Eine kurze LinkedIn Connectanfrage hinterherschicken."
          />
        </div>
      )}

      {/* SDR Lead anlegen — Action-Side-Panel (features/hunter/AddSdrLeadPanel) */}
      <AddSdrLeadPanel open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={onAddLead} />

      {taskLead && (
        <TaskDrawer 
          person={{
            person: {
              name: taskLead.name,
              company: taskLead.company,
              initials: taskLead.initials,
              jobTitle: 'VP of Growth'
            },
            icpScore: 92
          }}
          recommendedTitle={taskTitle}
          recommendedNote={taskNote}
          onClose={() => setTaskLead(null)}
          onSave={() => setTaskLead(null)}
        />
      )}


      <SignalActionDrawer
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />

      <PipelineStagnatedDrawer
        person={selectedStagnatedPerson}
        onClose={() => setSelectedStagnatedPerson(null)}
        onTakeAction={(text) => {
          console.log('Took action with text:', text);
        }}
      />

      <ContactColdDrawer
        person={selectedColdPerson}
        onClose={() => setSelectedColdPerson(null)}
      />

      <NoTaskDrawer
        person={selectedNoTaskPerson}
        onClose={() => setSelectedNoTaskPerson(null)}
      />

      {/* Info Panel (§22.1, 820px) — Slide-in-Overlay, vorerst nur Leads-Tab.
          Immer gemountet für die Ausfahr-Animation; person=null → geschlossen. */}
      <HunterSidepanel
        person={infoPanelLead?.person ?? null}
        onClose={() => setInfoPanelLead(null)}
      />

    </div>
  );
}
