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
  Trash2,
  X,
  MapPin,
  Building,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { CEBU_BARANGAY_NAMES } from '@cebufloodwatch/shared';

export default function EvacuationPage() {
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    barangay_name: 'Guadalupe',
    address: '',
    max_capacity: 300,
    contact_number: '+63 (32) ',
    water_liters: 1200,
    food_packs: 400,
  });

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
      socket.on('shelter:created', (newShelter) => {
        setShelters((prev) => [newShelter, ...prev]);
      });
      socket.on('shelter:deleted', ({ id }) => {
        setShelters((prev) => prev.filter((s) => s.id !== id));
      });
    }

    return () => {
      if (socket) {
        socket.off('shelter:updated');
        socket.off('shelter:created');
        socket.off('shelter:deleted');
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

  const handleDeleteShelter = async (shelterId: string) => {
    if (!confirm('Are you sure you want to remove this evacuation center from the registry?')) return;
    try {
      await fetchApi(`/shelters/${shelterId}`, { method: 'DELETE' });
      setShelters((prev) => prev.filter((s) => s.id !== shelterId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove shelter');
    }
  };

  const handleCreateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        barangay_name: formData.barangay_name,
        address: formData.address.trim() || `${formData.barangay_name}, Cebu City`,
        max_capacity: Number(formData.max_capacity),
        contact_number: formData.contact_number.trim(),
        supplies: {
          water_liters: Number(formData.water_liters),
          food_packs: Number(formData.food_packs),
        },
      };

      const res = await fetchApi<any>('/shelters', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res) {
        setShelters((prev) => [res, ...prev.filter((s) => s.id !== res.id)]);
      }
      setShowAddModal(false);
      setFormData({
        name: '',
        barangay_name: 'Guadalupe',
        address: '',
        max_capacity: 300,
        contact_number: '+63 (32) ',
        water_liters: 1200,
        food_packs: 400,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to register evacuation center');
    } finally {
      setIsSubmitting(false);
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

        <div className="flex items-center gap-3">
          <button
            onClick={loadShelters}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E5EA] rounded-xl text-xs font-extrabold text-[#1C1C1E] shadow-sm hover:bg-[#F2F2F7] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#8E8E93]" />
            Sync Registry
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#007AFF] text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-[#0062CC] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register Shelter
          </button>
        </div>
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
                        Barangay {shelter.barangay_name || 'Cebu City'}
                      </span>
                      <h3 className="font-extrabold text-base text-[#1C1C1E] mt-0.5 leading-snug">
                        {shelter.name}
                      </h3>
                      <p className="text-xs text-[#8E8E93] mt-1">{shelter.address || 'Designated Disaster Center'}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
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
                      <button
                        onClick={() => handleDeleteShelter(shelter.id)}
                        className="p-1 text-[#8E8E93] hover:text-[#FF3B30] transition-colors cursor-pointer"
                        title="Remove shelter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#6C6C70]">Occupancy</span>
                      <span className="text-[#1C1C1E]">
                        {shelter.current_occupancy || 0} / {shelter.max_capacity || 0} ({occPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#F2F2F7] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occPct >= 90
                            ? 'bg-[#FF3B30]'
                            : occPct >= 70
                            ? 'bg-[#FF9500]'
                            : 'bg-[#34C759]'
                        }`}
                        style={{ width: `${Math.min(occPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Resource Inventory */}
                  {shelter.supplies && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F2F2F7] text-xs">
                      <div className="flex items-center gap-1.5 text-[#6C6C70]">
                        <Droplets className="w-3.5 h-3.5 text-[#007AFF]" />
                        <span className="font-bold text-[#1C1C1E]">{shelter.supplies.water_liters || 0}L</span> Water
                      </div>
                      <div className="flex items-center gap-1.5 text-[#6C6C70]">
                        <Utensils className="w-3.5 h-3.5 text-[#FF9500]" />
                        <span className="font-bold text-[#1C1C1E]">{shelter.supplies.food_packs || 0}</span> Food Packs
                      </div>
                    </div>
                  )}

                  {shelter.contact_number && (
                    <div className="flex items-center gap-1.5 text-xs text-[#8E8E93] pt-1">
                      <Phone className="w-3.5 h-3.5 text-[#34C759]" />
                      <span>{shelter.contact_number}</span>
                    </div>
                  )}
                </div>

                {/* Operator Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F2F2F7] gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustOccupancy(shelter.id, -10)}
                      disabled={isUpdating || (shelter.current_occupancy || 0) <= 0}
                      className="p-2 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAdjustOccupancy(shelter.id, 10)}
                      disabled={isUpdating || (shelter.current_occupancy || 0) >= (shelter.max_capacity || 0)}
                      className="p-2 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(shelter.id, shelter.status === 'open' ? 'full' : 'open')}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
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
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <Inbox className="w-10 h-10 text-[#C7C7CC] mx-auto" />
          <h3 className="text-base font-extrabold text-[#1C1C1E]">No Evacuation Shelters Registered</h3>
          <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
            Designated evacuation centers and school gymnasiums can be registered by administrators to track occupancy in real-time.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-[#0062CC] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add First Shelter
          </button>
        </div>
      )}

      {/* Add Shelter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#007AFF]/10 text-[#007AFF]">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1C1C1E]">Register Evacuation Shelter</h3>
                  <p className="text-xs text-[#8E8E93]">Metro Cebu Disaster Resource Center</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShelter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Shelter / Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guadalupe Elementary School Gymnasium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Barangay (80 Authentic)</label>
                  <select
                    value={formData.barangay_name}
                    onChange={(e) => setFormData({ ...formData, barangay_name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] bg-white cursor-pointer"
                  >
                    {CEBU_BARANGAY_NAMES.map((bgy) => (
                      <option key={bgy} value={bgy}>
                        Brgy. {bgy}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Max Capacity (Persons)</label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    required
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. V. Rama Avenue, Guadalupe, Cebu City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#6C6C70] mb-1">Water (Liters)</label>
                  <input
                    type="number"
                    value={formData.water_liters}
                    onChange={(e) => setFormData({ ...formData, water_liters: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6C6C70] mb-1">Food Packs</label>
                  <input
                    type="number"
                    value={formData.food_packs}
                    onChange={(e) => setFormData({ ...formData, food_packs: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6C6C70] mb-1">Hotline Contact</label>
                  <input
                    type="text"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2F2F7]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] hover:bg-[#F2F2F7] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#007AFF] text-white text-xs font-extrabold hover:bg-[#0062CC] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? 'Registering...' : 'Register Shelter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
