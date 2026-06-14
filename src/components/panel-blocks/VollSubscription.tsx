/**
 * VollSubscription — „Subscription"-Karte der Vollansicht. Extrahiert aus
 * features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Check, Square } from "lucide-react";

export default function VollSubscription() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
        <Square className="w-4 h-4 text-[var(--icon-muted)]" /> SUBSCRIPTION
      </h2>
      <div className="bg-[var(--app-bg)] rounded-xl p-5 border border-[var(--border)] flex justify-between items-center mb-6">
        <div>
          <div className="text-[var(--sherloq-primary)] text-[18px] font-bold">Growth Plan</div>
          <div className="text-[var(--text-muted)] text-[12px] mt-1">01.10.2025 - 01.10.2026</div>
        </div>
        <div className="text-right">
          <div className="text-[var(--text-primary)] text-[24px] font-extrabold tracking-tight">189 €</div>
          <div className="text-[var(--text-muted)] text-[12px]">/ Monat</div>
        </div>
      </div>
      <div className="flex gap-12">
        <div>
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">STATUS</div>
          <div className="text-[var(--text-primary)] font-bold text-[15px] flex items-center gap-1">
            Aktiv <Check className="w-4 h-4 text-[var(--sherloq-primary)]" />
          </div>
        </div>
        <div>
          <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider mb-1">CHURN RISK</div>
          <div className="text-[var(--text-primary)] font-bold text-[15px] flex items-center gap-1">
            Low <Check className="w-4 h-4 text-[var(--sherloq-primary)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
