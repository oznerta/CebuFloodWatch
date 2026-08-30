'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  AlertCircle,
  Home,
  Split,
  Sparkles,
  Radio,
  ShieldCheck,
  Cpu,
  Users,
  FileCheck,
  ChevronDown,
  ShieldAlert,
  Sliders,
  Lock,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

const operationsNav: NavItem[] = [
  { name: 'Situation Room & Map', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Incident Triage', href: '/reports', icon: AlertCircle, badge: 'Live' },
  { name: 'Emergency Alerts', href: '/alerts', icon: Radio },
  { name: 'Shelters & Routes', href: '/evacuation', icon: Home },
  { name: 'Road Passability', href: '/roads', icon: Split },
];

const adminNav: NavItem[] = [
  { name: 'AI & Vision Models', href: '/admin/ai', icon: Sparkles },
  { name: 'API Gateways & IoT', href: '/admin/apis', icon: Cpu },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'OCD-7 Audit Logs', href: '/admin/audit', icon: FileCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-2xl border-r border-[#E5E5EA] flex flex-col shrink-0 min-h-screen text-[#1C1C1E] shadow-sm z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#E5E5EA]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#007AFF] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-[#1C1C1E] tracking-tight block leading-tight">
              CebuFloodWatch
            </span>
            <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wider block">
              LGU Command Center
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation Tree */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Section 1: Disaster Operations */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8E8E93]">
            Operations
          </div>
          {operationsNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href) && !pathname?.startsWith('/admin'));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#007AFF] text-white shadow-sm shadow-blue-500/20 font-bold'
                    : 'text-[#6C6C70] hover:text-[#1C1C1E] hover:bg-[#F2F2F7]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8E8E93]'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FFEBEA] text-[#FF3B30] border border-[#FFD0CE]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Section 2: Administration Tree (Role-Gated) */}
        {isAdmin ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 pb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#007AFF] flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-[#007AFF]" />
                Administration
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#E5F1FF] text-[#007AFF]">
                ADMIN
              </span>
            </div>

            {adminNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#007AFF] text-white shadow-sm shadow-blue-500/20 font-bold'
                      : 'text-[#6C6C70] hover:text-[#1C1C1E] hover:bg-[#F2F2F7]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8E8E93]'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] text-center space-y-1.5">
            <Lock className="w-4 h-4 text-[#8E8E93] mx-auto" />
            <p className="text-[11px] font-bold text-[#1C1C1E]">Admin Suite Restricted</p>
            <p className="text-[10px] text-[#8E8E93]">Admin clearance required</p>
          </div>
        )}
      </div>

      {/* Operator Profile & Logout Dock */}
      <div className="p-3.5 border-t border-[#E5E5EA] bg-[#F8F9FA]/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E5F1FF] border border-[#CCE3FF] flex items-center justify-center font-extrabold text-xs text-[#007AFF]">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#1C1C1E] truncate max-w-[120px]">
                {user?.name || 'Authorized Operator'}
              </p>
              <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                {user?.role?.replace('_', ' ') || 'CDRRMO Desk'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-xl bg-white border border-[#E5E5EA] text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FFEBEA] transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
