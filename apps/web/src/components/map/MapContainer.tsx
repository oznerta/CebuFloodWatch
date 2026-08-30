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
  Sun,
  Moon,
  Radio,
  Home,
  AlertTriangle,
  Eye,
  EyeOff,
  Building,
} from 'lucide-react';

interface MapContainerProps {
  reports?: any[];
  shelters?: any[];
  roads?: any[];
  stations?: any[];
  className?: string;
  showHazardControls?: boolean;
}

export type MapTileStyle = 'clean' | 'poi' | 'hybrid' | 'dark' | 'carto';
export type FloodScenario = '5yr' | '25yr' | '100yr' | 'none';

// Ultra-Reliable High-Resolution Multi-Engine Basemap Catalog
const ROOT_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    // 1. Google Clean Roads (Default - NO Commercial POIs, NO Hotels, NO Resorts, NO Malls)
    'google-clean-src': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=m&apistyle=s.t:49|p.v:off|s.t:6|p.v:off|s.t:3|p.v:off|s.t:1|p.v:off&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=m&apistyle=s.t:49|p.v:off|s.t:6|p.v:off|s.t:3|p.v:off|s.t:1|p.v:off&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=m&apistyle=s.t:49|p.v:off|s.t:6|p.v:off|s.t:3|p.v:off|s.t:1|p.v:off&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=m&apistyle=s.t:49|p.v:off|s.t:6|p.v:off|s.t:3|p.v:off|s.t:1|p.v:off&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
    // 2. Google Standard with Commercial POIs (Hotels, Resorts, Malls)
    'google-poi-src': {
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
    // 3. Google Hybrid Satellite (High-Res Aerial + Street Overlay)
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
    // 4. Carto Positron Light (Ultra-Minimalist Monochromatic Disaster Base)
    'carto-light-src': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
    // 5. ESRI World Dark Gray Canvas (Tactical Night Ops Command Mode)
    'esri-dark-src': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'base-layer-clean',
      type: 'raster',
      source: 'google-clean-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'visible' },
    },
    {
      id: 'base-layer-poi',
      type: 'raster',
      source: 'google-poi-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'none' },
    },
    {
      id: 'base-layer-hybrid',
      type: 'raster',
      source: 'google-hybrid-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'none' },
    },
    {
      id: 'base-layer-carto',
      type: 'raster',
      source: 'carto-light-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'none' },
    },
    {
      id: 'base-layer-dark',
      type: 'raster',
      source: 'esri-dark-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'none' },
    },
  ],
};

const TILE_STYLES_INFO: Record<MapTileStyle, { name: string; icon: any; desc: string; previewColor: string }> = {
  clean: { name: 'Clean Disaster (No POIs)', icon: MapIcon, desc: 'Zero commercial clutter, pure road network', previewColor: '#F8F9FA' },
  poi: { name: 'City Landmarks & POIs', icon: Building, desc: 'Includes commercial malls, hotels & resorts', previewColor: '#F1F5F9' },
  hybrid: { name: 'Satellite Aerial', icon: Satellite, desc: 'High-resolution photography & terrain', previewColor: '#2C442A' },
  carto: { name: 'Minimal Gray Canvas', icon: Sun, desc: 'Monochromatic neutral disaster baseline', previewColor: '#E2E8F0' },
  dark: { name: 'Dark Tactical Ops', icon: Moon, desc: 'Nocturnal command situational awareness', previewColor: '#1A1D20' },
};

