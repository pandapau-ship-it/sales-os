export const ScoreRing = ({ score, colorClass, strokeColor }: { score: number; colorClass: string; strokeColor?: string; }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative w-10 h-10 flex items-center justify-center ${colorClass}`}>
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={radius} stroke="#F1F3F5" strokeWidth="4" fill="transparent" />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className={strokeColor}
        />
      </svg>
      <span className="absolute text-[12px] font-bold font-mono tracking-tighter">
        {score}
      </span>
    </div>
  );
};
