import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, X, Sparkles, ClipboardList, Mail, Phone, Calendar, Check, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import LinkedinIcon from "@/components/shared/LinkedinIcon";
import Avatar from "@/components/shared/Avatar";

interface NoTaskPerson {
  name: string;
  company: string;
}

export interface NoTaskDrawerProps {
  /** Offen, wenn gesetzt; null = geschlossen (für Ausfahr-Animation immer gemountet). */
  person: NoTaskPerson | null;
  onClose: () => void;
}

/**
 * NoTaskDrawer — Action Panel „Keine Task": Task direkt anlegen. Gleiche Sheet-„drawer"-
 * Shell und Breite (50vw) wie die übrigen Action-Panels. Erinnerung als Toggle mit frei
 * wählbarem Tag + Uhrzeit. Deal-Auswahl via ui/select.
 */
export default function NoTaskDrawer({ person, onClose }: NoTaskDrawerProps) {
  const { t } = useTranslation();

  // Inhalt aus gehaltener Kopie, damit das Panel während der Ausfahr-Animation gefüllt bleibt.
  const [display, setDisplay] = useState<NoTaskPerson | null>(person);
  useEffect(() => { if (person) setDisplay(person); }, [person]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [taskTitle, setTaskTitle] = useState("ROI-Dokument senden");
  const [isError, setIsError] = useState(false);
  const [activeChannel, setActiveChannel] = useState("mail");
  const [activePriority, setActivePriority] = useState("medium");
  const [reminderActive, setReminderActive] = useState(true);

  // Set default due date to 2 days from now
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 2);
  const formattedDueDate = defaultDueDate.toISOString().split("T")[0];

  const [dueDate, setDueDate] = useState(formattedDueDate);

  // Erinnerung: Default Tag = morgen, Uhrzeit 09:00 (nur aktiv, wenn Toggle an).
  const reminderDefault = new Date();
  reminderDefault.setDate(reminderDefault.getDate() + 1);
  const [reminderDate, setReminderDate] = useState(reminderDefault.toISOString().split("T")[0]);
  const [reminderTime, setReminderTime] = useState("09:00");

  const isOpen = person !== null;
  const s = display;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  };

  const handleApplySuggestion = () => {
    setTaskTitle("ROI-Dokument senden");
    setIsError(false);
    triggerToast(t('hunter.drawers.noTask.toastApplied'));
  };

  const setChannel = (channel: string) => setActiveChannel(channel);
  const setPriority = (priority: string) => setActivePriority(priority);

  const toggleReminder = () => {
    triggerToast(reminderActive ? t('hunter.drawers.noTask.toastReminderOff') : t('hunter.drawers.noTask.toastReminderOn'));
    setReminderActive(!reminderActive);
  };

  const handleSave = () => {
    if (!taskTitle.trim()) {
      setIsError(true);
      return;
    }
    // In a real app we'd save the task here
    triggerToast(`${t('hunter.drawers.noTask.toastSaved')} ✓`);
    setTimeout(() => onClose(), 1100);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent side="drawer" className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface" style={{ width: "50vw", maxWidth: "95vw", minWidth: 480 }}>
          {s && (
            <>
              {/* HEADER */}
              <header className="h-[74px] px-6 border-b border-border flex items-center justify-between shrink-0 bg-app-surface z-30">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={s.name || "Sarah Jenkins"} size={44} className="shadow-sm" />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-bold text-text-primary leading-none">
                        {s.name || "Sarah Jenkins"}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] text-[var(--signal-warn-text)] text-[9px] font-extrabold tracking-wide">
                        <AlertTriangle className="w-2.5 h-2.5" /> {t('hunter.card.noTask')}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-text-muted mt-1">
                      {s.company || "CloudSphere"}
                    </p>
                  </div>
                </div>

                <SheetClose asChild>
                  <button className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </SheetClose>
              </header>

              {/* SCROLLABLE CONTENT — custom-scrollbar wie Kontakt-Panel */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-app-surface custom-scrollbar">

                {/* BLOCK 1: KONTEXT */}
                <section className="space-y-3">
                  <span className="text-[10px] font-extrabold text-[var(--signal-warn-text)] uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle className="w-2.5 h-2.5" /> {t('hunter.drawers.noTask.noTaskStored')}
                  </span>

                  <div className="p-4 bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] rounded-xl text-[13px] text-[var(--signal-warn-text)] font-semibold leading-relaxed">
                    {t('hunter.drawers.noTask.everyDealNeedsTask')}
                  </div>

                  <div className="p-4 bg-app-surface border border-border rounded-xl shadow-sm">
                    <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-widest block mb-1">
                      {t('hunter.drawers.noTask.dealInfo')}
                    </span>
                    <p className="text-[13px] text-text-body font-semibold leading-relaxed">
                      Stage: Demo vereinbart · Neu in Pipeline · vor 3 Tagen
                    </p>
                  </div>
                </section>

                {/* BLOCK 2: KI VORSCHLAG */}
                <section className="bg-[var(--signal-teal-bg)] border border-[var(--signal-success-bg)] rounded-xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--sherloq-primary)] uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    {t('hunter.drawers.noTask.kiSuggests')}
                  </div>

                  <div>
                    <h4 className="text-[15px] font-extrabold text-text-primary leading-tight">
                      ROI-Dokument senden
                    </h4>
                    <p className="text-[13px] font-medium text-text-body leading-relaxed mt-2">
                      Demo war positiv — konkretes Angebot als nächster Schritt sinnvoll.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[var(--sherloq-primary)]">
                      <Mail className="w-3.5 h-3.5" /> {t('hunter.drawers.noTask.emailRecommended')}
                    </span>
                    <button onClick={handleApplySuggestion} className="px-3 py-1.5 bg-[var(--sherloq-primary)] text-on-accent rounded-[10px] text-[11px] font-bold cursor-pointer hover:opacity-90 transition-opacity">
                      {t('hunter.common.apply')}
                    </button>
                  </div>
                </section>

                {/* BLOCK 3: TASK FORMULAR IM MODAL STYLE */}
                <section className="bg-app-surface rounded-[12px] border border-border shadow-[var(--shadow-card)] overflow-hidden">

                  <div className="px-5 py-4 flex items-center justify-between border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-[var(--sherloq-primary)]" />
                      <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">
                        {t('hunter.drawers.noTask.newTask')}
                      </h2>
                    </div>
                    <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                      {t('hunter.drawers.noTask.openedInstantly')}
                    </span>
                  </div>

                  <div className="p-5 space-y-5">

                    {/* Titel */}
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-text-muted">
                        {t('hunter.drawers.noTask.whatToDo')}
                      </label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => {
                          setTaskTitle(e.target.value);
                          if (isError) setIsError(false);
                        }}
                        placeholder={t('hunter.drawers.noTask.taskTitlePlaceholder')}
                        className={`w-full px-4 py-3 rounded-[10px] border outline-none transition-all focus:border-[var(--sherloq-primary)] text-[13px] font-semibold ${isError ? 'border-[var(--signal-warn-bg)] bg-[var(--signal-warn-bg)]' : 'border-border'}`}
                      />
                    </div>

                    {/* Kontakt & Deal */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-text-muted">
                          {t('hunter.drawers.noTask.contact')}
                        </label>
                        <input
                          type="text"
                          value={s.name || "Sarah Jenkins"}
                          readOnly
                          className="w-full px-4 py-2.5 rounded-[10px] border border-border outline-none bg-app-bg cursor-not-allowed text-[13px] font-semibold text-text-muted"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-text-muted">
                          {t('hunter.drawers.noTask.deal')}
                        </label>
                        <Select defaultValue="demo">
                          <SelectTrigger className="w-full px-4 py-2.5 rounded-[10px] border-border bg-app-surface text-[13px] font-semibold text-text-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="demo">Demo vereinbart</SelectItem>
                            <SelectItem value="enterprise">Enterprise Upgrade (24.000€)</SelectItem>
                            <SelectItem value="none">Kein Deal verknüpft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Kanal */}
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-text-muted">
                        {t('hunter.drawers.noTask.channel')}
                      </label>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setChannel("mail")}
                          className={`w-10 h-10 rounded-[10px] flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'mail' ? 'bg-[var(--sherloq-primary)] text-on-accent border-transparent' : 'bg-app-bg border-border text-text-muted hover:bg-app-bg'}`}
                        >
                          <Mail className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          onClick={() => setChannel("linkedin")}
                          className={`w-10 h-10 rounded-[10px] flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'linkedin' ? 'bg-[var(--sherloq-primary)] text-on-accent border-transparent' : 'bg-app-bg border-border text-text-muted hover:bg-app-bg'}`}
                        >
                          <LinkedinIcon className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          onClick={() => setChannel("phone")}
                          className={`w-10 h-10 rounded-[10px] flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'phone' ? 'bg-[var(--sherloq-primary)] text-on-accent border-transparent' : 'bg-app-bg border-border text-text-muted hover:bg-app-bg'}`}
                        >
                          <Phone className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          onClick={() => setChannel("calendar")}
                          className={`w-10 h-10 rounded-[10px] flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'calendar' ? 'bg-[var(--sherloq-primary)] text-on-accent border-transparent' : 'bg-app-bg border-border text-text-muted hover:bg-app-bg'}`}
                        >
                          <Calendar className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          onClick={() => setChannel("other")}
                          className={`w-10 h-10 rounded-[10px] flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'other' ? 'bg-[var(--sherloq-primary)] text-on-accent border-transparent' : 'bg-app-bg border-border text-text-muted hover:bg-app-bg'}`}
                        >
                          <ClipboardList className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </div>

                    {/* Beschreibung */}
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-text-muted">
                        {t('hunter.drawers.noTask.descriptionOptional')}
                      </label>
                      <textarea
                        rows={5}
                        defaultValue="AI-Notiz: Demo war positiv. ROI-Dokument und konkretes Angebot als nächsten Schritt senden."
                        className="w-full px-4 py-3 rounded-[10px] border border-border outline-none focus:border-[var(--sherloq-primary)] resize-none text-[13px] font-medium leading-relaxed min-h-[120px]"
                      />
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-text-muted">
                          {t('hunter.drawers.noTask.dueDate')}
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-[10px] border border-border outline-none text-[13px] font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-text-muted">
                          {t('hunter.drawers.noTask.time')}
                        </label>
                        <input
                          type="time"
                          defaultValue="09:00"
                          className="w-full px-4 py-2.5 rounded-[10px] border border-border outline-none text-[13px] font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-text-muted">
                          {t('hunter.drawers.noTask.priority')}
                        </label>

                        <div className="flex gap-1.5">
                          <button onClick={() => setPriority("low")} className={`px-2 py-1.5 rounded-[7px] text-[10px] font-bold cursor-pointer ${activePriority === 'low' ? 'bg-[var(--sherloq-primary)] text-on-accent' : 'bg-app-bg text-text-muted'}`}>
                            {t('hunter.drawers.noTask.low')}
                          </button>
                          <button onClick={() => setPriority("medium")} className={`px-2 py-1.5 rounded-[7px] text-[10px] font-bold cursor-pointer ${activePriority === 'medium' ? 'bg-[var(--sherloq-primary)] text-on-accent' : 'bg-app-bg text-text-muted'}`}>
                            {t('hunter.drawers.noTask.medium')}
                          </button>
                          <button onClick={() => setPriority("high")} className={`px-2 py-1.5 rounded-[7px] text-[10px] font-bold cursor-pointer ${activePriority === 'high' ? 'bg-[var(--sherloq-primary)] text-on-accent' : 'bg-app-bg text-text-muted'}`}>
                            {t('hunter.drawers.noTask.high')}
                          </button>
                          <button onClick={() => setPriority("urgent")} className={`px-2 py-1.5 rounded-[7px] text-[10px] font-bold cursor-pointer ${activePriority === 'urgent' ? 'bg-[var(--sherloq-primary)] text-on-accent' : 'bg-app-bg text-text-muted'}`}>
                            {t('hunter.drawers.noTask.urgent')}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-text-muted">
                          {t('hunter.drawers.noTask.assignee')}
                        </label>

                        <div className="flex items-center gap-2 bg-app-bg p-1.5 rounded-[10px]">
                          <div className="w-6 h-6 rounded-full bg-sherloq-primary text-on-accent text-[10px] flex items-center justify-center font-bold">
                            ME
                          </div>
                          <span className="text-[12px] font-bold text-text-body">
                            {t('hunter.drawers.noTask.myself')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Erinnerung — Toggle; aktiv → Tag + Uhrzeit frei wählbar */}
                    <div className="space-y-3 pt-1 border-t border-border-subtle pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-text-body">
                          {t('hunter.drawers.noTask.reminder')}
                        </span>
                        <button
                          onClick={toggleReminder}
                          aria-label={t('hunter.drawers.noTask.reminder')}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${reminderActive ? 'bg-[var(--sherloq-primary)]' : 'bg-border'}`}
                        >
                          <span className={`block w-5 h-5 rounded-full bg-app-surface shadow-sm transition-transform ${reminderActive ? 'translate-x-[20px]' : 'translate-x-0'}`}></span>
                        </button>
                      </div>

                      {reminderActive && (
                        <div className="grid grid-cols-2 gap-4 animate-fade-in">
                          <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-text-muted">
                              {t('hunter.drawers.noTask.reminderDay')}
                            </label>
                            <input
                              type="date"
                              value={reminderDate}
                              onChange={(e) => setReminderDate(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-[10px] border border-border outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] font-semibold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-text-muted">
                              {t('hunter.drawers.noTask.time')}
                            </label>
                            <input
                              type="time"
                              value={reminderTime}
                              onChange={(e) => setReminderTime(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-[10px] border border-border outline-none focus:border-[var(--sherloq-primary)] transition-colors text-[13px] font-semibold"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* AKTIONEN */}
                <section className="space-y-3 pt-1">
                  <button onClick={handleSave} className="w-full py-3 text-on-accent rounded-full text-[13px] font-extrabold shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 cursor-pointer" style={{ background: "var(--sherloq-gradient)" }}>
                    <Check className="w-4 h-4" />
                    {t('hunter.common.saveTask')}
                  </button>

                  <button onClick={() => {
                    triggerToast(t('hunter.drawers.noTask.toastCancelled'));
                    setTimeout(() => onClose(), 1100);
                  }} className="w-full text-center text-[12px] font-bold text-text-muted hover:text-text-body transition-colors cursor-pointer">
                    {t('hunter.common.cancel')}
                  </button>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-inverse-surface text-on-accent px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[var(--signal-success-text)]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
