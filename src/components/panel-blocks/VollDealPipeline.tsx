/**
 * VollDealPipeline — „Deal & Pipeline"-Karte der Vollansicht (Deal-Tab).
 * Extrahiert aus features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Square } from "lucide-react";

const stats = [
  { value: "24.000 €", label: "ARR" },
  { value: "2.000 €", label: "MRR" },
  { value: "12 Mo.", label: "LAUFZEIT" },
  { value: "24.000 €", label: "DEAL VOL." },
  { value: "75%", label: "PROBABILITY" },
  { value: "0 €", label: "ONE-OFF" },
];

export default function VollDealPipeline() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2">
          <Square className="w-4 h-4 text-[var(--icon-muted)]" /> DEAL & PIPELINE
        </h2>
        <button className="flex items-center gap-1.5 text-[var(--sherloq-primary)] text-[14px] font-bold hover:opacity-80">
          <Square className="w-4 h-4" /> Bearbeiten
        </button>
      </div>

      {/* Stepper / Funnel */}
      <div className="mb-4">
        <div className="flex w-full mb-2">
          {["Backlog", "Demo", "Follow-up", "Proposal", "Won"].map((step, idx) => (
            <div
              key={step}
              className={`flex-1 text-center text-[15px] pb-3 border-b-[3px] ${
                idx === 1
                  ? "text-[var(--sherloq-primary)] border-[var(--sherloq-primary)] font-bold"
                  : idx === 0
                  ? "text-[var(--sherloq-primary)] border-[var(--sherloq-primary)] font-medium"
                  : "text-[var(--text-muted)] border-[var(--border)] font-medium"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="w-full bg-[var(--app-bg)] rounded h-8 mb-4 border border-[var(--border)] flex items-center px-4">
          <Square className="w-3.5 h-3.5 text-[var(--sherloq-primary)]" />
        </div>
        <p className="text-[var(--sherloq-primary)] font-bold text-[16px]">Demo · seit 8 Tagen</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--app-bg)] rounded-[12px] py-6 flex flex-col items-center justify-center text-center">
            <div className="text-[var(--text-primary)] text-[24px] font-extrabold tracking-tight mb-1">{stat.value}</div>
            <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
