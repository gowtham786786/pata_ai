import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Terminal, Zap, ShieldCheck, MapPin, Search } from 'lucide-react';
import clsx from 'clsx';
import EvidenceModal from './EvidenceModal';

const AgentFeed = ({ status, result }) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  // Handle staggered animation based on real backend timings
  useEffect(() => {
    if (status === 'idle') {
      setActiveStep(-1);
      setShowReasoning(false);
    } else if (status === 'resolving' && result?.agentSteps) {
      setActiveStep(0);
      
      let currentStep = 0;
      
      const playNext = () => {
        if (currentStep >= result.agentSteps.length) return;
        
        const stepTime = result.agentSteps[currentStep].timeMs || 10;
        
        setTimeout(() => {
          currentStep++;
          setActiveStep(currentStep);
          playNext();
        }, stepTime); // The delay is EXACTLY the time the agent took on the backend
      };
      
      playNext();
      
    } else if (status === 'resolved') {
      setActiveStep(5);
    }
  }, [status, result]);

  const baseAgents = [
    { id: 1, name: "Agent 1: Address Parser", icon: <Search className="w-4 h-4" /> },
    { id: 2, name: "Agent 2: Pincode Verifier", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 3, name: "Agent 3: Landmark Search", icon: <MapPin className="w-4 h-4" /> },
    { id: 4, name: "Agent 4: Confidence Score", icon: <Zap className="w-4 h-4" /> },
    { id: 5, name: "Agent 5: Self Check", icon: <Terminal className="w-4 h-4" /> }
  ];

  // Derive current display data based on animation state
  const agents = baseAgents.map((agent, index) => {
    if (status === 'idle' || !result?.agentSteps) {
      return { ...agent, result: 'Standing by...', detail: '', time: '--', status: 'idle' };
    }
    
    // If resolving, show progress
    if (status === 'resolving') {
      if (index > activeStep) return { ...agent, result: 'Waiting in queue...', detail: '', time: '--', status: 'idle' };
      if (index === activeStep) return { ...agent, result: 'Processing...', detail: 'Connecting...', time: '--', status: 'processing' };
      // Previous steps are complete
      const resolvedData = result.agentSteps[index];
      return { ...agent, result: resolvedData.result, detail: resolvedData.detail, time: `${resolvedData.timeMs}ms`, status: resolvedData.status };
    }
    
    // Resolved
    if (status === 'resolved' && result.agentSteps[index]) {
       const resolvedData = result.agentSteps[index];
       return { ...agent, result: resolvedData.result, detail: resolvedData.detail, time: `${resolvedData.timeMs}ms`, status: resolvedData.status };
    }
    return { ...agent, result: 'Error', detail: '', time: '--', status: 'danger' };
  });

  const getStatusColor = (agentStatus) => {
    switch (agentStatus) {
      case 'success': return 'text-signal-high border-signal-high/20';
      case 'warning': return 'text-signal-med border-signal-med/20';
      case 'danger': return 'text-signal-low border-signal-low/20';
      case 'processing': return 'text-electric border-electric bg-electric/10 animate-pulse';
      case 'idle':
      default: return 'text-slate-600 border-slate-800 bg-navy-950 opacity-50';
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 rounded-lg shadow-panel border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-navy-950/50">
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase flex items-center gap-2">
          <div className={clsx("w-2 h-2 rounded-full", status === 'resolving' ? 'bg-electric animate-pulse' : (status === 'resolved' ? 'bg-signal-high' : 'bg-slate-600'))}></div>
          Live Agent Feed
        </h3>
        <label className={clsx("flex items-center cursor-pointer gap-2", status === 'idle' ? 'opacity-50 pointer-events-none' : '')}>
          <span className="text-xs text-slate-400 font-medium">Show Reasoning</span>
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={showReasoning} onChange={() => setShowReasoning(!showReasoning)} disabled={status === 'idle'} />
            <div className={clsx("block w-8 h-5 rounded-full transition-colors", showReasoning ? "bg-electric" : "bg-slate-700")}></div>
            <div className={clsx("absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform", showReasoning ? "transform translate-x-3" : "")}></div>
          </div>
        </label>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {agents.map((agent, i) => (
          <div key={agent.id} className="flex gap-3">
            {/* Timeline line & icon */}
            <div className="flex flex-col items-center">
              <div className={clsx("flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300", getStatusColor(agent.status))}>
                {agent.icon}
              </div>
              {i !== agents.length - 1 && <div className="w-px h-full bg-slate-800 my-1"></div>}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <span className={clsx("text-xs font-semibold uppercase tracking-wide transition-colors", agent.status === 'idle' ? 'text-slate-600' : 'text-slate-300')}>{agent.name}</span>
                <span className={clsx("text-xs font-mono transition-colors", agent.status === 'idle' ? 'text-slate-700' : 'text-slate-500')}>{agent.time}</span>
              </div>
              <p className={clsx("text-sm mt-1 font-medium transition-colors", agent.status === 'idle' ? 'text-slate-600' : (agent.status === 'processing' ? 'text-electric' : 'text-slate-200'))}>{agent.result}</p>
              
              <AnimatePresence>
                {showReasoning && agent.status !== 'idle' && agent.status !== 'processing' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-2 bg-navy-950 rounded border border-slate-800/50">
                      <p className="text-xs text-slate-400 font-mono leading-relaxed">{agent.detail}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Action */}
      <div className="p-4 border-t border-slate-800 bg-navy-950/50">
        <button 
          onClick={() => setShowModal(true)}
          disabled={status !== 'resolved'}
          className={clsx("w-full py-2 text-xs font-semibold uppercase tracking-wider rounded transition-colors border",
             status === 'resolved' ? "bg-electric/10 hover:bg-electric/20 text-electric border-electric/20 cursor-pointer" : "bg-navy-900 text-slate-600 border-slate-800 cursor-not-allowed")}
        >
          View Full Evidence Log
        </button>
      </div>

      <EvidenceModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        result={result} 
      />
    </div>
  );
};

export default AgentFeed;
