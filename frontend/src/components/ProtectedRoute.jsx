import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requireAdmin = false }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080F]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = userRole === 'admin' || currentUser.email === 'reddygowtham397@gmail.com';

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/user" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
