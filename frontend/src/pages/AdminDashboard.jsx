import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Activity, CheckCircle, AlertTriangle, ListFilter, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfidenceRing from '../components/ConfidenceRing';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getGeocodeLogs, getCorrections } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [stats, setStats] = useState({
    totalGeocodes: 0,
    highConfPercentage: 0,
    verifiedCorrectionPercentage: 0,
    avgProcessingTime: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = currentUser ? await currentUser.getIdToken() : null;
        
        // Fetch logs and corrections
        const [logsResponse, correctionsResponse] = await Promise.all([
          getGeocodeLogs(token),
          getCorrections(token)
        ]);

        if (logsResponse.success) {
          const logData = logsResponse.data;
          setLogs(logData);
          
          // Calculate Stats
          const total = logData.length;
          let highCount = 0;
          let verifiedCount = 0;
          let totalTime = 0;

          logData.forEach(log => {
            if (log.confidence_level === 'High') highCount++;
            if (log.locationSource === 'verified_correction') verifiedCount++;
            totalTime += (log.processing_time_ms || 0);
          });

          setStats({
            totalGeocodes: total,
            highConfPercentage: total > 0 ? Math.round((highCount / total) * 100) : 0,
            verifiedCorrectionPercentage: total > 0 ? Math.round((verifiedCount / total) * 100) : 0,
            avgProcessingTime: total > 0 ? Math.round(totalTime / total) : 0
          });
        }

        if (correctionsResponse.success) {
          setCorrections(correctionsResponse.data);
        }

      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      }
    };

    fetchData();
  }, [currentUser]);

  // Color mapping based on user instructions: "calibrated colors, not default traffic-light"
  const getConfidenceColor = (level) => {
    switch (level) {
      case 'Low': return '#f43f5e'; // Rose-500 (Denser/redder for weakness)
      case 'Medium': return '#8b5cf6'; // Violet-500
      case 'High': return '#0ea5e9'; // Sky-500 (Clean, non-green)
      default: return '#64748b';
    }
  };

  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <LayoutDashboard className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">System Admin</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Geospatial Telemetry & Feedback</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Geocodes</h3>
             <p className="text-3xl font-bold font-mono text-slate-100">{stats.totalGeocodes.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><Activity className="text-electric w-6 h-6" /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">High Confidence</h3>
             <p className="text-3xl font-bold font-mono text-sky-500">{stats.highConfPercentage}%</p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><CheckCircle className="text-sky-500 w-6 h-6" /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Verified Used</h3>
             <p className="text-3xl font-bold font-mono text-violet-500">{stats.verifiedCorrectionPercentage}%</p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><ListFilter className="text-violet-500 w-6 h-6" /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-navy-900 border border-slate-800 p-6 rounded-lg shadow-panel flex items-center justify-between"
        >
          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Avg Process</h3>
             <p className="text-3xl font-bold font-mono text-signal-med">{stats.avgProcessingTime}<span className="text-sm text-slate-500 ml-1">ms</span></p>
          </div>
          <div className="p-3 bg-navy-950 rounded border border-slate-800"><AlertTriangle className="text-signal-med w-6 h-6" /></div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
        {/* Heatmap Section */}
        <div className="lg:col-span-2 flex flex-col h-[500px]">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
             <MapPin className="mr-2 w-4 h-4" /> Low-Confidence Heatmap
          </h2>
          <div className="flex-1 bg-navy-900 border border-slate-800 rounded-lg shadow-panel overflow-hidden relative z-0">
             <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}>
                <TileLayer
                  className="map-tiles-dark"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OSM'
                />
                {logs.map((log, idx) => {
                  if (log.latitude && log.longitude) {
                     return (
                       <Marker 
                         key={log.id || idx}
                         position={[log.latitude, log.longitude]}
                       >
                         <Popup className="custom-popup bg-navy-950 border border-slate-800 text-slate-200">
                           <div className="text-xs">
                             <div className="font-bold mb-1 text-electric">{log.original_address}</div>
                             <div>Conf: <span style={{color: getConfidenceColor(log.confidence_level)}}>{log.confidence_level}</span> ({log.confidence_score})</div>
                             <div className="text-slate-500 mt-1">{new Date(log.timestamp).toLocaleString()}</div>
                           </div>
                         </Popup>
                       </Marker>
                     )
                  }
                  return null;
                })}
             </MapContainer>
          </div>
        </div>

        {/* Recent Corrections Feed */}
        <div className="flex flex-col h-[500px]">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
             <CheckCircle className="mr-2 w-4 h-4 text-violet-500" /> Recent Corrections
          </h2>
          <div className="flex-1 bg-navy-900 border border-slate-800 rounded-lg shadow-panel overflow-y-auto p-4 custom-scrollbar">
             {corrections.length === 0 ? (
               <div className="text-slate-500 text-sm font-mono text-center mt-10">No verified corrections yet.</div>
             ) : (
               corrections.map((corr, idx) => (
                 <div key={corr.id || idx} className="mb-4 p-4 border border-slate-800 bg-navy-950 rounded-lg shadow-sm">
                    <div className="text-xs text-slate-500 font-mono mb-2 flex justify-between">
                       <span>{new Date(corr.timestamp).toLocaleString()}</span>
                       <span className="text-violet-500 font-bold">{corr.status}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mb-1 line-clamp-2">
                       {corr.original_address}
                    </div>
                    {corr.landmark_text && (
                       <div className="text-xs text-slate-400 mt-2 bg-navy-900 p-2 rounded border border-slate-800">
                         Matched: <span className="text-slate-300 font-mono">{corr.landmark_text}</span>
                       </div>
                    )}
                    <div className="text-[10px] text-slate-500 mt-2 font-mono">
                      Location updated to {corr.corrected_geocode?.lat?.toFixed(4)}, {corr.corrected_geocode?.lon?.toFixed(4)}
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

export default AdminDashboard;
