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
  Moon,
  Sun,
  Waves,
  Eye,
  EyeOff,
  CloudRain,
  Radio,
  Zap,
} from 'lucide-react';

interface MapContainerProps {
  reports?: any[];
  shelters?: any[];
  roads?: any[];
  className?: string;
  showHazardControls?: boolean;
}

type MapTileStyle = 'satellite' | 'dark' | 'vector' | 'terrain';
type FloodScenario = '5yr' | '25yr' | '100yr' | 'none';

// Ultra-High-End Multi-Basemap Suite (Zero-latency raster layer switching)
const ROOT_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'google-satellite-src': {
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
    'dark-matter-src': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    'osm-streets-src': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    'esri-topo-src': {
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
      id: 'base-layer-satellite',
      type: 'raster',
      source: 'google-satellite-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'visible' },
    },
    {
      id: 'base-layer-dark',
      type: 'raster',
      source: 'dark-matter-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'none' },
    },
    {
      id: 'base-layer-vector',
      type: 'raster',
      source: 'osm-streets-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'none' },
    },
    {
      id: 'base-layer-terrain',
      type: 'raster',
      source: 'esri-topo-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'none' },
    },
  ],
};

const TILE_STYLES_INFO: Record<MapTileStyle, { name: string; icon: any; desc: string }> = {
  satellite: { name: 'Google Satellite', icon: Satellite, desc: 'High-Res Aerial + Street Labels' },
  dark: { name: 'Dark Command Cyber', icon: Moon, desc: 'High-Contrast Glow Mode' },
  vector: { name: 'Executive Clean', icon: MapIcon, desc: 'Voyager Street Map' },
  terrain: { name: 'Topo Relief', icon: Mountain, desc: 'Elevation & Contours' },
};

