import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, History, LayoutDashboard, Settings, LogIn, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { currentUser, loginWithGoogle, logout } = useAuth();
  
  const navItems = [
    { to: '/', icon: <MapPin size={20} />, label: 'Locate' },
    { to: '/history', icon: <History size={20} />, label: 'History' },
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Admin' },
  ];

  return (
    <div className="w-64 bg-panel h-full flex flex-col shadow-lg border-r border-slate-700">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-xl shadow-md shadow-primary/30">
          P
        </div>
        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
          Pata AI
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/20 text-primary font-medium" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        {currentUser ? (
          <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 w-full text-left text-slate-400 hover:bg-slate-800 rounded-xl transition-all duration-200">
            <LogOut size={20} className="text-danger" />
            <span>Logout ({currentUser.displayName?.split(' ')[0]})</span>
          </button>
        ) : (
          <button onClick={loginWithGoogle} className="flex items-center space-x-3 px-4 py-3 w-full text-left text-slate-400 hover:bg-slate-800 rounded-xl transition-all duration-200">
            <LogIn size={20} className="text-success" />
            <span>Login</span>
          </button>
        )}
        <NavLink to="/settings" className={({ isActive }) => clsx("flex items-center space-x-3 px-4 py-3 w-full text-left rounded-xl transition-all duration-200", isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800")}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
