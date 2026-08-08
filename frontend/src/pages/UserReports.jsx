import React from 'react';
import { BarChart2, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const UserReports = () => {
  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <BarChart2 className="text-electric" size={28} />
          <div>
             <h1 className="text-2xl font-semibold tracking-wide text-slate-100">My Reports</h1>
             <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Analytics & Exports</p>
          </div>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-electric/10 border border-electric/30 text-electric hover:bg-electric/20 rounded font-mono text-xs uppercase tracking-widest transition-colors">
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex flex-col justify-center"
        >
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Monthly Searches</h3>
          <p className="text-3xl font-bold font-mono text-slate-100">0</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex flex-col justify-center"
        >
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Avg Accuracy</h3>
          <p className="text-3xl font-bold font-mono text-emerald-500">0%</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex flex-col justify-center"
        >
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Avg Latency</h3>
          <p className="text-3xl font-bold font-mono text-amber-500">0<span className="text-sm text-slate-500 ml-1">ms</span></p>
        </motion.div>
      </div>

      <div className="flex-1 bg-navy-900 border border-slate-800 rounded-lg shadow-panel flex items-center justify-center p-8">
         <div className="text-center max-w-md">
            <h2 className="text-lg font-bold text-slate-300 mb-2">Not Enough Data</h2>
            <p className="text-sm text-slate-500 font-mono">Perform more location searches to unlock advanced trend charts and historical reporting.</p>
         </div>
      </div>
    </div>
  );
};

export default UserReports;
