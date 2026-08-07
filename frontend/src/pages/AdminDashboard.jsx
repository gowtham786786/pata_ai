import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Activity, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfidenceRing from '../components/ConfidenceRing';
import { db } from '../firebase/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    highConfidenceCount: 0,
    lowConfidenceCount: 0,
    averageResponseTime: 0
  });

  useEffect(() => {
    // Listen to global analytics document
    const analyticsRef = doc(db, 'analytics', 'global_stats');
    const unsubscribe = onSnapshot(analyticsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          totalRequests: data.totalRequests || 0,
          highConfidenceCount: data.highConfidenceCount || 0,
          lowConfidenceCount: data.lowConfidenceCount || 0,
          averageResponseTime: data.averageResponseTime || 0
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculate system accuracy percentage
  const accuracy = stats.totalRequests > 0 
    ? Math.round((stats.highConfidenceCount / stats.totalRequests) * 100) 
    : 100;

  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200">
      <div className="flex items-center space-x-3 mb-8">
        <LayoutDashboard className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">Admin Dashboard</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">System Telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Stat Card 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Requests</h3>
             <p className="text-3xl font-bold font-mono text-slate-100">{stats.totalRequests.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><Activity className="text-electric w-6 h-6" /></div>
        </motion.div>

        {/* Stat Card 2 (using ConfidenceRing motif) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">High Confidence</h3>
             <p className="text-sm font-medium text-slate-400">System Accuracy</p>
          </div>
          <ConfidenceRing value={accuracy} size={64} strokeWidth={6} />
        </motion.div>

        {/* Stat Card 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Response</h3>
             <p className="text-3xl font-bold font-mono text-signal-med">{Math.round(stats.averageResponseTime)}<span className="text-sm text-slate-500 ml-1">ms</span></p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><AlertTriangle className="text-signal-med w-6 h-6" /></div>
        </motion.div>

        {/* Stat Card 4 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Low Conf Flags</h3>
             <p className="text-3xl font-bold font-mono text-signal-low">{stats.lowConfidenceCount.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><AlertOctagon className="text-signal-low w-6 h-6" /></div>
        </motion.div>

      </div>

      <div className="flex-1 bg-navy-900 border border-slate-800 rounded-lg shadow-panel p-8 flex flex-col items-center justify-center">
         <ConfidenceRing value={accuracy} size={120} strokeWidth={8} label="System Nominal" />
         <p className="text-slate-500 text-sm mt-6 font-mono text-center max-w-md">
           Live telemetry integration is active. Monitoring global system performance across all pipeline requests.
         </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
