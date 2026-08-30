'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Car,
  ShieldAlert,
  Flame,
  Ship,
  HeartPulse,
  Truck,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
  Info,
  Phone,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import {
  DisasterHotlineAgency,
  VehicleClearanceCategory,
} from '@cebufloodwatch/shared';

export default function EmergencySettingsPage() {
  const [activeTab, setActiveTab] = useState<'hotlines' | 'vehicles'>('hotlines');

  // Hotlines state
  const [hotlines, setHotlines] = useState<DisasterHotlineAgency[]>([]);
  const [loadingHotlines, setLoadingHotlines] = useState(true);
  const [savingHotlines, setSavingHotlines] = useState(false);
  const [hotlinesSuccess, setHotlinesSuccess] = useState(false);

  // Edit / Add Hotline modal
  const [editingHotline, setEditingHotline] = useState<DisasterHotlineAgency | null>(null);
  const [hotlineModalOpen, setHotlineModalOpen] = useState(false);

  // Vehicles state
  const [vehicles, setVehicles] = useState<VehicleClearanceCategory[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [savingVehicles, setSavingVehicles] = useState(false);
  const [vehiclesSuccess, setVehiclesSuccess] = useState(false);

  // Edit / Add Vehicle modal
  const [editingVehicle, setEditingVehicle] = useState<VehicleClearanceCategory | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  // Load initial configurations from backend
  const loadHotlines = async () => {
    try {
      const res = await fetchApi<any>('/admin/config/hotlines');
      if (res && res.data) {
        setHotlines(res.data);
      }
    } catch (err) {
      console.warn('Could not load custom hotlines:', err);
    } finally {
      setLoadingHotlines(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await fetchApi<any>('/admin/config/vehicles');
      if (res && res.data) {
        setVehicles(res.data);
      }
    } catch (err) {
      console.warn('Could not load custom vehicle clearances:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    loadHotlines();
    loadVehicles();
  }, []);

  // --- Hotlines Handlers ---
  const handleSaveHotlines = async (updatedList: DisasterHotlineAgency[]) => {
    setSavingHotlines(true);
    setHotlinesSuccess(false);
    try {
      const res = await fetchApi<any>('/admin/config/hotlines', {
        method: 'PUT',
        body: JSON.stringify({ hotlines: updatedList }),
      });
      if (res && res.success) {
        setHotlines(res.data || updatedList);
        setHotlinesSuccess(true);
        setTimeout(() => setHotlinesSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(`Failed to save emergency hotlines: ${err.message}`);
    } finally {
      setSavingHotlines(false);
    }
  };

  const handleResetHotlines = async () => {
    if (!confirm('Reset all emergency hotlines to official Metro Cebu OCD-7 defaults?')) return;
    setSavingHotlines(true);
    try {
      const res = await fetchApi<any>('/admin/config/hotlines/reset', { method: 'POST' });
      if (res && res.data) {
        setHotlines(res.data);
        setHotlinesSuccess(true);
        setTimeout(() => setHotlinesSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(`Failed to reset hotlines: ${err.message}`);
    } finally {
      setSavingHotlines(false);
    }
  };

  const handleDeleteHotline = (id: string) => {
    const next = hotlines.filter((h) => h.id !== id);
    setHotlines(next);
    handleSaveHotlines(next);
  };

  const handleOpenAddHotline = () => {
    setEditingHotline({
      id: `hotline_${Date.now()}`,
      name: '',
      agency: '',
      phone: '',
      shortCode: '',
      description: '',
      iconType: 'disaster',
    });
    setHotlineModalOpen(true);
  };

  const handleSaveHotlineModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotline || !editingHotline.name.trim() || !editingHotline.phone.trim()) return;

    let next: DisasterHotlineAgency[];
    const exists = hotlines.some((h) => h.id === editingHotline.id);
    if (exists) {
      next = hotlines.map((h) => (h.id === editingHotline.id ? editingHotline : h));
    } else {
      next = [...hotlines, editingHotline];
    }

    setHotlines(next);
    setHotlineModalOpen(false);
    setEditingHotline(null);
    handleSaveHotlines(next);
  };

  // --- Vehicle Clearances Handlers ---
  const handleSaveVehicles = async (updatedList: VehicleClearanceCategory[]) => {
    setSavingVehicles(true);
    setVehiclesSuccess(false);
    try {
      const res = await fetchApi<any>('/admin/config/vehicles', {
        method: 'PUT',
        body: JSON.stringify({ vehicles: updatedList }),
      });
      if (res && res.success) {
        setVehicles(res.data || updatedList);
        setVehiclesSuccess(true);
        setTimeout(() => setVehiclesSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(`Failed to save vehicle clearance specifications: ${err.message}`);
    } finally {
      setSavingVehicles(false);
    }
  };

  const handleResetVehicles = async () => {
    if (!confirm('Reset all vehicle clearance specifications to manufacturer standard defaults?')) return;
    setSavingVehicles(true);
    try {
      const res = await fetchApi<any>('/admin/config/vehicles/reset', { method: 'POST' });
      if (res && res.data) {
        setVehicles(res.data);
        setVehiclesSuccess(true);
        setTimeout(() => setVehiclesSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(`Failed to reset vehicle clearances: ${err.message}`);
    } finally {
      setSavingVehicles(false);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    const next = vehicles.filter((v) => v.id !== id);
    setVehicles(next);
    handleSaveVehicles(next);
  };

  const handleOpenAddVehicle = () => {
    setEditingVehicle({
      id: `veh_${Date.now()}`,
      name: '',
      maxSafeDepthCm: 30,
      criticalLimitCm: 50,
      icon: '🚙',
      recommendation: '',
    });
    setVehicleModalOpen(true);
  };

  const handleSaveVehicleModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !editingVehicle.name.trim()) return;

    let next: VehicleClearanceCategory[];
    const exists = vehicles.some((v) => v.id === editingVehicle.id);
    if (exists) {
      next = vehicles.map((v) => (v.id === editingVehicle.id ? editingVehicle : v));
    } else {
      next = [...vehicles, editingVehicle];
    }

    setVehicles(next);
    setVehicleModalOpen(false);
    setEditingVehicle(null);
    handleSaveVehicles(next);
  };

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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5EA] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#007AFF]/10 text-[#007AFF] rounded-xl">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1C1C1E] tracking-tight">
                Emergency &amp; Passability Configuration
              </h1>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Dynamic administrator control for public emergency hotlines and vehicle clearance depth thresholds
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#F2F2F7] p-1 rounded-2xl border border-[#E5E5EA]">
          <button
            onClick={() => setActiveTab('hotlines')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'hotlines'
                ? 'bg-white text-[#007AFF] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency Hotlines ({hotlines.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-white text-[#007AFF] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Vehicle Clearances ({vehicles.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EMERGENCY HOTLINES */}
      {activeTab === 'hotlines' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#1C1C1E]">
                Official Metro Cebu 24/7 Hotlines
              </h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Configured hotlines sync live to the public web modal, mobile app, and SOS one-touch dialers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetHotlines}
                disabled={savingHotlines}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#6C6C70] hover:bg-[#F2F2F7] transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to OCD-7 Defaults</span>
              </button>

              <button
                onClick={handleOpenAddHotline}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-black hover:bg-[#0062CC] transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Emergency Hotline</span>
              </button>
            </div>
          </div>

          {hotlinesSuccess && (
            <div className="p-3.5 rounded-2xl bg-[#EBF9EE] border border-[#C3F0CD] flex items-center gap-2 text-xs font-bold text-[#2E7D32] animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Emergency hotlines updated &amp; broadcasted to all active citizen clients! 🟢</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotlines.map((hotline) => (
              <div
                key={hotline.id}
                className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#007AFF]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
                      {getAgencyIcon(hotline.iconType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-[#1C1C1E]">
                          {hotline.agency}
                        </span>
                        {hotline.shortCode && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FFEBEA] text-[#FF3B30] text-[10px] font-black tracking-wider">
                            Code: {hotline.shortCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#6C6C70] mt-0.5">{hotline.name}</p>
                      <p className="text-xs font-mono font-extrabold text-[#007AFF] mt-1.5">
                        📞 {hotline.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingHotline(hotline);
                        setHotlineModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-[#007AFF] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
                      title="Edit Hotline"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHotline(hotline.id)}
                      className="p-2 rounded-xl text-[#FF3B30] hover:bg-[#FFEBEA] transition-colors cursor-pointer"
                      title="Delete Hotline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[#8E8E93] bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E5EA]/60 font-medium">
                  {hotline.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VEHICLE CLEARANCES */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#1C1C1E]">
                Vehicle Flood Clearance &amp; Passability Thresholds
              </h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Calibrate vehicle ground clearance, hydrostatic lock limits, and evacuation directives
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetVehicles}
                disabled={savingVehicles}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#6C6C70] hover:bg-[#F2F2F7] transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Standard Specs</span>
              </button>

              <button
                onClick={handleOpenAddVehicle}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-black hover:bg-[#0062CC] transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle Class</span>
              </button>
            </div>
          </div>

          {vehiclesSuccess && (
            <div className="p-3.5 rounded-2xl bg-[#EBF9EE] border border-[#C3F0CD] flex items-center gap-2 text-xs font-bold text-[#2E7D32] animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Vehicle clearances updated &amp; synchronized with Passability Calculator! 🟢</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-[#E5E5EA] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#007AFF]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] border border-[#E5E5EA] flex items-center justify-center text-2xl shrink-0">
                      {v.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#1C1C1E]">{v.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#EBF9EE] border border-[#C3F0CD] text-[#2E7D32] text-[11px] font-black">
                          Safe &le; {v.maxSafeDepthCm} cm
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#FFEBEA] border border-[#FFD0CE] text-[#FF3B30] text-[11px] font-black">
                          Submerged &gt; {v.criticalLimitCm} cm
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingVehicle(v);
                        setVehicleModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-[#007AFF] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
                      title="Edit Vehicle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="p-2 rounded-xl text-[#FF3B30] hover:bg-[#FFEBEA] transition-colors cursor-pointer"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[#6C6C70] bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E5EA]/60 font-medium">
                  <strong>Advisory:</strong> {v.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: EDIT / ADD HOTLINE */}
      {hotlineModalOpen && editingHotline && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#E5E5EA] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#1C1C1E]">
              {hotlines.some((h) => h.id === editingHotline.id) ? 'Edit Emergency Hotline' : 'Add Emergency Hotline'}
            </h3>

            <form onSubmit={handleSaveHotlineModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Agency Name / Acronym</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CDRRMO Command Center"
                  value={editingHotline.agency}
                  onChange={(e) => setEditingHotline({ ...editingHotline, agency: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Full Organization Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cebu City Disaster Risk Reduction & Management Office"
                  value={editingHotline.name}
                  onChange={(e) => setEditingHotline({ ...editingHotline, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +63322621424"
                    value={editingHotline.phone}
                    onChange={(e) => setEditingHotline({ ...editingHotline, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Emergency Shortcode (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 161 or 911"
                    value={editingHotline.shortCode || ''}
                    onChange={(e) => setEditingHotline({ ...editingHotline, shortCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Agency Classification / Icon</label>
                <select
                  value={editingHotline.iconType}
                  onChange={(e) => setEditingHotline({ ...editingHotline, iconType: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] bg-white cursor-pointer"
                >
                  <option value="disaster">🛡️ Disaster Response / CDRRMO</option>
                  <option value="police">👮 Police / Unified 911</option>
                  <option value="fire">🔥 Fire Protection &amp; Rescue (BFP)</option>
                  <option value="coastguard">⚓ Coast Guard (PCG)</option>
                  <option value="medical">🚑 Emergency Medical / Ambulance</option>
                  <option value="traffic">🚦 Traffic Management (CCTO)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Scope &amp; Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Primary disaster response, rescue dispatch & flood coordination..."
                  value={editingHotline.description}
                  onChange={(e) => setEditingHotline({ ...editingHotline, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setHotlineModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#6C6C70] hover:bg-[#F2F2F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-black hover:bg-[#0062CC] cursor-pointer shadow-sm"
                >
                  Save Hotline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / ADD VEHICLE */}
      {vehicleModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#E5E5EA] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#1C1C1E]">
              {vehicles.some((v) => v.id === editingVehicle.id) ? 'Edit Vehicle Clearance Class' : 'Add Vehicle Clearance Class'}
            </h3>

            <form onSubmit={handleSaveVehicleModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Vehicle Classification &amp; Examples</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4x4 Pickups & High-Clearance SUVs (Hilux, Ranger)"
                  value={editingVehicle.name}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Icon (Emoji)</label>
                  <input
                    type="text"
                    required
                    placeholder="🚗"
                    value={editingVehicle.icon}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, icon: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-center text-lg font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Max Safe (cm)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    required
                    value={editingVehicle.maxSafeDepthCm}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, maxSafeDepthCm: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Critical (cm)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    required
                    value={editingVehicle.criticalLimitCm}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, criticalLimitCm: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Passability &amp; Risk Advisory</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Intake air snorkel submerged = engine hydrostatic lock. Avoid knee-level waters."
                  value={editingVehicle.recommendation}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, recommendation: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#6C6C70] hover:bg-[#F2F2F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-black hover:bg-[#0062CC] cursor-pointer shadow-sm"
                >
                  Save Vehicle Specs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
