'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { CEBU_CITY_BOUNDS } from '@cebufloodwatch/shared';

interface MapContainerProps {
  reports?: any[];
  shelters?: any[];
  roads?: any[];
  className?: string;
}

export function MapContainer({
  reports = [],
  shelters = [],
  roads = [],
  className = 'h-[500px] w-full',
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty', // Open-source vector style
      center: CEBU_CITY_BOUNDS.center,
      zoom: 12.5,
      pitch: 30,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render Markers on Map
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // Add Shelter Markers
    shelters.forEach((shelter) => {
      if (!shelter.latitude || !shelter.longitude) return;

      const el = document.createElement('div');
      el.className = `w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white ${
        shelter.status === 'open' ? 'bg-emerald-600' : shelter.status === 'full' ? 'bg-amber-600' : 'bg-slate-600'
      }`;
      el.innerHTML = '🏠';

      new maplibregl.Marker(el)
        .setLngLat([shelter.longitude, shelter.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="margin: 0; font-weight: bold; font-size: 14px;">${shelter.name}</h4>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #555;">Capacity: ${shelter.current_occupancy} / ${shelter.max_capacity}</p>
              <span style="display: inline-block; margin-top: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; background: ${
                shelter.status === 'open' ? '#d1fae5; color: #065f46' : '#fef3c7; color: #92400e'
              }; text-transform: uppercase;">${shelter.status}</span>
            </div>
          `)
        )
        .addTo(map);
    });

    // Add Citizen Report Markers
    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return;

      const colors: Record<string, string> = {
        ankle: '#1f9d55',
        knee: '#facc15',
        waist: '#f5820d',
        chest: '#ea3838',
        above_head: '#991547',
      };

      const el = document.createElement('div');
      el.className =
        'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white animate-bounce';
      el.style.backgroundColor = colors[report.flood_depth_level] || '#ea3838';
      el.innerHTML = '💧';

      new maplibregl.Marker(el)
        .setLngLat([report.longitude, report.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="margin: 0; font-weight: bold; font-size: 13px; color: #b91c1c;">Flood Depth: ${report.flood_depth_level.toUpperCase()}</h4>
              <p style="margin: 4px 0 0 0; font-size: 12px;">${report.description || 'Citizen verified report'}</p>
              <span style="font-size: 10px; color: #777;">${new Date(report.created_at).toLocaleTimeString()}</span>
            </div>
          `)
        )
        .addTo(map);
    });
  }, [mapLoaded, reports, shelters]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-surface-border ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
