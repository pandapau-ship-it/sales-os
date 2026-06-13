/**
 * KiKurzakte — Bullet-Liste der KI-Kurzakte (Master-Card). Extrahiert aus shared/HunterSidepanel.tsx.
 */
import { Zap } from "lucide-react";

export default function KiKurzakte({ items }: { items: string[] }) {
  return (
    <div className="bg-app-surface rounded-[12px] p-5 border border-border shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-[var(--sherloq-primary)] uppercase tracking-wider mb-4">
        <Zap className="w-4 h-4" /> KI Kurzakte
      </div>
      <ul className="flex flex-col gap-3 text-[13px] text-text-body leading-relaxed">
        {items.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 bg-[var(--sherloq-primary)] rounded-full mt-1.5 shrink-0" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
