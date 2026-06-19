
export const ICPDonut = ({ score, size = 40, strokeWidth = 2, maxValue = 100, forceColor }: { score: number, size?: number, strokeWidth?: number, maxValue?: number, forceColor?: string }) => {
  const percentage = (score / maxValue) * 100;
  const isHigh = percentage >= 75;
  const isMedium = percentage >= 50 && percentage < 75;
  
  const color = forceColor || (isHigh ? 'var(--icp-high)' : isMedium ? 'var(--icp-medium)' : 'var(--icp-low)');
  const trackColor = 'var(--border-subtle)';
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = Math.max(0, circumference - (score / maxValue) * circumference);

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-bold font-sans" style={{ color, fontSize: size * 0.35 }}>
        {score}
      </span>
    </div>
  );
};
