'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { fetchApi } from '../../lib/api';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<any[]>('/reports')
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Citizen Flood Incidents & Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Crowdsourced field observations submitted by citizens and first responders
        </p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-subtle text-slate-700 dark:text-slate-300 font-semibold border-b border-surface-border uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Barangay</th>
              <th className="py-3 px-4">Depth Level</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">GPS Coordinates</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-surface-subtle/40 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  {r.barangay_name || 'Mabolo'}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={r.flood_depth_level === 'chest' ? 'critical' : 'warning'}>
                    {r.flood_depth_level?.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                  {r.description || 'No notes'}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">
                  {r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={r.status === 'verified' ? 'success' : 'default'}>
                    {r.status?.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-slate-400">
                  {new Date(r.created_at).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
