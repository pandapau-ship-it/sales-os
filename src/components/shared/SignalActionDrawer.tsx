import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Sparkles, RotateCw, Send, ArrowUpRight, Check } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
}

interface SignalActionDrawerProps {
  /** Offen, wenn gesetzt; null = geschlossen (für Ausfahr-Animation immer gemountet). */
  signal: SignalActionData | null;
  /**
   * Vorbefüllter AI-Entwurf für das Composer-Textarea. Kommt in Phase 3 aus der
   * DB (messages-Tabelle, status='draft', via generate_message()). Ohne Wert →
   * leeres, editierbares Textarea mit Placeholder.
   */
  initialDraft?: string;
  onClose: () => void;
  onApply?: (draft: string) => void;
  onEdit?: () => void;
  onIgnore?: () => void;
  onCreateTask?: () => void;
}

/**
 * SignalActionDrawer — verhält sich EXAKT wie das Kontakt-Panel (CustomerDrawer):
 * gleiche Sheet-Shell (slide-in von rechts, Radix-Overlay/Backdrop, custom-scrollbar,
 * Schließen via X/Backdrop/Escape), nur schmaler (580px statt 850px).
 * Inhalt 1:1 nach Side_Panel_Linkedin_signal.html. Hex → Tokens, Emoji → Lucide,
 * UI-Strings → t() unter hunter.signal_panel.*. Daten ausschließlich über Props.
 */
