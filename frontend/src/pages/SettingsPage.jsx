import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const SettingsPage = () => {
  const { updateUserPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (password !== confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return setMessage({ type: 'error', text: 'Password should be at least 6 characters.' });
    }

    setLoading(true);
    try {
      await updateUserPassword(password);
      setMessage({ type: 'success', text: 'Password successfully updated. You can now log in using your email and this password.' });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password: ' + error.message });
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-100 mb-6">Settings</h1>
        
        <div className="bg-panel border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Set Account Password</h2>
          <p className="text-slate-400 mb-6 text-sm">
            If you signed in with Google, you can set a password here. Once set, you can log in using your Google email address and this password next time.
          </p>

          {message.text && (
            <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? 'Updating...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
