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
  Info,
} from 'lucide-react';

interface MapContainerProps {
  reports?: any[];
  shelters?: any[];
  roads?: any[];
  className?: string;
  showHazardControls?: boolean;
}

type MapTileStyle = 'vector' | 'satellite' | 'terrain';
type FloodScenario = '5yr' | '25yr' | '100yr' | 'none';

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
  const [selectedScenario, setSelectedScenario] = useState<FloodScenario>('25yr');
  const [showBarangays, setShowBarangays] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showMask, setShowMask] = useState(true);
  const [currentStyle, setCurrentStyle] = useState<MapTileStyle>('vector');
  const [is3DMode, setIs3DMode] = useState(false);

  // Initialize MapLibre strictly restricted to Cebu City
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: TILE_STYLES[currentStyle].styleUrl,
      center: [123.8950, 10.3160], // Downtown / Cebu City Urban Basin
      zoom: 13.2,
      minZoom: 11.5, // Restrict zooming out to neighboring islands/sea
      maxZoom: 18.5,
      maxBounds: CEBU_CITY_RESTRICTED_BOUNDS, // Confine camera strictly to Cebu City
      pitch: is3DMode ? 45 : 15,
      bearing: 0,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    const setupLayers = () => {
      // 0. Inverse Mask (Hides everything outside Cebu City perimeter)
      if (!map.getSource('cebu-city-mask')) {
        map.addSource('cebu-city-mask', {
          type: 'geojson',
          data: '/data/cebu_city_mask.geojson',
        });

        map.addLayer({
          id: 'cebu-outside-mask',
          type: 'fill',
          source: 'cebu-city-mask',
          paint: {
            'fill-color': '#E5E5EA',
            'fill-opacity': 0.94,
          },
        });
      }

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
            'line-width': 3.5,
            'line-opacity': 0.9,
          },
        });

        map.addLayer({
          id: 'cebu-city-fill',
          type: 'fill',
          source: 'cebu-city-boundary',
          paint: {
            'fill-color': '#007AFF',
            'fill-opacity': 0.02,
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
            'line-opacity': 0.5,
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
          paint: {
            'fill-color': ['coalesce', ['get', 'color'], '#FFCC00'],
            'fill-opacity': 0.45,
          },
        });
        map.addLayer({
          id: 'hazard-5yr-line',
          type: 'line',
          source: 'cebu-flood-5yr',
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#FFCC00'],
            'line-width': 1.2,
            'line-opacity': 0.7,
          },
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
          paint: {
            'fill-color': ['coalesce', ['get', 'color'], '#FF9500'],
            'fill-opacity': 0.48,
          },
        });
        map.addLayer({
          id: 'hazard-25yr-line',
          type: 'line',
          source: 'cebu-flood-25yr',
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#FF9500'],
            'line-width': 1.2,
            'line-opacity': 0.75,
          },
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
          paint: {
            'fill-color': ['coalesce', ['get', 'color'], '#FF3B30'],
            'fill-opacity': 0.52,
          },
        });
        map.addLayer({
          id: 'hazard-100yr-line',
          type: 'line',
          source: 'cebu-flood-100yr',
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#FF3B30'],
            'line-width': 1.5,
            'line-opacity': 0.85,
          },
        });
      }

      // Click interaction for Flood Hazard Polygons
      const floodLayers = ['hazard-5yr-fill', 'hazard-25yr-fill', 'hazard-100yr-fill'];
      floodLayers.forEach((layerId) => {
        map.on('click', layerId, (e: any) => {
          if (!e.features || e.features.length === 0) return;
          const props = e.features[0].properties || {};
          const hazardName = props.hazard_name || 'Flood Hazard Channel';
          const returnPeriod = props.return_period || 'UP NOAH Simulation';
          const depth = props.depth_range || 'Inundation Zone';

          if (popupRef.current) popupRef.current.remove();
          popupRef.current = new maplibregl.Popup({ closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: sans-serif; padding: 4px;">
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #FF3B30;">UP NOAH River Model</div>
                <div style="font-size: 13px; font-weight: 900; color: #1C1C1E; margin-top: 2px;">${hazardName}</div>
                <div style="font-size: 11px; color: #6C6C70; margin-top: 2px;">Water Depth: ${depth} &bull; ${returnPeriod}</div>
              </div>
            `)
            .addTo(map);
        });
      });

      setMapLoaded(true);
    };

    map.on('load', setupLayers);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync Scenario Visibility
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const setVisibility = (layers: string[], isVisible: boolean) => {
      layers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', isVisible ? 'visible' : 'none');
        }
      });
    };

    setVisibility(['hazard-5yr-fill', 'hazard-5yr-line'], selectedScenario === '5yr');
    setVisibility(['hazard-25yr-fill', 'hazard-25yr-line'], selectedScenario === '25yr');
    setVisibility(['hazard-100yr-fill', 'hazard-100yr-line'], selectedScenario === '100yr');

    setVisibility(['cebu-barangay-lines', 'cebu-barangay-fills'], showBarangays);
    setVisibility(['cebu-city-border-glow', 'cebu-city-fill'], showBoundary);
    setVisibility(['cebu-outside-mask'], showMask);
  }, [mapLoaded, selectedScenario, showBarangays, showBoundary, showMask]);

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
      center: [123.8950, 10.3160],
      zoom: 13.2,
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
        <div className="absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-2xl border border-[#E5E5EA] rounded-3xl p-4 shadow-xl space-y-3 text-xs pointer-events-auto min-w-[280px]">
          <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-[#1C1C1E] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
              UP NOAH Scenarios
            </span>
            <span className="text-[10px] font-bold text-[#8E8E93]">Return Period</span>
          </div>

          {/* Scenario Selector Pills */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setSelectedScenario('5yr')}
              className={`py-1.5 px-2.5 rounded-xl font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedScenario === '5yr'
                  ? 'bg-[#FFCC00] text-[#1C1C1E] shadow-xs'
                  : 'bg-[#F8F9FA] text-[#8E8E93] hover:bg-[#F2F2F7]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FFCC00]" />
              5-Year (Low)
            </button>

            <button
              onClick={() => setSelectedScenario('25yr')}
              className={`py-1.5 px-2.5 rounded-xl font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedScenario === '25yr'
                  ? 'bg-[#FF9500] text-white shadow-xs'
                  : 'bg-[#F8F9FA] text-[#8E8E93] hover:bg-[#F2F2F7]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FF9500]" />
              25-Yr (Medium)
            </button>

            <button
              onClick={() => setSelectedScenario('100yr')}
              className={`py-1.5 px-2.5 rounded-xl font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedScenario === '100yr'
                  ? 'bg-[#FF3B30] text-white shadow-xs'
                  : 'bg-[#F8F9FA] text-[#8E8E93] hover:bg-[#F2F2F7]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
              100-Yr (Severe)
            </button>

            <button
              onClick={() => setSelectedScenario('none')}
              className={`py-1.5 px-2.5 rounded-xl font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedScenario === 'none'
                  ? 'bg-[#1C1C1E] text-white shadow-xs'
                  : 'bg-[#F8F9FA] text-[#8E8E93] hover:bg-[#F2F2F7]'
              }`}
            >
              Hide Flood
            </button>
          </div>

          {/* Depth Scale Legend */}
          {selectedScenario !== 'none' && (
            <div className="pt-2 border-t border-[#F2F2F7] space-y-1">
              <div className="text-[10px] font-extrabold uppercase text-[#8E8E93]">Inundation Depth Legend</div>
              <div className="flex items-center justify-between text-[9px] font-bold text-[#6C6C70]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#FFCC00]" /> 0.1m - 0.5m (Low)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#FF9500]" /> 0.5m - 1.5m (Med)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#FF3B30]" /> &gt;1.5m (High)
                </span>
              </div>
            </div>
          )}

          {/* Boundary Toggles */}
          <div className="pt-2 border-t border-[#F2F2F7] space-y-1 text-[11px] font-bold text-[#6C6C70]">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-1.5 text-[#5856D6]">
                <span className="w-2 h-2 rounded-full bg-[#5856D6]" /> 80 Barangay Outlines
              </span>
              <input
                type="checkbox"
                checked={showBarangays}
                onChange={(e) => setShowBarangays(e.target.checked)}
                className="rounded text-[#5856D6] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-1.5 text-[#007AFF]">
                <span className="w-2 h-2 rounded-full bg-[#007AFF]" /> Cebu City Perimeter
              </span>
              <input
                type="checkbox"
                checked={showBoundary}
                onChange={(e) => setShowBoundary(e.target.checked)}
                className="rounded text-[#007AFF] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-1.5 text-[#1C1C1E]">
                <span className="w-2 h-2 rounded-full bg-[#8E8E93]" /> Hide Outside Areas
              </span>
              <input
                type="checkbox"
                checked={showMask}
                onChange={(e) => setShowMask(e.target.checked)}
                className="rounded text-[#1C1C1E] focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
