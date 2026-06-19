/**
 * TaskEntwurfForm — Task-Entwurf (Header + Kontakt-Bar + Kanal/Titel/AI-Entwurf/Fälligkeit/
 * Priorität + Speichern). Kanonischer Stand aus features/hunter/TaskDrawer.tsx — Overlay +
 * 850px-Panel-Hülle leben weiter im Drawer; hier nur der Inhalt (inkl. Schließen-Button + Footer).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, X, Mail, Link2, Phone, Video, MessageCircle, AlertTriangle } from "lucide-react";
import Avatar from "@/components/shared/Avatar";

export default function TaskEntwurfForm({
  person,
  recommendedChannel = 'LINKEDIN',
  recommendedTitle = 'LinkedIn Intro via aktuellen Post',
  recommendedNote = 'Hi Sarah, starker Post zum Thema Business Development gestern! Euer Ansatz bei CloudSphere deckt sich 1:1 mit dem was wir bei LogixFlow...',
  onClose,
  onSave,
}: {
  person: any;
  recommendedChannel?: string;
  recommendedTitle?: string;
  recommendedNote?: string;
  onClose: () => void;
  onSave: (taskData: any) => void;
}) {
  const { t } = useTranslation();
  const [channel, setChannel] = useState(recommendedChannel);
  const [title, setTitle] = useState(recommendedTitle);
  const [note, setNote] = useState(recommendedNote);
  const [date] = useState("30. Mai 2026");
  const [priority, setPriority] = useState('Medium');

  return (
    <>
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-9 h-9 bg-app-surface border border-[var(--border)] rounded-full hover:bg-app-bg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-all z-20 shadow-sm"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex-1 overflow-y-auto w-full custom-scrollbar flex flex-col border-none">
        <div className="p-8 pb-6 w-full mx-auto flex flex-col flex-1 pl-12 pt-10">

          {/* Header Area (Like CustomerDrawer) */}
          <div className="flex flex-col gap-6 mb-8 pr-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={person.person.name} src={person.person.avatarUrl} size={64} radius={20} className="shadow-sm" />
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[20px] font-extrabold text-[var(--text-primary)] font-sans tracking-tight leading-none">{person.person.name}</h2>
                    <div className="bg-[var(--signal-success-bg)] text-[var(--icp-high)] border border-[var(--icp-high)]/20 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide">
                      ICP: {person.icpScore ?? 87}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-[var(--text-body)] text-[13px] mt-2.5">
                    <span className="font-semibold">{person.person.jobTitle}</span>
                    <span className="text-[var(--icon-muted)]">•</span>
                    <div className="flex items-center gap-1.5">
                      <div className="bg-[var(--text-primary)] text-on-accent text-[10px] w-5 h-5 flex items-center justify-center rounded-[6px] font-bold">
                        {person.person.company.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-[var(--text-body)]">{person.person.company}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side stats */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--icon-muted)] uppercase tracking-wider">{t('hunter.common.status')}</span>
                  <div className="bg-[var(--signal-success-bg)] text-[var(--icp-high)] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-bold">
                    <div className="w-2 h-2 rounded-full bg-[var(--icp-high)]" style={{ width: '8px', height: '8px' }}></div>
                    Aktiv
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--icon-muted)] uppercase tracking-wider">{t('hunter.common.heat')}</span>
                  <div className="bg-[var(--signal-success-bg)] text-[var(--icp-high)] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--icp-high)]"></div>
                    Aktiv
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--icon-muted)] uppercase tracking-wider">{t('hunter.common.stage')}</span>
                  <div className="bg-app-surface border border-[var(--border)] text-[var(--text-body)] px-5 py-1.5 rounded-full flex items-center justify-center text-[13px] font-bold shadow-sm">
                    Demo
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info Bar */}
            <div className="bg-app-surface border border-[var(--border)] rounded-[24px] py-4 px-6 flex items-center justify-between shadow-[0_2px_10px_rgb(0,0,0,0.02)] w-full">
              <div className="flex items-center gap-2.5 text-[var(--text-body)]">
                <Mail className="w-4 h-4 text-[var(--icon-muted)]" />
                <span className="text-[14px] font-semibold">c.brand@logixflow.de</span>
              </div>
              <div className="w-px h-5 bg-[var(--border)]"></div>
              <div className="flex items-center gap-2.5 text-[var(--text-body)]">
                <Phone className="w-4 h-4 text-[var(--icon-muted)]" />
                <span className="text-[14px] font-semibold">+49 123 456789</span>
              </div>
              <div className="w-px h-5 bg-[var(--border)]"></div>
              <div className="flex items-center gap-2.5 text-[var(--text-body)]">
                <Link2 className="w-4 h-4 text-[var(--icon-muted)]" />
                <span className="text-[14px] font-semibold">in/max</span>
              </div>
              <div className="w-px h-5 bg-[var(--border)]"></div>
              <div className="flex items-center gap-2.5 text-[var(--text-body)]">
                <svg className="w-4 h-4 text-[var(--icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="text-[14px] font-semibold">firma.com</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 w-full max-w-[600px] mt-2">
              <div className="flex flex-col gap-3">
                  <span className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('hunter.drawers.task.channel')}</span>
                  <div className="flex flex-wrap items-center gap-2">
                  {[
                      { id: 'EMAIL', icon: Mail, label: 'Email', color: 'text-[var(--signal-info-text)]' },
                      { id: 'LINKEDIN', icon: Link2, label: 'LinkedIn', color: 'text-[var(--channel-linkedin)]' },
                      { id: 'CALL', icon: Phone, label: 'Call', color: 'text-[var(--text-muted)]' },
                      { id: 'MEETING', icon: Video, label: 'Meeting', color: 'text-[var(--text-muted)]' },
                      { id: 'WHATSAPP', icon: MessageCircle, label: 'WhatsApp', color: 'text-[var(--text-muted)]' },
                  ].map(c => {
                      const Icon = c.icon;
                      const isSelected = channel === c.id;
                      return (
                      <button
                          key={c.id}
                          onClick={() => setChannel(c.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-[14px] font-semibold transition-all ${
                          isSelected
                              ? 'border-[var(--border)] bg-app-surface text-[var(--text-primary)] shadow-sm'
                              : 'border-[var(--border)] bg-transparent text-[var(--text-body)] hover:bg-app-surface hover:shadow-xs'
                          }`}
                      >
                          <Icon className={`w-4 h-4 ${c.color}`} />
                          {c.label}
                      </button>
                      );
                  })}
                  </div>
              </div>

              {/* KI EMPFEHLUNG */}
              <div className="bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-[var(--icp-high)] font-bold text-[12px] tracking-wider uppercase">
                      <AlertTriangle className="w-4 h-4" /> {t('hunter.drawers.task.kiRecommendation')}
                  </div>
                  <p className="text-[var(--icp-high)] text-[14px] font-semibold leading-relaxed">
                      Erster Outreach empfohlen — LinkedIn DM basierend auf Post vom 14. Mai.<br/><br/>
                      Persönlichkeit Gelb: Wähle einen persönlichen, enthusiastischen Einstieg statt einer formellen Mail.
                  </p>
              </div>

              {/* TITEL DER TASK */}
              <div className="flex flex-col gap-3 mt-1">
                  <span className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('hunter.drawers.task.taskTitle')}</span>
                  <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-app-surface border border-[var(--border)] rounded-xl px-4 py-3.5 text-[var(--text-body)] font-medium text-[15px] focus:outline-none focus:border-[var(--sherloq-primary)] focus:ring-1 focus:ring-[var(--sherloq-primary)]"
                  />
              </div>

              {/* AI-ENTWURF (OPTIONAL) */}
              <div className="flex flex-col gap-3">
                  <span className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('hunter.drawers.task.aiDraftOptional')}</span>
                  <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full bg-app-surface border border-[var(--border)] rounded-xl px-4 py-3.5 text-[var(--text-body)] text-[15px] min-h-[140px] resize-none focus:outline-none focus:border-[var(--sherloq-primary)] focus:ring-1 focus:ring-[var(--sherloq-primary)]"
                  />
              </div>

              {/* BOTTOM ROW: DATE & PRIORITY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-0">
                  <div className="flex flex-col gap-3">
                      <span className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('hunter.drawers.task.dueDate')}</span>
                      <div className="bg-app-surface border border-[var(--border)] rounded-xl px-4 py-3.5 flex items-center gap-3">
                          <span className="text-[var(--text-muted)]"><Calendar className="w-4 h-4" /></span>
                          <span className="text-[var(--text-primary)] text-[15px] font-bold">{date}</span>
                      </div>
                  </div>
                  <div className="flex flex-col gap-3">
                      <span className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('hunter.drawers.task.priority')}</span>
                      <div className="bg-[var(--border-subtle)] rounded-xl p-1 flex items-center">
                          {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                              <button
                                  key={p}
                                  onClick={() => setPriority(p)}
                                  className={`flex-1 py-3 rounded-lg text-[13px] font-bold transition-all ${
                                      priority === p
                                      ? 'bg-app-surface text-[var(--text-primary)] shadow-sm'
                                      : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
                                  }`}
                              >
                                  {p}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

          </div>
        </div>

        <div className="pl-12 pr-8 py-5 border-t border-[var(--border)] bg-app-surface sticky bottom-0">
           <button
              onClick={() => onSave({ channel, title, note, date, priority })}
              className="w-full bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)]/95 text-on-accent text-[15px] font-bold py-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
           >
               {t('hunter.common.saveTask')}
           </button>
        </div>
      </div>
    </>
  );
}
