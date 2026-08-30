'use client';

import React, { useEffect, useState } from 'react';
import { Route, CheckCircle, AlertTriangle, XCircle, RefreshCw, Car, ShieldAlert, Inbox } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';

export default function RoadsPage() {
  const [roads, setRoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      socket.on('road:updated', (updated) => {
        setRoads((prev) =>
          prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('road:updated');
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

        <button
          onClick={loadRoads}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5EA] rounded-xl text-xs font-extrabold text-[#1C1C1E] shadow-sm hover:bg-[#F2F2F7] transition-all"
        >
          <RefreshCw className="w-4 h-4 text-[#8E8E93]" />
          Sync Road Network
        </button>
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
        <div className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E5E5EA] text-[#8E8E93] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Road / Corridor</th>
                  <th className="py-3 px-4">Barangay</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Flood Depth</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {roads.map((road) => (
                  <tr key={road.id} className="hover:bg-[#F8F9FA]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1C1C1E] flex items-center gap-2">
                      <Route className="w-4 h-4 text-[#007AFF]" />
                      {road.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#6C6C70] font-semibold">
                      {road.barangay_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          road.status === 'passable'
                            ? 'bg-[#EBF9EE] text-[#34C759]'
                            : road.status === 'light_vehicles_only'
                            ? 'bg-[#FFF4E5] text-[#FF9500]'
                            : 'bg-[#FFEBEA] text-[#FF3B30]'
                        }`}
                      >
                        {road.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1C1C1E] uppercase">
                      {road.flood_depth_level || 'Normal'}
                    </td>
                    <td className="py-3.5 px-4 text-[#8E8E93] max-w-xs truncate">
                      {road.blockage_reason || 'No reported obstruction.'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {road.status !== 'passable' && (
                          <button
                            onClick={() => handleUpdateStatus(road.id, 'passable')}
                            disabled={updatingId === road.id}
                            className="px-2.5 py-1 rounded-lg bg-[#EBF9EE] text-[#34C759] hover:bg-[#34C759] hover:text-white font-extrabold transition-all"
                          >
                            Passable
                          </button>
                        )}
                        {road.status !== 'light_vehicles_only' && (
                          <button
                            onClick={() => handleUpdateStatus(road.id, 'light_vehicles_only')}
                            disabled={updatingId === road.id}
                            className="px-2.5 py-1 rounded-lg bg-[#FFF4E5] text-[#FF9500] hover:bg-[#FF9500] hover:text-white font-extrabold transition-all"
                          >
                            Light Only
                          </button>
                        )}
                        {road.status !== 'impassable' && (
                          <button
                            onClick={() => handleUpdateStatus(road.id, 'impassable')}
                            disabled={updatingId === road.id}
                            className="px-2.5 py-1 rounded-lg bg-[#FFEBEA] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white font-extrabold transition-all"
                          >
                            Impassable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5EA] rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <Inbox className="w-10 h-10 text-[#C7C7CC] mx-auto" />
          <h3 className="text-base font-extrabold text-[#1C1C1E]">No Monitored Road Corridors</h3>
          <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
            Monitored arterial road networks and underpass corridors will be displayed here once synchronized with the database.
          </p>
        </div>
      )}
    </div>
  );
}
