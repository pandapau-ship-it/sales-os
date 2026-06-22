/**
 * KpiCard — KPI-Kachel (Hunter-Übersicht): Titel + Icon-Box · große Zahl · Subtitle/Trend.
 * Kanonischer Stand aus screens/ScreenHunting.tsx. Prop-driven (Icon/Farben/Subtitle als Node).
 */
import type { ReactNode } from "react";

export default function KpiCard({
  title, icon, iconClass, value, valueClass, subtitle, subtitleClass,
}: {
  title: string;
  icon: ReactNode;
  iconClass: string;
  value: string;
  valueClass: string;
  subtitle: ReactNode;
  subtitleClass: string;
}) {
  return (
    <div className="bg-app-surface rounded-[12px] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow relative">
      <div className="flex justify-between items-start">
        <span className="typo-section-label text-text-muted">{title}</span>
        <div className={`w-8 h-8 rounded-[12px] ${iconClass} flex items-center justify-center shrink-0`}>{icon}</div>
      </div>

      <div>
        <div className={`text-[32px] font-extrabold ${valueClass} tracking-tighter leading-none mb-1`}>{value}</div>
        <div className={subtitleClass}>{subtitle}</div>
      </div>
    </div>
  );
}
