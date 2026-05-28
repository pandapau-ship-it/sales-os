import React, { useState } from 'react';

interface TooltipData {
  channel: string;
  date: string;
  sentiment: string;
  preview: string;
}

interface Touchpoint {
  id: string;
  type: string;
  label: string;
  dateStr: string;
  tooltip: TooltipData;
  isPast: boolean;
}

interface CommunicationChainProps {
  personId: string;
  onSelectCommunication?: (personId: string, tpId: string) => void;
}

const getIconImage = (type: string, isPast: boolean) => {
  const grayscaleClass = isPast ? '' : 'grayscale opacity-40';
  const sizeClass = "w-[28px] h-[28px] object-contain"; 
  
  switch (type) {
    case 'LINKEDIN': 
      return <img src="/LinkedIn_icon.png" alt="LinkedIn" className={`${sizeClass} ${grayscaleClass}`} />;
    case 'EMAIL': 
      return <img src="/microsoft-outlook-2025.jpg" alt="Email" className={`${sizeClass} ${grayscaleClass}`} />;
    case 'VIDEO':
    case 'MEETING':
    case 'PHONE':
    case 'DOC':
    default: 
      return <img src="/teams.jpeg" alt="Teams" className={`${sizeClass} ${grayscaleClass}`} />;
  }
};

const getSentimentColor = (sentiment: string) => {
  if (sentiment.toLowerCase().includes('positiv')) return 'text-green-600 font-semibold';
  if (sentiment.toLowerCase().includes('negativ')) return 'text-red-600 font-semibold';
  return 'text-gray-600';
}

function generateChainForPerson(id: string): Touchpoint[] {
  // Simple seed based on string to generate consistent random chain
  let seed = 0;
  for (let i = 0; i < id.length; i++) {
    seed += id.charCodeAt(i);
  }
  
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const channelTypes = ['LINKEDIN', 'EMAIL', 'VIDEO', 'PHONE', 'MEETING', 'DOC'];
  const labels: Record<string, string> = {
    'LINKEDIN': 'LinkedIn',
    'EMAIL': 'Email',
    'VIDEO': 'Demo',
    'PHONE': 'Call',
    'MEETING': 'Meeting',
    'DOC': 'Angebot'
  };

  const sentimentOptions = ['Positiv', 'Neutral', 'Interessiert', 'Wartend', 'Abwartend'];
  
  const numItems = Math.floor(random() * 4) + 4; // 4 to 7 items
  const chain: Touchpoint[] = [];
  
  let daysAgo = Math.floor(random() * 30) + 15;

  for (let i = 0; i < numItems; i++) {
    const isPast = i < numItems - 2; // last two are future
    const typeIdx = Math.floor(random() * channelTypes.length);
    const type = channelTypes[typeIdx];
    
    // allow repeats
    const nextTypeIdx = Math.floor(random() * channelTypes.length);
    const finalType = (random() > 0.8 && i > 0) ? chain[i-1].type : type; 

    // Time logic
    if (isPast) {
      daysAgo -= Math.floor(random() * 5) + 1;
      if (daysAgo < 1) daysAgo = 1;
    }
    
    const dateStr = isPast ? `vor ${daysAgo}T` : (i === numItems - 2 ? 'offen' : 'geplant');
    const tooltipDate = isPast ? `vor ${daysAgo} Tagen` : (i === numItems - 2 ? 'Ausstehend' : 'in Planung');
    const sentiment = isPast ? sentimentOptions[Math.floor(random() * sentimentOptions.length)] : 'Ausstehend';
    
    chain.push({
      id: `${id}-${i}`,
      type: finalType,
      label: labels[finalType],
      dateStr,
      isPast,
      tooltip: {
        channel: labels[finalType],
        date: tooltipDate,
        sentiment,
        preview: isPast ? 'Kurzer Austausch via ' + labels[finalType] : 'Geplante Aktion'
      }
    });
  }
  
  return chain;
}

export default function CommunicationChain({ personId, onSelectCommunication }: CommunicationChainProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const chain = generateChainForPerson(personId);

  return (
    <div className="w-full mt-4 bg-[#F8F9FA] rounded-[24px] p-6 border border-[#E9ECEF]">
      <div className="text-[11px] font-bold font-mono text-[#868E96] uppercase tracking-wider mb-10 text-center">
        Kommunikationskette — Hover für Details
      </div>
      
      <div className="relative flex justify-between items-start w-full px-2 md:px-10 mt-4">
        {/* Continuous horizontal line */}
        <div className="absolute left-[43px] md:left-[75px] right-[43px] md:right-[75px] top-[24px] z-0">
          <div className="w-full h-[2px] bg-[#E9ECEF]" />
          <div 
            className="absolute left-0 top-0 h-[2px] bg-[#36D1A1] transition-all" 
            style={{ width: `${(chain.filter(c => c.isPast).length - 1) / (chain.length - 1) * 100}%` }}
          />
        </div>

        {chain.map((tp, idx) => {
          return (
            <div 
              key={tp.id} 
              className="relative flex flex-col items-center cursor-pointer group w-[70px] z-10"
              onMouseEnter={() => setHoveredId(tp.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectCommunication?.(personId, tp.id)}
            >
              {/* Icon container with white circle taking precedence and a fake gap via shadow */}
              <div className="relative group/icon mb-2 w-full flex justify-center">
                <div className={`w-[46px] h-[46px] bg-white rounded-full flex items-center justify-center transition-transform group-hover:scale-110 z-10 shadow-[0_0_0_6px_#F8F9FA] relative
                 ${hoveredId === tp.id ? 'ring-2 ring-[#36D1A1]/30' : ''}`}
                >
                  {getIconImage(tp.type, tp.isPast)}
                </div>
                
                {/* Status dot for the most recent past event */}
                {tp.isPast && idx === chain.filter(c => c.isPast).length - 1 && (
                  <div className="absolute top-0 right-[4px] w-3 h-3 bg-[#36D1A1] border-2 border-white rounded-full z-20 group-hover:scale-110 transition-transform" />
                )}
              </div>
              
              <span className={`text-[12px] mt-1 font-bold ${tp.isPast ? 'text-[#343A40]' : 'text-[#ADB5BD]'} text-center leading-tight`}>
                {tp.label}
              </span>
              <span className="text-[11px] text-[#ADB5BD] mt-0.5">
                {tp.dateStr}
              </span>

              {/* Tooltip */}
              {hoveredId === tp.id && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-white border border-[#E9ECEF] shadow-[0_10px_30px_rgb(0,0,0,0.1)] rounded-xl p-3 z-50 animate-fade-in text-left">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[11px] font-bold text-[#125455] font-mono">{tp.tooltip.channel}</span>
                     <span className="text-[10px] text-[#868E96]">{tp.tooltip.date}</span>
                   </div>
                   <div className="text-[12px] text-[#495057] mb-1">
                     Sentiment: <span className={getSentimentColor(tp.tooltip.sentiment)}>{tp.tooltip.sentiment}</span>
                   </div>
                   <div className="text-[11px] text-[#868E96] leading-snug line-clamp-2">
                     {tp.tooltip.preview}
                   </div>
                   {/* Tooltip triangle */}
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-[#E9ECEF] rotate-45" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
