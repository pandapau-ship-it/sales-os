import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, X, Sparkles, ClipboardList, Mail, Phone, Calendar, Check, CheckCircle2 } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

export interface NoTaskDrawerProps {
  person: {
    name: string;
    company: string;
    avatarInitials: string;
    avatarBg: string;
  };
  onClose: () => void;
}

export default function NoTaskDrawer({ person, onClose }: NoTaskDrawerProps) {
  const { t } = useTranslation();
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

  const setChannel = (channel: string) => {
    setActiveChannel(channel);
  };

  const setPriority = (priority: string) => {
    setActivePriority(priority);
  };

  const toggleReminder = () => {
    if (reminderActive) {
      triggerToast(t('hunter.drawers.noTask.toastReminderOff'));
    } else {
      triggerToast(t('hunter.drawers.noTask.toastReminderOn'));
    }
    setReminderActive(!reminderActive);
  };

  const handleSave = () => {
    if (!taskTitle.trim()) {
      setIsError(true);
      return;
    }
    
    // In a real app we'd save the task here
    triggerToast(`${t('hunter.drawers.noTask.toastSaved')} ✓`);

    setTimeout(() => {
      onClose();
    }, 1100);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-4 bottom-4 right-4 w-[580px] bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-[110] animate-slide-in select-none">
        
        {/* HEADER */}
        <header className="h-[74px] px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center font-extrabold text-[15px] shadow-sm ${person.avatarBg || "bg-[var(--icp-medium)]"}`}>
                {person.avatarInitials || "SJ"}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] font-bold text-gray-900 leading-none">
                  {person.name || "Sarah Jenkins"}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-extrabold tracking-wide">
                  <AlertTriangle className="w-2.5 h-2.5" /> {t('hunter.card.noTask')}
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-400 mt-1">
                {person.company || "CloudSphere"}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-none">

          {/* BLOCK 1: KONTEXT */}
          <section className="space-y-3">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-2.5 h-2.5" /> {t('hunter.drawers.noTask.noTaskStored')}
            </span>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-[13px] text-amber-800 font-semibold leading-relaxed">
              {t('hunter.drawers.noTask.everyDealNeedsTask')}
            </div>

            <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                {t('hunter.drawers.noTask.dealInfo')}
              </span>
              <p className="text-[13px] text-gray-700 font-semibold leading-relaxed">
                Stage: Demo vereinbart · Neu in Pipeline · vor 3 Tagen
              </p>
            </div>
          </section>

          {/* BLOCK 2: KI VORSCHLAG */}
          <section className="bg-[var(--signal-teal-bg)] border border-emerald-100 rounded-xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--sherloq-primary)] uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
               {t('hunter.drawers.noTask.kiSuggests')}
            </div>

            <div>
              <h4 className="text-[15px] font-extrabold text-gray-900 leading-tight">
                ROI-Dokument senden
              </h4>
              <p className="text-[13px] font-medium text-gray-800 leading-relaxed mt-2">
                Demo war positiv — konkretes Angebot als nächster Schritt sinnvoll.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[var(--sherloq-primary)]">
                <Mail className="w-3.5 h-3.5" /> {t('hunter.drawers.noTask.emailRecommended')}
              </span>
              <button onClick={handleApplySuggestion} className="px-3 py-1.5 bg-[var(--sherloq-primary)] text-white rounded-lg text-[11px] font-bold cursor-pointer">
                {t('hunter.common.apply')}
              </button>
            </div>
          </section>

          {/* BLOCK 3: TASK FORMULAR IM MODAL STYLE */}
          <section className="bg-white rounded-[20px] border border-gray-100 shadow-[0_14px_35px_-18px_rgba(0,0,0,0.25)] overflow-hidden">

            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[var(--sherloq-primary)]" />
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">
                  {t('hunter.drawers.noTask.newTask')}
                </h2>
              </div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                {t('hunter.drawers.noTask.openedInstantly')}
              </span>
            </div>

            <div className="p-5 space-y-5">

              {/* Titel */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-gray-500">
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
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all focus:border-[var(--sherloq-primary)] text-[13px] font-semibold ${isError ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}
                />
              </div>

              {/* Kontakt & Deal */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-500">
                    {t('hunter.drawers.noTask.contact')}
                  </label>
                  <input
                    type="text"
                    value={person.name || "Sarah Jenkins"}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-gray-100 cursor-not-allowed text-[13px] font-semibold text-gray-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-500">
                    {t('hunter.drawers.noTask.deal')}
                  </label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[var(--sherloq-primary)] bg-white text-[13px] font-semibold">
                    <option>Demo vereinbart</option>
                    <option>Enterprise Upgrade (24.000€)</option>
                    <option>Kein Deal verknüpft</option>
                  </select>
                </div>
              </div>

              {/* Kanal */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-gray-500">
                  {t('hunter.drawers.noTask.channel')}
                </label>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setChannel("mail")} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'mail' ? 'bg-[var(--sherloq-primary)] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Mail className="w-[18px] h-[18px]" />
                  </button>
                  <button 
                    onClick={() => setChannel("linkedin")} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'linkedin' ? 'bg-[var(--sherloq-primary)] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                  >
                    <LinkedinIcon className="w-[18px] h-[18px]" />
                  </button>
                  <button 
                    onClick={() => setChannel("phone")} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'phone' ? 'bg-[var(--sherloq-primary)] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Phone className="w-[18px] h-[18px]" />
                  </button>
                  <button 
                    onClick={() => setChannel("calendar")} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'calendar' ? 'bg-[var(--sherloq-primary)] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Calendar className="w-[18px] h-[18px]" />
                  </button>
                  <button 
                    onClick={() => setChannel("other")} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${activeChannel === 'other' ? 'bg-[var(--sherloq-primary)] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                  >
                    <ClipboardList className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>

              {/* Beschreibung */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-gray-500">
                  {t('hunter.drawers.noTask.descriptionOptional')}
                </label>
                <textarea
                  rows={3}
                  defaultValue="AI-Notiz: Demo war positiv. ROI-Dokument und konkretes Angebot als nächsten Schritt senden."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[var(--sherloq-primary)] resize-none text-[13px] font-medium leading-relaxed"
                />
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-500">
                    {t('hunter.drawers.noTask.dueDate')}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-[13px] font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-500">
                    {t('hunter.drawers.noTask.time')}
                  </label>
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-[13px] font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-500">
                    {t('hunter.drawers.noTask.priority')}
                  </label>

                  <div className="flex gap-1.5">
                    <button onClick={() => setPriority("low")} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${activePriority === 'low' ? 'bg-[var(--sherloq-primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {t('hunter.drawers.noTask.low')}
                    </button>
                    <button onClick={() => setPriority("medium")} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${activePriority === 'medium' ? 'bg-[var(--sherloq-primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {t('hunter.drawers.noTask.medium')}
                    </button>
                    <button onClick={() => setPriority("high")} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${activePriority === 'high' ? 'bg-[var(--sherloq-primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {t('hunter.drawers.noTask.high')}
                    </button>
                    <button onClick={() => setPriority("urgent")} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${activePriority === 'urgent' ? 'bg-[var(--sherloq-primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {t('hunter.drawers.noTask.urgent')}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-500">
                    {t('hunter.drawers.noTask.assignee')}
                  </label>

                  <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
                      ME
                    </div>
                    <span className="text-[12px] font-bold text-gray-700">
                      {t('hunter.drawers.noTask.myself')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reminder */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[12px] font-bold text-gray-700">
                  {t('hunter.drawers.noTask.remind1DayBefore')}
                </span>
                <button 
                  onClick={toggleReminder} 
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${reminderActive ? 'bg-[var(--sherloq-primary)]' : 'bg-gray-200'}`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${reminderActive ? 'translate-x-[20px]' : 'translate-x-0'}`}></span>
                </button>
              </div>

              {/* Verknüpfen mit */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {t('hunter.drawers.noTask.linkWith')}
                </label>

                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-[11px] font-bold text-gray-600 flex items-center gap-1.5 cursor-pointer">
                    Campaign
                    <X className="w-3 h-3" />
                  </span>
                  <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-[11px] font-bold text-gray-600 flex items-center gap-1.5 cursor-pointer">
                    Demo Deal
                    <X className="w-3 h-3" />
                  </span>
                  <button className="px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-[11px] font-bold text-gray-400 cursor-pointer hover:bg-gray-50">
                    {t('hunter.drawers.noTask.addLink')}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* AKTIONEN */}
          <section className="space-y-3 pt-1">
            <button onClick={handleSave} className="w-full py-3 text-white rounded-full text-[13px] font-extrabold shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 cursor-pointer" style={{ background: "var(--sherloq-gradient)" }}>
              <Check className="w-4 h-4" />
              {t('hunter.common.saveTask')}
            </button>

            <button onClick={() => {
              triggerToast(t('hunter.drawers.noTask.toastCancelled'));
              setTimeout(() => onClose(), 1100);
            }} className="w-full text-center text-[12px] font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
              {t('hunter.common.cancel')}
            </button>
          </section>
        </main>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-gray-950 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
