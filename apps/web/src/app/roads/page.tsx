'use client';

import React, { useEffect, useState } from 'react';
import { Split, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { fetchApi } from '../../lib/api';

export default function RoadsPage() {
  const [roads, setRoads] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<any[]>('/roads')
      .then(setRoads)
      .catch(() => {
        setRoads([
          {
            id: '1',
            name: 'M.J. Cuenco Ave (Mabolo Bridge Section)',
            barangay_name: 'Mabolo',
            is_blocked: true,
            block_reason: 'Suba River overflow, waist-deep flood water',
          },
          {
            id: '2',
            name: 'N. Bacalso Ave (Mambaling Underpass)',
            barangay_name: 'Mambaling',
            is_blocked: true,
            block_reason: 'Drainage backflow, impassable to light vehicles',
          },
          {
            id: '3',
            name: 'Guadalupe Main Road (Capitol Area)',
            barangay_name: 'Guadalupe',
            is_blocked: false,
            block_reason: null,
          },
        ]);
      });
  }, []);

  const toggleRoad = async (id: string, currentBlocked: boolean) => {
    try {
      await fetchApi(`/roads/${id}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ is_blocked: !currentBlocked, block_reason: !currentBlocked ? 'Operator flagged road blockage' : null }),
      });
      setRoads((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_blocked: !currentBlocked } : r))
      );
    } catch {
      // Local optimistic toggle for preview
      setRoads((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_blocked: !currentBlocked } : r))
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Road Network Passability & Closure Manager
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Flag flooded road segments to immediately update citizen offline routing corridors
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roads.map((road) => (
          <div
            key={road.id}
            className={`bg-surface-card border rounded-xl p-5 shadow-xs flex items-center justify-between ${
              road.is_blocked ? 'border-rose-500/50 bg-rose-500/5' : 'border-surface-border'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{road.name}</span>
                <Badge variant={road.is_blocked ? 'critical' : 'success'}>
                  {road.is_blocked ? 'IMPASSABLE / BLOCKED' : 'PASSABLE'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">Barangay: {road.barangay_name || 'Cebu City'}</p>
              {road.block_reason && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  Reason: {road.block_reason}
                </p>
              )}
            </div>

            <button
              onClick={() => toggleRoad(road.id, road.is_blocked)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                road.is_blocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {road.is_blocked ? 'Mark Passable' : 'Flag Blocked'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
