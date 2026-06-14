/**
 * VollSherloqUsage — „Sherloq Usage"-Karte der Vollansicht (Usage-Tab).
 * Extrahiert aus features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Check, Square, TriangleAlert } from "lucide-react";

export default function VollSherloqUsage() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-8">
        <Square className="w-4 h-4 text-[var(--icon-muted)]" /> SHERLOQ USAGE
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">LAST LOGIN</div>
          <div className="text-[var(--text-primary)] font-bold text-[18px]">vor 2 Std.</div>
        </div>
        <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">LAST USAGE</div>
          <div className="text-[var(--text-primary)] font-bold text-[18px]">Heute</div>
        </div>

        <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">PROFILES ADDED</div>
          <div className="text-[var(--text-primary)] font-bold text-[24px] flex items-baseline gap-2">
            142 <span className="text-[var(--icp-high)] text-[14px]">+12%</span>
          </div>
        </div>
        <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">MESSAGES</div>
          <div className="text-[var(--text-primary)] font-bold text-[24px] flex items-baseline gap-2">
            89 <span className="text-[var(--signal-urgent-text)] text-[14px]">-4%</span>
          </div>
        </div>

        <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">ENRICHMENTS</div>
          <div className="text-[var(--text-primary)] font-bold text-[24px] flex items-baseline gap-2 mb-3">
            <span className="text-[var(--signal-urgent-text)]">8.500</span>
            <span className="text-[var(--text-muted)] text-[16px] font-medium">/ 10k</span>
          </div>
          <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-[var(--signal-urgent-text)] h-full rounded-full" style={{ width: "85%" }}></div>
          </div>
          <div className="text-[var(--signal-urgent-text)] text-[12px] font-semibold flex items-center gap-1">
            85% <TriangleAlert className="w-3 h-3" /> Limit fast erreicht
          </div>
        </div>

        <div className="bg-[var(--app-bg)] rounded-[12px] p-5 flex flex-col justify-between">
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">POSTS GENERIERT</div>
          <div className="text-[var(--text-primary)] font-bold text-[24px] flex items-baseline gap-2">
            12 <span className="text-[var(--icp-high)] text-[14px]">+24%</span>
          </div>
        </div>

        <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">ONBOARDING</div>
          <div className="text-[var(--sherloq-primary)] font-bold text-[18px] flex items-center gap-1.5">
            <Check className="w-5 h-5 stroke-[3]" /> Abgeschlossen
          </div>
        </div>

        <div className="bg-[var(--app-bg)] rounded-[12px] p-5">
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-2">UPSELL SIGNAL</div>
          <div className="text-[var(--text-primary)] font-medium text-[16px]">+1.800 € MRR</div>
        </div>
      </div>
    </div>
  );
}
