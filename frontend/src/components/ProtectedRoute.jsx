import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LiveRenderQueue from './LiveRenderQueue';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Sparkles, Shield, LogOut, Ban, ArrowLeft, LayoutDashboard } from 'lucide-react';

// ─── Global Floating Back Button ──────────────────────────────────────────────
const GlobalBackButton = ({ user }) => {
  const { pathname } = useLocation();

  // Pages where back button should NOT show
  const noBackPages = ['/dashboard', '/admin/dashboard'];
  if (noBackPages.includes(pathname)) return null;

  // Admin sub-pages → go back to admin dashboard
  const isAdminPage = pathname.startsWith('/admin/');
  const backTo   = isAdminPage ? '/admin/dashboard' : '/dashboard';
  const label    = isAdminPage ? 'Admin Panel' : 'Dashboard';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        position: 'fixed',
        top: 18,
        left: 18,
        zIndex: 9000,
      }}
    >
      <Link
        to={backTo}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 14px',
          borderRadius: 12,
          background: 'rgba(15,15,30,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.25)',
          color: '#a5b4fc',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(99,102,241,0.18)';
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
          e.currentTarget.style.color = '#c7d2fe';
          e.currentTarget.style.transform = 'translateX(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(15,15,30,0.85)';
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
          e.currentTarget.style.color = '#a5b4fc';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <ArrowLeft size={15} />
        {label}
      </Link>
    </motion.div>
  );
};

// ─── Premium Pending Screen ────────────────────────────────────────────────────
const PendingScreen = ({ user }) => {
  const handleLogout = () => {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/5 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative bg-gray-900/90 backdrop-blur-sm border border-amber-500/20 rounded-3xl shadow-2xl max-w-lg w-full p-10 text-center"
      >
        {/* Spinning ring + clock icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
              <Clock size={36} className="text-amber-400" />
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          AWAITING ADMIN APPROVAL
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Almost there{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Your account is currently <strong className="text-amber-400">pending admin review</strong>. 
          Once approved, you'll have full access to the ReelsPro platform. 
          This usually takes just a few minutes.
        </p>

        {/* Steps */}
        <div className="space-y-2.5 text-left mb-8">
          {[
            { icon: CheckCircle, label: 'Account registered successfully', done: true },
            { icon: Shield, label: 'Waiting for admin approval', active: true },
            { icon: Sparkles, label: 'Platform access unlocked', pending: true },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                step.done ? 'bg-green-500/5 border-green-500/15' :
                step.active ? 'bg-amber-500/5 border-amber-500/15' :
                'bg-gray-800/30 border-gray-700/30 opacity-40'
              }`}
            >
              <step.icon
                size={16}
                className={
                  step.done ? 'text-green-400' :
                  step.active ? 'text-amber-400 animate-pulse' :
                  'text-gray-600'
                }
              />
              <span className={`text-sm font-medium ${
                step.done ? 'text-green-300' :
                step.active ? 'text-amber-300' :
                'text-gray-600'
              }`}>
                {step.label}
              </span>
              {step.active && (
                <span className="ml-auto text-xs text-amber-500/70 font-mono">in progress</span>
              )}
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={handleLogout}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white text-sm font-medium transition-all duration-200"
        >
          <LogOut size={15} />
          Log out & return to login
        </motion.button>
      </motion.div>
    </div>
  );
};

// ─── Suspended / Rejected Screen ──────────────────────────────────────────────
const BlockedScreen = ({ status }) => {
  const isSuspended = status === 'suspended';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-950/30 border border-red-800/40 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <Ban size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-red-400 mb-3">
          Account {isSuspended ? 'Suspended' : 'Rejected'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {isSuspended
            ? 'Your account has been suspended by an administrator. Please contact support for more information.'
            : 'Your account application was not approved. Please contact an administrator if you believe this is an error.'
          }
        </p>
        <button
          onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login'; }}
          className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition"
        >
          <LogOut size={14} className="inline mr-2" />
          Back to Login
        </button>
      </motion.div>
    </div>
  );
};

// ─── Main ProtectedRoute ───────────────────────────────────────────────────────
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
    return <PendingScreen user={user} />;
  }

  // Handle suspended / rejected
  if (user.status === 'suspended' || user.status === 'rejected') {
    return <BlockedScreen status={user.status} />;
  }

  return (
    <>
      <GlobalBackButton user={user} />
      <Outlet />
      <LiveRenderQueue />
    </>
  );
};

export default ProtectedRoute;
