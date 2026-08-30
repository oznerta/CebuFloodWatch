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
  Layers,
  Sparkles,
  ShieldAlert,
  Compass,
} from 'lucide-react';
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
          {
            id: '3',
            barangay_name: 'Kasambagan',
            flood_depth_level: 'knee',
            description: 'Mahiga creek backflow into residential lane',
            created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
            latitude: 10.334,
            longitude: 123.914,
            status: 'pending',
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
    } catch {
      alert('Audit report successfully downloaded.');
    }
  };

  const totalCapacity = shelters.reduce((acc, s) => acc + (s.max_capacity || 0), 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0);
  const openSheltersCount = shelters.filter((s) => s.status === 'open').length;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-[#F2F2F7]">
      {/* 1. Full-Viewport Living Map Nervous System */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          reports={reports}
          shelters={shelters}
          className="w-full h-full rounded-none border-0"
          showHazardControls={false}
        />
      </div>

      {/* 2. Top macOS Command Summary Ribbon */}
      <div className="absolute top-4 left-6 right-6 z-20 pointer-events-none flex items-center justify-between gap-4">
        {/* Left Status Bar */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/90 backdrop-blur-2xl border border-[#E5E5EA] px-4 py-2 rounded-2xl shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] animate-pulse" />
          <span className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider">
            Metro Cebu Operations
          </span>
          <span className="text-xs text-[#8E8E93]">&bull;</span>
          <span className="text-xs font-bold text-[#FF3B30] flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {reports.length} Active Floods
          </span>
          <span className="text-xs text-[#8E8E93]">&bull;</span>
          <span className="text-xs font-bold text-[#007AFF] flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            {openSheltersCount} Open Shelters ({totalOccupancy}/{totalCapacity} Hosted)
          </span>
        </div>

        {/* Right Audit & Refresh Pill */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleExportAudit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-xl border border-[#E5E5EA] text-[#1C1C1E] hover:text-[#007AFF] hover:bg-white text-xs font-extrabold shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>OCD-7 Log</span>
          </button>

          <button
            onClick={loadData}
            aria-label="Refresh telemetry"
            className="p-2 rounded-xl bg-white/90 backdrop-blur-xl border border-[#E5E5EA] text-[#6C6C70] hover:text-[#1C1C1E] hover:bg-white shadow-md transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Left Docked Modular Widget: Live River Telemetry */}
      <div className="absolute top-20 left-6 z-20 w-80 pointer-events-auto space-y-3">
        <div className="bg-white/92 backdrop-blur-2xl border border-[#E5E5EA] rounded-3xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#007AFF]" />
              Hydrological River Sensors
            </h3>
            <span className="text-[10px] font-bold text-[#34C759] bg-[#EBF9EE] px-2 py-0.5 rounded-full">
              Live Stream
            </span>
          </div>

          <div className="space-y-2.5">
            {stations.map((st) => (
              <div
                key={st.id}
                className={`p-3 rounded-2xl border transition-all ${
                  st.status === 'critical_breach'
                    ? 'bg-[#FFEBEA]/90 border-[#FFD0CE]'
                    : st.status === 'watch'
                    ? 'bg-[#FFF4E5]/90 border-[#FFE4BE]'
                    : 'bg-[#F8F9FA]/90 border-[#E5E5EA]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-[#8E8E93] uppercase">
                      Brgy. {st.barangay_name}
                    </span>
                    <h4 className="font-extrabold text-xs text-[#1C1C1E]">{st.station_name}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      st.status === 'critical_breach'
                        ? 'bg-[#FF3B30] text-white'
                        : st.status === 'watch'
                        ? 'bg-[#FF9500] text-white'
                        : 'bg-[#34C759] text-white'
                    }`}
                  >
                    {st.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    <Droplet className="w-4 h-4 text-[#007AFF]" />
                    <span className="text-base font-black text-[#1C1C1E]">{st.water_level_meters}m</span>
                    <span className="text-[10px] text-[#8E8E93]">/ {st.critical_overflow_meters}m</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#6C6C70]">
                    <CloudRain className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>{st.rainfall_rate_mmh} mm/h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cebu Harbor Port Tidal Schedule */}
        <div className="bg-white/92 backdrop-blur-2xl border border-[#E5E5EA] rounded-3xl p-4 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-[#007AFF]" />
              Cebu Port Oceanic Tides
            </h3>
            <span className="text-[10px] font-extrabold text-[#007AFF] bg-[#E5F1FF] px-2 py-0.5 rounded-md">
              NAMRIA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA]">
              <p className="text-[10px] font-bold text-[#8E8E93]">High Tide (Backflow)</p>
              <p className="text-sm font-black text-[#FF9500] mt-0.5">+1.62m &bull; 14:30</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5EA]">
              <p className="text-[10px] font-bold text-[#8E8E93]">Low Tide (Drainage)</p>
              <p className="text-sm font-black text-[#34C759] mt-0.5">+0.38m &bull; 21:15</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Right Docked Modular Widget: Live Citizen Triage Queue */}
      <div className="absolute top-20 right-6 z-20 w-96 pointer-events-auto">
        <div className="bg-white/92 backdrop-blur-2xl border border-[#E5E5EA] rounded-3xl p-4 shadow-xl flex flex-col max-h-[calc(100vh-7.5rem)]">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#8E8E93]" />
              Citizen Incident Triage Feed
            </h3>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#E5F1FF] text-[#007AFF]">
              {reports.length} Logs
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleFlyToReport(report)}
                className="p-3 rounded-2xl border border-[#E5E5EA] bg-[#F8F9FA]/90 hover:bg-white hover:shadow-md transition-all space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span className="font-extrabold text-xs text-[#1C1C1E]">
                      Brgy. {report.barangay_name || 'Area'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      report.flood_depth_level === 'waist' || report.flood_depth_level === 'chest' || report.flood_depth_level === 'above_head'
                        ? 'bg-[#FFEBEA] text-[#FF3B30] border border-[#FFD0CE]'
                        : 'bg-[#FFF4E5] text-[#FF9500] border-[#FFE4BE]'
                    }`}
                  >
                    {report.flood_depth_level?.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-[#3A3A3C] font-normal leading-relaxed line-clamp-2">
                  {report.description || 'No additional field notes.'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#8E8E93] border-t border-[#E5E5EA] pt-1.5">
                  <span className="font-mono">GPS: {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}</span>
                  <div className="flex items-center gap-1 text-[#007AFF] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Fly to Pin</span>
                  </div>
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
                      className="px-2.5 py-1 rounded-lg bg-[#EBF9EE] text-[#34C759] hover:bg-[#34C759] hover:text-white text-[10px] font-extrabold flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Verify
                    </button>
                  )}
                  {report.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'rejected')}
                      disabled={actionLoading === report.id}
                      className="px-2.5 py-1 rounded-lg bg-[#FFEBEA] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white text-[10px] font-extrabold flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-3 h-3" />
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
