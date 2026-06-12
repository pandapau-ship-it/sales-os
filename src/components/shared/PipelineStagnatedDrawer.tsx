import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Clock, Sparkles, RotateCw, Send, Check } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import Avatar from "@/components/shared/Avatar";

interface StagnatedPerson {
  name: string;
  company: string;
  avatarUrl?: string;
  icpScore: number;
  daysStagnated: number;
  stageName: string;
  lastContactDays: number;
  arr: string;
  probability: string;
  aiRecommendation: string;
  aiInsight: string;
  tags: string[];
  confidence: number;
}

interface PipelineStagnatedDrawerProps {
  /** Offen, wenn gesetzt; null = geschlossen (für Ausfahr-Animation immer gemountet). */
  person: StagnatedPerson | null;
  onClose: () => void;
  onTakeAction: (text: string) => void;
}

/**
 * PipelineStagnatedDrawer — gleiche Sheet-Shell wie Kontakt- & Signal-Panel
 * (slide-in von rechts, Radix-Overlay/Backdrop, custom-scrollbar, X/Backdrop/Escape),
 * Breite 580px. Inhalt/Design unverändert.
 */
// Kanonische Stages (Spec §3.2). Kommen später aus settings.pipeline_stages —
// bis zum DB-Wiring dokumentierter Fallback.
const PIPELINE_STAGES = ["Backlog", "Demo vereinbart", "Follow-up offen", "Onboarding offen", "Free Trial", "Gewonnen"];

/** Nächste Stage relativ zur aktuellen (lockerer Präfix-Match auf den Anzeigenamen). */
function nextStageFor(current: string): string {
  const idx = PIPELINE_STAGES.findIndex((s) => s.toLowerCase().startsWith(current.trim().toLowerCase()));
  if (idx >= 0 && idx < PIPELINE_STAGES.length - 1) return PIPELINE_STAGES[idx + 1];
  return PIPELINE_STAGES[Math.min(Math.max(idx, 0) + 1, PIPELINE_STAGES.length - 1)];
}

