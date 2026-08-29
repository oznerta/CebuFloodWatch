'use client';

import React, { useEffect, useState } from 'react';
import { Home, Users, Plus, Minus, CheckCircle, AlertTriangle, XCircle, Droplets, Utensils, HeartPulse, Bed } from 'lucide-react';
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
      setShelters([
        {
          id: '1',
          name: 'Mabolo Elementary School Gymnasium',
          barangay_name: 'Mabolo',
          address: 'M.J. Cuenco Ave, Mabolo, Cebu City',
          max_capacity: 350,
          current_occupancy: 85,
          status: 'open',
          contact_number: '+63 32 231 1234',
          supplies: { water_liters: 1200, food_packs: 450, medical_kits: 30, bedding_sets: 200 },
        },
        {
          id: '2',
          name: 'Kasambagan Sports Complex',
          barangay_name: 'Kasambagan',
          address: 'Pres. Quirino St, Kasambagan, Cebu City',
          max_capacity: 250,
          current_occupancy: 240,
          status: 'full',
          contact_number: '+63 32 232 5678',
          supplies: { water_liters: 400, food_packs: 110, medical_kits: 15, bedding_sets: 80 },
        },
        {
          id: '3',
          name: 'Guadalupe Barangay Gymnasium',
          barangay_name: 'Guadalupe',
          address: 'Guadalupe Main Rd, Cebu City',
          max_capacity: 500,
          current_occupancy: 120,
          status: 'open',
          contact_number: '+63 32 254 9876',
          supplies: { water_liters: 2500, food_packs: 900, medical_kits: 60, bedding_sets: 400 },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelters();

    const socket = getSocket();
    socket.on('shelter:updated', (updated) => {
      setShelters((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
    });

    return () => {
      socket.off('shelter:updated');
    };
  }, []);

  const handleAdjustOccupancy = async (shelterId: string, delta: number) => {
    const target = shelters.find((s) => s.id === shelterId);
    if (!target) return;

    const nextOccupancy = Math.max(0, Math.min(target.max_capacity, target.current_occupancy + delta));
    setUpdatingId(shelterId);

    try {
      await fetchApi(`/shelters/${shelterId}/occupancy`, {
        method: 'PATCH',
        body: JSON.stringify({ current_occupancy: nextOccupancy }),
      });
      setShelters((prev) =>
        prev.map((s) =>
          s.id === shelterId
            ? { ...s, current_occupancy: nextOccupancy, status: nextOccupancy >= s.max_capacity ? 'full' : 'open' }
            : s
        )
      );
    } catch {
      setShelters((prev) =>
        prev.map((s) =>
          s.id === shelterId
            ? { ...s, current_occupancy: nextOccupancy, status: nextOccupancy >= s.max_capacity ? 'full' : 'open' }
            : s
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetStatus = async (shelterId: string, newStatus: 'open' | 'full' | 'closed') => {
    setUpdatingId(shelterId);
    try {
      await fetchApi(`/shelters/${shelterId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setShelters((prev) =>
        prev.map((s) => (s.id === shelterId ? { ...s, status: newStatus } : s))
      );
    } catch {
      setShelters((prev) =>
        prev.map((s) => (s.id === shelterId ? { ...s, status: newStatus } : s))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const totalCap = shelters.reduce((acc, s) => acc + s.max_capacity, 0);
  const totalOcc = shelters.reduce((acc, s) => acc + s.current_occupancy, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
            Evacuation Centers & Shelter Grid
          </h1>
          <p className="text-sm text-[#8E8E93] mt-1 font-medium">
            Real-time occupancy tracking, capacity thresholds, and relief supply inventory
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-4 bg-white border border-[#E5E5EA] px-5 py-2.5 rounded-2xl text-xs shadow-sm font-medium">
          <div>
            <span className="text-[#8E8E93]">Total Evacuees:</span>
            <span className="ml-1.5 font-extrabold text-[#1C1C1E]">{totalOcc}</span>
          </div>
          <div className="h-4 w-px bg-[#E5E5EA]" />
          <div>
            <span className="text-[#8E8E93]">Capacity:</span>
            <span className="ml-1.5 font-extrabold text-[#1C1C1E]">{totalCap}</span>
          </div>
          <div className="h-4 w-px bg-[#E5E5EA]" />
          <div>
            <span className="text-[#8E8E93]">System Load:</span>
            <span className="ml-1.5 font-extrabold text-[#007AFF]">
              {totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Shelter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shelters.map((shelter) => {
          const occPct = Math.round((shelter.current_occupancy / shelter.max_capacity) * 100);
          const isUpdating = updatingId === shelter.id;

          return (
            <div
              key={shelter.id}
              className="bg-white border border-[#E5E5EA] rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow space-y-4 shadow-sm"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-extrabold text-[#007AFF] uppercase tracking-wider">
                      Barangay {shelter.barangay_name || 'Cebu Zone'}
                    </span>
                    <h3 className="font-extrabold text-base text-[#1C1C1E] mt-0.5">
                      {shelter.name}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      shelter.status === 'open'
                        ? 'bg-[#EBF9EE] text-[#34C759]'
                        : shelter.status === 'full'
                        ? 'bg-[#FFF4E5] text-[#FF9500]'
                        : 'bg-[#F2F2F7] text-[#8E8E93]'
                    }`}
                  >
                    {shelter.status}
                  </span>
                </div>
                <p className="text-xs text-[#8E8E93] mt-1 font-medium">{shelter.address}</p>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#6C6C70]">Occupancy Level</span>
                  <span className={occPct >= 90 ? 'text-[#FF3B30] font-extrabold' : 'text-[#1C1C1E]'}>
                    {shelter.current_occupancy} / {shelter.max_capacity} ({occPct}%)
                  </span>
                </div>
                <div className="w-full bg-[#F2F2F7] rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      occPct >= 90 ? 'bg-[#FF3B30]' : occPct >= 70 ? 'bg-[#FF9500]' : 'bg-[#34C759]'
                    }`}
                    style={{ width: `${Math.min(100, occPct)}%` }}
                  />
                </div>
              </div>

              {/* Occupancy Stepper Controls */}
              <div className="bg-[#F8F9FA] p-3 rounded-xl flex items-center justify-between border border-[#E5E5EA]">
                <span className="text-xs font-bold text-[#6C6C70]">Quick Adjust</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdjustOccupancy(shelter.id, -10)}
                    disabled={isUpdating || shelter.current_occupancy <= 0}
                    className="w-7 h-7 rounded-lg bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center text-[#1C1C1E] hover:bg-[#F2F2F7] disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-extrabold text-[#1C1C1E] px-2 min-w-[32px] text-center">
                    {shelter.current_occupancy}
                  </span>
                  <button
                    onClick={() => handleAdjustOccupancy(shelter.id, 10)}
                    disabled={isUpdating || shelter.current_occupancy >= shelter.max_capacity}
                    className="w-7 h-7 rounded-lg bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center text-[#1C1C1E] hover:bg-[#F2F2F7] disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Supply Inventory Levels */}
              {shelter.supplies && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#F2F2F7]">
                  <div className="flex items-center gap-1.5 text-[#6C6C70] font-medium">
                    <Droplets className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>{shelter.supplies.water_liters || 0} L Water</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#6C6C70] font-medium">
                    <Utensils className="w-3.5 h-3.5 text-[#FF9500]" />
                    <span>{shelter.supplies.food_packs || 0} Food</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#6C6C70] font-medium">
                    <HeartPulse className="w-3.5 h-3.5 text-[#FF3B30]" />
                    <span>{shelter.supplies.medical_kits || 0} Meds</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#6C6C70] font-medium">
                    <Bed className="w-3.5 h-3.5 text-[#AF52DE]" />
                    <span>{shelter.supplies.bedding_sets || 0} Beds</span>
                  </div>
                </div>
              )}

              {/* Status Switcher Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleSetStatus(shelter.id, 'open')}
                  disabled={isUpdating || shelter.status === 'open'}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    shelter.status === 'open'
                      ? 'bg-[#34C759] text-white shadow-md shadow-green-500/20'
                      : 'bg-[#F2F2F7] text-[#6C6C70] hover:text-[#1C1C1E]'
                  }`}
                >
                  Open
                </button>
                <button
                  onClick={() => handleSetStatus(shelter.id, 'full')}
                  disabled={isUpdating || shelter.status === 'full'}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    shelter.status === 'full'
                      ? 'bg-[#FF9500] text-white shadow-md shadow-orange-500/20'
                      : 'bg-[#F2F2F7] text-[#6C6C70] hover:text-[#1C1C1E]'
                  }`}
                >
                  Full
                </button>
                <button
                  onClick={() => handleSetStatus(shelter.id, 'closed')}
                  disabled={isUpdating || shelter.status === 'closed'}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    shelter.status === 'closed'
                      ? 'bg-[#FF3B30] text-white shadow-md shadow-red-500/20'
                      : 'bg-[#F2F2F7] text-[#6C6C70] hover:text-[#1C1C1E]'
                  }`}
                >
                  Closed
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
