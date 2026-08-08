import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, History, LayoutDashboard, Settings, LogIn, LogOut, TerminalSquare } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { currentUser, loginWithGoogle, logout } = useAuth();
  
  const navItems = [
    { to: '/', icon: <MapPin size={18} />, label: 'Command Center' },
    { to: '/history', icon: <History size={18} />, label: 'History Logs' },
    { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'System Admin' },
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

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <h3 className="px-4 text-[10px] font-bold text-cyber-700 uppercase tracking-[0.2em] mb-4">Modules</h3>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 border border-transparent",
                isActive 
                  ? "bg-electric-500/10 border-electric-glow/30 text-electric-glow shadow-[inset_0_0_15px_rgba(0,240,255,0.1)]" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            {item.icon}
            <span className="font-mono text-sm uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-2 bg-cyber-900/30">
        <NavLink to="/settings" className={({ isActive }) => clsx("flex items-center space-x-3 px-4 py-3 w-full text-left rounded-xl transition-all duration-300 font-mono text-sm uppercase tracking-wider border border-transparent", isActive ? "bg-white/10 text-white border-white/10" : "text-slate-400 hover:bg-white/5")}>
          <Settings size={18} />
          <span>Config</span>
        </NavLink>
        {currentUser ? (
          <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 w-full text-left text-slate-400 hover:bg-signal-low/10 hover:text-signal-low hover:border-signal-low/30 border border-transparent rounded-xl transition-all duration-300 font-mono text-sm uppercase tracking-wider">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        ) : (
          <button onClick={loginWithGoogle} className="flex items-center space-x-3 px-4 py-3 w-full text-left text-slate-400 hover:bg-signal-neon/10 hover:text-signal-neon hover:border-signal-neon/30 border border-transparent rounded-xl transition-all duration-300 font-mono text-sm uppercase tracking-wider">
            <LogIn size={18} />
            <span>Login</span>
          </button>
        )}
      </div>
      
      {/* Active user status indicator */}
      {currentUser && (
        <div className="absolute bottom-4 right-4 flex items-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-neon opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-neon"></span>
            </span>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
