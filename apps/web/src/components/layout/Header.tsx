'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Bell, Moon, Sun, ShieldAlert, Sparkles } from 'lucide-react';
import { getSocket } from '../../lib/socket';

export function Header() {
  const [activeAlert, setActiveAlert] = useState<string>(
    'CRITICAL FLOOD WARNING: Mahiga Creek overflowing in Subangdaku / Kasambagan. Mandatory evacuation along river banks.'
  );

  useEffect(() => {
    const socket = getSocket();
    socket.on('alert:new', (newAlert) => {
      if (newAlert && newAlert.title_en) {
        setActiveAlert(`${newAlert.severity?.toUpperCase()}: ${newAlert.title_en} — ${newAlert.body_en}`);
      }
    });

    return () => {
      socket.off('alert:new');
    };
  }, []);

  return (
    <header className="h-16 border-b border-surface-border bg-surface-card flex items-center justify-between px-6 z-10 sticky top-0">
      {/* Alert Ticker */}
      <div className="flex-1 max-w-3xl flex items-center gap-3 bg-rose-950/40 border border-rose-900/50 rounded-lg px-3 py-1.5 overflow-hidden">
        <span className="flex h-2 w-2 relative flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          Active Bulletin:
        </span>
        <div className="text-xs text-rose-200 truncate font-medium">
          {activeAlert}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* LGU Tag */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          CDRRMO Live Node
        </div>

        {/* User avatar / status */}
        <div className="flex items-center gap-3 pl-2 border-l border-surface-border">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-surface-border flex items-center justify-center font-bold text-xs text-blue-400">
            DR
          </div>
          <div className="hidden md:block text-left text-xs">
            <p className="font-semibold text-slate-200">Disaster Ops Center</p>
            <p className="text-[10px] text-slate-400">Metro Cebu Node</p>
          </div>
        </div>
      </div>
    </header>
  );
}
