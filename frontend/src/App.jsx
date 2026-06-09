import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import UpdateNotification from './components/UpdateNotification';


// Dynamic imports for code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WebsiteSources = lazy(() => import('./pages/admin/WebsiteSources'));
const Articles = lazy(() => import('./pages/admin/Articles'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const ReelStudio = lazy(() => import('./pages/ReelStudio'));
const ReelsGallery = lazy(() => import('./pages/ReelsGallery'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const UserDetails = lazy(() => import('./pages/admin/UserDetails'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminLiveClicks = lazy(() => import('./pages/admin/AdminLiveClicks'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const QueueMonitor = lazy(() => import('./pages/admin/QueueMonitor'));
const UrlShortener = lazy(() => import('./pages/UrlShortener'));
const StoryMaker = lazy(() => import('./pages/StoryMaker'));
const ReelGenerator = lazy(() => import('./pages/ReelGenerator'));

// Loading Fallback
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Router>
      <ErrorBoundary>
      <UpdateNotification />
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingScreen />}>

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studio" element={<ReelStudio />} />
            <Route path="/gallery" element={<ReelsGallery />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/shortener" element={<UrlShortener />} />
            <Route path="/storymaker" element={<StoryMaker />} />
            <Route path="/reel-generator" element={<ReelGenerator />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/users/:id" element={<UserDetails />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/live-clicks" element={<AdminLiveClicks />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/queues" element={<QueueMonitor />} />
            <Route path="/admin/articles" element={
              <div className="min-h-screen bg-gray-900 text-white">
                <Articles />
              </div>
            } />
            <Route path="/keys" element={
              <div className="min-h-screen bg-gray-900 text-white">
                <ApiKeys />
              </div>
            } />
            <Route path="/admin/sources" element={
              <div className="min-h-screen bg-gray-900 text-white">
                <WebsiteSources />
              </div>
            } />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