export default function PipelineStagnatedDrawer({ person, onClose, onTakeAction }: PipelineStagnatedDrawerProps) {
  const { t } = useTranslation();

  // Inhalt aus gehaltener Kopie, damit das Panel während der Ausfahr-Animation gefüllt bleibt.
  const [display, setDisplay] = useState<StagnatedPerson | null>(person);
  const [draftText, setDraftText] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  useEffect(() => {
    if (person) {
      setDisplay(person);
      setDraftText(`Hi ${person.name.split(" ")[0]}, wollte kurz nachfassen — wie war der interne Stand nach unserem Demo?`);
      setSelectedStage(nextStageFor(person.stageName));
    }
  }, [person]);

  const [chatInput, setChatInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userMessages, setUserMessages] = useState<{ text: string; role: "user" | "ai" }[]>([]);

  const isOpen = person !== null;
  const s = display;
  const firstName = s?.name.split(" ")[0] ?? "";
  const lastName = s?.name.split(" ").pop() ?? "";

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  /** Aktion ausführen → Toast → Panel automatisch schließen (Action-Panel-Verhalten §22.2). */
  const actAndClose = (msg: string, extra?: () => void) => {
    extra?.();
    triggerToast(msg);
    setTimeout(() => onClose(), 1100);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setDraftText(`Hi ${firstName}, danke nochmal für die Demo. Mich interessiert, ob das Thema intern weiter priorisiert wird — hast du diese Woche 15 Minuten für einen kurzen Abgleich?`);
      setIsRegenerating(false);
      triggerToast(t('hunter.common.draftNeuGeneriert'));
    }, 700);
  };

  const handleSendInstruction = () => {
    if (!chatInput.trim()) return;

    setUserMessages([...userMessages, { text: chatInput, role: "user" }]);

    const lowered = chatInput.toLowerCase();
    let newDraft = draftText;

    if (lowered.includes("e-mail") || lowered.includes("email")) {
      newDraft = `Betreff: Kurzer Abgleich nach unserer Demo\n\nHallo ${lastName},\n\nich wollte kurz nachfassen, wie der interne Stand nach unserer Demo ist. Gibt es diese Woche ein gutes Zeitfenster für einen kurzen Austausch?\n\nViele Grüße`;
    } else if (lowered.includes("kürzer") || lowered.includes("kurz")) {
      newDraft = `Hi ${firstName}, wie ist der interne Stand nach unserer Demo? Hast du diese Woche 15 Min für einen kurzen Abgleich?`;
    } else if (lowered.includes("förmlicher")) {
      newDraft = `Hallo Herr/Frau ${lastName}, ich wollte mich erkundigen, wie der interne Stand nach unserer Demo ist. Hätten Sie diese Woche 15 Minuten für einen kurzen Austausch?`;
    }

    setTimeout(() => {
      setDraftText(newDraft);
      setUserMessages(prev => [...prev, { text: "Klar — ich passe den Entwurf entsprechend an. Du kannst z. B. schreiben: 'kürzer', 'förmlicher', 'als E-Mail' oder 'mit konkretem CTA'.", role: "ai" }]);
      triggerToast(t('hunter.common.instructionApplied'));
    }, 500);

    setChatInput("");
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent side="drawer" className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface" style={{ width: 580, maxWidth: "95vw" }}>
          {s && (
            <>
              <header className="h-[70px] px-6 border-b border-border flex items-center justify-between shrink-0 bg-app-surface z-30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={s.name} src={s.avatarUrl} size={40} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--signal-success-text)] border-2 border-[var(--surface)] rounded-full"></span>
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

              {/* SCROLLABLE CONTENT — custom-scrollbar wie Kontakt-Panel */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-app-surface custom-scrollbar">

                {/* Alert Section */}
                <section className="space-y-2">
                  <span className="text-[10px] font-bold text-[var(--signal-urgent-text)] uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {t('hunter.drawers.stagnated.dealStagnated')}
                  </span>
                  <div className="p-4 bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] rounded-xl text-[13px] text-[var(--signal-urgent-text)] font-medium leading-relaxed">
                    {t('hunter.drawers.stagnated.context', { days: s.daysStagnated, stage: s.stageName, lastContactDays: s.lastContactDays })}
                    <div className="mt-2 text-[11px] font-bold opacity-80">{t('hunter.drawers.stagnated.arrProbability', { arr: s.arr, probability: s.probability })}</div>
                  </div>
                </section>

                {/* AI Recommendation Section */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--sherloq-primary)] uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> {t('hunter.common.aiRecommends')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[9px] font-bold border border-[var(--signal-success-bg)]">
                      {t('hunter.common.confidence', { n: s.confidence })}
                    </span>
                  </div>
                  <div className="p-4 bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)]/50 rounded-xl space-y-3">
                    <p className="text-[13px] text-[var(--sherloq-primary)] font-medium leading-relaxed">
                      {s.aiRecommendation}
                    </p>
                    <div className="text-[11px] text-[var(--sherloq-primary)]/70 font-semibold italic">
                      “{s.aiInsight}”
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {s.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full bg-app-surface border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Stage wechseln zu — Pills (nächste Stage vorausgewählt) §4.2 */}
                <section className="space-y-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">
                    {t('hunter.drawers.stagnated.changeStageTo')}
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {PIPELINE_STAGES.map((stage) => (
                      <button
                        key={stage}
                        onClick={() => setSelectedStage(stage)}
                        className={`px-3.5 py-2 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer ${
                          selectedStage === stage
                            ? 'bg-[var(--sherloq-primary)] text-on-accent border-[var(--sherloq-primary)] shadow-[0_2px_8px_rgba(23,82,83,0.12)]'
                            : 'bg-app-surface border-border text-text-muted hover:border-border-strong'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Composer Section */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    <span>{t('hunter.drawers.stagnated.kiAntwortEntwurf')}</span>
                    <button onClick={handleRegenerate} className="text-[var(--sherloq-primary)] hover:underline flex items-center gap-1 font-extrabold cursor-pointer">
                      <RotateCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} /> {t('hunter.common.regenerate')}
                    </button>
                  </div>

                  <div className="bg-app-surface rounded-[18px] border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-[var(--sherloq-primary)] text-on-accent text-[12px] flex items-center justify-between">
                      <span className="font-extrabold flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 fill-current" /> {t('hunter.drawers.stagnated.composerHeader')}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-on-accent/20 px-2 py-1 rounded-lg">{t('hunter.common.autoDraft')}</span>
                    </div>

                    <div className="bg-[var(--border-subtle)] min-h-[430px] p-4 flex flex-col gap-4">
                      <div className="flex items-start gap-2 max-w-[96%]">
                        <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-on-accent flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('hunter.common.sherloqSuggestion')}</div>
                          <div className="bg-app-surface border border-border text-text-primary p-4 rounded-2xl rounded-tl-md shadow-sm leading-relaxed">
                            <textarea
                              value={draftText}
                              onChange={(e) => setDraftText(e.target.value)}
                              className="w-full min-h-[220px] bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-text-primary border-none scrollbar-none"
                            />
                          </div>
                          <div className="flex justify-between mt-2 px-1 text-[10px] text-text-muted font-bold uppercase">
                            <span>{t('hunter.common.draftFromSherloqToday')}</span>
                            <span>{t('hunter.common.charsOf300', { count: draftText.length })}</span>
                          </div>
                        </div>
                      </div>

                      {userMessages.map((msg, idx) => (
                        <div key={idx} className={`${msg.role === "user" ? "self-end max-w-[82%]" : "flex items-start gap-2 max-w-[96%]"}`}>
                          {msg.role === "user" ? (
                            <>
                              <div className="mb-1 text-right text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('hunter.common.you')}</div>
                              <div className="bg-[var(--signal-info-bg)] border border-[var(--signal-info-bg)] text-text-primary p-3 rounded-2xl rounded-tr-md shadow-sm text-[13px] font-medium leading-relaxed">
                                {msg.text}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-on-accent flex items-center justify-center shrink-0 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                              </div>
                              <div className="flex-1">
                                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('hunter.common.sherloqAi')}</div>
                                <div className="bg-app-surface border border-border text-text-primary p-3 rounded-2xl rounded-tl-md shadow-sm text-[13px] font-medium leading-relaxed">
                                  {msg.text}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-app-surface border-t border-border">
                      <div className="flex items-end gap-2 bg-app-bg border border-border rounded-2xl px-3 py-2 focus-within:border-[var(--sherloq-primary)] focus-within:bg-app-surface transition-all">
                        <textarea
                          rows={1}
                          placeholder={t('hunter.common.instructAiPlaceholder')}
                          className="flex-1 bg-transparent resize-none outline-none text-[12px] font-medium leading-relaxed text-text-body placeholder-[var(--text-muted)] min-h-[32px] max-h-[96px] scrollbar-none"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendInstruction();
                            }
                          }}
                        />
                        <button onClick={handleSendInstruction} className="w-8 h-8 rounded-full bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)] text-on-accent flex items-center justify-center shrink-0 transition-colors cursor-pointer">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-text-muted font-bold">
                        <span>{t('hunter.drawers.stagnated.aiHint')}</span>
                        <span>{t('hunter.common.enterToSend')}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-2 pt-2">
                  <button
                    onClick={() => actAndClose(t('hunter.drawers.stagnated.toastSavedStageChanged', { stage: selectedStage }), () => onTakeAction(draftText))}
                    className="w-full py-3 text-on-accent rounded-full text-[13px] font-bold shadow-md hover:scale-[1.01] transition-transform cursor-pointer"
                    style={{ background: "var(--sherloq-gradient)" }}
                  >
                    {t('hunter.drawers.stagnated.saveAndChangeStage')}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => actAndClose(t('hunter.drawers.stagnated.toastTaskSaved'))} className="py-2.5 bg-app-surface border border-border rounded-full text-[11px] font-bold text-text-body hover:bg-app-bg cursor-pointer transition-colors">{t('hunter.drawers.stagnated.onlySaveTask')}</button>
                    <button onClick={() => actAndClose(t('hunter.drawers.stagnated.toastIgnored'))} className="py-2.5 bg-app-surface border border-border rounded-full text-[11px] font-bold text-text-body hover:bg-app-bg cursor-pointer transition-colors">{t('hunter.common.ignore')}</button>
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-inverse-surface text-on-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
