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
    : avatarBg || "#2B8A3E";

  return (
    <div className="w-full bg-white rounded-[24px] border border-[#F1F3F5] flex flex-col overflow-hidden font-sans shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
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
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#2B8A3E] border-2 border-white rounded-full"></div>
          </div>
          <div>
            <div className="text-base font-extrabold text-[#212529]">
              {name}
            </div>
            <div className="text-[13px] text-[#868E96] font-semibold mt-0.5">
              {role}
            </div>
          </div>
        </div>

        <div className="w-[1px] h-12 bg-[#F1F3F5] shrink-0" />

        {/* ICP Donut */}
        <div className="relative w-12 h-12 shrink-0">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            className="-rotate-90 block"
          >
            <circle cx="24" cy="24" r="20" stroke="#F1F3F5" strokeWidth="4" fill="transparent" />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#2B8A3E"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={donutCircumference}
              strokeDashoffset={donutOffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-extrabold text-[#2B8A3E]">
            {icpScore}
          </span>
        </div>

        {/* Company Pill */}
        <div className="flex items-center gap-2.5 bg-white border border-[#E9ECEF] p-1.5 pr-4 rounded-xl whitespace-nowrap shrink-0">
          <div className="bg-[#121212] text-white text-[11px] font-extrabold w-8 h-8 flex items-center justify-center rounded-lg">
            {companyInitials}
          </div>
          <span className="text-[15px] font-extrabold text-[#212529]">
            {companyName}
          </span>
        </div>

        <div className="w-[1px] h-12 bg-[#F1F3F5] shrink-0 xl:block hidden" />

        {/* Subscription / Stage */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-extrabold text-[#ADB5BD] tracking-[0.05em] uppercase">
            {labelType}
          </span>
          <div className="border border-[#E9ECEF] bg-white rounded-full px-6 py-1.5 text-sm font-extrabold text-[#212529]">
            {stage}
          </div>
        </div>

        {/* Heat */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-extrabold text-[#ADB5BD] tracking-[0.05em] uppercase">
            HEAT
          </span>
          <div className="border border-[#FFC9C9] bg-[#FFF5F5] rounded-full px-5 py-1.5 text-sm font-extrabold text-[#E03131] flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-[#E03131]" />
            Hot
          </div>
        </div>

        <div className="w-[1px] h-12 bg-[#F1F3F5] shrink-0" />

        {/* Time */}
        <div className="flex flex-col items-end w-16 shrink-0">
          <span className="text-base font-extrabold text-[#212529] whitespace-nowrap">
            {timeAgoLabel || timeAgo}
          </span>
          <span className="text-xs text-[#ADB5BD] font-bold mt-0.5 whitespace-nowrap">
            {timeLeftHours}h left
          </span>
        </div>

        {/* Action Button */}
        <button className="w-14 h-14 rounded-full bg-[#E6FCF5] text-[#125455] flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer border-none outline-none">
          <ArrowRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* ROW 2: ACTION SECTION */}
      <div className="bg-[#F8F9FA] px-6 py-4 flex items-center justify-between border-t border-[#F1F3F5] gap-4">
        {/* Left Side: Event & Action Info */}
        <div className="flex items-center gap-5 overflow-hidden">
          <div className="bg-[#1971C2] text-white px-5 py-2.5 rounded-lg font-extrabold text-sm shrink-0">
            LinkedIn Signal
          </div>
          <div className="text-[#1971C2] font-extrabold text-[15px] truncate">
            {actionText}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Progress / Status Block */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col w-[260px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[#E03131] font-extrabold text-[13px] flex items-center gap-1">
                  🔥 Hot
                </span>
                <span className="text-[#E03131] font-extrabold text-[13px]">
                  {timeLeftHours}h left
                </span>
              </div>
              <div className="bg-[#A5D8FF] h-1.5 rounded-full overflow-hidden w-full">
                <div
                  className="bg-[#D0EBFF] h-full rounded-full"
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
              <div className="text-right text-[#ADB5BD] text-[11px] font-extrabold mt-1.5">
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
                <circle cx="20" cy="20" r="16" stroke="#E9ECEF" strokeWidth="4" fill="transparent" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="#2B8A3E"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={smallDonutCircumference}
                  strokeDashoffset={smallIcpOffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-extrabold text-[#2B8A3E]">
                {smallIcpValue}
              </span>
            </div>
          </div>

          <div className="w-[1px] h-10 bg-[#DCE4E8] shrink-0" />

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActNow?.();
              }}
              className="bg-[#125455] text-white border-none rounded-full px-6 py-2.5 font-extrabold text-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              Act now
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[#1971C2] hover:bg-[#E7F5FF] w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
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
        <div className="p-6 border-t border-[#F1F3F5] bg-white">
          <div className="bg-[#F8F9FA] border border-[#E7F5FF] rounded-xl p-5 mb-4">
            <div className="inline-block bg-[#E7F5FF] text-[#1971C2] px-3 py-1.5 rounded-md text-xs font-extrabold mb-3">
              {actionText?.includes("ommentar")
                ? "Replied to a comment"
                : "Signal Details"}
            </div>
            <p className={`text-[15px] font-medium text-[#212529] leading-relaxed ${quoteText ? "mb-4" : "mb-0"}`}>
              "{commentText}"
            </p>
            {quoteText && (
              <div className="border-l-[3px] border-[#D0EBFF] pl-4">
                <span className="text-sm text-[#868E96] italic">
                  "{quoteText}"
                </span>
              </div>
            )}
          </div>

          <div className="bg-[#EBFBEE] border border-[#AEE6D5] rounded-xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-extrabold text-[#2B8A3E]">
                KI Empfehlung
              </span>
            </div>
            <p className="text-sm text-[#2B8A3E] leading-relaxed font-medium">
              {aiRecommendation}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-[#125455] text-white px-6 py-2.5 rounded-lg border-none text-sm font-extrabold cursor-pointer hover:opacity-90">
              Reply generieren
            </button>
            <button className="bg-white border border-[#E9ECEF] text-[#495057] px-6 py-2.5 rounded-lg text-sm font-extrabold cursor-pointer hover:bg-[#F8F9FA]">
              Original ansehen
            </button>
            <button className="bg-white border border-[#E9ECEF] text-[#868E96] px-6 py-2.5 rounded-lg text-sm font-extrabold cursor-pointer hover:bg-[#F8F9FA] ml-2">
              Ignorieren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
