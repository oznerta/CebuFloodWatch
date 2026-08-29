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
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Flood Map', href: '/map', icon: Map },
  { name: 'Citizen Reports', href: '/reports', icon: AlertCircle },
  { name: 'Evacuation Centers', href: '/evacuation', icon: Home },
  { name: 'Road Passability', href: '/roads', icon: Split },
  { name: 'AI Alert Studio', href: '/alerts', icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-[#E5E5EA] flex flex-col shrink-0 min-h-screen text-[#1C1C1E] shadow-sm">
      {/* Apple Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-[#E5E5EA]">
        <div className="w-9 h-9 rounded-xl bg-[#007AFF] flex items-center justify-center text-white shadow-md shadow-blue-500/30">
          <Radio className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-base text-[#1C1C1E] tracking-tight">
            CebuFloodWatch
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-[#007AFF]">
            CDRRMO Operations
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3.5 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
          Operations & Intelligence
        </div>
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/25 font-bold'
                  : 'text-[#6C6C70] hover:text-[#1C1C1E] hover:bg-[#F2F2F7]'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8E8E93]'}`}
              />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#E5E5EA] bg-[#F8F9FA]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] animate-ping" />
          <div>
            <p className="text-xs font-bold text-[#1C1C1E]">Telemetry Grid Live</p>
            <p className="text-[11px] text-[#8E8E93]">Metro Cebu Sensor Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
