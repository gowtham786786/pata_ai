import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Route, Plus, Trash2, AlertTriangle, Loader2, MapPin, CheckCircle, Navigation, X, Clock, Map, Truck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { locateAddress } from '../services/apiService';

// Haversine distance calculation
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI/180);
  const dLon = (lon2 - lon1) * (Math.PI/180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
};

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

const RouteSummaryModal = ({ isOpen, onClose, stops }) => {
  if (!isOpen) return null;

  const validStops = stops.filter(s => s.resolvedData?.latitude && s.resolvedData?.longitude);
  
  let totalDistance = 0;
  const legs = [];

  for (let i = 0; i < validStops.length - 1; i++) {
    const p1 = validStops[i];
    const p2 = validStops[i+1];
    const dist = getDistanceFromLatLonInKm(
      p1.resolvedData.latitude, p1.resolvedData.longitude,
      p2.resolvedData.latitude, p2.resolvedData.longitude
    );
    totalDistance += dist;
    
    // Add 20% for road distance approximation
    const roadDist = dist * 1.2;
    
    legs.push({
      from: p1,
      to: p2,
      straightDist: dist,
      roadDist: roadDist,
      timeHrs: roadDist / 40 // assuming 40 km/h avg truck speed
    });
  }

  const totalRoadDistance = totalDistance * 1.2;
  const totalTimeHrs = totalRoadDistance / 40;
  const totalTimeStr = `${Math.floor(totalTimeHrs)}h ${Math.round((totalTimeHrs % 1) * 60)}m`;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-lg h-full bg-navy-950 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-navy-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric/20 text-electric flex items-center justify-center border border-electric/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
               <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider">Route Summary</h2>
               <p className="text-xs text-slate-400 font-mono">Calculated Logistics Plan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors bg-navy-800 hover:bg-slate-700 p-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-navy-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <Map className="w-6 h-6 text-emerald-400 mb-2" />
              <span className="text-2xl font-bold text-slate-100">{totalRoadDistance.toFixed(1)} <span className="text-sm font-normal text-slate-500">km</span></span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Total Distance</span>
            </div>
            <div className="bg-navy-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <Clock className="w-6 h-6 text-blue-400 mb-2" />
              <span className="text-2xl font-bold text-slate-100">{totalTimeStr}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Est. Travel Time</span>
            </div>
          </div>

          <div className="bg-electric/10 border border-electric/20 rounded-lg p-4 flex items-start gap-3">
            <Truck className="w-5 h-5 text-electric shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Estimates are based on straight-line distances with a 20% road routing buffer and an average commercial vehicle speed of 40 km/h.
            </p>
          </div>

          {/* Route Legs */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Route Breakdown</h3>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-800"></div>
              <div className="space-y-6 relative">
                {validStops.map((stop, index) => {
                  const leg = legs[index];
                  return (
                    <div key={stop.id} className="relative pl-10">
                      <div className="absolute left-[11px] top-1 w-3 h-3 rounded-full border-2 border-navy-950 bg-electric"></div>
                      <div className="bg-navy-900 p-4 rounded-lg border border-slate-800 shadow-sm">
                        <div className="text-[10px] font-bold text-electric uppercase tracking-widest mb-1">{stop.label}</div>
                        <div className="text-sm font-medium text-slate-200">{stop.resolvedData.correctedAddress || stop.resolvedData.normalizedAddress}</div>
                        
                        {leg && (
                          <div className="mt-4 pt-3 border-t border-slate-800/50 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500 block mb-0.5">Distance to next</span>
                              <span className="font-mono text-slate-300">{leg.roadDist.toFixed(1)} km</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">Time to next</span>
                              <span className="font-mono text-slate-300">{Math.floor(leg.timeHrs)}h {Math.round((leg.timeHrs % 1) * 60)}m</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-navy-900">
           <button className="w-full py-3 bg-electric hover:bg-blue-600 text-white font-bold rounded-lg uppercase tracking-widest transition-colors shadow-glow-cyan">
             Dispatch Route to Driver
           </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>,
    document.body
  );
};

const RoutePlanner = () => {
  const { currentUser } = useAuth();
  const [stops, setStops] = useState([
    { id: 'start', inputString: '', resolvedData: null, loading: false, label: 'Start Location' },
    { id: 'stop-1', inputString: '', resolvedData: null, loading: false, label: 'Drop 1' }
  ]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

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
      const response = await locateAddress(stop.inputString, token);
      
      setStops(prev => prev.map(s => {
        if (s.id === id) {
          if (response && response.success && response.data && response.data.latitude && response.data.longitude) {
            return { ...s, loading: false, resolvedData: response.data };
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
      setShowSummary(true);
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
               Calculate Route
             </button>
             
             {isCalculated && (
               <button 
                 onClick={() => setShowSummary(true)}
                 className="w-full mt-3 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center"
               >
                 View Route Details
               </button>
             )}

             {!canCalculate && (
                <p className="text-center text-[10px] text-slate-500 mt-2">Resolve at least 2 locations to calculate</p>
             )}
           </div>
        </div>

        <div className="lg:col-span-2 bg-navy-900 border border-slate-800 rounded-lg shadow-panel overflow-hidden relative z-0 h-full min-h-[500px]">
            <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}>
                 <TileLayer
                  className="map-tiles-dark"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OSM'
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
      
      <RouteSummaryModal 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)} 
        stops={stops} 
      />
    </div>
  );
};

export default RoutePlanner;
