'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Shield } from 'lucide-react';
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
    <header className="h-16 border-b border-[#E5E5EA] bg-white/90 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
      {/* Alert Ticker */}
      <div className="flex-1 max-w-3xl flex items-center gap-3 bg-[#FFEBEA] border border-[#FFD0CE] rounded-full px-4 py-2 overflow-hidden shadow-sm">
        <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF3B30]"></span>
        </span>
        <span className="text-[11px] font-extrabold text-[#FF3B30] uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          Active Bulletin:
        </span>
        <div className="text-xs text-[#1C1C1E] font-semibold truncate">
          {activeAlert}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* CDRRMO Live Node */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5F1FF] border border-[#CCE3FF] text-xs text-[#007AFF] font-bold">
          <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
          CDRRMO Command Node
        </div>

        {/* User avatar / status */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#E5E5EA]">
          <div className="w-9 h-9 rounded-full bg-[#E5F1FF] border border-[#CCE3FF] flex items-center justify-center font-bold text-xs text-[#007AFF]">
            DR
          </div>
          <div className="hidden md:block text-left text-xs">
            <p className="font-bold text-[#1C1C1E]">Disaster Operations</p>
            <p className="text-[10px] text-[#8E8E93]">Metro Cebu Cluster</p>
          </div>
        </div>
      </div>
    </header>
  );
}
