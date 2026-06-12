import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

interface LinkedinSignalCardProps {
  name: string;
  role: string;
  avatarUrl?: string;
  avatarInitials?: string;
  avatarBg?: string;
  companyInitials: string;
  companyName: string;
  stage?: string;
  labelType?: "STAGE" | "SUBSCRIPTION";
  icpScore?: number;
  timeAgo?: string;
  timeAgoLabel?: string;
  timeLeftHours?: number;
  windowHours?: number;
  actionText: string;
  commentText: string;
  quoteText?: string;
  aiRecommendation: string;
  onActNow?: () => void;
}

export function LinkedinSignalCard({
  name,
  role,
  avatarUrl,
  avatarInitials,
  avatarBg,
  companyInitials,
  companyName,
  stage = "Signal",
  labelType = "STAGE",
  icpScore = 80,
  timeAgo = "2 Std.",
  timeAgoLabel,
  timeLeftHours = 46,
  windowHours = 48,
  actionText,
  commentText,
  quoteText,
  aiRecommendation,
  onActNow,
}: LinkedinSignalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const timeProgress =
    windowHours > 0
      ? Math.max(0, 100 - (timeLeftHours / windowHours) * 100)
      : 100;

  const donutCircumference = 125.66;
  const donutOffset =
    donutCircumference - (icpScore / 100) * donutCircumference;

  const smallDonutCircumference = 100.53;
  const smallIcpValue = Math.round(icpScore / 10);
  const smallIcpOffset =
    smallDonutCircumference - (smallIcpValue / 10) * smallDonutCircumference;

  const extractedBg = avatarBg?.includes("bg-[")
    ? avatarBg.replace("bg-[", "").replace("]", "")
    : avatarBg || "var(--icp-high)";

  return (
    <div className="w-full bg-white rounded-[24px] border border-[var(--border-subtle)] flex flex-col overflow-hidden font-sans shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      {/* ROW 1: HEADER SECTION */}
      <div className="p-5 md:px-6 flex items-center justify-between gap-4">
        {/* Avatar & Name */}
        <div className="flex items-center gap-4 min-w-[220px] shrink-0">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-14 h-14 rounded-full object-cover block"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full text-white flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: extractedBg }}
              >
                {avatarInitials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[var(--icp-high)] border-2 border-white rounded-full"></div>
          </div>
          <div>
            <div className="text-base font-extrabold text-[var(--text-primary)]">
              {name}
            </div>
            <div className="text-[13px] text-[var(--text-muted)] font-semibold mt-0.5">
              {role}
            </div>
          </div>
        </div>

        <div className="w-[1px] h-12 bg-[var(--border-subtle)] shrink-0" />

        {/* ICP Donut */}
        <div className="relative w-12 h-12 shrink-0">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            className="-rotate-90 block"
          >
            <circle cx="24" cy="24" r="20" stroke="var(--border-subtle)" strokeWidth="4" fill="transparent" />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="var(--icp-high)"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={donutCircumference}
              strokeDashoffset={donutOffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-extrabold text-[var(--icp-high)]">
            {icpScore}
          </span>
        </div>

        {/* Company Pill */}
        <div className="flex items-center gap-2.5 bg-white border border-[var(--border)] p-1.5 pr-4 rounded-xl whitespace-nowrap shrink-0">
          <div className="bg-[var(--text-primary)] text-white text-[11px] font-extrabold w-8 h-8 flex items-center justify-center rounded-lg">
            {companyInitials}
          </div>
          <span className="text-[15px] font-extrabold text-[var(--text-primary)]">
            {companyName}
          </span>
        </div>

        <div className="w-[1px] h-12 bg-[var(--border-subtle)] shrink-0 xl:block hidden" />

        {/* Subscription / Stage */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-extrabold text-[var(--icon-muted)] tracking-[0.05em] uppercase">
            {labelType}
          </span>
          <div className="border border-[var(--border)] bg-white rounded-full px-6 py-1.5 text-sm font-extrabold text-[var(--text-primary)]">
            {stage}
          </div>
        </div>

        {/* Heat */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-extrabold text-[var(--icon-muted)] tracking-[0.05em] uppercase">
            HEAT
          </span>
          <div className="border border-[var(--signal-urgent-bg)] bg-[var(--signal-urgent-bg)] rounded-full px-5 py-1.5 text-sm font-extrabold text-[var(--icp-low)] flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-[var(--icp-low)]" />
            Hot
          </div>
        </div>

        <div className="w-[1px] h-12 bg-[var(--border-subtle)] shrink-0" />

        {/* Time */}
        <div className="flex flex-col items-end w-16 shrink-0">
          <span className="text-base font-extrabold text-[var(--text-primary)] whitespace-nowrap">
            {timeAgoLabel || timeAgo}
          </span>
          <span className="text-xs text-[var(--icon-muted)] font-bold mt-0.5 whitespace-nowrap">
            {timeLeftHours}h left
          </span>
        </div>

        {/* Action Button */}
        <button className="w-14 h-14 rounded-full bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)] flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer border-none outline-none">
          <ArrowRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* ROW 2: ACTION SECTION */}
      <div className="bg-[var(--app-bg)] px-6 py-4 flex items-center justify-between border-t border-[var(--border-subtle)] gap-4">
        {/* Left Side: Event & Action Info */}
        <div className="flex items-center gap-5 overflow-hidden">
          <div className="bg-[var(--signal-info-text)] text-white px-5 py-2.5 rounded-lg font-extrabold text-sm shrink-0">
            LinkedIn Signal
          </div>
          <div className="text-[var(--signal-info-text)] font-extrabold text-[15px] truncate">
            {actionText}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Progress / Status Block */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col w-[260px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[var(--icp-low)] font-extrabold text-[13px] flex items-center gap-1">
                  🔥 Hot
                </span>
                <span className="text-[var(--icp-low)] font-extrabold text-[13px]">
                  {timeLeftHours}h left
                </span>
              </div>
              <div className="bg-[var(--signal-info-bg)] h-1.5 rounded-full overflow-hidden w-full">
                <div
                  className="bg-[var(--signal-info-bg)] h-full rounded-full"
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
              <div className="text-right text-[var(--icon-muted)] text-[11px] font-extrabold mt-1.5">
                {windowHours}h window
              </div>
            </div>

            {/* Small ICP Donut */}
            <div className="relative w-10 h-10 shrink-0">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                className="-rotate-90 block"
              >
                <circle cx="20" cy="20" r="16" stroke="var(--border)" strokeWidth="4" fill="transparent" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="var(--icp-high)"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={smallDonutCircumference}
                  strokeDashoffset={smallIcpOffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-extrabold text-[var(--icp-high)]">
                {smallIcpValue}
              </span>
            </div>
          </div>

          <div className="w-[1px] h-10 bg-[var(--signal-teal-bg)] shrink-0" />

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActNow?.();
              }}
              className="bg-[var(--sherloq-primary)] text-white border-none rounded-full px-6 py-2.5 font-extrabold text-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              Act now
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[var(--signal-info-text)] hover:bg-[var(--signal-info-bg)] w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
            >
              {expanded ? (
                <ChevronUp className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <ChevronDown className="w-6 h-6 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ROW 3: EXPANDED CONTENT (Optional) */}
      {expanded && (
        <div className="p-6 border-t border-[var(--border-subtle)] bg-white">
          <div className="bg-[var(--app-bg)] border border-[var(--signal-info-bg)] rounded-xl p-5 mb-4">
            <div className="inline-block bg-[var(--signal-info-bg)] text-[var(--signal-info-text)] px-3 py-1.5 rounded-md text-xs font-extrabold mb-3">
              {actionText?.includes("ommentar")
                ? "Replied to a comment"
                : "Signal Details"}
            </div>
            <p className={`text-[15px] font-medium text-[var(--text-primary)] leading-relaxed ${quoteText ? "mb-4" : "mb-0"}`}>
              "{commentText}"
            </p>
            {quoteText && (
              <div className="border-l-[3px] border-[var(--signal-info-bg)] pl-4">
                <span className="text-sm text-[var(--text-muted)] italic">
                  "{quoteText}"
                </span>
              </div>
            )}
          </div>

          <div className="bg-[var(--signal-success-bg)] border border-[var(--signal-teal-bg)] rounded-xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-extrabold text-[var(--icp-high)]">
                KI Empfehlung
              </span>
            </div>
            <p className="text-sm text-[var(--icp-high)] leading-relaxed font-medium">
              {aiRecommendation}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-[var(--sherloq-primary)] text-white px-6 py-2.5 rounded-lg border-none text-sm font-extrabold cursor-pointer hover:opacity-90">
              Reply generieren
            </button>
            <button className="bg-white border border-[var(--border)] text-[var(--text-body)] px-6 py-2.5 rounded-lg text-sm font-extrabold cursor-pointer hover:bg-[var(--app-bg)]">
              Original ansehen
            </button>
            <button className="bg-white border border-[var(--border)] text-[var(--text-muted)] px-6 py-2.5 rounded-lg text-sm font-extrabold cursor-pointer hover:bg-[var(--app-bg)] ml-2">
              Ignorieren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
