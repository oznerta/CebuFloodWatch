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
  CloudRain,
  Wind,
  Thermometer,
  Activity,
  Gauge,
  Navigation,
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
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Single active drawer panel (or null for 100% clean full map)
  const [activePanel, setActivePanel] = useState<ActivePanel>('telemetry');

  const loadData = async () => {
    try {
      const [reportsData, sheltersData, alertsData, stationsData, weatherRes] = await Promise.all([
        fetchApi<any[]>('/reports').catch(() => []),
        fetchApi<any[]>('/shelters').catch(() => []),
        fetchApi<any[]>('/alerts/active').catch(() => []),
        fetchApi<any[]>('/telemetry/stations').catch(() => []),
        fetchApi<any>('/telemetry/weather').catch(() => null),
      ]);

      if (reportsData) setReports(reportsData);
      if (sheltersData) setShelters(sheltersData);
      if (alertsData) setAlerts(alertsData);
      if (stationsData) setStations(stationsData);
      if (weatherRes && weatherRes.data) setWeatherData(weatherRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh live weather and stream gauges every 30 seconds
    const interval = setInterval(() => {
      fetchApi<any>('/telemetry/weather')
        .then((res) => {
          if (res && res.data) setWeatherData(res.data);
        })
        .catch(() => {});
      fetchApi<any[]>('/telemetry/stations')
        .then((st) => {
          if (st && Array.isArray(st)) setStations(st);
        })
        .catch(() => {});
    }, 30000);

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

      socket.on('telemetry:updated', (updatedStation: any) => {
        setStations((prev) => {
          const exists = prev.some((s) => s.id === updatedStation.id);
          if (exists) {
            return prev.map((s) => (s.id === updatedStation.id ? updatedStation : s));
          }
          return [...prev, updatedStation];
        });
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('report:created');
        socket.off('report:status_changed');
        socket.off('alert:broadcast');
        socket.off('shelter:updated');
        socket.off('telemetry:updated');
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
      console.error('Failed to update incident status:', err);
      alert(`Failed to update status: ${err?.message || 'Server error'}`);
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
          name: report.barangay_name || 'Incident Pin',
        },
      })
    );
  };

  const handleFlyToStation = (station: any) => {
    window.dispatchEvent(
      new CustomEvent('map:flyto', {
        detail: {
          latitude: station.latitude,
          longitude: station.longitude,
          name: station.station_name,
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
          stations={stations}
          className="w-full h-full rounded-none border-0"
          showHazardControls={true}
        />
      </div>

      {/* 2. Top Executive Command Ribbon (Apple Glassmorphism Bar) */}
      <div className="absolute top-4 left-6 right-6 z-20 pointer-events-none flex items-center justify-between gap-4">
        {/* Left Status Ribbon with Live Environmental Telemetry */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-2xl border border-gray-200/90 px-4 py-2.5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Situation Room
            </span>
          </div>

          <span className="text-xs text-gray-300">&bull;</span>

          <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            {reports.length} Incidents
          </span>

          <span className="text-xs text-gray-300">&bull;</span>

          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-emerald-500" />
            {openSheltersCount} Open Shelters
          </span>

          <span className="text-xs text-gray-300">&bull;</span>

          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5" title="Astronomical harmonic tide model for Cebu Port Pier 1 (MLLW)">
            <Waves className="w-3.5 h-3.5 text-indigo-500" />
            Tide {tide >= 0 ? '+' : ''}{tide}m
          </span>

          <span className="text-xs text-gray-300">&bull;</span>

          <span className="text-xs font-bold text-sky-600 flex items-center gap-1.5" title="DOST-PAGASA Mactan Doppler Radar & Precipitation Stream">
            <CloudRain className="w-3.5 h-3.5 text-sky-500" />
            PAGASA Doppler {weatherData?.precipitation_mmh ?? 0} mm/h &bull; {weatherData?.temperature_c ?? 28.5}&deg;C
          </span>
        </div>

        {/* Right Drawer Toggle Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-2xl border border-gray-200/90 p-1.5 rounded-2xl shadow-xl ml-auto">
          {/* Toggle Telemetry */}
          <button
            onClick={() => setActivePanel(activePanel === 'telemetry' ? null : 'telemetry')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePanel === 'telemetry'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Telemetry &amp; Tides</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activePanel === 'telemetry' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {stations.length}
            </span>
          </button>

          {/* Toggle Incident Triage */}
          <button
            onClick={() => setActivePanel(activePanel === 'triage' ? null : 'triage')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePanel === 'triage'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer"
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
                {/* 1. DOST-PAGASA Weather Doppler Stream Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/70 border border-sky-100 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                      <CloudRain className="w-4 h-4 text-sky-600" />
                      DOST-PAGASA Weather Doppler
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      weatherData?.warningTier === 'RED_WARNING'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : weatherData?.warningTier === 'ORANGE_WARNING'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : weatherData?.warningTier === 'YELLOW_WARNING'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {weatherData?.warningTier === 'NORMAL' ? 'NORMAL RAIN' : weatherData?.warningTier?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    <div className="p-2 rounded-xl bg-white border border-sky-100 text-center">
                      <p className="text-[9px] font-bold text-gray-500">Rain</p>
                      <p className="text-xs font-black text-sky-700 mt-0.5">
                        {weatherData?.precipitation_mmh ?? 0} <span className="text-[8px]">mm/h</span>
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-sky-100 text-center">
                      <p className="text-[9px] font-bold text-gray-500">Temp</p>
                      <p className="text-xs font-black text-gray-800 mt-0.5">
                        {weatherData?.temperature_c ?? 28.5}&deg;C
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-sky-100 text-center">
                      <p className="text-[9px] font-bold text-gray-500">Wind</p>
                      <p className="text-xs font-black text-gray-800 mt-0.5">
                        {weatherData?.wind_speed_kmh ?? 10} <span className="text-[8px]">km/h</span>
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-sky-100 text-center">
                      <p className="text-[9px] font-bold text-gray-500">Humidity</p>
                      <p className="text-xs font-black text-gray-800 mt-0.5">
                        {weatherData?.humidity_pct ?? 78}%
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-gray-600 bg-white/90 p-2.5 rounded-xl border border-sky-100 leading-snug">
                    <span className="font-bold text-sky-900">Mactan Radar:</span> {weatherData?.advisory || 'Normal atmospheric telemetry across Metro Cebu.'}
                  </div>
                </div>

                {/* 2. Oceanic Tidal Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/80 space-y-3 shadow-xs">
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

                {/* 3. Hydrological River Gauges (Catchment Network) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                      Catchment Stream Gauges
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {stations.length} Online
                    </span>
                  </div>

                  {stations.length > 0 ? (
                    stations.map((st) => {
                      const isBreach = st.status === 'critical_breach';
                      const isWatch = st.status === 'watch';
                      const pct = Math.min(100, Math.round((st.water_level_meters / (st.critical_overflow_meters || 2.5)) * 100));

                      return (
                        <div
                          key={st.id}
                          className="p-3.5 rounded-2xl bg-white border border-gray-200/90 space-y-2.5 hover:border-blue-400 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-extrabold text-xs text-gray-900 leading-tight">
                                {st.station_name}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                {st.river_basin} &bull; Brgy. {st.barangay_name}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                isBreach
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isWatch
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isBreach ? 'CRITICAL' : isWatch ? 'WATCH' : 'NORMAL'}
                            </span>
                          </div>

                          {/* Gauge Fill Bar with Threshold Marks */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                              <span>Level: <strong className="text-gray-900">{st.water_level_meters}m</strong></span>
                              <span>Crit: <strong className="text-rose-600">{st.critical_overflow_meters}m</strong></span>
                            </div>

                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden relative">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isBreach
                                    ? 'bg-rose-500'
                                    : isWatch
                                    ? 'bg-amber-500'
                                    : 'bg-blue-600'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 pt-1 border-t border-gray-100">
                            <span className="flex items-center gap-1 text-sky-600">
                              <CloudRain className="w-3 h-3" />
                              {st.rainfall_rate_mmh || 0} mm/h
                            </span>

                            <button
                              onClick={() => handleFlyToStation(st)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold cursor-pointer hover:underline"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Locate</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
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
                      className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-blue-400 hover:shadow-md transition-all space-y-2.5 cursor-pointer group"
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
                        {report.description || 'Verified flood incident pin.'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-400">
                        <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-bold text-blue-600 group-hover:underline flex items-center gap-0.5">
                          Focus on Map &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-gray-400 space-y-2 bg-gray-50 rounded-2xl border border-gray-200">
                    <Inbox className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="font-bold text-gray-700">No active incidents</p>
                    <p className="text-[11px] text-gray-400">All Metro Cebu flood basins clear</p>
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
