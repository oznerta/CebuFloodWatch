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
  ShieldAlert,
  Droplet,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

interface MapContainerProps {
  reports?: any[];
  shelters?: any[];
  roads?: any[];
  stations?: any[];
  className?: string;
  showHazardControls?: boolean;
}

export type MapTileStyle = 'osm' | 'osm-hot' | 'hybrid' | 'clean' | 'dark';
export type FloodScenario = '5yr' | '25yr' | '100yr' | 'none';

// 100% Free, Public, Keyless & Watermark-Free Multi-Engine Basemap Catalog
const ROOT_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    // 1. OpenStreetMap Standard (Official Free Worldwide Vector/Raster - No Key, Zero Watermark)
    'osm-standard-src': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    // 2. OpenStreetMap Humanitarian (Clean Disaster Mapping Edition)
    'osm-hot-src': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
    // 3. Google Hybrid Satellite (High-Res Aerial + Street Labels)
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
    // 4. ESRI World Light Gray Canvas (Minimal Gray Disaster Base)
    'esri-clean-src': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 20,
    },
    // 5. ESRI World Dark Gray Canvas (Tactical Cyber Dark Mode)
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
      id: 'base-layer-osm',
      type: 'raster',
      source: 'osm-standard-src',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: 'visible' },
    },
    {
      id: 'base-layer-osm-hot',
      type: 'raster',
      source: 'osm-hot-src',
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
      id: 'base-layer-clean',
      type: 'raster',
      source: 'esri-clean-src',
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
  osm: { name: 'OpenStreetMap (Default)', icon: MapIcon, desc: 'Official OpenStreetMap live global basemap', previewColor: '#EDF5D9' },
  'osm-hot': { name: 'OSM Humanitarian', icon: MapIcon, desc: 'High-contrast disaster mapping edition', previewColor: '#E8ECE9' },
  hybrid: { name: 'Satellite Hybrid', icon: Satellite, desc: 'High-resolution aerial imagery + labels', previewColor: '#2C442A' },
  clean: { name: 'Minimal Gray Canvas', icon: Sun, desc: 'Light gray backdrop for maximum flood clarity', previewColor: '#F5F5F3' },
  dark: { name: 'Dark Ops Tactical', icon: Moon, desc: 'Night situational command map', previewColor: '#242424' },
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
  const targetMarkerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<FloodScenario>('25yr');
  const [showBarangays, setShowBarangays] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [currentStyle, setCurrentStyle] = useState<MapTileStyle>('osm');
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
          'fill-opacity': 0.02, // Click target
        },
      });

      map.addLayer({
        id: 'cebu-barangay-lines',
        type: 'line',
        source: 'cebu-city-barangays',
        paint: {
          'line-color': currentStyle === 'dark' ? '#4A5568' : '#718096',
          'line-width': 1.0,
          'line-dasharray': [3, 2],
          'line-opacity': 0.65,
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
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; min-width: 230px;">
              <div style="background: linear-gradient(135deg, #007AFF 0%, #0051A8 100%); color: #FFFFFF; padding: 12px 14px; border-top-left-radius: 24px; border-top-right-radius: 24px;">
                <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.85;">CEBU CITY OPERATIONAL SECTOR</div>
                <div style="font-size: 16px; font-weight: 900; margin-top: 2px; letter-spacing: -0.2px;">Brgy. ${bgyName}</div>
              </div>
              <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
                  <span style="color: #8E8E93; font-weight: 600;">CDRRMO Sector:</span>
                  <span style="font-weight: 800; color: #1C1C1E;">CEB-${bgyName.slice(0, 3).toUpperCase()}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
                  <span style="color: #8E8E93; font-weight: 600;">Flood Monitoring:</span>
                  <span style="font-weight: 900; color: #34C759; background: #E8F8EE; padding: 2px 8px; border-radius: 6px;">NOMINAL</span>
                </div>
                <div style="border-top: 1px solid #E5E5EA; margin-top: 4px; padding-top: 8px; font-size: 10px; color: #8E8E93; text-align: center;">
                  Official LGU Cebu City Administrative Boundary
                </div>
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

    // 3. UP NOAH Hydrodynamic Inundation Channels (Official DOST-UP NOAH Standard Color Coding)
    // Official Scale: Low (0.1m-0.5m) = #FFE600 (Yellow), Medium (0.5m-1.5m) = #FF9900 (Orange), High (>1.5m) = #E53935 (Red)

    const NOAH_FILL_COLOR_EXPRESSION: any = [
      'match',
      ['get', 'hazard_level'],
      1, '#FFE600', // Low Hazard (0.1m - 0.5m) -> Official UP NOAH Yellow
      2, '#FF9900', // Medium Hazard (0.5m - 1.5m) -> Official UP NOAH Orange
      3, '#E53935', // High Hazard (> 1.5m) -> Official UP NOAH Red
      ['coalesce', ['get', 'color'], '#FFE600'],
    ];

    const NOAH_LINE_COLOR_EXPRESSION: any = [
      'match',
      ['get', 'hazard_level'],
      1, '#D4B106', // Yellow border
      2, '#D46B08', // Orange border
      3, '#A8071A', // Red border
      ['coalesce', ['get', 'color'], '#D4B106'],
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
          'fill-opacity': 0.55,
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
          'fill-opacity': 0.60,
        },
      });
      map.addLayer({
        id: 'hazard-25yr-line',
        type: 'line',
        source: 'cebu-flood-25yr',
        paint: {
          'line-color': NOAH_LINE_COLOR_EXPRESSION,
          'line-width': 1.5,
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
          'fill-opacity': 0.65,
        },
      });
      map.addLayer({
        id: 'hazard-100yr-line',
        type: 'line',
        source: 'cebu-flood-100yr',
        paint: {
          'line-color': NOAH_LINE_COLOR_EXPRESSION,
          'line-width': 2.0,
          'line-opacity': 0.95,
        },
      });
    }

    // Click on flood hazard polygons for official UP NOAH metadata
    const floodLayers = ['hazard-5yr-fill', 'hazard-25yr-fill', 'hazard-100yr-fill'];

    floodLayers.forEach((layerId) => {
      map.on('click', layerId, (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties || {};
        const level = Number(props.hazard_level || props.var || 1);
        const returnPeriod = props.return_period || 'UP NOAH Hydrodynamic Model';
        const depth = props.depth_range || (level === 3 ? '> 1.5m' : level === 2 ? '0.5m - 1.5m' : '0.1m - 0.5m');
        const hazardName = props.hazard_name || (level === 3 ? 'High Hazard (> 1.5m)' : level === 2 ? 'Medium Hazard (0.5m - 1.5m)' : 'Low Hazard (0.1m - 0.5m)');
        
        // Official UP NOAH classification colors
        const levelColor = level === 3 ? '#E53935' : level === 2 ? '#FF9900' : '#D4B106';
        const levelBg = level === 3 ? '#FFEBEE' : level === 2 ? '#FFF3E0' : '#FEFDE8';
        const advisory = level === 3
          ? 'Emergency: Torrential flood depth (>1.5m). Deep submersion risk. Immediate evacuation to multi-story shelters.'
          : level === 2
          ? 'Warning: Medium flood depth (0.5m-1.5m). Alluvial plain overflow. Compact vehicles & sedans impassable.'
          : 'Caution: Low flood depth (0.1m-0.5m). Road gutter backflow & localized street ponding.';

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'cebu-clean-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; min-width: 250px;">
              <div style="background: ${level === 3 ? 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)' : level === 2 ? 'linear-gradient(135deg, #FF9900 0%, #E65100 100%)' : 'linear-gradient(135deg, #FFE600 0%, #D4B106 100%)'}; color: ${level === 1 ? '#1C1C1E' : '#FFFFFF'}; padding: 12px 14px; border-top-left-radius: 24px; border-top-right-radius: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.9;">DOST-UP NOAH OFFICIAL</span>
                  <span style="font-size: 9px; font-weight: 900; background: ${level === 1 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.25)'}; padding: 2px 7px; border-radius: 9999px;">LEVEL ${level}</span>
                </div>
                <div style="font-size: 15px; font-weight: 900; margin-top: 3px;">${hazardName}</div>
              </div>
              <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
                <div style="background: #F2F2F7; padding: 8px 10px; border-radius: 12px; font-size: 11px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-weight: 700; color: #6C6C70;">Inundation Depth:</span>
                  <strong style="color: ${levelColor}; font-size: 12px;">${depth}</strong>
                </div>
                <div style="font-size: 10.5px; color: #3A3A3C; line-height: 1.4; background: ${levelBg}; padding: 8px 10px; border-radius: 12px; border: 1px solid ${levelColor}30;">
                  ${advisory}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #8E8E93; padding-top: 2px;">
                  <span>Simulation: ${returnPeriod}</span>
                  <span style="font-weight: 800; color: #007AFF;">LGU CDRRMO</span>
                </div>
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

    const styles: MapTileStyle[] = ['osm', 'osm-hot', 'hybrid', 'clean', 'dark'];
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
        styleKey === 'dark' ? '#718096' : styleKey === 'hybrid' ? '#FFFFFF' : '#A0AEC0'
      );
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

  // Render Real Markers: Reports, Shelters, Sensor Stations
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Render Evacuation Shelters
    shelters.forEach((shelter) => {
      if (!shelter.latitude || !shelter.longitude) return;

      const isOpen = shelter.status === 'open';
      const color = isOpen ? '#34C759' : '#8E8E93';

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
              <div style="background: ${isOpen ? 'linear-gradient(135deg, #34C759 0%, #248A3D 100%)' : 'linear-gradient(135deg, #8E8E93 0%, #636366 100%)'}; color: #FFFFFF; padding: 12px 14px; border-top-left-radius: 24px; border-top-right-radius: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.9;">EVACUATION REFUGE</span>
                  <span style="font-size: 9px; font-weight: 900; background: rgba(255,255,255,0.25); padding: 2px 7px; border-radius: 9999px;">${isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>
                <div style="font-size: 15px; font-weight: 900; margin-top: 3px;">${shelter.name}</div>
              </div>
              <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-size: 11px; color: #3A3A3C;">
                  <strong>Location:</strong> Brgy. ${shelter.barangay_name || 'Cebu City'}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; background: #F2F2F7; padding: 6px 10px; border-radius: 10px;">
                  <span style="color: #8E8E93; font-weight: 600;">Refuge Capacity:</span>
                  <span style="font-weight: 900; color: #1C1C1E;">${shelter.capacity_people || 500} evacuees</span>
                </div>
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
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; min-width: 240px;">
              <div style="background: ${isSevere ? 'linear-gradient(135deg, #FF3B30 0%, #C62828 100%)' : 'linear-gradient(135deg, #FF9500 0%, #E65100 100%)'}; color: #FFFFFF; padding: 12px 14px; border-top-left-radius: 24px; border-top-right-radius: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.9;">CITIZEN INCIDENT REPORT</span>
                  <span style="font-size: 9px; font-weight: 900; background: rgba(255,255,255,0.25); padding: 2px 7px; border-radius: 9999px;">${report.flood_depth_level?.toUpperCase() || 'FLOOD'}</span>
                </div>
                <div style="font-size: 15px; font-weight: 900; margin-top: 3px;">Brgy. ${report.barangay_name || 'Area'}</div>
              </div>
              <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-size: 11.5px; color: #1C1C1E; line-height: 1.4;">
                  ${report.description || 'Verified flood incident pin.'}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #8E8E93; border-top: 1px solid #E5E5EA; padding-top: 6px;">
                  <span>Reported: ${new Date(report.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style="font-weight: 800; color: #007AFF;">Status: ${report.status?.toUpperCase() || 'VERIFIED'}</span>
                </div>
              </div>
            </div>
          `)
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Render Hydrological River Sensor Stations
    stations.forEach((st) => {
      if (!st.latitude || !st.longitude) return;

      const isBreach = st.status === 'critical_breach';
      const isWatch = st.status === 'watch';
      const color = isBreach ? '#FF3B30' : isWatch ? '#FF9500' : '#007AFF';
      const statusLabel = isBreach ? 'CRITICAL BREACH' : isWatch ? 'WATCH LEVEL' : 'NORMAL FLOW';

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
              <div style="background: ${isBreach ? 'linear-gradient(135deg, #FF3B30 0%, #D32F2F 100%)' : isWatch ? 'linear-gradient(135deg, #FF9500 0%, #E65100 100%)' : 'linear-gradient(135deg, #007AFF 0%, #0051A8 100%)'}; color: #FFFFFF; padding: 12px 14px; border-top-left-radius: 24px; border-top-right-radius: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.9;">RIVER TELEMETRY NODE</span>
                  <span style="font-size: 9px; font-weight: 900; background: rgba(255,255,255,0.25); padding: 2px 7px; border-radius: 9999px;">${statusLabel}</span>
                </div>
                <div style="font-size: 15px; font-weight: 900; margin-top: 3px;">${st.station_name}</div>
                <div style="font-size: 10px; opacity: 0.85; margin-top: 1px;">${st.river_basin} &bull; Brgy. ${st.barangay_name}</div>
              </div>
              <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                  <div style="background: #F2F2F7; padding: 8px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 9px; font-weight: 700; color: #8E8E93; text-transform: uppercase;">Water Level</div>
                    <div style="font-size: 14px; font-weight: 900; color: ${color}; margin-top: 1px;">${st.water_level_meters}m</div>
                  </div>
                  <div style="background: #F2F2F7; padding: 8px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 9px; font-weight: 700; color: #8E8E93; text-transform: uppercase;">Rainfall</div>
                    <div style="font-size: 14px; font-weight: 900; color: #007AFF; margin-top: 1px;">${st.rainfall_rate_mmh || 0} mm/h</div>
                  </div>
                </div>
                <div style="font-size: 10px; color: #8E8E93; display: flex; justify-content: space-between; border-top: 1px solid #E5E5EA; padding-top: 6px;">
                  <span>Alert 1: <strong>${st.alert_level_1_meters}m</strong></span>
                  <span>Critical: <strong style="color: #FF3B30;">${st.critical_overflow_meters}m</strong></span>
                </div>
              </div>
            </div>
          `)
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [reports, shelters, stations, mapLoaded]);

  // Handle Fly-To Custom Events
  useEffect(() => {
    const handleFlyTo = (event: any) => {
      if (!mapRef.current) return;
      const { latitude, longitude, name } = event.detail || {};
      if (!latitude || !longitude) return;

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 16.5,
        pitch: is3DMode ? 55 : 40,
        essential: true,
        duration: 1800,
      });

      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
        targetMarkerRef.current = null;
      }

      const el = document.createElement('div');
      el.className = 'w-10 h-10 -ml-5 -mt-5 pointer-events-none';
      el.innerHTML = `
        <div class="relative w-full h-full flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-blue-500/40 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl"></div>
        </div>
      `;

      targetMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);

      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: true, className: 'cebu-clean-popup' })
        .setLngLat([longitude, latitude])
        .setHTML(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; min-width: 220px;">
            <div style="background: linear-gradient(135deg, #007AFF 0%, #0051A8 100%); color: #FFFFFF; padding: 10px 14px; border-top-left-radius: 24px; border-top-right-radius: 24px;">
              <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.85;">RADAR TARGET LOCK</div>
              <div style="font-size: 14px; font-weight: 900; margin-top: 2px;">${name || 'Location Target'}</div>
            </div>
            <div style="padding: 10px 14px; font-size: 11px; color: #6C6C70; display: flex; align-items: center; justify-content: space-between;">
              <span>Cebu City Grid</span>
              <span style="font-weight: 800; color: #007AFF;">${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E</span>
            </div>
          </div>
        `)
        .addTo(mapRef.current);
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
      duration: 1500,
      essential: true,
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

      {/* Floating HUD Controls (Top Right Overlay) */}
      <div className="absolute top-20 left-6 z-10 pointer-events-auto flex items-center gap-2">
        {/* Map Styles Chooser Button */}
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            title="Switch Map Engine (Clean, Dark, Satellite, Streets, Terrain)"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-2xl border border-gray-200/90 hover:border-gray-300 text-gray-800 text-xs font-black shadow-lg hover:shadow-xl transition-all cursor-pointer"
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
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-2xl border border-gray-200/90 p-1 rounded-2xl shadow-lg">
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

      {/* NOAH Hazard Return-Period Layer Switcher (Expandable Floating Control) */}
      {showHazardControls && (
        <div className="absolute bottom-6 left-6 z-10 pointer-events-auto">
          {!showLayersMenu ? (
            <button
              onClick={() => setShowLayersMenu(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-2xl border border-gray-200 hover:border-gray-300 text-gray-800 text-xs font-black shadow-xl hover:shadow-2xl transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>UP NOAH Flood Scenarios</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  selectedScenario === '100yr'
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : selectedScenario === '25yr'
                    ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                    : selectedScenario === '5yr'
                    ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50'
                    : 'bg-gray-400'
                }`}
              />
            </button>
          ) : (
            <div className="bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-4 shadow-2xl space-y-3 text-xs min-w-[300px] animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-black text-[11px] uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  DOST-UP NOAH Hydro Scenarios
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

              {/* Official UP NOAH Inundation Depth Gradient Legend */}
              {selectedScenario !== 'none' && (
                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-gray-400">UP NOAH Official Hazard Scale</div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-700">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600] border border-[#D4B106] shadow-xs" /> Low (0.1–0.5m)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF9900] border border-[#D46B08] shadow-xs" /> Med (0.5–1.5m)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E53935] border border-[#A8071A] shadow-xs" /> High (&gt;1.5m)
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
                    <span className="w-2 h-2 rounded-full bg-blue-600" /> City Perimeter Laser Glow
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
