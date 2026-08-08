import React from 'react';
import { Activity, Cpu, Server, Database, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AIAgentMonitor = () => {
  const agents = [
    { name: 'Parser Agent', status: 'Running', health: 99.9, latency: 45, requests: '124k', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { name: 'Cleaning Agent', status: 'Running', health: 100, latency: 12, requests: '124k', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { name: 'Pincode Agent', status: 'Running', health: 98.5, latency: 120, requests: '124k', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { name: 'Geocoding Agent', status: 'Warning', health: 85.2, latency: 450, requests: '110k', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    { name: 'Landmark Agent', status: 'Running', health: 99.1, latency: 210, requests: '95k', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { name: 'Confidence Agent', status: 'Running', health: 100, latency: 15, requests: '124k', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { name: 'Self Check Agent', status: 'Idle', health: 100, latency: 0, requests: '45k', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  ];

  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <Activity className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">AI Agent Monitor</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Pipeline Health & Diagnostics</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, idx) => (
          <motion.div key={agent.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex flex-col relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-1 ${agent.bg}`}></div>
            <div className="flex justify-between items-start mb-4">
               <h3 className="text-sm font-bold text-slate-200">{agent.name}</h3>
               <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${agent.border} ${agent.color} ${agent.bg}`}>
                 {agent.status}
               </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
               <div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Health</p>
                  <p className={`text-xl font-bold font-mono ${agent.health < 90 ? 'text-amber-400' : 'text-emerald-400'}`}>{agent.health}%</p>
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Latency</p>
                  <p className="text-xl font-bold font-mono text-slate-200">{agent.latency}<span className="text-xs text-slate-500 ml-1">ms</span></p>
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Requests</p>
                  <p className="text-xl font-bold font-mono text-slate-300">{agent.requests}</p>
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Errors</p>
                  <p className="text-xl font-bold font-mono text-slate-300">0.01%</p>
               </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
               <span className="flex items-center"><Cpu className="w-3 h-3 mr-1" /> CPU: 12%</span>
               <span className="flex items-center"><Server className="w-3 h-3 mr-1" /> RAM: 256MB</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AIAgentMonitor;
