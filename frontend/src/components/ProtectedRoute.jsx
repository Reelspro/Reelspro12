import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LiveRenderQueue from './LiveRenderQueue';

const ProtectedRoute = ({ requireAdmin = false }) => {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Handle pending approval users
  if (user.status === 'pending' && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-yellow-500">Approval Pending</h2>
          <p className="text-gray-300 mb-6">
            Your account is currently pending approval from an administrator. 
            You will be able to access the platform once your account is approved.
          </p>
          <button 
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.href = '/login';
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Refresh Session / Log Out
          </button>
        </div>
      </div>
    );
  }

  // Handle suspended users
  if (user.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-red-900/50 p-8 rounded-lg shadow-lg border border-red-500 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Account Suspended</h2>
          <p className="text-gray-300">
            Your account has been suspended. Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  // Handle rejected users
  if (user.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-red-900/50 p-8 rounded-lg shadow-lg border border-red-500 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Account Rejected</h2>
          <p className="text-gray-300">
            Your account application has been rejected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Outlet />
      <LiveRenderQueue />
    </>
  );
};

export default ProtectedRoute;
