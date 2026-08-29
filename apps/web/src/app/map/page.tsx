'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer } from '../../components/map/MapContainer';
import { fetchApi } from '../../lib/api';
import { MapPin, Home, AlertTriangle, Layers } from 'lucide-react';

export default function MapPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<any[]>('/reports').then(setReports).catch(() => {});
    fetchApi<any[]>('/shelters').then(setShelters).catch(() => {});
  }, []);

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-7.5rem)] flex flex-col pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
            Geospatial Flood Hazard & Shelter Network
          </h1>
          <p className="text-sm text-[#8E8E93] mt-0.5 font-medium">
            Metro Cebu UP NOAH flood risk zones, open evacuation centers, and real-time citizen dispatches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E5E5EA] shadow-sm text-xs font-bold text-[#1C1C1E]">
            <Home className="w-4 h-4 text-[#34C759]" />
            <span>{shelters.length} Shelters</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E5E5EA] shadow-sm text-xs font-bold text-[#1C1C1E]">
            <AlertTriangle className="w-4 h-4 text-[#FF3B30]" />
            <span>{reports.length} Incidents</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl overflow-hidden shadow-sm border border-[#E5E5EA]">
        <MapContainer
          reports={reports}
          shelters={shelters}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
