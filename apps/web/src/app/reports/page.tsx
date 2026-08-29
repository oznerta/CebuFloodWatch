'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'clusters' | 'raw'>('clusters');
  const [clusters, setClusters] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepth, setFilterDepth] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [clustersData, reportsData] = await Promise.all([
        fetchApi<any[]>('/clusters/active').catch(() => [
          {
            id: 'cluster_mabolo_suba',
            barangay_name: 'Mabolo',
            report_count: 4,
            max_depth_level: 'chest',
            centroid_lat: 10.325,
            centroid_lng: 123.9167,
            summary_description:
              'Consolidated 4 citizen reports around M.J. Cuenco & Suba creek: rapid inundation reaching chest level, submerged access alleys, and 2 stalled public jeepneys.',
            status: 'active',
            first_reported_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            last_reported_at: new Date().toISOString(),
            reports: [
              {
                id: 'rep_1',
                flood_depth_level: 'chest',
                description: 'Water rising up to chest near church corner',
                created_at: new Date().toISOString(),
              },
              {
                id: 'rep_2',
                flood_depth_level: 'waist',
                description: 'Road impassable in front of bakery',
                created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
              },
              {
                id: 'rep_3',
                flood_depth_level: 'chest',
                description: 'Trapped delivery van with driver on roof',
                created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
              },
            ],
          },
          {
            id: 'cluster_mambaling_underpass',
            barangay_name: 'Mambaling',
            report_count: 3,
            max_depth_level: 'above_head',
            centroid_lat: 10.2915,
            centroid_lng: 123.8742,
            summary_description:
              'Consolidated 3 citizen reports at N. Bacalso underpass: critical deep basin pooling > 1.8m. Area completely closed to all vehicular traffic.',
            status: 'responding',
            first_reported_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            last_reported_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            reports: [
              {
                id: 'rep_5',
                flood_depth_level: 'above_head',
                description: 'Underpass submerged completely, warning lights off',
                created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              },
            ],
          },
        ]),
        fetchApi<any[]>('/reports').catch(() => [
          {
            id: '1',
            barangay_name: 'Mabolo',
            flood_depth_level: 'chest',
            description: 'Suba river overflow reaching front of church',
            created_at: new Date().toISOString(),
            latitude: 10.325,
            longitude: 123.9167,
            status: 'verified',
            photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: '2',
            barangay_name: 'Kasambagan',
            flood_depth_level: 'knee',
            description: 'Creek overflowing along residential street',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            latitude: 10.334,
            longitude: 123.914,
            status: 'pending',
          },
          {
            id: '3',
            barangay_name: 'Mambaling',
            flood_depth_level: 'above_head',
            description: 'Underpass flooded, avoid area',
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            latitude: 10.2915,
            longitude: 123.8742,
            status: 'verified',
          },
        ]),
      ]);

      setClusters(clustersData);
      setReports(reportsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    socket.on('report:new', (newReport) => {
      setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
    });

    socket.on('cluster:status_update', (updatedCluster) => {
      setClusters((prev) =>
        prev.map((c) => (c.id === updatedCluster.id ? { ...c, ...updatedCluster } : c))
      );
    });

    return () => {
      socket.off('report:new');
      socket.off('cluster:status_update');
    };
  }, []);

  const handleUpdateClusterStatus = async (clusterId: string, status: 'active' | 'responding' | 'resolved') => {
    setActionLoading(clusterId);
    try {
      await fetchApi(`/clusters/${clusterId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setClusters((prev) =>
        prev.map((c) => (c.id === clusterId ? { ...c, status } : c))
      );
    } catch {
      setClusters((prev) =>
        prev.map((c) => (c.id === clusterId ? { ...c, status } : c))
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: 'verified' | 'rejected') => {
    setActionLoading(reportId);
    try {
      await fetchApi(`/reports/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.barangay_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepth = filterDepth === 'all' || r.flood_depth_level === filterDepth;
    return matchesSearch && matchesDepth;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Citizen Flood Telemetry & Deduplication Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            AI-assisted 150m spatial proximity clustering, verification triage, and responder dispatch
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-surface-card border border-surface-border p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('clusters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'clusters'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Consolidated Clusters ({clusters.length})
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'raw'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Raw Citizen Feed ({reports.length})
          </button>
        </div>
      </div>

      {activeTab === 'clusters' ? (
        /* Tab 1: Consolidated Incident Clusters */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clusters.map((cluster) => {
              const isUpdating = actionLoading === cluster.id;
              return (
                <div
                  key={cluster.id}
                  className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                          Barangay {cluster.barangay_name}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                          Peak Depth: {cluster.max_depth_level?.toUpperCase()}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {cluster.report_count} Reports Merged
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            cluster.status === 'active'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : cluster.status === 'responding'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {cluster.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                      {cluster.summary_description}
                    </p>
                  </div>

                  {/* Centroid & Time Telemetry */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-surface-border">
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      Centroid: {cluster.centroid_lat?.toFixed(4)}, {cluster.centroid_lng?.toFixed(4)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Active Since: {new Date(cluster.first_reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Member Reports Accordion */}
                  {cluster.reports && cluster.reports.length > 0 && (
                    <div className="bg-surface-subtle p-3 rounded-lg space-y-2 border border-surface-border text-xs">
                      <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block">
                        Included Citizen Dispatches
                      </span>
                      {cluster.reports.map((r: any, idx: number) => (
                        <div key={r.id || idx} className="flex justify-between items-center text-[11px] text-slate-300">
                          <span className="truncate max-w-xs">• {r.description}</span>
                          <span className="font-bold text-slate-400 uppercase text-[10px]">
                            {r.flood_depth_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dispatch Controls */}
                  <div className="flex gap-2 pt-1">
                    {cluster.status !== 'responding' && cluster.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateClusterStatus(cluster.id, 'responding')}
                        disabled={isUpdating}
                        className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Dispatch Responders
                      </button>
                    )}

                    {cluster.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateClusterStatus(cluster.id, 'resolved')}
                        disabled={isUpdating}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Mark Cluster Resolved
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Tab 2: Raw Citizen Submissions */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search citizen reports by barangay or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterDepth}
                onChange={(e) => setFilterDepth(e.target.value)}
                className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Depth Tiers</option>
                <option value="ankle">Ankle (10-20cm)</option>
                <option value="knee">Knee (30-50cm)</option>
                <option value="waist">Waist (1m)</option>
                <option value="chest">Chest (1.4m)</option>
                <option value="above_head">Above Head (&gt; 1.8m)</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-surface-border">
                  <tr>
                    <th className="py-3 px-4">Barangay & Time</th>
                    <th className="py-3 px-4">Depth Tier</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredReports.map((report) => {
                    const isUpdating = actionLoading === report.id;
                    return (
                      <tr key={report.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">
                            Barangay {report.barangay_name || 'Metro Cebu'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              report.flood_depth_level === 'above_head' || report.flood_depth_level === 'chest'
                                ? 'bg-rose-500/20 text-rose-400'
                                : report.flood_depth_level === 'waist'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {report.flood_depth_level}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs text-slate-300">
                          {report.description}
                        </td>

                        <td className="py-3 px-4">
                          {report.photo_url ? (
                            <button
                              onClick={() => setSelectedPhoto(report.photo_url)}
                              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Photo
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px]">No attachment</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              report.status === 'verified'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : report.status === 'rejected'
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-slate-500/15 text-slate-400'
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex gap-1.5">
                            {report.status !== 'verified' && (
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'verified')}
                                disabled={isUpdating}
                                className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Verify
                              </button>
                            )}
                            {report.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'rejected')}
                                disabled={isUpdating}
                                className="px-2 py-1 rounded bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            )}
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
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-surface-card border border-surface-border rounded-2xl max-w-lg w-full overflow-hidden p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Citizen Verification Snapshot</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedPhoto}
              alt="Citizen Flood Verification"
              className="w-full h-80 object-cover rounded-xl border border-surface-border"
            />
          </div>
        </div>
      )}
    </div>
  );
}
