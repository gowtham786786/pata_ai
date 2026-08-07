import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-navy-950 text-slate-100 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
