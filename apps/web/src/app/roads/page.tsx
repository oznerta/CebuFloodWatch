'use client';

import React, { useEffect, useState } from 'react';
import {
  Route,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Car,
  ShieldAlert,
  Inbox,
  Plus,
  Trash2,
  X,
  MapPin,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { CEBU_BARANGAY_NAMES } from '@cebufloodwatch/shared';

export default function RoadsPage() {
  const [roads, setRoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    barangay_name: 'Mabolo',
    status: 'impassable',
    flood_depth_level: 'waist',
    blockage_reason: 'River overflow and debris blockage',
  });

  const loadRoads = async () => {
    try {
      const data = await fetchApi<any[]>('/roads');
      setRoads(data || []);
    } catch {
      setRoads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoads();

    const socket = getSocket();
    if (socket) {
      socket.on('road:status_update', (updated) => {
        setRoads((prev) => {
          const exists = prev.some((r) => r.id === updated.id);
          if (exists) {
            return prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
          }
          return [updated, ...prev];
        });
      });
      socket.on('road:deleted', ({ id }) => {
        setRoads((prev) => prev.filter((r) => r.id !== id));
      });
    }

    return () => {
      if (socket) {
        socket.off('road:status_update');
        socket.off('road:deleted');
      }
    };
  }, []);

  const handleUpdateStatus = async (roadId: string, nextStatus: string) => {
    setUpdatingId(roadId);
    try {
      await fetchApi(`/roads/${roadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setRoads((prev) =>
        prev.map((r) => (r.id === roadId ? { ...r, status: nextStatus } : r))
      );
    } catch {
      setRoads((prev) =>
        prev.map((r) => (r.id === roadId ? { ...r, status: nextStatus } : r))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteRoad = async (roadId: string) => {
    if (!confirm('Remove this road status entry from active tracking?')) return;
    try {
      await fetchApi(`/roads/${roadId}`, { method: 'DELETE' });
      setRoads((prev) => prev.filter((r) => r.id !== roadId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove road advisory');
    }
  };

  const handleCreateRoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        barangay_name: formData.barangay_name,
        status: formData.status,
        flood_depth_level: formData.flood_depth_level,
        blockage_reason: formData.blockage_reason.trim() || 'Submerged road section',
      };

      const res = await fetchApi<any>('/roads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res) {
        setRoads((prev) => [res, ...prev.filter((r) => r.id !== res.id)]);
      }
      setShowAddModal(false);
      setFormData({
        name: '',
        barangay_name: 'Mabolo',
        status: 'impassable',
        flood_depth_level: 'waist',
        blockage_reason: 'River overflow and debris blockage',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to register road status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
            Road Network & Corridor Passability
          </h1>
          <p className="text-sm text-[#8E8E93] mt-1 font-medium">
            Monitor arterial road inundation, underpass blockages, and CCTO traffic passability statuses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRoads}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E5EA] rounded-xl text-xs font-extrabold text-[#1C1C1E] shadow-sm hover:bg-[#F2F2F7] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#8E8E93]" />
            Sync Road Network
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#007AFF] text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-[#0062CC] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Report Road Blockage
          </button>
        </div>
      </div>

      {/* Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-xs font-bold uppercase tracking-wider">Passable Corridors</span>
            <CheckCircle className="w-4 h-4 text-[#34C759]" />
          </div>
          <p className="text-2xl font-black text-[#34C759]">
            {roads.filter((r) => r.status === 'passable').length}
          </p>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-xs font-bold uppercase tracking-wider">Light Vehicles Only</span>
            <AlertTriangle className="w-4 h-4 text-[#FF9500]" />
          </div>
          <p className="text-2xl font-black text-[#FF9500]">
            {roads.filter((r) => r.status === 'light_vehicles_only').length}
          </p>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-xs font-bold uppercase tracking-wider">Impassable / Blocked</span>
            <XCircle className="w-4 h-4 text-[#FF3B30]" />
          </div>
          <p className="text-2xl font-black text-[#FF3B30]">
            {roads.filter((r) => r.status === 'impassable').length}
          </p>
        </div>
      </div>

      {/* Roads Table */}
      {roads.length > 0 ? (
        <div className="bg-white border border-[#E5E5EA] rounded-3xl overflow-hidden shadow-xs">
          <div className="divide-y divide-[#F2F2F7]">
            {roads.map((road) => (
              <div key={road.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8F9FA] transition-colors">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        road.status === 'passable'
                          ? 'bg-[#EBF9EE] text-[#34C759]'
                          : road.status === 'light_vehicles_only'
                          ? 'bg-[#FFF8E6] text-[#FF9500]'
                          : 'bg-[#FFEBEA] text-[#FF3B30]'
                      }`}
                    >
                      {road.status === 'light_vehicles_only' ? 'Light Vehicles Only' : road.status}
                    </span>
                    <span className="text-xs font-bold text-[#8E8E93]">
                      Brgy. {road.barangay_name || 'Cebu City'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-[#1C1C1E]">{road.name}</h3>
                  <p className="text-xs text-[#6C6C70]">
                    {road.blockage_reason || 'Water level monitoring underway.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={road.status}
                    disabled={updatingId === road.id}
                    onChange={(e) => handleUpdateStatus(road.id, e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] bg-white cursor-pointer focus:outline-none focus:border-[#007AFF]"
                  >
                    <option value="passable">Passable (All)</option>
                    <option value="light_vehicles_only">Light Vehicles Only</option>
                    <option value="impassable">Impassable (Closed)</option>
                  </select>

                  <button
                    onClick={() => handleDeleteRoad(road.id)}
                    className="p-2 text-[#8E8E93] hover:text-[#FF3B30] transition-colors cursor-pointer"
                    title="Remove road record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <Inbox className="w-10 h-10 text-[#C7C7CC] mx-auto" />
          <h3 className="text-base font-extrabold text-[#1C1C1E]">All Cebu City Corridors Passable</h3>
          <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
            No active road closures or severe inundation blockages reported across arterial routes.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-[#0062CC] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Report Road Hazard
          </button>
        </div>
      )}

      {/* Add Road Hazard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#FF9500]/10 text-[#FF9500]">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1C1C1E]">Report Road Hazard</h3>
                  <p className="text-xs text-[#8E8E93]">CCTO & CDRRMO Passability Advisory</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoad} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Road / Corridor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M.J. Cuenco Avenue near Mabolo Church"
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
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Passability Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] bg-white cursor-pointer"
                  >
                    <option value="impassable">Impassable (Closed)</option>
                    <option value="light_vehicles_only">Light Vehicles Only</option>
                    <option value="passable">Passable (All Clear)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Estimated Water Depth</label>
                  <select
                    value={formData.flood_depth_level}
                    onChange={(e) => setFormData({ ...formData, flood_depth_level: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] bg-white cursor-pointer"
                  >
                    <option value="ankle">Ankle (0.1m - 0.2m)</option>
                    <option value="knee">Knee (0.3m - 0.5m)</option>
                    <option value="waist">Waist (0.6m - 1.0m)</option>
                    <option value="chest">Chest (1.1m - 1.5m)</option>
                    <option value="above_head">Above Head (&gt; 1.5m)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Obstruction Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Canal overflow, stalled bus"
                    value={formData.blockage_reason}
                    onChange={(e) => setFormData({ ...formData, blockage_reason: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#007AFF]"
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
                  {isSubmitting ? 'Submitting...' : 'Post Road Advisory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
