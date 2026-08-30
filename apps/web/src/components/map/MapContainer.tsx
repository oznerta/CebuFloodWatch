'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Layers,
  Compass,
  Mountain,
  Satellite,
  Map as MapIcon,
  Plus,
  Minus,
} from 'lucide-react';

interface MapContainerProps {
  reports?: any[];
  shelters?: any[];
  roads?: any[];
  className?: string;
  showHazardControls?: boolean;
}

type MapTileStyle = 'hybrid' | 'streets' | 'terrain';
type FloodScenario = '5yr' | '25yr' | '100yr' | 'none';

// Reliable High-Resolution Google Maps Tile Engine (Full Natural Earth Coverage)
const ROOT_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'google-hybrid-src': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
    'google-streets-src': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
    'google-terrain-src': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'base-layer-hybrid',
      type: 'raster',
      source: 'google-hybrid-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'visible' },
    },
    {
      id: 'base-layer-streets',
      type: 'raster',
      source: 'google-streets-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'none' },
    },
    {
      id: 'base-layer-terrain',
      type: 'raster',
      source: 'google-terrain-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'none' },
    },
  ],
};

const TILE_STYLES_INFO: Record<MapTileStyle, { name: string; icon: any; desc: string }> = {
  hybrid: { name: 'Google Satellite', icon: Satellite, desc: 'High-Res Aerial + Street Labels' },
  streets: { name: 'Google Streets', icon: MapIcon, desc: 'Detailed Clean Urban Map' },
  terrain: { name: 'Google Terrain', icon: Mountain, desc: 'Topographic Relief & Elevation' },
};

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
  const [currentStyle, setCurrentStyle] = useState<MapTileStyle>('hybrid');
  const [is3DMode, setIs3DMode] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Setup vector and flood layers on load
  const setupLayers = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // 1. Cebu City Official Perimeter Laser Glow (Clean Blue Outline)
    if (!map.getSource('cebu-city-boundary')) {
      map.addSource('cebu-city-boundary', {
        type: 'geojson',
        data: '/data/cebu_city_boundary.geojson',
      });

      // Outer glow
      map.addLayer({
        id: 'cebu-city-border-glow',
        type: 'line',
        source: 'cebu-city-boundary',
        paint: {
          'line-color': '#00E5FF',
          'line-width': 5,
          'line-opacity': 0.45,
          'line-blur': 2,
        },
      });

      // Sharp core border
      map.addLayer({
        id: 'cebu-city-border-core',
        type: 'line',
        source: 'cebu-city-boundary',
        paint: {
          'line-color': '#007AFF',
          'line-width': 2.5,
          'line-opacity': 0.95,
        },
      });
    }

    // 2. All 80 Cebu City Barangay Administrative Lines (Translucent, No Opaque Fills)
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
          'fill-color': '#007AFF',
          'fill-opacity': 0.01, // Invisible click surface
        },
      });

      map.addLayer({
        id: 'cebu-barangay-lines',
        type: 'line',
        source: 'cebu-city-barangays',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 1.0,
          'line-dasharray': [4, 2],
          'line-opacity': 0.75,
        },
      });

      // Click on barangay to view details
      map.on('click', 'cebu-barangay-fills', (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const props = feat.properties || {};
        const bgyName = props.adm4_name || props.adm4_en || 'Barangay';

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'cebu-clean-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px; min-width: 150px;">
              <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #007AFF; letter-spacing: 0.5px;">Cebu City Barangay</div>
              <div style="font-size: 15px; font-weight: 900; color: #1C1C1E; margin-top: 2px;">Brgy. ${bgyName}</div>
              <div style="font-size: 11px; color: #8E8E93; margin-top: 4px;">CDRRMO Disaster Sector</div>
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

    // 3. UP NOAH Flood Inundation Channels (Luminous, Translucent over Aerial Imagery)
    // 5-Year (Low Risk Inundation: Cyan Glow)
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
          'fill-color': '#00E5FF',
          'fill-opacity': 0.35,
        },
      });
      map.addLayer({
        id: 'hazard-5yr-line',
        type: 'line',
        source: 'cebu-flood-5yr',
        paint: {
          'line-color': '#00E5FF',
          'line-width': 1.0,
          'line-opacity': 0.8,
        },
      });
    }

    // 25-Year (Medium Risk Inundation: Warning Amber)
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
          'fill-color': '#FF9500',
          'fill-opacity': 0.40,
        },
      });
      map.addLayer({
        id: 'hazard-25yr-line',
        type: 'line',
        source: 'cebu-flood-25yr',
        paint: {
          'line-color': '#FFB340',
          'line-width': 1.2,
          'line-opacity': 0.85,
        },
      });
    }

    // 100-Year (Extreme Inundation: Crimson Torrent)
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
          'fill-color': '#FF3B30',
          'fill-opacity': 0.48,
        },
      });
      map.addLayer({
        id: 'hazard-100yr-line',
        type: 'line',
        source: 'cebu-flood-100yr',
        paint: {
          'line-color': '#FF6961',
          'line-width': 1.5,
          'line-opacity': 0.95,
        },
      });
    }

    // Click on flood hazard polygons
    const floodLayers = ['hazard-5yr-fill', 'hazard-25yr-fill', 'hazard-100yr-fill'];
    floodLayers.forEach((layerId) => {
      map.on('click', layerId, (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties || {};
        const hazardName = props.hazard_name || 'Flood Drainage Channel';
        const returnPeriod = props.return_period || 'UP NOAH Simulation';
        const depth = props.depth_range || 'Inundation Zone';

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'cebu-clean-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px; min-width: 170px;">
              <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #FF3B30; letter-spacing: 0.5px;">UP NOAH Hydro Model</div>
              <div style="font-size: 14px; font-weight: 900; color: #1C1C1E; margin-top: 2px;">${hazardName}</div>
              <div style="margin-top: 6px; font-size: 11px; font-weight: 800; color: #1C1C1E; background: #F2F2F7; padding: 4px 8px; border-radius: 8px;">
                Depth: <span style="color: #FF3B30;">${depth}</span> &bull; ${returnPeriod}
              </div>
            </div>
          `)
          .addTo(map);
      });
    });

    setMapLoaded(true);
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: ROOT_MAP_STYLE,
      center: [123.8950, 10.3160], // Downtown Cebu City
      zoom: 13.5,
      minZoom: 10.0,
      maxZoom: 20.5,
      pitch: is3DMode ? 45 : 0,
      bearing: 0,
      attributionControl: false,
    });

    map.on('load', setupLayers);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Instant zero-latency basemap switching
  const handleSwitchStyle = (styleKey: MapTileStyle) => {
    setCurrentStyle(styleKey);
    setShowStyleMenu(false);
    if (!mapRef.current) return;
    const map = mapRef.current;

    map.setLayoutProperty('base-layer-hybrid', 'visibility', styleKey === 'hybrid' ? 'visible' : 'none');
    map.setLayoutProperty('base-layer-streets', 'visibility', styleKey === 'streets' ? 'visible' : 'none');
    map.setLayoutProperty('base-layer-terrain', 'visibility', styleKey === 'terrain' ? 'visible' : 'none');
  };

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
  }, [selectedScenario, mapLoaded]);

  // Sync Boundary Toggles
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (map.getLayer('cebu-city-border-glow')) {
      map.setLayoutProperty('cebu-city-border-glow', 'visibility', showBoundary ? 'visible' : 'none');
    }
    if (map.getLayer('cebu-city-border-core')) {
      map.setLayoutProperty('cebu-city-border-core', 'visibility', showBoundary ? 'visible' : 'none');
    }
    if (map.getLayer('cebu-barangay-fills')) {
      map.setLayoutProperty('cebu-barangay-fills', 'visibility', showBarangays ? 'visible' : 'none');
    }
    if (map.getLayer('cebu-barangay-lines')) {
      map.setLayoutProperty('cebu-barangay-lines', 'visibility', showBarangays ? 'visible' : 'none');
    }
  }, [showBoundary, showBarangays, mapLoaded]);

  // Render Real Markers: Reports & Shelters
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Render Evacuation Shelters
    shelters.forEach((shelter) => {
      if (!shelter.latitude || !shelter.longitude) return;

      const el = document.createElement('div');
      el.className = 'cursor-pointer group';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-[#34C759] opacity-60"></span>
          <div class="w-8 h-8 rounded-2xl bg-[#34C759] border-2 border-white shadow-xl flex items-center justify-center text-white transform hover:scale-125 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([shelter.longitude, shelter.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: 'cebu-clean-popup' }).setHTML(`
            <div style="padding: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-size: 10px; font-weight: 900; color: #34C759; text-transform: uppercase; letter-spacing: 0.5px;">Evacuation Center</div>
              <div style="font-weight: 900; font-size: 14px; color: #1C1C1E; margin-top: 2px;">${shelter.name}</div>
              <div style="font-size: 11px; color: #8E8E93; margin-top: 2px;">Brgy. ${shelter.barangay_name || 'Unassigned Area'}</div>
              <div style="margin-top: 6px; font-size: 11px; font-weight: 800; color: #1C1C1E; background: #E8F5E9; padding: 4px 8px; border-radius: 8px;">
                Occupancy: <span style="color: #2E7D32;">${shelter.current_occupancy || 0}</span> / ${shelter.max_capacity || 100}
              </div>
            </div>
          `)
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Render Incident Reports
    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return;

      const isSevere = report.flood_depth_level === 'waist' || report.flood_depth_level === 'chest' || report.flood_depth_level === 'above_head';
      const color = isSevere ? '#FF3B30' : '#FF9500';

      const el = document.createElement('div');
      el.className = 'cursor-pointer group';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-75" style="background-color: ${color}"></span>
          <div class="w-8 h-8 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center text-white transform hover:scale-125 transition-transform" style="background-color: ${color}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: 'cebu-clean-popup' }).setHTML(`
            <div style="padding: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-size: 10px; font-weight: 900; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">Live Flood Report</div>
              <div style="font-weight: 900; font-size: 14px; color: #1C1C1E; margin-top: 2px;">Brgy. ${report.barangay_name || 'Unassigned Area'}</div>
              <div style="font-size: 11px; color: #3A3A3C; margin-top: 4px;">${report.description || 'Reported flood stage'}</div>
              <div style="margin-top: 6px; font-size: 10px; font-weight: 900; color: ${color}; background: #FFEBEE; padding: 4px 8px; border-radius: 8px;">
                Depth: ${report.flood_depth_level?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
          `)
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [reports, shelters, mapLoaded]);

  // Handle Fly-To Custom Events
  useEffect(() => {
    const handleFlyTo = (event: any) => {
      if (!mapRef.current) return;
      const { latitude, longitude } = event.detail || {};
      if (!latitude || !longitude) return;

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 17.5,
        pitch: 45,
        duration: 1500,
      });

      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
      }

      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.innerHTML = `
        <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-[#007AFF] opacity-75"></span>
        <div class="w-9 h-9 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-xs font-black shadow-2xl border-2 border-white">
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
      zoom: 13.5,
      pitch: 0,
      bearing: 0,
      duration: 1200,
    });
  };

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${className}`}>
      {/* MapLibre DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Unified Map Command Capsule (Bottom-Right, Zero Overlap) */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 pointer-events-auto">
        {/* Style Switcher Menu Popup */}
        {showStyleMenu && (
          <div className="absolute bottom-12 right-0 bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-2xl p-2.5 shadow-2xl space-y-1.5 min-w-[200px] animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-black uppercase text-gray-400 px-2 py-0.5 tracking-wider">
              Google Basemap Engine
            </div>
            {(Object.keys(TILE_STYLES_INFO) as MapTileStyle[]).map((key) => {
              const item = TILE_STYLES_INFO[key];
              const Icon = item.icon;
              const isSelected = currentStyle === key;

              return (
                <button
                  key={key}
                  onClick={() => handleSwitchStyle(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected ? 'bg-blue-50 text-blue-700 font-black' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-normal">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center bg-white/95 backdrop-blur-2xl border border-gray-200/90 rounded-2xl shadow-xl p-1 gap-1">
          {/* Style Switcher Toggle */}
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            title="Switch Map Imagery (Google Satellite, Google Streets, Google Terrain)"
            className={`px-3 h-8 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
              showStyleMenu ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-800'
            }`}
          >
            <Satellite className="w-3.5 h-3.5 text-blue-500" />
            <span className="capitalize">{TILE_STYLES_INFO[currentStyle].name}</span>
          </button>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {/* Zoom In */}
          <button
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom In"
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom Out"
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-all cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {/* 3D Isometric View */}
          <button
            onClick={toggle3DMode}
            title={is3DMode ? 'Switch to 2D Top-Down View' : 'Switch to 3D Terrain Angle'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              is3DMode
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Mountain className="w-4 h-4" />
          </button>

          {/* Recenter Cebu City */}
          <button
            onClick={handleResetToCebuCenter}
            title="Recenter strictly on Cebu City Urban Plain"
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-blue-600 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NOAH Hazard Return-Period Layer Switcher (Compact Expandable Pill) */}
      {showHazardControls && (
        <div className="absolute bottom-6 left-6 z-10 pointer-events-auto">
          {!showLayersMenu ? (
            <button
              onClick={() => setShowLayersMenu(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-2xl border border-gray-200 hover:border-gray-300 text-gray-800 text-xs font-black shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Map Layers &amp; Scenarios</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  selectedScenario === '100yr'
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : selectedScenario === '25yr'
                    ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                    : selectedScenario === '5yr'
                    ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'bg-gray-400'
                }`}
              />
            </button>
          ) : (
            <div className="bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-4 shadow-2xl space-y-3 text-xs min-w-[290px] animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-black text-[11px] uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  UP NOAH Scenarios
                </span>
                <button
                  onClick={() => setShowLayersMenu(false)}
                  className="w-5 h-5 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Scenario Selector Pills */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setSelectedScenario('5yr')}
                  className={`py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedScenario === '5yr'
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-200" />
                  5-Year (Low)
                </button>

                <button
                  onClick={() => setSelectedScenario('25yr')}
                  className={`py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedScenario === '25yr'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-200" />
                  25-Yr (Medium)
                </button>

                <button
                  onClick={() => setSelectedScenario('100yr')}
                  className={`py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedScenario === '100yr'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-200" />
                  100-Yr (Severe)
                </button>

                <button
                  onClick={() => setSelectedScenario('none')}
                  className={`py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedScenario === 'none'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Hide Flood
                </button>
              </div>

              {/* Inundation Depth Gradient Legend */}
              {selectedScenario !== 'none' && (
                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-gray-400">Inundation Depth Legend</div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-700">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-xs" /> 0.1m - 0.5m
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" /> 0.5m - 1.5m
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" /> &gt;1.5m
                    </span>
                  </div>
                </div>
              )}

              {/* Boundary Toggles */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] font-bold text-gray-700">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="flex items-center gap-1.5 text-indigo-600">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" /> 80 Barangay Outlines
                  </span>
                  <input
                    type="checkbox"
                    checked={showBarangays}
                    onChange={(e) => setShowBarangays(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2 h-2 rounded-full bg-blue-600" /> City Perimeter Glow
                  </span>
                  <input
                    type="checkbox"
                    checked={showBoundary}
                    onChange={(e) => setShowBoundary(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
