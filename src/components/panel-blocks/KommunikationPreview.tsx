/**
 * KommunikationPreview — Vorschau der letzten Touchpoints (Marken-Kanal-Logos).
 * Extrahiert aus shared/HunterSidepanel.tsx.
 */
import BrandLogo from "@/components/shared/BrandLogo";

export default function KommunikationPreview({ onShowAll }: { onShowAll?: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="typo-section-label text-text-muted flex items-center gap-2">
          Kommunikation
          <span className="px-1.5 py-0.5 bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] text-[8px] font-extrabold rounded-md uppercase">klickbar</span>
        </span>
        <button onClick={onShowAll} className="text-[11px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer">Alle anzeigen →</button>
      </div>
      <div className="bg-app-surface rounded-[12px] p-5 border border-[var(--border-card)] divide-y divide-[var(--border-subtle)]">
        <div className="py-3 first:pt-0">
          <div className="flex items-start gap-4">
            <BrandLogo name="teams" className="w-11 h-11 shrink-0 rounded-[12px] shadow-sm" tile />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="typo-card-title text-text-primary leading-tight">Discovery Call &amp; Demo</h4>
                <span className="text-[11px] font-medium text-text-muted">vor 5 Tagen</span>
              </div>
              <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">Kunde zeigte starkes Interesse an Feature Y, Budget-Freeze bis Q3 angesprochen...</p>
            </div>
          </div>
        </div>
        <div className="py-3 last:pb-0">
          <div className="flex items-start gap-4">
            <BrandLogo name="outlook" className="w-11 h-11 shrink-0 rounded-[12px] shadow-sm" tile />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="typo-card-title text-text-primary leading-tight">Angebot gesendet: ROI-Dokument</h4>
                <span className="text-[11px] font-medium text-text-muted">vor 8 Tagen</span>
              </div>
              <p className="text-[12px] text-text-muted font-medium leading-relaxed truncate mt-1">Hallo Max, anbei wie besprochen das ROI-Dokument für Sherloq Enterprise...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
