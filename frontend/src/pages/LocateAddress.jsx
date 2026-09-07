import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, 
  Loader2, 
  MapPin, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  ChevronRight,
  Activity,
  AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import L from 'leaflet';
import { locateAddress } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import AgentFeed from '../components/AgentFeed';
import TopNavigation from '../components/TopNavigation';
import ConfidenceRing from '../components/ConfidenceRing';
import EvidenceModal from '../components/EvidenceModal';

// Custom Animated Radar Pin for Selected Resolved Location (Deep Void & Neon Cyan)
const createRadarIcon = () => {
  return L.divIcon({
    className: 'custom-radar-pin',
    html: `
      <div class="radar-beacon">
        <div class="pulse-ring"></div>
        <div class="core-dot"></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -22]
  });
};

// Custom Candidate Marker
const candidateIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [0, -28],
  shadowSize: [32, 32]
});

const MapController = ({ center, zoom, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, bounds, map]);
  return null;
};

// Preset Addresses for 1-Click Instant Testing
const PRESET_ADDRESSES = [
  { label: 'Apollo Hospital', address: 'Opposite to Apollo Hospital, MG Road, Bangalore 560001', icon: '🏥' },
  { label: 'Red Fort Delhi', address: 'Near Red Fort, Netaji Subhash Marg, Chandni Chowk, Delhi 110006', icon: '🏛️' },
  { label: 'Indiranagar', address: '42, 100ft Road, near KFC, Indiranagar, Bangalore 560038', icon: '📍' },
  { label: 'Connaught Place', address: 'Block B, Inner Circle, Connaught Place, New Delhi 110001', icon: '📮' }
];

const LocateAddress = () => {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('idle'); // idle, resolving, resolved, error, conflict
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [conflictData, setConflictData] = useState(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, pipeline, candidates

  const { currentUser } = useAuth();

  const handleLocate = async (e, addressToUse = null, forceSource = null) => {
    if (e) e.preventDefault();
    const queryAddress = (addressToUse || address).trim();
    if (!queryAddress) return;

    if (addressToUse) setAddress(addressToUse);

    setStatus('resolving');
    setErrorMsg('');
    setConflictData(null);
    setResult(null);
    setActiveTab('overview');
    
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const responseData = await locateAddress(queryAddress, token, forceSource);
      
      if (responseData.success) {
        const payload = responseData.data;
        payload.candidates = responseData.candidates || [];
        payload.parsedEntities = responseData.parsedEntities || {};
        setResult(payload);
        
        const totalRealTimeMs = payload.agentSteps 
          ? payload.agentSteps.reduce((acc, step) => acc + (step.timeMs || 20), 0) 
          : 150;
        
        // Cache in local history for instant reflection across Dashboard and History
        try {
          const entry = {
            id: Date.now().toString(),
            originalAddress: queryAddress,
            normalizedAddress: payload.normalizedAddress || queryAddress,
            latitude: payload.latitude,
            longitude: payload.longitude,
            confidence: payload.confidence || 'HIGH',
            confidenceScore: payload.confidenceScore || 92,
            processingTime: totalRealTimeMs,
            timestamp: Date.now()
          };
          const prev = JSON.parse(localStorage.getItem('pataai_local_history') || '[]');
          const updated = [entry, ...prev.filter(x => x.originalAddress !== queryAddress)].slice(0, 50);
          localStorage.setItem('pataai_local_history', JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not cache to local history:", e);
        }
        
        setTimeout(() => {
          setStatus('resolved');
        }, totalRealTimeMs + 50);
      } else if (responseData.isConflict) {
        setStatus('conflict');
        setConflictData(responseData.conflictDetails);
      } else {
        setStatus('error');
        setErrorMsg(responseData.message || 'Failed to resolve address through AI pipeline.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Connection to backend gateway failed. Please ensure services are running.');
    }
  };

  const copyCoordinates = () => {
    if (!result?.latitude || !result?.longitude) return;
    navigator.clipboard.writeText(`${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const copyResolvedAddress = () => {
    if (!result?.normalizedAddress) return;
    navigator.clipboard.writeText(result.normalizedAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const defaultCenter = [20.5937, 78.9629];
  const mapCenter = status === 'resolved' && result?.latitude ? [result.latitude, result.longitude] : defaultCenter;
  const mapZoom = status === 'resolved' ? 15 : 5;
  
  const mapBounds = status === 'resolved' && result?.candidates?.length > 0 
    ? result.candidates.filter(c => c.lat && c.lon).map(c => [c.lat, c.lon]) 
    : (result?.latitude ? [[result.latitude, result.longitude]] : null);

  return (
    <div className="min-h-full flex flex-col p-3 sm:p-5 text-slate-100 font-sans overflow-y-auto custom-scrollbar">
      <TopNavigation 
        title="Address Resolver"
        subtitle="Parse, verify, and resolve unstructured Indian addresses with sub-meter confidence"
      />

      {/* Floating Hero Search & Presets */}
      <div className="mb-4 flex-shrink-0">
        <form onSubmit={(e) => handleLocate(e)} className="relative flex items-center">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>
            <input
              type="text"
              className="w-full bg-[#0C1222]/90 backdrop-blur-xl border border-white/[0.12] hover:border-cyan-500/30 focus:border-cyan-400 rounded-2xl pl-12 pr-32 py-3.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 shadow-glass transition-all"
              placeholder="Enter complex Indian address (e.g. Opp Apollo Hospital, MG Road, Bangalore 560001)..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={status === 'resolving'}
            />
            {address && (
              <button
                type="button"
                onClick={() => setAddress('')}
                className="absolute right-32 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={status === 'resolving' || !address.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-300 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 font-bold disabled:text-slate-500 px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-neon-cyan transition-all disabled:shadow-none"
            >
              {status === 'resolving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Resolving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Locate</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* 1-Click Quick Presets */}
        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 font-medium text-[11px] shrink-0">Try preset:</span>
          {PRESET_ADDRESSES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLocate(null, preset.address)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1426]/70 hover:bg-cyan-500/10 border border-white/[0.08] hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 hover:shadow-neon-cyan transition-all text-xs font-medium"
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Notification */}
      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-white text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Conflict Resolution Banner */}
      {status === 'conflict' && conflictData && (
        <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs animate-in fade-in flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Ambiguous Location Conflict Detected
            </span>
            <button onClick={() => setStatus('idle')} className="text-slate-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
          <p className="text-slate-300 mb-3 leading-relaxed">
            {conflictData.message || 'Multiple conflicting coordinates found. Please select which source to prioritize:'}
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleLocate(null, address, 'Overpass')}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-bold text-xs transition-all shadow-neon-cyan"
            >
              Prioritize Landmark Search
            </button>
            <button
              onClick={() => handleLocate(null, address, 'Nominatim')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors border border-white/[0.08]"
            >
              Prioritize Pincode Centroid
            </button>
          </div>
        </div>
      )}

      {/* Main Dual Workspace: Left Intelligence Panel & Right Geospatial View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[520px]">
        
        {/* LEFT PANEL: Multi-Agent Intelligence (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl glass-card border border-white/[0.08] overflow-hidden min-h-[460px]">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.06] bg-[#0A0F1F]/90">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  activeTab === 'overview' 
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('pipeline')}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  activeTab === 'pipeline' 
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <span>Pipeline</span>
                {status === 'resolving' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>}
              </button>
              {result?.candidates?.length > 0 && (
                <button
                  onClick={() => setActiveTab('candidates')}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                    activeTab === 'candidates' 
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]" 
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span>Candidates</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-cyan-300 font-mono">
                    {result.candidates.length}
                  </span>
                </button>
              )}
            </div>

            {status === 'resolved' && (
              <button
                onClick={() => setShowEvidence(true)}
                className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                Audit Evidence <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Panel Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-6">
            {activeTab === 'overview' && (
              <>
                {status === 'idle' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 min-h-[300px]">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-neon-cyan">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">Awaiting Address Input</h3>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      Enter any messy or colloquial Indian address or select a preset above to run the 5-Agent chain.
                    </p>
                  </div>
                ) : status === 'resolving' ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 min-h-[300px]">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">AI Pipeline Resolving</h3>
                    <p className="text-xs text-slate-400">Agents are parsing, verifying pincodes, and querying OSM...</p>
                  </div>
                ) : (
                  <>
                    {/* Primary Resolution Card */}
                    <div className="p-4 rounded-xl bg-[#0D1426]/90 border border-white/[0.08] specular-top relative overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              Normalized Address
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {result?.locationSource || 'Resolved'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-bold text-white leading-snug break-words">
                              {result?.normalizedAddress || 'Identified Centroid'}
                            </h2>
                            <button
                              onClick={copyResolvedAddress}
                              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] transition-colors shrink-0"
                              title="Copy normalized address"
                            >
                              {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Confidence Score Gauge */}
                        <div className="shrink-0 pl-1">
                          <ConfidenceRing 
                            value={result?.confidenceScore || 85} 
                            label={result?.confidence || 'HIGH'}
                            size={64}
                          />
                        </div>
                      </div>

                      {/* Coordinates Chip & Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2 font-mono text-slate-300">
                          <span className="text-slate-400">Coordinates:</span>
                          <span className="text-cyan-300 font-semibold">
                            {result?.latitude?.toFixed(5)}, {result?.longitude?.toFixed(5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={copyCoordinates}
                            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-cyan-500/15 border border-white/[0.06] hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-all"
                            title="Copy Coordinates"
                          >
                            {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={`https://www.google.com/maps?q=${result?.latitude},${result?.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-cyan-500/15 border border-white/[0.06] hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-all"
                            title="Open in Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Extracted Semantic Entities */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Parsed Structured Entities (Agent 1)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 text-xs">
                        {[
                          { key: 'landmark', label: 'Landmark', val: result?.parsedEntities?.landmark },
                          { key: 'locality', label: 'Locality', val: result?.parsedEntities?.locality },
                          { key: 'city', label: 'City', val: result?.parsedEntities?.city },
                          { key: 'pincode', label: 'Pincode', val: result?.parsedEntities?.pincode },
                          { key: 'street', label: 'Street', val: result?.parsedEntities?.street },
                          { key: 'state', label: 'State', val: result?.parsedEntities?.state }
                        ].map((item) => (
                          <div key={item.key} className="p-2.5 rounded-xl bg-[#0C1222]/80 border border-white/[0.05] hover:border-cyan-500/30 transition-all" title={item.val || ''}>
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">{item.label}</span>
                            <span className="font-semibold text-slate-200 truncate block mt-0.5">
                              {item.val || '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Agent Pipeline Mini Status Card */}
                    <div className="p-3 rounded-xl bg-[#0C1222]/80 border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-slate-200">5 Pipeline Steps Completed</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('pipeline')}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        View Steps →
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'pipeline' && (
              <AgentFeed status={status} result={result} />
            )}

            {activeTab === 'candidates' && result?.candidates && (
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  OSM Alternative Candidates ({result.candidates.length})
                </span>
                {result.candidates.map((cand, idx) => {
                  const isSelected = cand.lat === result.latitude && cand.lon === result.longitude;
                  return (
                    <div 
                      key={idx}
                      className={clsx(
                        "p-3 rounded-xl border transition-all text-xs",
                        isSelected 
                          ? "bg-cyan-950/30 border-cyan-500/40 shadow-neon-cyan" 
                          : "bg-[#0C1222]/70 border-white/[0.05] hover:border-cyan-500/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-semibold text-slate-200 truncate">
                          {cand.name || 'Landmark Candidate'}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                          Score: {cand.total_score || cand.score || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>Lat: {cand.lat?.toFixed(4)}</span>
                        <span>Lon: {cand.lon?.toFixed(4)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Interactive Geospatial Leaflet Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-[460px] rounded-2xl overflow-hidden glass-card border border-white/[0.08] relative">
          
          {/* Map Status Badge Overlay */}
          <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 pointer-events-none">
            <div className="px-3 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 text-xs font-medium text-cyan-300 shadow-neon-cyan flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                status === 'resolved' ? 'bg-cyan-400 animate-pulse' : status === 'resolving' ? 'bg-amber-400 animate-ping' : 'bg-slate-400'
              }`}></span>
              <span>{status === 'resolved' ? 'Location Confirmed' : status === 'resolving' ? 'Resolving Coordinates...' : 'Pan-India Geospatial Engine'}</span>
            </div>
          </div>

          {/* Map Action Bar Overlay */}
          {status === 'resolved' && result?.latitude && (
            <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
              <a
                href={`https://www.google.com/maps?q=${result.latitude},${result.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/[0.1] hover:border-cyan-400/40 hover:text-cyan-300 hover:shadow-neon-cyan text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-glass"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Maps</span>
              </a>
            </div>
          )}

          {/* Leaflet Map Container */}
          <div className="w-full h-full relative">
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              className="w-full h-full z-0" 
              zoomControl={false}
            >
              <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />
              
              {/* Crystal-clear Esri Dark Canvas tiles */}
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxZoom={16}
              />
              <ZoomControl position="bottomright" />
              
              {/* Resolved Radar Pin */}
              {status === 'resolved' && result?.latitude && result?.longitude && (
                <Marker 
                  position={[result.latitude, result.longitude]} 
                  icon={createRadarIcon()}
                  zIndexOffset={1000}
                >
                  <Popup>
                    <div className="p-1 max-w-xs">
                      <div className="text-xs font-bold text-white mb-0.5">
                        {result.normalizedAddress || 'Resolved Location'}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 mb-1">
                        {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Confidence: <span className="text-cyan-400 font-bold">{result.confidenceScore}%</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Candidate Pins */}
              {status === 'resolved' && result?.candidates?.map((cand, idx) => {
                if (!cand || cand.lat == null || cand.lon == null) return null;
                const isSelected = cand.lat === result.latitude && cand.lon === result.longitude;
                if (isSelected) return null;

                return (
                  <Marker 
                    key={idx} 
                    position={[cand.lat, cand.lon]} 
                    icon={candidateIcon}
                  >
                    <Popup>
                      <div className="p-1">
                        <div className="text-xs font-bold text-white">{cand.name || 'Candidate'}</div>
                        <div className="text-[10px] text-slate-400">Score: {cand.total_score || cand.score}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

      </div>

      <EvidenceModal
        isOpen={showEvidence}
        onClose={() => setShowEvidence(false)}
        result={result}
      />
    </div>
  );
};

export default LocateAddress;
