/**
 * PanelHeader — Avatar + Name + ICP-Badge + Schließen (Info-Panel-Kopf, 820px).
 * Extrahiert aus shared/HunterSidepanel.tsx.
 */
import { ArrowUpRight, X } from "lucide-react";
import Avatar from "@/components/shared/Avatar";

interface PanelHeaderProps {
  name: string;
  title?: string;
  company?: string;
  src?: string;
  icp?: number;
  onFull?: () => void;
  onClose: () => void;
}

export default function PanelHeader({ name, title, company, src, icp = 87, onFull, onClose }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex items-center gap-4 min-w-0">
        <Avatar name={name} src={src} size={64} className="shadow-sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[20px] font-extrabold text-text-primary leading-tight">{name}</h1>
            <span className="px-2.5 py-1 rounded-full bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[10px] font-extrabold">
              ICP: {icp}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-text-muted mt-2 leading-none flex-wrap">
            {title && <span>{title}</span>}
            {title && company && <span className="text-icon-muted">•</span>}
            {company && <span className="font-semibold text-text-body">{company}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onFull && (
          <button onClick={onFull} className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-[var(--signal-urgent-text)] hover:bg-[var(--signal-urgent-bg)] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
