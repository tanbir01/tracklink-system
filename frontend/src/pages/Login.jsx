import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Smartphone, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // In our design, backend takes user login username/email in the body
      const success = await login({ username: email, password });
      if (success) {
        navigate('/');
      } else {
        setError('Invalid credentials. Please check your username/email and password.');
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Connection to server failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
      {/* Premium background gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-2xl mx-4">
        
        {/* Logo and Intro */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-primary-500/10 text-primary-500 border border-primary-500/20 mb-3 shadow-inner">
            <Smartphone className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none">TrackLink</h2>
          <p className="text-slate-400 text-xs mt-2">Real-Time Personal Device Tracking System</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-2xl mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email/Username field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email or Username</label>
            <div className="relative flex items-center bg-slate-950/40 border border-slate-850 rounded-2xl focus-within:ring-2 focus-within:ring-primary-500/50 transition-all duration-300">
              <Mail className="w-5 h-5 text-slate-500 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tracklink.local"
                className="w-full bg-transparent border-none text-sm text-white pl-12 pr-4 py-3.5 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
            <div className="relative flex items-center bg-slate-950/40 border border-slate-850 rounded-2xl focus-within:ring-2 focus-within:ring-primary-500/50 transition-all duration-300">
              <Lock className="w-5 h-5 text-slate-500 absolute left-4 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-none text-sm text-white pl-12 pr-12 py-3.5 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 hover:text-slate-300 absolute right-4 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold text-sm py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-primary-500/20 border border-primary-400/25 transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
            consent is required for device monitoring
          </p>
        </div>
      </div>
    </div>
  );
}
