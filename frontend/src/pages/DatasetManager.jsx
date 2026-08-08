import React from 'react';
import { Database, Upload, RefreshCw, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const DatasetManager = () => {
  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <Database className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">Dataset Manager</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Data Ingestion & Indexing</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-navy-900 border border-slate-800 rounded-lg shadow-panel p-6">
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Upload Dataset</h3>
             <div className="border-2 border-dashed border-slate-700 hover:border-electric/50 bg-navy-950/50 rounded-lg p-12 text-center transition-colors cursor-pointer flex flex-col items-center justify-center">
                <Upload className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-slate-300 font-medium mb-1">Drag and drop CSV or GeoJSON files here</p>
                <p className="text-slate-500 text-sm font-mono mb-4">Supported: Pincode Data, Village Data, Landmarks</p>
                <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-xs uppercase tracking-widest transition-colors border border-slate-600">
                  Browse Files
                </button>
             </div>
          </div>

          <div className="bg-navy-900 border border-slate-800 rounded-lg shadow-panel p-6">
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Active Datasets</h3>
             <div className="space-y-4">
                {[
                  { name: 'India Pincode Directory', rows: '1,56,432', lastUpdated: '2 days ago', health: '99%' },
                  { name: 'Village Boundaries (GeoJSON)', rows: '6,45,112', lastUpdated: '1 month ago', health: '95%' },
                  { name: 'Custom Landmarks (Corrections)', rows: '4,521', lastUpdated: '10 mins ago', health: '100%' },
                ].map(ds => (
                  <div key={ds.name} className="flex justify-between items-center p-4 bg-navy-950 border border-slate-800 rounded">
                    <div className="flex items-center space-x-3">
                      <FileText className="text-electric w-5 h-5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{ds.name}</p>
                        <p className="text-xs text-slate-500 font-mono">Updated: {ds.lastUpdated}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-mono text-slate-300">{ds.rows} Records</p>
                       <p className="text-xs text-emerald-500 font-mono">{ds.health} Valid</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-navy-900 border border-slate-800 rounded-lg shadow-panel p-6">
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Actions</h3>
             <div className="space-y-3">
               <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-electric/10 border border-electric/30 text-electric hover:bg-electric/20 rounded font-mono text-xs uppercase tracking-widest transition-colors">
                 <RefreshCw size={14} />
                 <span>Re-index Database</span>
               </button>
               <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-xs uppercase tracking-widest transition-colors border border-slate-600">
                 <Database size={14} />
                 <span>Clear Orphaned Records</span>
               </button>
             </div>
           </div>

           <div className="bg-navy-900 border border-slate-800 rounded-lg shadow-panel p-6">
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Storage Stats</h3>
             <div className="space-y-4">
                <div>
                   <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                     <span>Firestore</span>
                     <span>45MB / 1GB</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[4.5%]"></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                     <span>In-Memory Cache (Redis)</span>
                     <span>1.2GB / 2GB</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 w-[60%]"></div>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetManager;
