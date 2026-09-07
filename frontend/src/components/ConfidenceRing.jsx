import React from 'react';

const ConfidenceRing = ({ value = 0, label, size = 68, strokeWidth = 6 }) => {
  const numericValue = Math.min(Math.max(Number(value) || 0, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (numericValue / 100) * circumference;
  
  // High / Medium / Low dynamic styling
  let strokeColor = '#10B981'; // Emerald
  let glowColor = 'rgba(16, 185, 129, 0.35)';
  let textColor = 'text-emerald-400';
  
  if (numericValue < 50) {
    strokeColor = '#EF4444'; // Red
    glowColor = 'rgba(239, 68, 68, 0.35)';
    textColor = 'text-rose-400';
  } else if (numericValue < 80) {
    strokeColor = '#F59E0B'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.35)';
    textColor = 'text-amber-400';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className="relative flex items-center justify-center" 
        style={{ width: size, height: size }}
      >
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Track */}
          <circle
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Glowing Animated Progress */}
          <circle
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 6px ${glowColor})`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-mono font-bold ${textColor}`}>
            {numericValue}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[11px] font-medium text-slate-400 mt-1">
          {label}
        </span>
      )}
    </div>
  );
};

export default ConfidenceRing;
