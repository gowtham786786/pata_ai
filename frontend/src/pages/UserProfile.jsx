import React from 'react';
import { User, Mail, Shield, Calendar, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { currentUser, userRole } = useAuth();

  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <User className="text-electric" size={28} />
        <div>
           <h1 className="text-2xl font-semibold tracking-wide text-slate-100">User Profile</h1>
           <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Identity & Security</p>
        </div>
      </div>
      
      <div className="max-w-2xl bg-navy-900 border border-slate-800 rounded-lg shadow-panel p-8">
        <div className="flex items-center space-x-6 mb-8">
           <div className="w-24 h-24 rounded-full bg-navy-950 border-2 border-electric/50 flex items-center justify-center text-3xl font-bold text-electric">
             {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
           </div>
           <div>
             <h2 className="text-2xl font-bold text-slate-100">{currentUser?.displayName || 'PataAI User'}</h2>
             <div className="flex items-center text-slate-400 mt-2 text-sm font-mono">
               <Shield className="w-4 h-4 mr-2 text-emerald-500" />
               Role: <span className="uppercase text-emerald-500 ml-1">{userRole}</span>
             </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-4 bg-navy-950 border border-slate-800 rounded">
                <div className="text-xs text-slate-500 uppercase tracking-widest flex items-center mb-1"><Mail className="w-3 h-3 mr-2" /> Email Address</div>
                <div className="font-mono text-slate-200">{currentUser?.email || 'N/A'}</div>
             </div>
             <div className="p-4 bg-navy-950 border border-slate-800 rounded">
                <div className="text-xs text-slate-500 uppercase tracking-widest flex items-center mb-1"><Shield className="w-3 h-3 mr-2" /> User ID</div>
                <div className="font-mono text-slate-200 truncate">{currentUser?.uid || 'N/A'}</div>
             </div>
             <div className="p-4 bg-navy-950 border border-slate-800 rounded">
                <div className="text-xs text-slate-500 uppercase tracking-widest flex items-center mb-1"><Calendar className="w-3 h-3 mr-2" /> Account Created</div>
                <div className="font-mono text-slate-200">{currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}</div>
             </div>
             <div className="p-4 bg-navy-950 border border-slate-800 rounded">
                <div className="text-xs text-slate-500 uppercase tracking-widest flex items-center mb-1"><Activity className="w-3 h-3 mr-2" /> Last Login</div>
                <div className="font-mono text-slate-200">{currentUser?.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}</div>
             </div>
           </div>
           
           <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-xs uppercase tracking-widest transition-colors border border-slate-600">
             Reset Password
           </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
