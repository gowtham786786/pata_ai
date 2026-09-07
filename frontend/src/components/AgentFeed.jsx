import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Search, 
  Compass, 
  MapPin, 
  Gauge, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileCheck2
} from 'lucide-react';
import clsx from 'clsx';
import EvidenceModal from './EvidenceModal';

const AgentFeed = ({ status, result }) => {
  const [showModal, setShowModal] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [expandedAgent, setExpandedAgent] = useState(null);

  // Staggered animation matching real backend response steps
  useEffect(() => {
    if (status === 'idle') {
      setActiveStep(-1);
    } else if (status === 'resolving' && result?.agentSteps) {
      setActiveStep(0);
      let stepIndex = 0;
      const advance = () => {
        if (stepIndex >= result.agentSteps.length) return;
        const delay = result.agentSteps[stepIndex].timeMs || 40;
        setTimeout(() => {
          stepIndex++;
          setActiveStep(stepIndex);
          advance();
        }, delay);
      };
      advance();
    } else if (status === 'resolved') {
      setActiveStep(5);
    }
  }, [status, result]);

  const baseAgents = [
    { id: 1, name: "Address Parser", subtitle: "Extracts semantic address tokens", icon: Search },
    { id: 2, name: "Reference Resolver", subtitle: "Establishes centroid coordinates", icon: Compass },
    { id: 3, name: "Landmark Search", subtitle: "Queries OSM Overpass & Aliases", icon: MapPin },
    { id: 4, name: "Candidate Scorer", subtitle: "Evaluates 100-point rubric", icon: Gauge },
    { id: 5, name: "Composer & Self-Check", subtitle: "Validates against hallucinations", icon: ShieldAlert }
  ];

  const agentItems = baseAgents.map((agent, index) => {
    if (status === 'idle' || !result?.agentSteps) {
      return { ...agent, result: 'Standing by', detail: '', time: null, stepStatus: 'idle' };
    }
    
    if (status === 'resolving') {
      if (index > activeStep) return { ...agent, result: 'Queued', detail: '', time: null, stepStatus: 'idle' };
      if (index === activeStep) return { ...agent, result: 'Executing...', detail: 'Querying model/dataset...', time: null, stepStatus: 'processing' };
      const resolved = result.agentSteps[index];
      return { 
        ...agent, 
        result: resolved?.result || 'Completed', 
        detail: resolved?.detail || '', 
        time: resolved?.timeMs != null ? `${resolved.timeMs}ms` : null, 
        stepStatus: resolved?.status || 'success' 
      };
    }
    
    if (status === 'resolved' && result.agentSteps?.[index]) {
      const resolved = result.agentSteps[index];
      return { 
        ...agent, 
        result: resolved.result, 
        detail: resolved.detail, 
        time: resolved.timeMs != null ? `${resolved.timeMs}ms` : null, 
        stepStatus: resolved.status 
      };
    }
    return { ...agent, result: 'Failed', detail: '', time: null, stepStatus: 'danger' };
  });

  return (
    <div className="flex flex-col h-full">
      {/* Feed Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Agent Pipeline
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            5 Nodes
          </span>
        </div>
        
        {status === 'resolved' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        )}
      </div>

      {/* Stepper Pipeline */}
      <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
        {agentItems.map((agent, index) => {
          const Icon = agent.icon;
          const isExpanded = expandedAgent === agent.id;
          const isProcessing = agent.stepStatus === 'processing';
          const isSuccess = agent.stepStatus === 'success';
          const isWarning = agent.stepStatus === 'warning';
          const isIdle = agent.stepStatus === 'idle';

          return (
            <div 
              key={agent.id}
              className={clsx(
                "rounded-xl border transition-all duration-200 overflow-hidden",
                isProcessing && "bg-blue-950/30 border-blue-500/40 shadow-glow-primary",
                isSuccess && "bg-slate-900/40 border-white/[0.06] hover:border-white/[0.12]",
                isWarning && "bg-amber-950/20 border-amber-500/30",
                isIdle && "bg-slate-900/20 border-white/[0.03] opacity-60"
              )}
            >
              <div 
                className="p-3 flex items-center justify-between cursor-pointer"
                onClick={() => agent.detail && setExpandedAgent(isExpanded ? null : agent.id)}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Status Indicator Icon */}
                  <div className="shrink-0">
                    {isProcessing ? (
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : isSuccess ? (
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : isWarning ? (
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-mono font-bold">
                        0{agent.id}
                      </div>
                    )}
                  </div>

                  {/* Agent Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {agent.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {agent.result}
                    </p>
                  </div>
                </div>

                {/* Right Badge: Latency / Toggle */}
                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  {agent.time && (
                    <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                      {agent.time}
                    </span>
                  )}
                  {agent.detail && (
                    <button className="text-slate-500 hover:text-slate-300 p-0.5">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Detail Panel */}
              <AnimatePresence>
                {isExpanded && agent.detail && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-3 pb-3 pt-1 border-t border-white/[0.04] text-[11px] font-mono text-slate-400 bg-black/20"
                  >
                    <span className="text-slate-500">Output: </span>
                    <span className="text-slate-300">{agent.detail}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
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
