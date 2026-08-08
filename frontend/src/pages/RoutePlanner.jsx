import React, { useState, useEffect, useRef } from 'react';
import { Route, Plus, Trash2, AlertTriangle, Loader2, MapPin, CheckCircle, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { locateAddress } from '../services/apiService';

// Component to adjust map bounds
const MapBounds = ({ stops, isCalculated }) => {
  const map = useMap();
  useEffect(() => {
    const validCoords = stops
      .filter(s => s.resolvedData?.latitude && s.resolvedData?.longitude)
      .map(s => [s.resolvedData.latitude, s.resolvedData.longitude]);
      
    if (validCoords.length > 0) {
      if (validCoords.length === 1) {
        map.setView(validCoords[0], 13);
      } else {
        const bounds = validCoords;
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [stops, isCalculated, map]);
  return null;
};

const RoutePlanner = () => {
  const { currentUser } = useAuth();
  const [stops, setStops] = useState([
    { id: 'start', inputString: '', resolvedData: null, loading: false, label: 'Start Location' },
    { id: 'stop-1', inputString: '', resolvedData: null, loading: false, label: 'Drop 1' }
  ]);
  const [isCalculated, setIsCalculated] = useState(false);

  const handleAddStop = () => {
    const newId = `stop-${Date.now()}`;
    setStops([...stops, { id: newId, inputString: '', resolvedData: null, loading: false, label: `Drop ${stops.length}` }]);
    setIsCalculated(false);
  };

  const handleRemoveStop = (id) => {
    if (stops.length <= 2) return; // keep at least 2
    const updatedStops = stops.filter(s => s.id !== id);
    // Re-label
    const relabeled = updatedStops.map((s, idx) => {
      if (idx === 0) return { ...s, label: 'Start Location' };
      return { ...s, label: `Drop ${idx}` };
    });
    setStops(relabeled);
    setIsCalculated(false);
  };

  const handleInputChange = (id, value) => {
    setStops(stops.map(s => s.id === id ? { ...s, inputString: value, resolvedData: null } : s));
    setIsCalculated(false);
  };

  const handleVerify = async (id) => {
    const stop = stops.find(s => s.id === id);
    if (!stop || !stop.inputString.trim()) return;

    setStops(stops.map(s => s.id === id ? { ...s, loading: true, resolvedData: null } : s));
    
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const result = await locateAddress(stop.inputString, token);
      
      setStops(prev => prev.map(s => {
        if (s.id === id) {
          if (result && result.latitude && result.longitude) {
            return { ...s, loading: false, resolvedData: result };
          }
          return { ...s, loading: false, resolvedData: { error: 'Could not resolve address' } };
        }
        return s;
      }));
    } catch (error) {
      console.error("Verification error:", error);
      setStops(prev => prev.map(s => s.id === id ? { ...s, loading: false, resolvedData: { error: 'API Error' } } : s));
    }
  };

  const resolvedCount = stops.filter(s => s.resolvedData && s.resolvedData.latitude).length;
  const canCalculate = resolvedCount >= 2;

  const handleCalculateRoute = () => {
    if (canCalculate) {
      setIsCalculated(true);
    }
  };

  const getConfidenceColor = (conf) => {
    if (conf === 'High') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (conf === 'Medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  // Extract polyline points
  const polylinePositions = isCalculated 
    ? stops.filter(s => s.resolvedData && s.resolvedData.latitude).map(s => [s.resolvedData.latitude, s.resolvedData.longitude])
    : [];

  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <Route className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">Multi-Stop Route Planner</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Logistics Routing & ETA</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        <div className="bg-navy-900 border border-slate-800 rounded-lg shadow-panel p-6 flex flex-col h-full max-h-[calc(100vh-180px)]">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Waypoints</h3>
              <span className="text-xs font-mono bg-navy-950 px-2 py-1 rounded text-slate-500">{resolvedCount}/{stops.length} Resolved</span>
           </div>
           
           <div className="space-y-5 overflow-y-auto custom-scrollbar pr-2 flex-1 pb-4">
             {stops.map((stop, idx) => {
               const isResolved = stop.resolvedData && stop.resolvedData.latitude;
               
               return (
               <div key={stop.id} className="relative bg-navy-950 border border-slate-800 rounded-lg p-5 group w-full overflow-hidden">
                 <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                      <MapPin size={12} className="mr-2" />
                      {stop.label}
                    </label>
                    {idx > 0 && (
                      <button onClick={() => handleRemoveStop(stop.id)} className="text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                 </div>
                 
                 <div className="flex space-x-3 w-full">
                   <input 
                     type="text" 
                     value={stop.inputString}
                     onChange={(e) => handleInputChange(stop.id, e.target.value)}
                     onBlur={() => handleVerify(stop.id)}
                     onKeyDown={(e) => e.key === 'Enter' && handleVerify(stop.id)}
                     placeholder="Enter messy address..."
                     className="flex-1 min-w-0 bg-navy-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-electric"
                   />
                   <button 
                     onClick={() => handleVerify(stop.id)}
                     disabled={stop.loading || !stop.inputString.trim()}
                     className={`shrink-0 flex items-center justify-center w-28 py-2 rounded text-xs uppercase font-mono tracking-wider transition-colors ${
                        isResolved 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800'
                     } disabled:opacity-50 disabled:cursor-not-allowed`}
                   >
                     {stop.loading ? (
                       <><Loader2 size={14} className="animate-spin mr-1" /> Chk...</>
                     ) : isResolved ? (
                       <><CheckCircle size={14} className="mr-1" /> Re-verify</>
                     ) : (
                       'Verify'
                     )}
                   </button>
                 </div>

                 {/* Resolution Result */}
                 {isResolved && (
                   <div className="mt-4 p-3 bg-navy-900 border border-slate-700/50 rounded flex items-start space-x-3 w-full">
                      {stop.resolvedData.confidence === 'Low' ? (
                        <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-400 leading-tight break-words">
                          {stop.resolvedData.correctedAddress || stop.resolvedData.normalizedAddress}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getConfidenceColor(stop.resolvedData.confidence)}`}>
                             {stop.resolvedData.confidence}
                           </span>
                           <span className="text-[10px] font-mono text-slate-500 truncate">
                             {stop.resolvedData.latitude.toFixed(4)}, {stop.resolvedData.longitude.toFixed(4)}
                           </span>
                        </div>
                      </div>
                   </div>
                 )}
                 {stop.resolvedData && stop.resolvedData.error && (
                   <div className="mt-3 text-xs text-rose-500 flex items-center w-full">
                     <AlertTriangle size={12} className="mr-1 shrink-0" /> <span className="truncate">{stop.resolvedData.error}</span>
                   </div>
                 )}
               </div>
               );
             })}
             
             <button 
               onClick={handleAddStop}
               className="w-full py-3 border border-dashed border-slate-700 hover:border-electric/50 text-slate-400 hover:text-electric flex items-center justify-center rounded text-xs font-mono uppercase tracking-widest transition-colors"
             >
               <Plus size={16} className="mr-2" /> Add Drop Location
             </button>
           </div>
           
           <div className="pt-4 border-t border-slate-800 mt-auto">
             <button 
               onClick={handleCalculateRoute}
               disabled={!canCalculate}
               className={`w-full py-3 rounded font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center ${
                 canCalculate 
                   ? 'bg-electric hover:bg-electric-hover text-navy-950 shadow-glow-cyan font-bold' 
                   : 'bg-slate-800 text-slate-500 cursor-not-allowed'
               }`}
             >
               <Navigation size={16} className="mr-2" />
               {isCalculated ? 'Recalculate Route' : 'Calculate Route'}
             </button>
             {!canCalculate && (
                <p className="text-center text-[10px] text-slate-500 mt-2">Resolve at least 2 locations to calculate</p>
             )}
           </div>
        </div>

        <div className="lg:col-span-2 bg-navy-900 border border-slate-800 rounded-lg shadow-panel overflow-hidden relative z-0 h-full min-h-[500px]">
            <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}>
                 <TileLayer 
                   url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                   attribution='&copy; CARTO'
                 />
                 
                 {stops.map((stop, idx) => {
                   if (stop.resolvedData?.latitude && stop.resolvedData?.longitude) {
                     return (
                       <Marker key={stop.id} position={[stop.resolvedData.latitude, stop.resolvedData.longitude]}>
                         <Popup className="custom-popup bg-navy-950 border border-slate-800">
                           <div className="text-xs text-slate-200">
                             <div className="font-bold mb-1 text-electric">{stop.label}</div>
                             <div className="text-slate-400 mb-1">{stop.inputString}</div>
                             <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase border ${getConfidenceColor(stop.resolvedData.confidence)}`}>
                               {stop.resolvedData.confidence} Conf
                             </div>
                           </div>
                         </Popup>
                       </Marker>
                     );
                   }
                   return null;
                 })}

                 {isCalculated && polylinePositions.length >= 2 && (
                   <Polyline 
                     positions={polylinePositions} 
                     pathOptions={{ color: '#00f0ff', weight: 3, dashArray: '5, 10', opacity: 0.8 }} 
                   />
                 )}
                 
                 <MapBounds stops={stops} isCalculated={isCalculated} />
            </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;
