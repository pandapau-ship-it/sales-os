import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

const STAGES_DATA = [
  {
    id: 'discovery',
    name: 'DISCOVERY',
    deals: 12,
    value: '€ 84k',
    barHeight: 120, // Proportional to deals count
    gradient: 'linear-gradient(to bottom, var(--sherloq-primary), var(--sherloq-primary))',
    isWon: false,
    avgDays: 4,
    avgValue: '€ 7.000',
    conversionRate: null, // No previous stage
  },
  {
    id: 'demo',
    name: 'DEMO',
    deals: 8,
    value: '€ 142k',
    barHeight: 80,
    gradient: 'linear-gradient(to bottom, var(--sherloq-primary), var(--sherloq-primary))',
    isWon: false,
    avgDays: 6,
    avgValue: '€ 17.750',
    conversionRate: 67,
  },
  {
    id: 'proposal',
    name: 'PROPOSAL',
    deals: 5,
    value: '€ 98k',
    barHeight: 50,
    gradient: 'linear-gradient(to bottom, var(--sherloq-primary), var(--sherloq-primary))',
    isWon: false,
    avgDays: 10,
    avgValue: '€ 19.600',
    conversionRate: 63,
  },
  {
    id: 'negotiation',
    name: 'NEGOTIATION',
    deals: 3,
    value: '€ 61k',
    barHeight: 30,
    gradient: 'linear-gradient(to bottom, var(--sherloq-primary), var(--sherloq-primary))',
    isWon: false,
    avgDays: 14,
    avgValue: '€ 20.333',
    conversionRate: 50,
  },
  {
    id: 'closed_won',
    name: 'CLOSED WON',
    deals: 2,
    value: '€ 45k',
    barHeight: 20,
    gradient: 'linear-gradient(to bottom, var(--icp-high), var(--icp-high))',
    isWon: true,
    avgDays: 5,
    avgValue: '€ 22.500',
    conversionRate: 40,
  }
];

export default function FunnelAnalysis() {
  const { t } = useTranslation();
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const getConversionColorClass = (rate: number | null) => {
    if (rate === null) return '';
    if (rate >= 60) return 'text-[var(--icp-high)] bg-[var(--signal-success-bg)] border-[var(--icp-high)]/15'; // Green
    if (rate >= 40) return 'text-[var(--icp-medium)] bg-[var(--signal-warn-bg)] border-[var(--icp-medium)]/15'; // Amber
    return 'text-[var(--icp-low)] bg-[var(--signal-urgent-bg)] border-[var(--icp-low)]/15'; // Red
  };

  return (
    <div className="font-sans antialiased select-none mt-2 w-full">      
      <div className="w-full bg-app-surface rounded-[16px] p-7 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)]">
        
        {/* Header Sektion */}
        <div className="mb-8">
          <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest leading-none">
            {t('hunter.funnel.header')}
          </span>
        </div>

        {/* Main Flow Container */}
        <div className="relative flex items-end justify-between w-full h-[220px]">
          
          {/* Feste Baseline am Boden auf der alle Balken wachsen */}
          <div className="absolute bottom-[30px] left-0 right-0 h-[1.5px] bg-[var(--border-subtle)] z-0"></div>

          {/* Mapping Stage Columns & Connectors */}
          {STAGES_DATA.map((stage, idx) => {
            const isHovered = hoveredStage === idx;

            return (
              <React.Fragment key={stage.id}>
                {/* STUFEN-SPALTE (Säule) */}
                <div 
                  className="flex flex-col items-center w-[84px] h-full relative"
                  onMouseEnter={() => setHoveredStage(idx)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  {/* Floating Tooltip above the bar context on hover */}
                  <div className={`absolute -top-10 bg-inverse-surface text-on-accent text-[11px] font-medium py-1.5 px-3 rounded-[12px] shadow-lg z-30 whitespace-nowrap transition-all duration-200 pointer-events-none ${
                    isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'
                  }`}>
                    <div className="flex flex-col items-center text-center">
                      <span className="font-semibold">{t('hunter.funnel.avgDaysInStage', { days: stage.avgDays })}</span>
                      <span className="text-text-muted text-[10px] mt-0.5 font-medium">{t('hunter.funnel.avgDealValue', { value: stage.avgValue })}</span>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="w-2.5 h-2.5 bg-inverse-surface rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 z-20"></div>
                  </div>

                  {/* Deals Count & Currency Value */}
                  <div className="text-center h-[48px] flex flex-col justify-end pb-2.5">
                    <span className="text-[14px] font-bold text-[var(--text-primary)] leading-none">
                      {t('hunter.funnel.deals', { count: stage.deals })}
                    </span>
                    <span className="text-[12px] font-semibold text-[var(--text-muted)] mt-1.5 leading-none">
                      {stage.value}
                    </span>
                  </div>
                  
                  {/* Bar Box */}
                  <div className="h-[120px] w-[56px] flex flex-col justify-end items-center relative z-10 mb-[30px]">
                    {/* Checkmark icon for CLOSED WON (Placed exactly above the bar) */}
                    {stage.isWon && (
                      <div className="text-[var(--icp-high)] flex items-center justify-center mb-1 absolute" style={{ bottom: `${stage.barHeight + 4}px` }}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                    
                    {/* The Bar with vertical top-rounded gradient */}
                    <div 
                      className={`w-[56px] rounded-t-[8px] transition-all duration-200 cursor-pointer ${
                        isHovered ? 'brightness-110 scale-x-105' : ''
                      }`}
                      style={{ 
                        height: `${stage.barHeight}px`,
                        background: stage.gradient
                      }}
                    />
                  </div>
                  
                  {/* Stage Title */}
                  <div className="absolute bottom-0 text-center w-full">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block leading-none py-1">
                      {stage.name}
                    </span>
                  </div>
                </div>

                {/* INTERMEDIATE INLINE CONNECTOR (Arrow + Conversion Rate) */}
                {idx < STAGES_DATA.length - 1 && (
                  <div className="flex flex-col items-center justify-center h-[120px] mb-[30px] w-[60px] shrink-0 relative z-10 select-none">
                    {/* Smooth minimalistic arrow */}
                    <span className="text-[12px] text-[var(--border-strong)] font-extrabold">→</span>
                    {/* Inline-Badge for conversion rate */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1.5 ${getConversionColorClass(STAGES_DATA[idx + 1].conversionRate)}`}>
                      {STAGES_DATA[idx + 1].conversionRate}%
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}

        </div>

      </div>
    </div>
  );
}
