/**
 * VollLetzteKommunikation — „Letzte Kommunikation"-Karte der Vollansicht (Übersicht).
 * Extrahiert aus features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { ChevronRight, RefreshCw, Square } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

export default function VollLetzteKommunikation() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-[var(--icon-muted)]" /> LETZTE KOMMUNIKATION
        </h2>
        <button className="flex items-center gap-2 text-[var(--text-primary)] text-[13px] font-semibold hover:text-[var(--sherloq-primary)] transition-colors">
          Alle <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="relative pl-6 border-l-2 border-[var(--border)] flex flex-col gap-8 pb-4 ml-6">
        {/* Item 1 */}
        <div className="relative">
          <div className="absolute -left-[45px] top-0 w-[42px] h-[42px] rounded-xl bg-[var(--signal-info-bg)] flex items-center justify-center text-[var(--signal-info-text)]">
            <LinkedinIcon className="w-5 h-5 fill-current" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[var(--text-primary)] text-[16px]">LinkedIn Nachricht</span>
                <span className="bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Inbound</span>
              </div>
              <p className="text-[var(--text-body)] text-[15px] mt-2 mb-3 max-w-[90%]">
                Danke für die Vernetzung, Max. Klasse was ihr bei PayGuard aufbaut!
              </p>
              <span className="bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[12px] font-semibold px-2.5 py-1 rounded-full">Positiv</span>
            </div>
            <span className="text-sm font-medium text-[var(--text-muted)]">vor 2h</span>
          </div>
        </div>
        {/* Item 2 */}
        <div className="relative">
          <div className="absolute -left-[45px] top-0 w-[42px] h-[42px] rounded-xl bg-[var(--app-bg)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-body)]">
            <Square className="w-5 h-5" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[var(--text-primary)] text-[16px]">Discovery Call & Demo</span>
                <span className="bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Inbound</span>
              </div>
              <p className="text-[var(--text-body)] text-[15px] mt-2 mb-3 max-w-[90%]">
                Starkes Interesse an Feature Y, Budget-Freeze bis Q3 angesprochen.
              </p>
              <span className="bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[12px] font-semibold px-2.5 py-1 rounded-full">Positiv</span>
            </div>
            <span className="text-sm font-medium text-[var(--text-muted)]">vor 5 Tagen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
