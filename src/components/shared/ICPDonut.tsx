import React from 'react';

export const ICPDonut = ({ score }: { score: number }) => {
  const isHigh = score >= 75;
  const isMedium = score >= 50 && score < 75;
  
  // From screenshot 1, the track is a light gray color (#F1F3F5) and the progress is the brand color. Wait.
  // Actually, screenshot 1 shows track is #F1F3F5, progress is mostly orange? The text is green "79". 
  // Let's use the colors given in our rules:
  // >75: text #2B8A3E, 50-74: text #F59E0B, <50: text #E53E3E
  const color = isHigh ? '#2B8A3E' : isMedium ? '#F59E0B' : '#E53E3E';
  const trackColor = '#F1F3F5'; // Assuming neutral track
  
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = Math.max(0, circumference - (score / 100) * circumference);

  return (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={trackColor}
          strokeWidth="2"
          fill="transparent"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
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
