import React from 'react';
import { Server, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const APIMonitor = () => {
  const services = [
    { name: 'Node.js Backend', status: 'Online', latency: 45, uptime: '99.99%', load: '12%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'FastAPI AI Service', status: 'Online', latency: 120, uptime: '99.95%', load: '45%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Firebase Firestore', status: 'Online', latency: 30, uptime: '100%', load: 'N/A', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Firebase Auth', status: 'Online', latency: 25, uptime: '100%', load: 'N/A', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'OpenStreetMap API', status: 'Warning', latency: 850, uptime: '98.2%', load: 'N/A', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { name: 'Nominatim Service', status: 'Online', latency: 320, uptime: '99.5%', load: 'N/A', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <Server className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">API Monitor</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Infrastructure Health</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <motion.div key={service.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
            className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex flex-col relative"
          >
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center space-x-3">
                 <div className={`p-2 rounded ${service.bg}`}><Activity className={`${service.color}`} size={16} /></div>
                 <h3 className="text-sm font-bold text-slate-200">{service.name}</h3>
               </div>
               <span className={`flex h-2 w-2 relative`}>
                 {service.status === 'Online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                 <span className={`relative inline-flex rounded-full h-2 w-2 ${service.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
               </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Latency</p>
                  <div className="flex items-center">
                    <p className={`text-lg font-bold font-mono ${service.latency > 500 ? 'text-amber-400' : 'text-slate-200'}`}>{service.latency}<span className="text-xs text-slate-500 ml-1">ms</span></p>
                    {service.latency > 500 ? <ArrowUpRight className="text-amber-400 ml-1 w-3 h-3" /> : <ArrowDownRight className="text-emerald-400 ml-1 w-3 h-3" />}
                  </div>
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Uptime</p>
                  <p className="text-lg font-bold font-mono text-slate-200">{service.uptime}</p>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default APIMonitor;
