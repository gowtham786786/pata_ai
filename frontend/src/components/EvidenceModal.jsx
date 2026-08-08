import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ShieldAlert, Code2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EvidenceModal = ({ isOpen, onClose, result }) => {
  if (!isOpen || !result) return null;
  
  // Find the selected candidate to show the exact evidence
  const candidate = result.candidates?.find(c => c.lat === result.latitude && c.lon === result.longitude) || {};
  const ev = candidate.evidence_details || {};

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
                Geospatial Evidence Audit
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
            
            {/* WHY THIS LOCATION Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-electric" />
                WHY THIS LOCATION?
              </h3>
              
              <div className="bg-navy-900 rounded-lg border border-slate-800 overflow-hidden">
                 <table className="w-full text-left text-sm text-slate-300">
                    <tbody className="divide-y divide-slate-800/50">
                       <tr className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-400">Pincode</td>
                          <td className="px-4 py-3">{ev.pincode_match === true ? 'Match' : (ev.pincode_match || 'Mismatch/Unknown')}</td>
                       </tr>
                       <tr className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-400">City</td>
                          <td className="px-4 py-3">{ev.city_match === true ? 'Match' : (ev.city_match || 'Mismatch/Unknown')}</td>
                       </tr>
                       <tr className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-400">Locality</td>
                          <td className="px-4 py-3">{ev.locality_match === true ? 'Match' : (ev.locality_match || 'Mismatch/Unknown')}</td>
                       </tr>
                       <tr className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-400">Landmark</td>
                          <td className="px-4 py-3">{ev.landmark_match === true ? 'Match' : (ev.landmark_match || 'Mismatch/Unknown')}</td>
                       </tr>
                       <tr className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-400">OSM Verified</td>
                          <td className="px-4 py-3">{candidate.source === 'OpenStreetMap' ? 'Yes' : 'No'}</td>
                       </tr>
                       <tr className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-400">Distance from Pincode Centroid</td>
                          <td className="px-4 py-3">{candidate.distance_from_ref ? `${Math.round(candidate.distance_from_ref)} meters` : 'N/A'}</td>
                       </tr>
                       <tr className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-400">Direction Match</td>
                          <td className="px-4 py-3">{ev.direction_match || 'Not Evaluated'}</td>
                       </tr>
                       <tr className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-400">Final Score</td>
                          <td className="px-4 py-3 font-bold text-signal-high">{candidate.total_score || result.confidenceScore || 0}/100</td>
                       </tr>
                       <tr className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-semibold text-slate-400">Source</td>
                          <td className="px-4 py-3">{candidate.source || result.locationSource || 'Unknown'}</td>
                       </tr>
                    </tbody>
                 </table>
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
                    {result.evidence.map((evItem, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-slate-600 select-none">[{String(idx + 1).padStart(2, '0')}]</span>
                        <span className="text-emerald-400">{evItem}</span>
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
