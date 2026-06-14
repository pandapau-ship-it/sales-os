/**
 * VollKanalStatistik — „Kanal-Statistik"-Karte der Vollansicht (Kommunikation-Tab).
 * Extrahiert aus features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Phone, Square } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

const stats = [
  { label: "Email", count: 12, sub: "vor 8 Tagen", icon: Square, color: "text-[var(--sherloq-primary)]", bg: "bg-[var(--signal-success-bg)]" },
  { label: "LinkedIn", count: 7, sub: "vor 2h", icon: LinkedinIcon, color: "text-[var(--signal-info-text)]", bg: "bg-[var(--signal-info-bg)]" },
  { label: "Phone", count: 4, sub: "vor 5T", icon: Phone, color: "text-[var(--signal-warn-text)]", bg: "bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)]" },
  { label: "Teams", count: 3, sub: "vor 5T", icon: Square, color: "text-[var(--signal-info-text)]", bg: "bg-[var(--signal-info-bg)] border border-[var(--signal-info-bg)]" },
  { label: "Meeting", count: 2, sub: "vor 5T", icon: Square, color: "text-[var(--signal-info-text)]", bg: "bg-[var(--signal-info-bg)]" },
  { label: "WhatsApp", count: 1, sub: "vor 21T", icon: Square, color: "text-[var(--signal-success-text)]", bg: "bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)]" },
];

export default function VollKanalStatistik() {
  return (
    <div className="bg-app-surface rounded-[12px] p-6 shadow-sm border border-[var(--border)]">
      <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
        <Square className="w-4 h-4 text-[var(--icon-muted)]" /> KANAL-STATISTIK
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center justify-center p-4 bg-[var(--app-bg)] rounded-[12px] border border-[var(--border)]">
            <div className={`w-10 h-10 rounded-xl mb-2 flex items-center justify-center shadow-sm ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5 fill-current" />
            </div>
            <div className="text-[20px] font-extrabold text-[var(--text-primary)]">{stat.count}</div>
            <div className="text-[12px] font-medium text-[var(--text-muted)] mt-0.5">{stat.label}</div>
            <div className="text-[var(--sherloq-primary)] text-[10px] font-semibold mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
