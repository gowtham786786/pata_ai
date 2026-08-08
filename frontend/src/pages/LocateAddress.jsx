import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search as SearchIcon, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { locateAddress } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import AgentFeed from '../components/AgentFeed';
import TopNavigation from '../components/TopNavigation';
import MetricCards from '../components/MetricCards';
import EvidenceModal from '../components/EvidenceModal'; // Assuming we have it

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

// Custom candidate icon
const candidateIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapController = ({ center, zoom, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.flyTo(center, zoom, { duration: 2 });
    }
  }, [center, zoom, bounds, map]);
  return null;
};

const LocateAddress = () => {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('idle'); // idle, resolving, resolved, error, conflict
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [conflictData, setConflictData] = useState(null);
  const [showEvidence, setShowEvidence] = useState(false);

  const { currentUser } = useAuth();

  const handleLocate = async (e, forceSource = null) => {
    if (e) e.preventDefault();
    if (!address.trim()) return;

    setStatus('resolving');
    setErrorMsg('');
    setConflictData(null);
    setResult(null);
    
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const responseData = await locateAddress(address, token, forceSource);
      
      if (responseData.success) {
        const payload = responseData.data;
        
        // Pass candidates down
        payload.candidates = responseData.candidates || [];
        payload.parsedEntities = responseData.parsedEntities || {};
        
        setResult(payload);
        
        const totalRealTimeMs = payload.agentSteps ? payload.agentSteps.reduce((acc, step) => acc + (step.timeMs || 10), 0) : 100;
        
        setTimeout(() => {
           setStatus('resolved');
        }, totalRealTimeMs + 50);
      } else if (responseData.isConflict) {
        setStatus('conflict');
        setConflictData(responseData.conflictDetails);
      } else {
        setStatus('error');
        setErrorMsg(responseData.message || 'Failed to process address.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Connection to backend failed.');
    }
  };

  let chipColor = 'bg-slate-700 text-slate-300';
  if (status === 'resolved' && result) {
    if (result.confidence === 'HIGH') chipColor = 'bg-signal-high text-white';
    if (result.confidence === 'MEDIUM') chipColor = 'bg-signal-med text-navy-950';
    if (result.confidence === 'LOW') chipColor = 'bg-signal-low text-white';
  }

  const defaultCenter = [20.5937, 78.9629];
  const mapCenter = status === 'resolved' && result?.latitude ? [result.latitude, result.longitude] : defaultCenter;
  const mapZoom = status === 'resolved' ? 15 : 5;
  
  const mapBounds = status === 'resolved' && result?.candidates?.length > 0 
    ? result.candidates.filter(c => c.lat && c.lon).map(c => [c.lat, c.lon]) 
    : (result?.latitude ? [[result.latitude, result.longitude]] : null);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 text-slate-200 font-sans overflow-y-auto overflow-x-hidden relative z-10">
      
      <TopNavigation />
      <MetricCards />

      {/* Cyber Search Bar */}
      <div className="mb-6 z-10 relative">
        <form onSubmit={handleLocate} className="flex w-full max-w-4xl mx-auto shadow-glow-cyan">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full bg-cyber-900/80 backdrop-blur-md border-2 border-electric-glow/30 border-r-0 text-white px-6 py-4 rounded-l-xl focus:outline-none focus:border-electric-glow focus:shadow-[inset_0_0_20px_rgba(0,240,255,0.2)] transition-all text-lg font-mono placeholder:text-slate-500"
              placeholder="Enter complex Indian address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={status === 'resolving'}
            />
            <div className="absolute left-6 bottom-1 flex gap-2">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Autosuggest Enabled</span>
              <span className="text-[9px] uppercase tracking-widest text-electric-glow font-bold animate-pulse">Live</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={status === 'resolving' || !address.trim()}
            className="bg-electric-500 hover:bg-electric-400 disabled:bg-cyber-800 text-white px-8 py-4 rounded-r-xl font-bold uppercase tracking-widest flex items-center transition-all border-2 border-electric-500 border-l-0 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.8)] disabled:shadow-none disabled:border-cyber-700 disabled:text-slate-500"
          >
            {status === 'resolving' ? <Loader2 className="animate-spin w-6 h-6" /> : <SearchIcon className="w-6 h-6 mr-3" />}
            {status === 'resolving' ? 'Initializing...' : 'Locate'}
          </button>
        </form>
      </div>

      {errorMsg && (
         <div className="mb-4 p-4 glass-panel-neon border-signal-low/50 text-signal-low rounded-xl text-sm text-center shadow-lg animate-pulse-slow font-mono uppercase tracking-widest">
            {errorMsg}
         </div>
      )}

      {status === 'conflict' && conflictData ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-navy-900 border-2 border-signal-low rounded-lg p-6 lg:p-8 max-w-2xl w-full shadow-2xl">
             <p>Conflict Detected...</p>
             <button onClick={() => setStatus('idle')} className="mt-4 p-2 bg-slate-700">Go back</button>
          </div>
        </div>
      ) : (
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-0">
        
        {/* COLUMN 1: LEFT PANEL (Parsed Fields & Final Result) */}
        <div className="order-3 lg:order-1 lg:col-span-3 flex flex-col space-y-4 lg:space-y-6 overflow-y-auto pr-1">
          
          <div className="bg-navy-900 rounded-lg p-4 shadow-panel border border-slate-800">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Original Input</h3>
            <p className={clsx("text-sm font-medium leading-relaxed font-mono", status === 'idle' ? 'text-slate-600' : 'text-slate-200')}>
              {status === 'idle' ? '— waiting for input' : address}
            </p>
          </div>

          <div className="bg-navy-900 rounded-lg p-4 shadow-panel border border-slate-800 flex-1 flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Parsed Fields (Agent 1)</h3>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {['landmark', 'relation', 'locality', 'city', 'district', 'state', 'pincode', 'street', 'house_number', 'language'].map(field => (
                 <div key={field} className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                    <span className="text-xs text-slate-400 capitalize">{field.replace('_', ' ')}</span>
                    <span className={clsx("text-xs font-semibold", status === 'resolved' && result?.parsedEntities?.[field] ? 'text-electric-glow' : 'text-slate-600')}>
                       {status === 'resolved' ? (result?.parsedEntities?.[field] || 'null') : '—'}
                    </span>
                 </div>
              ))}
            </div>
          </div>

          <div className="bg-navy-900 rounded-lg p-4 shadow-panel border border-slate-800 flex flex-col">
             <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Final Geocoded Result</h3>
             <div className="text-sm font-medium text-white mb-2">{status === 'resolved' ? result?.normalizedAddress : '—'}</div>
             <div className="flex gap-4 text-xs font-mono text-slate-400 mb-4">
                <span>Lat: {status === 'resolved' && result?.latitude ? result.latitude.toFixed(5) : '—'}</span>
                <span>Lon: {status === 'resolved' && result?.longitude ? result.longitude.toFixed(5) : '—'}</span>
             </div>
             
             {status === 'resolved' && (
               <button 
                 onClick={() => setShowEvidence(true)}
                 className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-md transition-colors border border-slate-700 font-semibold flex items-center justify-center gap-2"
               >
                 <CheckCircle2 className="w-4 h-4 text-signal-high" /> View Evidence Audit
               </button>
             )}
          </div>
        </div>

        {/* COLUMN 2: CENTER PANEL (Live Map & Candidates) */}
        <div className="order-1 lg:order-2 lg:col-span-6 flex flex-col gap-4 min-h-[500px]">
          <div className="relative rounded-lg overflow-hidden shadow-panel border border-slate-800 flex-1 min-h-[300px]">
            <div className="absolute top-4 left-4 z-[1000]">
              <div className={clsx("px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-colors", chipColor)}>
                 <div className={clsx("w-1.5 h-1.5 rounded-full bg-current", status === 'idle' ? '' : 'opacity-70')}></div>
                 {status === 'resolved' ? `${result.confidence} Confidence` : 'Awaiting Data'}
              </div>
            </div>
            
            <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full z-0" zoomControl={false}>
              <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />
              <TileLayer
                className="map-tiles-dark"
                attribution='&copy; OSM'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomleft" />
              
              {status === 'resolved' && result && (
                 <Marker position={[result.latitude, result.longitude]} zIndexOffset={1000}>
                   <Popup className="text-navy-950 font-medium text-xs">Selected: {result.normalizedAddress}</Popup>
                 </Marker>
              )}

              {status === 'resolved' && result?.candidates?.map((cand, idx) => (
                 (cand.lat !== result.latitude || cand.lon !== result.longitude) ? (
                   <Marker key={idx} position={[cand.lat, cand.lon]} icon={candidateIcon}>
                     <Popup className="text-navy-950 font-medium text-xs">
                       Candidate: {cand.name} <br/> Score: {cand.total_score}
                     </Popup>
                   </Marker>
                 ) : null
              ))}
            </MapContainer>
            
            <style dangerouslySetInnerHTML={{__html: `
              .map-tiles-dark { filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7); }
              .custom-scrollbar::-webkit-scrollbar { width: 4px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
            `}} />
          </div>

          {/* Candidates List Below Map */}
          {status === 'resolved' && result?.candidates?.length > 0 && (
            <div className="bg-navy-900 rounded-lg p-4 shadow-panel border border-slate-800 h-48 overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 sticky top-0 bg-navy-900 pb-2 z-10">Candidate Locations Scored (Agent 4)</h3>
              <div className="space-y-2">
                {result.candidates.map((cand, idx) => {
                  const isSelected = cand.lat === result.latitude && cand.lon === result.longitude;
                  return (
                    <div key={idx} className={clsx("flex items-center justify-between p-3 rounded-lg border", isSelected ? "bg-electric-glow/10 border-electric-glow/50" : "bg-navy-950 border-slate-800")}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <MapPin className={clsx("w-5 h-5 flex-shrink-0", isSelected ? "text-electric-glow" : "text-slate-500")} />
                        <div className="flex flex-col truncate">
                          <span className={clsx("text-sm font-semibold truncate", isSelected ? "text-electric-glow" : "text-slate-300")}>{cand.name}</span>
                          <span className="text-xs text-slate-500">{cand.source} • {Math.round(cand.distance_from_ref || 0)}m from Pincode Centroid</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        <span className={clsx("text-lg font-bold font-mono", isSelected ? "text-signal-high" : "text-slate-400")}>{cand.total_score}</span>
                        <span className="text-[9px] uppercase text-slate-500">Score</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 3: RIGHT PANEL (Agent Feed) */}
        <div className="order-2 lg:order-3 lg:col-span-3 h-[400px] lg:h-auto">
          <AgentFeed status={status} result={result} />
        </div>

      </div>
      )}

      {showEvidence && status === 'resolved' && result && (
        <EvidenceModal result={result} onClose={() => setShowEvidence(false)} />
      )}
    </div>
  );
};

export default LocateAddress;
