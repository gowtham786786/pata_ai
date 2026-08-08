import React from 'react';
import { Outlet } from 'react-router-dom';
import UserSidebar from './UserSidebar';

const UserLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-slate-100 font-sans">
      <UserSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
