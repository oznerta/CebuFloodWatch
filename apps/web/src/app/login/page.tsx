'use client';

import React, { useState } from 'react';
import {
  Radio,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await login(loginEmail, loginPassword);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid credentials. Access is restricted to authorized operators.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#007AFF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#34C759]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Authentication Card */}
      <div className="bg-white/95 backdrop-blur-2xl border border-[#E5E5EA] rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-5 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
            <Radio className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1C1C1E]">
            CebuFloodWatch
          </h1>
          <p className="text-xs font-bold text-[#007AFF] uppercase tracking-wider">
            CDRRMO Command & Control Center
          </p>
        </div>

        {/* Security Notice Banner */}
        <div className="p-3 bg-[#F8F9FA] border border-[#E5E5EA] rounded-2xl flex items-center gap-2.5 text-[11px] text-[#6C6C70]">
          <ShieldCheck className="w-4 h-4 text-[#007AFF] flex-shrink-0" />
          <span>Official Access Only. Operator clearances are provisioned by System Administrators.</span>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-[#FFEBEA] border border-[#FFD0CE] rounded-2xl flex items-center gap-2.5 text-xs font-bold text-[#FF3B30] shadow-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
              Official Email Address
            </label>
            <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E5EA] rounded-2xl px-3.5 py-3 focus-within:border-[#007AFF]">
              <Mail className="w-4 h-4 text-[#8E8E93]" />
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. admin@cebucity.gov.ph"
                className="w-full text-xs font-semibold text-[#1C1C1E] bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
              Password
            </label>
            <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E5EA] rounded-2xl px-3.5 py-3 focus-within:border-[#007AFF]">
              <Lock className="w-4 h-4 text-[#8E8E93]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full text-xs font-semibold text-[#1C1C1E] bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Authenticating Clearance...' : 'Sign In to Command Center'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Security Notice */}
        <div className="pt-2 text-center text-[10px] text-[#8E8E93] font-medium leading-relaxed">
          🔒 Official Disaster Risk Reduction & Management System &bull; OCD-7 Standard
        </div>
      </div>
    </div>
  );
}
