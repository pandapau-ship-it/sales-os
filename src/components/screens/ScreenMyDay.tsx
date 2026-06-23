/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  ChevronDown,
  ChevronUp, 
  Mail, 
  Link2, 
  Hash, 
  Phone, 
  ArrowRight, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RotateCw,
  X,
  MessageSquare
} from 'lucide-react';
import type { PriorityItemType, AppointmentItemType, TaskItemType, AlertBannerType, Lead } from '@/types';

interface ScreenMyDayProps {
  priorities: PriorityItemType[];
  appointments: AppointmentItemType[];
  tasks: TaskItemType[];
  alerts: AlertBannerType[];
  onPersonSelect: (personId: string) => void;
  onToggleTask: (taskId: string) => void;
  onResolveAlert: (alertId: string) => void;
  leads: Lead[];
  customers: any[];
}

export default function ScreenMyDay({
  priorities,
  appointments,
  tasks,
  alerts,
  onPersonSelect,
  onToggleTask,
  onResolveAlert,
  leads,
  customers
}: ScreenMyDayProps) {
  const [aiBriefing, setAiBriefing] = useState<string>('SDR-Briefing wird geladen...');
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [expandMeetings, setExpandMeetings] = useState(true);
  const [expandTasks, setExpandTasks] = useState(true);
  const [activeTaskAiDraft, setActiveTaskAiDraft] = useState<string | null>(null);
  const [aiDraftMessage, setAiDraftMessage] = useState<string>('');
  const [draftCustomizer, setDraftCustomizer] = useState<string>('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // Load dynamic AI briefing from the express server using the actual data state count
  const fetchAiBriefing = async () => {
    setIsBriefingLoading(true);
    try {
      const response = await fetch('/api/gemini/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadsCount: leads.length,
          churnCount: customers.filter(c => c.sherloqStatus === 'CHURN_RISK').length,
          openTasks: tasks.filter(t => !t.completed).length
        })
      });
      const data = await response.json();
      setAiBriefing(data.briefing);
    } catch (e) {
      setAiBriefing("SDR-Tagesbericht: Heißer Tag voraus! Christian Brand hat das SLA geöffnet. Vorsicht bei Laura Becker (Logistify) - starker Usage-Einbruch droht.");
    } finally {
      setIsBriefingLoading(false);
    }
  };

  useEffect(() => {
    fetchAiBriefing();
  }, [leads.length, customers.length, tasks.length]);

  // Generate customized message via server-side Gemini
  const handleGenerateCustomDraft = async (task: TaskItemType) => {
    setIsGeneratingDraft(true);
    try {
      const response = await fetch('/api/gemini/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: task.person.name,
          companyName: task.person.company,
          notes: task.title,
          channel: task.recommendedChannel,
          promptExtra: draftCustomizer
        })
      });
      const data = await response.json();
      setAiDraftMessage(data.message || 'Entwurf fehlgeschlagen.');
    } catch (e) {
      setAiDraftMessage(`Hallo ${task.person.name},\nich habe Ihren Fall im System bezüglich "${task.title}" analysiert. Sollen wir morgen kurz telefonieren?\n\nBeste Grüße,\nAlexander`);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleOpenAutoreply = (task: TaskItemType) => {
    if (activeTaskAiDraft === task.id) {
      setActiveTaskAiDraft(null);
    } else {
      setActiveTaskAiDraft(task.id);
      setAiDraftMessage(task.suggestedMessage);
      setDraftCustomizer('');
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL': return <Mail className="w-3.5 h-3.5" />;
      case 'LINKEDIN': return <Link2 className="w-3.5 h-3.5" />;
      case 'SLACK': return <Hash className="w-3.5 h-3.5" />;
      case 'PHONE': return <Phone className="w-3.5 h-3.5" />;
      default: return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-[var(--signal-urgent-bg)] text-signal-urgent border-[var(--signal-urgent-bg)]';
      case 'warning': return 'bg-[var(--signal-warn-bg)] text-[var(--signal-warn-text)] border-[var(--signal-warn-bg)]';
      case 'info': return 'bg-[var(--signal-info-bg)] text-signal-info border-[var(--signal-info-bg)]';
      default: return 'bg-[var(--signal-success-bg)] text-signal-success border-[var(--signal-success-bg)]';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12">
      {/* 1. Header with Title & Refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">Guten Morgen, Alexander</h1>
          <p className="text-[12px] text-text-muted mt-0.5">Hier ist dein proaktiver Vertriebs-Hub für heute.</p>
        </div>
        <div className="text-[11px] font-mono text-text-muted bg-app-surface rounded-pill px-4 py-1.5 shadow-card flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sherloq-primary" />
          <span>Heute: {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* 2. CHURN RISK ALERT BANNERS (Section 7.7) */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className="bg-[var(--signal-urgent-bg)] border-l-3 border-[var(--signal-urgent-text)] rounded-[16px] px-5 py-4 flex items-center justify-between shadow-card animate-pulse-soft"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-signal-urgent flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-text-primary">{alert.title}</span>
                  <span className="text-[12px] text-text-body mt-0.5">{alert.description}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onPersonSelect('cust-2')} // Laura Becker ID
                  className="bg-app-surface hover:bg-app-bg text-signal-urgent border border-border text-[12px] font-semibold rounded-pill px-4 py-1.5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-pointer"
                >
                  Jetzt handeln →
                </button>
                <button 
                  onClick={() => onResolveAlert(alert.id)}
                  className="w-8 h-8 rounded-pill hover:bg-scrim/5 flex items-center justify-center text-text-muted transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. AI-BRIEFING SENTENCE (Section 12) */}
      <div className="bg-app-surface rounded-[16px] px-5 py-4 flex items-center justify-between border border-[var(--border-card)] shadow-card group/brief">
        <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
          <div className="w-10 h-10 rounded-[14px] bg-[var(--sherloq-light)] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-sherloq-primary" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-mono text-sherloq-primary font-semibold uppercase tracking-wider">Morgenanalyse · Sherloq AI</span>
            <p className="text-[13px] italic font-medium text-text-body mt-0.5 leading-snug truncate">
              "{aiBriefing}"
            </p>
          </div>
        </div>
        <button
          onClick={fetchAiBriefing}
          disabled={isBriefingLoading}
          className="w-10 h-10 rounded-pill hover:bg-app-bg flex items-center justify-center text-text-muted hover:text-sherloq-primary border border-transparent hover:border-border transition-all cursor-pointer disabled:opacity-50"
          title="AI-Briefing neu generieren"
        >
          <RotateCw className={`w-4 h-4 ${isBriefingLoading ? 'animate-spin text-sherloq-primary' : ''}`} />
        </button>
      </div>

      {/* 4. PRIORITIES LIST (Section 7.4) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[14px] font-semibold text-text-primary tracking-tight uppercase tracking-wider font-sans inline-flex items-center gap-2">
            <Flame className="w-4 h-4 text-signal-urgent" /> Top Prioritäten für heute (Max 5)
          </h2>
          <span className="text-[11px] font-mono text-text-muted bg-[var(--signal-warn-bg)] text-[var(--signal-warn-text)] px-2.5 py-0.5 rounded-pill border border-[var(--signal-warn-bg)] font-semibold">
            Urgent Dispatcher
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priorities.slice(0, 5).map((prio, idx) => (
            <div 
              key={prio.id}
              className="bg-app-surface rounded-[16px] p-5 border border-[var(--border-card)] shadow-card hover:shadow-hover transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-pill bg-sherloq-primary text-on-accent flex items-center justify-center font-mono text-[11px] font-semibold">
                      {idx + 1}
                    </span>
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-pill border ${getPriorityColor(prio.signalType)}`}>
                      {prio.signalType.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">Priority Dispatch</span>
                </div>

                <p className="text-[13px] font-semibold text-text-primary leading-snug tracking-tight">
                  {prio.description}
                </p>
                <p className="text-[11px] text-text-muted mt-2 bg-app-bg rounded-[12px] p-3 border border-border/60 select-all font-mono leading-relaxed">
                  <span className="font-semibold text-sherloq-primary">Sherloq Why:</span> {prio.whyNow}
                </p>
              </div>

              <div className="flex items-center justify-end mt-4 pt-3.5 border-t border-[var(--app-bg)]">
                <button
                  onClick={() => {
                    const target = prio.actionPayload?.targetId;
                    if (target) onPersonSelect(target);
                  }}
                  className="bg-sherloq-primary hover:bg-sherloq-primary/90 text-on-accent font-sans text-[12px] font-semibold rounded-pill px-4 py-1.5 shadow-sm hover:shadow-card transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Jetzt handeln</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. MEETINGS & APPOINTMENTS (Section 7.5 - Expandable) */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setExpandMeetings(!expandMeetings)}
          className="w-full px-6 py-4 flex items-center justify-between bg-app-surface rounded-[14px] shadow-card hover:shadow-hover transition-all cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-sherloq-primary" />
            <span className="text-[14px] font-semibold text-text-primary tracking-tight">Heutige Termine ({appointments.length})</span>
          </div>
          {expandMeetings ? <ChevronUp className="w-4.5 h-4.5 text-text-muted" /> : <ChevronDown className="w-4.5 h-4.5 text-text-muted" />}
        </button>

        {expandMeetings && (
          <div className="flex flex-col gap-3">
            {appointments.map((app) => (
              <div 
                key={app.id}
                className="bg-app-surface rounded-[14px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--sherloq-light)] text-sherloq-primary px-3 py-1.5 rounded-[12px] font-mono text-[13px] font-bold h-fit mt-0.5 flex items-center justify-center border border-sherloq-primary/10">
                    {app.time}
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-[6px] bg-sherloq-primary text-on-accent flex items-center justify-center text-[10px] font-semibold font-sans">
                        {app.person.initials}
                      </div>
                      <span className="text-[13px] font-semibold text-text-primary">{app.person.name}</span>
                      <span className="text-[11px] text-text-muted">· {app.person.company}</span>
                    </div>
                    <span className="text-[12px] text-text-body mt-1.5 font-medium">{app.purpose}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 pt-2 sm:pt-0">
                  {/* Channels chain */}
                  <div className="flex items-center gap-1">
                    {app.channels.map((chan, i) => (
                      <div 
                        key={i} 
                        className="w-6 h-6 rounded-pill bg-app-bg text-text-muted flex items-center justify-center hover:bg-[var(--sherloq-light)] hover:text-sherloq-primary transition-all"
                        title={chan}
                      >
                        {getChannelIcon(chan)}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onPersonSelect(app.id === 'app-1' ? 'cust-1' : app.id === 'app-2' ? 'lead-1' : 'lead-2')}
                    className="bg-sherloq-primary hover:bg-sherloq-primary/95 text-on-accent text-[12px] font-medium rounded-pill px-4 py-1.5 shadow-sm cursor-pointer"
                  >
                    Vorbereiten
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. PENDING TASKS (Section 7.3 - Expandable) */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setExpandTasks(!expandTasks)}
          className="w-full px-6 py-4 flex items-center justify-between bg-app-surface rounded-[14px] shadow-card hover:shadow-hover transition-all cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 text-sherloq-primary" />
            <span className="text-[14px] font-semibold text-text-primary tracking-tight">Fällige Tasks ({tasks.filter(t => !t.completed).length})</span>
          </div>
          {expandTasks ? <ChevronUp className="w-4.5 h-4.5 text-text-muted" /> : <ChevronDown className="w-4.5 h-4.5 text-text-muted" />}
        </button>

        {expandTasks && (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={`bg-app-surface rounded-[14px] p-4 flex flex-col justify-between transition-all shadow-card ${
                  task.isOverdue && !task.completed ? 'border-l-4 border-l-[var(--signal-urgent-text)]' : ''
                } ${task.completed ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-[9px] bg-sherloq-primary text-on-accent flex items-center justify-center font-sans font-medium text-[11px] flex-shrink-0 mt-0.5">
                      {task.person.initials}
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-text-primary">{task.person.name}</span>
                        <span className="text-[11px] text-text-muted">· {task.person.company} ({task.person.jobTitle})</span>
                        {task.isOverdue && !task.completed && (
                          <span className="text-[9px] font-mono bg-[var(--signal-urgent-bg)] text-[var(--signal-urgent-text)] border border-[var(--signal-urgent-bg)] px-2 py-0.5 rounded-pill font-bold">
                            FÄLLIG
                          </span>
                        )}
                      </div>
                      <span className={`text-[12px] mt-1.5 font-medium ${task.isOverdue && !task.completed ? 'text-signal-urgent font-semibold' : 'text-text-primary'}`}>
                        {task.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t sm:border-0 pt-2 sm:pt-0 shrink-0 self-end sm:self-auto">
                    {/* Channel recommendation */}
                    <span className="text-[10px] font-mono text-text-muted bg-app-bg px-2.5 py-1 rounded-pill border border-border flex items-center gap-1.5 shrink-0">
                      Weichkanal: {getChannelIcon(task.recommendedChannel)} {task.recommendedChannel}
                    </span>

                    {/* Inline Actions (Section 7.3) */}
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`text-[11px] font-medium font-sans px-3 py-1 rounded-pill border transition-all cursor-pointer ${
                        task.completed 
                          ? 'bg-[var(--signal-success-bg)] border-[var(--signal-success-text)]/20 text-signal-success' 
                          : 'bg-app-surface border-border hover:bg-app-bg text-text-body'
                      }`}
                    >
                      {task.completed ? '✓ Erledigt' : 'Erledigen'}
                    </button>

                    <button
                      disabled={task.completed}
                      onClick={() => handleOpenAutoreply(task)}
                      className={`w-8 h-8 rounded-pill border flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 ${
                        activeTaskAiDraft === task.id
                          ? 'bg-[var(--sherloq-light)] border-sherloq-primary/20 text-sherloq-primary'
                          : 'bg-app-surface border-border hover:bg-app-bg text-text-muted'
                      }`}
                      title="AI-Nachricht generieren"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* AUTOREPLY GENERATOR POPUP (Ebene 2, Section 13 inline context) */}
                {activeTaskAiDraft === task.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--app-bg)] bg-[var(--sherloq-light)]/40 rounded-[16px] p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sherloq-primary">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[12px] font-semibold">Gemini AI-Outreach Generator</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-800">Ready to Dispatch</span>
                    </div>

                    <textarea
                      value={aiDraftMessage}
                      onChange={(e) => setAiDraftMessage(e.target.value)}
                      className="w-full text-[12px] font-mono p-3 bg-app-surface border border-sherloq-primary/10 rounded-[12px] focus:outline-none focus:border-sherloq-primary/40 text-text-body leading-relaxed"
                      rows={6}
                    />

                    {/* AI Prompt override customized */}
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        placeholder="Zusatzwunsch? (z.B. lockerer formulieren, auf Englisch, kürzer)..."
                        value={draftCustomizer}
                        onChange={(e) => setDraftCustomizer(e.target.value)}
                        className="flex-1 text-[11px] font-sans px-3 py-1.5 bg-app-surface border border-border rounded-[8px] focus:outline-none"
                      />
                      <button
                        onClick={() => handleGenerateCustomDraft(task)}
                        disabled={isGeneratingDraft}
                        className="bg-sherloq-primary hover:bg-sherloq-primary/90 text-on-accent font-sans text-[11px] font-medium rounded-pill px-3 py-1.5 transition-all shadow-xs cursor-pointer flex-shrink-0 disabled:opacity-50"
                      >
                        {isGeneratingDraft ? 'Schreibt...' : 'Dran feilen'}
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-text-muted">Weiches Outreach mit optimalem Sentiment</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiDraftMessage);
                            alert("Kopiert!");
                          }}
                          className="bg-app-surface border border-border text-text-body text-[11px] rounded-pill px-3 py-1 transition-all hover:bg-app-bg cursor-pointer"
                        >
                          Kopieren
                        </button>
                        <button
                          onClick={() => {
                            onToggleTask(task.id);
                            setActiveTaskAiDraft(null);
                          }}
                          className="bg-sherloq-primary text-on-accent text-[11px] rounded-pill px-4.5 py-1.5 shadow-sm hover:shadow-card transition-all cursor-pointer font-semibold"
                        >
                          Senden (Simulation)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
