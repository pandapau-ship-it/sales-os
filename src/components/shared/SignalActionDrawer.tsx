import { useState, useEffect } from "react";
import { X, Link2, Sparkles, RotateCw, Send, ArrowUpRight, Check } from "lucide-react";

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

export default function SignalActionDrawer({ person, onClose, onTakeAction }: SignalActionDrawerProps) {
  const [draftText, setDraftText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userMessages, setUserMessages] = useState<{ text: string; role: "user" | "ai" }[]>([]);

  useEffect(() => {
    // Initial draft based on signal
    if (person.signalType === "comment") {
      setDraftText(`Hi ${person.name.split(" ")[0]}, danke für deinen Kommentar — das Thema Integrationen hören wir gerade häufig von Sales-Teams. Hast du diese Woche 15 Minuten für einen kurzen Austausch?`);
    } else if (person.signalType === "post") {
       setDraftText(`Hi ${person.name.split(" ")[0]}, starker Beitrag zum Thema! Wir sehen bei unseren Kunden ähnliche Herausforderungen. Lasst uns gerne mal austauschen.`);
    } else {
       setDraftText(`Hi ${person.name.split(" ")[0]}, ich habe gesehen, dass du dich für aktuelle Sales-Trends interessierst. Passt es dir nächste Woche für einen kurzen Connect?`);
    }
  }, [person]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setDraftText(`Hi ${person.name.split(" ")[0]}, danke für deinen Kommentar — das Thema Integrationen hören wir gerade häufig von Sales-Teams. Hast du diese Woche 15 Minuten für einen kurzen Austausch?`);
      setIsRegenerating(false);
      triggerToast("AI-Entwurf neu generiert ✨");
    }, 700);
  };

  const handleSendInstruction = () => {
    if (!chatInput.trim()) return;
    
    setUserMessages([...userMessages, { text: chatInput, role: "user" }]);
    
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
      setUserMessages(prev => [...prev, { text: "Klar — ich passe den Entwurf entsprechend an. Du kannst auch schreiben: 'Mach es kürzer', 'als E-Mail', 'förmlicher' oder 'mit konkretem CTA'.", role: "ai" }]);
      triggerToast("Anweisung an AI übernommen");
    }, 500);
    
    setChatInput("");
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-4 bottom-4 right-4 w-[620px] bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-[110] animate-slide-in select-none">
        <header className="h-[72px] px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-30">
          <div className="flex items-center gap-3">
            <div className="relative">
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
              ) : (
                <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shadow-sm ${person.avatarBg || "bg-[#2B8A3E]"}`}>
                  {person.avatarInitials}
                </div>
              )}
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
          {/* Signal Header Section */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-1 rounded-full bg-[#E6F1FB] text-[#0C447C] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <Link2 className="w-[11px] h-[11px]" />
                  LinkedIn Signal
                </span>
                <span className="text-[12px] font-medium text-gray-800 truncate">{person.actionText}</span>
              </div>
              <span className="text-[11px] font-bold text-gray-400 shrink-0">
                vor {person.timeAgoLabel} · <span className="text-red-600 font-extrabold">{person.timeLeftHours}h left</span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.max(10, 100 - (person.timeLeftHours / person.windowHours) * 100)}%` }} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-right">
                {person.windowHours}h window
              </span>
            </div>

            {person.commentText && (
              <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-[16px] text-xs text-gray-700 leading-relaxed font-semibold italic">
                "{person.commentText}"
              </div>
            )}
          </section>

          {/* AI Recommendation Section */}
          <section className="bg-[#f0f6f6] border border-[#c4dbda]/50 p-4 rounded-[16px] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#175253] uppercase tracking-widest">
                <Sparkles className="w-[13px] h-[13px]" />
                AI empfiehlt
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">Confidence 91%</span>
            </div>
            <p className="text-[13px] font-medium text-gray-700 leading-relaxed">
              {person.aiRecommendation}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white border border-[#175253]/10 text-[#175253] text-[10px] font-bold">Signal heiß</span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-[#175253]/10 text-[#175253] text-[10px] font-bold">ICP passt</span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-[#175253]/10 text-[#175253] text-[10px] font-bold">Kanal flexibel</span>
            </div>
          </section>

          {/* Composer Section */}
          <section className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">
              <span>AI Composer</span>
              <button onClick={handleRegenerate} className="text-[#175253] hover:underline flex items-center gap-1 font-extrabold cursor-pointer">
                <RotateCw className={`w-[11px] h-[11px] ${isRegenerating ? "animate-spin" : ""}`} />
                Neu generieren
              </button>
            </div>

            <div className="bg-white rounded-[18px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-[#175253] text-white text-[12px] flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold">
                  <Sparkles className="w-[13px] h-[13px] fill-current" />
                  Antwort-Vorschlag · {person.name}
                </div>
                <div className="flex items-center gap-2">
                  <select className="bg-white/15 border border-white/15 text-white rounded-lg px-2 py-1 text-[10px] font-bold outline-none cursor-pointer">
                    <option className="text-gray-900">LinkedIn DM</option>
                    <option className="text-gray-900">E-Mail</option>
                    <option className="text-gray-900">Call-Skript</option>
                    <option className="text-gray-900">Follow-up Task</option>
                  </select>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-lg">Auto Draft</span>
                </div>
              </div>

              <div className="bg-[#F3F6F8] min-h-[320px] p-4 flex flex-col gap-4">
                <div className="flex items-start gap-2 max-w-[96%]">
                  <div className="w-7 h-7 rounded-full bg-[#175253] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-[14px] h-[14px] fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Sherloq AI · Vorschlag</div>
                    <div className="bg-white border border-gray-200 text-gray-900 p-4 rounded-2xl rounded-tl-md shadow-sm leading-relaxed">
                      <textarea 
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        className="w-full min-h-[118px] bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-gray-900 border-none scrollbar-none"
                      />
                    </div>
                    <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-400 font-bold uppercase">
                      <span>Heute · Entwurf von Sherloq</span>
                      <span>{draftText.length}/300 Zeichen</span>
                    </div>
                  </div>
                </div>

                {userMessages.map((msg, idx) => (
                  <div key={idx} className={`${msg.role === "user" ? "self-end max-w-[82%]" : "flex items-start gap-2 max-w-[96%]"}`}>
                    {msg.role === "user" ? (
                      <>
                        <div className="mb-1 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Du</div>
                        <div className="bg-[#E8F3FF] border border-blue-100 text-gray-900 p-3 rounded-2xl rounded-tr-md shadow-sm text-[13px] font-medium leading-relaxed">
                          {msg.text}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-[#175253] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="w-[14px] h-[14px] fill-current" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Sherloq AI</div>
                          <div className="bg-white border border-gray-200 text-gray-900 p-3 rounded-2xl rounded-tl-md shadow-sm text-[13px] font-medium leading-relaxed">
                            {msg.text}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 flex-within focus-within:border-[#175253] focus-within:bg-white transition-all">
                  <textarea 
                    rows={1} 
                    placeholder="Sag der AI, was angepasst werden soll, z. B. 'Schreib mir daraus eine E-Mail'..." 
                    className="flex-1 bg-transparent resize-none outline-none text-[12px] font-medium leading-relaxed text-gray-800 placeholder-gray-400 min-h-[32px] max-h-[96px] scrollbar-none"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendInstruction();
                      }
                    }}
                  />
                  <button onClick={handleSendInstruction} className="w-8 h-8 rounded-full bg-[#175253] hover:bg-[#124040] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer" title="An AI senden">
                    <Send className="w-[14px] h-[14px]" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-gray-400 font-bold">
                  <span>AI kann Kanal, Tonalität, Länge und CTA anpassen.</span>
                  <span>Enter zum Senden</span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2.5 pt-2">
            <button 
              onClick={() => {
                onTakeAction(draftText);
                onClose();
              }}
              className="w-full py-3 bg-gradient-to-r from-[#175253] to-[#3f8383] hover:from-[#124040] hover:to-[#2e6262] text-white rounded-full text-xs font-bold shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Antwort übernehmen <ArrowUpRight className="w-[14px] h-[14px]" />
            </button>

            <div className="flex gap-2">
              <button onClick={() => triggerToast("Bearbeiten gestartet")} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">Bearbeiten</button>
              <button onClick={() => triggerToast("Signal ignoriert")} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">Ignorieren</button>
              <button onClick={() => triggerToast("Task erstellt")} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">Task erstellen</button>
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
