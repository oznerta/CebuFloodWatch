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
  Inbox,
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
        fetchApi<any[]>('/clusters/active').catch(() => []),
        fetchApi<any[]>('/reports').catch(() => []),
      ]);

      if (clustersData) setClusters(clustersData);
      if (reportsData) setReports(reportsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    if (socket) {
      socket.on('report:new', (newReport) => {
        setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
      });

      socket.on('cluster:status_update', (updatedCluster) => {
        setClusters((prev) =>
          prev.map((c) => (c.id === updatedCluster.id ? { ...c, ...updatedCluster } : c))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('report:new');
        socket.off('cluster:status_update');
      }
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
    } catch (err: any) {
      console.error('Failed to update cluster status:', err);
      alert(`Failed to update cluster status: ${err?.message || 'Server error'}`);
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
    } catch (err: any) {
      console.error('Failed to update report status:', err);
      alert(`Failed to update report status: ${err?.message || 'Server error'}`);
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
          {clusters.length > 0 ? (
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
          ) : (
            <div className="bg-white border border-[#E5E5EA] rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <Inbox className="w-10 h-10 text-[#C7C7CC] mx-auto" />
              <h3 className="text-base font-extrabold text-[#1C1C1E]">No Spatial Incident Clusters Active</h3>
              <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
                When multiple citizen reports are submitted within 150m of each other, they are automatically deduplicated and clustered here.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Raw Citizen Feed & Verification Triage */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white border border-[#E5E5EA] rounded-2xl px-4 py-2.5 shadow-sm">
              <Search className="w-4 h-4 text-[#8E8E93]" />
              <input
                type="text"
                placeholder="Search raw reports by barangay or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['all', 'ankle', 'knee', 'waist', 'chest', 'above_head'].map((depth) => (
                <button
                  key={depth}
                  onClick={() => setFilterDepth(depth)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold uppercase transition-all whitespace-nowrap ${
                    filterDepth === depth
                      ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/25'
                      : 'bg-white border border-[#E5E5EA] text-[#6C6C70] hover:text-[#1C1C1E]'
                  }`}
                >
                  {depth.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table / Card Feed */}
          {filteredReports.length > 0 ? (
            <div className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-[#E5E5EA] text-[#8E8E93] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Location / Barangay</th>
                      <th className="py-3 px-4">Depth Level</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Photo Evidence</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reported</th>
                      <th className="py-3 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA]">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-[#F8F9FA]/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#1C1C1E]">
                          Barangay {report.barangay_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              report.flood_depth_level === 'waist' || report.flood_depth_level === 'chest' || report.flood_depth_level === 'above_head'
                                ? 'bg-[#FFEBEA] text-[#FF3B30]'
                                : 'bg-[#FFF4E5] text-[#FF9500]'
                            }`}
                          >
                            {report.flood_depth_level}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#3A3A3C] max-w-xs truncate font-medium">
                          {report.description}
                        </td>
                        <td className="py-3.5 px-4">
                          {report.photo_url ? (
                            <button
                              onClick={() => setSelectedPhoto(report.photo_url)}
                              className="flex items-center gap-1 text-[#007AFF] font-extrabold hover:underline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Evidence
                            </button>
                          ) : (
                            <span className="text-[#8E8E93] italic">No image</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
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
                        <td className="py-3.5 px-4 text-[#8E8E93] whitespace-nowrap">
                          {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {report.status !== 'verified' && (
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'verified')}
                                disabled={actionLoading === report.id}
                                className="px-2.5 py-1 rounded-lg bg-[#EBF9EE] text-[#34C759] hover:bg-[#34C759] hover:text-white font-extrabold transition-all"
                              >
                                Verify
                              </button>
                            )}
                            {report.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'rejected')}
                                disabled={actionLoading === report.id}
                                className="px-2.5 py-1 rounded-lg bg-[#FFEBEA] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white font-extrabold transition-all"
                              >
                                Reject
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
              <h3 className="text-base font-extrabold text-[#1C1C1E]">No Citizen Reports Found</h3>
              <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
                No active reports match the current search or depth filter criteria.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-3">
            <h3 className="font-extrabold text-sm text-[#1C1C1E]">Citizen Ground Photo Evidence</h3>
            <img src={selectedPhoto} alt="Flood evidence" className="w-full h-72 object-cover rounded-xl" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="w-full py-2 bg-[#F2F2F7] rounded-xl font-bold text-xs text-[#1C1C1E]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
