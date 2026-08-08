import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { locateAddress } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import ConfidenceRing from '../components/ConfidenceRing';
import AgentFeed from '../components/AgentFeed';
import TopNavigation from '../components/TopNavigation';
import MetricCards from '../components/MetricCards';

// Fix Leaflet marker icon issue
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

// Component to handle dynamic map centering
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        duration: 2 // smooth animation
      });
    }
  }, [center, zoom, map]);
  return null;
};

const HomePage = () => {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('idle'); // idle, resolving, resolved, error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [conflictData, setConflictData] = useState(null);

  const { currentUser } = useAuth();

  const handleLocate = async (e, forceSource = null) => {
    if (e) e.preventDefault();
    if (!address.trim()) return;

    setStatus('resolving');
    setErrorMsg('');
    setConflictData(null);
    
    try {
      // Get the Firebase Auth token if the user is logged in
      const token = currentUser ? await currentUser.getIdToken() : null;
      
      // Connect to the Node.js Orchestrator via API Service, passing the token and forceSource
      const responseData = await locateAddress(address, token, forceSource);
      
      if (responseData.success) {
        const payload = responseData.data;
        
        // Immediately set the result so AgentFeed has access to payload.agentSteps
        setResult(payload);
        
        // Calculate the exact real time the backend took for all agents combined
        const totalRealTimeMs = payload.agentSteps ? payload.agentSteps.reduce((acc, step) => acc + (step.timeMs || 10), 0) : 100;
        
        // We wait for the feed animation to finish, which now perfectly matches the real backend execution time!
        // Add a 50ms buffer to ensure React state has settled on the final step
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

  // Safe extractors for the UI
  const extractedPincode = result?.evidence?.find(e => e.includes('Pincode')) ? result.evidence.find(e => e.includes('Pincode')).split("'")[1] : (status === 'resolved' ? 'N/A' : '— awaiting input');
  const extractedLandmark = result?.evidence?.find(e => e.includes('Landmark')) ? result.evidence.find(e => e.includes('Landmark')).split("'")[1] : (status === 'resolved' ? 'N/A' : '— awaiting input');

  let chipColor = 'bg-slate-700 text-slate-300';
  if (status === 'resolved') {
    if (result.confidence === 'High') chipColor = 'bg-signal-high text-white';
    if (result.confidence === 'Medium') chipColor = 'bg-signal-med text-navy-950';
    if (result.confidence === 'Low') chipColor = 'bg-signal-low text-white';
  }

  // Geographic center of India
  const defaultCenter = [20.5937, 78.9629];
  const mapCenter = status === 'resolved' && result?.latitude ? [result.latitude, result.longitude] : defaultCenter;
  const mapZoom = status === 'resolved' ? 16 : 5;

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
              placeholder="Enter complex Indian address (e.g. opp. sbi bank, mg road...)"
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
            <div className="flex items-center gap-3 mb-6 text-signal-low">
              <div className="w-10 h-10 rounded-full bg-signal-low/20 flex items-center justify-center">
                <span className="text-xl font-bold">⚠</span>
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-wide">Address Conflict Detected</h2>
            </div>
            
            <p className="text-slate-300 mb-6 leading-relaxed">
              The coordinates you provided point to a different location than the text address. The system requires your input to resolve this conflict.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-navy-950 p-4 rounded border border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Text Address</h4>
                <p className="text-sm text-slate-200">{conflictData.textAddress}</p>
              </div>
              <div className="bg-navy-950 p-4 rounded border border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Coordinates point to</h4>
                <p className="text-sm text-slate-200 mb-1">{conflictData.reverseAddress}</p>
                <p className="text-xs text-electric font-mono">{conflictData.coordinates}</p>
              </div>
            </div>
            
            <div className="bg-signal-low/10 border border-signal-low/30 p-4 rounded mb-8">
               <span className="text-signal-low font-semibold text-sm">Reason: </span>
               <span className="text-slate-300 text-sm">{conflictData.reason}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => handleLocate(null, 'coordinates')}
                className="flex-1 bg-navy-800 hover:bg-navy-700 border border-slate-600 text-white px-4 py-3 rounded font-semibold transition-colors"
              >
                Use User Coordinates
              </button>
              <button 
                onClick={() => handleLocate(null, 'text')}
                className="flex-1 bg-electric hover:bg-blue-600 text-white px-4 py-3 rounded font-semibold transition-colors"
              >
                Use Text Address Search
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-0">
        
        {/* COLUMN 1: LEFT PANEL (Address Breakdown) */}
        <div className="order-3 lg:order-1 lg:col-span-3 flex flex-col space-y-4 lg:space-y-6 overflow-y-auto pr-1">
          
          {/* Raw Address */}
          <div className="bg-navy-900 rounded-lg p-4 shadow-panel border border-slate-800">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Original Input</h3>
            <p className={clsx("text-sm font-medium leading-relaxed font-mono", status === 'idle' ? 'text-slate-600' : 'text-slate-200')}>
              {status === 'idle' ? '— waiting for input' : address}
            </p>
          </div>

          {/* Parsed Fields */}
          <div className="bg-navy-900 rounded-lg p-4 shadow-panel border border-slate-800 flex-1 flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Parsed Fields (Agent 1)</h3>
            
            <div className="space-y-5 flex-1">
              {/* Field Row */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Landmark</span>
                  <span className={clsx("text-sm font-medium", status === 'resolved' ? 'text-slate-200' : 'text-slate-600')}>{extractedLandmark}</span>
                </div>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div className={clsx("h-full w-full transition-all duration-1000", status === 'resolved' ? 'bg-signal-high' : 'bg-transparent -translate-x-full')}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Pincode</span>
                  <span className={clsx("text-sm font-medium font-mono", status === 'resolved' ? 'text-slate-200' : 'text-slate-600')}>{extractedPincode}</span>
                </div>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div className={clsx("h-full w-full transition-all duration-1000", status === 'resolved' ? 'bg-signal-high' : 'bg-transparent -translate-x-full')}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Source Card */}
          <div className="bg-navy-900 rounded-lg p-4 shadow-panel border border-slate-800 flex flex-col justify-between">
             <div className="flex flex-col">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location Source</h3>
                <span className={clsx("text-xs font-semibold uppercase tracking-wider", status === 'resolved' ? 'text-signal-high' : 'text-slate-600')}>
                   {status === 'resolved' ? result?.locationSource || 'Unknown' : 'Standby'}
                </span>
                <span className={clsx("text-xs mt-2 leading-relaxed", status === 'resolved' ? 'text-slate-300' : 'text-slate-600')}>
                   {status === 'resolved' ? result?.explanation || 'Waiting for AI processing...' : '—'}
                </span>
             </div>
          </div>

        </div>

        {/* COLUMN 2: CENTER PANEL (Live Map) */}
        <div className="order-1 lg:order-2 lg:col-span-6 relative rounded-lg overflow-hidden shadow-panel border border-slate-800 h-[400px] lg:h-auto">
          {/* Map Overlay Chip */}
          <div className="absolute top-4 left-4 z-[1000]">
            <div className={clsx("px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-colors", chipColor)}>
               <div className={clsx("w-1.5 h-1.5 rounded-full bg-current", status === 'idle' ? '' : 'opacity-70')}></div>
               {status === 'resolved' ? `${result.confidence} Confidence` : 'Awaiting Data'}
            </div>
          </div>
          
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            className="w-full h-full z-0"
            zoomControl={false}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              className="map-tiles-dark"
              attribution='&copy; OSM'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomleft" />
            {status === 'resolved' && result && (
               <Marker position={[result.latitude, result.longitude]}>
                 <Popup className="text-navy-950 font-medium text-xs">
                   {result.normalizedAddress}
                 </Popup>
               </Marker>
            )}
          </MapContainer>
          
          <style dangerouslySetInnerHTML={{__html: `
            .map-tiles-dark {
              filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
            }
          `}} />
        </div>

        {/* COLUMN 3: RIGHT PANEL (Agent Feed) */}
        <div className="order-2 lg:order-3 lg:col-span-3 h-[400px] lg:h-auto">
          <AgentFeed status={status} result={result} />
        </div>

      </div>
      )}
    </div>
  );
};

export default HomePage;
