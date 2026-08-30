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
  Plus,
  Minus,
  Globe,
  Map as MapIcon,
} from 'lucide-react';

interface MapContainerProps {
  reports?: any[];
  shelters?: any[];
  roads?: any[];
  className?: string;
  showHazardControls?: boolean;
}

type MapTileStyle = 'satellite' | 'vector' | 'terrain';
type FloodScenario = '5yr' | '25yr' | '100yr' | 'none';

// Ultra High-Resolution Global Satellite Imagery with Google Maps Hybrid & Elevation
const TILE_STYLES: Record<MapTileStyle, { name: string; icon: any; style: any }> = {
  satellite: {
    name: 'Google Satellite Hybrid',
    icon: Satellite,
    style: {
      version: 8,
      sources: {
        'google-satellite': {
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
      },
      layers: [
        {
          id: 'google-satellite-base',
          type: 'raster',
          source: 'google-satellite',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    },
  },
  vector: {
    name: 'Clean Vector Streets',
    icon: MapIcon,
    style: 'https://tiles.openfreemap.org/styles/positron',
  },
  terrain: {
    name: 'Topographic Relief',
    icon: Mountain,
    style: {
      version: 8,
      sources: {
        'esri-topo': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: 'esri-topo-base',
          type: 'raster',
          source: 'esri-topo',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
};

// Strict Cebu City Bounding Box (Southwest to Northeast)
const CEBU_CITY_RESTRICTED_BOUNDS: [[number, number], [number, number]] = [
  [123.70, 10.20], // Southwest boundary
  [124.05, 10.55], // Northeast boundary
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
  const [currentStyle, setCurrentStyle] = useState<MapTileStyle>('satellite');
  const [is3DMode, setIs3DMode] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Setup layers callback for initial load & style reloads
  const setupLayers = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

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
          'fill-color': '#0F172A',
          'fill-opacity': 0.75,
        },
      });
    }

    // 1. Cebu City Official Outer Boundary Glow
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
          'line-color': '#38BDF8',
          'line-width': 3,
          'line-opacity': 0.9,
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
          'fill-color': '#818CF8',
          'fill-opacity': 0.05,
        },
      });

      map.addLayer({
        id: 'cebu-barangay-lines',
        type: 'line',
        source: 'cebu-city-barangays',
        paint: {
          'line-color': '#E2E8F0',
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
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#FFCC00'],
          'fill-opacity': 0.32,
        },
      });
      map.addLayer({
        id: 'hazard-5yr-line',
        type: 'line',
        source: 'cebu-flood-5yr',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#FFCC00'],
          'line-width': 0.8,
          'line-opacity': 0.5,
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
          'fill-opacity': 0.38,
        },
      });
      map.addLayer({
        id: 'hazard-25yr-line',
        type: 'line',
        source: 'cebu-flood-25yr',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#FF9500'],
          'line-width': 0.8,
          'line-opacity': 0.6,
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
          'fill-opacity': 0.42,
        },
      });
      map.addLayer({
        id: 'hazard-100yr-line',
        type: 'line',
        source: 'cebu-flood-100yr',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#FF3B30'],
          'line-width': 1.0,
          'line-opacity': 0.65,
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

  // Initialize MapLibre strictly restricted to Cebu City
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialStyle = TILE_STYLES[currentStyle].style;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [123.8950, 10.3160], // Downtown / Cebu City Urban Basin
      zoom: 13.5,
      minZoom: 11.0, // Restrict zooming out to neighboring islands/sea
      maxZoom: 20.0, // Allow zooming in close just like Google Maps
      maxBounds: CEBU_CITY_RESTRICTED_BOUNDS, // Confine camera strictly to Cebu City
      pitch: is3DMode ? 45 : 0,
      bearing: 0,
      attributionControl: false, // Clean map without cluttered default text
    });

    map.on('load', setupLayers);
    map.on('style.load', setupLayers);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Dynamic Base Style Switch
  const handleSwitchStyle = (styleKey: MapTileStyle) => {
    setCurrentStyle(styleKey);
    setShowStyleMenu(false);
    if (!mapRef.current) return;
    mapRef.current.setStyle(TILE_STYLES[styleKey].style);
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

    if (map.getLayer('cebu-outside-mask')) {
      map.setLayoutProperty('cebu-outside-mask', 'visibility', showMask ? 'visible' : 'none');
    }
    if (map.getLayer('cebu-city-border-glow')) {
      map.setLayoutProperty('cebu-city-border-glow', 'visibility', showBoundary ? 'visible' : 'none');
    }
    if (map.getLayer('cebu-barangay-fills')) {
      map.setLayoutProperty('cebu-barangay-fills', 'visibility', showBarangays ? 'visible' : 'none');
    }
    if (map.getLayer('cebu-barangay-lines')) {
      map.setLayoutProperty('cebu-barangay-lines', 'visibility', showBarangays ? 'visible' : 'none');
    }
  }, [showMask, showBoundary, showBarangays, mapLoaded]);

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
        <div class="w-8 h-8 rounded-2xl bg-[#34C759] border-2 border-white shadow-lg flex items-center justify-center text-white transform hover:scale-110 transition-transform">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([shelter.longitude, shelter.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 6px; font-family: sans-serif;">
              <div style="font-size: 10px; font-weight: 800; color: #34C759; text-transform: uppercase;">Evacuation Shelter</div>
              <div style="font-weight: 900; font-size: 13px; color: #1C1C1E; margin-top: 2px;">${shelter.name}</div>
              <div style="font-size: 11px; color: #6C6C70; margin-top: 2px;">Brgy. ${shelter.barangay_name || 'Cebu City'}</div>
              <div style="margin-top: 6px; font-size: 11px; font-weight: 700; color: #1C1C1E;">
                Occupancy: ${shelter.current_occupancy || 0} / ${shelter.max_capacity || 100}
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
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background-color: ${color}"></span>
          <div class="w-7 h-7 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center text-white transform hover:scale-110 transition-transform" style="background-color: ${color}">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 6px; font-family: sans-serif;">
              <div style="font-size: 10px; font-weight: 800; color: ${color}; text-transform: uppercase;">Citizen Flood Alert</div>
              <div style="font-weight: 900; font-size: 13px; color: #1C1C1E; margin-top: 2px;">Brgy. ${report.barangay_name || 'Cebu City'}</div>
              <div style="font-size: 11px; color: #3A3A3C; margin-top: 4px;">${report.description || 'Reported inundation level'}</div>
              <div style="margin-top: 6px; font-size: 10px; font-weight: 800; color: ${color};">
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
        zoom: 16.5,
        pitch: 45,
        duration: 1500,
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
          <div className="absolute bottom-12 right-0 bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-2xl p-2 shadow-2xl space-y-1 min-w-[170px] animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-black uppercase text-gray-400 px-2 py-1">Basemap Imagery</div>
            {(Object.keys(TILE_STYLES) as MapTileStyle[]).map((key) => {
              const item = TILE_STYLES[key];
              const Icon = item.icon;
              const isSelected = currentStyle === key;

              return (
                <button
                  key={key}
                  onClick={() => handleSwitchStyle(key)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected ? 'bg-blue-50 text-blue-700 font-black' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center bg-white/95 backdrop-blur-2xl border border-gray-200/90 rounded-2xl shadow-xl p-1 gap-1">
          {/* Style Switcher Toggle */}
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            title="Switch Map Imagery (Google Satellite, Vector Streets, Topo)"
            className={`px-2.5 h-8 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
              showStyleMenu ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-800'
            }`}
          >
            <Satellite className="w-3.5 h-3.5 text-blue-500" />
            <span className="capitalize">{currentStyle}</span>
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
              <span className={`w-2 h-2 rounded-full ${selectedScenario === '100yr' ? 'bg-rose-500' : selectedScenario === '25yr' ? 'bg-amber-500' : selectedScenario === '5yr' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
            </button>
          ) : (
            <div className="bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-4 shadow-2xl space-y-3 text-xs min-w-[280px] animate-in fade-in zoom-in-95">
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
                  className={`py-1.5 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedScenario === '5yr'
                      ? 'bg-yellow-400 text-gray-900 shadow-xs'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  5-Year (Low)
                </button>

                <button
                  onClick={() => setSelectedScenario('25yr')}
                  className={`py-1.5 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedScenario === '25yr'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                  25-Yr (Medium)
                </button>

                <button
                  onClick={() => setSelectedScenario('100yr')}
                  className={`py-1.5 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedScenario === '100yr'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                  100-Yr (Severe)
                </button>

                <button
                  onClick={() => setSelectedScenario('none')}
                  className={`py-1.5 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedScenario === 'none'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Hide Flood
                </button>
              </div>

              {/* Depth Scale Legend */}
              {selectedScenario !== 'none' && (
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <div className="text-[10px] font-black uppercase text-gray-400">Inundation Depth Legend</div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" /> 0.1m - 0.5m
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> 0.5m - 1.5m
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt;1.5m
                    </span>
                  </div>
                </div>
              )}

              {/* Boundary Toggles */}
              <div className="pt-2 border-t border-gray-100 space-y-1 text-[11px] font-bold text-gray-600">
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
                    <span className="w-2 h-2 rounded-full bg-blue-600" /> Cebu City Perimeter
                  </span>
                  <input
                    type="checkbox"
                    checked={showBoundary}
                    onChange={(e) => setShowBoundary(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="flex items-center gap-1.5 text-gray-800">
                    <span className="w-2 h-2 rounded-full bg-gray-500" /> Dim Outside Areas
                  </span>
                  <input
                    type="checkbox"
                    checked={showMask}
                    onChange={(e) => setShowMask(e.target.checked)}
                    className="rounded text-gray-900 focus:ring-0 cursor-pointer"
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
