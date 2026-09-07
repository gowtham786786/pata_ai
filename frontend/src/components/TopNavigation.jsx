import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, ShieldCheck } from 'lucide-react';

const TopNavigation = ({ 
  title = "Address Resolver", 
  subtitle = "Deterministic Multi-Agent Geocoding & Landmark Verification" 
}) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full mb-3 pb-2.5 border-b border-white/[0.06] gap-2 flex-shrink-0">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            AI Pipeline
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-normal">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-white/[0.06] text-[11px] font-mono text-slate-300">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{time}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>Self-Check: Active</span>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
