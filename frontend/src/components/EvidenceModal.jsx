import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, MapPin, Code2, Copy, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EvidenceModal = ({ isOpen, onClose, result }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen || !result) return null;
  
  const candidate = result.candidates?.find(c => c.lat === result.latitude && c.lon === result.longitude) || {};
  const ev = candidate.evidence_details || {};

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0F172A] border border-white/[0.1] w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0C1322]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Geospatial Evidence Audit
                </h2>
                <p className="text-xs text-slate-400">Agent Decision Log & Deterministic Scoring Breakdown</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Why This Location Card */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Verification Indicators</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <span className="text-[11px] text-slate-400 block mb-1">Pincode Check</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-block ${
                    ev.pincode_match ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {ev.pincode_match === true ? 'Verified' : (ev.pincode_match || 'Unverified')}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <span className="text-[11px] text-slate-400 block mb-1">City Match</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-block ${
                    ev.city_match ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {ev.city_match === true ? 'Verified' : (ev.city_match || 'Unverified')}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <span className="text-[11px] text-slate-400 block mb-1">Locality Overlap</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {ev.locality_match || 'N/A'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <span className="text-[11px] text-slate-400 block mb-1">Centroid Distance</span>
                  <span className="text-xs font-mono font-semibold text-cyan-400">
                    {ev.distance_meters != null ? `${Math.round(ev.distance_meters)}m` : '0m'}
                  </span>
                </div>
              </div>
            </div>

            {/* Agent Chain Evidence Points */}
            {result.evidence && result.evidence.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Agent Decision Audit Trail</span>
                </div>

                <div className="space-y-2">
                  {result.evidence.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] text-xs text-slate-300 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Preview */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>Payload Data</span>
              </div>
              <pre className="p-4 rounded-xl bg-[#070B14] border border-white/[0.06] text-xs font-mono text-slate-300 overflow-x-auto max-h-56 custom-scrollbar">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EvidenceModal;
