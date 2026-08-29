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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Evacuation Operations & Shelter Capacity
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time occupancy tracking, capacity thresholds, and relief supply inventory
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-4 bg-surface-card border border-surface-border px-4 py-2 rounded-xl text-xs">
          <div>
            <span className="text-slate-400">Total Evacuees:</span>
            <span className="ml-1 font-bold text-slate-900 dark:text-white">{totalOcc}</span>
          </div>
          <div className="h-4 w-px bg-surface-border" />
          <div>
            <span className="text-slate-400">Total Capacity:</span>
            <span className="ml-1 font-bold text-slate-900 dark:text-white">{totalCap}</span>
          </div>
          <div className="h-4 w-px bg-surface-border" />
          <div>
            <span className="text-slate-400">System Load:</span>
            <span className="ml-1 font-bold text-blue-500">
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
              className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4 shadow-sm"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                      Barangay {shelter.barangay_name || 'Cebu Zone'}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                      {shelter.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      shelter.status === 'open'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : shelter.status === 'full'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {shelter.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{shelter.address}</p>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Occupancy Level</span>
                  <span className={occPct >= 90 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {shelter.current_occupancy} / {shelter.max_capacity} ({occPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      occPct >= 90 ? 'bg-rose-500' : occPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, occPct)}%` }}
                  />
                </div>
              </div>

              {/* Occupancy Controls */}
              <div className="bg-surface-subtle p-3 rounded-lg flex items-center justify-between border border-surface-border">
                <span className="text-xs font-semibold text-slate-300">Quick Adjust</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdjustOccupancy(shelter.id, -10)}
                    disabled={isUpdating || shelter.current_occupancy <= 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-white px-2">
                    {shelter.current_occupancy}
                  </span>
                  <button
                    onClick={() => handleAdjustOccupancy(shelter.id, 10)}
                    disabled={isUpdating || shelter.current_occupancy >= shelter.max_capacity}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Supply Inventory Levels */}
              {shelter.supplies && (
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-surface-border">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>{shelter.supplies.water_liters || 0} L Water</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    <span>{shelter.supplies.food_packs || 0} Food Packs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                    <span>{shelter.supplies.medical_kits || 0} Med Kits</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Bed className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{shelter.supplies.bedding_sets || 0} Bedding Sets</span>
                  </div>
                </div>
              )}

              {/* Status Switcher Buttons */}
              <div className="flex gap-1.5 pt-2">
                <button
                  onClick={() => handleSetStatus(shelter.id, 'open')}
                  disabled={isUpdating || shelter.status === 'open'}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                    shelter.status === 'open'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Open
                </button>
                <button
                  onClick={() => handleSetStatus(shelter.id, 'full')}
                  disabled={isUpdating || shelter.status === 'full'}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                    shelter.status === 'full'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Full
                </button>
                <button
                  onClick={() => handleSetStatus(shelter.id, 'closed')}
                  disabled={isUpdating || shelter.status === 'closed'}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                    shelter.status === 'closed'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
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
