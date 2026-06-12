import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight, X, Mail, Phone, Globe,
  AlertTriangle, Clock, Video, Check
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import LinkedinIcon from '@/components/shared/LinkedinIcon';

/**
 * HunterSidepanel — Info Panel (§22.1, 820px). Nutzt dieselbe Sheet-„drawer"-Shell
 * wie CustomerDrawer / die Action-Panels: schwebendes, abgerundetes Panel rechts mit
 * identischer Slide-in/-out-Animation (kein Inline-Layout, überlagert die Liste).
 * `person = null` → geschlossen; Inhalt rendert aus einer gehaltenen Kopie, damit das
 * Panel während der Ausfahr-Animation nicht leer wird.
 */
export default function HunterSidepanel({ person: personProp, onClose }: { person: any, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedComm, setExpandedComm] = useState<Record<number, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAutosave, setShowAutosave] = useState(false);

  // Open-State von der Prop; Inhalt aus gehaltener Kopie (wie CustomerDrawer).
  const [display, setDisplay] = useState<any>(personProp);
  useEffect(() => { if (personProp) setDisplay(personProp); }, [personProp]);
  const isOpen = personProp !== null;
  const person = display;

  const toggleComm = (index: number) => {
    setExpandedComm(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const handleNoteBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!e.target.value.trim()) return;
    setShowAutosave(true);
    setTimeout(() => {
      setShowAutosave(false);
      showToast('Notiz automatisch gespeichert');
    }, 700);
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="drawer"
        className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface"
        style={{ width: 820, maxWidth: "95vw" }}
      >
        {person && (
        <>
      <header className="p-7 pb-0 bg-app-surface items-start relative z-10 border-b border-border-subtle shrink-0">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-[var(--signal-teal-bg)] flex items-center justify-center text-[var(--sherloq-primary)] text-xl font-bold shadow-sm">
                {person.initials || "CB"}
              </div>
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-[var(--signal-success-text)] border-2 border-[var(--surface)] rounded-full"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] font-extrabold text-text-primary leading-tight">
                  {person.name || "Dr. Christian Brand"}
                </h1>
                <span className="px-2.5 py-1 rounded-full bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[10px] font-extrabold">
                  ICP: 87
                </span>
              </div>

              <div className="flex items-center gap-2 text-[12px] font-semibold text-text-muted mt-2 leading-none flex-wrap">
                <span>{person.title || "VP of Sales EMEA"}</span>
                <span className="text-icon-muted">•</span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--text-primary)] text-on-accent text-[9px] font-bold">L</span>
                <span className="font-semibold text-text-body">{person.company || "LogixFlow GmbH"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => showToast('Vollansicht geöffnet')} className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute top-[58px] right-[58px] flex items-start gap-7 hidden md:flex">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest mb-2">Status</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[12px] font-extrabold leading-none">
              <span className="w-2 h-2 rounded-full bg-[var(--signal-success-text)]"></span>
              Aktiv
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest mb-2">Heat</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[12px] font-extrabold leading-none">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--icp-high)] opacity-90 shadow-sm"></span>
              Aktiv
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest mb-2">Stage</span>
            <span className="px-5 py-1.5 rounded-full bg-app-surface border border-border text-text-body text-[12px] font-extrabold leading-none shadow-sm">
              {person.stage || "Demo"}
            </span>
          </div>
        </div>

        <div className="bg-app-surface border border-border-subtle rounded-full px-5 py-3 mt-10 flex items-center justify-between gap-3 text-[12px] text-text-muted shadow-sm overflow-x-auto">
          <span className="flex items-center gap-1.5 min-w-0 hover:underline cursor-pointer">
            <Mail className="w-[13px] h-[13px] text-text-muted shrink-0" />
            <span className="truncate">c.brand@logixflow.de</span>
          </span>
          <span className="h-4 w-px bg-border"></span>
          <span className="flex items-center gap-1.5 shrink-0 hover:underline cursor-pointer">
            <Phone className="w-[13px] h-[13px] text-text-muted" />
            +49 123 456789
          </span>
          <span className="h-4 w-px bg-border"></span>
          <span className="flex items-center gap-1.5 shrink-0 hover:underline cursor-pointer">
            <LinkedinIcon className="w-[13px] h-[13px] text-text-muted" />
            in/christianbrand
          </span>
          <span className="h-4 w-px bg-border"></span>
          <span className="flex items-center gap-1.5 shrink-0 hover:underline cursor-pointer">
            <Globe className="w-[13px] h-[13px] text-text-muted" />
            logixflow.de
          </span>
        </div>

        <nav className="flex flex-nowrap border-b border-border-subtle mt-6 gap-7 overflow-x-auto scrollbar-none w-full">
          {[
            { id: 'overview', label: 'Übersicht' },
            { id: 'communication', label: 'Kommunikation' },
            { id: 'activity', label: 'Aktivität' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'notes', label: 'Notizen' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-xs font-bold transition-all shrink-0 ${activeTab === tab.id ? 'text-[var(--sherloq-primary)]' : 'text-text-muted hover:text-text-body'}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute left-0 right-0 bottom-0 bg-[var(--sherloq-primary)] rounded-t-full" style={{ height: '2px' }} />
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto p-7 space-y-7 bg-app-bg custom-scrollbar pb-28">

        {activeTab === 'overview' && (
          <div className="space-y-7 animate-fade-in">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest pl-1">KI Kurzakte</span>
              <div className="bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] rounded-[12px] p-5 leading-relaxed text-[13px] text-text-body font-medium shadow-sm">
                Refactoring der Outreach-Struktur gestartet. Sucht aktiv nach einem Tool zur Senkung der SDR Ramp-Up-Time.
                Reagiert stark auf analytische Vergleiche und klare ROI-Argumentation.
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest pl-1">Aktive Signale</span>
              <div className="space-y-3">
                <div className="p-4 bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-urgent-text)] font-semibold shadow-sm">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Stagniert — 8T in Stage Demo
                  </span>
                  <button onClick={() => showToast('Next Step geöffnet')} className="text-[var(--signal-urgent-text)] hover:underline font-bold">
                    Next Step →
                  </button>
                </div>

                <div className="p-4 bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-warn-text)] font-semibold shadow-sm">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Keine Task hinterlegt
                  </span>
                  <button onClick={() => showToast('Task anlegen gestartet')} className="text-[var(--signal-warn-text)] hover:underline font-bold">
                    Task anlegen →
                  </button>
                </div>

                <div className="p-4 bg-[var(--signal-info-bg)] border border-[var(--signal-info-bg)] rounded-[12px] flex items-center justify-between text-xs text-[var(--signal-info-text)] font-semibold shadow-sm">
                  <span className="flex items-center gap-2">
                    <LinkedinIcon className="w-4 h-4" />
                    LinkedIn Signal — vor 2h
                  </span>
                  <button onClick={() => setActiveTab('communication')} className="text-[var(--signal-info-text)] hover:underline font-bold">
                    Ansehen →
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest pl-1">Deal Setup</span>
              <div className="bg-app-surface rounded-[12px] p-5 border border-border shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-text-body">
                  <div className="bg-app-bg border border-border rounded-xl p-3">
                    <span className="text-[9px] font-bold text-text-muted uppercase block mb-1">Stage</span>
                    <span className="text-text-primary font-bold block">{person.stage || "Demo vereinbart"}</span>
                  </div>
                  <div className="bg-app-bg border border-border rounded-xl p-3">
                    <span className="text-[9px] font-bold text-text-muted uppercase block mb-1">Probability</span>
                    <span className="text-text-primary font-bold block">100%</span>
                  </div>
                  <div className="bg-app-bg border border-border rounded-xl p-3">
                    <span className="text-[9px] font-bold text-text-muted uppercase block mb-1">ARR</span>
                    <span className="text-[var(--sherloq-primary)] font-extrabold text-[13px] block">12.500 EUR</span>
                  </div>
                  <div className="bg-app-bg border border-border rounded-xl p-3">
                    <span className="text-[9px] font-bold text-text-muted uppercase block mb-1">MRR</span>
                    <span className="text-text-primary font-bold block">1.041,667 EUR</span>
                  </div>
                  <div className="bg-app-bg border border-border rounded-xl p-3">
                    <span className="text-[9px] font-bold text-text-muted uppercase block mb-1">Laufzeit</span>
                    <span className="text-text-primary font-bold block">12 Monate</span>
                  </div>
                  <div className="bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] rounded-xl p-3">
                    <span className="text-[9px] font-bold text-[var(--signal-urgent-text)] uppercase block mb-1">In Stage Seit</span>
                    <span className="px-2 py-0.5 rounded bg-app-surface text-[var(--signal-urgent-text)] font-bold text-[11px] inline-flex items-center gap-1 mt-1 border border-[var(--signal-urgent-bg)]">
                      8 Tagen <AlertTriangle className="w-[11px] h-[11px]" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Offene Tasks</span>
                <button onClick={() => showToast('Neue Task angelegt')} className="text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">
                  + Task hinzufügen
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-[12px] flex items-center justify-between bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] shadow-sm">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="accent-[var(--sherloq-primary)] w-4 h-4 cursor-pointer" />
                    <div>
                      <p className="text-xs font-bold text-[var(--signal-urgent-text)]">ROI-Dokument senden</p>
                      <span className="text-[10px] font-semibold flex items-center gap-1 mt-1 text-[var(--signal-urgent-text)]">
                        <AlertTriangle className="w-[10px] h-[10px]" /> Heute fällig · ✉ Email
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-[12px] flex items-center justify-between bg-app-surface border border-border shadow-sm">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="accent-[var(--sherloq-primary)] w-4 h-4 cursor-pointer" />
                    <div>
                      <p className="text-xs font-bold text-text-primary">Follow-up Call buchen</p>
                      <span className="text-[10px] font-semibold flex items-center gap-1 mt-1 text-text-muted">
                        In 3 Tagen · 📞 Telefon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Active Sequence</span>
                <span className="text-[11px] font-bold text-[var(--sherloq-primary)]">Schritt 3 von 5</span>
              </div>

              <div className="bg-app-surface rounded-[12px] p-6 border border-border shadow-sm flex items-start justify-between relative px-8">
                <div className="absolute left-12 right-12 top-[42px] h-px bg-border z-0"></div>

                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--sherloq-primary)] text-on-accent shadow-sm">
                    <Mail className="w-[14px] h-[14px]" />
                  </div>
                  <span className="text-[10px] font-bold text-text-muted">Mail</span>
                </div>

                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--sherloq-primary)] text-on-accent shadow-sm">
                    <LinkedinIcon className="w-[14px] h-[14px]" />
                  </div>
                  <span className="text-[10px] font-bold text-text-muted">LinkedIn</span>
                </div>

                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-app-surface border-2 border-[var(--sherloq-primary)] text-[var(--sherloq-primary)] shadow-sm">
                    <Phone className="w-[14px] h-[14px]" />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--sherloq-primary)]">Telefon</span>
                </div>

                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-app-surface border-2 border-dashed border-border text-icon-muted">
                    <Mail className="w-[14px] h-[14px]" />
                  </div>
                  <span className="text-[10px] font-bold text-text-muted">Mail</span>
                </div>

                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-app-surface border-2 border-dashed border-border text-icon-muted">
                    <Phone className="w-[14px] h-[14px]" />
                  </div>
                  <span className="text-[10px] font-bold text-text-muted">Telefon</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  Kommunikation
                  <span className="px-1.5 py-0.5 bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[8px] font-extrabold rounded-md uppercase">klickbar</span>
                </span>
                <button onClick={() => setActiveTab('communication')} className="text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">
                  Alle anzeigen →
                </button>
              </div>

              <div className="bg-app-surface rounded-[12px] p-5 border border-border shadow-sm divide-y divide-[var(--border-subtle)]">
                <div className="py-3 first:pt-0">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[var(--sherloq-primary)] flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm text-on-accent">
                      <Video className="w-[18px] h-[18px]" />
                      <div className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-[var(--sherloq-dark)] rounded-md border border-[var(--surface)] flex items-center justify-center shadow-sm">
                        <span className="text-[9px] font-black text-on-accent leading-none">T</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[14px] font-bold text-text-primary leading-tight">Discovery Call & Demo</h4>
                        <span className="text-[11px] font-medium text-text-muted">vor 5 Tagen</span>
                      </div>
                      <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">
                        Kunde zeigte starkes Interesse an Feature Y, Budget-Freeze bis Q3 angesprochen...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-3 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[var(--sherloq-primary)] flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm text-on-accent">
                      <Mail className="w-[18px] h-[18px]" />
                      <div className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-[var(--sherloq-dark)] rounded-md border border-[var(--surface)] flex items-center justify-center shadow-sm">
                        <span className="text-[9px] font-black text-on-accent leading-none">O</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[14px] font-bold text-text-primary leading-tight">Angebot gesendet: ROI-Dokument</h4>
                        <span className="text-[11px] font-medium text-text-muted">vor 8 Tagen</span>
                      </div>
                      <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">
                        Hallo Max, anbei wie besprochen das ROI-Dokument für Sherloq Enterprise...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'communication' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">
                Kommunikationsverlauf
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[9px] font-extrabold uppercase">
                Klickbar
              </span>
            </div>

            <div className="bg-app-surface rounded-[12px] p-5 border border-border shadow-sm divide-y divide-[var(--border-subtle)]">

              {/* Comm Item 1 */}
              <div className="py-3.5 first:pt-0 cursor-pointer group select-none" onClick={() => toggleComm(0)}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[var(--sherloq-primary)] flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm text-on-accent">
                    <Video className="w-[18px] h-[18px]" />
                    <div className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-[var(--sherloq-dark)] rounded-md border border-[var(--surface)] flex items-center justify-center shadow-sm">
                      <span className="text-[9px] font-black text-on-accent leading-none">T</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14px] font-bold text-text-primary leading-tight group-hover:text-[var(--sherloq-primary)] transition-colors">
                        Discovery Call & Demo
                      </h4>
                      <span className="text-[11px] font-medium text-text-muted shrink-0">vor 5 Tagen</span>
                    </div>
                    <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">
                      Kunde zeigte starkes Interesse an Feature Y, Budget-Freeze bis Q3 angesprochen...
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--sherloq-primary)] mt-2">
                      <span className={`transition-transform duration-200 inline-block ${expandedComm[0] ? 'rotate-180' : ''}`}>▼</span>
                      <span>{expandedComm[0] ? 'Zuklappen' : 'Klicken zum Lesen'}</span>
                    </div>

                    {expandedComm[0] && (
                      <div className="mt-3 p-4 bg-app-bg border border-border rounded-xl space-y-2 text-[12px] text-text-body leading-relaxed italic shadow-inner animate-fade-in">
                        <p><strong className="not-italic text-[var(--sherloq-primary)] font-bold">Max:</strong> "Wir suchen vor allem ein Tool, das sich nahtlos in unsere HubSpot-Pipeline einfügt."</p>
                        <p><strong className="not-italic text-text-primary font-bold">Du:</strong> "Perfekt, genau darauf ist Sherloq spezialisiert. Ich zeige dir kurz den Live-Sync."</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comm Item 2 */}
              <div className="py-3.5 cursor-pointer group select-none" onClick={() => toggleComm(1)}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[var(--sherloq-primary)] flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm text-on-accent">
                    <Mail className="w-[18px] h-[18px]" />
                    <div className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-[var(--sherloq-dark)] rounded-md border border-[var(--surface)] flex items-center justify-center shadow-sm">
                      <span className="text-[9px] font-black text-on-accent leading-none">O</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14px] font-bold text-text-primary leading-tight group-hover:text-[var(--sherloq-primary)] transition-colors">
                        Angebot gesendet: ROI-Dokument
                      </h4>
                      <span className="text-[11px] font-medium text-text-muted shrink-0">vor 8 Tagen</span>
                    </div>
                    <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">
                      Hallo Max, anbei wie besprochen das ROI-Dokument für Sherloq Enterprise...
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--sherloq-primary)] mt-2">
                      <span className={`transition-transform duration-200 inline-block ${expandedComm[1] ? 'rotate-180' : ''}`}>▼</span>
                      <span>{expandedComm[1] ? 'Zuklappen' : 'Klicken zum Lesen'}</span>
                    </div>
                    {expandedComm[1] && (
                      <div className="mt-3 p-4 bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] rounded-xl space-y-2 text-[12px] leading-relaxed shadow-inner animate-fade-in">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--signal-warn-text)] block">Vollständige E-Mail</span>
                        <p className="text-[var(--signal-warn-text)] font-medium italic">"Hallo Herr Brand, anbei finden Sie das besprochene ROI-Szenario für Ihr 8-köpfiges BDR-Team..."</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comm Item 3 */}
              <div className="py-3.5 last:pb-0 cursor-pointer group select-none" onClick={() => toggleComm(2)}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[var(--channel-linkedin)] flex items-center justify-center shrink-0 shadow-sm text-on-accent">
                    <LinkedinIcon className="w-[18px] h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14px] font-bold text-text-primary leading-tight group-hover:text-[var(--sherloq-primary)] transition-colors">
                        LinkedIn Nachricht
                      </h4>
                      <span className="text-[11px] font-medium text-text-muted shrink-0">vor 12 Tagen</span>
                    </div>
                    <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">
                      Danke für die Vernetzung, Max. Klasse was ihr bei PayGuard aufbaut...
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--sherloq-primary)] mt-2">
                      <span className={`transition-transform duration-200 inline-block ${expandedComm[2] ? 'rotate-180' : ''}`}>▼</span>
                      <span>{expandedComm[2] ? 'Zuklappen' : 'Klicken zum Lesen'}</span>
                    </div>
                    {expandedComm[2] && (
                      <div className="mt-3 p-4 bg-app-bg border border-border rounded-xl text-[12px] text-text-body leading-relaxed italic shadow-inner animate-fade-in">
                        "Hi Christian, danke für die Vernetzung! Ich verfolge eure Updates schon eine Weile. Lass uns bald mal kurz quatschen."
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4 animate-fade-in">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest pl-1">Historischer Zeitstrahl</span>
            <div className="bg-app-surface rounded-[12px] p-8 border border-border shadow-sm text-center text-xs text-text-muted py-14">
              <Clock className="w-7 h-7 mx-auto mb-3 text-icon-muted" />
              Hier werden alle CRM-Aktivitäten aus HubSpot, Outlook und LinkedIn synchronisiert.
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Alle Aufgaben</span>
              <button onClick={() => showToast('Neue Task angelegt')} className="text-xs font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">
                + Task anlegen
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-app-surface border border-border rounded-[12px] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-[var(--sherloq-primary)] w-4 h-4 cursor-pointer" />
                  <span className="text-xs font-bold text-[var(--signal-urgent-text)]">ROI-Dokument senden</span>
                </div>
                <span className="text-[10px] font-bold text-[var(--signal-urgent-text)] bg-[var(--signal-urgent-bg)] px-2 py-0.5 rounded-full border border-[var(--signal-urgent-bg)]">Heute fällig</span>
              </div>

              <div className="p-4 bg-app-surface border border-border rounded-[12px] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-[var(--sherloq-primary)] w-4 h-4 cursor-pointer" />
                  <span className="text-xs font-bold text-text-body">Follow-up Call buchen</span>
                </div>
                <span className="text-[10px] font-bold text-text-muted">In 3 Tagen</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">Notizen</span>
              {showAutosave && (
                <span className="text-[10px] font-bold text-[var(--sherloq-primary)] bg-[var(--signal-teal-bg)] px-2 py-0.5 rounded animate-pulse">Auto-Save...</span>
              )}
            </div>

            <textarea
              onBlur={handleNoteBlur}
              placeholder="Notiz verfassen..."
              className="w-full h-32 p-4 bg-app-surface border border-border focus:border-[var(--sherloq-primary)] rounded-[12px] outline-none text-xs leading-relaxed resize-none shadow-sm font-medium"
              defaultValue="Sucht aktives Tool zur Senkung der SDR Ramp-Up-Time."
            ></textarea>

            <div className="space-y-2 pt-2">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider pl-1">Verlauf</span>
              <div className="p-4 bg-app-surface border border-border-subtle rounded-[12px] text-xs space-y-1 shadow-sm">
                <span className="text-[10px] text-text-muted font-bold">12. Mai 2026 · Oliver Prossi</span>
                <p className="text-text-body font-medium">Thomas hat angedeutet, dass das Q3-Budget freigegeben wird.</p>
              </div>
              <div className="p-4 bg-app-surface border border-border-subtle rounded-[12px] text-xs space-y-1 shadow-sm">
                <span className="text-[10px] text-text-muted font-bold">03. April 2026 · Oliver Prossi</span>
                <p className="text-text-body font-medium">Demo lief hervorragend, Thomas war sehr engagiert.</p>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="p-4 border-t border-border-subtle bg-app-surface shrink-0 flex items-center justify-between gap-2 shadow-sm relative z-10">
        <button onClick={() => showToast('Task Aktion gestartet')} className="px-3.5 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5">Task</button>
        <button onClick={() => showToast('Mail Aktion gestartet')} className="px-3.5 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5">✉ Mail</button>
        <button onClick={() => showToast('LinkedIn Aktion gestartet')} className="px-3.5 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5">LinkedIn</button>
        <button onClick={() => showToast('Notiz Aktion gestartet')} className="px-3.5 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5">📎 Notiz</button>
        <button onClick={() => showToast('Usage geöffnet')} className="px-3.5 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5">📊 Usage ansehen</button>
      </footer>
        </>
        )}
      </SheetContent>
    </Sheet>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-inverse-surface text-on-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[var(--signal-success-text)]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
