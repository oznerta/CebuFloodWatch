'use client';

import React, { useEffect, useState } from 'react';
import { Home, Users, Phone, MapPin } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { fetchApi } from '../../lib/api';

export default function EvacuationPage() {
  const [shelters, setShelters] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<any[]>('/shelters').then(setShelters).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Evacuation Centers & Shelter Capacity
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Monitor shelter occupancy, supply logistics, and operational status across Metro Cebu
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {shelters.map((shelter) => (
          <div
            key={shelter.id}
            className="bg-surface-card border border-surface-border rounded-xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{shelter.name}</h3>
                <Badge variant={shelter.status === 'open' ? 'success' : shelter.status === 'full' ? 'warning' : 'default'}>
                  {shelter.status?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {shelter.address}
              </p>

              {/* Capacity Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Users className="w-3.5 h-3.5" /> Occupancy
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {shelter.current_occupancy} / {shelter.max_capacity}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      shelter.current_occupancy >= shelter.max_capacity ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (shelter.current_occupancy / shelter.max_capacity) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border text-xs text-slate-500 flex items-center justify-between">
              <span>Contact: {shelter.contact_person || 'Barangay Focal'}</span>
              <span className="font-mono">{shelter.contact_number || 'Hotline 911'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
