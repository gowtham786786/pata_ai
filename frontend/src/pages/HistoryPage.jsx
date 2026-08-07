import React from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const HistoryPage = () => {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-8">
        <Clock className="text-primary" size={28} />
        <h1 className="text-3xl font-bold">Search History</h1>
      </div>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 bg-panel border border-slate-700 rounded-2xl p-8 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">History tracking will be implemented in Step 10 via Firebase.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default HistoryPage;
