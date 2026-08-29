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
  Megaphone,
  ShieldCheck,
  Radio,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Flood Map', href: '/map', icon: Map },
  { name: 'Citizen Reports', href: '/reports', icon: AlertCircle },
  { name: 'Evacuation Ops', href: '/evacuation', icon: Home },
  { name: 'Road Closures', href: '/roads', icon: Split },
  { name: 'AI Alert Drafter', href: '/alerts', icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen text-slate-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <span className="font-bold text-base text-white tracking-tight">CebuFloodWatch</span>
          <span className="block text-[10px] uppercase font-semibold tracking-wider text-blue-400">
            DRRMO Command Portal
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Operations & Intelligence
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <p className="text-xs font-semibold text-white">Telemetry Online</p>
            <p className="text-[11px] text-slate-400">Metro Cebu Grid Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
