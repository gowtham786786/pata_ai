import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  History, 
  Bookmark, 
  Route, 
  BarChart2, 
  Settings, 
  User, 
  LogOut, 
  Sparkles,
  ChevronUp,
  Cpu
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const UserSidebar = () => {
  const { logout, currentUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const navItems = [
    { to: '/user', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/user/locate', icon: MapPin, label: 'Locate Address', badge: 'AI' },
    { to: '/user/history', icon: History, label: 'Search History' },
    { to: '/user/saved', icon: Bookmark, label: 'Saved Places' },
    { to: '/user/route', icon: Route, label: 'Route Planner' },
    { to: '/user/reports', icon: BarChart2, label: 'Analytics' },
  ];

  return (
    <aside className="w-64 h-full flex flex-col bg-[#0D1424]/90 backdrop-blur-xl border-r border-white/[0.08] shadow-2xl relative z-40 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 p-[1px] shadow-glow-primary">
            <div className="w-full h-full bg-[#0B1120] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Pata<span className="text-blue-400">AI</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-semibold">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Location Intelligence</p>
          </div>
        </div>
      </div>

      {/* Live Agent Engine Status Pill */}
      <div className="px-4 pt-4 pb-2">
        <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300">5 AI Agents</span>
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            ONLINE
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Platform
        </p>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/user'}
              className={({ isActive }) =>
                clsx(
                  "group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <Icon className={clsx(
                      "w-4 h-4 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                    )} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={clsx(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono",
                      isActive ? "bg-blue-500/20 text-blue-300" : "bg-white/[0.06] text-slate-400"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-white/[0.06] bg-[#0A0F1D]/80 relative">
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#0F172A] border border-white/[0.1] rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.displayName || 'Active User'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {currentUser?.email || 'anonymous@pataai.com'}
              </p>
            </div>
            
            <NavLink
              to="/user/profile"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Profile Settings</span>
            </NavLink>
            
            <button
              onClick={() => {
                setShowUserMenu(false);
                logout();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors w-full text-left mt-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={clsx(
            "w-full flex items-center justify-between p-2 rounded-xl transition-all duration-200 group text-left",
            showUserMenu ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
          )}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-subtle shrink-0">
              {currentUser?.displayName 
                ? currentUser.displayName.charAt(0).toUpperCase() 
                : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.email || 'Authenticated'}
              </p>
            </div>
          </div>
          <ChevronUp className={clsx(
            "w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0",
            showUserMenu ? "rotate-180 text-white" : ""
          )} />
        </button>
      </div>
    </aside>
  );
};

export default UserSidebar;
