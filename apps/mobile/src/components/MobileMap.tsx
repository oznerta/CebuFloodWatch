import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { COLORS } from '../constants/theme';
import { UP_NOAH_CEBU_HAZARD_GEOJSON } from '@cebufloodwatch/shared';

interface MobileMapProps {
  reports?: any[];
  shelters?: any[];
  height?: number;
  showHazards?: boolean;
}

export function MobileMap({
  reports = [],
  shelters = [],
  height = 320,
  showHazards = true,
}: MobileMapProps) {
  const mapHtml = useMemo(() => {
    const safeReports = JSON.stringify(reports);
    const safeShelters = JSON.stringify(shelters);
    const safeHazards = showHazards ? JSON.stringify(UP_NOAH_CEBU_HAZARD_GEOJSON) : 'null';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map {
      margin: 0; padding: 0; width: 100%; height: 100%;
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-popup-content-wrapper {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 4px;
    }
    .leaflet-popup-tip {
      background: #1e293b;
    }
    .custom-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([10.3157, 123.8950], 13);
    
    // Dark matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const hazards = ${safeHazards};
    if (hazards && hazards.features) {
      L.geoJSON(hazards, {
        style: function(feature) {
          const color = feature.properties?.color || '#f5820d';
          return {
            color: color,
            fillColor: color,
            fillOpacity: 0.35,
            weight: 1.5
          };
        },
        onEachFeature: function(feature, layer) {
          if (feature.properties) {
            layer.bindPopup('<b>' + (feature.properties.name || 'Flood Hazard Zone') + '</b><br/>Return Period: ' + (feature.properties.return_period || '25-Year'));
          }
        }
      }).addTo(map);
    }

    const shelters = ${safeShelters};
    shelters.forEach(s => {
      if (s.latitude && s.longitude) {
        const icon = L.divIcon({
          className: 'custom-pin',
          html: '<div style="background:#10b981; width:24px; height:24px; border-radius:12px; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">🏠</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker([s.latitude, s.longitude], { icon })
          .bindPopup('<b>' + s.name + '</b><br/>Status: <span style="color:#34d399; font-weight:bold;">' + (s.status || 'OPEN').toUpperCase() + '</span><br/>Occupancy: ' + (s.current_occupancy || 0) + '/' + (s.max_capacity || 100))
          .addTo(map);
      }
    });

    const reports = ${safeReports};
    reports.forEach(r => {
      if (r.latitude && r.longitude) {
        const color = r.flood_depth_level === 'chest' || r.flood_depth_level === 'above_head' ? '#ef4444' : r.flood_depth_level === 'waist' ? '#f5820d' : '#facc15';
        const icon = L.divIcon({
          className: 'custom-pin',
          html: '<div style="background:' + color + '; width:22px; height:22px; border-radius:11px; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:bold;">💧</div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        L.marker([r.latitude, r.longitude], { icon })
          .bindPopup('<b>Barangay ' + (r.barangay_name || 'Area') + '</b><br/>Depth: <b style="color:' + color + '">' + (r.flood_depth_level || 'Knee').toUpperCase() + '</b><br/>' + (r.description || ''))
          .addTo(map);
      }
    });
  </script>
</body>
</html>
    `;
  }, [reports, shelters, showHazards]);

  return (
    <View style={[styles.container, { height }]}>
      {Platform.OS === 'web' ? (
        <iframe
          title="Cebu Flood Map"
          srcDoc={mapHtml}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <View style={styles.nativeFallback}>
          <Text style={styles.fallbackText}>Metro Cebu Live Spatial Map</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
