import { useState, useEffect } from "react";
import { X, Clock, Sparkles, RotateCw, Send, Check } from "lucide-react";

interface PipelineStagnatedDrawerProps {
  person: {
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
  };
  onClose: () => void;
  onTakeAction: (text: string) => void;
}

export default function PipelineStagnatedDrawer({ person, onClose, onTakeAction }: PipelineStagnatedDrawerProps) {
  const [draftText, setDraftText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userMessages, setUserMessages] = useState<{ text: string; role: "user" | "ai" }[]>([]);

  useEffect(() => {
    setDraftText(`Hi ${person.name.split(" ")[0]}, wollte kurz nachfassen — wie war der interne Stand nach unserem Demo?`);
  }, [person]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setDraftText(`Hi ${person.name.split(" ")[0]}, danke nochmal für die Demo. Mich interessiert, ob das Thema intern weiter priorisiert wird — hast du diese Woche 15 Minuten für einen kurzen Abgleich?`);
      setIsRegenerating(false);
      triggerToast("AI-Entwurf neu generiert ");
    }, 700);
  };

  const handleSendInstruction = () => {
    if (!chatInput.trim()) return;
    
    setUserMessages([...userMessages, { text: chatInput, role: "user" }]);
    
    const lowered = chatInput.toLowerCase();
    let newDraft = draftText;
    
    if (lowered.includes("e-mail") || lowered.includes("email")) {
      newDraft = `Betreff: Kurzer Abgleich nach unserer Demo\n\nHallo ${person.name.split(" ").pop()},\n\nich wollte kurz nachfassen, wie der interne Stand nach unserer Demo ist. Gibt es diese Woche ein gutes Zeitfenster für einen kurzen Austausch?\n\nViele Grüße`;
    } else if (lowered.includes("kürzer") || lowered.includes("kurz")) {
      newDraft = `Hi ${person.name.split(" ")[0]}, wie ist der interne Stand nach unserer Demo? Hast du diese Woche 15 Min für einen kurzen Abgleich?`;
    } else if (lowered.includes("förmlicher")) {
      newDraft = `Hallo Herr/Frau ${person.name.split(" ").pop()}, ich wollte mich erkundigen, wie der interne Stand nach unserer Demo ist. Hätten Sie diese Woche 15 Minuten für einen kurzen Austausch?`;
    }
    
    setTimeout(() => {
      setDraftText(newDraft);
      setUserMessages(prev => [...prev, { text: "Klar — ich passe den Entwurf entsprechend an. Du kannst z. B. schreiben: 'kürzer', 'förmlicher', 'als E-Mail' oder 'mit konkretem CTA'.", role: "ai" }]);
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
      <div className="fixed top-4 bottom-4 right-4 w-[580px] bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-[110] animate-slide-in select-none">
        
        <header className="h-[70px] px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={person.avatarUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
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

          {/* Alert Section */}
          <section className="space-y-2">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Deal stagniert
            </span>
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-800 font-medium leading-relaxed">
              Kein Fortschritt seit {person.daysStagnated} Tagen in Stage {person.stageName}. Letzter Kontakt: Email vor {person.lastContactDays}T, keine Antwort.
              <div className="mt-2 text-[11px] font-bold opacity-80">ARR: {person.arr} · Probability: {person.probability}</div>
            </div>
          </section>

          {/* AI Recommendation Section */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--sherloq-primary)] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> AI empfiehlt
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100">
                Confidence {person.confidence}%
              </span>
            </div>
            <div className="p-4 bg-[var(--signal-teal-bg)] border border-[var(--signal-teal-bg)]/50 rounded-xl space-y-3">
              <p className="text-[13px] text-[var(--sherloq-primary)] font-medium leading-relaxed">
                {person.aiRecommendation}
              </p>
              <div className="text-[11px] text-[var(--sherloq-primary)]/70 font-semibold italic">
                “{person.aiInsight}”
              </div>
              <div className="flex gap-2 flex-wrap">
                {person.tags.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-full bg-white border border-[var(--sherloq-primary)]/10 text-[var(--sherloq-primary)] text-[10px] font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Composer Section */}
          <section className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>KI Antwort-Entwurf</span>
              <button onClick={handleRegenerate} className="text-[var(--sherloq-primary)] hover:underline flex items-center gap-1 font-extrabold cursor-pointer">
                <RotateCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} /> Neu generieren
              </button>
            </div>

            <div className="bg-white rounded-[18px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-[var(--sherloq-primary)] text-white text-[12px] flex items-center justify-between">
                <span className="font-extrabold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> AI Composer · Antwort-Vorschlag
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-lg">Auto Draft</span>
              </div>

              <div className="bg-[var(--border-subtle)] min-h-[430px] p-4 flex flex-col gap-4">
                <div className="flex items-start gap-2 max-w-[96%]">
                  <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Sherloq AI · Vorschlag</div>
                    <div className="bg-white border border-gray-200 text-gray-900 p-4 rounded-2xl rounded-tl-md shadow-sm leading-relaxed">
                      <textarea 
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        className="w-full min-h-[220px] bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-gray-900 border-none scrollbar-none"
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
                        <div className="bg-[var(--signal-info-bg)] border border-blue-100 text-gray-900 p-3 rounded-2xl rounded-tr-md shadow-sm text-[13px] font-medium leading-relaxed">
                          {msg.text}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
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
                <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-[var(--sherloq-primary)] focus-within:bg-white transition-all">
                  <textarea 
                    rows={1} 
                    placeholder="Sag der AI, was angepasst werden soll..." 
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
                  <button onClick={handleSendInstruction} className="w-8 h-8 rounded-full bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-gray-400 font-bold">
                  <span>AI kann Tonalität, Länge, Kanal und CTA anpassen.</span>
                  <span>Enter zum Senden</span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2 pt-2">
            <button 
              onClick={() => {
                onTakeAction(draftText);
                onClose();
              }}
              className="w-full py-3 bg-gradient-to-r from-[var(--sherloq-primary)] to-[var(--sherloq-primary)] text-white rounded-full text-[13px] font-bold shadow-md hover:scale-[1.01] transition-transform cursor-pointer"
            >
              Antwort übernehmen
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => triggerToast("Nur senden")} className="py-2.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">Nur senden</button>
              <button onClick={() => triggerToast("Stage wechseln")} className="py-2.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">Stage wechseln</button>
              <button onClick={() => triggerToast("Task erstellt")} className="py-2.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">Task erstellen</button>
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
