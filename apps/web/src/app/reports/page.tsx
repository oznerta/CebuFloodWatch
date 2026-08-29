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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
            Citizen Flood Telemetry & Deduplication Hub
          </h1>
          <p className="text-sm text-[#8E8E93] mt-1 font-medium">
            AI-assisted 150m spatial proximity clustering, verification triage, and responder dispatch
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-white border border-[#E5E5EA] p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('clusters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'clusters'
                ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/25'
                : 'text-[#6C6C70] hover:text-[#1C1C1E]'
            }`}
          >
            <Layers className="w-4 h-4" />
            Consolidated Clusters ({clusters.length})
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'raw'
                ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/25'
                : 'text-[#6C6C70] hover:text-[#1C1C1E]'
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
                  className="bg-white border border-[#E5E5EA] rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-extrabold text-[#007AFF] uppercase tracking-wider">
                          Barangay {cluster.barangay_name}
                        </span>
                        <h3 className="font-extrabold text-lg text-[#1C1C1E] mt-0.5">
                          Peak Depth: {cluster.max_depth_level?.toUpperCase()}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#E5F1FF] text-[#007AFF]">
                          {cluster.report_count} Reports Merged
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                            cluster.status === 'active'
                              ? 'bg-[#FFEBEA] text-[#FF3B30]'
                              : cluster.status === 'responding'
                              ? 'bg-[#FFF4E5] text-[#FF9500]'
                              : 'bg-[#EBF9EE] text-[#34C759]'
                          }`}
                        >
                          {cluster.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#3A3A3C] mt-3 font-normal leading-relaxed">
                      {cluster.summary_description}
                    </p>
                  </div>

                  {/* Centroid & Time Telemetry */}
                  <div className="flex items-center justify-between text-xs text-[#8E8E93] pt-3 border-t border-[#F2F2F7]">
                    <span className="flex items-center gap-1 font-mono font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#007AFF]" />
                      Centroid: {cluster.centroid_lat?.toFixed(4)}, {cluster.centroid_lng?.toFixed(4)}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Active: {new Date(cluster.first_reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Member Reports Accordion */}
                  {cluster.reports && cluster.reports.length > 0 && (
                    <div className="bg-[#F8F9FA] p-3.5 rounded-xl space-y-2 border border-[#E5E5EA] text-xs">
                      <span className="font-extrabold text-[11px] text-[#8E8E93] uppercase tracking-wider block">
                        Included Citizen Dispatches
                      </span>
                      {cluster.reports.map((r: any, idx: number) => (
                        <div key={r.id || idx} className="flex justify-between items-center text-xs text-[#3A3A3C]">
                          <span className="truncate max-w-xs font-medium">• {r.description}</span>
                          <span className="font-extrabold text-[#8E8E93] uppercase text-[10px]">
                            {r.flood_depth_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dispatch Controls */}
                  <div className="flex gap-2.5 pt-1">
                    {cluster.status !== 'responding' && cluster.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateClusterStatus(cluster.id, 'responding')}
                        disabled={isUpdating}
                        className="flex-1 py-2.5 rounded-xl bg-[#FF9500] hover:bg-[#E08300] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
                      >
                        <Truck className="w-4 h-4" />
                        Dispatch Responders
                      </button>
                    )}

                    {cluster.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateClusterStatus(cluster.id, 'resolved')}
                        disabled={isUpdating}
                        className="flex-1 py-2.5 rounded-xl bg-[#34C759] hover:bg-[#28A745] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-green-500/20"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Mark Resolved
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
              <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search citizen reports by barangay or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5E5EA] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#007AFF] shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterDepth}
                onChange={(e) => setFilterDepth(e.target.value)}
                className="bg-white border border-[#E5E5EA] rounded-2xl px-4 py-2.5 text-xs text-[#1C1C1E] font-medium focus:outline-none focus:border-[#007AFF] shadow-sm"
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
                className="p-2.5 rounded-2xl bg-white border border-[#E5E5EA] text-[#6C6C70] hover:text-[#1C1C1E] hover:bg-[#F2F2F7] shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#8E8E93] font-extrabold uppercase text-[10px] tracking-wider border-b border-[#E5E5EA]">
                  <tr>
                    <th className="py-3.5 px-5">Barangay & Time</th>
                    <th className="py-3.5 px-5">Depth Tier</th>
                    <th className="py-3.5 px-5">Description</th>
                    <th className="py-3.5 px-5">Photo</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F7]">
                  {filteredReports.map((report) => {
                    const isUpdating = actionLoading === report.id;
                    return (
                      <tr key={report.id} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-3.5 px-5">
                          <p className="font-extrabold text-[#1C1C1E]">
                            Barangay {report.barangay_name || 'Metro Cebu'}
                          </p>
                          <span className="text-[10px] text-[#8E8E93]">
                            {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              report.flood_depth_level === 'above_head' || report.flood_depth_level === 'chest'
                                ? 'bg-[#FFEBEA] text-[#FF3B30]'
                                : report.flood_depth_level === 'waist'
                                ? 'bg-[#FFF4E5] text-[#FF9500]'
                                : 'bg-[#FFFBE6] text-[#FFCC00]'
                            }`}
                          >
                            {report.flood_depth_level}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 max-w-xs text-[#3A3A3C] font-medium leading-relaxed">
                          {report.description}
                        </td>

                        <td className="py-3.5 px-5">
                          {report.photo_url ? (
                            <button
                              onClick={() => setSelectedPhoto(report.photo_url)}
                              className="text-[#007AFF] hover:underline font-bold flex items-center gap-1 text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Photo
                            </button>
                          ) : (
                            <span className="text-[#8E8E93] text-[10px]">No attachment</span>
                          )}
                        </td>

                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              report.status === 'verified'
                                ? 'bg-[#EBF9EE] text-[#34C759]'
                                : report.status === 'rejected'
                                ? 'bg-[#FFEBEA] text-[#FF3B30]'
                                : 'bg-[#F2F2F7] text-[#8E8E93]'
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex gap-2">
                            {report.status !== 'verified' && (
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'verified')}
                                disabled={isUpdating}
                                className="px-3 py-1.5 rounded-xl bg-[#EBF9EE] text-[#34C759] hover:bg-[#34C759] hover:text-white text-[11px] font-extrabold flex items-center gap-1 transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verify
                              </button>
                            )}
                            {report.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'rejected')}
                                disabled={isUpdating}
                                className="px-3 py-1.5 rounded-xl bg-[#FFEBEA] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white text-[11px] font-extrabold flex items-center gap-1 transition-all"
                              >
                                <XCircle className="w-3.5 h-3.5" />
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
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-[#1C1C1E]">Citizen Verification Snapshot</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E]"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedPhoto}
              alt="Citizen Flood Verification"
              className="w-full h-80 object-cover rounded-2xl border border-[#E5E5EA]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
