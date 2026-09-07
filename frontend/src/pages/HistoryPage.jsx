import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Trash2, 
  MapPin, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Loader2, 
  History as HistoryIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import TopNavigation from '../components/TopNavigation';

const HistoryPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const historyRef = collection(db, 'search_history');
    const q = query(
      historyRef,
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      
      // Sort in memory to avoid needing a composite index in Firestore
      data.sort((a, b) => b.timestamp - a.timestamp);
      if (data.length === 0) {
        try {
          const local = JSON.parse(localStorage.getItem('pataai_local_history') || '[]');
          if (local.length > 0) data = local;
        } catch (e) {
          // ignore
        }
      }
      setHistory(data);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore history read notice, using local cache fallback:", error.message);
      try {
        const local = JSON.parse(localStorage.getItem('pataai_local_history') || '[]');
        setHistory(local);
      } catch (e) {
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'search_history', id));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHistory = history.filter(item => 
    item.originalAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.normalizedAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 min-h-full flex flex-col font-sans text-slate-100 pb-10 overflow-y-auto custom-scrollbar">
      <TopNavigation 
        title="Search History" 
        subtitle="Recent address resolution queries, coordinates, and agent execution logs"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Filter by original address or landmark..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0F172A]/90 border border-white/[0.08] focus:border-blue-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{filteredHistory.length} saved records</span>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 glass-card rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col min-h-[300px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
            <span className="text-xs">Loading search history...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/[0.06] flex items-center justify-center text-slate-500 mb-3">
              <HistoryIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">No History Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchTerm ? 'No addresses match your filter query.' : 'Run your first address resolution from the Address Resolver tab to populate this timeline.'}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {filteredHistory.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 border border-white/[0.05] hover:border-white/[0.12] transition-all group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-white truncate">
                          {item.normalizedAddress || item.originalAddress}
                        </span>
                        {item.confidence && (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            item.confidence.toUpperCase() === 'HIGH' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : item.confidence.toUpperCase() === 'MEDIUM' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {item.confidence}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 truncate mb-2">
                        Input: <span className="font-mono text-slate-300">{item.originalAddress}</span>
                      </p>

                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 flex-wrap">
                        <span>{new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        {item.latitude && (
                          <span className="text-cyan-400">
                            {item.latitude.toFixed(4)}, {item.longitude?.toFixed(4)}
                          </span>
                        )}
                        {item.processingTime && (
                          <span className="text-slate-400">{item.processingTime}ms</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {item.latitude && (
                      <button
                        onClick={() => handleCopy(item.id, `${item.latitude}, ${item.longitude}`)}
                        className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                        title="Copy Coordinates"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}

                    <button
                      onClick={() => navigate('/user/locate')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-medium transition-all"
                    >
                      <span>Locate</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
