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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Road Network & Evacuation Corridors
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Dynamic road passability toggles, flood obstruction reporting, and rerouting matrix
          </p>
        </div>

        <button
          onClick={loadRoads}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Road Grid
        </button>
      </div>

      {/* Network Status KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold">Passable Corridors</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">{passableCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold">High-Clearance / Heavy Only</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{lightOnlyCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold">Impassable / Submerged</span>
            <p className="text-2xl font-extrabold text-rose-400 mt-1">{impassableCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Roads Table */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Route className="w-4 h-4 text-blue-500" />
            Monitored Metro Cebu Road Corridors ({roads.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Road Name & Barangay</th>
                <th className="py-3 px-4">Passability Status</th>
                <th className="py-3 px-4">Flood Depth</th>
                <th className="py-3 px-4">Obstruction Details</th>
                <th className="py-3 px-4 text-right">Passability Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {roads.map((road) => {
                const isUpdating = updatingId === road.id;
                return (
                  <tr key={road.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{road.name}</p>
                      <span className="text-[10px] text-blue-500 font-semibold">
                        Barangay {road.barangay_name || 'Metro Cebu'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          road.status === 'passable'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : road.status === 'light_vehicles_only'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {road.status === 'passable' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : road.status === 'light_vehicles_only' ? (
                          <Car className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {road.status?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-300 uppercase text-[11px]">
                        {road.flood_depth_level || 'None'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-400 text-[11px]">
                      {road.blockage_reason || 'Normal traffic conditions.'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => handleSetRoadStatus(road.id, 'passable')}
                          disabled={isUpdating || road.status === 'passable'}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            road.status === 'passable'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Passable
                        </button>
                        <button
                          onClick={() => handleSetRoadStatus(road.id, 'light_vehicles_only')}
                          disabled={isUpdating || road.status === 'light_vehicles_only'}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            road.status === 'light_vehicles_only'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Caution
                        </button>
                        <button
                          onClick={() => handleSetRoadStatus(road.id, 'impassable')}
                          disabled={isUpdating || road.status === 'impassable'}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            road.status === 'impassable'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
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
