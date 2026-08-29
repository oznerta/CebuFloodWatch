'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { CEBU_CITY_BOUNDS, UP_NOAH_CEBU_HAZARD_GEOJSON } from '@cebufloodwatch/shared';
import { Layers } from 'lucide-react';

interface MapContainerProps {
  reports?: any[];
  shelters?: any[];
  roads?: any[];
  className?: string;
  showHazardControls?: boolean;
}

export function MapContainer({
  reports = [],
  shelters = [],
  roads = [],
  className = 'h-[500px] w-full',
  showHazardControls = true,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [show100Year, setShow100Year] = useState(true);
  const [show25Year, setShow25Year] = useState(true);
  const [show5Year, setShow5Year] = useState(true);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: CEBU_CITY_BOUNDS.center,
      zoom: 12.5,
      pitch: 25,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    map.on('load', () => {
      mapRef.current = map;

      // 1. Add UP NOAH Hazard GeoJSON Source
      map.addSource('up-noah-hazards', {
        type: 'geojson',
        data: UP_NOAH_CEBU_HAZARD_GEOJSON as any,
      });

      // 100-Year Severe Hazard Layer (Red)
      map.addLayer({
        id: 'hazard-100yr-fill',
        type: 'fill',
        source: 'up-noah-hazards',
        filter: ['==', ['get', 'hazard_level'], '100_year'],
        paint: { 'fill-color': '#ea3838', 'fill-opacity': 0.35 },
      });
      map.addLayer({
        id: 'hazard-100yr-line',
        type: 'line',
        source: 'up-noah-hazards',
        filter: ['==', ['get', 'hazard_level'], '100_year'],
        paint: { 'line-color': '#b91c1c', 'line-width': 2 },
      });

      // 25-Year High Risk Layer (Orange)
      map.addLayer({
        id: 'hazard-25yr-fill',
        type: 'fill',
        source: 'up-noah-hazards',
        filter: ['==', ['get', 'hazard_level'], '25_year'],
        paint: { 'fill-color': '#f5820d', 'fill-opacity': 0.3 },
      });
      map.addLayer({
        id: 'hazard-25yr-line',
        type: 'line',
        source: 'up-noah-hazards',
        filter: ['==', ['get', 'hazard_level'], '25_year'],
        paint: { 'line-color': '#c2410c', 'line-width': 1.5 },
      });

      // 5-Year Advisory Layer (Yellow)
      map.addLayer({
        id: 'hazard-5yr-fill',
        type: 'fill',
        source: 'up-noah-hazards',
        filter: ['==', ['get', 'hazard_level'], '5_year'],
        paint: { 'fill-color': '#facc15', 'fill-opacity': 0.25 },
      });
      map.addLayer({
        id: 'hazard-5yr-line',
        type: 'line',
        source: 'up-noah-hazards',
        filter: ['==', ['get', 'hazard_level'], '5_year'],
        paint: { 'line-color': '#ca8a04', 'line-width': 1.5 },
      });

      // 2. Add Road Network GeoJSON Source
      map.addSource('cebu-roads', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Road Passable (Green)
      map.addLayer({
        id: 'roads-passable',
        type: 'line',
        source: 'cebu-roads',
        filter: ['==', ['get', 'status'], 'passable'],
        paint: {
          'line-color': '#10b981',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });

      // Road Light Only (Orange)
      map.addLayer({
        id: 'roads-light-only',
        type: 'line',
        source: 'cebu-roads',
        filter: ['==', ['get', 'status'], 'light_vehicles_only'],
        paint: {
          'line-color': '#f5820d',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });

      // Road Impassable (Red Dashed)
      map.addLayer({
        id: 'roads-impassable',
        type: 'line',
        source: 'cebu-roads',
        filter: ['==', ['get', 'status'], 'impassable'],
        paint: {
          'line-color': '#ea3838',
          'line-width': 6,
          'line-dasharray': [2, 2],
          'line-opacity': 0.95,
        },
      });

      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Hazard Layer Visibility
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (map.getLayer('hazard-100yr-fill')) {
      map.setLayoutProperty('hazard-100yr-fill', 'visibility', show100Year ? 'visible' : 'none');
      map.setLayoutProperty('hazard-100yr-line', 'visibility', show100Year ? 'visible' : 'none');
    }
    if (map.getLayer('hazard-25yr-fill')) {
      map.setLayoutProperty('hazard-25yr-fill', 'visibility', show25Year ? 'visible' : 'none');
      map.setLayoutProperty('hazard-25yr-line', 'visibility', show25Year ? 'visible' : 'none');
    }
    if (map.getLayer('hazard-5yr-fill')) {
      map.setLayoutProperty('hazard-5yr-fill', 'visibility', show5Year ? 'visible' : 'none');
      map.setLayoutProperty('hazard-5yr-line', 'visibility', show5Year ? 'visible' : 'none');
    }
  }, [mapLoaded, show100Year, show25Year, show5Year]);

  // Update Road Network Data Source
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !roads || roads.length === 0) return;
    const map = mapRef.current;
    const roadSource = map.getSource('cebu-roads') as maplibregl.GeoJSONSource;
    if (roadSource) {
      const features = roads
        .filter((r) => r.geometry && r.geometry.coordinates)
        .map((r) => ({
          type: 'Feature' as const,
          properties: {
            id: r.id,
            name: r.name,
            status: r.status,
            flood_depth_level: r.flood_depth_level,
            blockage_reason: r.blockage_reason,
          },
          geometry: r.geometry,
        }));

      roadSource.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [mapLoaded, roads]);

  // Render Dynamic Shelter & Report Markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Add Shelter Markers
    shelters.forEach((shelter) => {
      if (!shelter.latitude || !shelter.longitude) return;

      const el = document.createElement('div');
      el.className = `w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform ${
        shelter.status === 'open' ? 'bg-emerald-600' : shelter.status === 'full' ? 'bg-amber-600' : 'bg-slate-600'
      }`;
      el.innerHTML = '🏠';

      const marker = new maplibregl.Marker(el)
        .setLngLat([shelter.longitude, shelter.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: sans-serif; padding: 6px; min-width: 180px;">
              <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: ${
                shelter.status === 'open' ? '#059669' : '#d97706'
              };">${shelter.status} EVACUATION CENTER</span>
              <h4 style="margin: 2px 0 0 0; font-weight: bold; font-size: 13px;">${shelter.name}</h4>
              <p style="margin: 4px 0; font-size: 11px; color: #555;">Occupancy: <b>${shelter.current_occupancy} / ${shelter.max_capacity}</b></p>
              <p style="margin: 0; font-size: 10px; color: #777;">${shelter.address}</p>
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    // 2. Add Citizen Report Markers
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
        'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white cursor-pointer animate-pulse hover:scale-125 transition-transform';
      el.style.backgroundColor = colors[report.flood_depth_level] || '#ea3838';
      el.innerHTML = '💧';

      const marker = new maplibregl.Marker(el)
        .setLngLat([report.longitude, report.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: sans-serif; padding: 6px; min-width: 190px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 10px; font-weight: bold; color: #b91c1c; text-transform: uppercase;">CITIZEN FLOOD REPORT</span>
                <span style="font-size: 9px; color: #777;">${new Date(report.created_at).toLocaleTimeString()}</span>
              </div>
              <h4 style="margin: 4px 0 2px 0; font-weight: bold; font-size: 13px;">Depth: ${report.flood_depth_level?.toUpperCase()}</h4>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #333;">${report.description || 'No additional field notes.'}</p>
              ${report.photo_url ? `<a href="${report.photo_url}" target="_blank" style="display: block; font-size: 10px; color: #2563eb; font-weight: bold; text-decoration: underline;">View Attached Verification Photo</a>` : ''}
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [mapLoaded, reports, shelters]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-surface-border ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Toggleable UP NOAH Layer Controls Overlay */}
      {showHazardControls && (
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-xs text-white shadow-xl space-y-2 z-10">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-300 pb-1 border-b border-slate-800">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            UP NOAH Hazard Overlays
          </div>

          <label className="flex items-center justify-between gap-4 cursor-pointer hover:text-white text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-600 border border-rose-400" />
              100-Year Severe Hazard
            </span>
            <input
              type="checkbox"
              checked={show100Year}
              onChange={(e) => setShow100Year(e.target.checked)}
              className="rounded-xs bg-slate-800 text-blue-600 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer hover:text-white text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-600 border border-amber-400" />
              25-Year High Risk
            </span>
            <input
              type="checkbox"
              checked={show25Year}
              onChange={(e) => setShow25Year(e.target.checked)}
              className="rounded-xs bg-slate-800 text-blue-600 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer hover:text-white text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-yellow-500 border border-yellow-300" />
              5-Year Advisory Zone
            </span>
            <input
              type="checkbox"
              checked={show5Year}
              onChange={(e) => setShow5Year(e.target.checked)}
              className="rounded-xs bg-slate-800 text-blue-600 focus:ring-0"
            />
          </label>
        </div>
      )}
    </div>
  );
}
