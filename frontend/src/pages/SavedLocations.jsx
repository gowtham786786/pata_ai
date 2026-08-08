import React from 'react';
import { Bookmark } from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SavedLocations = () => {
  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <Bookmark className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">Saved Locations</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Manage Favorite Addresses</p>
        </div>
      </div>
      
      <div className="flex-1 bg-navy-900 border border-slate-800 rounded-lg shadow-panel flex items-center justify-center p-8">
         <div className="text-center max-w-md">
            <h2 className="text-lg font-bold text-slate-300 mb-2">No Saved Locations Yet</h2>
            <p className="text-sm text-slate-500 font-mono mb-6">Star a location from the Locate or History tabs to save it here for quick access.</p>
            <div className="w-full h-64 bg-navy-950 border border-slate-800 rounded-lg overflow-hidden opacity-50 pointer-events-none">
              <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}>
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              </MapContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SavedLocations;
