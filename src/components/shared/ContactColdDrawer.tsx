import { useState } from "react";
import { X, Sparkles, RotateCw, Send, Check } from "lucide-react";

export interface ContactColdDrawerProps {
  person: {
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
  };
  onClose: () => void;
}

export default function ContactColdDrawer({ person, onClose }: ContactColdDrawerProps) {
  const [draftText, setDraftText] = useState("Hi Christian, wollte mich kurz melden — habt ihr das Thema BDR-Effizienz intern weiterverfolgt?");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("LinkedIn");
  const [reminderActive, setReminderActive] = useState(true);

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
      triggerToast("Reaktivierungsnachricht neu generiert ✨");
    }, 700);
  };

  const toggleReminder = () => {
    if (reminderActive) {
      triggerToast("Automatische Erinnerung deaktiviert");
    } else {
      triggerToast("Automatische Erinnerung aktiviert");
    }
    setReminderActive(!reminderActive);
  };

  const setChannel = (channel: string) => {
    setActiveChannel(channel);
    triggerToast(channel + " ausgewählt");
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-4 bottom-4 right-4 w-[580px] bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-[110] animate-slide-in select-none">
        
        {/* HEADER */}
        <header className="h-[78px] px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={person.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"}
                alt={person.name}
                className="w-11 h-11 rounded-full object-cover shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] font-bold text-gray-900 leading-none">
                  {person.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-extrabold tracking-wide">
                  Kalt ❄
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-[9px] font-extrabold tracking-wide">
                  {person.daysInStage}T in Stage ⚠
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-400 mt-1">
                {person.company}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-none">

          {/* BLOCK 1: KALT KONTEXT */}
          <section className="space-y-3">
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
              ❄ Kontakt wird kalt
            </span>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
              <p className="text-[13px] text-blue-800 font-semibold leading-relaxed">
                Letzter Kontakt: {person.lastContactChannel} vor {person.lastContactDays} Tagen · Keine Antwort
              </p>
              <p className="text-[13px] text-blue-800 font-semibold leading-relaxed">
                Letzter Kanal: {person.lastContactChannel} · KI empfiehlt Kanalwechsel
              </p>
            </div>

            <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                Sentiment
              </span>
              <p className="text-[13px] text-gray-700 font-semibold leading-relaxed">
                {person.lastConversationSentiment}
              </p>
            </div>
          </section>

          {/* BLOCK 2: AI EMPFEHLUNG */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#175253] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                AI empfiehlt
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-extrabold border border-emerald-100">
                Confidence {person.confidence}%
              </span>
            </div>

            <div className="p-4 bg-[#f0f6f6] border border-[#c4dbda]/50 rounded-xl space-y-3">
              <p className="text-[13px] text-[#175253] font-bold leading-relaxed">
                {person.aiRecommendation}
              </p>

              <div className="flex gap-2 flex-wrap">
                {person.tags.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-full bg-white border border-[#175253]/10 text-[#175253] text-[10px] font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* BLOCK 3: AI REAKTIVIERUNGS-NACHRICHT */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                AI Reaktivierungs-Nachricht
              </span>
              <button onClick={handleRegenerate} className="text-[11px] font-extrabold text-[#175253] hover:underline flex items-center gap-1 cursor-pointer">
                Neu generieren
                <RotateCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setChannel("LinkedIn")} 
                className={`px-4 py-2 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer ${
                  activeChannel === "LinkedIn" 
                    ? "bg-[#175253] text-white border-[#175253] shadow-[0_2px_8px_rgba(23,82,83,0.12)]" 
                    : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                LinkedIn
              </button>
              <button 
                onClick={() => setChannel("Email")} 
                className={`px-4 py-2 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer ${
                  activeChannel === "Email" 
                    ? "bg-[#175253] text-white border-[#175253] shadow-[0_2px_8px_rgba(23,82,83,0.12)]" 
                    : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                Email
              </button>
            </div>

            <div className="bg-white rounded-[18px] border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-[#0A66C2] text-white text-[12px] flex items-center justify-between">
                <span className="font-extrabold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  LinkedIn Composer
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-lg">
                  Auto Draft
                </span>
              </div>

              <div className="bg-[#F3F6F8] p-4">
                <div className="bg-blue-50 border border-blue-100 text-gray-900 p-4 rounded-2xl rounded-tr-md shadow-sm leading-relaxed">
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    className="w-full h-28 bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-gray-900 border-none scrollbar-none"
                  />
                </div>

                <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-400 font-bold uppercase">
                  <span>Heute · Entwurf von Sherloq</span>
                  <span>{draftText.length}/300</span>
                </div>
              </div>
            </div>
          </section>

          {/* BLOCK 4: FOLLOW-UP REMINDER */}
          <section className="space-y-3">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
              Follow-up Reminder
            </span>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[12px] font-semibold text-gray-700 leading-relaxed">
                  Wenn keine Antwort in
                </label>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    defaultValue="5"
                    min="1"
                    className="w-14 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-center text-[12px] font-extrabold text-gray-900 outline-none focus:border-[#175253]"
                  />
                  <span className="text-[12px] font-bold text-gray-500">Tagen erneut erinnern</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-gray-700">
                  Automatische Erinnerung
                </span>
                <button 
                  onClick={toggleReminder} 
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${reminderActive ? 'bg-[#175253]' : 'bg-gray-200'}`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${reminderActive ? 'translate-x-[20px]' : 'translate-x-0'}`}></span>
                </button>
              </div>
            </div>
          </section>

          {/* BLOCK 5: AKTIONEN */}
          <section className="space-y-2 pt-2">
            <button onClick={() => triggerToast("LinkedIn Nachricht gesendet")} className="w-full py-3 bg-gradient-to-r from-[#175253] to-[#0A66C2] text-white rounded-full text-[13px] font-extrabold shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 cursor-pointer">
              <Send className="w-4 h-4" />
              Auf LinkedIn senden
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => triggerToast("Email-Reaktivierung vorbereitet")} className="py-2.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                Per Email reaktivieren
              </button>
              <button onClick={() => triggerToast("Task erstellt")} className="py-2.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                Task erstellen
              </button>
              <button onClick={() => triggerToast("Gesnoozed")} className="py-2.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                Snooze
              </button>
            </div>
          </section>
        </main>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-gray-950 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
