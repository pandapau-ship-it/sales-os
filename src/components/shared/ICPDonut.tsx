import React from 'react';

// Colors reference CSS tokens from index.css :root — never hardcode here.
export const ICPDonut = ({ score }: { score: number }) => {
  const isHigh   = score >= 75;
  const isMedium = score >= 50 && score < 75;

  const color      = isHigh ? 'var(--icp-high)' : isMedium ? 'var(--icp-medium)' : 'var(--icp-low)';
  const trackColor = 'var(--border-subtle)';

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = Math.max(0, circumference - (score / 100) * circumference);

  return (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={radius} stroke={trackColor} strokeWidth="2" fill="transparent" />
        <circle
          cx="20" cy="20" r={radius}
          stroke={color}
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[13px] font-bold font-mono" style={{ color }}>
        {score}
      </span>
    </div>
  );
};
