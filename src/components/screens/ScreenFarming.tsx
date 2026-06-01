/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sprout, 
  Sparkles, 
  Mail, 
  Link2, 
  Hash, 
  Phone, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  AlertOctagon, 
  CheckCircle, 
  X,
  Lock,
  Bookmark,
  Activity,
  Award,
  Target,
  Trash,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Briefcase,
  Video,
  CalendarCheck,
  MessageSquare
} from 'lucide-react';
import type { Customer, SherloqStatus, CommunicationChannel, HeatStatus } from '@/types';
import { ICPDonut } from '@/components/shared/ICPDonut';
import CommunicationChain from '@/components/shared/CommunicationChain';

interface ScreenFarmingProps {
  customers: Customer[];
  onSelectCustomer: (cust: Customer) => void;
  onUpgradeSubscription: (id: string, newPlan: 'Growth' | 'Enterprise') => void;
  onSelectCommunication?: (personId: string, tpId: string) => void;
}

export default function ScreenFarming({
  customers,
  onSelectCustomer,
  onUpgradeSubscription,
  onSelectCommunication
}: ScreenFarmingProps) {
  const [subTab, setSubTab] = useState<'overview' | 'kunden' | 'health' | 'upsell'>('kunden');
  
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  
  const toggleCustomerSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };
  const selectAll = () => setSelectedCustomerIds(customers.map(c => c.id));
  const deselectAll = () => setSelectedCustomerIds([]);

  const menuItems = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'kunden', label: 'Kunden', count: customers.length },
    { id: 'health', label: 'Health & Churn Escalation' }
  ];

  const getStatusColor = (status: SherloqStatus) => {
    switch (status) {
      case 'ACTIVE': return { bg: 'bg-[var(--signal-success-bg)]', text: 'text-signal-success border-[#EBFBEE]', title: '✅ Aktiv' };
      case 'TRIAL': return { bg: 'bg-[var(--signal-info-bg)]', text: 'text-signal-info border-[#DBEAFE]', title: '🆕 Free Trial' };
      case 'TRIAL_EXPIRED': return { bg: 'bg-[#F7FAFC]', text: 'text-[#718096] border-[#F7FAFC]', title: '⌛ Trial abgelaufen' };
      case 'CANCELLED': return { bg: 'bg-[#FFF5F5]', text: 'text-[#E53E3E] border-[#FFF5F5]', title: '✖️ Cancelled' };
      default: return { bg: 'bg-[#F7FAFC]', text: 'text-[#718096] border-[#F7FAFC]', title: 'Status' };
    }
  };

  const getChannelIcon = (chan: CommunicationChannel) => {
    switch (chan) {
      case 'EMAIL': return <Mail className="w-3.5 h-3.5 text-blue-600" />;
      case 'LINKEDIN': return <Link2 className="w-3.5 h-3.5 text-cyan-600" />;
      case 'SLACK': return <Hash className="w-3.5 h-3.5 text-purple-600" />;
      case 'PHONE': return <Phone className="w-3.5 h-3.5 text-emerald-600" />;
      default: return <Award className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getHeatColor = (status: HeatStatus) => {
    switch (status) {
      case 'HOT': return { bg: 'bg-[var(--signal-success-bg)]', text: 'text-signal-success border-[#EBFBEE]', emoji: '🟢 Aktiv' };
      case 'WARM': return { bg: 'bg-[#FFF4E6]', text: 'text-[#DD6B20] border-[#FFF4E6]', emoji: '🟠 Stabil' };
      case 'LUKEWARM': return { bg: 'bg-[var(--signal-warn-bg)]', text: 'text-[#F59E0B] border-[#FFF9DB]', emoji: '🟡 Rückläufig' };
      case 'COLD': return { bg: 'bg-[var(--signal-cold-bg)]', text: 'text-signal-cold border-[#EBF8FF]', emoji: '🔵 Ruhend' };
      default: return { bg: 'bg-[#F7FAFC]', text: 'text-[#718096] border-[#F7FAFC]', emoji: '⚫ Inaktiv' };
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">Farming (Kundenpflege & Expansion)</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Optimiere Kunden-Nutzung, identifiziere Churn Risk und vermehre MRR.</p>
      </div>

      {/* Sub-Navigation (Section 12) */}
      <div className="flex gap-2 p-1.5 bg-app-surface rounded-pill shadow-card w-fit items-center">
        {menuItems.map((item) => {
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              className={`px-4.5 py-1.5 text-[12px] font-medium transition-all rounded-pill cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sherloq-primary text-white shadow-sm'
                  : 'text-text-body hover:bg-app-bg hover:text-text-primary'
              }`}
            >
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-pill ${isActive ? 'bg-app-surface text-sherloq-primary' : 'bg-[var(--border)] text-text-body'}`}>
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
            <div className="bg-app-surface rounded-[16px] p-6 shadow-card">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Active Customers (AM)</span>
              <h3 className="text-[28px] font-bold text-text-primary mt-1">14 Companies</h3>
              <p className="text-[12px] text-signal-success mt-1.5">✓ 92% Annual Retention rate</p>
            </div>
            <div className="bg-app-surface rounded-[16px] p-6 shadow-card">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Upsell Pipeline</span>
              <h3 className="text-[28px] font-bold text-text-primary mt-1">4.250€ MRR</h3>
              <p className="text-[12px] text-text-body mt-1.5">Soll-Abschluss für Q2</p>
            </div>
            <div className="bg-app-surface rounded-[16px] p-6 shadow-card ring-1 ring-red-100">
              <span className="text-[10px] text-red-600 uppercase font-semibold">Churn Risk At Risk</span>
              <h3 className="text-[28px] font-bold text-text-primary mt-1">1 Account</h3>
              <p className="text-[12px] text-red-700 font-medium mt-1.5">Logistify DE (CS-Support benötigt)</p>
            </div>
          </div>

          <div className="bg-app-surface rounded-[16px] p-6 text-center shadow-card">
            <h3 className="text-[14px] font-semibold text-text-primary">AM Login Frequency</h3>
            <p className="text-[11px] text-text-muted mt-1">Nutzung aller eingerichteten Seats per Account</p>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-text-body w-24 text-left">PayGuard AG</span>
                <div className="flex-1 bg-gray-100 h-2.5 rounded-pill overflow-hidden mx-4">
                  <div className="bg-sherloq-primary h-full" style={{ width: '92%' }} />
                </div>
                <span className="font-mono text-text-muted w-12 text-right">92%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-text-body w-24 text-left">HiringMate Ltd</span>
                <div className="flex-1 bg-gray-100 h-2.5 rounded-pill overflow-hidden mx-4">
                  <div className="bg-sherloq-primary h-full" style={{ width: '68%' }} />
                </div>
                <span className="font-mono text-text-muted w-12 text-right">68%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-text-body w-24 text-left">Logistify DE</span>
                <div className="flex-1 bg-gray-100 h-2.5 rounded-pill overflow-hidden mx-4">
                  <div className="bg-red-500 h-full" style={{ width: '8%' }} />
                </div>
                <span className="font-mono text-red-500 w-12 text-right">8% ⚠️</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW KUNDEN (LIST) */}
      {subTab === 'kunden' && (
        <div className="flex flex-col gap-4">
          
          {/* List Actions / Select All Bar */}
          <div className={`transition-all duration-300 flex items-center justify-between px-2 ${selectedCustomerIds.length > 0 ? 'opacity-100 h-10 mb-2' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={selectedCustomerIds.length === customers.length ? deselectAll : selectAll}
                className="flex items-center justify-center w-[22px] h-[22px] rounded-md bg-[#064E3B] border border-[#064E3B]"
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </button>
              <span className="text-[13px] font-bold text-text-primary">
                {selectedCustomerIds.length} {selectedCustomerIds.length === 1 ? 'Kunde' : 'Kunden'} ausgewählt
              </span>
              <button onClick={deselectAll} className="ml-2 text-[12px] text-text-muted hover:text-text-body font-semibold underline underline-offset-2">Auswahl aufheben</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-app-surface border text-text-body border-[#CED4DA] hover:border-[#ADB5BD] hover:bg-app-bg px-3 py-1.5 rounded-pill text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Target className="w-3.5 h-3.5" /> Zu Kampagne hinzufügen
              </button>
              <button className="bg-app-surface border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-pill text-[12px] font-semibold flex items-center gap-1.5 transition-colors">
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {customers.map((cust) => {
            const heat = getHeatColor(cust.heatStatus);
            const isExpanded = expandedCustomerId === cust.id;

            return (
              <div
                key={cust.id}
                className={`group rounded-[16px] p-5 flex flex-col gap-4 shadow-card hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-300 cursor-pointer border border-[#F1F3F5] relative ${
                  selectedCustomerIds.includes(cust.id) ? 'bg-[#EDF5F5]' : 'bg-app-surface'
                }`}
                onClick={() => setExpandedCustomerId(isExpanded ? null : cust.id)}
              >
                {/* TOP ROW / COLLAPSED STATE */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative transition-transform duration-300">
                  
                  {/* Select Checkbox (Hover/Selected state) */}
                  <div 
                    onClick={(e) => toggleCustomerSelection(cust.id, e)}
                    className={`absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-[22px] h-[22px] rounded-md z-10 ${
                      selectedCustomerIds.includes(cust.id) ? 'bg-[#064E3B] opacity-100 border-[#064E3B]' : 'bg-app-surface border-2 border-[#CED4DA] hover:border-text-muted'
                    }`}
                  >
                    {selectedCustomerIds.includes(cust.id) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>

                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0 ml-0 group-hover:ml-8 transition-all duration-300">
                    <div className="relative shrink-0">
                      {cust.person.avatarUrl ? (
                        <img src={cust.person.avatarUrl} alt={cust.person.name} className="w-10 h-10 rounded-pill object-cover shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-pill bg-sherloq-primary text-white flex items-center justify-center text-[13px] font-bold shadow-sm">
                          {cust.person.initials}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#3B82F6] border-2 border-white rounded-pill"></div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-bold text-text-primary font-sans">{cust.person.name}</span>
                      <span className="text-[12px] text-text-muted mt-0.5 max-w-[200px] truncate">
                        {cust.person.jobTitle}, {cust.person.company}
                      </span>
                    </div>
                  </div>

                  {/* ICP donut & Company Area */}
                  <div className="hidden md:flex items-center gap-4 px-4 border-l border-[#F1F3F5] shrink-0">
                    <div className="w-[48px] flex items-center justify-center">
                      <ICPDonut score={cust.icpScore ?? 87} />
                    </div>
                    
                    <div className="flex items-center gap-3 w-[140px] xl:w-[180px]">
                      <div className="bg-[#121212] text-white text-[14px] w-[40px] h-[40px] flex items-center justify-center rounded-[12px] font-bold shrink-0">
                        {cust.person.company.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[14px] text-text-body font-semibold w-[120px] truncate">{cust.person.company}</span>
                    </div>
                  </div>

                  {/* Middle Stats (Simplified) */}
                  <div className="hidden lg:flex items-center gap-4 px-4 border-l border-[#F1F3F5] shrink-0">
                    <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
                      <span className="absolute -top-[14px] text-[10px] font-bold text-[#ADB5BD] tracking-wider uppercase">STATUS</span>
                      <div className={`px-4 py-2 rounded-pill text-[12px] font-semibold border flex items-center gap-1.5 ${getStatusColor(cust.sherloqStatus).bg} ${getStatusColor(cust.sherloqStatus).text} whitespace-nowrap`}>
                        {getStatusColor(cust.sherloqStatus).title}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[120px] relative h-full">
                      <span className="absolute -top-[14px] text-[10px] font-bold text-[#ADB5BD] tracking-wider uppercase">HEAT</span>
                      <div className={`px-4 py-2 rounded-pill text-[12px] font-semibold border flex items-center gap-1.5 ${getHeatColor(cust.heatStatus).bg} ${getHeatColor(cust.heatStatus).text} whitespace-nowrap`}>
                        {getHeatColor(cust.heatStatus).emoji}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-4 pl-4 border-l border-[#F1F3F5] shrink-0 justify-between md:justify-end">
                    <div className="flex flex-col items-end hidden sm:flex w-[130px]">
                      <span className="text-[14px] font-bold text-text-primary whitespace-nowrap">vor 5 Tagen</span>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[#E03131] font-semibold text-[12px] whitespace-nowrap w-full">
                        8T ohne Login <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 relative w-[90px] justify-end">
                      <button className="w-8 h-8 flex items-center justify-center text-[#ADB5BD] hover:text-text-primary transition-colors rounded-pill hover:bg-app-bg">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button 
                        className="w-10 h-10 rounded-pill bg-[var(--sherloq-light)] text-sherloq-primary hover:bg-[#D9FAF1] hover:scale-105 transition-all flex items-center justify-center shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCustomer(cust);
                        }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* EXPANDED CONTENT */}
                {isExpanded && (
                  <div className="flex flex-col gap-6 border-t border-[#F1F3F5] pt-5 mt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Left Column (KI Kurzakte) */}
                      <div className="md:col-span-7 bg-app-surface rounded-[14px] p-5 border border-border">
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
                        {/* SHERLOQ USAGE */}
                        <div className="bg-app-surface rounded-[14px] p-5 border border-border">
                          <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-text-muted uppercase tracking-wider mb-4">
                            <Activity className="w-4 h-4" /> SHERLOQ USAGE
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-[12px]">
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Last Login</span>
                              <span className="font-bold text-text-primary text-[14px]">{cust.lastLogin || 'vor 2 Tagen'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Last Usage</span>
                              <span className="font-bold text-text-primary text-[14px]">Heute</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Profile added</span>
                              <div className="flex items-center">
                                <span className="font-bold text-text-primary text-[14px]">{cust.profilesAdded || 142}</span>
                                <span className="text-signal-success text-[11px] font-semibold ml-2">+12%</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Messages generiert</span>
                              <div className="flex items-center">
                                <span className="font-bold text-text-primary text-[14px]">89</span>
                                <span className="text-[#D92D20] text-[11px] font-semibold ml-2">-4%</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Enrichments</span>
                              <div className="flex items-center">
                                <span className="font-bold text-[#D92D20] text-[14px]">85% <span className="text-[12px]">⚠️</span></span>
                                <span className="text-signal-success text-[11px] font-semibold ml-2">+7%</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Posts generiert</span>
                              <div className="flex items-center">
                                <span className="font-bold text-text-primary text-[14px]">12</span>
                                <span className="text-signal-success text-[11px] font-semibold ml-2">+24%</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Plan</span>
                              <span className="font-bold text-text-primary text-[14px]">{cust.subscriptionPlan}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-text-muted font-mono text-[10px] uppercase tracking-wider">Onboarding Status</span>
                              <span className="font-bold text-signal-success text-[14px]">Abgeschlossen</span>
                            </div>
                          </div>
                        </div>

                        {/* Aktionen */}
                        <div className="bg-app-surface rounded-[14px] p-5 border border-border">
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
                                <Bookmark className="w-3.5 h-3.5" /> Notiz
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
                      personId={cust.id} 
                      onSelectCommunication={onSelectCommunication} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. VIEW HEALTH & CHURN INDEX */}
      {subTab === 'health' && (
        <div className="flex flex-col gap-4 text-left">
          <div className="bg-app-surface rounded-[16px] p-6 shadow-card">
            <h3 className="text-[14px] font-semibold text-text-primary mb-4">Risiko-Ranking der Accounts (Churn Prevention Mode)</h3>
            
            <div className="flex flex-col gap-3">
              {customers.map((cust) => {
                const healthScore = cust.heatScore; // 1-5
                const isCritical = healthScore <= 2;
                return (
                  <div 
                    key={cust.id}
                    className={`flex items-center justify-between p-4 rounded-[14px] border transition-all ${
                      isCritical ? 'bg-[var(--signal-urgent-bg)]/30 border-red-100' : 'bg-app-surface border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {cust.person.avatarUrl ? (
                        <img src={cust.person.avatarUrl} alt={cust.person.name} className="w-9 h-9 rounded-pill object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-pill bg-sherloq-primary text-white flex items-center justify-center font-sans font-medium text-[12px]">
                          {cust.person.initials}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-text-primary">{cust.person.company}</span>
                          <span className="text-[11px] text-text-muted font-medium">({cust.person.name})</span>
                        </div>
                        <p className="text-[11px] text-text-body mt-0.5 font-mono">Letzter Login: {cust.lastLogin}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Health Score Dot indicator */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-text-muted font-mono">Health Index:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span 
                              key={s} 
                              className={`w-2.5 h-2.5 rounded-pill ${
                                s <= healthScore
                                  ? (healthScore <= 2 ? 'bg-[var(--signal-urgent-text)]' : 'bg-[var(--signal-success-text)]')
                                  : 'bg-[var(--border)]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectCustomer(cust)}
                        className={`text-[11px] font-semibold px-4 py-1.5 rounded-pill border cursor-pointer transition-all ${
                          isCritical
                            ? 'bg-[var(--signal-urgent-bg)] border-[#E8590C]/20 text-signal-urgent hover:bg-[var(--signal-urgent-bg)]/80'
                            : 'bg-app-surface border-border hover:bg-app-bg text-text-body'
                        }`}
                      >
                        {isCritical ? '⚠️ CS-Ticket erstellen' : 'Nutzung auslesen'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
