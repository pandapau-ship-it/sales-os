/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Target, 
  Sparkles, 
  Mail, 
  Link2, 
  Hash, 
  Phone, 
  ArrowRight, 
  MessageSquare, 
  Compass, 
  Flame, 
  Cpu, 
  Layers, 
  CheckCircle, 
  Activity, 
  Lock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Video,
  Briefcase,
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  AlertTriangle,
  CalendarCheck,
  Check,
  Trash,
  X
} from 'lucide-react';
import type { Lead, HeatStatus, CommunicationChannel } from '@/types';
import { getHeatColor } from '@/lib/heatUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ICPDonut } from '@/components/shared/ICPDonut';
import CommunicationChain from '@/components/shared/CommunicationChain';

interface ScreenHuntingProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStage: (leadId: string, newStage: string) => void;
  onAddLead: (lead: Lead) => void;
  onSelectCommunication?: (personId: string, tpId: string) => void;
}

export default function ScreenHunting({
  leads,
  onSelectLead,
  onUpdateLeadStage,
  onAddLead,
  onSelectCommunication
}: ScreenHuntingProps) {
  const [subTab, setSubTab] = useState<'overview' | 'leads' | 'pipeline' | 'signals' | 'sequences'>('leads');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({ lead: true, pipeline: true, signal: true, sequence: false, trial: false });
  
  // Local state for Quick Lead Adder Dialog
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadRole, setNewLeadRole] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadAka, setNewLeadAka] = useState('');
  const [newLeadHeat, setNewLeadHeat] = useState<HeatStatus>('HOT');

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
    { id: 'leads', label: 'Leads', count: leads.length },
    { id: 'pipeline', label: 'Pipeline (Kanban)', count: null },
  ];

  // getHeatColor imported from @/lib/heatUtils — single source of truth

  const getChannelIcon = (chan: CommunicationChannel) => {
    switch (chan) {
      case 'EMAIL': return <Mail className="w-3.5 h-3.5 text-blue-600" />;
      case 'LINKEDIN': return <Link2 className="w-3.5 h-3.5 text-cyan-600" />;
      case 'SLACK': return <Hash className="w-3.5 h-3.5 text-amber-600" />;
      case 'TEAMS': return <span className="text-[11px] font-bold text-indigo-700">T</span>;
      case 'PHONE': return <Phone className="w-3.5 h-3.5 text-emerald-600" />;
      default: return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in font-sans pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">Hunting (Outreach & Pipeline)</h1>
          <p className="text-[12px] text-text-muted mt-0.5">Finde Leads, tracke Signale und verwalte Abschlussphasen.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-sherloq-primary hover:bg-sherloq-hover text-white text-[12px] font-semibold px-4 py-2 rounded-[10px] cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>SDR Lead hinzufügen</span>
        </button>
      </div>

      {/* Sub-Navigation (Section 12) */}
      <div className="flex gap-1 p-1 bg-app-surface rounded-[12px] w-fit items-center">
        {menuItems.map((item) => {
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              className={`px-3.5 py-1.5 text-[12px] font-medium transition-all rounded-[9px] cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sherloq-primary text-white'
                  : 'text-text-body hover:bg-app-bg hover:text-text-primary'
              }`}
            >
              <span>{item.label}</span>
              {item.count !== null && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px] ${isActive ? 'bg-white/20 text-white' : 'bg-border text-text-muted'}`}>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-app-surface rounded-[12px] p-5 shadow-card">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Conversations</span>
              <h3 className="text-[28px] font-bold text-text-primary mt-1">48 Mails</h3>
              <p className="text-[12px] text-text-body mt-1.5">Letzte 7 Tage geschickt</p>
              <div className="w-full h-1 bg-[var(--sherloq-light)] rounded-pill mt-4 overflow-hidden">
                <div className="w-4/5 h-full bg-sherloq-primary"></div>
              </div>
            </div>
            <div className="bg-app-surface rounded-[12px] p-5 shadow-card">
              <span className="text-[10px] text-text-muted uppercase font-semibold">LinkedIn Connector Rate</span>
              <h3 className="text-[28px] font-bold text-text-primary mt-1">68.4%</h3>
              <p className="text-[12px] text-text-body mt-1.5">+4.2% gegenüber Vorwoche</p>
              <div className="w-full h-1 bg-[var(--sherloq-light)] rounded-pill mt-4 overflow-hidden">
                <div className="w-2/3 h-full bg-sherloq-primary"></div>
              </div>
            </div>
            <div className="bg-app-surface rounded-[12px] p-5 shadow-card">
              <span className="text-[10px] text-text-muted uppercase font-semibold">BDR Ramp time (Avg)</span>
              <h3 className="text-[28px] font-bold text-text-primary mt-1">1.8 Monate</h3>
              <p className="text-[12px] text-text-body mt-1.5">Sherloq Ziel: &lt; 2.2 Monate ✓</p>
              <div className="w-full h-1 bg-[var(--sherloq-light)] rounded-pill mt-4 overflow-hidden">
                <div className="w-[90%] h-full bg-sherloq-primary"></div>
              </div>
            </div>
          </div>

          <div className="bg-app-surface rounded-[12px] p-5 text-center shadow-card">
            <h3 className="text-[14px] font-semibold text-text-primary">Aktuelle Pipeline Performance</h3>
            <p className="text-[11px] text-text-muted mt-1">Ereignisse und Reaktionen in Echtzeit</p>
            <div className="h-[120px] w-full flex items-end justify-between px-8 mt-6">
              {[25, 45, 30, 60, 48, 70, 85].map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className="w-8 rounded-t-lg bg-sherloq-primary hover:opacity-90 max-w-[24px] transition-all"
                    style={{ height: `${val}px` }}
                  />
                  <span className="text-[9px] font-mono text-text-muted">Tag {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW LEADS (LIST) */}
      {subTab === 'leads' && (
        <div className="flex flex-col gap-4">
          
          {/* List Actions / Select All Bar */}
          <div className={`transition-all duration-300 flex items-center justify-between px-2 ${selectedLeadIds.length > 0 ? 'opacity-100 h-10 mb-2' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={selectedLeadIds.length === leads.length ? deselectAll : selectAll}
                className="flex items-center justify-center w-[22px] h-[22px] rounded-md bg-sherloq-dark border border-sherloq-dark"
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </button>
              <span className="text-[13px] font-bold text-text-primary">
                {selectedLeadIds.length} {selectedLeadIds.length === 1 ? 'Lead' : 'Leads'} ausgewählt
              </span>
              <button onClick={deselectAll} className="ml-2 text-[12px] text-text-muted hover:text-text-body font-semibold underline underline-offset-2">Auswahl aufheben</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-app-surface border text-text-body border-border hover:border-border-strong hover:bg-app-bg px-3 py-1.5 rounded-pill text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Target className="w-3.5 h-3.5" /> Zu Kampagne hinzufügen
              </button>
              <button className="bg-app-surface border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-pill text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {leads.map((lead) => {
            const heat = getHeatColor(lead.heatStatus);
            const isExpanded = expandedLeadId === lead.id;

            return (
              <div
                key={lead.id}
                className={`group rounded-[12px] p-4 flex flex-col gap-3 shadow-card hover:shadow-hover transition-all duration-200 cursor-pointer border border-[var(--border-card)] relative ${
                  selectedLeadIds.includes(lead.id) ? 'bg-selection-bg' : 'bg-app-surface'
                }`}
                onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
              >
                {/* TOP ROW / COLLAPSED STATE */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative transition-transform duration-300">
                  
                  {/* Select Checkbox (Hover/Selected state) */}
                  <div 
                    onClick={(e) => toggleLeadSelection(lead.id, e)}
                    className={`absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-[22px] h-[22px] rounded-md z-10 ${
                      selectedLeadIds.includes(lead.id) ? 'bg-sherloq-dark opacity-100 border-sherloq-dark' : 'bg-app-surface border-2 border-border hover:border-text-muted'
                    }`}
                  >
                    {selectedLeadIds.includes(lead.id) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>

                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0 ml-0 group-hover:ml-8 transition-all duration-300">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-[10px] bg-sherloq-primary text-white flex items-center justify-center text-[12px] font-bold">
                        {lead.person.initials}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-bold text-text-primary font-sans">{lead.person.name}</span>
                      <span className="text-[12px] text-text-muted mt-0.5 max-w-[200px] truncate">
                        {lead.person.jobTitle}, {lead.person.company}
                      </span>
                    </div>
                  </div>

                  {/* ICP donut & Company Area */}
                  <div className="hidden md:flex items-center gap-4 px-4 border-l border-border-subtle shrink-0">
                    <div className="w-[48px] flex items-center justify-center">
                      <ICPDonut score={lead.icpScore ?? 87} />
                    </div>
                    
                    <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
                      <div className="bg-app-bg border border-border text-text-body text-[13px] w-[34px] h-[34px] flex items-center justify-center rounded-[9px] font-semibold shrink-0">
                        {lead.person.company.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] text-text-body font-medium w-[120px] truncate">{lead.person.company}</span>
                    </div>
                  </div>

                  {/* Middle Stats (Simplified) */}
                  <div className="hidden lg:flex items-center gap-5 px-4 border-l border-border-subtle shrink-0">
                    <div className="flex flex-col gap-1.5 w-[72px]">
                      <span className="text-[9px] font-semibold text-text-muted tracking-wider uppercase">STAGE</span>
                      <div className="px-2.5 py-1 rounded-[7px] bg-app-bg text-text-body text-[11px] font-medium border border-border w-fit">
                        {lead.pipelineStage === 'pipeline' ? 'Demo' : 'Lead'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 w-[100px]">
                      <span className="text-[9px] font-semibold text-text-muted tracking-wider uppercase">HEAT</span>
                      <div className={`px-2.5 py-1 rounded-[7px] text-[11px] font-medium border flex items-center gap-1.5 w-fit ${heat.bg} ${heat.text} ${heat.border}`}>
                        <span style={{ color: heat.dot, fontSize: 8, lineHeight: 1 }}>●</span>
                        {heat.label}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-4 pl-4 border-l border-border-subtle shrink-0 justify-between md:justify-end">
                    <div className="flex flex-col items-end hidden sm:flex w-[130px]">
                      <span className="text-[14px] font-bold text-text-primary whitespace-nowrap">vor 5 Tagen</span>
                      <div className="flex items-center justify-end gap-1 mt-0.5 text-[#B03020] font-medium text-[11px] whitespace-nowrap w-full">
                        8T in Stage <AlertTriangle className="w-3 h-3" strokeWidth={2} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 relative w-[90px] justify-end">
                      <button className="w-8 h-8 flex items-center justify-center text-icon-muted hover:text-text-primary transition-colors rounded-pill hover:bg-app-bg">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        className="w-8 h-8 rounded-[10px] bg-[var(--sherloq-light)] text-sherloq-primary border border-sherloq-primary/10 hover:border-sherloq-primary/20 hover:bg-[var(--sherloq-light)] transition-all flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* EXPANDED CONTENT */}
                {isExpanded && (
                  <div className="flex flex-col gap-6 border-t border-border-subtle pt-5 mt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Left Column (KI Kurzakte) */}
                      <div className="md:col-span-7 bg-app-surface rounded-[24px] p-5 border border-border">
                        <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-sherloq-primary uppercase tracking-wider mb-4">
                          <Zap className="w-4 h-4 text-sherloq-primary" /> KI Kurzakte
                        </div>
                        <ul className="flex flex-col gap-3 text-[13px] text-text-body leading-relaxed">
                          <li className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 bg-sherloq-primary rounded-pill mt-1.5 shrink-0" />
                            Hat Budget-Freeze bis Q3 bestätigt. Trotzdem starkes Interesse an Feature Y — fragte aktiv nach ROI-Zahlen.
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 bg-sherloq-primary rounded-pill mt-1.5 shrink-0" />
                            Persönlichkeit: Blau — analytisch, entscheidet auf Basis von Daten. Kein Smalltalk, direkt zum Punkt.
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 bg-sherloq-primary rounded-pill mt-1.5 shrink-0" />
                            Objection: Timing wegen Budget-Freeze. Echter Einwand — kein Vorwand. ROI-Argument ist der Schlüssel.
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 bg-sherloq-primary rounded-pill mt-1.5 shrink-0" />
                            Buying Signal: Demo sehr positiv, fragte nach Implementierungs-Zeitplan. Abschluss realistisch ab Q4.
                          </li>
                        </ul>
                      </div>
                      
                      {/* Right Column (Deal Details & Aktionen) */}
                      <div className="md:col-span-5 flex flex-col gap-5">
                        {/* Deal Details */}
                        <div className="bg-app-surface rounded-[24px] p-5 border border-border">
                          <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-text-muted uppercase tracking-wider mb-4">
                            <Briefcase className="w-4 h-4" /> Deal Details
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-[12px]">
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Volumen</span>
                              <span className="font-bold text-sherloq-primary text-[14px]">24.000 € ARR</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Laufzeit</span>
                              <span className="font-bold text-text-primary text-[14px]">12 Monate</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Stage</span>
                              <span className="font-bold text-signal-urgent text-[14px] flex items-center gap-1.5">
                                Demo <span className="font-semibold text-red-500">⚠️ 8T</span>
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Probability</span>
                              <span className="font-bold text-text-primary text-[14px]">60%</span>
                            </div>
                          </div>
                        </div>

                        {/* Aktionen */}
                        <div className="bg-app-surface rounded-[24px] p-5 border border-border">
                          <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-text-muted uppercase tracking-wider mb-4">
                            <Target className="w-4 h-4" /> Aktionen
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <button className="flex-1 bg-app-surface border border-border text-text-body text-[12px] font-semibold py-2 rounded-[12px] hover:bg-app-bg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                <Mail className="w-3.5 h-3.5" /> Mail
                              </button>
                              <button className="flex-1 bg-app-surface border border-border text-text-body text-[12px] font-semibold py-2 rounded-[12px] hover:bg-app-bg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                <CalendarCheck className="w-3.5 h-3.5" /> Task
                              </button>
                              <button className="flex-1 bg-app-surface border border-border text-text-body text-[12px] font-semibold py-2 rounded-[12px] hover:bg-app-bg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                <ArrowRight className="w-3.5 h-3.5" /> Stage
                              </button>
                            </div>
                            <button className="w-full bg-app-surface border border-border hover:bg-app-bg text-text-primary font-bold text-[13px] py-2.5 rounded-[12px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                              <MessageSquare className="w-4 h-4 text-sherloq-primary" /> AI Chat starten
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
                  <div className="bg-app-surface rounded-[24px] p-4 shadow-card mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[15px] text-text-primary">{col.title}</h3>
                        <div className="min-w-[24px] h-6 px-1.5 rounded-pill border border-gray-200 text-gray-500 text-[11px] font-semibold flex items-center justify-center bg-gray-50 shadow-sm">
                          {count}
                        </div>
                      </div>
                      <button 
                        onClick={() => setExpandedCols(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                        className="w-7 h-7 rounded-pill bg-gray-50 hover:bg-gray-100 flex items-center justify-center border border-transparent hover:border-gray-200 transition-colors z-10 cursor-pointer shadow-sm"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronLeft className="w-4 h-4 text-gray-500" />}
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[34px] font-extrabold leading-none tracking-tight text-text-primary">{count}</span>
                        <span className="text-[12px] text-gray-400 font-medium">Opportunities</span>
                      </div>
                      <div className="text-[14px] font-bold text-text-primary mt-1">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalValue)}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center border-t border-gray-50 pt-3">
                      <span className="text-[11px] text-gray-400 font-medium">Status</span>
                      {actionsCount > 0 ? (
                        <div className="text-signal-urgent bg-[var(--signal-urgent-bg)] px-2 py-0.5 rounded-[6px] text-[10px] font-semibold flex items-center gap-1 border border-[#C2410C]/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--signal-urgent-text)]"></div>
                          {actionsCount} Action{actionsCount !== 1 ? 's' : ''}
                        </div>
                      ) : (
                        <div className="text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded-[6px] text-[10px] font-semibold flex items-center gap-1 border border-[#15803D]/10">
                          <CheckCircle2 className="w-3 h-3" />
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
                          <div key={lead.id} className="bg-app-surface rounded-[12px] p-3.5 border border-[var(--border-card)] shadow-card hover:shadow-hover transition-all duration-200 relative group">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-[8px] bg-sherloq-primary text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                                  {lead.person.initials}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-[12px] text-text-primary leading-tight truncate">{lead.person.name}</span>
                                  <span className="text-[11px] text-text-muted leading-tight truncate">{lead.person.company}</span>
                                </div>
                              </div>
                              <div className="w-[34px] flex items-center justify-center shrink-0">
                                <ICPDonut score={lead.icpScore ?? 75} />
                              </div>
                            </div>

                            {lead.dealValue && (
                              <div className="text-[12px] font-semibold text-text-primary mt-2.5">
                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(lead.dealValue)}
                              </div>
                            )}

                            <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-[var(--border-card)]">
                              {pill ? (
                                <div className={`px-2 py-0.5 rounded-[6px] text-[10px] font-medium flex items-center gap-1 ${pill.colorClass}`}>
                                  {pill.icon}
                                  <span>{pill.label}</span>
                                </div>
                              ) : <div />}

                              <div className="flex items-center gap-1.5">
                                {col.prev && (
                                  <button
                                    onClick={() => onUpdateLeadStage(lead.id, col.prev!)}
                                    className="w-6 h-6 rounded-[6px] bg-app-bg hover:bg-border text-text-muted flex items-center justify-center transition-colors cursor-pointer border border-border"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                )}
                                {col.next && (
                                  <button
                                    onClick={() => onUpdateLeadStage(lead.id, col.next!)}
                                    className="w-6 h-6 rounded-[6px] bg-sherloq-primary hover:bg-sherloq-hover text-white flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <ArrowRight className="w-3 h-3" />
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
        </div>
      )}

      {/* QUICK ADD MODAL — shadcn Dialog (focus-trap, keyboard, a11y built-in) */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-text-primary flex items-center gap-2">
              <Target className="w-5 h-5 text-sherloq-primary" />
              Neuen SDR Lead anlegen
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateLead} className="flex flex-col gap-3.5 mt-2">
            <div>
              <label className="text-[11px] text-text-muted font-semibold block mb-1">Voller Name *</label>
              <input
                type="text"
                required
                placeholder="z.B. Dr. Michael Schumacher"
                value={newLeadName}
                onChange={(e) => setNewLeadName(e.target.value)}
                className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-sherloq-primary rounded-[10px] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-text-muted font-semibold block mb-1">Unternehmen *</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Porsche AG"
                  value={newLeadCompany}
                  onChange={(e) => setNewLeadCompany(e.target.value)}
                  className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-sherloq-primary rounded-[10px] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-text-muted font-semibold block mb-1">Rolle / Position</label>
                <input
                  type="text"
                  placeholder="z.B. VP of Procurement"
                  value={newLeadRole}
                  onChange={(e) => setNewLeadRole(e.target.value)}
                  className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-sherloq-primary rounded-[10px] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-text-muted font-semibold block mb-1">Kontakt E-Mail</label>
              <input
                type="email"
                placeholder="m.schumacher@porsche.de"
                value={newLeadEmail}
                onChange={(e) => setNewLeadEmail(e.target.value)}
                className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-sherloq-primary rounded-[10px] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-text-muted font-semibold block mb-1">SDR Kurzakte (AI-Summary Vorschau)</label>
              <textarea
                placeholder="Interesse an schnellerer BDR Einarbeitung im EMEA Raum. Erwartet DSGVO Abnahme..."
                rows={2}
                value={newLeadAka}
                onChange={(e) => setNewLeadAka(e.target.value)}
                className="w-full text-[11px] font-mono leading-relaxed p-3 bg-app-bg border border-border focus:border-sherloq-primary rounded-[10px] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-text-muted font-semibold block mb-1">Lead Heat-Level</label>
              <select
                value={newLeadHeat}
                onChange={(e) => setNewLeadHeat(e.target.value as HeatStatus)}
                className="w-full text-[12px] font-sans px-3.5 py-2.5 bg-app-bg border border-border focus:border-sherloq-primary rounded-[10px] focus:outline-none"
              >
                <option value="HOT">● Aktiv</option>
                <option value="WARM">● Stabil</option>
                <option value="LUKEWARM">● Rückläufig</option>
                <option value="COLD">● Ruhend</option>
                <option value="DEAD">● Inaktiv</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-app-bg hover:bg-[var(--border)] text-text-body text-[12px] rounded-[10px] cursor-pointer border border-border"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sherloq-primary hover:bg-sherloq-hover text-white text-[12px] font-semibold rounded-[10px] cursor-pointer"
              >
                Lead anlegen
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
