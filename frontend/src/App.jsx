import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser } = useAuth();
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        
        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route element={<MainLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
