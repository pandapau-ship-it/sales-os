import { useState } from 'react';
import { 
  Calendar, Clock, Check, Bot,
  UserCheck, ArrowUpRight, RotateCw
} from 'lucide-react';

// --- Helper: Circular ICP Score Ring ---
const ICPProgressRing = ({ score }: { score: number }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  let color = "stroke-emerald-500 text-emerald-700";
  let bg = "stroke-emerald-100";
  
  if (score < 75) { 
    color = "stroke-amber-500 text-amber-700"; 
    bg = "stroke-amber-100"; 
  }
  if (score < 50) { 
    color = "stroke-red-500 text-red-700"; 
    bg = "stroke-red-100"; 
  }

  return (
    <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={radius} fill="none" className={bg} strokeWidth="3.5" />
        <circle 
          cx="18" cy="18" r={radius} fill="none" 
          className={color.split(" ")[0]} strokeWidth="3.5"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-[11px] font-extrabold ${color.split(" ")[1]}`}>
        {score}
      </span>
    </div>
  );
};

export default function NewInPipelineCards({ onSelectLead }: { onSelectLead: (lead: any) => void }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const leads = [
    {
      id: 'l1',
      name: "Sarah Jenkins",
      title: "VP Sales EMEA",
      company: "Atrium GmbH",
      initials: "A",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      score: 92,
      stage: "Demo",
      heat: "Aktiv",
      heatColor: "bg-emerald-50 text-emerald-700 border-emerald-150",
      heatDot: "bg-emerald-500",
      days: "vor 2 Tagen",
      source: "Via AI SDR · Termin gebucht",
      sourceType: "ai_sdr",
      prepStatus: "ready",
      meetingText: "Demo · 12. Juni · 14:00",
      btnText: "Meeting-Prep ansehen →",
      btnType: "primary"
    },
    {
      id: 'l2',
      name: "Marcus Müller",
      title: "Head of Business Development",
      company: "LogixFlow GmbH",
      initials: "L",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      score: 68,
      stage: "Discovery",
      heat: "Warm",
      heatColor: "bg-amber-50 text-amber-700 border-amber-150",
      heatDot: "bg-amber-500",
      days: "vor 3 Tagen",
      source: "Via AI SDR · Termin gebucht",
      sourceType: "ai_sdr",
      prepStatus: "loading",
      meetingText: "Discovery · 14. Juni · 10:30",
      btnText: "Meeting-Prep generieren",
      btnType: "secondary_glow"
    },
    {
      id: 'l3',
      name: "Elena Rostova",
      title: "RevOps Specialist",
      company: "Quantum Dynamics",
      initials: "Q",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      score: 45,
      stage: "Proposal",
      heat: "Kalt",
      heatColor: "bg-blue-50 text-blue-700 border-blue-150",
      heatDot: "bg-blue-500",
      days: "vor 5 Tagen",
      source: "Manuell hinzugefügt",
      sourceType: "manual",
      prepStatus: "none",
      meetingText: null,
      btnText: "Termin vereinbaren →",
      btnType: "primary"
    }
  ];

  return (
    <div className="font-sans antialiased text-[var(--text-primary)]">
      <div className="max-w-[1040px] space-y-8">
        
        {/* Header Section */}
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hunter &gt; Pipeline</span>
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 leading-tight">
            Neu in Pipeline
          </h1>
          <p className="text-[13px] text-gray-400 font-medium">
            3 neu qualifizierte Leads verlangen nach deiner Interaktion.
          </p>
        </header>

        {/* Dynamic Cards List */}
        <section className="space-y-6">
          {leads.map(lead => (
            <div 
              key={lead.id} 
              className="bg-white rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] border border-gray-100/50 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-200/50"
            >
              {/* LINE 1: Lead Info */}
              <div className="px-6 pt-6 pb-4 flex items-center justify-between flex-wrap gap-4">
                
                {/* Left Side Profile Details */}
                <div className="flex items-center gap-4 min-w-[280px]">
                  <div className="relative shrink-0">
                    <img src={lead.avatar} alt={lead.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900 leading-tight">{lead.name}</h3>
                    <p className="text-[12px] font-medium text-gray-400 mt-1">{lead.title}</p>
                  </div>
                </div>

                {/* Score & Badges Row */}
                <div className="flex items-center gap-6 flex-wrap">
                  
                  {/* ICP Progress Ring */}
                  <ICPProgressRing score={lead.score} />

                  {/* Company Badge (Dark Pill) */}
                  <div className="flex items-center gap-2 bg-[var(--text-primary)] text-white pl-1.5 pr-3 py-1.5 rounded-full shrink-0 shadow-sm">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-extrabold">
                      {lead.initials}
                    </div>
                    <span className="text-[12px] font-semibold">{lead.company}</span>
                  </div>

                  {/* Stage Badge (Neutral Outline) */}
                  <div>
                    <div className="px-3 py-1 rounded-full border border-gray-200 text-gray-500 text-[12px] font-bold bg-gray-50/50">
                      {lead.stage}
                    </div>
                  </div>

                  {/* Heat Badge */}
                  <div>
                    <div className={`px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1.5 border ${lead.heatColor}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${lead.heatDot}`}></div>
                      {lead.heat}
                    </div>
                  </div>

                  {/* Days Info & Arrow */}
                  <div className="flex items-center gap-4 ml-2">
                    <div className="text-right">
                      <p className="text-[12px] font-bold text-gray-900 leading-none">{lead.days}</p>
                      <span className="text-[11px] text-gray-400 font-semibold mt-1 inline-block">Neu in Pipeline</span>
                    </div>

                    <button 
                      onClick={() => onSelectLead({ ...lead, type: 'lead' })}
                      className="w-10 h-10 rounded-full bg-[var(--signal-teal-bg)] hover:bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] flex items-center justify-center transition-colors border border-transparent shadow-sm"
                    >
                      <ArrowUpRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                </div>

              </div>

              {/* LINE 2: Note / Vermerk (Light Grey Offset) */}
              <div className="bg-gray-50/80 border-t border-gray-150/40 px-6 py-3 flex items-center justify-between flex-wrap gap-4">
                
                {/* Source & Status text details */}
                <div className="flex items-center gap-2.5 text-[12.5px] font-semibold text-gray-500 flex-wrap">
                  
                  {/* Origin Icon */}
                  <div className="flex items-center gap-1.5">
                    {lead.sourceType === 'ai_sdr' ? (
                      <Bot size={15} className="text-[var(--sherloq-primary)]" />
                    ) : (
                      <UserCheck size={15} className="text-gray-500" />
                    )}
                    <span className="text-gray-800">{lead.source}</span>
                  </div>

                  {/* Separator Dot */}
                  <span className="text-gray-300">•</span>

                  {/* Prep Status */}
                  {lead.prepStatus !== 'none' && (
                    <div className="flex items-center gap-1.5">
                      {lead.prepStatus === 'ready' ? (
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                          <span>Meeting-Prep bereit</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <Clock size={14} className="text-amber-500 shrink-0 animate-spin" strokeWidth={2.5} />
                          <span>Meeting-Prep wird generiert</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Appointment detail block */}
                  {lead.meetingText && (
                    <div className="flex items-center gap-2 bg-[var(--signal-teal-bg)] border border-[var(--sherloq-primary)]/10 px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--sherloq-primary)] ml-2 shrink-0">
                      <Calendar size={13} className="shrink-0" />
                      <span>{lead.meetingText}</span>
                    </div>
                  )}

                </div>

                {/* Primary Action Button */}
                <div className="shrink-0">
                  {lead.btnType === 'primary' ? (
                    <button 
                      onClick={() => triggerToast(`Aktion ausgeführt: ${lead.btnText}`)}
                      className="px-4 py-1.5 bg-[var(--sherloq-primary)] hover:bg-[var(--sherloq-primary)] text-white rounded-full text-[11px] font-black transition-colors shadow-sm"
                    >
                      {lead.btnText}
                    </button>
                  ) : (
                    <button 
                      onClick={() => triggerToast(`Meeting-Prep wird gestartet...`)}
                      className="px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-[11px] font-black transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <RotateCw size={11} className="animate-spin text-[var(--sherloq-primary)]" />
                      {lead.btnText}
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))}
        </section>

      </div>

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-950 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={14} className="text-emerald-400" strokeWidth={3} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
