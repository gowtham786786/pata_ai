import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './components/layouts/UserLayout';
import AdminLayout from './components/layouts/AdminLayout';
import UserDashboard from './pages/UserDashboard';
import LocateAddress from './pages/LocateAddress';
import HistoryPage from './pages/HistoryPage';
import SavedLocations from './pages/SavedLocations';
import RoutePlanner from './pages/RoutePlanner';
import NearbyExplorer from './pages/NearbyExplorer';
import UserReports from './pages/UserReports';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import AIAgentMonitor from './pages/AIAgentMonitor';
import APIMonitor from './pages/APIMonitor';
import DatasetManager from './pages/DatasetManager';
import { CacheManager, AnalyticsDashboard, SystemLogs, AuditLogs, SecurityConfig, SystemConfig } from './pages/AdminPlaceholders';
import LoginPage from './pages/LoginPage';
import WelcomeScreen from './pages/WelcomeScreen';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AnimatedBackground from './components/AnimatedBackground';
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser, userRole } = useAuth();
  
  return (
    <Router>
      <AnimatedBackground />
      <Routes>
        {/* Root Redirect Logic */}
        <Route path="/" element={
          currentUser ? (
            userRole === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/user" replace />
          ) : (
            <WelcomeScreen />
          )
        } />

        <Route path="/login" element={
          currentUser ? (
            userRole === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/user" replace />
          ) : (
            <LoginPage />
          )
        } />
        
        {/* USER PORTAL */}
        <Route element={<ProtectedRoute requireAdmin={false} />}>
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<UserDashboard />} /> 
            <Route path="locate" element={<LocateAddress />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="saved" element={<SavedLocations />} />
            <Route path="route" element={<RoutePlanner />} />
            <Route path="nearby" element={<NearbyExplorer />} />
            <Route path="reports" element={<UserReports />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        
        {/* ADMIN PORTAL */}
        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="agents" element={<AIAgentMonitor />} />
            <Route path="api" element={<APIMonitor />} />
            <Route path="datasets" element={<DatasetManager />} />
            <Route path="cache" element={<CacheManager />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="logs" element={<SystemLogs />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="security" element={<SecurityConfig />} />
            <Route path="config" element={<SystemConfig />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