export function MapContainer({
  reports = [],
  shelters = [],
  roads = [],
  stations = [],
  className = 'h-[500px] w-full',
  showHazardControls = true,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<FloodScenario>('25yr');
  const [showCommercialPOIs, setShowCommercialPOIs] = useState(false);
  const [showStations, setShowStations] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showBarangays, setShowBarangays] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [currentStyle, setCurrentStyle] = useState<MapTileStyle>('clean');
  const [is3DMode, setIs3DMode] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(13.5);

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
          'line-color': '#007AFF',
          'line-width': 4,
          'line-opacity': 0.35,
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
          'line-width': 2.0,
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
          'fill-opacity': 0.02,
        },
      });

      map.addLayer({
        id: 'cebu-barangay-lines',
        type: 'line',
        source: 'cebu-city-barangays',
        paint: {
          'line-color': currentStyle === 'dark' ? '#4A5568' : '#94A3B8',
          'line-width': 1.0,
          'line-dasharray': [3, 2],
          'line-opacity': 0.65,
        },
      });
    }

    // 3. UP NOAH Hydrodynamic Inundation Channels (Soft Translucent Apple Maps Palette)
    // Low: #FACC15 (Yellow), Medium: #FB923C (Orange), High: #EF4444 (Red)
    const NOAH_FILL_COLOR_EXPRESSION: any = [
      'match',
      ['get', 'hazard_level'],
      1, '#FACC15', // Low Hazard (0.1m - 0.5m) -> Official UP NOAH Yellow
      2, '#FB923C', // Medium Hazard (0.5m - 1.5m) -> Official UP NOAH Orange
      3, '#EF4444', // High Hazard (> 1.5m) -> Official UP NOAH Red
      ['coalesce', ['get', 'color'], '#FACC15'],
    ];

    const NOAH_LINE_COLOR_EXPRESSION: any = [
      'match',
      ['get', 'hazard_level'],
      1, '#EAB308',
      2, '#EA580C',
      3, '#DC2626',
      ['coalesce', ['get', 'color'], '#EAB308'],
    ];

    // 5-Year (Low Recurrence / 5-Year Flood Inundation Simulation)
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
          'fill-color': NOAH_FILL_COLOR_EXPRESSION,
          'fill-opacity': 0.35,
        },
      });
      map.addLayer({
        id: 'hazard-5yr-line',
        type: 'line',
        source: 'cebu-flood-5yr',
        paint: {
          'line-color': NOAH_LINE_COLOR_EXPRESSION,
          'line-width': 1.2,
          'line-opacity': 0.85,
        },
      });
    }

    // 25-Year (Medium Recurrence / 25-Year Design Storm Plain)
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
          'fill-color': NOAH_FILL_COLOR_EXPRESSION,
          'fill-opacity': 0.40,
        },
      });
      map.addLayer({
        id: 'hazard-25yr-line',
        type: 'line',
        source: 'cebu-flood-25yr',
        paint: {
          'line-color': NOAH_LINE_COLOR_EXPRESSION,
          'line-width': 1.4,
          'line-opacity': 0.90,
        },
      });
    }

    // 100-Year (Severe Recurrence / 100-Year Extreme Flood Plain)
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
          'fill-color': NOAH_FILL_COLOR_EXPRESSION,
          'fill-opacity': 0.46,
        },
      });
      map.addLayer({
        id: 'hazard-100yr-line',
        type: 'line',
        source: 'cebu-flood-100yr',
        paint: {
          'line-color': NOAH_LINE_COLOR_EXPRESSION,
          'line-width': 1.8,
          'line-opacity': 0.95,
        },
      });
    }

    // Unified Map Click Handler (Dispatches between Flood Polygons & Barangays cleanly)
    map.on('click', (e: any) => {
      // If click originated on a marker or popup, ignore map layer querying
      const target = e.originalEvent?.target as HTMLElement;
      if (target && (target.closest('.maplibregl-marker') || target.closest('.maplibregl-popup'))) {
        return;
      }

      const candidateLayers = [
        'hazard-100yr-fill',
        'hazard-25yr-fill',
        'hazard-5yr-fill',
        'cebu-barangay-fills',
      ].filter((id) => {
        try {
          return map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none';
        } catch {
          return false;
        }
      });

      const features = map.queryRenderedFeatures(e.point, { layers: candidateLayers });
      if (!features || features.length === 0) return;

      const topFeature = features[0];
      const layerId = topFeature.layer.id;
      const props = topFeature.properties || {};

      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }

      if (layerId.startsWith('hazard-')) {
        // Flood Hazard Click (Sleek Apple Maps Card)
        const level = Number(props.hazard_level || props.var || 1);
        const returnPeriod = props.return_period || 'UP NOAH Model';
        const depth = props.depth_range || (level === 3 ? '> 1.5m' : level === 2 ? '0.5m - 1.5m' : '0.1m - 0.5m');
        const hazardName = props.hazard_name || (level === 3 ? 'High Hazard (> 1.5m)' : level === 2 ? 'Medium Hazard (0.5m - 1.5m)' : 'Low Hazard (0.1m - 0.5m)');
        const levelColor = level === 3 ? '#EF4444' : level === 2 ? '#F97316' : '#EAB308';
        const levelBg = level === 3 ? '#FEF2F2' : level === 2 ? '#FFF7ED' : '#FEFCE8';
        const advisory = level === 3
          ? 'Emergency: Severe torrential flood depth (>1.5m). Deep submersion risk. Immediate evacuation to multi-story shelters.'
          : level === 2
          ? 'Warning: Medium flood depth (0.5m–1.5m). Alluvial plain overflow. Compact vehicles & sedans impassable.'
          : 'Caution: Low flood depth (0.1m–0.5m). Localized street ponding & gutter backflow.';

        popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'cebu-clean-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; min-width: 250px;">
              <div style="display: flex; align-items: center; gap: 6px; padding-right: 24px;">
                <span style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">DOST-UP NOAH</span>
                <span style="font-size: 9px; font-weight: 800; background: ${levelBg}; color: ${levelColor}; padding: 2px 7px; border-radius: 9999px; border: 1px solid ${levelColor}30;">LEVEL ${level}</span>
              </div>
              <div style="font-size: 15px; font-weight: 800; color: #111827; margin-top: 4px; line-height: 1.25;">
                ${hazardName}
              </div>
              <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">
                Simulation: ${returnPeriod}
              </div>

              <div style="margin-top: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 10px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 11px; font-weight: 600; color: #64748B;">Inundation Depth:</span>
                <strong style="font-size: 13px; font-weight: 900; color: ${levelColor};">${depth}</strong>
              </div>

              <div style="margin-top: 8px; font-size: 11px; color: #334155; line-height: 1.4; background: ${levelBg}; padding: 8px 10px; border-radius: 10px; border: 1px solid ${levelColor}25;">
                ${advisory}
              </div>
            </div>
          `)
          .addTo(map);
      } else if (layerId === 'cebu-barangay-fills') {
        // Barangay Click (Sleek Apple Maps Card)
        const bgyName = props.adm4_name || props.adm4_en || 'Barangay';
        popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'cebu-clean-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; min-width: 220px;">
              <div style="display: flex; align-items: center; gap: 6px; padding-right: 24px;">
                <span style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #0284C7; letter-spacing: 0.5px;">Cebu City Sector</span>
                <span style="font-size: 9px; font-weight: 800; background: #ECFDF5; color: #059669; padding: 2px 7px; border-radius: 9999px;">MONITORED</span>
              </div>
              <div style="font-size: 15px; font-weight: 800; color: #111827; margin-top: 4px;">
                Brgy. ${bgyName}
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                CDRRMO Operational Grid: CEB-${bgyName.slice(0, 3).toUpperCase()}
              </div>
            </div>
          `)
          .addTo(map);
      }
    });

    setMapLoaded(true);
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: ROOT_MAP_STYLE,
      center: [123.8950, 10.3160], // Downtown Cebu City Urban Plain
      zoom: 13.5,
      minZoom: 10.0,
      maxZoom: 20.5,
      pitch: is3DMode ? 45 : 0,
      bearing: 0,
      attributionControl: false,
    });

    map.on('load', setupLayers);
    
    map.on('mousemove', (e: any) => {
      if (e.lngLat) {
        setMouseCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      }
      try {
        const hoverFeatures = map.queryRenderedFeatures(e.point, {
          layers: ['hazard-100yr-fill', 'hazard-25yr-fill', 'hazard-5yr-fill', 'cebu-barangay-fills'].filter((id) => {
            try { return map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none'; } catch { return false; }
          }),
        });
        map.getCanvas().style.cursor = hoverFeatures.length > 0 ? 'pointer' : '';
      } catch {
        map.getCanvas().style.cursor = '';
      }
    });

    map.on('zoom', () => {
      setCurrentZoom(map.getZoom());
    });

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

    const styles: MapTileStyle[] = ['clean', 'poi', 'hybrid', 'carto', 'dark'];
    styles.forEach((key) => {
      const layerId = `base-layer-${key}`;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', key === styleKey ? 'visible' : 'none');
      }
    });

    // Adjust barangay line contrast based on theme
    if (map.getLayer('cebu-barangay-lines')) {
      map.setPaintProperty(
        'cebu-barangay-lines',
        'line-color',
        styleKey === 'dark' ? '#718096' : styleKey === 'hybrid' ? '#FFFFFF' : '#94A3B8'
      );
    }
  };

  // Instant Toggle for Commercial POIs (Hotels, Resorts, Malls)
  const handleTogglePOIs = (enabled: boolean) => {
    setShowCommercialPOIs(enabled);
    if (!mapRef.current) return;
    const map = mapRef.current;

    const targetStyle: MapTileStyle = enabled ? 'poi' : 'clean';
    setCurrentStyle(targetStyle);

    const styles: MapTileStyle[] = ['clean', 'poi', 'hybrid', 'carto', 'dark'];
    styles.forEach((key) => {
      const layerId = `base-layer-${key}`;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', key === targetStyle ? 'visible' : 'none');
      }
    });
  };

  // Sync Commercial POIs toggle with basemap layer
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (currentStyle === 'clean' || currentStyle === 'poi') {
      const targetStyle = showCommercialPOIs ? 'poi' : 'clean';
      setCurrentStyle(targetStyle);

      if (map.getLayer('base-layer-clean')) {
        map.setLayoutProperty('base-layer-clean', 'visibility', !showCommercialPOIs ? 'visible' : 'none');
      }
      if (map.getLayer('base-layer-poi')) {
        map.setLayoutProperty('base-layer-poi', 'visibility', showCommercialPOIs ? 'visible' : 'none');
      }
    }
  }, [showCommercialPOIs, mapLoaded]);

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

  // Render Real Markers: Reports, Shelters, Sensor Stations with individual visibility toggles
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Render Evacuation Shelters (if enabled)
    if (showShelters) {
      shelters.forEach((shelter) => {
        if (!shelter.latitude || !shelter.longitude) return;

        const isOpen = shelter.status === 'open';
        const color = isOpen ? '#10B981' : '#6B7280';
        const statusBg = isOpen ? '#ECFDF5' : '#F3F4F6';
        const statusColor = isOpen ? '#059669' : '#4B5563';

        const el = document.createElement('div');
        el.className = 'cursor-pointer group';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            ${isOpen ? '<span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-emerald-400 opacity-60"></span>' : ''}
            <div class="w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white transform hover:scale-125 transition-transform" style="background-color: ${color}">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([shelter.longitude, shelter.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25, className: 'cebu-clean-popup' }).setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; min-width: 230px;">
                <div style="display: flex; align-items: center; gap: 6px; padding-right: 24px;">
                  <span style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #10B981; letter-spacing: 0.5px;">Evacuation Center</span>
                  <span style="font-size: 9px; font-weight: 800; background: ${statusBg}; color: ${statusColor}; padding: 2px 7px; border-radius: 9999px;">${isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>
                <div style="font-size: 15px; font-weight: 800; color: #111827; margin-top: 4px;">
                  ${shelter.name}
                </div>
                <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">
                  Location: Brgy. ${shelter.barangay_name || 'Cebu City'}
                </div>

                <div style="margin-top: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 10px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 11px; font-weight: 600; color: #64748B;">Refuge Capacity:</span>
                  <strong style="font-size: 12px; font-weight: 800; color: #0F172A;">${shelter.capacity_people || 500} evacuees</strong>
                </div>
              </div>
            `)
          )
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }

    // 2. Render Incident Reports (if enabled)
    if (showReports) {
      reports.forEach((report) => {
        if (!report.latitude || !report.longitude) return;

        const isSevere = report.flood_depth_level === 'waist' || report.flood_depth_level === 'chest' || report.flood_depth_level === 'above_head';
        const color = isSevere ? '#EF4444' : '#F97316';
        const badgeBg = isSevere ? '#FEF2F2' : '#FFF7ED';
        const badgeColor = isSevere ? '#DC2626' : '#C2410C';

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
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; min-width: 240px;">
                <div style="display: flex; align-items: center; gap: 6px; padding-right: 24px;">
                  <span style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Incident Report</span>
                  <span style="font-size: 9px; font-weight: 800; background: ${badgeBg}; color: ${badgeColor}; padding: 2px 7px; border-radius: 9999px;">${report.flood_depth_level?.toUpperCase() || 'FLOOD'}</span>
                </div>
                <div style="font-size: 15px; font-weight: 800; color: #111827; margin-top: 4px;">
                  Brgy. ${report.barangay_name || 'Area'}
                </div>
                <div style="font-size: 11.5px; color: #334155; line-height: 1.4; margin-top: 6px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 10px; border-radius: 10px;">
                  ${report.description || 'Verified flood incident.'}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #94A3B8; margin-top: 8px; padding-top: 6px; border-top: 1px solid #F1F5F9;">
                  <span>Reported: ${new Date(report.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style="font-weight: 700; color: #0284C7;">${report.status?.toUpperCase() || 'VERIFIED'}</span>
                </div>
              </div>
            `)
          )
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }

    // 3. Render Hydrological River Sensor Stations (if enabled)
    if (showStations) {
      stations.forEach((st) => {
        if (!st.latitude || !st.longitude) return;

        const isBreach = st.status === 'critical_breach';
        const isWatch = st.status === 'watch';
        const color = isBreach ? '#EF4444' : isWatch ? '#F97316' : '#0284C7';
        const statusLabel = isBreach ? 'CRITICAL BREACH' : isWatch ? 'WATCH LEVEL' : 'NORMAL FLOW';
        const statusBg = isBreach ? '#FEF2F2' : isWatch ? '#FFF7ED' : '#F0F9FF';
        const statusColor = isBreach ? '#DC2626' : isWatch ? '#C2410C' : '#0369A1';

        const el = document.createElement('div');
        el.className = 'cursor-pointer group';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full opacity-75" style="background-color: ${color}"></span>
            <div class="w-8 h-8 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center text-white transform hover:scale-125 transition-transform" style="background-color: ${color}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([st.longitude, st.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25, className: 'cebu-clean-popup' }).setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; min-width: 250px;">
                <div style="display: flex; align-items: center; gap: 6px; padding-right: 24px;">
                  <span style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #0284C7; letter-spacing: 0.5px;">River Telemetry</span>
                  <span style="font-size: 9px; font-weight: 800; background: ${statusBg}; color: ${statusColor}; padding: 2px 7px; border-radius: 9999px;">${statusLabel}</span>
                </div>
                <div style="font-size: 15px; font-weight: 800; color: #111827; margin-top: 4px; line-height: 1.25;">
                  ${st.station_name}
                </div>
                <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">
                  ${st.river_basin} &bull; Brgy. ${st.barangay_name}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
                  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 10px; border-radius: 12px;">
                    <div style="font-size: 9px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Water Level</div>
                    <div style="font-size: 16px; font-weight: 900; color: ${color}; margin-top: 2px;">${st.water_level_meters}m</div>
                  </div>
                  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 10px; border-radius: 12px;">
                    <div style="font-size: 9px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Rainfall</div>
                    <div style="font-size: 16px; font-weight: 900; color: #0284C7; margin-top: 2px;">${st.rainfall_rate_mmh || 0} mm/h</div>
                  </div>
                </div>

                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #F1F5F9; display: flex; justify-content: space-between; font-size: 10.5px; color: #64748B;">
                  <span>Alert 1: <strong style="color: #0F172A;">${st.alert_level_1_meters}m</strong></span>
                  <span>Critical: <strong style="color: #EF4444;">${st.critical_overflow_meters}m</strong></span>
                </div>
              </div>
            `)
          )
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }
  }, [reports, shelters, stations, showStations, showShelters, showReports, mapLoaded]);

  // Handle Fly-To Custom Events (Directly opens marker popup without duplicate circle pin)
  useEffect(() => {
    const handleFlyTo = (event: any) => {
      if (!mapRef.current) return;
      const { latitude, longitude } = event.detail || {};
      if (!latitude || !longitude) return;

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 16.5,
        pitch: is3DMode ? 45 : 0,
        essential: true,
        duration: 1200,
      });

      // Find the existing marker and toggle its popup open directly
      const targetMarker = markersRef.current.find((m) => {
        const lngLat = m.getLngLat();
        return (
          Math.abs(lngLat.lat - latitude) < 0.0008 &&
          Math.abs(lngLat.lng - longitude) < 0.0008
        );
      });

      if (targetMarker) {
        const popup = targetMarker.getPopup();
        if (popup && !popup.isOpen()) {
          targetMarker.togglePopup();
        }
      }
    };

    window.addEventListener('map:flyto', handleFlyTo);
    return () => window.removeEventListener('map:flyto', handleFlyTo);
  }, [is3DMode]);

  const handleResetToCebuCenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [123.8950, 10.3160],
      zoom: 13.5,
      pitch: 0,
      bearing: 0,
      duration: 1200,
    });
    setIs3DMode(false);
  };

  const toggle3DMode = () => {
    if (!mapRef.current) return;
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    mapRef.current.easeTo({
      pitch: next3D ? 50 : 0,
      bearing: next3D ? -20 : 0,
      duration: 1000,
    });
  };

  return (
    <div ref={wrapperRef} className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Modern Header HUD (Top Left Overlay) */}
      <div className="absolute top-20 left-6 z-10 pointer-events-auto flex items-center gap-2">
        {/* Map Styles Chooser Button */}
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            title="Switch Map Engine"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-2xl border border-gray-200 hover:border-gray-300 text-gray-800 text-xs font-black shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            {React.createElement(TILE_STYLES_INFO[currentStyle].icon, { className: 'w-4 h-4 text-blue-600' })}
            <span className="hidden sm:inline">{TILE_STYLES_INFO[currentStyle].name}</span>
          </button>

          {/* Style Dropdown Menu */}
          {showStyleMenu && (
            <div className="absolute top-12 left-0 z-30 w-72 bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-3 shadow-2xl space-y-1.5 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2.5 py-1">
                Map Canvas Engine
              </div>
              {(Object.keys(TILE_STYLES_INFO) as MapTileStyle[]).map((styleKey) => {
                const info = TILE_STYLES_INFO[styleKey];
                const isActive = currentStyle === styleKey;
                const Icon = info.icon;

                return (
                  <button
                    key={styleKey}
                    onClick={() => handleSwitchStyle(styleKey)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-extrabold shadow-xs'
                        : 'hover:bg-gray-50 text-gray-700 font-semibold'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs border border-black/5"
                      style={{ backgroundColor: info.previewColor }}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-700'}`} />
                    </div>
                    <div>
                      <p className="text-xs">{info.name}</p>
                      <p className="text-[10px] text-gray-400 font-normal">{info.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Viewport Actions: Zoom, 3D, Recenter */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-2xl border border-gray-200 p-1 rounded-2xl shadow-lg">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom In"
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom Out"
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold transition-all cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

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

          <button
            onClick={handleResetToCebuCenter}
            title="Recenter on Cebu City Urban Plain"
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-blue-600 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NOAH Hazard Return-Period & Layer Toggles (Bottom Left Floating Widget) */}
      {showHazardControls && (
        <div className="absolute bottom-6 left-6 z-10 pointer-events-auto">
          {!showLayersMenu ? (
            <button
              onClick={() => setShowLayersMenu(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-2xl border border-gray-200 hover:border-gray-300 text-gray-800 text-xs font-black shadow-xl hover:shadow-2xl transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Map Layers &amp; Scenarios</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  selectedScenario === '100yr'
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : selectedScenario === '25yr'
                    ? 'bg-orange-500 shadow-sm shadow-orange-500/50'
                    : selectedScenario === '5yr'
                    ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50'
                    : 'bg-gray-400'
                }`}
              />
            </button>
          ) : (
            <div className="bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-4 shadow-2xl space-y-3.5 text-xs min-w-[320px] max-h-[80vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-black text-[11px] uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Layers &amp; Flood Scenarios
                </span>
                <button
                  onClick={() => setShowLayersMenu(false)}
                  className="w-5 h-5 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* 1. UP NOAH Scenario Selector Pills */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-black uppercase text-gray-400">DOST-UP NOAH Hydro Model</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setSelectedScenario('5yr')}
                    className={`py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedScenario === '5yr'
                        ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-300" />
                    5-Yr (Low Risk)
                  </button>

                  <button
                    onClick={() => setSelectedScenario('25yr')}
                    className={`py-2 px-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedScenario === '25yr'
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-200" />
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
              </div>

              {/* Official UP NOAH Inundation Depth Gradient Legend */}
              {selectedScenario !== 'none' && (
                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-gray-400">Hazard Depth Scale</div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-700">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15] border border-[#EAB308] shadow-xs" /> Low (0.1–0.5m)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FB923C] border border-[#EA580C] shadow-xs" /> Med (0.5–1.5m)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-[#DC2626] shadow-xs" /> High (&gt;1.5m)
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Operational Markers & Features Toggles */}
              <div className="pt-2 border-t border-gray-100 space-y-2 text-[11px] font-bold text-gray-700">
                <div className="text-[10px] font-black uppercase text-gray-400">Operational Overlays</div>

                {/* Hide Third-Party Commercial POIs Switch */}
                <label className="flex items-center justify-between cursor-pointer select-none bg-slate-50 p-2 rounded-xl border border-gray-200/80">
                  <span className="flex items-center gap-1.5 text-gray-800">
                    <Building className="w-3.5 h-3.5 text-gray-500" />
                    Commercial POIs (Hotels/Malls)
                  </span>
                  <input
                    type="checkbox"
                    checked={showCommercialPOIs}
                    onChange={(e) => handleTogglePOIs(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
                  />
                </label>

                {/* River Telemetry Sensor Nodes */}
                <label className="flex items-center justify-between cursor-pointer select-none px-1">
                  <span className="flex items-center gap-1.5 text-sky-700">
                    <Radio className="w-3.5 h-3.5 text-sky-600" />
                    River Telemetry Sensors ({stations.length})
                  </span>
                  <input
                    type="checkbox"
                    checked={showStations}
                    onChange={(e) => setShowStations(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Evacuation Shelters */}
                <label className="flex items-center justify-between cursor-pointer select-none px-1">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <Home className="w-3.5 h-3.5 text-emerald-600" />
                    Evacuation Shelters ({shelters.length})
                  </span>
                  <input
                    type="checkbox"
                    checked={showShelters}
                    onChange={(e) => setShowShelters(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Citizen Incident Reports */}
                <label className="flex items-center justify-between cursor-pointer select-none px-1">
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Incident Reports ({reports.length})
                  </span>
                  <input
                    type="checkbox"
                    checked={showReports}
                    onChange={(e) => setShowReports(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* 80 Barangay Outlines */}
                <label className="flex items-center justify-between cursor-pointer select-none px-1">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    80 Barangay Outlines
                  </span>
                  <input
                    type="checkbox"
                    checked={showBarangays}
                    onChange={(e) => setShowBarangays(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* City Perimeter Laser Glow */}
                <label className="flex items-center justify-between cursor-pointer select-none px-1">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Perimeter Laser Glow
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

      {/* Bottom Right Live GIS Coordinates & Scale HUD Dock */}
      <div className="absolute bottom-6 right-6 z-10 pointer-events-none hidden md:flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-2xl border border-gray-200/90 text-[11px] font-bold text-gray-700 shadow-xl">
        <div className="flex items-center gap-1.5 text-blue-600">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>WGS84 Datum</span>
        </div>
        <span className="w-px h-3 bg-gray-200" />
        <span className="font-mono text-gray-800">Zoom {currentZoom.toFixed(1)}</span>
        {mouseCoords && (
          <>
            <span className="w-px h-3 bg-gray-200" />
            <span className="font-mono text-gray-900 font-extrabold">
              {mouseCoords.lat.toFixed(4)}° N, {mouseCoords.lng.toFixed(4)}° E
            </span>
          </>
        )}
      </div>
    </div>
  );
}
