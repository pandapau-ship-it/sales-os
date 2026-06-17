/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  ArrowRight,
  ChevronLeft,
  Plus,
  Zap,
  ChevronDown,
  ArrowLeft,
  AlertTriangle,
  Check,
  Trash,
  Clock,
  PenTool,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import type { Lead, HeatStatus } from '@/types';
import type { PipelineStage } from '@/types/hunter';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { heatFor } from '@/lib/constants';
import { ICPDonut } from '@/components/shared/ICPDonut';
import { NAV } from '@/lib/navBehavior';
import { AddSdrLeadPanel, ContactColdDrawer, EmptyState, FunnelAnalysis, HeatBadge, HunterCard, HunterSidepanel, KpiCard, LeadListRow, LinkedinSignalCard, NewInPipelineCards, NoTaskDrawer, PipelineKeineTaskCard, PipelineStagnatedDrawer, PipelineStagniertCard, SequenceLeadCards, SignalActionDrawer, StageBadge, TaskDrawer } from '@/components';
import type { SignalActionData } from '@/components';

import Avatar from '@/components/shared/Avatar';
import { ACTION_ROW } from '@/lib/componentBehavior';
import { signalToCardProps, type PipelineRow } from '@/lib/hunterMappers';

interface ScreenHuntingProps {
  leads: Lead[];
  // Slice 1: echte org-gescopte Leads (DB) NUR für den Leads-Tab. Fällt auf `leads`
  // (Mock) zurück, solange nicht gesetzt. Andere Tabs nutzen weiter `leads`.
  leadsData?: Lead[];
  leadsLoading?: boolean;
  leadsError?: boolean;
  // Slice A: echte Deals (org-gescoped) für die Pipeline-Listenansicht.
  dealsData?: PipelineRow[];
  dealsLoading?: boolean;
  dealsError?: boolean;
  // Slice B: Pipeline-Stages (settings.pipeline_stages) für die Kanban-Spalten.
  pipelineStages?: PipelineStage[];
  // S-2: echte Signals (org-gescoped, hunter-routed) für den Signals-Tab.
  signalsData?: Record<string, unknown>[];
  signalsLoading?: boolean;
  signalsError?: boolean;
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStage: (leadId: string, newStage: string) => void;
  onAddLead: (lead: Lead) => void;
  onSelectCommunication?: (personId: string, tpId: string) => void;
  onOpenCopilot?: (context?: 'elena' | 'marc') => void;
}

