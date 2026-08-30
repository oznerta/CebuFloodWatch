'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  PhoneCall,
  Gauge,
  Sparkles,
  LogIn,
  User,
} from 'lucide-react';
import { getSocket } from '../../lib/socket';
import { OmnibarSearchModal } from '../search/OmnibarSearchModal';
import { EmergencyHotlineModal } from '../emergency/EmergencyHotlineModal';
import { VehiclePassabilityModal } from '../tools/VehiclePassabilityModal';
import { CebuLandmark } from '@cebufloodwatch/shared';

export function Header() {
  const [activeAlert, setActiveAlert] = useState<string>(
    'OPERATIONAL ADVISORY: Real-time telemetry sensors active across Suba-Mabolo, Mahiga Creek, and Guadalupe catchments.'
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const [hotlineOpen, setHotlineOpen] = useState(false);
  const [passabilityOpen, setPassabilityOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // Check localStorage user session
    try {
      const stored = localStorage.getItem('cebu_auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}

    const socket = getSocket();
    if (socket) {
      socket.on('alert:new', (newAlert) => {
        if (newAlert && newAlert.title_en) {
          setActiveAlert(`${newAlert.severity?.toUpperCase()}: ${newAlert.title_en} — ${newAlert.body_en}`);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('alert:new');
      }
    };
  }, []);

  const handleSelectLandmark = (landmark: CebuLandmark) => {
    window.dispatchEvent(
      new CustomEvent('map:flyto', {
        detail: {
          latitude: landmark.latitude,
          longitude: landmark.longitude,
          name: landmark.name,
          category: landmark.category,
        },
      })
    );
  };

  return (
    <>
      <header className="h-16 border-b border-[#E5E5EA] bg-white/90 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm gap-4">
        {/* Alert Ticker */}
        <div className="flex-1 max-w-xl flex items-center gap-3 bg-[#E5F1FF] border border-[#CCE3FF] rounded-full px-4 py-2 overflow-hidden shadow-xs">
          <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#007AFF]"></span>
          </span>
          <span className="text-[11px] font-extrabold text-[#007AFF] uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Live Bulletin:
          </span>
          <div className="text-xs text-[#1C1C1E] font-semibold truncate">
            {activeAlert}
          </div>
        </div>

        {/* Global Spotlight Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#F8F9FA] hover:bg-[#F2F2F7] border border-[#E5E5EA] text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] transition-all shadow-xs min-w-[240px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#8E8E93]" />
            <span>Search Cebu locations...</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-extrabold text-[#8E8E93] bg-white border border-[#E5E5EA] rounded-md shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Action Buttons & Utilities */}
        <div className="flex items-center gap-2.5">
          {/* Vehicle Passability Calculator Tool */}
          <button
            onClick={() => setPassabilityOpen(true)}
            title="Vehicle Flood Clearance Calculator"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] hover:text-[#007AFF] hover:bg-[#F8F9FA] shadow-xs transition-all"
          >
            <Gauge className="w-4 h-4 text-[#007AFF]" />
            <span className="hidden lg:inline">Vehicle Clearance</span>
          </button>

          {/* Emergency Hotlines Button */}
          <button
            onClick={() => setHotlineOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFEBEA] hover:bg-[#FFD9D7] border border-[#FFD0CE] text-xs font-extrabold text-[#FF3B30] shadow-xs transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Hotlines (161)</span>
          </button>

          {/* User Profile / Login Link */}
          <Link
            href="/login"
            className="flex items-center gap-2.5 pl-2 border-l border-[#E5E5EA] group"
          >
            <div className="w-9 h-9 rounded-full bg-[#E5F1FF] border border-[#CCE3FF] flex items-center justify-center font-extrabold text-xs text-[#007AFF] group-hover:bg-[#007AFF] group-hover:text-white transition-all shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden xl:block text-left text-xs">
              <p className="font-extrabold text-[#1C1C1E] group-hover:text-[#007AFF] transition-colors">
                {user ? user.name : 'Sign In'}
              </p>
              <p className="text-[10px] text-[#8E8E93]">
                {user ? `${user.role?.toUpperCase()} Access` : 'Official Portal'}
              </p>
            </div>
          </Link>
        </div>
      </header>

      {/* Modals */}
      <OmnibarSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectLandmark={handleSelectLandmark}
      />
      <EmergencyHotlineModal
        isOpen={hotlineOpen}
        onClose={() => setHotlineOpen(false)}
      />
      <VehiclePassabilityModal
        isOpen={passabilityOpen}
        onClose={() => setPassabilityOpen(false)}
      />
    </>
  );
}
