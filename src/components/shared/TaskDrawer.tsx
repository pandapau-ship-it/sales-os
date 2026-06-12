import { useState } from "react";
import { X, Mail, Link2, Phone, Video, MessageCircle, AlertTriangle } from "lucide-react";

interface TaskDrawerProps {
  person: any;
  recommendedChannel?: string;
  recommendedTitle?: string;
  recommendedNote?: string;
  onClose: () => void;
  onSave: (taskData: any) => void;
}


export default function TaskDrawer({
  person,
  recommendedChannel = 'LINKEDIN',
  recommendedTitle = 'LinkedIn Intro via aktuellen Post',
  recommendedNote = 'Hi Sarah, starker Post zum Thema Business Development gestern! Euer Ansatz bei CloudSphere deckt sich 1:1 mit dem was wir bei LogixFlow...',
  onClose,
  onSave
}: TaskDrawerProps) {
  const [channel, setChannel] = useState(recommendedChannel);
  const [title, setTitle] = useState(recommendedTitle);
  const [note, setNote] = useState(recommendedNote);
  const [date] = useState("30. Mai 2026");
  const [priority, setPriority] = useState('Medium');

  return (
    <div className="fixed inset-0 bg-[#495057]/20 backdrop-blur-sm z-50 flex justify-end font-sans transition-opacity animate-fade-in pr-2 py-2" onClick={onClose}>
      <div
        className="w-full max-w-[850px] h-full bg-[#FAFAFA] shadow-2xl flex flex-col relative overflow-hidden animate-slide-left rounded-3xl border border-[#E9ECEF]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 bg-white border border-[#E9ECEF] rounded-full hover:bg-gray-50 flex items-center justify-center text-[#868E96] hover:text-[#212529] cursor-pointer transition-all z-20 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-y-auto w-full custom-scrollbar flex flex-col border-none">
          <div className="p-8 pb-6 w-full mx-auto flex flex-col flex-1 pl-12 pt-10">
            
            {/* Header Area (Like CustomerDrawer) */}
            <div className="flex flex-col gap-6 mb-8 pr-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {person.person.avatarUrl ? (
                      <img src={person.person.avatarUrl} alt={person.person.name} className="w-16 h-16 rounded-[20px] object-cover shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-[20px] bg-[#125455] text-white flex items-center justify-center font-sans font-bold text-[22px] shadow-sm">
                        {person.person.initials}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#3B82F6] border-2 border-white rounded-full" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[20px] font-extrabold text-[#212529] font-sans tracking-tight leading-none">{person.person.name}</h2>
                      <div className="bg-[#EBFBEE] text-[#2B8A3E] border border-[#2B8A3E]/20 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide">
                        ICP: {person.icpScore ?? 87}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#495057] text-[13px] mt-2.5">
                      <span className="font-semibold">{person.person.jobTitle}</span>
                      <span className="text-[#ADB5BD]">•</span>
                      <div className="flex items-center gap-1.5">
                        <div className="bg-[#212529] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-[6px] font-bold">
                          {person.person.company.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-[#343A40]">{person.person.company}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right side stats */}
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Status</span>
                    <div className="bg-[#EBFBEE] text-[#2B8A3E] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-bold">
                      <div className="w-2 h-2 rounded-full bg-[#2B8A3E]" style={{ width: '8px', height: '8px' }}></div>
                      Aktiv
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Heat</span>
                    <div className="bg-[#EBFBEE] text-[#2B8A3E] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-bold">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2B8A3E]"></div>
                      Aktiv
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-wider">Stage</span>
                    <div className="bg-white border border-[#E9ECEF] text-[#495057] px-5 py-1.5 rounded-full flex items-center justify-center text-[13px] font-bold shadow-sm">
                      Demo
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info Bar */}
              <div className="bg-white border border-[#E9ECEF] rounded-[24px] py-4 px-6 flex items-center justify-between shadow-[0_2px_10px_rgb(0,0,0,0.02)] w-full">
                <div className="flex items-center gap-2.5 text-[#495057]">
                  <Mail className="w-4 h-4 text-[#ADB5BD]" />
                  <span className="text-[14px] font-semibold">c.brand@logixflow.de</span>
                </div>
                <div className="w-px h-5 bg-[#E9ECEF]"></div>
                <div className="flex items-center gap-2.5 text-[#495057]">
                  <Phone className="w-4 h-4 text-[#ADB5BD]" />
                  <span className="text-[14px] font-semibold">+49 123 456789</span>
                </div>
                <div className="w-px h-5 bg-[#E9ECEF]"></div>
                <div className="flex items-center gap-2.5 text-[#495057]">
                  <Link2 className="w-4 h-4 text-[#ADB5BD]" />
                  <span className="text-[14px] font-semibold">in/max</span>
                </div>
                <div className="w-px h-5 bg-[#E9ECEF]"></div>
                <div className="flex items-center gap-2.5 text-[#495057]">
                  <svg className="w-4 h-4 text-[#ADB5BD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-[14px] font-semibold">firma.com</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 w-full max-w-[600px] mt-2">
                <div className="flex flex-col gap-3">
                    <span className="text-[12px] font-bold text-[#868E96] uppercase tracking-wider">Kanal</span>
                    <div className="flex flex-wrap items-center gap-2">
                    {[
                        { id: 'EMAIL', icon: Mail, label: 'Email', color: 'text-[#0ea5e9]' },
                        { id: 'LINKEDIN', icon: Link2, label: 'LinkedIn', color: 'text-[#0077b5]' },
                        { id: 'CALL', icon: Phone, label: 'Call', color: 'text-[#868E96]' },
                        { id: 'MEETING', icon: Video, label: 'Meeting', color: 'text-[#868E96]' },
                        { id: 'WHATSAPP', icon: MessageCircle, label: 'WhatsApp', color: 'text-[#868E96]' },
                    ].map(c => {
                        const Icon = c.icon;
                        const isSelected = channel === c.id;
                        return (
                        <button
                            key={c.id}
                            onClick={() => setChannel(c.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-[14px] font-semibold transition-all ${
                            isSelected 
                                ? 'border-[#E9ECEF] bg-white text-[#212529] shadow-sm'
                                : 'border-[#E9ECEF] bg-transparent text-[#495057] hover:bg-white hover:shadow-xs'
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${c.color}`} />
                            {c.label}
                        </button>
                        );
                    })}
                    </div>
                </div>

                {/* KI EMPFEHLUNG */}
                <div className="bg-[#ECFEF9] border border-[#A7F3D0] rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-[#047857] font-bold text-[12px] tracking-wider uppercase">
                        <AlertTriangle className="w-4 h-4" /> KI Empfehlung
                    </div>
                    <p className="text-[#047857] text-[14px] font-semibold leading-relaxed">
                        Erster Outreach empfohlen — LinkedIn DM basierend auf Post vom 14. Mai.<br/><br/>
                        Persönlichkeit Gelb: Wähle einen persönlichen, enthusiastischen Einstieg statt einer formellen Mail.
                    </p>
                </div>

                {/* TITEL DER TASK */}
                <div className="flex flex-col gap-3 mt-1">
                    <span className="text-[12px] font-bold text-[#868E96] uppercase tracking-wider">Titel der Task</span>
                    <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-white border border-[#E9ECEF] rounded-xl px-4 py-3.5 text-[#495057] font-medium text-[15px] focus:outline-none focus:border-[#125455] focus:ring-1 focus:ring-[#125455]"
                    />
                </div>

                {/* AI-ENTWURF (OPTIONAL) */}
                <div className="flex flex-col gap-3">
                    <span className="text-[12px] font-bold text-[#868E96] uppercase tracking-wider">AI-Entwurf (Optional)</span>
                    <textarea 
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="w-full bg-white border border-[#E9ECEF] rounded-xl px-4 py-3.5 text-[#495057] text-[15px] min-h-[140px] resize-none focus:outline-none focus:border-[#125455] focus:ring-1 focus:ring-[#125455]"
                    />
                </div>

                {/* BOTTOM ROW: DATE & PRIORITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-0">
                    <div className="flex flex-col gap-3">
                        <span className="text-[12px] font-bold text-[#868E96] uppercase tracking-wider">Fällig am</span>
                        <div className="bg-white border border-[#E9ECEF] rounded-xl px-4 py-3.5 flex items-center gap-3">
                            <span className="text-[#868E96]">📅</span>
                            <span className="text-[#212529] text-[15px] font-bold">{date}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <span className="text-[12px] font-bold text-[#868E96] uppercase tracking-wider">Priorität</span>
                        <div className="bg-[#F1F3F5] rounded-xl p-1 flex items-center">
                            {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 py-3 rounded-lg text-[13px] font-bold transition-all ${
                                        priority === p 
                                        ? 'bg-white text-[#212529] shadow-sm'
                                        : 'text-[#868E96] hover:text-[#495057]'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
          </div>
          
          <div className="pl-12 pr-8 py-5 border-t border-[#E9ECEF] bg-white sticky bottom-0">
             <button 
                onClick={() => onSave({ channel, title, note, date, priority })}
                className="w-full bg-[#125455] hover:bg-[#125455]/95 text-white text-[15px] font-bold py-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
             >
                 Task speichern
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
