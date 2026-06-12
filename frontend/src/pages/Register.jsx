import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, LogOut, Sparkles, Shield, User, Mail, Lock } from 'lucide-react';

// ─── Pending Approval Screen ──────────────────────────────────────────────────
const PendingApprovalScreen = ({ userName, onLogout }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative bg-gray-900 border border-amber-500/20 rounded-3xl shadow-2xl max-w-lg w-full p-10 text-center"
      >
        {/* Animated clock badge */}
        <motion.div
          className="relative w-24 h-24 mx-auto mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40" />
        </motion.div>
        <div className="absolute top-[56px] left-1/2 -translate-x-1/2 w-24 h-24 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Clock size={40} className="text-amber-400" />
          </div>
        </div>

        <div className="mt-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              AWAITING APPROVAL
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">
              Welcome, {userName}! 🎉
            </h1>
            <p className="text-gray-400 leading-relaxed mb-8">
              Your account has been created and is <strong className="text-amber-400">pending admin approval</strong>. 
              You'll be able to access the platform once an administrator reviews and approves your request.
            </p>

            {/* Steps indicator */}
            <div className="space-y-3 text-left mb-8">
              {[
                { icon: CheckCircle, label: 'Account created successfully', done: true, color: 'green' },
                { icon: Shield, label: 'Waiting for admin review', done: false, color: 'amber', active: true },
                { icon: Sparkles, label: 'Full platform access granted', done: false, color: 'gray' },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    step.done ? 'bg-green-500/5 border-green-500/20' :
                    step.active ? 'bg-amber-500/5 border-amber-500/20' :
                    'bg-gray-800/50 border-gray-700/50 opacity-50'
                  }`}
                >
                  <step.icon
                    size={18}
                    className={
                      step.done ? 'text-green-400' :
                      step.active ? 'text-amber-400 animate-pulse' :
                      'text-gray-500'
                    }
                  />
                  <span className={`text-sm font-medium ${
                    step.done ? 'text-green-300' :
                    step.active ? 'text-amber-300' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={onLogout}
              className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white text-sm font-medium transition-all duration-200"
            >
              <LogOut size={16} />
              Log out
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Register Form ────────────────────────────────────────────────────────────
const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const { register, user, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(name, email, password);
    if (success) {
      // Read the freshly stored user from the store
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.status === 'pending') {
        // Show beautiful pending screen — do NOT navigate to dashboard
        setRegisteredName(currentUser.name || name);
        setRegistered(true);
      } else {
        // Auto-approved (first admin user or auto-approve enabled)
        navigate('/dashboard');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If we registered and user is pending, show pending screen
  if (registered) {
    return <PendingApprovalScreen userName={registeredName} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key="register-form"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gray-900 border border-gray-700/60 rounded-3xl shadow-2xl max-w-md w-full p-8"
        >
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Sparkles size={28} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-gray-500 text-sm mt-1">Join the ReelsPro platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-600"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-600"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-600"
                  required
                />
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs">
              <Clock size={14} className="mt-0.5 shrink-0 text-amber-400" />
              <span>New accounts require admin approval before accessing the platform.</span>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl transition duration-200 text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
              Sign in
            </Link>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Register;