export default function SignalActionDrawer({
  signal,
  initialDraft,
  onClose,
  onApply,
  onEdit,
  onIgnore,
  onCreateTask,
}: SignalActionDrawerProps) {
  const { t } = useTranslation();

  // Open-State von der Prop; Inhalt aus einer gehaltenen Kopie, damit das Panel
  // während der Ausfahr-Animation (signal→null) nicht leer wird (wie CustomerDrawer).
  const [display, setDisplay] = useState<SignalActionData | null>(signal);
  // Draft kommt als Prop rein (Phase 3: aus DB) — nicht hardcodiert. Ohne Prop leer.
  const [draft, setDraft] = useState(initialDraft ?? "");
  useEffect(() => {
    if (signal) {
      setDisplay(signal);
      setDraft(initialDraft ?? "");
    }
  }, [signal, initialDraft]);

  const [chatInput, setChatInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isOpen = signal !== null;
  const s = display;

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

  const timeProgress = s
    ? Math.max(10, 100 - (s.timeLeftHours / s.windowHours) * 100)
    : 0;

  return (
    <>
      {/* Sheet liefert Overlay/Backdrop, Slide-Animation, Escape & Focus-Trap — wie Kontakt-Panel */}
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="drawer" className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface" style={{ width: 580, maxWidth: "95vw" }}>
          {s && (
            <>
              {/* HEADER */}
              <header className="h-[72px] px-6 border-b border-border flex items-center justify-between shrink-0 bg-app-surface z-30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={s.name} src={s.avatarUrl} size={40} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--signal-success-text)] border-2 border-[var(--surface)] rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-text-primary leading-none">{s.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[9px] font-extrabold tracking-wide">
                        ICP: {s.icpScore}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-text-muted mt-1">{s.company}</p>
                  </div>
                </div>
                <SheetClose asChild>
                  <button className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </SheetClose>
              </header>

              {/* SCROLL-CONTAINER — custom-scrollbar wie Kontakt-Panel */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-app-surface custom-scrollbar">
                {/* SIGNAL-KONTEXT */}
                <section className="space-y-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[10px] font-bold uppercase tracking-wider shrink-0">
                        <LinkedinIcon className="w-[11px] h-[11px]" />
                        {t("hunter.signal_panel.linkedin_signal")}
                      </span>
                      <span className="text-[12px] font-medium text-text-body truncate">{s.actionText}</span>
                    </div>
                    <span className="text-[11px] font-bold text-text-muted shrink-0 whitespace-nowrap">
                      {t("hunter.signal_panel.ago", { label: s.timeAgoLabel })} ·{" "}
                      <span className="text-[var(--signal-urgent-text)] font-extrabold">{t("hunter.signal_panel.hours_left", { hours: s.timeLeftHours })}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-app-bg rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--icp-low)] rounded-full" style={{ width: `${timeProgress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block text-right">
                      {t("hunter.signal_panel.hours_window", { hours: s.windowHours })}
                    </span>
                  </div>

                  {/* KOMMENTAR-BOX (grau) */}
                  {s.commentText && (
                    <div className="p-4 bg-app-bg/80 border border-border rounded-[16px] text-xs text-text-body leading-relaxed font-semibold italic">
                      "{s.commentText}"
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
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[10px] font-extrabold uppercase">
                      {t("hunter.signal_panel.confidence", { n: s.confidence ?? 91 })}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-text-body leading-relaxed">{s.aiRecommendation}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full bg-app-surface border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">{t("hunter.signal_panel.tag_signal_hot")}</span>
                    <span className="px-2.5 py-1 rounded-full bg-app-surface border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">{t("hunter.signal_panel.tag_icp_fits")}</span>
                    <span className="px-2.5 py-1 rounded-full bg-app-surface border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">{t("hunter.signal_panel.tag_channel_flexible")}</span>
                  </div>
                </section>

                {/* AI COMPOSER */}
                <section className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest px-0.5">
                    <span>{t("hunter.signal_panel.ai_composer")}</span>
                    <button onClick={handleRegenerate} className="text-[var(--sherloq-primary)] hover:underline flex items-center gap-1 font-extrabold cursor-pointer">
                      <RotateCw className={`w-[11px] h-[11px] ${isRegenerating ? "animate-spin" : ""}`} />
                      {t("hunter.signal_panel.regenerate")}
                    </button>
                  </div>

                  <div className="bg-app-surface rounded-[18px] border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-[var(--sherloq-primary)] text-on-accent text-[12px] flex items-center justify-between">
                      <div className="flex items-center gap-2 font-extrabold min-w-0">
                        <Sparkles className="w-[13px] h-[13px] fill-current shrink-0" />
                        <span className="truncate">{t("hunter.signal_panel.composer_header", { name: s.name })}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select defaultValue="linkedin_dm">
                          <SelectTrigger className="w-auto h-auto bg-on-accent/15 border-on-accent/15 text-on-accent rounded-lg px-2 py-1 text-[10px] font-bold gap-1 cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linkedin_dm">{t("hunter.signal_panel.channel_linkedin_dm")}</SelectItem>
                            <SelectItem value="email">{t("hunter.signal_panel.channel_email")}</SelectItem>
                            <SelectItem value="call_script">{t("hunter.signal_panel.channel_call_script")}</SelectItem>
                            <SelectItem value="followup_task">{t("hunter.signal_panel.channel_followup_task")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-on-accent/20 px-2 py-1 rounded-lg">{t("hunter.signal_panel.auto_draft")}</span>
                      </div>
                    </div>

                    <div className="bg-[var(--app-bg)] min-h-[320px] p-4 flex flex-col gap-4">
                      <div className="flex items-start gap-2 max-w-[96%]">
                        <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-on-accent flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="w-[14px] h-[14px] fill-current" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">{t("hunter.signal_panel.sherloq_suggestion")}</div>
                          <div className="bg-app-surface border border-border text-text-primary p-4 rounded-2xl rounded-tl-md shadow-sm leading-relaxed">
                            <textarea
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              placeholder={t("hunter.signal_panel.draft_placeholder")}
                              className="w-full min-h-[118px] bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-text-primary placeholder-[var(--text-muted)] border-none scrollbar-none"
                            />
                          </div>
                          <div className="flex justify-between mt-2 px-1 text-[10px] text-text-muted font-bold uppercase">
                            <span>{t("hunter.signal_panel.draft_from_sherloq_today")}</span>
                            <span>{t("hunter.signal_panel.chars_of_300", { count: draft.length })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-app-surface border-t border-border">
                      <div className="flex items-end gap-2 bg-app-bg border border-border rounded-2xl px-3 py-2 focus-within:border-[var(--sherloq-primary)] focus-within:bg-app-surface transition-all">
                        <textarea
                          rows={1}
                          placeholder={t("hunter.signal_panel.instruct_placeholder")}
                          className="flex-1 bg-transparent resize-none outline-none text-[12px] font-medium leading-relaxed text-text-body placeholder-[var(--text-muted)] min-h-[32px] max-h-[96px] scrollbar-none"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                        />
                        <button onClick={handleSend} className="w-8 h-8 rounded-full bg-[var(--sherloq-primary)] hover:opacity-90 text-on-accent flex items-center justify-center shrink-0 transition-opacity cursor-pointer">
                          <Send className="w-[14px] h-[14px]" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-text-muted font-bold">
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
                    className="w-full py-3 text-on-accent rounded-full text-xs font-bold shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ background: "var(--sherloq-gradient)" }}
                  >
                    {t("hunter.signal_panel.apply_reply")} <ArrowUpRight className="w-[14px] h-[14px]" />
                  </button>

                  <div className="flex gap-2">
                    <button onClick={() => actAndClose(t("hunter.signal_panel.toast_edit"), onEdit)} className="flex-1 py-2 bg-app-surface border border-border hover:bg-app-bg text-text-muted rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">{t("hunter.signal_panel.edit")}</button>
                    <button onClick={() => actAndClose(t("hunter.signal_panel.toast_ignore"), onIgnore)} className="flex-1 py-2 bg-app-surface border border-border hover:bg-app-bg text-text-muted rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">{t("hunter.signal_panel.ignore")}</button>
                    <button onClick={() => actAndClose(t("hunter.signal_panel.toast_task"), onCreateTask)} className="flex-1 py-2 bg-app-surface border border-border hover:bg-app-bg text-text-muted rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">{t("hunter.signal_panel.create_task")}</button>
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-inverse-surface text-on-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}
    </>
  );
}
