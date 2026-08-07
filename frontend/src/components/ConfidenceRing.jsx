import React from 'react';
import clsx from 'clsx';

const ConfidenceRing = ({ value, label, size = 64, strokeWidth = 6 }) => {
  // Value is 0 to 100
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  // Determine color based on value
  let ringColor = 'text-signal-high';
  if (value < 50) ringColor = 'text-signal-low';
  else if (value < 85) ringColor = 'text-signal-med';

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div 
        className="relative flex items-center justify-center" 
        style={{ width: size, height: size }}
      >
        {/* Background Track */}
        <svg className="absolute inset-0 transform -rotate-90" width={size} height={size}>
          <circle
            className="text-navy-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress Ring */}
          <circle
            className={clsx('transition-all duration-1000 ease-out', ringColor)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <span className="absolute font-mono text-xs text-slate-300">
          {value}%
        </span>
      </div>
      {label && <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">{label}</span>}
    </div>
  );
};

export default ConfidenceRing;
