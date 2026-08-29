'use client';

import React, { useEffect, useState } from 'react';
import { Route, CheckCircle, AlertTriangle, XCircle, RefreshCw, Car, ShieldAlert } from 'lucide-react';
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
      setRoads([
        {
          id: '1',
          name: 'M.J. Cuenco Avenue (Mabolo Corridor)',
          barangay_name: 'Mabolo',
          status: 'impassable',
          flood_depth_level: 'waist',
          blockage_reason: 'Suba river overflow reaching 0.9m depth across 4 lanes',
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'N. Bacalso Avenue (Mambaling Underpass)',
          barangay_name: 'Mambaling',
          status: 'impassable',
          flood_depth_level: 'chest',
          blockage_reason: 'Submerged underpass section; impassable to all traffic',
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Pope John Paul II Avenue (Kasambagan Section)',
          barangay_name: 'Kasambagan',
          status: 'light_vehicles_only',
          flood_depth_level: 'knee',
          blockage_reason: 'Mahiga creek spillover on outer lanes',
          updated_at: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Guadalupe Main Access Corridor',
          barangay_name: 'Guadalupe',
          status: 'passable',
          flood_depth_level: 'ankle',
          blockage_reason: 'Minor gutter runoff; all lanes passable',
          updated_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoads();

    const socket = getSocket();
    socket.on('road:status_update', (updated) => {
      setRoads((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
      );
    });

    return () => {
      socket.off('road:status_update');
    };
  }, []);

  const handleSetRoadStatus = async (
    roadId: string,
    newStatus: 'passable' | 'light_vehicles_only' | 'impassable'
  ) => {
    setUpdatingId(roadId);
    try {
      await fetchApi(`/roads/${roadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setRoads((prev) =>
        prev.map((r) => (r.id === roadId ? { ...r, status: newStatus } : r))
      );
    } catch {
      setRoads((prev) =>
        prev.map((r) => (r.id === roadId ? { ...r, status: newStatus } : r))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const impassableCount = roads.filter((r) => r.status === 'impassable').length;
  const lightOnlyCount = roads.filter((r) => r.status === 'light_vehicles_only').length;
  const passableCount = roads.filter((r) => r.status === 'passable').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
            Road Passability Network
          </h1>
          <p className="text-sm text-[#8E8E93] mt-1 font-medium">
            Dynamic road passability toggles, flood obstruction reporting, and rerouting matrix
          </p>
        </div>

        <button
          onClick={loadRoads}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#E5E5EA] text-xs font-bold text-[#1C1C1E] hover:bg-[#F2F2F7] shadow-sm transition-all w-fit"
        >
          <RefreshCw className="w-4 h-4 text-[#007AFF]" />
          Refresh Road Grid
        </button>
      </div>

      {/* Network Status KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[#8E8E93] font-bold uppercase">Passable Corridors</span>
            <p className="text-3xl font-extrabold text-[#34C759] mt-1">{passableCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#EBF9EE] flex items-center justify-center text-[#34C759]">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[#8E8E93] font-bold uppercase">Caution / Heavy Only</span>
            <p className="text-3xl font-extrabold text-[#FF9500] mt-1">{lightOnlyCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FFF4E5] flex items-center justify-center text-[#FF9500]">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[#8E8E93] font-bold uppercase">Impassable / Submerged</span>
            <p className="text-3xl font-extrabold text-[#FF3B30] mt-1">{impassableCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FFEBEA] flex items-center justify-center text-[#FF3B30]">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Roads Table */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#F2F2F7] flex items-center justify-between">
          <h3 className="font-extrabold text-base text-[#1C1C1E] flex items-center gap-2">
            <Route className="w-4 h-4 text-[#007AFF]" />
            Monitored Metro Cebu Road Corridors ({roads.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] text-[#8E8E93] font-extrabold uppercase text-[10px] tracking-wider border-b border-[#E5E5EA]">
              <tr>
                <th className="py-3.5 px-5">Road Name & Barangay</th>
                <th className="py-3.5 px-5">Passability Status</th>
                <th className="py-3.5 px-5">Flood Depth</th>
                <th className="py-3.5 px-5">Obstruction Details</th>
                <th className="py-3.5 px-5 text-right">Passability Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2F7]">
              {roads.map((road) => {
                const isUpdating = updatingId === road.id;
                return (
                  <tr key={road.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-extrabold text-sm text-[#1C1C1E]">{road.name}</p>
                      <span className="text-[11px] text-[#007AFF] font-bold">
                        Barangay {road.barangay_name || 'Metro Cebu'}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                          road.status === 'passable'
                            ? 'bg-[#EBF9EE] text-[#34C759]'
                            : road.status === 'light_vehicles_only'
                            ? 'bg-[#FFF4E5] text-[#FF9500]'
                            : 'bg-[#FFEBEA] text-[#FF3B30]'
                        }`}
                      >
                        {road.status === 'passable' ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : road.status === 'light_vehicles_only' ? (
                          <Car className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {road.status?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-extrabold text-[#1C1C1E] uppercase text-xs">
                        {road.flood_depth_level || 'None'}
                      </span>
                    </td>

                    <td className="py-4 px-5 max-w-xs text-[#6C6C70] text-xs font-medium leading-relaxed">
                      {road.blockage_reason || 'Normal traffic conditions.'}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleSetRoadStatus(road.id, 'passable')}
                          disabled={isUpdating || road.status === 'passable'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                            road.status === 'passable'
                              ? 'bg-[#34C759] text-white shadow-md shadow-green-500/20'
                              : 'bg-[#F2F2F7] text-[#6C6C70] hover:text-[#1C1C1E]'
                          }`}
                        >
                          Passable
                        </button>
                        <button
                          onClick={() => handleSetRoadStatus(road.id, 'light_vehicles_only')}
                          disabled={isUpdating || road.status === 'light_vehicles_only'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                            road.status === 'light_vehicles_only'
                              ? 'bg-[#FF9500] text-white shadow-md shadow-orange-500/20'
                              : 'bg-[#F2F2F7] text-[#6C6C70] hover:text-[#1C1C1E]'
                          }`}
                        >
                          Caution
                        </button>
                        <button
                          onClick={() => handleSetRoadStatus(road.id, 'impassable')}
                          disabled={isUpdating || road.status === 'impassable'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                            road.status === 'impassable'
                              ? 'bg-[#FF3B30] text-white shadow-md shadow-red-500/20'
                              : 'bg-[#F2F2F7] text-[#6C6C70] hover:text-[#1C1C1E]'
                          }`}
                        >
                          Blocked
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
