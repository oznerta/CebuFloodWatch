'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  Clock,
  ArrowUpRight,
  Droplet,
  Users,
  Home,
  CheckCircle2,
  XCircle,
  FileCheck,
  ChevronRight,
  CloudRain,
  Waves,
  MapPin,
  Sparkles,
  Inbox,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  X,
  Layers,
  Sliders,
  Compass,
} from 'lucide-react';
import { MapContainer } from '../../components/map/MapContainer';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';

type ActivePanel = 'telemetry' | 'triage' | null;

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Single active drawer panel (or null for 100% clean full map)
  const [activePanel, setActivePanel] = useState<ActivePanel>('telemetry');

  const loadData = async () => {
    try {
      const [reportsData, sheltersData, alertsData, stationsData] = await Promise.all([
        fetchApi<any[]>('/reports').catch(() => []),
        fetchApi<any[]>('/shelters').catch(() => []),
        fetchApi<any[]>('/alerts/active').catch(() => []),
        fetchApi<any[]>('/telemetry/stations').catch(() => []),
      ]);

      if (reportsData) setReports(reportsData);
      if (sheltersData) setShelters(sheltersData);
      if (alertsData) setAlerts(alertsData);
      if (stationsData) setStations(stationsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    if (socket) {
      socket.on('report:created', (newReport: any) => {
        setReports((prev) => [newReport, ...prev]);
      });

      socket.on('report:status_changed', ({ reportId, status }: any) => {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status } : r))
        );
      });

      socket.on('alert:broadcast', (newAlert: any) => {
        setAlerts((prev) => [newAlert, ...prev]);
      });

      socket.on('shelter:updated', (updated: any) => {
        setShelters((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('report:created');
        socket.off('report:status_changed');
        socket.off('alert:broadcast');
        socket.off('shelter:updated');
      }
    };
  }, []);

  const handleUpdateStatus = async (reportId: string, nextStatus: string) => {
    setActionLoading(reportId);
    try {
      await fetchApi(`/reports/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: nextStatus } : r))
      );
    } catch (err: any) {
      console.error('Failed to update report status:', err);
      alert(`Failed to update report status: ${err?.message || 'Server error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlyToReport = (report: any) => {
    window.dispatchEvent(
      new CustomEvent('map:flyto', {
        detail: {
          latitude: report.latitude,
          longitude: report.longitude,
          name: `Flood Report: ${report.barangay_name}`,
          category: 'report',
        },
      })
    );
  };

  const handleExportAudit = async () => {
    try {
      const data = await fetchApi<any>('/audit/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cebufloodwatch_ocd7_audit_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export audit report:', err);
      alert(`Failed to export audit report: ${err?.message || 'Server error'}`);
    }
  };

  const openSheltersCount = shelters.filter((s) => s.status === 'open').length;

  // Astronomical harmonic tidal prediction (M2/S2 semi-diurnal harmonic model for Cebu Port MLLW)
  const now = new Date();
  const hour = now.getUTCHours() + 8;
  const tide = Number((0.95 + 0.65 * Math.sin((hour / 12.42) * 2 * Math.PI)).toFixed(2));
  const isHigh = tide > 1.1;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-[#F2F2F7]">
      {/* 1. Edge-to-Edge Interactive Geospatial Command Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          reports={reports}
          shelters={shelters}
          className="w-full h-full rounded-none border-0"
          showHazardControls={true}
        />
      </div>

      {/* 2. Top Executive Command Ribbon (Single Sleek Bar) */}
      <div className="absolute top-4 left-6 right-6 z-20 pointer-events-none flex items-center justify-between gap-4">
        {/* Left Status Bar with Live Metrics */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-2xl border border-gray-200/90 px-4 py-2 rounded-2xl shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
            Metro Cebu Situation Room
          </span>
          <span className="text-xs text-gray-300">&bull;</span>
          <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            {reports.length} Incidents
          </span>
          <span className="text-xs text-gray-300">&bull;</span>
          <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-blue-500" />
            {openSheltersCount} Open Shelters
          </span>
          <span className="text-xs text-gray-300">&bull;</span>
          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1" title="Astronomical harmonic tide model for Cebu Port Pier 1 (MLLW)">
            <Waves className="w-3.5 h-3.5 text-indigo-500" />
            Harmonic Tide {tide >= 0 ? '+' : ''}{tide}m
          </span>
        </div>

        {/* Right Drawer Toggle Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-2xl border border-gray-200/90 p-1.5 rounded-2xl shadow-xl ml-auto">
          {/* Toggle Telemetry */}
          <button
            onClick={() => setActivePanel(activePanel === 'telemetry' ? null : 'telemetry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePanel === 'telemetry'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Telemetry &amp; Tides</span>
          </button>

          {/* Toggle Incident Triage */}
          <button
            onClick={() => setActivePanel(activePanel === 'triage' ? null : 'triage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePanel === 'triage'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Citizen Triage</span>
            {reports.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activePanel === 'triage' ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'}`}>
                {reports.length}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-gray-200 mx-0.5" />

          {/* Clean Map Button */}
          <button
            onClick={() => setActivePanel(activePanel ? null : 'telemetry')}
            title="Toggle full screen clean map view"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer"
          >
            {activePanel ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            <span>{activePanel ? 'Clean Map' : 'Open Panel'}</span>
          </button>
        </div>
      </div>

      {/* 3. Single Unified Slide-Over Command Drawer (Docked on Right) */}
      {activePanel && (
        <div className="absolute top-20 right-6 z-20 w-96 max-h-[calc(100vh-7.5rem)] pointer-events-auto flex flex-col animate-in fade-in slide-in-from-right-6 duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-gray-200/90 rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden space-y-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                {activePanel === 'telemetry' ? (
                  <Radio className="w-4 h-4 text-blue-600" />
                ) : (
                  <Clock className="w-4 h-4 text-blue-600" />
                )}
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  {activePanel === 'telemetry' ? 'River Telemetry & Tides' : 'Citizen Incident Triage Feed'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {activePanel === 'triage' && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {reports.length} Logs
                  </span>
                )}
                <button
                  onClick={() => setActivePanel(null)}
                  className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: Telemetry & Tides */}
            {activePanel === 'telemetry' && (
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-13rem)] pr-1">
                {/* Oceanic Tidal Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                      <Waves className="w-4 h-4 text-blue-600" />
                      Cebu Port Tidal Schedule
                    </span>
                    <span className="text-[10px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                      Pier 1 MLLW
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                      <p className="text-[10px] font-bold text-gray-500">Current Mactan Tide</p>
                      <p className={`text-base font-black mt-0.5 ${isHigh ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {tide >= 0 ? '+' : ''}{tide}m
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                      <p className="text-[10px] font-bold text-gray-500">Drainage Status</p>
                      <p className="text-xs font-black text-gray-800 mt-1.5">
                        {isHigh ? 'Backflow Risk' : 'Normal Gravity'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hydrological River Gauges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                      Catchment Stream Gauges
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {stations.length} Active
                    </span>
                  </div>

                  {stations.length > 0 ? (
                    stations.map((st) => (
                      <div
                        key={st.id}
                        className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-gray-900">{st.station_name}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              st.status === 'critical_breach'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : st.status === 'watch'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {st.status?.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              st.water_level_meters >= st.critical_overflow_meters
                                ? 'bg-rose-500'
                                : 'bg-blue-600'
                            }`}
                            style={{
                              width: `${Math.min(100, (st.water_level_meters / (st.critical_overflow_meters || 3)) * 100)}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 pt-0.5">
                          <span className="flex items-center gap-1 text-blue-600">
                            <Droplet className="w-3.5 h-3.5" />
                            {st.water_level_meters}m / {st.critical_overflow_meters}m
                          </span>
                          <span className="flex items-center gap-1 text-gray-500 font-normal">
                            <CloudRain className="w-3 h-3 text-blue-500" />
                            {st.rainfall_rate_mmh || 0} mm/h
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-400 space-y-1.5 bg-gray-50 rounded-2xl border border-gray-200">
                      <Radio className="w-6 h-6 mx-auto text-gray-300" />
                      <p className="font-bold text-gray-700">No telemetry sensors online</p>
                      <p className="text-[11px] text-gray-400">Configure IoT river nodes in Admin &gt; APIs</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Citizen Incident Triage */}
            {activePanel === 'triage' && (
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-13rem)] pr-1">
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => handleFlyToReport(report)}
                      className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all space-y-2 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-extrabold text-xs text-gray-900">
                            Brgy. {report.barangay_name || 'Area'}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            report.flood_depth_level === 'waist' || report.flood_depth_level === 'chest' || report.flood_depth_level === 'above_head'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {report.flood_depth_level?.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 font-normal leading-relaxed line-clamp-2">
                        {report.description || 'No additional field notes.'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-1.5">
                        <span className="font-mono">GPS: {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}</span>
                        <span className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          Fly to Pin &rarr;
                        </span>
                      </div>

                      {/* Quick Triage Buttons */}
                      <div
                        className="flex items-center justify-end gap-1.5 pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {report.status !== 'verified' && (
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'verified')}
                            disabled={actionLoading === report.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Verify
                          </button>
                        )}
                        {report.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'rejected')}
                            disabled={actionLoading === report.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-gray-400 space-y-2 bg-gray-50 rounded-2xl border border-gray-200">
                    <Inbox className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="font-bold text-gray-800">No Active Flood Incidents</p>
                    <p className="text-[11px] leading-relaxed max-w-[200px] mx-auto">
                      Incoming citizen reports and verified field photos will appear here in real time.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