// Strict Cebu City Bounding Box (Southwest to Northeast)
const CEBU_CITY_RESTRICTED_BOUNDS: [[number, number], [number, number]] = [
  [123.68, 10.18], // Southwest boundary
  [124.08, 10.58], // Northeast boundary
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

  // Setup vector, mask, and flood layers once on map load
  const setupLayers = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // 0. Inverse Boundary Mask (Dims neighboring municipalities outside Cebu City)
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
          'fill-color': '#0B1120',
          'fill-opacity': 0.78,
        },
      });
    }

    // 1. Cebu City Official Perimeter Laser Beam Glow
    if (!map.getSource('cebu-city-boundary')) {
      map.addSource('cebu-city-boundary', {
        type: 'geojson',
        data: '/data/cebu_city_boundary.geojson',
      });

      // Outer glow pulse
      map.addLayer({
        id: 'cebu-city-border-outer',
        type: 'line',
        source: 'cebu-city-boundary',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 6,
          'line-opacity': 0.35,
          'line-blur': 3,
        },
      });

      // Core crisp neon boundary
      map.addLayer({
        id: 'cebu-city-border-core',
        type: 'line',
        source: 'cebu-city-boundary',
        paint: {
          'line-color': '#0284C7',
          'line-width': 2.5,
          'line-opacity': 0.95,
        },
      });
    }

    // 2. All 80 Cebu City Barangay Administrative Boundaries
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
          'fill-color': '#6366F1',
          'fill-opacity': 0.04,
        },
      });

      map.addLayer({
        id: 'cebu-barangay-lines',
        type: 'line',
        source: 'cebu-city-barangays',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 0.8,
          'line-dasharray': [4, 2],
          'line-opacity': 0.65,
        },
      });

      // Hover & Click interaction for Barangays
      map.on('click', 'cebu-barangay-fills', (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const props = feat.properties || {};
        const bgyName = props.adm4_name || props.adm4_en || 'Barangay';

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'cebu-premium-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px; min-width: 160px;">
              <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #0284C7; letter-spacing: 0.5px;">Cebu City Barangay</div>
              <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin-top: 2px;">Brgy. ${bgyName}</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></span>
                CDRRMO Emergency Sector
              </div>
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

    // 3. UP NOAH Hydrodynamic Inundation Channels (5-Year, 25-Year, 100-Year)
    // 5-Year (Low Risk Inundation: Translucent Cyan Glow)
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
          'fill-color': '#06B6D4',
          'fill-opacity': 0.38,
        },
      });
      map.addLayer({
        id: 'hazard-5yr-line',
        type: 'line',
        source: 'cebu-flood-5yr',
        paint: {
          'line-color': '#22D3EE',
          'line-width': 1.0,
          'line-opacity': 0.75,
        },
      });
    }

    // 25-Year (Medium Risk Inundation: Luminous Warning Amber)
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
          'fill-color': '#F59E0B',
          'fill-opacity': 0.44,
        },
      });
      map.addLayer({
        id: 'hazard-25yr-line',
        type: 'line',
        source: 'cebu-flood-25yr',
        paint: {
          'line-color': '#FBBF24',
          'line-width': 1.2,
          'line-opacity': 0.85,
        },
      });
    }

    // 100-Year (Extreme Severe Inundation: Deep Crimson Torrents)
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
          'fill-color': '#EF4444',
          'fill-opacity': 0.52,
        },
      });
      map.addLayer({
        id: 'hazard-100yr-line',
        type: 'line',
        source: 'cebu-flood-100yr',
        paint: {
          'line-color': '#F87171',
          'line-width': 1.5,
          'line-opacity': 0.95,
        },
      });
    }

    // Click interaction for Flood Hazard Polygons
    const floodLayers = ['hazard-5yr-fill', 'hazard-25yr-fill', 'hazard-100yr-fill'];
    floodLayers.forEach((layerId) => {
      map.on('click', layerId, (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties || {};
        const hazardName = props.hazard_name || 'Flood Drainage Channel';
        const returnPeriod = props.return_period || 'UP NOAH Model';
        const depth = props.depth_range || 'Inundation Zone';

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'cebu-premium-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px; min-width: 180px;">
              <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #EF4444; letter-spacing: 0.5px;">NOAH Inundation Model</div>
              <div style="font-size: 14px; font-weight: 900; color: #0F172A; margin-top: 2px;">${hazardName}</div>
              <div style="margin-top: 6px; font-size: 11px; font-weight: 800; color: #334155; background: #F1F5F9; padding: 4px 8px; border-radius: 8px;">
                Depth: <span style="color: #EF4444;">${depth}</span> &bull; ${returnPeriod}
              </div>
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

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: ROOT_MAP_STYLE,
      center: [123.8950, 10.3160], // Downtown / Cebu City Urban Basin
      zoom: 13.5,
      minZoom: 11.0, // Restrict zooming out to neighboring islands/sea
      maxZoom: 20.5, // Ultra deep zoom capability
      maxBounds: CEBU_CITY_RESTRICTED_BOUNDS,
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

    // Toggle raster base layers
    map.setLayoutProperty('base-layer-satellite', 'visibility', styleKey === 'satellite' ? 'visible' : 'none');
    map.setLayoutProperty('base-layer-dark', 'visibility', styleKey === 'dark' ? 'visible' : 'none');
    map.setLayoutProperty('base-layer-vector', 'visibility', styleKey === 'vector' ? 'visible' : 'none');
    map.setLayoutProperty('base-layer-terrain', 'visibility', styleKey === 'terrain' ? 'visible' : 'none');

    // Adaptive boundary and mask tones
    if (map.getLayer('cebu-outside-mask')) {
      const maskColor = styleKey === 'satellite' ? '#0B1120' : styleKey === 'dark' ? '#030712' : '#E2E8F0';
      const maskOpacity = styleKey === 'dark' ? 0.88 : styleKey === 'satellite' ? 0.78 : 0.88;
      map.setPaintProperty('cebu-outside-mask', 'fill-color', maskColor);
      map.setPaintProperty('cebu-outside-mask', 'fill-opacity', maskOpacity);
    }
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
    if (map.getLayer('cebu-city-border-outer')) {
      map.setLayoutProperty('cebu-city-border-outer', 'visibility', showBoundary ? 'visible' : 'none');
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
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-[#10B981] opacity-60"></span>
          <div class="w-8 h-8 rounded-2xl bg-[#10B981] border-2 border-white shadow-xl flex items-center justify-center text-white transform hover:scale-125 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([shelter.longitude, shelter.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: 'cebu-premium-popup' }).setHTML(`
            <div style="padding: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-size: 10px; font-weight: 900; color: #10B981; text-transform: uppercase; letter-spacing: 0.5px;">Evacuation Center</div>
              <div style="font-weight: 900; font-size: 14px; color: #0F172A; margin-top: 2px;">${shelter.name}</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Brgy. ${shelter.barangay_name || 'Cebu City'}</div>
              <div style="margin-top: 6px; font-size: 11px; font-weight: 800; color: #0F172A; background: #ECFDF5; padding: 4px 8px; border-radius: 8px;">
                Occupancy: <span style="color: #059669;">${shelter.current_occupancy || 0}</span> / ${shelter.max_capacity || 100}
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
      const color = isSevere ? '#EF4444' : '#F59E0B';

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
          new maplibregl.Popup({ offset: 25, className: 'cebu-premium-popup' }).setHTML(`
            <div style="padding: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-size: 10px; font-weight: 900; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">Live Inundation Report</div>
              <div style="font-weight: 900; font-size: 14px; color: #0F172A; margin-top: 2px;">Brgy. ${report.barangay_name || 'Cebu City'}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">${report.description || 'Reported flood stage'}</div>
              <div style="margin-top: 6px; font-size: 10px; font-weight: 900; color: ${color}; background: #FFF1F2; padding: 4px 8px; border-radius: 8px;">
                Water Level: ${report.flood_depth_level?.toUpperCase() || 'UNKNOWN'}
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
        pitch: 50,
        duration: 1600,
      });

      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
      }

      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.innerHTML = `
        <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-[#0284C7] opacity-75"></span>
        <div class="w-9 h-9 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-xs font-black shadow-2xl border-2 border-white">
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
      bearing: nextMode ? -25 : 0,
      duration: 1200,
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
          <div className="absolute bottom-12 right-0 bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-2xl p-2.5 shadow-2xl space-y-1.5 min-w-[210px] animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-black uppercase text-gray-400 px-2 py-0.5 tracking-wider">
              Basemap Themes
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
            title="Switch Map Imagery (Satellite, Cyber Dark, Clean Streets, Topo)"
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

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="flex items-center gap-1.5 text-gray-800">
                    <span className="w-2 h-2 rounded-full bg-gray-500" /> Focus Mode Mask
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
