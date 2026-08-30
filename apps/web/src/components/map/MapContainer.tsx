'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Layers,
  Maximize2,
  Minimize2,
  Compass,
  MapPin,
  Mountain,
  Satellite,
  Sun,
  Eye,
  ShieldAlert,
} from 'lucide-react';

interface MapContainerProps {
  reports?: any[];
  shelters?: any[];
  roads?: any[];
  className?: string;
  showHazardControls?: boolean;
}

type MapTileStyle = 'vector' | 'satellite' | 'terrain';

const TILE_STYLES: Record<MapTileStyle, { name: string; styleUrl: string }> = {
  vector: {
    name: 'Light Vector',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
  },
  satellite: {
    name: 'Satellite Hybrid',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
  },
  terrain: {
    name: 'Topographic Terrain',
    styleUrl: 'https://tiles.openfreemap.org/styles/bright',
  },
};

// Strict Cebu City Bounding Box (Southwest to Northeast)
const CEBU_CITY_RESTRICTED_BOUNDS: [[number, number], [number, number]] = [
  [123.70, 10.22], // Southwest boundary
  [124.00, 10.52], // Northeast boundary
];

export function MapContainer({
  reports = [],
  shelters = [],
  roads = [],
  className = 'h-[500px] w-full',
  showHazardControls = true,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const targetMarkerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [show100Year, setShow100Year] = useState(true);
  const [show25Year, setShow25Year] = useState(true);
  const [show5Year, setShow5Year] = useState(true);
  const [showBarangays, setShowBarangays] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<MapTileStyle>('vector');
  const [is3DMode, setIs3DMode] = useState(false);

  // Initialize MapLibre strictly restricted to Cebu City
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: TILE_STYLES[currentStyle].styleUrl,
      center: [123.8950, 10.3160], // Downtown / Cebu City Urban Basin
      zoom: 13.5,
      minZoom: 11.5, // Restrict zooming out to neighboring islands/sea
      maxZoom: 18.5,
      maxBounds: CEBU_CITY_RESTRICTED_BOUNDS, // Confine camera strictly to Cebu City
      pitch: is3DMode ? 45 : 15,
      bearing: 0,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    const setupLayers = () => {
      // 1. Cebu City Official Outer Boundary
      if (!map.getSource('cebu-city-boundary')) {
        map.addSource('cebu-city-boundary', {
          type: 'geojson',
          data: '/data/cebu_city_boundary.geojson',
        });

        map.addLayer({
          id: 'cebu-city-border-glow',
          type: 'line',
          source: 'cebu-city-boundary',
          paint: {
            'line-color': '#007AFF',
            'line-width': 4,
            'line-opacity': 0.85,
          },
        });

        map.addLayer({
          id: 'cebu-city-fill',
          type: 'fill',
          source: 'cebu-city-boundary',
          paint: {
            'fill-color': '#007AFF',
            'fill-opacity': 0.03,
          },
        });
      }

      // 2. All 80 Cebu City Barangay Boundaries
      if (!map.getSource('cebu-city-barangays')) {
        map.addSource('cebu-city-barangays', {
          type: 'geojson',
          data: '/data/cebu_city_barangays.geojson',
        });

        map.addLayer({
          id: 'cebu-barangay-fills',
          type: 'fill',
          source: 'cebu-city-barangays',
          paint: {
            'fill-color': '#5856D6',
            'fill-opacity': 0.03,
          },
        });

        map.addLayer({
          id: 'cebu-barangay-lines',
          type: 'line',
          source: 'cebu-city-barangays',
          paint: {
            'line-color': '#8E8E93',
            'line-width': 1,
            'line-dasharray': [3, 2],
            'line-opacity': 0.6,
          },
        });

        // Hover & Click interaction for Barangays
        map.on('click', 'cebu-barangay-fills', (e: any) => {
          if (!e.features || e.features.length === 0) return;
          const feat = e.features[0];
          const props = feat.properties || {};
          const bgyName = props.adm4_name || props.adm4_en || 'Barangay';

          if (popupRef.current) popupRef.current.remove();
          popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'cebu-map-popup' })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: sans-serif; padding: 4px;">
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #007AFF;">Cebu City Barangay</div>
                <div style="font-size: 14px; font-weight: 900; color: #1C1C1E; margin-top: 2px;">Brgy. ${bgyName}</div>
                <div style="font-size: 11px; color: #6C6C70; margin-top: 4px;">Jurisdiction: CDRRMO District</div>
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseenter', 'cebu-barangay-fills', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'cebu-barangay-fills', () => {
          map.getCanvas().style.cursor = '';
        });
      }

      // 3. NOAH Flood Hazard Zones (5-Year, 25-Year, 100-Year)
      if (!map.getSource('cebu-flood-5yr')) {
        map.addSource('cebu-flood-5yr', {
          type: 'geojson',
          data: '/data/cebu_flood_5yr.geojson',
        });
        map.addLayer({
          id: 'hazard-5yr-fill',
          type: 'fill',
          source: 'cebu-flood-5yr',
          paint: { 'fill-color': '#FFCC00', 'fill-opacity': 0.35 },
        });
        map.addLayer({
          id: 'hazard-5yr-line',
          type: 'line',
          source: 'cebu-flood-5yr',
          paint: { 'line-color': '#FFCC00', 'line-width': 1.5, 'line-opacity': 0.7 },
        });
      }

      if (!map.getSource('cebu-flood-25yr')) {
        map.addSource('cebu-flood-25yr', {
          type: 'geojson',
          data: '/data/cebu_flood_25yr.geojson',
        });
        map.addLayer({
          id: 'hazard-25yr-fill',
          type: 'fill',
          source: 'cebu-flood-25yr',
          paint: { 'fill-color': '#FF9500', 'fill-opacity': 0.4 },
        });
        map.addLayer({
          id: 'hazard-25yr-line',
          type: 'line',
          source: 'cebu-flood-25yr',
          paint: { 'line-color': '#FF9500', 'line-width': 1.5, 'line-opacity': 0.8 },
        });
      }

      if (!map.getSource('cebu-flood-100yr')) {
        map.addSource('cebu-flood-100yr', {
          type: 'geojson',
          data: '/data/cebu_flood_100yr.geojson',
        });
        map.addLayer({
          id: 'hazard-100yr-fill',
          type: 'fill',
          source: 'cebu-flood-100yr',
          paint: { 'fill-color': '#FF3B30', 'fill-opacity': 0.45 },
        });
        map.addLayer({
          id: 'hazard-100yr-line',
          type: 'line',
          source: 'cebu-flood-100yr',
          paint: { 'line-color': '#FF3B30', 'line-width': 2, 'line-opacity': 0.9 },
        });
      }

      setMapLoaded(true);
    };

    map.on('load', setupLayers);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync Flood Hazard Layer Visibility Toggles
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (map.getLayer('hazard-5yr-fill')) {
      map.setLayoutProperty('hazard-5yr-fill', 'visibility', show5Year ? 'visible' : 'none');
    }
    if (map.getLayer('hazard-25yr-fill')) {
      map.setLayoutProperty('hazard-25yr-fill', 'visibility', show25Year ? 'visible' : 'none');
    }
    if (map.getLayer('hazard-100yr-fill')) {
      map.setLayoutProperty('hazard-100yr-fill', 'visibility', show100Year ? 'visible' : 'none');
    }
    if (map.getLayer('cebu-barangay-lines')) {
      map.setLayoutProperty('cebu-barangay-lines', 'visibility', showBarangays ? 'visible' : 'none');
      map.setLayoutProperty('cebu-barangay-fills', 'visibility', showBarangays ? 'visible' : 'none');
    }
  }, [mapLoaded, show5Year, show25Year, show100Year, showBarangays]);

  // Sync Markers for Live Incident Reports & Shelters
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add Incident Report Markers
    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return;

      const el = document.createElement('div');
      el.className = 'cursor-pointer group';
      const color =
        report.flood_depth_level === 'waist' || report.flood_depth_level === 'chest' || report.flood_depth_level === 'above_head'
          ? '#FF3B30'
          : '#FF9500';

      el.innerHTML = `
        <div style="width: 28px; height: 28px; border-radius: 50%; background: ${color}; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; items-center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">
          !
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 4px; font-family: sans-serif;">
              <div style="font-size: 10px; font-weight: 800; color: ${color}; text-transform: uppercase;">
                ${report.flood_depth_level?.toUpperCase()} DEPTH
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #1C1C1E; margin-top: 2px;">
                Brgy. ${report.barangay_name || 'Cebu City'}
              </div>
              <p style="font-size: 11px; color: #3A3A3C; margin-top: 4px; line-height: 1.3;">
                ${report.description || 'Field incident report submitted.'}
              </p>
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Add Shelters Markers
    shelters.forEach((shelter) => {
      if (!shelter.latitude || !shelter.longitude) return;

      const el = document.createElement('div');
      el.className = 'cursor-pointer';
      el.innerHTML = `
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #34C759; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; items-center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">
          H
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([shelter.longitude, shelter.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 4px; font-family: sans-serif;">
              <div style="font-size: 10px; font-weight: 800; color: #34C759; text-transform: uppercase;">
                ${shelter.status?.toUpperCase()} EVACUATION CENTER
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #1C1C1E; margin-top: 2px;">
                ${shelter.name}
              </div>
              <div style="font-size: 11px; color: #6C6C70; margin-top: 4px;">
                Occupancy: ${shelter.current_occupancy || 0} / ${shelter.max_capacity || 0}
              </div>
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [reports, shelters, mapLoaded]);

  // Listen to Global FlyTo Events (from Search or Incident Triage)
  useEffect(() => {
    const handleFlyTo = (e: any) => {
      if (!mapRef.current || !e.detail) return;
      const { latitude, longitude, name } = e.detail;

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 16.5,
        pitch: 35,
        essential: true,
        duration: 1800,
      });

      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
      }

      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.innerHTML = `
        <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#007AFF] opacity-75"></span>
        <div class="w-8 h-8 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-xs font-black shadow-xl border-2 border-white">
          ★
        </div>
      `;

      targetMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);
    };

    window.addEventListener('map:flyto', handleFlyTo);
    return () => window.removeEventListener('map:flyto', handleFlyTo);
  }, []);

  const toggle3DMode = () => {
    if (!mapRef.current) return;
    const nextMode = !is3DMode;
    setIs3DMode(nextMode);
    mapRef.current.easeTo({
      pitch: nextMode ? 55 : 0,
      bearing: nextMode ? -20 : 0,
      duration: 1000,
    });
  };

  const handleResetToCebuCenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [123.8854, 10.3157],
      zoom: 13,
      pitch: 0,
      bearing: 0,
      duration: 1200,
    });
  };

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${className}`}>
      {/* MapLibre DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls Overlay */}
      <div className="absolute top-4 right-14 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* 3D Isometric Tilt Toggle */}
        <button
          onClick={toggle3DMode}
          title="Toggle 3D Terrain View"
          className={`p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all cursor-pointer ${
            is3DMode
              ? 'bg-[#007AFF] border-[#007AFF] text-white'
              : 'bg-white/90 border-[#E5E5EA] text-[#1C1C1E] hover:bg-white'
          }`}
        >
          <Mountain className="w-4 h-4" />
        </button>

        {/* Center on Cebu City */}
        <button
          onClick={handleResetToCebuCenter}
          title="Recenter strictly on Cebu City"
          className="p-2.5 rounded-2xl bg-white/90 border border-[#E5E5EA] hover:bg-white text-[#1C1C1E] shadow-lg backdrop-blur-md transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4 text-[#007AFF]" />
        </button>
      </div>

      {/* NOAH Hazard Return-Period Layer Switcher */}
      {showHazardControls && (
        <div className="absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-2xl border border-[#E5E5EA] rounded-3xl p-3.5 shadow-xl space-y-2.5 text-xs pointer-events-auto min-w-[220px]">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-[#1C1C1E] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
              Cebu City NOAH Layers
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-bold">
            <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
              <span className="flex items-center gap-2 text-[#FF3B30]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" />
                100-Yr Severe Flood
              </span>
              <input
                type="checkbox"
                checked={show100Year}
                onChange={(e) => setShow100Year(e.target.checked)}
                className="rounded text-[#FF3B30] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
              <span className="flex items-center gap-2 text-[#FF9500]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
                25-Yr High Risk
              </span>
              <input
                type="checkbox"
                checked={show25Year}
                onChange={(e) => setShow25Year(e.target.checked)}
                className="rounded text-[#FF9500] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
              <span className="flex items-center gap-2 text-[#FFCC00]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFCC00]" />
                5-Yr Moderate Hazard
              </span>
              <input
                type="checkbox"
                checked={show5Year}
                onChange={(e) => setShow5Year(e.target.checked)}
                className="rounded text-[#FFCC00] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer select-none border-t border-[#F2F2F7] pt-1.5">
              <span className="flex items-center gap-2 text-[#5856D6]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5856D6]" />
                80 Barangay Outlines
              </span>
              <input
                type="checkbox"
                checked={showBarangays}
                onChange={(e) => setShowBarangays(e.target.checked)}
                className="rounded text-[#5856D6] focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
