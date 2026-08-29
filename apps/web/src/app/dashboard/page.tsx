'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Home,
  Split,
  Megaphone,
  Radio,
  Clock,
  ShieldCheck,
  TrendingUp,
  MapPin,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [reportsData, sheltersData, alertsData] = await Promise.all([
          fetchApi<any[]>('/reports').catch(() => [
            {
              id: '1',
              barangay_name: 'Mabolo',
              flood_depth_level: 'waist',
              description: 'Suba river overflow reaching front of church',
              created_at: new Date().toISOString(),
              latitude: 10.325,
              longitude: 123.9167,
            },
            {
              id: '2',
              barangay_name: 'Mambaling',
              flood_depth_level: 'chest',
              description: 'Underpass totally flooded, stranded vehicles',
              created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              latitude: 10.2915,
              longitude: 123.8742,
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
        ]);

        setReports(reportsData);
        setShelters(sheltersData);
        setAlerts(alertsData);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Socket real-time event listener
    const socket = getSocket();
    socket.on('report:new', (newReport) => {
      setReports((prev) => [newReport, ...prev]);
    });

    return () => {
      socket.off('report:new');
    };
  }, []);

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
            Real-Time Flood Telemetry & Evacuation Management for Metro Cebu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="low">
            <Radio className="w-3.5 h-3.5" />
            Grid Status: Active
          </Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
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
          <MapContainer reports={reports} shelters={shelters} className="h-[480px]" />
        </div>

        {/* Live Incident Submissions Queue */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col h-[525px]">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Live Citizen Submissions
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              {reports.length} Reports
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-3 rounded-lg border border-surface-border bg-surface-subtle/50 hover:bg-surface-subtle transition-colors"
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
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2">
                  {report.description || 'No additional details provided.'}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    GPS: {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                  </span>
                  <span>{new Date(report.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
