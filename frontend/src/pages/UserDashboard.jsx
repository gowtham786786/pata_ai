import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Target, Zap, Clock, ShieldCheck, Map as MapIcon, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { getHistory } from '../services/apiService';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [recentSearches, setRecentSearches] = useState([]);
  const [stats, setStats] = useState({
    todaySearches: 0,
    successRate: 0,
    avgConfidence: 0,
    avgLatency: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = currentUser ? await currentUser.getIdToken() : null;
        if (!token) return;

        const res = await getHistory(token, currentUser.uid);
        if (res.success && res.data) {
          const logs = res.data;
          setRecentSearches(logs.slice(0, 5));

          const today = new Date().setHours(0, 0, 0, 0);
          const todaysLogs = logs.filter(l => new Date(l.timestamp) >= today);

          let highCount = 0;
          let totalLatency = 0;

          todaysLogs.forEach(log => {
            if (log.confidence === 'High') highCount++;
            totalLatency += log.processingTime || 0;
          });

          setStats({
            todaySearches: todaysLogs.length,
            successRate: todaysLogs.length > 0 ? Math.round((highCount / todaysLogs.length) * 100) : 0,
            avgConfidence: todaysLogs.length > 0 ? Math.round((highCount / todaysLogs.length) * 100) : 0, // Simplified
            avgLatency: todaysLogs.length > 0 ? Math.round(totalLatency / todaysLogs.length) : 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user dashboard data:", error);
      }
    };

    fetchData();
  }, [currentUser]);

  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <LayoutDashboard className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">User Dashboard</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Live Telemetry & Activity</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Today's Searches</h3>
             <p className="text-3xl font-bold font-mono text-slate-100">{stats.todaySearches}</p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><Target className="text-electric w-6 h-6" /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Success Rate</h3>
             <p className="text-3xl font-bold font-mono text-emerald-500">{stats.successRate}%</p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><ShieldCheck className="text-emerald-500 w-6 h-6" /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Avg Latency</h3>
             <p className="text-3xl font-bold font-mono text-amber-500">{stats.avgLatency}<span className="text-sm text-slate-500 ml-1">ms</span></p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><Clock className="text-amber-500 w-6 h-6" /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">AI Status</h3>
             <p className="text-3xl font-bold font-mono text-sky-500">ONLINE</p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><Zap className="text-sky-500 w-6 h-6" /></div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
        {/* Live Map */}
        <div className="lg:col-span-2 flex flex-col h-[400px]">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
             <MapIcon className="mr-2 w-4 h-4" /> Live Activity Map
          </h2>
          <div className="flex-1 bg-navy-900 border border-slate-800 rounded-lg shadow-panel overflow-hidden relative z-0">
             <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}>
                <TileLayer
                  className="map-tiles-dark"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OSM'
                />
                {recentSearches.map((loc, idx) => {
                  if (loc.latitude && loc.longitude) {
                    return (
                      <CircleMarker 
                        key={idx} 
                        center={[loc.latitude, loc.longitude]} 
                        radius={6}
                        pathOptions={{ color: '#00f0ff', fillColor: '#00f0ff', fillOpacity: 0.6 }}
                      >
                        <Popup className="custom-popup bg-navy-950 border border-slate-800 text-slate-200">
                          <div className="text-xs">
                            <div className="font-bold mb-1 text-electric">{loc.originalAddress}</div>
                            <div className="text-slate-500">{new Date(loc.timestamp).toLocaleString()}</div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )
                  }
                  return null;
                })}
             </MapContainer>
          </div>
        </div>

        {/* Recent Searches List */}
        <div className="flex flex-col h-[400px]">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
             <History className="mr-2 w-4 h-4" /> Recent Searches
          </h2>
          <div className="flex-1 bg-navy-900 border border-slate-800 rounded-lg shadow-panel overflow-y-auto p-4 custom-scrollbar">
            {recentSearches.length === 0 ? (
               <div className="text-slate-500 text-sm font-mono text-center mt-10">No recent activity found.</div>
            ) : (
               recentSearches.map((search, idx) => (
                 <div key={idx} className="mb-4 p-3 border border-slate-800 bg-navy-950 rounded shadow-sm hover:border-electric/30 transition-colors">
                    <div className="text-xs text-slate-500 font-mono mb-1 flex justify-between">
                       <span>{new Date(search.timestamp).toLocaleTimeString()}</span>
                       <span className={search.confidence === 'High' ? 'text-emerald-500' : 'text-rose-500'}>
                         {search.confidence} Conf
                       </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 truncate">
                       {search.originalAddress}
                    </div>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
