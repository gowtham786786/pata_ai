import React, { useState, useEffect } from 'react';
import { Bell, Activity, Database, Map as MapIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopNavigation = () => {
  const { currentUser } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          Command Center
          <div className="flex items-center px-2 py-1 rounded bg-electric-glow/10 border border-electric-glow/30 text-electric-glow text-[10px] uppercase tracking-widest font-mono shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-glow animate-pulse mr-1.5"></span>
            Live
          </div>
        </h1>
        <p className="text-sm text-slate-400 font-mono tracking-wider mt-1 uppercase">PataAI Geocoding Orchestrator v2.0</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono tracking-widest uppercase">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Database size={14} className="text-purple-400" />
            <span>Firebase <span className="text-signal-neon">Ok</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity size={14} className="text-electric-400" />
            <span>AI Service <span className="text-signal-neon">Ok</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapIcon size={14} className="text-orange-400" />
            <span>OSM <span className="text-signal-neon">Ok</span></span>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10 hidden lg:block"></div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-electric-glow tracking-widest">{time}</span>
          
          <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-signal-low shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-purple-deep flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-electric-500/30">
              {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
