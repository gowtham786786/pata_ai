import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  const handleSelectPortal = (portal) => {
    navigate('/login', { state: { portal } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden z-10 px-4 py-12">
      
      {/* Top Banner Chip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6 backdrop-blur-md"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI Build 2026 • Multi-Agent Location Intelligence</span>
      </motion.div>

      {/* Main Title Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center max-w-3xl mx-auto mb-10"
      >
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Resolve Indian Addresses with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
            Multi-Agent AI Precision
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          Orchestrating 5 specialized autonomous agents to parse unstructured Hinglish text, verify India Post pincodes, and pinpoint colloquial landmarks.
        </p>
      </motion.div>

      {/* Portal Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-20 mb-12">
        
        {/* User Portal Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ y: -4 }}
          onClick={() => handleSelectPortal('user')}
          className="group cursor-pointer rounded-2xl glass-card p-6 sm:p-8 relative overflow-hidden transition-all duration-200 hover:border-blue-500/40 hover:shadow-glow-primary"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Operations
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
            User Workspace
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Resolve unstructured addresses in real time, inspect multi-agent reasoning, plan delivery routes, and explore past lookups.
          </p>

          <div className="space-y-2 mb-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Interactive Geocoding & Leaflet Map</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>5-Agent Execution Breakdown</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Search History & Saved Locations</span>
            </div>
          </div>

          <div className="flex items-center text-sm font-semibold text-blue-400 group-hover:text-blue-300 gap-1.5 mt-auto">
            <span>Open User Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Admin Portal Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ y: -4 }}
          onClick={() => handleSelectPortal('admin')}
          className="group cursor-pointer rounded-2xl glass-card p-6 sm:p-8 relative overflow-hidden transition-all duration-200 hover:border-indigo-500/40 hover:shadow-glow-cyan"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              System Admin
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
            Admin Command Center
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Monitor agent telemetry, cache performance, audit logs, dataset synchronization, and manage platform permissions.
          </p>

          <div className="space-y-2 mb-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-time Agent Telemetry & Latency</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Audit Logs & User Access Control</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pincode Dataset Sync & Overpass Monitor</span>
            </div>
          </div>

          <div className="flex items-center text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 gap-1.5 mt-auto">
            <span>Open Admin Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

      </div>

      {/* Trust & Architecture Metrics Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
      >
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="text-xl font-bold font-mono text-blue-400">5</div>
          <div className="text-xs text-slate-400 mt-0.5">AI Agents in Pipeline</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="text-xl font-bold font-mono text-emerald-400">99.4%</div>
          <div className="text-xs text-slate-400 mt-0.5">Pincode Accuracy</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="text-xl font-bold font-mono text-cyan-400">&lt;200ms</div>
          <div className="text-xs text-slate-400 mt-0.5">Cached Latency</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="text-xl font-bold font-mono text-purple-400">Pan-India</div>
          <div className="text-xs text-slate-400 mt-0.5">OSM & Centroids</div>
        </div>
      </motion.div>

    </div>
  );
};

export default WelcomeScreen;
