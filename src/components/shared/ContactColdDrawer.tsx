import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Snowflake, X, Sparkles, RotateCw, Send, Check } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import Avatar from "@/components/shared/Avatar";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

interface ColdPerson {
  name: string;
  company: string;
  avatarUrl?: string;
  daysInStage: number;
  lastContactDays: number;
  lastContactChannel: string;
  lastConversationSentiment: string;
  aiRecommendation: string;
  confidence: number;
  tags: string[];
}

export interface ContactColdDrawerProps {
  /** Offen, wenn gesetzt; null = geschlossen (für Ausfahr-Animation immer gemountet). */
  person: ColdPerson | null;
  onClose: () => void;
}

/**
 * ContactColdDrawer — gleiche Sheet-Shell wie Kontakt- & Signal-Panel
 * (slide-in von rechts, Radix-Overlay/Backdrop, custom-scrollbar, X/Backdrop/Escape),
 * Breite 580px. Inhalt unverändert.
 */
export default function ContactColdDrawer({ person, onClose }: ContactColdDrawerProps) {
  const { t } = useTranslation();

  // Inhalt aus gehaltener Kopie, damit das Panel während der Ausfahr-Animation gefüllt bleibt.
  const [display, setDisplay] = useState<ColdPerson | null>(person);
  useEffect(() => { if (person) setDisplay(person); }, [person]);

  const [draftText, setDraftText] = useState("Hi Christian, wollte mich kurz melden — habt ihr das Thema BDR-Effizienz intern weiterverfolgt?");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("LinkedIn");
  const [reminderActive, setReminderActive] = useState(true);

  const isOpen = person !== null;
  const s = display;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setDraftText("Hi Christian, ich wollte nochmal an unser Demo-Gespräch anknüpfen — ist BDR-Effizienz bei euch aktuell noch ein Thema?");
      setIsRegenerating(false);
      triggerToast(t('hunter.drawers.cold.toastRegenerated'));
    }, 700);
  };

  const toggleReminder = () => {
    triggerToast(reminderActive ? t('hunter.drawers.cold.toastReminderOff') : t('hunter.drawers.cold.toastReminderOn'));
    setReminderActive(!reminderActive);
  };

  const setChannel = (channel: string) => {
    setActiveChannel(channel);
    triggerToast(t('hunter.drawers.cold.toastChannelSelected', { channel }));
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent side="drawer" className="flex flex-col font-sans overflow-hidden p-0 bg-white" style={{ width: 580, maxWidth: "95vw" }}>
          {s && (
            <>
              {/* HEADER */}
              <header className="h-[78px] px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={s.name} src={s.avatarUrl} size={44} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-bold text-gray-900 leading-none">
                        {s.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-extrabold tracking-wide">
                        {t('hunter.heat.cold')} <Snowflake className="w-2.5 h-2.5" />
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-[9px] font-extrabold tracking-wide">
                        {t('hunter.common.daysInStage', { days: s.daysInStage })} <AlertTriangle className="w-2.5 h-2.5" />
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-gray-400 mt-1">
                      {s.company}
                    </p>
                  </div>
                </div>

                <SheetClose asChild>
                  <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shrink-0 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </SheetClose>
              </header>

              {/* SCROLLABLE CONTENT — custom-scrollbar wie Kontakt-Panel */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">

                {/* BLOCK 1: KALT KONTEXT */}
                <section className="space-y-3">
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Snowflake className="w-2.5 h-2.5" /> {t('hunter.drawers.cold.contactGoingCold')}
                  </span>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                    <p className="text-[13px] text-blue-800 font-semibold leading-relaxed">
                      {t('hunter.drawers.cold.lastContact', { channel: s.lastContactChannel, days: s.lastContactDays })}
                    </p>
                    <p className="text-[13px] text-blue-800 font-semibold leading-relaxed">
                      {t('hunter.drawers.cold.lastChannel', { channel: s.lastContactChannel })}
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                      {t('hunter.drawers.cold.sentiment')}
                    </span>
                    <p className="text-[13px] text-gray-700 font-semibold leading-relaxed">
                      {s.lastConversationSentiment}
                    </p>
                  </div>
                </section>

                {/* BLOCK 2: AI EMPFEHLUNG */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[var(--sherloq-primary)] uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      {t('hunter.common.aiRecommends')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-extrabold border border-emerald-100">
                      {t('hunter.common.confidence', { n: s.confidence })}
                    </span>
                  </div>

                  <div className="p-4 bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)]/50 rounded-xl space-y-3">
                    <p className="text-[13px] text-[var(--sherloq-primary)] font-bold leading-relaxed">
                      {s.aiRecommendation}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      {s.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full bg-white border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                {/* BLOCK 3: AI REAKTIVIERUNGS-NACHRICHT */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                      {t('hunter.drawers.cold.reactivationMessage')}
                    </span>
                    <button onClick={handleRegenerate} className="text-[11px] font-extrabold text-[var(--sherloq-primary)] hover:underline flex items-center gap-1 cursor-pointer">
                      {t('hunter.common.regenerate')}
                      <RotateCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setChannel("LinkedIn")}
                      className={`px-4 py-2 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer ${
                        activeChannel === "LinkedIn"
                          ? "bg-[var(--sherloq-primary)] text-white border-[var(--sherloq-primary)] shadow-[0_2px_8px_rgba(23,82,83,0.12)]"
                          : "bg-white border-gray-200 text-gray-600"
                      }`}
                    >
                      LinkedIn
                    </button>
                    <button
                      onClick={() => setChannel("Email")}
                      className={`px-4 py-2 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer ${
                        activeChannel === "Email"
                          ? "bg-[var(--sherloq-primary)] text-white border-[var(--sherloq-primary)] shadow-[0_2px_8px_rgba(23,82,83,0.12)]"
                          : "bg-white border-gray-200 text-gray-600"
                      }`}
                    >
                      Email
                    </button>
                  </div>

                  <div className="bg-white rounded-[18px] border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-[var(--channel-linkedin)] text-white text-[12px] flex items-center justify-between">
                      <span className="font-extrabold flex items-center gap-2">
                        <LinkedinIcon className="w-3.5 h-3.5" />
                        {t('hunter.drawers.cold.linkedinComposer')}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-lg">
                        {t('hunter.common.autoDraft')}
                      </span>
                    </div>

                    <div className="bg-[var(--border-subtle)] p-4">
                      <div className="bg-blue-50 border border-blue-100 text-gray-900 p-4 rounded-2xl rounded-tr-md shadow-sm leading-relaxed">
                        <textarea
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          className="w-full h-28 bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-gray-900 border-none scrollbar-none"
                        />
                      </div>

                      <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-400 font-bold uppercase">
                        <span>{t('hunter.common.draftFromSherloqToday')}</span>
                        <span>{draftText.length}/300</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* BLOCK 4: FOLLOW-UP REMINDER */}
                <section className="space-y-3">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                    {t('hunter.drawers.cold.followUpReminder')}
                  </span>

                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[12px] font-semibold text-gray-700 leading-relaxed">
                        {t('hunter.drawers.cold.ifNoReplyIn')}
                      </label>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          defaultValue="5"
                          min="1"
                          className="w-14 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-center text-[12px] font-extrabold text-gray-900 outline-none focus:border-[var(--sherloq-primary)]"
                        />
                        <span className="text-[12px] font-bold text-gray-500">{t('hunter.drawers.cold.daysRemindAgain')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-gray-700">
                        {t('hunter.drawers.cold.automaticReminder')}
                      </span>
                      <button
                        onClick={toggleReminder}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${reminderActive ? 'bg-[var(--sherloq-primary)]' : 'bg-gray-200'}`}
                      >
                        <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${reminderActive ? 'translate-x-[20px]' : 'translate-x-0'}`}></span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* BLOCK 5: AKTIONEN */}
                <section className="space-y-2 pt-2">
                  <button onClick={() => triggerToast(t('hunter.drawers.cold.toastLinkedinSent'))} className="w-full py-3 bg-gradient-to-r from-[var(--sherloq-primary)] to-[var(--channel-linkedin)] text-white rounded-full text-[13px] font-extrabold shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 cursor-pointer">
                    <Send className="w-4 h-4" />
                    {t('hunter.drawers.cold.sendOnLinkedin')}
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => triggerToast(t('hunter.drawers.cold.toastEmailPrepared'))} className="py-2.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                      {t('hunter.drawers.cold.reactivateByEmail')}
                    </button>
                    <button onClick={() => triggerToast(t('hunter.drawers.cold.toastTask'))} className="py-2.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                      {t('hunter.common.createTask')}
                    </button>
                    <button onClick={() => triggerToast(t('hunter.drawers.cold.toastSnoozed'))} className="py-2.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                      {t('hunter.common.snooze')}
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-gray-950 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
