import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Sparkles, RotateCw, Send, ArrowUpRight, Check } from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

/** Reine Daten von außen — das Panel hält keinen eigenen Datenzustand. */
export interface SignalActionData {
  name: string;
  company: string;
  avatarUrl?: string;
  icpScore: number;
  actionText: string;
  timeAgoLabel: string;
  timeLeftHours: number;
  windowHours: number;
  commentText?: string;
  aiRecommendation: string;
  confidence?: number;
  draft: string;
}

interface SignalActionDrawerProps {
  signal: SignalActionData;
  onClose: () => void;
  onApply?: (draft: string) => void;
  onEdit?: () => void;
  onIgnore?: () => void;
  onCreateTask?: () => void;
}

/**
 * SignalActionDrawer — 1:1 nach Side_Panel_Linkedin_signal.html.
 * 580px · schließt NUR via X (kein Backdrop-Close) · jede Aktion → Toast + Auto-Close.
 * Daten kommen ausschließlich über `signal`-Props; lokal nur der editierbare
 * Draft-Puffer + UI-State (Chat-Input, Toast). Hex → Tokens, Emoji → Lucide, UI → t().
 */
export default function SignalActionDrawer({
  signal,
  onClose,
  onApply,
  onEdit,
  onIgnore,
  onCreateTask,
}: SignalActionDrawerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(signal.draft);
  const [chatInput, setChatInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const timeProgress = Math.max(
    10,
    100 - (signal.timeLeftHours / signal.windowHours) * 100,
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  /** Aktion: Toast zeigen, Panel automatisch schließen. */
  const actAndClose = (msg: string, action?: () => void) => {
    action?.();
    showToast(msg);
    setTimeout(() => onClose(), 1100);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      showToast(t("hunter.signal_panel.toast_regenerated"));
    }, 700);
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setChatInput("");
    showToast(t("hunter.signal_panel.toast_instruction"));
  };

  return (
    <>
      {/* Backdrop — schließt NICHT (nur X-Button) */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity" />

      <div className="fixed top-4 bottom-4 right-4 w-[580px] bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-[110] animate-slide-in select-none">
        {/* HEADER */}
        <header className="h-[72px] px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar name={signal.name} src={signal.avatarUrl} size={40} />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-gray-900 leading-none">{signal.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-extrabold tracking-wide">
                  ICP: {signal.icpScore}
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-400 mt-1">{signal.company}</p>
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
                  {t("hunter.signal_panel.linkedin_signal")}
                </span>
                <span className="text-[12px] font-medium text-gray-800 truncate">{signal.actionText}</span>
              </div>
              <span className="text-[11px] font-bold text-gray-400 shrink-0 whitespace-nowrap">
                {t("hunter.signal_panel.ago", { label: signal.timeAgoLabel })} ·{" "}
                <span className="text-red-600 font-extrabold">{t("hunter.signal_panel.hours_left", { hours: signal.timeLeftHours })}</span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--icp-low)] rounded-full" style={{ width: `${timeProgress}%` }} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-right">
                {t("hunter.signal_panel.hours_window", { hours: signal.windowHours })}
              </span>
            </div>

            {/* KOMMENTAR-BOX (grau) */}
            {signal.commentText && (
              <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-[16px] text-xs text-gray-700 leading-relaxed font-semibold italic">
                "{signal.commentText}"
              </div>
            )}
          </section>

          {/* AI EMPFIEHLT (teal) */}
          <section className="bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)] p-4 rounded-[16px] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black text-[var(--sherloq-primary)] uppercase tracking-widest">
                <Sparkles className="w-[13px] h-[13px]" />
                {t("hunter.signal_panel.ai_recommends")}
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                {t("hunter.signal_panel.confidence", { n: signal.confidence ?? 91 })}
              </span>
            </div>
            <p className="text-[13px] font-medium text-gray-700 leading-relaxed">{signal.aiRecommendation}</p>
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">{t("hunter.signal_panel.tag_signal_hot")}</span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">{t("hunter.signal_panel.tag_icp_fits")}</span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">{t("hunter.signal_panel.tag_channel_flexible")}</span>
            </div>
          </section>

          {/* AI COMPOSER */}
          <section className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">
              <span>{t("hunter.signal_panel.ai_composer")}</span>
              <button onClick={handleRegenerate} className="text-[var(--sherloq-primary)] hover:underline flex items-center gap-1 font-extrabold cursor-pointer">
                <RotateCw className={`w-[11px] h-[11px] ${isRegenerating ? "animate-spin" : ""}`} />
                {t("hunter.signal_panel.regenerate")}
              </button>
            </div>

            <div className="bg-white rounded-[18px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-[var(--sherloq-primary)] text-white text-[12px] flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold min-w-0">
                  <Sparkles className="w-[13px] h-[13px] fill-current shrink-0" />
                  <span className="truncate">{t("hunter.signal_panel.composer_header", { name: signal.name })}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select className="bg-white/15 border border-white/15 text-white rounded-lg px-2 py-1 text-[10px] font-bold outline-none cursor-pointer">
                    <option className="text-gray-900">{t("hunter.signal_panel.channel_linkedin_dm")}</option>
                    <option className="text-gray-900">{t("hunter.signal_panel.channel_email")}</option>
                    <option className="text-gray-900">{t("hunter.signal_panel.channel_call_script")}</option>
                    <option className="text-gray-900">{t("hunter.signal_panel.channel_followup_task")}</option>
                  </select>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-lg">{t("hunter.signal_panel.auto_draft")}</span>
                </div>
              </div>

              <div className="bg-[var(--app-bg)] min-h-[320px] p-4 flex flex-col gap-4">
                <div className="flex items-start gap-2 max-w-[96%]">
                  <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-[14px] h-[14px] fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("hunter.signal_panel.sherloq_suggestion")}</div>
                    <div className="bg-white border border-gray-200 text-gray-900 p-4 rounded-2xl rounded-tl-md shadow-sm leading-relaxed">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full min-h-[118px] bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-gray-900 border-none scrollbar-none"
                      />
                    </div>
                    <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-400 font-bold uppercase">
                      <span>{t("hunter.signal_panel.draft_from_sherloq_today")}</span>
                      <span>{t("hunter.signal_panel.chars_of_300", { count: draft.length })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-[var(--sherloq-primary)] focus-within:bg-white transition-all">
                  <textarea
                    rows={1}
                    placeholder={t("hunter.signal_panel.instruct_placeholder")}
                    className="flex-1 bg-transparent resize-none outline-none text-[12px] font-medium leading-relaxed text-gray-800 placeholder-gray-400 min-h-[32px] max-h-[96px] scrollbar-none"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button onClick={handleSend} className="w-8 h-8 rounded-full bg-[var(--sherloq-primary)] hover:opacity-90 text-white flex items-center justify-center shrink-0 transition-opacity cursor-pointer">
                    <Send className="w-[14px] h-[14px]" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-gray-400 font-bold">
                  <span>{t("hunter.signal_panel.ai_hint")}</span>
                  <span>{t("hunter.signal_panel.enter_to_send")}</span>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER-AKTIONEN */}
          <section className="space-y-2.5 pt-2">
            <button
              onClick={() => actAndClose(t("hunter.signal_panel.toast_applied"), () => onApply?.(draft))}
              className="w-full py-3 text-white rounded-full text-xs font-bold shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ background: "var(--sherloq-gradient)" }}
            >
              {t("hunter.signal_panel.apply_reply")} <ArrowUpRight className="w-[14px] h-[14px]" />
            </button>

            <div className="flex gap-2">
              <button onClick={() => actAndClose(t("hunter.signal_panel.toast_edit"), onEdit)} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">{t("hunter.signal_panel.edit")}</button>
              <button onClick={() => actAndClose(t("hunter.signal_panel.toast_ignore"), onIgnore)} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">{t("hunter.signal_panel.ignore")}</button>
              <button onClick={() => actAndClose(t("hunter.signal_panel.toast_task"), onCreateTask)} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">{t("hunter.signal_panel.create_task")}</button>
            </div>
          </section>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}
    </>
  );
}
