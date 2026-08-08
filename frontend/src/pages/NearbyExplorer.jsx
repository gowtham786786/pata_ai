import React from 'react';
import { Map } from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const NearbyExplorer = () => {
  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <Map className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">Nearby Explorer</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Discover POIs & Landmarks</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
        <div className="bg-navy-900 border border-slate-800 rounded-lg shadow-panel p-6">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Categories</h3>
           <div className="space-y-2">
             {['Hospitals', 'Restaurants', 'ATMs', 'Fuel Stations', 'Schools', 'Hotels', 'Transit'].map(cat => (
               <label key={cat} className="flex items-center space-x-3 p-2 hover:bg-navy-950 rounded cursor-pointer">
                 <input type="checkbox" className="accent-electric" />
                 <span className="text-sm text-slate-300 font-mono">{cat}</span>
               </label>
             ))}
           </div>
        </div>
        <div className="lg:col-span-3 bg-navy-900 border border-slate-800 rounded-lg shadow-panel overflow-hidden">
            <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}>
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default NearbyExplorer;
