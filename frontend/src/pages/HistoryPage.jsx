import React, { useEffect, useState } from 'react';
import { Clock, Search, Trash2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const HistoryPage = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const historyRef = collection(db, 'search_history');
    const q = query(
      historyRef,
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching history:", error);
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

  const filteredHistory = history.filter(item => 
    item.originalAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.normalizedAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Clock className="text-blue-500" size={28} />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Search History</h1>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search history..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      
      <div className="flex-1 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8">
            <Clock size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No history found.</p>
          </div>
        ) : (
          <div className="overflow-y-auto h-full p-4">
            <AnimatePresence>
              {filteredHistory.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start justify-between p-4 mb-3 bg-gray-50 dark:bg-navy-800/50 rounded-xl border border-gray-100 dark:border-navy-700/50 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.originalAddress}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.normalizedAddress}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        {item.confidence && (
                          <span className={`px-2 py-0.5 rounded-full ${
                            item.confidence === 'High' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                            item.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {item.confidence} Confidence
                          </span>
                        )}
                        {item.processingTime && <span>{item.processingTime}ms</span>}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete record"
                  >
                    <Trash2 size={18} />
                  </button>
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
