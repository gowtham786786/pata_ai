import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ShieldAlert, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EvidenceModal = ({ isOpen, onClose, result }) => {
  if (!isOpen || !result) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-navy-950 border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-navy-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-electric/20 text-electric flex items-center justify-center border border-electric/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-200 uppercase tracking-wider">
                Full Evidence Log
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors bg-navy-800 hover:bg-slate-700 p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Resolution Summary */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-electric" />
                Resolution Summary
              </h3>
              <div className="bg-navy-900 p-4 rounded-lg border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase text-slate-500 mb-1">Normalized Address</span>
                  <span className="text-sm font-medium text-slate-300">{result.normalizedAddress || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-500 mb-1">Coordinates</span>
                  <span className="text-sm font-mono text-electric">{result.latitude ? `${result.latitude}, ${result.longitude}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-500 mb-1">Confidence Score</span>
                  <span className="text-sm font-bold text-signal-high">{result.confidenceScore || 0}/100</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-500 mb-1">Processing Time</span>
                  <span className="text-sm font-mono text-slate-300">{result.processingTimeMs || '< 50'} ms</span>
                </div>
              </div>
            </div>

            {/* Evidence Audit Trail */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-electric" />
                Raw Audit Trail
              </h3>
              <div className="bg-[#0a0f1c] rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                {result.evidence && result.evidence.length > 0 ? (
                  <ul className="space-y-2">
                    {result.evidence.map((ev, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-slate-600 select-none">[{String(idx + 1).padStart(2, '0')}]</span>
                        <span className="text-emerald-400">{ev}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-500 italic">No evidence logged.</span>
                )}
              </div>
            </div>

            {/* Parsed Entities */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-electric" />
                Parsed Entities (JSON)
              </h3>
              <div className="bg-[#0a0f1c] rounded-lg border border-slate-800 p-4 overflow-x-auto">
                <pre className="text-xs text-blue-300 font-mono">
                  {JSON.stringify(result.parsedEntities || {}, null, 2)}
                </pre>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EvidenceModal;
