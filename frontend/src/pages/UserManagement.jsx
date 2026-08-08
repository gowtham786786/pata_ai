import React, { useState, useEffect } from 'react';
import { Users, Shield, Search, MoreVertical, ShieldAlert } from 'lucide-react';
import { db } from '../firebase/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersList);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Failed to update role", error);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col bg-navy-950 font-sans text-slate-200 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <Users className="text-electric" size={28} />
          <div>
             <h1 className="text-2xl font-semibold tracking-wide text-slate-100">User Management</h1>
             <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Access Control & Roles</p>
          </div>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search users..." 
            className="pl-10 pr-4 py-2 bg-navy-900 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-electric"
          />
          <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 bg-navy-900 border border-slate-800 rounded-lg shadow-panel overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-950 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-widest font-mono">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-semibold text-slate-200">{user.name || 'Unknown'}</td>
                    <td className="p-4 text-slate-400">{user.email}</td>
                    <td className="p-4">
                      <select 
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-navy-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-electric"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="operator">Operator</option>
                      </select>
                    </td>
                    <td className="p-4">
                       <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                         Active
                       </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                       <button className="p-2 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white">
                         <MoreVertical size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
