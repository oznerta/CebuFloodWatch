'use client';

import React, { useEffect, useState } from 'react';
import {
  Home,
  Users,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Droplets,
  Utensils,
  HeartPulse,
  Bed,
  RefreshCw,
  Inbox,
  Phone,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';

export default function EvacuationPage() {
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadShelters = async () => {
    try {
      const data = await fetchApi<any[]>('/shelters');
      setShelters(data || []);
    } catch {
      setShelters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelters();

    const socket = getSocket();
    if (socket) {
      socket.on('shelter:updated', (updated) => {
        setShelters((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('shelter:updated');
      }
    };
  }, []);

  const handleAdjustOccupancy = async (shelterId: string, delta: number) => {
    const target = shelters.find((s) => s.id === shelterId);
    if (!target) return;

    const nextOccupancy = Math.max(0, Math.min(target.max_capacity, (target.current_occupancy || 0) + delta));
    setUpdatingId(shelterId);

    try {
      await fetchApi(`/shelters/${shelterId}/occupancy`, {
        method: 'PATCH',
        body: JSON.stringify({ current_occupancy: nextOccupancy }),
      });
      setShelters((prev) =>
        prev.map((s) => (s.id === shelterId ? { ...s, current_occupancy: nextOccupancy } : s))
      );
    } catch {
      setShelters((prev) =>
        prev.map((s) => (s.id === shelterId ? { ...s, current_occupancy: nextOccupancy } : s))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (shelterId: string, nextStatus: string) => {
    setUpdatingId(shelterId);
    try {
      await fetchApi(`/shelters/${shelterId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setShelters((prev) =>
        prev.map((s) => (s.id === shelterId ? { ...s, status: nextStatus } : s))
      );
    } catch {
      setShelters((prev) =>
        prev.map((s) => (s.id === shelterId ? { ...s, status: nextStatus } : s))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const totalCapacity = shelters.reduce((acc, s) => acc + (s.max_capacity || 0), 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0);
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
            Evacuation Shelter Management
          </h1>
          <p className="text-sm text-[#8E8E93] mt-1 font-medium">
            Real-time occupancy tracking, resource stocks, and status broadcasts across Metro Cebu
          </p>
        </div>

        <button
          onClick={loadShelters}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5EA] rounded-xl text-xs font-extrabold text-[#1C1C1E] shadow-sm hover:bg-[#F2F2F7] transition-all"
        >
          <RefreshCw className="w-4 h-4 text-[#8E8E93]" />
          Sync Registry
        </button>
      </div>

      {/* Aggregate Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Hosted Evacuees</span>
            <Users className="w-4 h-4 text-[#007AFF]" />
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">
            {totalOccupancy} <span className="text-sm font-normal text-[#8E8E93]">/ {totalCapacity} Cap</span>
          </p>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Occupancy</span>
            <Home className="w-4 h-4 text-[#34C759]" />
          </div>
          <p className="text-2xl font-black text-[#1C1C1E]">{occupancyPercentage}%</p>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-xs font-bold uppercase tracking-wider">Active Open Centers</span>
            <CheckCircle className="w-4 h-4 text-[#34C759]" />
          </div>
          <p className="text-2xl font-black text-[#34C759]">
            {shelters.filter((s) => s.status === 'open').length} <span className="text-sm font-normal text-[#8E8E93]">/ {shelters.length} Sites</span>
          </p>
        </div>
      </div>

      {/* Shelters Grid */}
      {shelters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shelters.map((shelter) => {
            const occPct = Math.round(((shelter.current_occupancy || 0) / (shelter.max_capacity || 100)) * 100);
            const isUpdating = updatingId === shelter.id;

            return (
              <div
                key={shelter.id}
                className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#007AFF]">
                        Barangay {shelter.barangay_name}
                      </span>
                      <h3 className="font-extrabold text-base text-[#1C1C1E] mt-0.5 leading-snug">
                        {shelter.name}
                      </h3>
                      <p className="text-xs text-[#8E8E93] mt-1">{shelter.address || 'Designated Disaster Center'}</p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        shelter.status === 'open'
                          ? 'bg-[#EBF9EE] text-[#34C759]'
                          : shelter.status === 'full'
                          ? 'bg-[#FFEBEA] text-[#FF3B30]'
                          : 'bg-[#F2F2F7] text-[#8E8E93]'
                      }`}
                    >
                      {shelter.status}
                    </span>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#6C6C70]">Occupancy</span>
                      <span className="text-[#1C1C1E]">
                        {shelter.current_occupancy || 0} / {shelter.max_capacity || 0} ({occPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occPct >= 90
                            ? 'bg-[#FF3B30]'
                            : occPct >= 70
                            ? 'bg-[#FF9500]'
                            : 'bg-[#34C759]'
                        }`}
                        style={{ width: `${Math.min(100, occPct)}%` }}
                      />
                    </div>
                  </div>

                  {shelter.contact_number && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6C6C70] font-medium pt-1">
                      <Phone className="w-3.5 h-3.5 text-[#007AFF]" />
                      <span>{shelter.contact_number}</span>
                    </div>
                  )}
                </div>

                {/* Operator Actions */}
                <div className="pt-3 border-t border-[#F2F2F7] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustOccupancy(shelter.id, -10)}
                      disabled={isUpdating || (shelter.current_occupancy || 0) <= 0}
                      className="p-2 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-all disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAdjustOccupancy(shelter.id, 10)}
                      disabled={isUpdating || (shelter.current_occupancy || 0) >= (shelter.max_capacity || 0)}
                      className="p-2 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-all disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(shelter.id, shelter.status === 'open' ? 'full' : 'open')}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      shelter.status === 'open'
                        ? 'bg-[#FFEBEA] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white'
                        : 'bg-[#EBF9EE] text-[#34C759] hover:bg-[#34C759] hover:text-white'
                    }`}
                  >
                    {shelter.status === 'open' ? 'Set as Full' : 'Re-open Shelter'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <Inbox className="w-10 h-10 text-[#C7C7CC] mx-auto" />
          <h3 className="text-base font-extrabold text-[#1C1C1E]">No Evacuation Shelters Registered</h3>
          <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
            Designated evacuation centers and school gymnasiums will be displayed here once synchronized with the database.
          </p>
        </div>
      )}
    </div>
  );
}
