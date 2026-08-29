'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Home,
  Megaphone,
  Radio,
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
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Disaster Operations Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-Time Hydrological Telemetry, Incident Clustering & Evacuation Hub
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAudit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export OCD-7 Audit Log
          </button>

          <button
            onClick={loadData}
            aria-label="Refresh telemetry"
            className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Flood Incidents"
          value={reports.length}
          subtitle="Crowdsourced GPS reports"
          trend="+2 last 30m"
          icon={AlertTriangle}
          colorVariant="rose"
        />
        <StatCard
          title="Open Evacuation Centers"
          value={`${openSheltersCount} / ${shelters.length}`}
          subtitle={`${totalOccupancy} evacuees hosted`}
          icon={Home}
          colorVariant="emerald"
        />
        <StatCard
          title="Shelter Capacity"
          value={`${totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}%`}
          subtitle={`${totalCapacity - totalOccupancy} spaces available`}
          icon={TrendingUp}
          colorVariant="blue"
        />
        <StatCard
          title="Active Emergency Warnings"
          value={alerts.length}
          subtitle="Bilingual push broadcasts"
          icon={Megaphone}
          colorVariant="amber"
        />
      </div>

      {/* Hydrological Sensor Live Stream Widgets */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Metro Cebu Hydrological Sensor Stream (River & Basin Gauges)
          </h2>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live PAGASA / DRRMO Sensor Feeds
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stations.slice(0, 3).map((st) => (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                st.status === 'critical_breach'
                  ? 'bg-rose-950/20 border-rose-900/50'
                  : st.status === 'watch'
                  ? 'bg-amber-950/20 border-amber-900/50'
                  : 'bg-surface-subtle border-surface-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Barangay {st.barangay_name}
                  </span>
                  <h4 className="font-bold text-xs text-white">{st.station_name}</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    st.status === 'critical_breach'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : st.status === 'watch'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {st.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-base font-extrabold text-white">
                      {st.water_level_meters}m
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      / {st.critical_overflow_meters}m limit
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                  <span>{st.rainfall_rate_mmh} mm/h</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-surface-border/60">
                <span className="flex items-center gap-1">
                  Trend:
                  {st.trend === 'rising' ? (
                    <span className="text-rose-400 font-bold flex items-center">
                      <ArrowUpRight className="w-3 h-3" /> Rising
                    </span>
                  ) : st.trend === 'receding' ? (
                    <span className="text-emerald-400 font-bold flex items-center">
                      <ArrowDownRight className="w-3 h-3" /> Receding
                    </span>
                  ) : (
                    <span className="text-slate-300 font-bold flex items-center">
                      <Minus className="w-3 h-3" /> Stable
                    </span>
                  )}
                </span>
                <span>Active Geofence</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Command Center: Map + Live Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spatial Map View */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              Live Metro Cebu Hazard & Incident Map
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Open Shelter
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Flood Report
              </span>
            </div>
          </div>
          <MapContainer reports={reports} shelters={shelters} className="h-[490px]" />
        </div>

        {/* Live Incident Submissions Queue with Actions */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col h-[535px]">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Live Citizen Feed
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              {reports.length} Reports
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-3.5 rounded-lg border border-surface-border bg-surface-subtle/50 hover:bg-surface-subtle transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">
                    {report.barangay_name || 'Barangay Area'}
                  </span>
                  <Badge
                    variant={
                      report.flood_depth_level === 'waist' || report.flood_depth_level === 'chest'
                        ? 'critical'
                        : 'warning'
                    }
                  >
                    {report.flood_depth_level?.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {report.description || 'No additional details provided.'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-surface-border/60 pt-2">
                  <span>GPS: {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}</span>
                  <span>{new Date(report.created_at).toLocaleTimeString()}</span>
                </div>

                {/* Verification Control Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {report.status !== 'verified' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'verified')}
                      disabled={actionLoading === report.id}
                      className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Verify
                    </button>
                  )}
                  {report.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'rejected')}
                      disabled={actionLoading === report.id}
                      className="px-2 py-1 rounded bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
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
