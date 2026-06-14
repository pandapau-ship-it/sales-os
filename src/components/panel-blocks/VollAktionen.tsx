/**
 * VollAktionen — Aktions-Karte der Vollansicht (Button-Reihe). Extrahiert aus
 * features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import type { ReactNode } from "react";

interface VollAktionenProps {
  items: { icon: ReactNode; label: string }[];
  icon: ReactNode;
  vertical?: boolean;
  padding?: string;
}

export default function VollAktionen({ items, icon, vertical = false, padding = "p-8" }: VollAktionenProps) {
  return (
    <div className={`bg-app-surface rounded-[12px] ${padding} shadow-sm border border-[var(--border)]`}>
      <h2 className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
        {icon} AKTIONEN
      </h2>
      {vertical ? (
        <div className="flex flex-col gap-3">
          {items.map((btn, i) => (
            <button
              key={i}
              className="w-full flex justify-center items-center gap-3 py-3.5 rounded-full border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-[15px] hover:bg-[var(--app-bg)] transition-colors"
            >
              <div className="text-[var(--text-muted)] flex items-center justify-center">{btn.icon}</div>
              {btn.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {items.map((btn, i) => (
            <button
              key={i}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border)] hover:bg-[var(--app-bg)] transition-colors text-[14px] font-semibold text-[var(--text-primary)]"
            >
              <div className="text-[var(--text-muted)] flex items-center justify-center w-5">{btn.icon}</div>
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
