'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Building,
  Key,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@cebucity.gov.ph');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'lgu_officer' | 'responder'>('admin');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Store auth session
    localStorage.setItem(
      'cebu_auth_user',
      JSON.stringify({
        email,
        role,
        name: role === 'admin' ? 'Matt Oznerta (Admin)' : 'CDRRMO Operator',
        token: 'auth_token_' + Date.now(),
      })
    );

    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 600);
  };

  const handleSSOLogin = () => {
    setLoading(true);
    localStorage.setItem(
      'cebu_auth_user',
      JSON.stringify({
        email: 'sso.officer@cebucity.gov.ph',
        role: 'admin',
        name: 'Gov SSO Authorized Admin',
        token: 'firebase_sso_token_' + Date.now(),
      })
    );
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#007AFF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#34C759]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Authentication Card */}
      <div className="bg-white/95 backdrop-blur-2xl border border-[#E5E5EA] rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
            <Radio className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1C1C1E]">
            CebuFloodWatch
          </h1>
          <p className="text-xs font-bold text-[#007AFF] uppercase tracking-wider">
            CDRRMO Command Portal &bull; Official Access
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          {/* Role Selection Tabs */}
          <div>
            <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
              Select Clearance Tier
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#F8F9FA] p-1 rounded-2xl border border-[#E5E5EA]">
              {[
                { id: 'admin', label: '👑 Admin' },
                { id: 'lgu_officer', label: '🛡️ Dispatcher' },
                { id: 'responder', label: '📋 Responder' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id as any)}
                  className={`py-2 rounded-xl font-extrabold text-[11px] transition-all ${
                    role === r.id
                      ? 'bg-[#007AFF] text-white shadow-sm'
                      : 'text-[#6C6C70] hover:text-[#1C1C1E]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
              Official Gov Email Address
            </label>
            <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E5EA] rounded-2xl px-3.5 py-3 focus-within:border-[#007AFF]">
              <Mail className="w-4 h-4 text-[#8E8E93]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@cebucity.gov.ph"
                className="w-full text-xs font-semibold text-[#1C1C1E] bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1.5">
              Security Clearance Password
            </label>
            <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E5EA] rounded-2xl px-3.5 py-3 focus-within:border-[#007AFF]">
              <Lock className="w-4 h-4 text-[#8E8E93]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full text-xs font-semibold text-[#1C1C1E] bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#8E8E93] hover:text-[#1C1C1E]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating Clearance...' : 'Authorize & Enter Command Center'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E5E5EA]" />
          <span className="text-[10px] font-extrabold uppercase text-[#8E8E93]">Or</span>
          <div className="flex-1 h-px bg-[#E5E5EA]" />
        </div>

        {/* SSO / Firebase Auth Button */}
        <button
          onClick={handleSSOLogin}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-[#F8F9FA] hover:bg-[#E5E5EA] border border-[#E5E5EA] text-[#1C1C1E] font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Building className="w-4 h-4 text-[#007AFF]" />
          <span>Sign In with Government SSO / Firebase</span>
        </button>

        {/* Footer Security Notice */}
        <div className="pt-2 text-center text-[10px] text-[#8E8E93] font-medium leading-relaxed">
          🔒 Official Disaster Risk Reduction & Management System &bull; OCD-7 Compliant
        </div>
      </div>
    </div>
  );
}
