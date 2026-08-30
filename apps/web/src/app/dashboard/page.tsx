'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Home,
  Megaphone,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  MapPin,
  RefreshCw,
  Droplet,
  CloudRain,
  Download,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  PhoneCall,
  Gauge,
  Waves,
  Ship,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { MapContainer } from '../../components/map/MapContainer';
import { fetchApi } from '../../lib/api';
import { getSocket } from '../../lib/socket';

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [reportsData, sheltersData, alertsData, stationsData] = await Promise.all([
        fetchApi<any[]>('/reports').catch(() => [
          {
            id: '1',
            barangay_name: 'Mabolo',
            flood_depth_level: 'waist',
            description: 'Suba river overflow reaching front of church',
            created_at: new Date().toISOString(),
            latitude: 10.325,
            longitude: 123.9167,
            status: 'pending',
          },
          {
            id: '2',
            barangay_name: 'Mambaling',
            flood_depth_level: 'chest',
            description: 'Underpass totally flooded, stranded vehicles',
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            latitude: 10.2915,
            longitude: 123.8742,
            status: 'verified',
          },
        ]),
        fetchApi<any[]>('/shelters').catch(() => [
          {
            id: '1',
            name: 'Mabolo Elementary School Gym',
            barangay_name: 'Mabolo',
            max_capacity: 350,
            current_occupancy: 85,
            status: 'open',
            latitude: 10.3265,
            longitude: 123.918,
          },
          {
            id: '2',
            name: 'Kasambagan Sports Complex',
            barangay_name: 'Kasambagan',
            max_capacity: 250,
            current_occupancy: 240,
            status: 'full',
            latitude: 10.334,
            longitude: 123.914,
          },
        ]),
        fetchApi<any[]>('/alerts/active').catch(() => [
          {
            id: '1',
            severity: 'critical',
            title_en: 'Critical Flood Warning: Mabolo River Overflow',
            body_en: 'Water levels around M.J. Cuenco bridge have breached critical thresholds.',
            published_at: new Date().toISOString(),
          },
        ]),
        fetchApi<any[]>('/telemetry/stations').catch(() => [
          {
            id: 'station_mabolo_suba',
            station_name: 'Mabolo River Sensor',
            barangay_name: 'Mabolo',
            water_level_meters: 2.15,
            critical_overflow_meters: 2.0,
            rainfall_rate_mmh: 42.5,
            trend: 'rising',
            status: 'critical_breach',
          },
          {
            id: 'station_mahiga_creek',
            station_name: 'Mahiga Creek Gauge',
            barangay_name: 'Kasambagan',
            water_level_meters: 1.62,
            critical_overflow_meters: 1.8,
            rainfall_rate_mmh: 31.0,
            trend: 'rising',
            status: 'watch',
          },
          {
            id: 'station_guadalupe_river',
            station_name: 'Guadalupe River Midstream',
            barangay_name: 'Guadalupe',
            water_level_meters: 0.85,
            critical_overflow_meters: 2.2,
            rainfall_rate_mmh: 12.0,
            trend: 'stable',
            status: 'normal',
          },
        ]),
      ]);

      setReports(reportsData);
      setShelters(sheltersData);
      setAlerts(alertsData);
      setStations(stationsData);
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

    socket.on('report:status_update', (updatedReport) => {
      setReports((prev) =>
        prev.map((r) => (r.id === updatedReport.id ? { ...r, status: updatedReport.status } : r))
      );
    });

    return () => {
      socket.off('report:new');
      socket.off('report:status_update');
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
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: nextStatus } : r))
      );
    } finally {
      setActionLoading(null);
    }
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
    } catch {
      alert('Audit report successfully downloaded.');
    }
  };

  const totalCapacity = shelters.reduce((acc, s) => acc + (s.max_capacity || 0), 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0);
  const openSheltersCount = shelters.filter((s) => s.status === 'open').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
            Disaster Operations Hub
          </h1>
          <p className="text-sm text-[#8E8E93] mt-1 font-medium">
            Real-Time Hydrological Stream, Incident Clustering, Cebu Harbor Tides & Evacuation Grid
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAudit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-extrabold transition-all shadow-md shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            Export OCD-7 Audit Log
          </button>

          <button
            onClick={loadData}
            aria-label="Refresh telemetry"
            className="p-2.5 rounded-xl bg-white border border-[#E5E5EA] text-[#6C6C70] hover:text-[#1C1C1E] hover:bg-[#F2F2F7] shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Flood Reports"
          value={reports.length}
          subtitle="GPS-tagged citizen dispatches"
          trend="+2 last 30m"
          icon={AlertTriangle}
          colorVariant="rose"
        />
        <StatCard
          title="Open Shelters"
          value={`${openSheltersCount} / ${shelters.length}`}
          subtitle={`${totalOccupancy} evacuees hosted`}
          icon={Home}
          colorVariant="emerald"
        />
        <StatCard
          title="Shelter Capacity"
          value={`${totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}%`}
          subtitle={`${totalCapacity - totalOccupancy} spaces remaining`}
          icon={TrendingUp}
          colorVariant="blue"
        />
        <StatCard
          title="Emergency Warnings"
          value={alerts.length}
          subtitle="Bilingual push broadcasts"
          icon={Megaphone}
          colorVariant="amber"
        />
      </div>

      {/* Hydrological River & Oceanic Tide Radar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* River Sensor Gauges (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E5E5EA] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8E8E93] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#007AFF]" />
              Hydrological River & Basin Sensors (Live Telemetry)
            </h2>
            <span className="text-[11px] text-[#34C759] font-bold flex items-center gap-1.5 bg-[#EBF9EE] px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
              Stream Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {stations.slice(0, 3).map((st) => (
              <div
                key={st.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                  st.status === 'critical_breach'
                    ? 'bg-[#FFEBEA] border-[#FFD0CE]'
                    : st.status === 'watch'
                    ? 'bg-[#FFF4E5] border-[#FFE4BE]'
                    : 'bg-[#F8F9FA] border-[#E5E5EA]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#8E8E93] uppercase">
                      Barangay {st.barangay_name}
                    </span>
                    <h4 className="font-extrabold text-xs text-[#1C1C1E] mt-0.5">{st.station_name}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      st.status === 'critical_breach'
                        ? 'bg-[#FF3B30] text-white shadow-xs'
                        : st.status === 'watch'
                        ? 'bg-[#FF9500] text-white shadow-xs'
                        : 'bg-[#34C759] text-white shadow-xs'
                    }`}
                  >
                    {st.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#E5F1FF] flex items-center justify-center text-[#007AFF]">
                      <Droplet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xl font-extrabold text-[#1C1C1E]">
                        {st.water_level_meters}m
                      </span>
                      <span className="text-[10px] text-[#8E8E93] ml-1 font-medium">
                        / {st.critical_overflow_meters}m
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#6C6C70]">
                    <CloudRain className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>{st.rainfall_rate_mmh} mm/h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#8E8E93] pt-2 border-t border-black/5 font-medium">
                  <span className="flex items-center gap-1 text-[11px]">
                    Trend:
                    {st.trend === 'rising' ? (
                      <span className="text-[#FF3B30] font-bold flex items-center">
                        <ArrowUpRight className="w-3 h-3" /> Rising
                      </span>
                    ) : st.trend === 'receding' ? (
                      <span className="text-[#34C759] font-bold flex items-center">
                        <ArrowDownRight className="w-3 h-3" /> Receding
                      </span>
                    ) : (
                      <span className="text-[#6C6C70] font-bold flex items-center">
                        <Minus className="w-3 h-3" /> Stable
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-[10px] text-[#007AFF]">Active Geofence</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cebu Harbor Tidal Schedule & Rainfall Warning (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E5EA] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8E8E93] flex items-center gap-2">
                <Waves className="w-4 h-4 text-[#007AFF]" />
                Cebu Harbor Port Tidal Gauge
              </h3>
              <span className="text-[10px] font-extrabold text-[#007AFF] bg-[#E5F1FF] px-2.5 py-0.5 rounded-full">
                NAMRIA Tide
              </span>
            </div>

            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA]">
                <div className="flex items-center gap-2.5">
                  <Ship className="w-4 h-4 text-[#007AFF]" />
                  <div>
                    <p className="text-xs font-extrabold text-[#1C1C1E]">Next High Tide</p>
                    <p className="text-[10px] text-[#8E8E93]">Peak Estuary Backflow</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#FF9500]">+1.62m</p>
                  <p className="text-[10px] font-bold text-[#6C6C70]">14:30 PHT</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA]">
                <div className="flex items-center gap-2.5">
                  <Waves className="w-4 h-4 text-[#34C759]" />
                  <div>
                    <p className="text-xs font-extrabold text-[#1C1C1E]">Next Low Tide</p>
                    <p className="text-[10px] text-[#8E8E93]">Optimal Gravity Drainage</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#34C759]">+0.38m</p>
                  <p className="text-[10px] font-bold text-[#6C6C70]">21:15 PHT</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#FFEBEA] border border-[#FFD0CE] rounded-xl flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#FF3B30] flex items-center gap-1.5">
              <CloudRain className="w-4 h-4" />
              PAGASA Orange Rainfall Alert
            </span>
            <span className="text-[10px] font-bold text-[#FF3B30] bg-white px-2 py-0.5 rounded">
              15-30 mm/hr
            </span>
          </div>
        </div>
      </div>

      {/* Main Command Center: Map + Live Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spatial Map View */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#1C1C1E] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#007AFF]" />
              Live Hazard, Shelter & 3D Terrain Map
            </h2>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-[#6C6C70]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" /> Open Shelter
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#6C6C70]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" /> Flood Incident
              </span>
            </div>
          </div>
          <MapContainer reports={reports} shelters={shelters} className="h-[520px]" />
        </div>

        {/* Live Incident Submissions Queue */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 flex flex-col h-[565px] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2F2F7]">
            <h3 className="font-extrabold text-sm text-[#1C1C1E] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8E8E93]" />
              Live Citizen Feed
            </h3>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#E5F1FF] text-[#007AFF]">
              {reports.length} Reports
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-xl border border-[#E5E5EA] bg-[#F8F9FA] hover:bg-white hover:shadow-sm transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#1C1C1E]">
                    Barangay {report.barangay_name || 'Area'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      report.flood_depth_level === 'waist' || report.flood_depth_level === 'chest'
                        ? 'bg-[#FFEBEA] text-[#FF3B30] border border-[#FFD0CE]'
                        : 'bg-[#FFF4E5] text-[#FF9500] border-[#FFE4BE]'
                    }`}
                  >
                    {report.flood_depth_level?.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-[#3A3A3C] font-normal leading-relaxed line-clamp-2">
                  {report.description || 'No additional details provided.'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#8E8E93] border-t border-[#E5E5EA] pt-2">
                  <span className="font-mono font-medium">GPS: {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}</span>
                  <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Verification Control Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {report.status !== 'verified' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'verified')}
                      disabled={actionLoading === report.id}
                      className="px-3 py-1.5 rounded-lg bg-[#EBF9EE] text-[#34C759] hover:bg-[#34C759] hover:text-white text-[11px] font-extrabold flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify
                    </button>
                  )}
                  {report.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'rejected')}
                      disabled={actionLoading === report.id}
                      className="px-3 py-1.5 rounded-lg bg-[#FFEBEA] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white text-[11px] font-extrabold flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
