import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Sparkles, RotateCw, Send, ArrowUpRight, Check } from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

export interface SignalActionDrawerProps {
  person: {
    name: string;
    company: string;
    role: string;
    avatarUrl?: string;
    avatarInitials?: string;
    avatarBg?: string;
    icpScore: number;
    actionText: string;
    commentText: string;
    timeAgoLabel: string;
    timeLeftHours: number;
    windowHours: number;
    aiRecommendation: string;
    signalType: "comment" | "post" | "like" | "visit" | "company";
  };
  onClose: () => void;
  onTakeAction: (text: string) => void;
}

/**
 * SignalActionDrawer — 1:1 nach Side_Panel_Linkedin_signal.html.
 * 580px breit. Backdrop-Klick schließt NICHT (nur X). Aktionen schließen das
 * Panel automatisch nach kurzem Toast. Marken-Hex → Tokens, Emoji → Lucide,
 * UI-Strings → t(); Draft-/Kommentar-Inhalte bleiben (Content, später aus DB).
 */
export default function SignalActionDrawer({ person, onClose, onTakeAction }: SignalActionDrawerProps) {
  const { t } = useTranslation();
  const [draftText, setDraftText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userMessages, setUserMessages] = useState<{ text: string; role: "user" | "ai" }[]>([]);

  const confidence = 91;
  const timeProgress = Math.max(
    10,
    100 - (person.timeLeftHours / person.windowHours) * 100,
  );

  useEffect(() => {
    const first = person.name.split(" ")[0];
    if (person.signalType === "comment") {
      setDraftText(`Hi ${first}, danke für deinen Kommentar — das Thema Integrationen hören wir gerade häufig von Sales-Teams. Hast du diese Woche 15 Minuten für einen kurzen Austausch?`);
    } else if (person.signalType === "post") {
      setDraftText(`Hi ${first}, starker Beitrag zum Thema! Wir sehen bei unseren Kunden ähnliche Herausforderungen. Lasst uns gerne mal austauschen.`);
    } else {
      setDraftText(`Hi ${first}, ich habe gesehen, dass du dich für aktuelle Sales-Trends interessierst. Passt es dir nächste Woche für einen kurzen Connect?`);
    }
  }, [person]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  // Aktion ausführen → Toast → Panel schließt automatisch.
  const finishWithToast = (msg: string) => {
    triggerToast(msg);
    setTimeout(() => onClose(), 1100);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setDraftText(`Hi ${person.name.split(" ")[0]}, danke für deinen Kommentar — das Thema Integrationen hören wir gerade häufig von Sales-Teams. Hast du diese Woche 15 Minuten für einen kurzen Austausch?`);
      setIsRegenerating(false);
      triggerToast(t("hunter.common.draftNeuGeneriert"));
    }, 700);
  };

  const handleSendInstruction = () => {
    if (!chatInput.trim()) return;
    setUserMessages((prev) => [...prev, { text: chatInput, role: "user" }]);

    const lowered = chatInput.toLowerCase();
    let newDraft = draftText;
    if (lowered.includes("e-mail") || lowered.includes("email")) {
      newDraft = `Betreff: Austausch bei ${person.company}\n\nHallo ${person.name.split(" ").pop()},\n\ndein Signal hat mich angesprochen. Genau an dieser Stelle unterstützen wir Sales-Teams mit Sherloq. Hättest du diese Woche 15 Minuten für einen kurzen Austausch?\n\nViele Grüße`;
    } else if (lowered.includes("kürzer") || lowered.includes("kurz")) {
      newDraft = `Hi ${person.name.split(" ")[0]}, dein Kommentar passt genau zu dem, was wir lösen. Hast du 15 Min für einen kurzen Austausch?`;
    } else if (lowered.includes("förmlicher")) {
      newDraft = `Hallo Herr/Frau ${person.name.split(" ").pop()}, Ihr Kommentar hat mich angesprochen — genau diese Herausforderung adressieren wir mit Sherloq. Hätten Sie 15 Minuten für einen kurzen Austausch?`;
    }

    setTimeout(() => {
      setDraftText(newDraft);
      setUserMessages((prev) => [
        ...prev,
        { text: "Klar — ich passe den Entwurf entsprechend an. Du kannst auch schreiben: 'Mach es kürzer', 'als E-Mail', 'förmlicher' oder 'mit konkretem CTA'.", role: "ai" },
      ]);
      triggerToast(t("hunter.common.instructionApplied"));
    }, 500);

    setChatInput("");
  };

  return (
    <>
      {/* Backdrop — Klick schließt NICHT (nur X-Button) */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity" />

      <div className="fixed top-4 bottom-4 right-4 w-[580px] bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-[110] animate-slide-in select-none">
        {/* HEADER */}
        <header className="h-[72px] px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar name={person.name} src={person.avatarUrl} size={40} />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-gray-900 leading-none">{person.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-extrabold tracking-wide">
                  ICP: {person.icpScore}
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-400 mt-1">{person.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-none">
          {/* SIGNAL-KONTEXT */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
                  <LinkedinIcon className="w-[11px] h-[11px]" />
                  {t("hunter.common.linkedinSignal")}
                </span>
                <span className="text-[12px] font-medium text-gray-800 truncate">{person.actionText}</span>
              </div>
              <span className="text-[11px] font-bold text-gray-400 shrink-0 whitespace-nowrap">
                {t("hunter.common.ago", { label: person.timeAgoLabel })} ·{" "}
                <span className="text-red-600 font-extrabold">{t("hunter.common.hoursLeft", { hours: person.timeLeftHours })}</span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--icp-low)] rounded-full" style={{ width: `${timeProgress}%` }} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-right">
                {t("hunter.common.hoursWindow", { hours: person.windowHours })}
              </span>
            </div>

            {/* KOMMENTAR-BOX (grau) */}
            {person.commentText && (
              <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-[16px] text-xs text-gray-700 leading-relaxed font-semibold italic">
                "{person.commentText}"
              </div>
            )}
          </section>

          {/* AI EMPFIEHLT (teal) */}
          <section className="bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] p-4 rounded-[16px] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black text-[var(--sherloq-primary)] uppercase tracking-widest">
                <Sparkles className="w-[13px] h-[13px]" />
                {t("hunter.common.aiRecommends")}
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                {t("hunter.common.confidence", { n: confidence })}
              </span>
            </div>
            <p className="text-[13px] font-medium text-gray-700 leading-relaxed">{person.aiRecommendation}</p>
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">{t("hunter.drawers.signal.tagSignalHot")}</span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">{t("hunter.drawers.signal.tagIcpFits")}</span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">{t("hunter.drawers.signal.tagChannelFlexible")}</span>
            </div>
          </section>

          {/* AI COMPOSER */}
          <section className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">
              <span>{t("hunter.common.aiComposer")}</span>
              <button onClick={handleRegenerate} className="text-[var(--sherloq-primary)] hover:underline flex items-center gap-1 font-extrabold cursor-pointer">
                <RotateCw className={`w-[11px] h-[11px] ${isRegenerating ? "animate-spin" : ""}`} />
                {t("hunter.common.regenerate")}
              </button>
            </div>

            <div className="bg-white rounded-[18px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-[var(--sherloq-primary)] text-white text-[12px] flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold min-w-0">
                  <Sparkles className="w-[13px] h-[13px] fill-current shrink-0" />
                  <span className="truncate">{t("hunter.drawers.signal.composerHeader", { name: person.name })}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select className="bg-white/15 border border-white/15 text-white rounded-lg px-2 py-1 text-[10px] font-bold outline-none cursor-pointer">
                    <option className="text-gray-900">{t("hunter.drawers.signal.channelLinkedinDm")}</option>
                    <option className="text-gray-900">{t("hunter.drawers.signal.channelEmail")}</option>
                    <option className="text-gray-900">{t("hunter.drawers.signal.channelCallScript")}</option>
                    <option className="text-gray-900">{t("hunter.drawers.signal.channelFollowupTask")}</option>
                  </select>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-lg">{t("hunter.common.autoDraft")}</span>
                </div>
              </div>

              <div className="bg-[var(--app-bg)] min-h-[320px] p-4 flex flex-col gap-4">
                <div className="flex items-start gap-2 max-w-[96%]">
                  <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-[14px] h-[14px] fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("hunter.common.sherloqSuggestion")}</div>
                    <div className="bg-white border border-gray-200 text-gray-900 p-4 rounded-2xl rounded-tl-md shadow-sm leading-relaxed">
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        className="w-full min-h-[118px] bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-gray-900 border-none scrollbar-none"
                      />
                    </div>
                    <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-400 font-bold uppercase">
                      <span>{t("hunter.common.draftFromSherloqToday")}</span>
                      <span>{t("hunter.common.charsOf300", { count: draftText.length })}</span>
                    </div>
                  </div>
                </div>

                {userMessages.map((msg, idx) =>
                  msg.role === "user" ? (
                    <div key={idx} className="self-end max-w-[82%]">
                      <div className="mb-1 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("hunter.common.you")}</div>
                      <div className="bg-[var(--signal-info-bg)] border border-blue-100 text-gray-900 p-3 rounded-2xl rounded-tr-md shadow-sm text-[13px] font-medium leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex items-start gap-2 max-w-[96%]">
                      <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Sparkles className="w-[14px] h-[14px] fill-current" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("hunter.common.sherloqAi")}</div>
                        <div className="bg-white border border-gray-200 text-gray-900 p-3 rounded-2xl rounded-tl-md shadow-sm text-[13px] font-medium leading-relaxed">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-[var(--sherloq-primary)] focus-within:bg-white transition-all">
                  <textarea
                    rows={1}
                    placeholder={t("hunter.drawers.signal.instructPlaceholder")}
                    className="flex-1 bg-transparent resize-none outline-none text-[12px] font-medium leading-relaxed text-gray-800 placeholder-gray-400 min-h-[32px] max-h-[96px] scrollbar-none"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendInstruction();
                      }
                    }}
                  />
                  <button onClick={handleSendInstruction} className="w-8 h-8 rounded-full bg-[var(--sherloq-primary)] hover:opacity-90 text-white flex items-center justify-center shrink-0 transition-opacity cursor-pointer">
                    <Send className="w-[14px] h-[14px]" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-gray-400 font-bold">
                  <span>{t("hunter.drawers.signal.aiHint")}</span>
                  <span>{t("hunter.common.enterToSend")}</span>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER-AKTIONEN */}
          <section className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                onTakeAction(draftText);
                finishWithToast(t("hunter.drawers.signal.toastApplied"));
              }}
              className="w-full py-3 text-white rounded-full text-xs font-bold shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ background: "var(--sherloq-gradient)" }}
            >
              {t("hunter.common.applyReply")} <ArrowUpRight className="w-[14px] h-[14px]" />
            </button>

            <div className="flex gap-2">
              <button onClick={() => finishWithToast(t("hunter.common.edit"))} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">{t("hunter.common.edit")}</button>
              <button onClick={() => finishWithToast(t("hunter.drawers.signal.toastIgnore"))} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">{t("hunter.common.ignore")}</button>
              <button onClick={() => finishWithToast(t("hunter.drawers.signal.toastTask"))} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">{t("hunter.common.createTask")}</button>
            </div>
          </section>
        </main>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
