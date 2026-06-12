/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Target, 
  Mail, 
  MessageSquare, 
  ArrowRight, 
  Flame, 
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
  TrendingUp
} from 'lucide-react';
import type { Lead, HeatStatus } from '@/types';
import { ICPDonut } from '@/components/shared/ICPDonut';
import CommunicationChain from '@/components/shared/CommunicationChain';
import { SequenceLeadCards } from '@/components/shared/SequenceLeadCards';
import NewInPipelineCards from '@/components/shared/NewInPipelineCards';
import { PipelineStagniertCard } from '@/components/shared/PipelineStagniertCard';
import { PipelineKeineTaskCard } from '@/components/shared/PipelineKeineTaskCard';
import FunnelAnalysis from '@/components/shared/FunnelAnalysis';

import TaskDrawer from '@/components/shared/TaskDrawer';
import { LinkedinSignalCard } from '@/components/shared/LinkedinSignalCard';
import SignalActionDrawer from '@/components/shared/SignalActionDrawer';
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

export default function ScreenHunting({
  leads,
  onSelectLead,
  onUpdateLeadStage,
  onAddLead,
  onSelectCommunication,
  onOpenCopilot
}: ScreenHuntingProps) {
  const [subTab, setSubTab] = useState<'overview' | 'new_leads' | 'leads' | 'pipeline' | 'signals' | 'sequences' | 'follow_ups'>('leads');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({ lead: true, pipeline: true, signal: true, sequence: false, trial: false });
  const [isKanbanView, setIsKanbanView] = useState(false);
  
  // Local state for Quick Lead Adder Dialog
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadRole, setNewLeadRole] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadAka, setNewLeadAka] = useState('');
  const [newLeadHeat, setNewLeadHeat] = useState<HeatStatus>('HOT');

  const [taskLead, setTaskLead] = useState<{name: string, company: string, initials: string, color: string} | null>(null);
  const [taskTitle] = useState('Erster Outreach empfohlen — LinkedIn DM');
  const [taskNote] = useState('Hallo Sarah,\n\nich habe gerade gesehen, dass CloudSphere stark skaliert. Da wir viele BDR-Teams im selben Bereich unterstützen, dachte ich, ein kurzer Connect macht Sinn.\n\nViele Grüße');

  const [selectedSignalPerson, setSelectedSignalPerson] = useState<any | null>(null);
  const [selectedStagnatedPerson, setSelectedStagnatedPerson] = useState<any | null>(null);
  const [selectedColdPerson, setSelectedColdPerson] = useState<any | null>(null);
  const [selectedNoTaskPerson, setSelectedNoTaskPerson] = useState<any | null>(null);

  const toggleLeadSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
    );
  };
  const selectAll = () => setSelectedLeadIds(leads.map(l => l.id));
  const deselectAll = () => setSelectedLeadIds([]);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany) return;

    const newLead: Lead = {
      id: `lead-new-${Date.now()}`,
      person: {
        id: `pers-new-${Date.now()}`,
        name: newLeadName,
        jobTitle: newLeadRole || 'Decision Maker',
        company: newLeadCompany,
        initials: newLeadName.split(' ').map(n => n[0]).join('').toUpperCase()
      },
      kurzakte: newLeadAka || 'Neu angelegter Lead für Outreach.',
      fullTimeline: ['Gerade erstellt via Lead-Formular.'],
      engagementChain: ['LINKEDIN'],
      lastTouchpoints: [
        { channel: 'LINKEDIN', date: 'vor 1 Min', sentiment: 'neutral', summary: 'Hinzugefügt' }
      ],
      heatStatus: newLeadHeat,
      heatScore: newLeadHeat === 'HOT' ? 5 : newLeadHeat === 'WARM' ? 4 : 3,
      lastActivity: 'Gerade eben',
      pipelineStage: 'lead',
      contactEmail: newLeadEmail || 'info@company.com'
    };

    onAddLead(newLead);
    setShowAddModal(false);
    // Reset
    setNewLeadName('');
    setNewLeadCompany('');
    setNewLeadRole('');
    setNewLeadEmail('');
    setNewLeadAka('');
  };

  const menuItems = [
    { id: 'overview', label: 'Übersicht', count: null },
    { id: 'signals', label: 'Signals', count: 5 },
    { id: 'new_leads', label: 'Neu in Pipeline', count: null },
    { id: 'leads', label: 'Leads', count: leads.length },
    { id: 'follow_ups', label: 'Follow-ups', count: 2 },
    { id: 'pipeline', label: 'Pipeline (Kanban)', count: null },
  ];

  const getHeatColor = (status: HeatStatus) => {
    switch (status) {
      case 'HOT': return { bg: 'bg-[var(--signal-success-bg)]', text: 'text-[var(--icp-high)] border-[var(--signal-success-bg)]', emoji: '🟢 Aktiv' };
      case 'WARM': return { bg: 'bg-[var(--signal-warn-bg)]', text: 'text-[var(--icp-medium)] border-[var(--signal-warn-bg)]', emoji: '🟠 Stabil' };
      case 'LUKEWARM': return { bg: 'bg-[var(--signal-warn-bg)]', text: 'text-[var(--icp-medium)] border-[var(--signal-warn-bg)]', emoji: '🟡 Rückläufig' };
      case 'COLD': return { bg: 'bg-[var(--signal-info-bg)]', text: 'text-[var(--signal-info-text)] border-[var(--signal-info-bg)]', emoji: '🔵 Ruhend' };
      default: return { bg: 'bg-[var(--app-bg)]', text: 'text-[var(--text-muted)] border-[var(--app-bg)]', emoji: '⚫ Inaktiv' };
    }
  };



  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">Hunter</h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Finde Leads, tracke Signale und verwalte Abschlussphasen.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)]/95 text-white text-[12px] font-semibold px-4 py-2 rounded-full cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>SDR Lead hinzufügen</span>
        </button>
      </div>

      {/* Sub-Navigation (Section 12) */}
      <div className="flex gap-1 p-1 bg-white rounded-[12px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] w-fit items-center">
        {menuItems.map((item) => {
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              style={isActive ? { background: "var(--sherloq-gradient)" } : undefined}
              className={`px-4.5 py-1.5 text-[12px] font-medium transition-all rounded-[9px] cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-[var(--text-body)] hover:bg-[var(--app-bg)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{item.label}</span>
              {item.count !== null && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-[5px] ${isActive ? 'bg-white text-[var(--sherloq-primary)]' : 'bg-[var(--border)] text-[var(--text-body)]'}`}>
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
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                  Pipeline Wert
                </span>
                <div className="w-8 h-8 rounded-[12px] bg-emerald-50 text-[var(--sherloq-primary)] flex items-center justify-center shrink-0">
                  <TrendingUp size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <div className="text-[32px] font-extrabold text-gray-900 tracking-tighter leading-none mb-1">
                  € 284.500
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span>▲ +12% gegenüber Vormonat</span>
                </div>
              </div>
            </div>

            {/* KPI Card 2: Deals in Gefahr */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                  Deals in Gefahr
                </span>
                <div className="w-8 h-8 rounded-[12px] bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <div className="text-[32px] font-extrabold text-red-600 tracking-tighter leading-none mb-1">
                  4
                </div>
                <div className="text-[11px] font-semibold text-gray-400">
                  Stagniert &gt; 7 Tage
                </div>
              </div>
            </div>

            {/* KPI Card 3: Heisse Signale */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                  Heisse Signale
                </span>
                <div className="w-8 h-8 rounded-[12px] bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] flex items-center justify-center shrink-0">
                  <Zap size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <div className="text-[32px] font-extrabold text-[var(--sherloq-primary)] tracking-tighter leading-none mb-1">
                  7
                </div>
                <div className="text-[11px] font-semibold text-gray-400">
                  Aktive Signale heute
                </div>
              </div>
            </div>

            {/* KPI Card 4: Follow-ups heute */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                  Follow-ups heute
                </span>
                <div className="w-8 h-8 rounded-[12px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <div className="text-[32px] font-extrabold text-gray-900 tracking-tighter leading-none mb-1">
                  5
                </div>
                <div className="text-[11px] font-semibold text-gray-400">
                  Fällig bis 18:00
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
              />
            </div>


            {/* Card 1: Sarah Jenkins */}
            <div className="group rounded-[32px] overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-[var(--border-subtle)] bg-white cursor-pointer transition-all duration-300">
              {/* TOP ROW */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Avatar & Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0 ml-0 transition-all duration-300">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--icp-medium)] text-white flex items-center justify-center text-[13px] font-bold shadow-sm">
                      SJ
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--signal-info-text)] border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-bold text-[var(--text-primary)] font-sans">Sarah Jenkins</span>
                    <span className="text-[12px] text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate">
                      Head of Business Development, CloudSphere
                    </span>
                  </div>
                </div>

                {/* ICP donut & Company Area */}
                <div className="hidden md:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
                  <div className="w-[48px] flex items-center justify-center">
                    <ICPDonut score={65} />
                  </div>
                  
                  <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
                    <div className="bg-[var(--text-body)] text-white text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0">
                      C
                    </div>
                    <span className="text-[14px] text-[var(--text-body)] font-semibold w-[120px] truncate">CloudSphere</span>
                  </div>
                </div>

                {/* Middle Stats */}
                <div className="hidden lg:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
                  <div className="flex flex-col items-center justify-center w-[80px] relative h-full">
                    <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">STAGE</span>
                    <div className="px-4 py-2 rounded-full bg-[var(--app-bg)] text-[var(--text-body)] text-[12px] font-semibold border border-[var(--border)]">
                      Lead
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
                    <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">HEAT</span>
                    <div className="px-4 py-2 rounded-full text-[12px] font-semibold border flex items-center gap-1.5 bg-[var(--signal-warn-bg)] text-[var(--icp-medium)] border-[var(--signal-warn-bg)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--icp-medium)]"></span>
                      Stabil
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-subtle)] shrink-0 justify-between md:justify-end">
                  <div className="flex flex-col items-end hidden sm:flex w-[130px]">
                    <span className="text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap">vor 3 Tagen</span>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[var(--text-muted)] font-semibold text-[12px] whitespace-nowrap w-full">
                      Neu in Pipeline
                    </div>
                  </div>
                  <div className="flex items-center gap-3 relative w-[90px] justify-end">
                    <button className="w-8 h-8 flex items-center justify-center text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--app-bg)]">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] hover:scale-105 transition-all flex items-center justify-center shadow-sm">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTTOM BANNER (Sarah) */}
              <div className="bg-[var(--app-bg)] border-t border-[var(--border)] flex flex-col xl:flex-row items-start xl:items-center justify-between px-5 md:px-8 py-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--signal-warn-bg)] text-[var(--icp-medium)] px-3 py-1.5 rounded-[8px] flex items-center gap-2 font-bold text-[14px] shrink-0">
                    <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
                    Keine Task
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--text-body)]">Pflicht — Deal braucht eine offene Aufgabe</span>
                </div>
                <div className="flex items-center gap-3 w-full xl:w-auto">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedNoTaskPerson({
                        name: "Sarah Jenkins",
                        company: "CloudSphere",
                        avatarInitials: "SJ",
                        avatarBg: "bg-[var(--icp-medium)]"
                      });
                    }}
                    className="flex-1 xl:flex-none bg-white border border-[var(--border)] text-[var(--text-body)] px-5 py-2.5 rounded-[12px] text-[13px] font-bold shadow-sm hover:bg-[var(--app-bg)] transition-colors whitespace-nowrap"
                  >
                    Task anlegen
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Marc Levigne */}
            <div className="group rounded-[32px] overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-[var(--border-subtle)] bg-white cursor-pointer transition-all duration-300">
              {/* TOP ROW */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Avatar & Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0 ml-0 transition-all duration-300">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--signal-info-text)] text-white flex items-center justify-center text-[13px] font-bold shadow-sm">
                      ML
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--signal-info-text)] border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-bold text-[var(--text-primary)] font-sans">Marc Levigne</span>
                    <span className="text-[12px] text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate">
                      Sales Director France, DataPulse Corp
                    </span>
                  </div>
                </div>

                {/* ICP donut & Company Area */}
                <div className="hidden md:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
                  <div className="w-[48px] flex items-center justify-center">
                    <ICPDonut score={41} />
                  </div>
                  
                  <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
                    <div className="bg-[var(--text-primary)] text-white text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0">
                      D
                    </div>
                    <span className="text-[14px] text-[var(--text-body)] font-semibold w-[120px] truncate">DataPulse Corp</span>
                  </div>
                </div>

                {/* Middle Stats */}
                <div className="hidden lg:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
                  <div className="flex flex-col items-center justify-center w-[80px] relative h-full">
                    <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">STAGE</span>
                    <div className="px-4 py-2 rounded-full bg-[var(--signal-urgent-bg)] text-[var(--icp-low)] text-[12px] font-semibold border border-[var(--signal-urgent-bg)]">
                      Follow-up
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
                    <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">HEAT</span>
                    <div className="px-4 py-2 rounded-full text-[12px] font-semibold border flex items-center gap-1.5 bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] border-[var(--signal-info-bg)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-info-text)]"></span>
                      Ruhend
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-subtle)] shrink-0 justify-between md:justify-end">
                  <div className="flex flex-col items-end hidden sm:flex w-[130px]">
                    <span className="text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap">vor 12 Tagen</span>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[var(--icp-low)] font-semibold text-[12px] whitespace-nowrap w-full">
                      12T in Stage <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 relative w-[90px] justify-end">
                    <button className="w-8 h-8 flex items-center justify-center text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--app-bg)]">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] hover:scale-105 transition-all flex items-center justify-center shadow-sm">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTTOM BANNER (Marc) */}
              <div className="bg-[var(--app-bg)] border-t border-[var(--border)] flex flex-col xl:flex-row items-start xl:items-center justify-between px-5 md:px-8 py-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--signal-urgent-bg)] text-[var(--icp-low)] px-3 py-1.5 rounded-[8px] flex items-center gap-2 font-bold text-[14px] shrink-0">
                    <Clock className="w-4 h-4" strokeWidth={2.5} />
                    Stagniert
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--text-body)]">Deal stagniert — AI empfiehlt nächsten Schritt</span>
                </div>
                <div className="flex items-center gap-3 w-full xl:w-auto">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onOpenCopilot?.('marc');
                    }}
                    className="flex-1 xl:flex-none bg-white border border-[var(--border)] text-[var(--text-body)] px-5 py-2.5 rounded-[12px] text-[13px] font-bold shadow-sm hover:bg-[var(--app-bg)] transition-colors whitespace-nowrap"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Elena Rostova */}
            <div className="group rounded-[32px] overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-[var(--border-subtle)] bg-white cursor-pointer transition-all duration-300">
              {/* TOP ROW */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Avatar & Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0 ml-0 transition-all duration-300">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-purple)] text-white flex items-center justify-center text-[16px] font-bold shadow-sm">
                      ER
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[16px] font-bold text-[var(--text-primary)] font-sans">Elena Rostova</span>
                    <span className="text-[13px] text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate">
                      Head of Operations, Quantum...
                    </span>
                  </div>
                </div>

                {/* ICP donut & Company Area */}
                <div className="hidden md:flex items-center gap-5 px-4 border-l border-[var(--border-subtle)] shrink-0">
                  <div className="w-[48px] flex items-center justify-center">
                    <ICPDonut score={55} />
                  </div>
                  
                  <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
                    <div className="bg-[var(--accent-purple)] text-white text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0">
                      Q
                    </div>
                    <span className="text-[14px] font-bold text-[var(--text-body)] truncate">Quantum Dynamics</span>
                  </div>
                </div>

                {/* Middle Stats */}
                <div className="hidden lg:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
                  <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
                    <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">STAGE</span>
                    <div className="px-5 py-2 rounded-full bg-white text-[var(--text-primary)] text-[13px] font-bold border-2 border-[var(--border)]">
                      Onboarding
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
                    <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">HEAT</span>
                    <div className="px-5 py-2 rounded-full text-[13px] font-bold border-2 flex items-center gap-1.5 bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] border-[var(--signal-info-bg)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--signal-info-text)] mt-[1px]"></span>
                      Kalt
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center pl-4 border-l border-[var(--border-subtle)] shrink-0 justify-between md:justify-end gap-5">
                  <div className="flex flex-col items-end hidden sm:flex w-[120px]">
                    <span className="text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap">vor 32 Tagen</span>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[var(--icp-low)] font-bold text-[13px] whitespace-nowrap w-full">
                      32T in Stage <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 relative w-[100px] justify-end">
                    <button className="w-10 h-10 flex items-center justify-center text-[var(--icon-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full bg-[var(--app-bg)] hover:bg-[var(--border)] border border-transparent">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <button className="w-11 h-11 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] hover:scale-105 transition-all flex items-center justify-center shadow-sm">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTTOM BANNER (Elena) */}
              <div className="bg-[var(--app-bg)] border-t border-[var(--border)] flex flex-col xl:flex-row items-start xl:items-center justify-between px-5 md:px-8 pt-3 pb-3.5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] px-3 py-1.5 rounded-[8px] flex items-center gap-2 font-bold text-[14px] shrink-0">
                    <PenTool className="w-4 h-4" strokeWidth={2.5} />
                    Kalt
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--text-body)]">Kontakt wird kalt. Letzter Kanal (Email) ohne Response. AI empfiehlt Kanalwechsel zu LinkedIn.</span>
                </div>
                <div className="flex items-center gap-3 w-full xl:w-auto">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onOpenCopilot?.('elena');
                    }}
                    className="flex-1 xl:flex-none bg-white border border-[var(--border)] text-[var(--text-body)] px-5 py-2.5 rounded-[12px] text-[13px] font-bold shadow-sm hover:bg-[var(--app-bg)] transition-colors whitespace-nowrap"
                  >
                    Start Outreach
                  </button>
                  <button className="flex-1 xl:flex-none bg-white border border-[var(--border)] text-[var(--text-body)] px-5 py-2.5 rounded-[12px] text-[13px] font-bold shadow-sm hover:bg-[var(--app-bg)] transition-colors whitespace-nowrap">
                    Snooze
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {subTab === 'follow_ups' && (
        <SequenceLeadCards onOutreachClick={(person) => setSelectedColdPerson(person)} />
      )}

      {/* NEW LEADS VIEW */}
      {subTab === 'new_leads' && (
        <NewInPipelineCards onSelectLead={onSelectLead} />
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
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </button>
              <span className="text-[13px] font-bold text-[var(--text-primary)]">
                {selectedLeadIds.length} {selectedLeadIds.length === 1 ? 'Lead' : 'Leads'} ausgewählt
              </span>
              <button onClick={deselectAll} className="ml-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-body)] font-semibold underline underline-offset-2">Auswahl aufheben</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-white border text-[var(--text-body)] border-[var(--border)] hover:border-[var(--icon-muted)] hover:bg-[var(--app-bg)] px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Target className="w-3.5 h-3.5" /> Zu Kampagne hinzufügen
              </button>
              <button className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {leads.map((lead) => {
            const isExpanded = expandedLeadId === lead.id;

            return (
              <div
                key={lead.id}
                className={`group rounded-[32px] p-5 flex flex-col gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-300 cursor-pointer border border-[var(--border-subtle)] relative ${
                  selectedLeadIds.includes(lead.id) ? 'bg-[var(--signal-teal-bg)]' : 'bg-white'
                }`}
                onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
              >
                {/* TOP ROW / COLLAPSED STATE */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative transition-transform duration-300">
                  
                  {/* Select Checkbox (Hover/Selected state) */}
                  <div 
                    onClick={(e) => toggleLeadSelection(lead.id, e)}
                    className={`absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-[22px] h-[22px] rounded-md z-10 ${
                      selectedLeadIds.includes(lead.id) ? 'bg-[var(--sherloq-primary)] opacity-100 border-[var(--sherloq-primary)]' : 'bg-white border-2 border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    {selectedLeadIds.includes(lead.id) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>

                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0 ml-0 group-hover:ml-8 transition-all duration-300">
                    <div className="relative shrink-0">
                      {lead.person.avatarUrl ? (
                        <img src={lead.person.avatarUrl} alt={lead.person.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--sherloq-primary)] text-white flex items-center justify-center text-[13px] font-bold shadow-sm">
                          {lead.person.initials}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--signal-info-text)] border-2 border-white rounded-full"></div>
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
                      <div className="bg-[var(--text-primary)] text-white text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0">
                        {lead.person.company.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[14px] text-[var(--text-body)] font-semibold w-[120px] truncate">{lead.person.company}</span>
                    </div>
                  </div>

                  {/* Middle Stats (Simplified) */}
                  <div className="hidden lg:flex items-center gap-4 px-4 border-l border-[var(--border-subtle)] shrink-0">
                    <div className="flex flex-col items-center justify-center w-[80px] relative h-full">
                      <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">STAGE</span>
                      <div className="px-4 py-2 rounded-full bg-[var(--app-bg)] text-[var(--text-body)] text-[12px] font-semibold border border-[var(--border)]">
                        {lead.pipelineStage === 'pipeline' ? 'Demo' : 'Lead'}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
                      <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-wider uppercase">HEAT</span>
                      <div className={`px-4 py-2 rounded-full text-[12px] font-semibold border flex items-center gap-1.5 ${getHeatColor(lead.heatStatus).bg} ${getHeatColor(lead.heatStatus).text}`}>
                        {getHeatColor(lead.heatStatus).emoji}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-subtle)] shrink-0 justify-between md:justify-end">
                    <div className="flex flex-col items-end hidden sm:flex w-[130px]">
                      <span className="text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap">vor 5 Tagen</span>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[var(--icp-low)] font-semibold text-[12px] whitespace-nowrap w-full">
                        8T in Stage <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
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
                          onSelectLead(lead);
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
                      <div className="md:col-span-7 bg-white rounded-[24px] p-5 border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--sherloq-primary)] uppercase tracking-wider mb-4">
                          <Zap className="w-4 h-4 text-[var(--sherloq-primary)]" /> KI Kurzakte
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
                        <div className="bg-white rounded-[24px] p-5 border border-[var(--border)]">
                          <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-wider mb-4">
                            <Briefcase className="w-4 h-4" /> Deal Details
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-[12px]">
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">Volumen</span>
                              <span className="font-bold text-[var(--sherloq-primary)] text-[14px]">24.000 € ARR</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">Laufzeit</span>
                              <span className="font-bold text-[var(--text-primary)] text-[14px]">12 Monate</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">Stage</span>
                              <span className="font-bold text-[var(--icp-low)] text-[14px] flex items-center gap-1.5">
                                Demo <span className="font-semibold text-red-500">⚠️ 8T</span>
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider">Probability</span>
                              <span className="font-bold text-[var(--text-primary)] text-[14px]">60%</span>
                            </div>
                          </div>
                        </div>

                        {/* Aktionen */}
                        <div className="bg-white rounded-[24px] p-5 border border-[var(--border)]">
                          <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-wider mb-4">
                            <Target className="w-4 h-4" /> Aktionen
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <button className="flex-1 bg-white border border-[var(--border)] text-[var(--text-body)] text-[12px] font-semibold py-2 rounded-[12px] hover:bg-[var(--app-bg)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                <Mail className="w-3.5 h-3.5" /> Mail
                              </button>
                              <button className="flex-1 bg-white border border-[var(--border)] text-[var(--text-body)] text-[12px] font-semibold py-2 rounded-[12px] hover:bg-[var(--app-bg)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                <CalendarCheck className="w-3.5 h-3.5" /> Task
                              </button>
                              <button className="flex-1 bg-white border border-[var(--border)] text-[var(--text-body)] text-[12px] font-semibold py-2 rounded-[12px] hover:bg-[var(--app-bg)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                <ArrowRight className="w-3.5 h-3.5" /> Stage
                              </button>
                            </div>
                            <button className="w-full bg-white border border-[var(--border)] hover:bg-[var(--app-bg)] text-[var(--text-primary)] font-bold text-[13px] py-2.5 rounded-[12px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                              <MessageSquare className="w-4 h-4 text-[var(--sherloq-primary)]" /> AI Chat starten
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
              Pipeline & Tasks
            </h2>

            {/* BUTTON ZUM SWITCHEN DER BEIDEN ANSICHTEN */}
            <div className="flex bg-[var(--app-bg)] rounded-[10px] p-1 border border-[var(--border)]">
              <button
                onClick={() => setIsKanbanView(false)}
                className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${
                  !isKanbanView
                    ? "bg-white shadow-sm text-[var(--sherloq-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-body)]"
                }`}
              >
                Task Liste
              </button>

              <button
                onClick={() => setIsKanbanView(true)}
                className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${
                  isKanbanView
                    ? "bg-white shadow-sm text-[var(--sherloq-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-body)]"
                }`}
              >
                Kanban
              </button>
            </div>
          </div>

          {!isKanbanView ? (
            <div className="flex flex-col gap-4 w-full pb-8">
              <PipelineStagniertCard onTaskAnlegen={() => setSelectedStagnatedPerson({
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
              <PipelineKeineTaskCard onTaskAnlegen={() => setSelectedNoTaskPerson({
                name: "Sarah Jenkins",
                company: "CloudSphere",
                avatarInitials: "SJ",
                avatarBg: "bg-[var(--icp-medium)]"
              })} />
            </div>
          ) : (
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

                return (
                  <div key={col.id} className="flex-1 min-w-[290px] w-[290px] max-w-[290px] flex flex-col h-fit transition-all duration-300 relative">
                    {/* Column Header */}
                    <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[15px] text-[var(--text-primary)]">{col.title}</h3>
                          <div className="min-w-[24px] h-6 px-1.5 rounded-full border border-gray-200 text-gray-500 text-[11px] font-semibold flex items-center justify-center bg-gray-50 shadow-sm">
                            {count}
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedCols(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                          className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center border border-transparent hover:border-gray-200 transition-colors z-10 cursor-pointer shadow-sm"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronLeft className="w-4 h-4 text-gray-500" />}
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[34px] font-extrabold leading-none tracking-tight text-[var(--text-primary)]">{count}</span>
                          <span className="text-[12px] text-gray-400 font-medium">Opportunities</span>
                        </div>
                        <div className="text-[14px] font-bold text-[var(--text-primary)] mt-1">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalValue)}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center border-t border-gray-50 pt-3">
                        <span className="text-[11px] text-gray-400 font-medium">Status</span>
                        {actionsCount > 0 ? (
                          <div className="bg-white text-red-600 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm border border-red-100/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                            {actionsCount} Action{actionsCount !== 1 ? 's' : ''}
                          </div>
                        ) : (
                          <div className="bg-white text-[var(--icp-high)] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm border border-[var(--icp-high)]/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Im Flow
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cards List (Only if expanded) */}
                    {isExpanded && (
                      <div className="flex flex-col gap-3">
                        {colLeads.map(lead => {
                          let pill: any = null;
                          if (lead.heatStatus === 'HOT') pill = { label: 'Signal Call', colorClass: 'text-orange-600 bg-orange-50 border border-orange-100/50', icon: <Flame className="w-3 h-3" /> };
                          else if (lead.heatStatus === 'WARM') pill = { label: 'Demo Call', colorClass: 'text-red-600 bg-red-50 border border-red-100/50', icon: <AlertTriangle className="w-3 h-3" /> };
                          
                          return (
                            <div key={lead.id} className="bg-white rounded-[24px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 relative group">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  {lead.person.avatarUrl ? (
                                    <img src={lead.person.avatarUrl} alt={lead.person.name} className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-[var(--sherloq-primary)] text-white flex items-center justify-center text-[12px] font-bold shadow-sm shrink-0">
                                      {lead.person.initials}
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-[13px] text-[var(--text-primary)] leading-tight truncate">{lead.person.name}</span>
                                    <span className="text-[11px] text-gray-500 leading-tight truncate mt-0.5">{lead.person.company}</span>
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
                                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${pill.colorClass}`}>
                                    {pill.icon}
                                    <span>{pill.label}</span>
                                  </div>
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
                                      className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
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
          )}
        </div>
      )}

      {/* SIGNALS TAB */}
      {subTab === 'signals' && (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
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
            onActNow={() => setSelectedSignalPerson({
              name: "Maja Voje",
              company: "Growth Lab",
              role: "GTM Strategist",
              avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120",
              icpScore: 92,
              actionText: "Hat auf Kommentar geantwortet — GTM Strategie",
              commentText: "Anze Voje postete über GTM Strategien für 2026 — Maja Voje antwortete und verknüpfte das Thema mit Sales Enablement.",
              timeAgoLabel: "11 Min",
              timeLeftHours: 4,
              windowHours: 72,
              aiRecommendation: "Idealer Zeitpunkt — Post-Thema passt direkt zu Sherloq. Maja ist gerade aktiv. Persönlichkeit Blau: sachlicher Einstieg mit konkretem Bezug zum Post.",
              signalType: "comment"
            })}
          />
          <LinkedinSignalCard
            name="Sarah Jenkins"
            role="VP of Sales"
            avatarInitials="SJ"
            avatarBg="bg-[var(--icp-medium)]"
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
            onActNow={() => setSelectedSignalPerson({
              name: "Sarah Jenkins",
              company: "CloudSphere",
              role: "VP of Sales",
              avatarInitials: "SJ",
              avatarBg: "bg-[var(--icp-medium)]",
              icpScore: 85,
              actionText: "Neuer Beitrag — BDR Skalierung",
              commentText: "Sarah hat einen neuen LinkedIn Beitrag über die Skalierung von BDR-Teams im EMEA-Raum veröffentlicht.",
              timeAgoLabel: "2h",
              timeLeftHours: 20,
              windowHours: 48,
              aiRecommendation: "Hohe Relevanz! Sie thematisiert BDR Skalierung. Ein Reply, der Sherloqs schnelle Ramp-up Zeit erwähnt, wäre perfekt.",
              signalType: "post"
            })}
          />
          <LinkedinSignalCard
            name="Marc Levigne"
            role="CPO"
            avatarInitials="ML"
            avatarBg="bg-[var(--signal-info-text)]"
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
            onActNow={() => setSelectedSignalPerson({
              name: "Marc Levigne",
              company: "DataPulse Corp",
              role: "CPO",
              avatarInitials: "ML",
              avatarBg: "bg-[var(--signal-info-text)]",
              icpScore: 78,
              actionText: "Hat Beitrag geliked — Sales Ops Trends",
              commentText: "Marc hat den aktuellen Beitrag von Gartner Analysten zu Sales Ops Automation Tendenzen 2026 geliked.",
              timeAgoLabel: "5h",
              timeLeftHours: 43,
              windowHours: 48,
              aiRecommendation: "Er recherchiert weiter. Ideal um jetzt mit echten Case Studies zu Sherloqs Automatisierung nachzuhaken.",
              signalType: "like"
            })}
          />
          <LinkedinSignalCard
            name="Elena Rostova"
            role="Head of SDR"
            avatarInitials="ER"
            avatarBg="bg-[var(--accent-purple)]"
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
            onActNow={() => setSelectedSignalPerson({
              name: "Elena Rostova",
              company: "Quantum Dynamics",
              role: "Head of SDR",
              avatarInitials: "ER",
              avatarBg: "bg-[var(--accent-purple)]",
              icpScore: 88,
              actionText: "Firmen-News: Series B Funding",
              commentText: "Quantum Dynamics hat auf LinkedIn die erfolgreiche Series B in Höhe von €18M verkündet.",
              timeAgoLabel: "1d",
              timeLeftHours: 48,
              windowHours: 72,
              aiRecommendation: "Nutze diesen Trigger für einen neuen Kanal! Gratuliere zur Finanzierungsrunde per LinkedIn Message.",
              signalType: "company"
            })}
          />
          <LinkedinSignalCard
            name="Dr. Christian Brand"
            role="CEO"
            avatarInitials="CB"
            avatarBg="bg-[var(--icp-high)]"
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
            onActNow={() => setSelectedSignalPerson({
              name: "Dr. Christian Brand",
              company: "Nexus",
              role: "CEO",
              avatarInitials: "CB",
              avatarBg: "bg-[var(--icp-high)]",
              icpScore: 95,
              actionText: "Hat Profil besucht",
              commentText: "Christian hat gerade dein LinkedIn Profil besucht, kurz nachdem du den Vorschlag per E-Mail gesendet hast.",
              timeAgoLabel: "15m",
              timeLeftHours: 8,
              windowHours: 24,
              aiRecommendation: "Sofort nachfassen! Er prüft gerade deine Authentizität und Lösung. Eine kurze LinkedIn Connectanfrage hinterherschicken.",
              signalType: "visit"
            })}
          />
        </div>
      )}

      {/* QUICK ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="w-full max-w-[460px] bg-white rounded-[24px] border border-[var(--border)] p-6 shadow-2xl relative">
            <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--sherloq-primary)]" />
              Neuen SDR Lead anlegen
            </h2>
            
            <form onSubmit={handleCreateLead} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Voller Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="z.B. Dr. Michael Schumacher"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-[var(--app-bg)] border border-[var(--border)] focus:border-[var(--sherloq-primary)] rounded-[12px] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Unternehmen *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="z.B. Porsche AG"
                    value={newLeadCompany}
                    onChange={(e) => setNewLeadCompany(e.target.value)}
                    className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-[var(--app-bg)] border border-[var(--border)] focus:border-[var(--sherloq-primary)] rounded-[12px] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Rolle / Position</label>
                  <input 
                    type="text" 
                    placeholder="z.B. VP of Procurement"
                    value={newLeadRole}
                    onChange={(e) => setNewLeadRole(e.target.value)}
                    className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-[var(--app-bg)] border border-[var(--border)] focus:border-[var(--sherloq-primary)] rounded-[12px] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Kontakt E-Mail</label>
                <input 
                  type="email" 
                  placeholder="m.schumacher@porsche.de"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-[var(--app-bg)] border border-[var(--border)] focus:border-[var(--sherloq-primary)] rounded-[12px] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">SDR Kurzakte (AI-Summary Vorschau)</label>
                <textarea 
                  placeholder="Interesse an schnellerer BDR Einarbeitung im EMEA Raum. Erwartet DSGVO Abnahme..."
                  rows={2}
                  value={newLeadAka}
                  onChange={(e) => setNewLeadAka(e.target.value)}
                  className="w-full text-[11px] font-mono leading-relaxed p-3 bg-[var(--app-bg)] border border-[var(--border)] focus:border-[var(--sherloq-primary)] rounded-[12px] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Lead Heat-Level</label>
                <select
                  value={newLeadHeat}
                  onChange={(e) => setNewLeadHeat(e.target.value as HeatStatus)}
                  className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-[var(--app-bg)] border border-[var(--border)] focus:border-[var(--sherloq-primary)] rounded-[12px] focus:outline-none"
                >
                  <option value="HOT">🟢 Aktiv</option>
                  <option value="WARM">🟠 Stabil</option>
                  <option value="LUKEWARM">🟡 Rückläufig</option>
                  <option value="COLD">🔵 Ruhend</option>
                  <option value="DEAD">⚫ Inaktiv</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[var(--app-bg)] hover:bg-[var(--border)] text-[var(--text-body)] text-[12px] rounded-full cursor-pointer border border-[var(--border)]"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)]/95 text-white text-[12px] font-semibold rounded-full cursor-pointer shadow-xs"
                >
                  Lead anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {selectedSignalPerson && (
        <SignalActionDrawer 
          person={selectedSignalPerson}
          onClose={() => setSelectedSignalPerson(null)}
          onTakeAction={(text) => {
            console.log('Took action with text:', text);
          }}
        />
      )}

      {selectedStagnatedPerson && (
        <PipelineStagnatedDrawer
          person={selectedStagnatedPerson}
          onClose={() => setSelectedStagnatedPerson(null)}
          onTakeAction={(text) => {
            console.log('Took action with text:', text);
          }}
        />
      )}

      {selectedColdPerson && (
        <ContactColdDrawer
          person={selectedColdPerson}
          onClose={() => setSelectedColdPerson(null)}
        />
      )}

      {selectedNoTaskPerson && (
        <NoTaskDrawer
          person={selectedNoTaskPerson}
          onClose={() => setSelectedNoTaskPerson(null)}
        />
      )}

    </div>
  );
}
