'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { CEBU_CITY_BOUNDS, UP_NOAH_CEBU_HAZARD_GEOJSON } from '@cebufloodwatch/shared';
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
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty', // High-detail hybrid
  },
  terrain: {
    name: 'Topographic Terrain',
    styleUrl: 'https://tiles.openfreemap.org/styles/bright',
  },
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

  const [mapLoaded, setMapLoaded] = useState(false);
  const [show100Year, setShow100Year] = useState(true);
  const [show25Year, setShow25Year] = useState(true);
  const [show5Year, setShow5Year] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<MapTileStyle>('vector');
  const [is3DMode, setIs3DMode] = useState(false);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: TILE_STYLES[currentStyle].styleUrl,
      center: CEBU_CITY_BOUNDS.center,
      zoom: 12.5,
      pitch: is3DMode ? 45 : 15,
      bearing: 0,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    const setupLayers = () => {
      // 1. Add UP NOAH Hazard GeoJSON Source
      if (!map.getSource('up-noah-hazards')) {
        map.addSource('up-noah-hazards', {
          type: 'geojson',
          data: UP_NOAH_CEBU_HAZARD_GEOJSON as any,
        });

        // 100-Year Severe Hazard Layer (Apple Red)
        map.addLayer({
          id: 'hazard-100yr-fill',
          type: 'fill',
          source: 'up-noah-hazards',
          filter: ['==', ['get', 'hazard_level'], '100_year'],
          paint: { 'fill-color': '#FF3B30', 'fill-opacity': 0.3 },
        });
        map.addLayer({
          id: 'hazard-100yr-line',
          type: 'line',
          source: 'up-noah-hazards',
          filter: ['==', ['get', 'hazard_level'], '100_year'],
          paint: { 'line-color': '#FF3B30', 'line-width': 2 },
        });

        // 25-Year High Risk Layer (Apple Orange)
        map.addLayer({
          id: 'hazard-25yr-fill',
          type: 'fill',
          source: 'up-noah-hazards',
          filter: ['==', ['get', 'hazard_level'], '25_year'],
          paint: { 'fill-color': '#FF9500', 'fill-opacity': 0.25 },
        });
        map.addLayer({
          id: 'hazard-25yr-line',
          type: 'line',
          source: 'up-noah-hazards',
          filter: ['==', ['get', 'hazard_level'], '25_year'],
          paint: { 'line-color': '#FF9500', 'line-width': 1.5 },
        });

        // 5-Year Advisory Layer (Apple Yellow)
        map.addLayer({
          id: 'hazard-5yr-fill',
          type: 'fill',
          source: 'up-noah-hazards',
          filter: ['==', ['get', 'hazard_level'], '5_year'],
          paint: { 'fill-color': '#FFCC00', 'fill-opacity': 0.2 },
        });
        map.addLayer({
          id: 'hazard-5yr-line',
          type: 'line',
          source: 'up-noah-hazards',
          filter: ['==', ['get', 'hazard_level'], '5_year'],
          paint: { 'line-color': '#FFCC00', 'line-width': 1.5 },
        });
      }

      // 2. Add Road Network GeoJSON Source
      if (!map.getSource('cebu-roads')) {
        map.addSource('cebu-roads', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        map.addLayer({
          id: 'roads-passable',
          type: 'line',
          source: 'cebu-roads',
          filter: ['==', ['get', 'status'], 'passable'],
          paint: {
            'line-color': '#34C759',
            'line-width': 4,
            'line-opacity': 0.85,
          },
        });

        map.addLayer({
          id: 'roads-light-only',
          type: 'line',
          source: 'cebu-roads',
          filter: ['==', ['get', 'status'], 'light_vehicles_only'],
          paint: {
            'line-color': '#FF9500',
            'line-width': 5,
            'line-opacity': 0.9,
          },
        });

        map.addLayer({
          id: 'roads-impassable',
          type: 'line',
          source: 'cebu-roads',
          filter: ['==', ['get', 'status'], 'impassable'],
          paint: {
            'line-color': '#FF3B30',
            'line-width': 6,
            'line-dasharray': [2, 2],
            'line-opacity': 0.95,
          },
        });
      }

      setMapLoaded(true);
    };

    map.on('load', setupLayers);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Listen to Global FlyTo Events (from Omnibar Search)
  useEffect(() => {
    const handleFlyTo = (e: any) => {
      if (!mapRef.current || !e.detail) return;
      const { latitude, longitude, name, category } = e.detail;

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 16.5,
        pitch: 35,
        essential: true,
        duration: 2000,
      });

      // Clear previous target marker
      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
      }

      // Add a glowing target search pin
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.innerHTML = `
        <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#007AFF] opacity-75"></span>
        <div class="w-9 h-9 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-xs font-black shadow-xl border-2 border-white">
          🎯
        </div>
      `;

      const marker = new maplibregl.Marker(el)
        .setLngLat([longitude, latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 8px; min-width: 190px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #007AFF;">${category} LOCATION</span>
              <h4 style="margin: 3px 0 0 0; font-weight: 800; font-size: 14px; color:#1C1C1E;">${name}</h4>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #6C6C70;">GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</p>
            </div>
          `)
        )
        .addTo(mapRef.current);

      marker.togglePopup();
      targetMarkerRef.current = marker;
    };

    window.addEventListener('map:flyto', handleFlyTo);
    return () => window.removeEventListener('map:flyto', handleFlyTo);
  }, []);

  // Keyboard shortcut for ESC to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Handle resizing map canvas upon fullscreen toggle
  useEffect(() => {
    if (!mapRef.current) return;
    const timeout = setTimeout(() => {
      mapRef.current?.resize();
    }, 150);
    return () => clearTimeout(timeout);
  }, [isFullscreen]);

  // Toggle 3D Mode
  const toggle3DMode = () => {
    if (!mapRef.current) return;
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    mapRef.current.easeTo({
      pitch: next3D ? 50 : 15,
      duration: 1000,
    });
  };

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

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Add Shelter Markers
    shelters.forEach((shelter) => {
      if (!shelter.latitude || !shelter.longitude) return;

      const el = document.createElement('div');
      el.className =
        'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform bg-[#34C759]';
      el.innerHTML = '🏠';

      const marker = new maplibregl.Marker(el)
        .setLngLat([shelter.longitude, shelter.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 6px; min-width: 180px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #34C759;">${shelter.status || 'OPEN'} CENTER</span>
              <h4 style="margin: 2px 0 0 0; font-weight: 800; font-size: 13px; color:#1C1C1E;">${shelter.name}</h4>
              <p style="margin: 4px 0; font-size: 11px; color: #6C6C70;">Occupancy: <b style="color:#1C1C1E;">${shelter.current_occupancy || 0} / ${shelter.max_capacity || 100}</b></p>
              <p style="margin: 0; font-size: 10px; color: #8E8E93;">${shelter.address || 'Metro Cebu'}</p>
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
        ankle: '#34C759',
        knee: '#FFCC00',
        waist: '#FF9500',
        chest: '#FF3B30',
        above_head: '#AF52DE',
      };

      const color = colors[report.flood_depth_level] || '#FF3B30';

      const el = document.createElement('div');
      el.className =
        'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white cursor-pointer hover:scale-125 transition-transform';
      el.style.backgroundColor = color;
      el.innerHTML = '💧';

      const marker = new maplibregl.Marker(el)
        .setLngLat([report.longitude, report.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 6px; min-width: 190px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 10px; font-weight: 800; color: ${color}; text-transform: uppercase;">CITIZEN FLOOD REPORT</span>
                <span style="font-size: 9px; color: #8E8E93;">${new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h4 style="margin: 4px 0 2px 0; font-weight: 800; font-size: 13px; color:#1C1C1E;">Depth: ${report.flood_depth_level?.toUpperCase()}</h4>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #3A3A3C;">${report.description || 'No additional field notes.'}</p>
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [mapLoaded, reports, shelters]);

  return (
    <div
      ref={wrapperRef}
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-white rounded-none border-0'
          : `relative rounded-2xl overflow-hidden border border-[#E5E5EA] shadow-sm ${className}`
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Action Controls (Top Right HUD) */}
      <div className="absolute top-4 right-14 z-10 flex items-center gap-2">
        {/* 3D Elevation Mode Toggle */}
        <button
          onClick={toggle3DMode}
          title="Toggle 3D Elevation Terrain Mode"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md border text-xs font-extrabold transition-all shadow-md ${
            is3DMode
              ? 'bg-[#007AFF] text-white border-[#007AFF]'
              : 'bg-white/90 border-[#E5E5EA] text-[#1C1C1E] hover:bg-white'
          }`}
        >
          <Mountain className="w-4 h-4" />
          <span>{is3DMode ? '3D Active' : '3D View'}</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Expand to Fullscreen Map'}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-[#E5E5EA] text-[#1C1C1E] hover:bg-white hover:text-[#007AFF] shadow-md transition-all text-xs font-extrabold"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-[#007AFF]" />
              <span>Exit Fullscreen</span>
              <span className="text-[10px] text-[#8E8E93] ml-1 bg-[#F2F2F7] px-1.5 py-0.5 rounded">ESC</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-[#007AFF]" />
              <span>Fullscreen</span>
            </>
          )}
        </button>
      </div>

      {/* Apple Frosted Glass Layer Controls (Top Left HUD) */}
      {showHazardControls && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md border border-[#E5E5EA] rounded-2xl p-4 text-xs text-[#1C1C1E] shadow-lg space-y-2.5 z-10">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#8E8E93] pb-1 border-b border-[#F2F2F7]">
            <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
            UP NOAH Hazard Overlays
          </div>

          <label className="flex items-center justify-between gap-4 cursor-pointer hover:text-[#007AFF] text-[#1C1C1E] font-medium">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#FF3B30]" />
              100-Year Severe Flood
            </span>
            <input
              type="checkbox"
              checked={show100Year}
              onChange={(e) => setShow100Year(e.target.checked)}
              className="rounded text-[#007AFF] focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer hover:text-[#007AFF] text-[#1C1C1E] font-medium">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#FF9500]" />
              25-Year High Risk
            </span>
            <input
              type="checkbox"
              checked={show25Year}
              onChange={(e) => setShow25Year(e.target.checked)}
              className="rounded text-[#007AFF] focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer hover:text-[#007AFF] text-[#1C1C1E] font-medium">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#FFCC00]" />
              5-Year Advisory Zone
            </span>
            <input
              type="checkbox"
              checked={show5Year}
              onChange={(e) => setShow5Year(e.target.checked)}
              className="rounded text-[#007AFF] focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      )}
    </div>
  );
}
