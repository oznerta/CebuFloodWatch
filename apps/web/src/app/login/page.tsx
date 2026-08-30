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
  User,
  AlertCircle,
  Building,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'lgu_officer' | 'responder'>('admin');
  const [regBarangay, setRegBarangay] = useState('Mabolo');
  const [regPhone, setRegPhone] = useState('');

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
        setErrorMessage(result.error || 'Invalid email or password. Please check your credentials or create an account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        barangay: regBarangay,
        phone: regPhone,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration network error. Please try again.');
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
            CDRRMO Operations &bull; Official Access
          </p>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="flex bg-[#F2F2F7] p-1 rounded-2xl border border-[#E5E5EA]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setLoading(false);
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-[#1C1C1E] shadow-sm'
                : 'text-[#6C6C70] hover:text-[#1C1C1E]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('register');
              setLoading(false);
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-[#1C1C1E] shadow-sm'
                : 'text-[#6C6C70] hover:text-[#1C1C1E]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-[#FFEBEA] border border-[#FFD0CE] rounded-2xl flex items-center gap-2.5 text-xs font-bold text-[#FF3B30] shadow-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Sign In Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
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
                  placeholder="Enter your password..."
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

            <button
              type="button"
              onClick={() => {
                setTab('register');
                setLoading(false);
                setErrorMessage(null);
              }}
              className="w-full text-center text-xs font-bold text-[#007AFF] hover:underline pt-1 cursor-pointer"
            >
              Don't have an account? Tap here to Create One
            </button>
          </form>
        ) : (
          /* Tab 2: Register Official Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Matt Oznerta"
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] font-semibold text-[#1C1C1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                Official Gov / Work Email
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="matt@cebucity.gov.ph"
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] font-semibold text-[#1C1C1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                Password (Min. 6 Characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create password..."
                className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] font-semibold text-[#1C1C1E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                  Clearance Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] font-bold text-[#1C1C1E] focus:outline-none cursor-pointer"
                >
                  <option value="admin">System Admin</option>
                  <option value="lgu_officer">LGU Dispatcher</option>
                  <option value="responder">WASAR Responder</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase text-[#8E8E93] block mb-1">
                  Home Barangay
                </label>
                <select
                  value={regBarangay}
                  onChange={(e) => setRegBarangay(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] font-bold text-[#1C1C1E] focus:outline-none cursor-pointer"
                >
                  <option value="Mabolo">Mabolo</option>
                  <option value="Kasambagan">Kasambagan</option>
                  <option value="Mambaling">Mambaling</option>
                  <option value="Guadalupe">Guadalupe</option>
                  <option value="Lahug">Lahug</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-1 cursor-pointer"
            >
              <span>{loading ? 'Creating Account...' : 'Register & Enter Command Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('login');
                setLoading(false);
                setErrorMessage(null);
              }}
              className="w-full text-center text-xs font-bold text-[#007AFF] hover:underline pt-1 cursor-pointer"
            >
              Already have an account? Tap here to Sign In
            </button>
          </form>
        )}

        {/* Footer Security Notice */}
        <div className="pt-2 text-center text-[10px] text-[#8E8E93] font-medium leading-relaxed">
          🔒 Official Disaster Risk Reduction & Management System &bull; OCD-7 Standard
        </div>
      </div>
    </div>
  );
}
