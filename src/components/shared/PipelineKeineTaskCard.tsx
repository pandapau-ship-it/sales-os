import { ChevronDown, ArrowRight } from 'lucide-react';

export const PipelineKeineTaskCard = ({ onTaskAnlegen }: { onTaskAnlegen?: () => void }) => {
    return (
<div
  className="bg-white overflow-hidden cursor-pointer max-w-[1100px] w-full mx-auto"
  style={{
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
    borderRadius: "32px",
    border: "1px solid var(--border-subtle)",
    transition: "all 0.2s ease-in-out",
  }}
>
  {/* TOP ROW */}
  <div className="p-[20px] flex items-center justify-between gap-6 flex-wrap">
    {/* Avatar & Name */}
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-[var(--icp-medium)] text-white flex items-center justify-center text-[13px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
          SJ
        </div>
        <div className="absolute -bottom-[2px] -right-[2px] w-[14px] h-[14px] bg-[var(--icp-medium)] border-2 border-white rounded-full"></div>
      </div>

      <div>
        <div className="text-[14px] font-bold text-[var(--text-primary)]">
          Sarah Jenkins
        </div>
        <div className="text-[12px] text-[var(--text-muted)] mt-[2px] truncate">
          Head of Business Development, CloudSphere
        </div>
      </div>
    </div>

    {/* ICP + Company */}
    <div className="flex items-center gap-5 px-5 border-l border-[var(--border-subtle)] shrink-0">
      <div className="relative w-12 h-12">
        <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="var(--border-subtle)"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="var(--icp-medium)"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray="125.66"
            strokeDashoffset="43.98"
            strokeLinecap="round"
          />
        </svg>

        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-bold text-[var(--icp-medium)] tracking-tighter font-mono">
          65
        </span>
      </div>

      <div className="flex items-center gap-2 bg-white border border-[var(--border)] px-2.5 py-1.5 rounded-[12px] shrink-0">
        <div className="bg-[var(--text-body)] flex items-center justify-center text-white text-[10px] font-bold w-6 h-6 rounded-[6px]">
          C
        </div>
        <span className="text-[13px] text-[var(--text-body)] font-semibold whitespace-nowrap pr-1.5">
          CloudSphere
        </span>
      </div>
    </div>

    {/* Stage + Heat */}
    <div className="flex items-center gap-4 px-5 border-l border-[var(--border-subtle)] shrink-0">
      <div className="flex flex-col items-center relative w-[80px]">
        <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-[0.08em] uppercase">
          STAGE
        </span>
        <div className="px-4 py-1.5 rounded-full bg-[var(--app-bg)] border border-[var(--border)] text-[12px] font-semibold text-[var(--text-body)]">
          Lead
        </div>
      </div>

      <div className="flex flex-col items-center relative w-[100px]">
        <span className="absolute -top-[14px] text-[10px] font-bold text-[var(--icon-muted)] tracking-[0.08em] uppercase">
          HEAT
        </span>
        <div className="px-4 py-1.5 rounded-full bg-[var(--signal-warn-bg)] border border-[var(--signal-warn-bg)] text-[12px] font-semibold text-[var(--icp-medium)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--icp-medium)]"></span>
          Stabil
        </div>
      </div>
    </div>

    {/* Zeit + Buttons */}
    <div className="flex items-center gap-5 pl-5 border-l border-[var(--border-subtle)] shrink-0">
      <div className="text-right">
        <div className="text-[14px] font-bold text-[var(--text-primary)] whitespace-nowrap">
          vor 3 Tagen
        </div>
        <div className="text-[12px] text-[var(--text-muted)] font-semibold mt-[2px] whitespace-nowrap">
          Neu in Pipeline
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="w-[32px] h-[32px] rounded-full bg-transparent text-[var(--icon-muted)] justify-center flex items-center shrink-0">
          <ChevronDown strokeWidth={2.5} size={16} />
        </button>

        <button className="w-[40px] h-[40px] rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] shrink-0 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:bg-[var(--signal-teal-bg)] hover:scale-105 transition-all">
          <ArrowRight strokeWidth={2.5} size={16} />
        </button>
      </div>
    </div>
  </div>

  {/* SIGNAL ROW */}
  <div className="bg-[var(--app-bg)] border-t border-[var(--border)] px-8 py-2.5 flex items-center justify-between gap-4 flex-wrap">
    <div className="flex items-center gap-3 shrink-0">
      <div className="bg-[var(--signal-warn-bg)] text-[var(--icp-medium)] px-3 py-1.5 rounded-[8px] flex items-center gap-2 text-[14px] font-bold">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Keine Task
      </div>

      <span className="text-[14px] font-semibold text-[var(--text-body)]">
        Pflicht — Deal braucht eine offene Aufgabe
      </span>
    </div>

    <button 
      onClick={(e) => {
        e.stopPropagation();
        onTaskAnlegen?.();
      }}
      className="bg-white border border-[var(--border)] text-[var(--text-body)] px-5 py-2 rounded-[12px] text-[13px] font-bold cursor-pointer whitespace-nowrap shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:bg-gray-50 flex items-center transition-all"
    >
      Task anlegen
    </button>
  </div>
</div>
    );
};

