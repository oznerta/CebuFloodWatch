'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer } from '../../components/map/MapContainer';
import { fetchApi } from '../../lib/api';

export default function MapPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<any[]>('/reports').then(setReports).catch(() => {});
    fetchApi<any[]>('/shelters').then(setShelters).catch(() => {});
  }, []);

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Geospatial Flood Hazard & Shelter Network
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Metro Cebu flood risk zones, open shelters, and crowdsourced depth verification
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <MapContainer reports={reports} shelters={shelters} className="h-full w-full" />
      </div>
    </div>
  );
}