export default function ScreenHunting({
  leads,
  leadsData,
  leadsLoading,
  leadsError,
  dealsData,
  dealsLoading,
  dealsError,
  pipelineStages,
  signalsData,
  signalsLoading,
  signalsError,
  onAddLead,
  onSelectCommunication,
}: ScreenHuntingProps) {
  const { t } = useTranslation();
  // Leads-Tab-Quelle: echte DB-Leads, sonst Mock-Fallback. Nur dieser Tab + sein
  // Count/Select nutzen leadRows; Pipeline/Overview/Signals bleiben auf `leads`.
  const leadRows = leadsData ?? leads;
  // Pipeline-Listenansicht (Slice A): echte Deals. Kanban/Tasks bleiben Mock.
  const dealRows = dealsData ?? [];
  // Signals-Tab (S-2): echte Signals → Card-Props (Mapping braucht t).
  const signalCards = (signalsData ?? []).map((s) => signalToCardProps(s, t));
  // Slice C — drei Filter, client-seitig über die geteilte dealRows-Quelle:
  //  • Heat + Owner gelten in BEIDEN Ansichten (Liste + Kanban)
  //  • Stage NUR in der Liste (Kanban ist bereits nach Stage gruppiert)
  const [stageFilter, setStageFilter] = useState('all');         // slug | 'all'
  const [heatFilter, setHeatFilter] = useState<'all' | HeatStatus>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');         // ownerId-Key | 'all'
  const ownerKey = (id: string | null) => id ?? '__none__';      // Radix verbietet '' als Value
  // Stufe 1 (beide Ansichten): Heat + Owner
  const baseFilteredDeals = dealRows.filter((d) =>
    (heatFilter === 'all' || d.heatStatus === heatFilter) &&
    (ownerFilter === 'all' || ownerKey(d.ownerId) === ownerFilter)
  );
  // Stufe 2 (nur Liste): zusätzlich Stage
  const listDealRows = stageFilter === 'all'
    ? baseFilteredDeals
    : baseFilteredDeals.filter((d) => d.stageSlug === stageFilter);
  // Owner-Optionen = distinct aus allen geladenen Deals (unabhängig vom aktiven Filter)
  const ownerOptions = Array.from(
    new Map(dealRows.map((d) => [ownerKey(d.ownerId), d.ownerLabel])).entries(),
  ).map(([id, label]) => ({ id, label }));
  const [subTab, setSubTab] = useState<'overview' | 'new_leads' | 'leads' | 'pipeline' | 'signals' | 'sequences' | 'follow_ups'>('leads');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  // Kanban: Spalten default expanded (Slice B); key = echter stage.slug.
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});
  // Pipeline-Tab: Listenansicht ↔ Kanban (Toggle); 'tasks' = jetzige Task-Liste (per Button).
  const [pipelineView, setPipelineView] = useState<'list' | 'kanban' | 'tasks'>('list');
  // Task-Ansicht auf einen einzelnen Task fokussiert (aus Kanban-Pill heraus geöffnet).
  const [focusedTask, setFocusedTask] = useState<'stagniert' | 'keine_task' | null>(null);
  const openTaskCount = 2; // Mock — Phase 3: COUNT(tasks WHERE status='open')

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
  // Karten-Aktion (Mail/Task/Chat) → Info-Panel öffnet direkt mit dieser Aktion.
  const [infoPanelAction, setInfoPanelAction] = useState<'mail' | 'task' | 'chat' | null>(null);

  const toggleLeadSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
    );
  };
  const selectAll = () => setSelectedLeadIds(leadRows.map(l => l.id));
  const deselectAll = () => setSelectedLeadIds([]);

  // Signals-Auswahl (gleiche Mechanik wie Leads). IDs = Namen der Signal-Kacheln.
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const signalIds = signalCards.map((s) => s.id); // echte signals.id statt Namen
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
    { id: 'leads', label: t('hunter.tabs.leads'), count: leadRows.length },
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
      <div className={`${NAV.container} ${NAV.surface} ${NAV.radius}`}>
        {menuItems.map((item) => {
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              style={isActive ? { background: NAV.activeBg } : undefined}
              className={`${NAV.subTab} ${NAV.radius} ${isActive ? NAV.active : NAV.inactive}`}
            >
              <span>{item.label}</span>
              {item.count !== null && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-[5px] ${isActive ? NAV.badgeActive : NAV.badgeInactive}`}>
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
            <KpiCard
              title={t('hunter.overview.pipelineValue')}
              icon={<TrendingUp size={16} strokeWidth={2.5} />}
              iconClass="bg-[var(--signal-success-bg)] text-[var(--sherloq-primary)]"
              value="€ 284.500"
              valueClass="text-text-primary"
              subtitleClass="text-[11px] font-semibold text-[var(--signal-success-text)] flex items-center gap-1.5"
              subtitle={<span><TrendingUp className="w-3 h-3" /> {t('hunter.overview.pipelineValueTrend')}</span>}
            />

            {/* KPI Card 2: Deals in Gefahr */}
            <KpiCard
              title={t('hunter.overview.dealsAtRisk')}
              icon={<AlertTriangle size={16} strokeWidth={2.5} />}
              iconClass="bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)]"
              value="4"
              valueClass="text-[var(--signal-urgent-text)]"
              subtitleClass="text-[11px] font-semibold text-text-muted"
              subtitle={t('hunter.overview.stagnatedOver7Days')}
            />

            {/* KPI Card 3: Heisse Signale */}
            <KpiCard
              title={t('hunter.overview.hotSignals')}
              icon={<Zap size={16} strokeWidth={2.5} />}
              iconClass="bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]"
              value="7"
              valueClass="text-[var(--sherloq-primary)]"
              subtitleClass="text-[11px] font-semibold text-text-muted"
              subtitle={t('hunter.overview.activeSignalsToday')}
            />

            {/* KPI Card 4: Follow-ups heute */}
            <KpiCard
              title={t('hunter.overview.followUpsToday')}
              icon={<Clock size={16} strokeWidth={2.5} />}
              iconClass="bg-[var(--signal-info-bg)] text-[var(--signal-info-text)]"
              value="5"
              valueClass="text-text-primary"
              subtitleClass="text-[11px] font-semibold text-text-muted"
              subtitle={t('hunter.overview.dueBy1800')}
            />

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
                heatStatus="HOT"
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
                heatStatus: "WARM",
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
                heatStatus: "COLD",
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
                heatStatus: "COLD",
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
                  confidence: 80, tags: ["Cold", "E-Mail erschöpft", "LinkedIn noch nicht versucht"],
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
                onClick={selectedLeadIds.length === leadRows.length ? deselectAll : selectAll}
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

          {leadsLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[76px] rounded-[12px] bg-app-surface border border-[var(--border-card)] animate-pulse" />
              ))}
            </div>
          ) : leadsError ? (
            <div className="px-4 py-10 text-center text-[13px] text-[var(--signal-urgent-text)]">
              Leads konnten nicht geladen werden.
            </div>
          ) : leadRows.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="Noch keine Leads"
              description="Füge deinen ersten Lead hinzu"
              action={{ label: '+ SDR Lead hinzufügen', onClick: () => setShowAddModal(true) }}
            />
          ) : leadRows.map((lead) => {
            const isExpanded = expandedLeadId === lead.id;
            return (
              <LeadListRow
                key={lead.id}
                lead={lead}
                isExpanded={isExpanded}
                selected={selectedLeadIds.includes(lead.id)}
                onToggleExpand={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                onToggleSelect={(e) => toggleLeadSelection(lead.id, e)}
                onOpenInfo={() => setInfoPanelLead(lead)}
                onAction={(a) => { setInfoPanelAction(a); setInfoPanelLead(lead); }}
                onSelectCommunication={onSelectCommunication}
              />
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

          {/* Slice C — Filterleiste (Liste + Kanban, nicht Tasks). Heat+Owner beide,
              Stage nur Liste. Client-seitig über die geteilte dealRows-Quelle. */}
          {pipelineView !== 'tasks' && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[12px] font-bold text-text-muted">Filter:</span>
              <Select value={heatFilter} onValueChange={(v) => setHeatFilter(v as 'all' | HeatStatus)}>
                <SelectTrigger className="w-[170px] rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Heat-Stufen</SelectItem>
                  {(['HOT', 'WARM', 'LUKEWARM', 'COLD', 'DEAD'] as HeatStatus[]).map((h) => (
                    <SelectItem key={h} value={h}>{heatFor(h).label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[190px] rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Deal Owner</SelectItem>
                  {ownerOptions.map((o) => (<SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
              {pipelineView === 'list' && (
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[190px] rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Stages</SelectItem>
                    {[...(pipelineStages ?? [])].sort((a, b) => a.order - b.order).map((s) => (
                      <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <span className="text-[12px] text-text-muted ml-auto font-medium">
                {(pipelineView === 'list' ? listDealRows.length : baseFilteredDeals.length)} Deals
              </span>
            </div>
          )}

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
              {/* Slice B: Spalten aus settings.pipeline_stages (slug/name/order), echte Deals.
                  Stage-Pfeile/Stagnations-Pills/Action-Badges entfallen (Writes/fingierte
                  Signale → eigene Slices). */}
              {[...(pipelineStages ?? [])].sort((a, b) => a.order - b.order).map((stage) => {
                const colDeals = baseFilteredDeals
                  .filter((d) => d.stageSlug === stage.slug)
                  .sort((a, b) => (b.icpScore ?? 0) - (a.icpScore ?? 0));
                const count = colDeals.length;
                const totalEur = colDeals.reduce((sum, d) => sum + (d.valueEur ?? 0), 0);
                const isExpanded = expandedCols[stage.slug] ?? true;

                return (
                  <div key={stage.slug} className="flex-1 min-w-[290px] w-[290px] max-w-[290px] flex flex-col h-fit transition-all duration-300 relative">
                    {/* Column Header */}
                    <div className="bg-app-surface rounded-[12px] p-4 shadow-[var(--shadow-card)] mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[15px] text-[var(--text-primary)]">{stage.name}</h3>
                          <div className="min-w-[24px] h-6 px-1.5 rounded-full border border-border text-text-muted text-[11px] font-semibold flex items-center justify-center bg-app-bg shadow-sm">
                            {count}
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedCols(prev => ({ ...prev, [stage.slug]: !(prev[stage.slug] ?? true) }))}
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
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalEur)}
                        </div>
                      </div>
                    </div>

                    {/* Cards (nur wenn expanded) */}
                    {isExpanded && (
                      <div className="flex flex-col gap-3">
                        {colDeals.length === 0 ? (
                          <div className="px-3 py-6 text-center text-[12px] text-text-muted">Keine Deals</div>
                        ) : colDeals.map((deal) => (
                          <div key={deal.id} className="bg-app-surface rounded-[12px] p-4 shadow-[var(--shadow-card)] hover:shadow-md transition-all duration-300 relative group">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar name={deal.contactName} size={40} />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-[13px] text-[var(--text-primary)] leading-tight truncate">{deal.contactName}</span>
                                  <span className="text-[11px] text-[var(--sherloq-primary)] leading-tight truncate mt-0.5">{deal.company}</span>
                                  {deal.valueEur !== null && (
                                    <span className="text-[11px] font-bold text-[var(--text-primary)] mt-1">
                                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(deal.valueEur)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-[38px] flex items-center justify-center shrink-0">
                                {deal.icpScore != null && <ICPDonut score={deal.icpScore} />}
                              </div>
                            </div>
                            <div className="flex justify-start pt-1">
                              <HeatBadge status={deal.heatStatus} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-8">
              {/* Deals-Tabelle (Count + Filter sitzen in der Filterleiste oben) */}
              <div className="bg-app-surface rounded-[12px] border border-border shadow-[var(--shadow-card)] overflow-hidden">
                <div className="grid grid-cols-[2.2fr_1.4fr_1.2fr_1fr_1.2fr_auto] gap-4 px-4 py-2.5 bg-app-bg border-b border-border text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                  <span>Kontakt</span>
                  <span>Stage</span>
                  <span>Deal Owner</span>
                  <span>Wert</span>
                  <span>Heat</span>
                  <span className="w-8" />
                </div>
                {dealsLoading ? (
                  <div className="px-4 py-10 text-center text-[13px] text-text-muted">Lädt …</div>
                ) : dealsError ? (
                  <div className="px-4 py-10 text-center text-[13px] text-[var(--signal-urgent-text)]">Deals konnten nicht geladen werden.</div>
                ) : listDealRows.length === 0 ? (
                  <div className="px-4 py-10 text-center text-[13px] text-text-muted">Keine Deals für diese Filter.</div>
                ) : listDealRows.map((deal) => (
                  <div key={deal.id} className="grid grid-cols-[2.2fr_1.4fr_1.2fr_1fr_1.2fr_auto] gap-4 px-4 py-3 items-center border-b border-border-subtle last:border-0 hover:bg-app-bg transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={deal.contactName} size={32} />
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-text-primary truncate">{deal.contactName}</div>
                        <div className="text-[11px] text-text-muted truncate">{deal.company}</div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <StageBadge stage={deal.stageLabel} />
                    </div>
                    <span className="text-[12px] text-text-body font-medium truncate">{deal.ownerLabel}</span>
                    <span className="text-[12px] font-bold text-text-primary">
                      {deal.valueEur !== null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(deal.valueEur) : '—'}
                    </span>
                    <div className="min-w-0">
                      <HeatBadge status={deal.heatStatus} />
                    </div>
                    <button
                      onClick={() => setInfoPanelLead(makeLead(deal.id, deal.contactName, deal.contactJobTitle, deal.company, deal.initials, 75))}
                      className="w-8 h-8 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:scale-105 transition-all flex items-center justify-center shadow-sm cursor-pointer shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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

          {signalsLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[88px] rounded-[12px] bg-app-surface border border-[var(--border-card)] animate-pulse" />
              ))}
            </div>
          ) : signalsError ? (
            <div className="px-4 py-10 text-center text-[13px] text-[var(--signal-urgent-text)]">Signale konnten nicht geladen werden.</div>
          ) : signalCards.length === 0 ? (
            <EmptyState
              icon={<Zap className="w-6 h-6" />}
              title="Keine Signale heute"
              description="Neue Signale erscheinen hier automatisch"
            />
          ) : (
            signalCards.map(({ id, ...cardProps }) => (
              <LinkedinSignalCard
                key={id}
                {...cardProps}
                showUrgency={false}
                showStage={false}
                selected={selectedSignalIds.includes(id)}
                onToggleSelect={(e) => toggleSignalSelection(id, e)}
                onOpenInfo={setInfoPanelLead}
              />
            ))
          )}
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
        initialAction={infoPanelAction}
        onClose={() => { setInfoPanelLead(null); setInfoPanelAction(null); }}
      />

    </div>
  );
}
