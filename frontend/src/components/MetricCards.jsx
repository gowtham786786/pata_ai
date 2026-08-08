import React from 'react';
import { Activity, Search, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const MetricCards = () => {
  const metrics = [
    { label: "Today's Searches", value: "24,591", trend: "+12%", icon: <Search size={20} />, color: "text-electric-glow", bg: "bg-electric-glow/10", border: "border-electric-glow/30" },
    { label: "Cache Hit Rate", value: "94.2%", trend: "+1.2%", icon: <Zap size={20} />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
    { label: "Avg Latency", value: "142ms", trend: "-5ms", icon: <Activity size={20} />, color: "text-signal-neon", bg: "bg-signal-neon/10", border: "border-signal-neon/30" },
    { label: "High Confidence", value: "89%", trend: "+2%", icon: <ShieldCheck size={20} />, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {metrics.map((m, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="glass-panel rounded-xl p-4 flex flex-col justify-between hover:bg-white/5 transition-colors group cursor-default"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${m.bg} ${m.color} ${m.border} border shadow-inner`}>
              {m.icon}
            </div>
            <span className="text-[10px] font-mono font-bold text-signal-neon bg-signal-neon/10 px-2 py-0.5 rounded border border-signal-neon/20">
              {m.trend}
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-glow transition-all">{m.value}</h3>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400">{m.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MetricCards;
