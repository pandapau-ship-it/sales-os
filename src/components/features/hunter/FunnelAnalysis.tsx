import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

/** Eine Funnel-Stufe = echte Aggregate aus deals × pipeline_stages (im Screen berechnet). */
export type FunnelStage = {
  slug: string;
  name: string;        // Anzeigename aus settings.pipeline_stages
  deals: number;       // Anzahl Deals in dieser Stage
  valueLabel: string;  // formatierte €-Summe der Stage (z.B. „€ 84.000")
  avgValueLabel?: string; // optionaler Ø-Wert/Deal (Hover) — ehrliches Aggregat
  isWon: boolean;      // 'gewonnen' → grüne Säule + Häkchen
};

/**
 * FunnelAnalysis — Pipeline-Stufen als Säulen: Deals-Anzahl + €-Summe pro Stage.
 * Datengetrieben (`stages` aus echten Deals nach Stage gruppiert; Reihenfolge/Namen
 * aus settings.pipeline_stages). Säulenhöhe ∝ Deal-Anzahl. KEINE Übergangs-Prozente
 * und KEIN Ø-Tage-in-Stage (brauchen historische Übergangs-/Verweildaten → deferred,
 * PROGRESS B5/[D4]). Hover zeigt — falls vorhanden — den Ø-Wert/Deal.
 */
export default function FunnelAnalysis({ stages }: { stages: FunnelStage[] }) {
  const { t } = useTranslation();
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const maxDeals = Math.max(1, ...stages.map((s) => s.deals));
  const MAX_BAR = 120; // px
  const MIN_BAR = 6;   // px — sichtbarer Sockel auch bei 0 Deals

  return (
    <div className="font-sans antialiased select-none mt-2 w-full">
      <div className="w-full bg-app-surface rounded-[16px] p-7 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)]">
        {/* Header */}
        <div className="mb-8">
          <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest leading-none">
            {t('hunter.funnel.header')}
          </span>
        </div>

        {/* Flow */}
        <div className="relative flex items-end justify-between w-full h-[220px]">
          <div className="absolute bottom-[30px] left-0 right-0 h-[1.5px] bg-[var(--border-subtle)] z-0"></div>

          {stages.map((stage, idx) => {
            const isHovered = hoveredStage === idx;
            const barHeight = stage.deals > 0 ? Math.max(MIN_BAR, (stage.deals / maxDeals) * MAX_BAR) : MIN_BAR;

            return (
              <React.Fragment key={stage.slug}>
                <div
                  className="flex flex-col items-center flex-1 min-w-[64px] h-full relative"
                  onMouseEnter={() => setHoveredStage(idx)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  {/* Ø-Wert-Tooltip (nur wenn vorhanden) */}
                  {stage.avgValueLabel && (
                    <div className={`absolute -top-8 bg-inverse-surface text-on-accent text-[11px] font-medium py-1.5 px-3 rounded-[12px] shadow-lg z-30 whitespace-nowrap transition-all duration-200 pointer-events-none ${
                      isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'
                    }`}>
                      {t('hunter.funnel.avgDealValue', { value: stage.avgValueLabel })}
                      <div className="w-2.5 h-2.5 bg-inverse-surface rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 z-20"></div>
                    </div>
                  )}

                  {/* Deals-Anzahl + €-Summe */}
                  <div className="text-center h-[48px] flex flex-col justify-end pb-2.5">
                    <span className="text-[14px] font-bold text-[var(--text-primary)] leading-none">
                      {t('hunter.funnel.deals', { count: stage.deals })}
                    </span>
                    <span className="text-[12px] font-semibold text-[var(--text-muted)] mt-1.5 leading-none">
                      {stage.valueLabel}
                    </span>
                  </div>

                  {/* Säule */}
                  <div className="h-[120px] w-[56px] flex flex-col justify-end items-center relative z-10 mb-[30px]">
                    {stage.isWon && (
                      <div className="text-[var(--icp-high)] flex items-center justify-center mb-1 absolute" style={{ bottom: `${barHeight + 4}px` }}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                    <div
                      className={`w-[56px] rounded-t-[8px] transition-all duration-200 cursor-pointer ${isHovered ? 'brightness-110 scale-x-105' : ''}`}
                      style={{
                        height: `${barHeight}px`,
                        background: stage.isWon ? 'var(--icp-high)' : 'var(--sherloq-primary)',
                      }}
                    />
                  </div>

                  {/* Stage-Name */}
                  <div className="absolute bottom-0 text-center w-full">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block leading-none py-1">
                      {stage.name}
                    </span>
                  </div>
                </div>

                {/* Schlichter Connector (Pfeil, OHNE Übergangs-% — Historie fehlt) */}
                {idx < stages.length - 1 && (
                  <div className="flex items-center justify-center h-[120px] mb-[30px] w-[40px] shrink-0 relative z-10 select-none">
                    <span className="text-[12px] text-[var(--border-strong)] font-extrabold">→</span>
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
