import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-slate-100 font-sans">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
