'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Building,
  Route,
  Activity,
  Home,
  HeartPulse,
  ArrowRight,
  X,
  Compass,
} from 'lucide-react';
import {
  METRO_CEBU_LANDMARKS,
  CebuLandmark,
  searchCebuLandmarks,
} from '@cebufloodwatch/shared';

interface OmnibarSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLandmark?: (landmark: CebuLandmark) => void;
}

export function OmnibarSearchModal({
  isOpen,
  onClose,
  onSelectLandmark,
}: OmnibarSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CebuLandmark[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setResults(METRO_CEBU_LANDMARKS.slice(0, 6));
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      setResults(searchCebuLandmarks(query));
    } else {
      setResults(METRO_CEBU_LANDMARKS.slice(0, 6));
    }
  }, [query]);

  // Global shortcut Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getCategoryIcon = (cat: CebuLandmark['category']) => {
    switch (cat) {
      case 'hospital':
        return <HeartPulse className="w-4 h-4 text-[#FF3B30]" />;
      case 'sensor':
        return <Activity className="w-4 h-4 text-[#007AFF]" />;
      case 'shelter':
        return <Home className="w-4 h-4 text-[#34C759]" />;
      case 'road':
        return <Route className="w-4 h-4 text-[#FF9500]" />;
      case 'barangay':
        return <MapPin className="w-4 h-4 text-[#AF52DE]" />;
      default:
        return <Building className="w-4 h-4 text-[#007AFF]" />;
    }
  };

  const getCategoryColor = (cat: CebuLandmark['category']) => {
    switch (cat) {
      case 'hospital':
        return 'bg-[#FFEBEA] text-[#FF3B30] border-[#FFD0CE]';
      case 'sensor':
        return 'bg-[#E5F1FF] text-[#007AFF] border-[#CCE3FF]';
      case 'shelter':
        return 'bg-[#EBF9EE] text-[#34C759] border-[#C3F0CD]';
      case 'road':
        return 'bg-[#FFF4E5] text-[#FF9500] border-[#FFE4BE]';
      case 'barangay':
        return 'bg-[#F7ECFB] text-[#AF52DE] border-[#EBD0F5]';
      default:
        return 'bg-[#F2F2F7] text-[#1C1C1E] border-[#E5E5EA]';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E5EA] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E5E5EA] bg-[#F8F9FA]/80 backdrop-blur-md">
          <Search className="w-5 h-5 text-[#8E8E93]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Metro Cebu barangays, landmarks, sensors, hospitals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-[#E5E5EA] text-[#8E8E93]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-2 py-0.5 text-[10px] font-extrabold text-[#8E8E93] bg-white border border-[#E5E5EA] rounded-md shadow-xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8E8E93] flex justify-between items-center">
            <span>{query ? 'Search Results' : 'Suggested Metro Cebu Key Locations'}</span>
            <span>{results.length} locations</span>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Compass className="w-8 h-8 text-[#8E8E93] mx-auto animate-spin" />
              <p className="text-xs font-bold text-[#1C1C1E]">No matching locations found</p>
              <p className="text-[11px] text-[#8E8E93]">
                Try searching "Mabolo", "IT Park", "VSMMC", "Mahiga", or "Underpass".
              </p>
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (onSelectLandmark) {
                    onSelectLandmark(item);
                  }
                  onClose();
                }}
                className="w-full text-left p-3 rounded-2xl hover:bg-[#F2F2F7] transition-all flex items-center justify-between group border border-transparent hover:border-[#E5E5EA]"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EA] shadow-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-[#1C1C1E] truncate">
                        {item.name}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${getCategoryColor(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#6C6C70] truncate mt-0.5 font-medium">
                      Barangay {item.barangay} &bull; {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-[#007AFF] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <span>Fly To Location</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer Quick Navigation Hints */}
        <div className="px-5 py-3 border-t border-[#E5E5EA] bg-[#F8F9FA] flex items-center justify-between text-[11px] text-[#8E8E93] font-medium">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-bold text-[#1C1C1E]">↑</kbd> <kbd className="font-bold text-[#1C1C1E]">↓</kbd> to navigate</span>
            <span>&bull;</span>
            <span>Press <kbd className="font-bold text-[#1C1C1E]">↵</kbd> to fly to pin</span>
          </div>
          <span>Metro Cebu Coordinate Geofence</span>
        </div>
      </div>
    </div>
  );
}
