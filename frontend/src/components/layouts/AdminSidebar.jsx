import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, HardDrive, Database, Server, Shield, FileText, Settings, LogOut, TerminalSquare } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();
  
  const navItems = [
    { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/admin/users', icon: <Users size={18} />, label: 'User Management' },
    { to: '/admin/agents', icon: <Activity size={18} />, label: 'AI Agent Monitor' },
    { to: '/admin/api', icon: <Server size={18} />, label: 'API Monitor' },
    { to: '/admin/analytics', icon: <Activity size={18} />, label: 'Analytics' },
    { to: '/admin/datasets', icon: <Database size={18} />, label: 'Dataset Manager' },
    { to: '/admin/cache', icon: <HardDrive size={18} />, label: 'Cache Manager' },
    { to: '/admin/logs', icon: <FileText size={18} />, label: 'Logs' },
    { to: '/admin/audit', icon: <FileText size={18} />, label: 'Audit' },
    { to: '/admin/security', icon: <Shield size={18} />, label: 'Security' },
  ];

  return (
    <div className="w-64 glass-panel border-l-0 border-t-0 border-b-0 border-r border-white/5 h-full flex flex-col z-50 shadow-2xl relative">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-electric-glow/20 border border-electric-glow/50 flex items-center justify-center shadow-glow-cyan text-electric-glow">
          <TerminalSquare size={18} />
        </div>
        <h1 className="text-xl font-bold tracking-widest uppercase text-glow text-white">
          Pata<span className="text-electric-glow">AI</span> <span className="text-[10px] text-red-500 ml-1">ADMIN</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <h3 className="px-4 text-[10px] font-bold text-cyber-700 uppercase tracking-[0.2em] mb-4">Admin Modules</h3>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              clsx(
                "flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300 border border-transparent",
                isActive 
                  ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            {item.icon}
            <span className="font-mono text-xs uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-2 bg-cyber-900/30">
        <NavLink to="/admin/config" className={({ isActive }) => clsx("flex items-center space-x-3 px-4 py-3 w-full text-left rounded-xl transition-all duration-300 font-mono text-sm uppercase tracking-wider border border-transparent", isActive ? "bg-white/10 text-white border-white/10" : "text-slate-400 hover:bg-white/5")}>
          <Settings size={18} />
          <span>Configuration</span>
        </NavLink>
        <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 w-full text-left text-slate-400 hover:bg-signal-low/10 hover:text-signal-low hover:border-signal-low/30 border border-transparent rounded-xl transition-all duration-300 font-mono text-sm uppercase tracking-wider">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
