import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-slate-100 font-sans relative">
      
      {/* Sidebar Wrapper */}
      <div className={`transition-all duration-300 relative ${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 z-40`}>
         <div className={`w-64 h-full absolute top-0 left-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <AdminSidebar />
         </div>
      </div>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-1/2 -translate-y-1/2 z-[60] p-1.5 bg-navy-950 border border-electric-glow/50 rounded-r-lg shadow-[0_0_10px_rgba(0,240,255,0.3)] text-electric-glow hover:bg-white/10 transition-all duration-300 ${isSidebarOpen ? 'left-64' : 'left-0'}`}
        title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
