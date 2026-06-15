/**
 * KommunikationVerlauf — voller Kommunikations-Tab (820px-Panel + Vollansicht):
 * Touchpoints mit Marken-Kanal-Logo, aufklappbarem Volltext (Chevron). Expand-State intern.
 * Kanonischer Stand aus features/hunter/HunterSidepanel.tsx (≠ KommunikationPreview = Übersicht-Vorschau).
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import BrandLogo from "@/components/shared/BrandLogo";

export default function KommunikationVerlauf() {
  const [expandedComm, setExpandedComm] = useState<Record<number, boolean>>({});
  const toggleComm = (index: number) => {
    setExpandedComm((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest">
          Kommunikationsverlauf
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[9px] font-extrabold uppercase">
          Klickbar
        </span>
      </div>

      <div className="bg-app-surface rounded-[12px] p-5 border border-border shadow-sm divide-y divide-[var(--border-subtle)]">

        {/* Comm Item 1 */}
        <div className="py-3.5 first:pt-0 cursor-pointer group select-none" onClick={() => toggleComm(0)}>
          <div className="flex items-start gap-4">
            <BrandLogo name="teams" className="w-11 h-11 shrink-0 rounded-[12px] shadow-sm" tile />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[14px] font-bold text-text-primary leading-tight group-hover:text-[var(--sherloq-primary)] transition-colors">
                  Discovery Call & Demo
                </h4>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-text-muted">vor 5 Tagen</span>
                  <ChevronDown className={`w-4 h-4 text-icon-muted transition-transform duration-200 ${expandedComm[0] ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">
                Kunde zeigte starkes Interesse an Feature Y, Budget-Freeze bis Q3 angesprochen...
              </p>

              {expandedComm[0] && (
                <div className="mt-3 p-4 bg-app-bg border border-border rounded-xl space-y-2 text-[12px] text-text-body leading-relaxed italic shadow-inner animate-fade-in">
                  <p><strong className="not-italic text-[var(--sherloq-primary)] font-bold">Max:</strong> "Wir suchen vor allem ein Tool, das sich nahtlos in unsere HubSpot-Pipeline einfügt."</p>
                  <p><strong className="not-italic text-text-primary font-bold">Du:</strong> "Perfekt, genau darauf ist Sherloq spezialisiert. Ich zeige dir kurz den Live-Sync."</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comm Item 2 */}
        <div className="py-3.5 cursor-pointer group select-none" onClick={() => toggleComm(1)}>
          <div className="flex items-start gap-4">
            <BrandLogo name="outlook" className="w-11 h-11 shrink-0 rounded-[12px] shadow-sm" tile />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[14px] font-bold text-text-primary leading-tight group-hover:text-[var(--sherloq-primary)] transition-colors">
                  Angebot gesendet: ROI-Dokument
                </h4>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-text-muted">vor 8 Tagen</span>
                  <ChevronDown className={`w-4 h-4 text-icon-muted transition-transform duration-200 ${expandedComm[1] ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">
                Hallo Max, anbei wie besprochen das ROI-Dokument für Sherloq Enterprise...
              </p>
              {expandedComm[1] && (
                <div className="mt-3 p-4 bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] rounded-xl space-y-2 text-[12px] leading-relaxed shadow-inner animate-fade-in">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--signal-warn-text)] block">Vollständige E-Mail</span>
                  <p className="text-[var(--signal-warn-text)] font-medium italic">"Hallo Herr Brand, anbei finden Sie das besprochene ROI-Szenario für Ihr 8-köpfiges BDR-Team..."</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comm Item 3 */}
        <div className="py-3.5 last:pb-0 cursor-pointer group select-none" onClick={() => toggleComm(2)}>
          <div className="flex items-start gap-4">
            <BrandLogo name="linkedin" className="w-11 h-11 shrink-0 rounded-[12px] shadow-sm" tile />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[14px] font-bold text-text-primary leading-tight group-hover:text-[var(--sherloq-primary)] transition-colors">
                  LinkedIn Nachricht
                </h4>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-text-muted">vor 12 Tagen</span>
                  <ChevronDown className={`w-4 h-4 text-icon-muted transition-transform duration-200 ${expandedComm[2] ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">
                Danke für die Vernetzung, Max. Klasse was ihr bei PayGuard aufbaut...
              </p>
              {expandedComm[2] && (
                <div className="mt-3 p-4 bg-app-bg border border-border rounded-xl text-[12px] text-text-body leading-relaxed italic shadow-inner animate-fade-in">
                  "Hi Christian, danke für die Vernetzung! Ich verfolge eure Updates schon eine Weile. Lass uns bald mal kurz quatschen."
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
