import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, History, Bookmark, Map, Route, BarChart2, Settings, User, LogOut, TerminalSquare } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const UserSidebar = () => {
  const { logout, currentUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const navItems = [
    { to: '/user', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/user/locate', icon: <MapPin size={18} />, label: 'Locate Address' },
    { to: '/user/history', icon: <History size={18} />, label: 'Search History' },
    { to: '/user/saved', icon: <Bookmark size={18} />, label: 'Saved Locations' },

    { to: '/user/route', icon: <Route size={18} />, label: 'Route Planner' },
    { to: '/user/reports', icon: <BarChart2 size={18} />, label: 'My Reports' },
  ];

  return (
    <div className="w-64 glass-panel border-l-0 border-t-0 border-b-0 border-r border-white/5 h-full flex flex-col z-50 shadow-2xl relative">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-electric-glow/20 border border-electric-glow/50 flex items-center justify-center shadow-glow-cyan text-electric-glow">
          <TerminalSquare size={18} />
        </div>
        <h1 className="text-xl font-bold tracking-widest uppercase text-glow text-white">
          Pata<span className="text-electric-glow">AI</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <h3 className="px-4 text-[10px] font-bold text-cyber-700 uppercase tracking-[0.2em] mb-4">Operations</h3>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/user'}
            className={({ isActive }) =>
              clsx(
                "flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300 border border-transparent",
                isActive 
                  ? "bg-electric-500/10 border-electric-glow/30 text-electric-glow shadow-[inset_0_0_15px_rgba(0,240,255,0.1)]" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            {item.icon}
            <span className="font-mono text-xs uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="relative p-4 border-t border-white/5 bg-cyber-900/30">
        {showUserMenu && (
          <div className="absolute bottom-full left-4 mb-2 w-56 bg-navy-950 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
            <div className="px-4 py-3 border-b border-slate-800/50">
              <p className="text-sm font-semibold text-white truncate">{currentUser?.displayName || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser?.email || 'user@example.com'}</p>
            </div>
            <div className="p-1">
              <NavLink to="/user/profile" onClick={() => setShowUserMenu(false)} className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <User size={16} />
                <span>Profile</span>
              </NavLink>
              <NavLink to="/user/settings" onClick={() => setShowUserMenu(false)} className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <Settings size={16} />
                <span>Settings</span>
              </NavLink>
            </div>
            <div className="p-1 border-t border-slate-800/50">
              <button onClick={() => { setShowUserMenu(false); logout(); }} className="flex items-center space-x-3 px-3 py-2 w-full text-left text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors text-sm">
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={clsx(
            "flex items-center space-x-3 w-full p-2 rounded-xl transition-all duration-300 border border-transparent",
            showUserMenu ? "bg-white/10 border-white/10" : "hover:bg-white/5"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-electric-600 to-electric-glow flex items-center justify-center text-navy-950 font-bold text-sm uppercase shadow-glow-cyan shrink-0">
            {currentUser?.displayName ? currentUser.displayName.charAt(0) : currentUser?.email ? currentUser.email.charAt(0) : 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-white truncate">{currentUser?.displayName || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser?.email || 'user@example.com'}</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default UserSidebar;
