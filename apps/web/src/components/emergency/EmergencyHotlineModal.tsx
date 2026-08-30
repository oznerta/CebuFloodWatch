'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  Flame,
  Ship,
  HeartPulse,
  Truck,
  Copy,
  Check,
  Share2,
  X,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import {
  METRO_CEBU_HOTLINES,
  DisasterHotlineAgency,
} from '@cebufloodwatch/shared';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';

interface EmergencyHotlineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyHotlineModal({
  isOpen,
  onClose,
}: EmergencyHotlineModalProps) {
  const [hotlines, setHotlines] = useState<DisasterHotlineAgency[]>(METRO_CEBU_HOTLINES);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [sosCopied, setSosCopied] = useState(false);

  useEffect(() => {
    fetchApi<any>('/config/hotlines')
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setHotlines(res.data);
        }
      })
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      const handleUpdate = (updated: DisasterHotlineAgency[]) => {
        if (Array.isArray(updated) && updated.length > 0) {
          setHotlines(updated);
        }
      };
      socket.on('hotlines:updated', handleUpdate);
      return () => {
        socket.off('hotlines:updated', handleUpdate);
      };
    }
  }, []);

  if (!isOpen) return null;

  const getAgencyIcon = (type: DisasterHotlineAgency['iconType']) => {
    switch (type) {
      case 'disaster':
        return <ShieldAlert className="w-5 h-5 text-[#007AFF]" />;
      case 'police':
        return <ShieldAlert className="w-5 h-5 text-[#FF3B30]" />;
      case 'fire':
        return <Flame className="w-5 h-5 text-[#FF9500]" />;
      case 'coastguard':
        return <Ship className="w-5 h-5 text-[#007AFF]" />;
      case 'medical':
        return <HeartPulse className="w-5 h-5 text-[#FF3B30]" />;
      case 'traffic':
        return <Truck className="w-5 h-5 text-[#34C759]" />;
      default:
        return <PhoneCall className="w-5 h-5 text-[#007AFF]" />;
    }
  };

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopySOSDispatch = () => {
    const sosText = `🚨 EMERGENCY DISASTER SOS (Metro Cebu): I require emergency assistance due to severe flood conditions. Current Coordinate Pin: https://maps.google.com/?q=10.3157,123.8854 (Tracked live via CebuFloodWatch)`;
    navigator.clipboard.writeText(sosText);
    setSosCopied(true);
    setTimeout(() => setSosCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E5EA] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E5EA] bg-[#FFEBEA]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFEBEA] border border-[#FFD0CE] flex items-center justify-center text-[#FF3B30] shadow-sm">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1C1C1E]">
                Metro Cebu Emergency Hotline Hub
              </h3>
              <p className="text-xs text-[#6C6C70] font-medium mt-0.5">
                Official 24/7 disaster response, water rescue & medical lines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E5E5EA] flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SOS Broadcaster Card */}
        <div className="p-5 bg-[#F8F9FA] border-b border-[#E5E5EA] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF3B30] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              1-Tap SOS Location Dispatch
            </span>
            {sosCopied && (
              <span className="text-[11px] font-bold text-[#34C759] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> SOS Text Copied!
              </span>
            )}
          </div>

          <div className="bg-white p-3 rounded-2xl border border-[#E5E5EA] text-xs text-[#3A3A3C] font-mono leading-relaxed">
            🚨 EMERGENCY DISASTER SOS (Metro Cebu): I require emergency assistance due to severe flood conditions. Coordinates: 10.3157, 123.8854 (Cebu City)
          </div>

          <button
            onClick={handleCopySOSDispatch}
            className="w-full py-2.5 rounded-xl bg-[#FF3B30] hover:bg-[#D92B21] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/20"
          >
            <Share2 className="w-4 h-4" />
            Copy SOS Location Dispatch for SMS / Messenger
          </button>
        </div>

        {/* Hotlines List */}
        <div className="p-4 max-h-[380px] overflow-y-auto space-y-2">
          {hotlines.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E5E5EA] hover:bg-white hover:shadow-sm transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EA] shadow-xs flex items-center justify-center flex-shrink-0">
                  {getAgencyIcon(item.iconType)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-[#1C1C1E] truncate">
                      {item.agency}
                    </h4>
                    {item.shortCode && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#FFEBEA] text-[#FF3B30] border border-[#FFD0CE]">
                        {item.shortCode}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8E8E93] truncate mt-0.5 font-medium">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleCopyPhone(item.id, item.phone)}
                  title="Copy Phone Number"
                  className="p-2 rounded-xl bg-white border border-[#E5E5EA] text-[#6C6C70] hover:text-[#1C1C1E] shadow-xs transition-colors text-xs font-bold flex items-center gap-1"
                >
                  {copiedIndex === item.id ? (
                    <Check className="w-3.5 h-3.5 text-[#34C759]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <a
                  href={`tel:${item.phone}`}
                  className="px-3.5 py-2 rounded-xl bg-[#34C759] hover:bg-[#28A745] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-green-500/20 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Line</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E5EA] bg-[#F8F9FA] text-center text-xs text-[#8E8E93] font-medium">
          Integrated with Cebu City Disaster Risk Reduction & Management Council
        </div>
      </div>
    </div>
  );
}
