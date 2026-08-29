import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { COLORS } from '../constants/theme';
import { UP_NOAH_CEBU_HAZARD_GEOJSON } from '@cebufloodwatch/shared';

interface MobileMapProps {
  reports?: any[];
  shelters?: any[];
  showHazards?: boolean;
  style?: any;
}

export function MobileMap({
  reports = [],
  shelters = [],
  showHazards = true,
  style,
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
      background: #f8f9fa;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-popup-content-wrapper {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: #1c1c1e;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
      padding: 6px;
    }
    .leaflet-popup-tip {
      background: rgba(255, 255, 255, 0.95);
    }
    .apple-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease;
    }
    .apple-pin:hover {
      transform: scale(1.15);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([10.3180, 123.8980], 13);
    
    // Apple Maps style crisp Voyager light cartography
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const hazards = ${safeHazards};
    if (hazards && hazards.features) {
      L.geoJSON(hazards, {
        style: function(feature) {
          const color = feature.properties?.color || '#FF9500';
          return {
            color: color,
            fillColor: color,
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '3, 6'
          };
        },
        onEachFeature: function(feature, layer) {
          if (feature.properties) {
            layer.bindPopup('<div style="font-size:13px; font-weight:700; color:#1c1c1e;">' + (feature.properties.name || 'UP NOAH Hazard Zone') + '</div><div style="font-size:11px; color:#8e8e93; margin-top:2px;">Return Period: <b style="color:#ff9500;">' + (feature.properties.return_period || '25-Year') + '</b></div>');
          }
        }
      }).addTo(map);
    }

    const shelters = ${safeShelters};
    shelters.forEach(s => {
      if (s.latitude && s.longitude) {
        const icon = L.divIcon({
          className: 'apple-pin',
          html: '<div style="background:#34C759; width:30px; height:30px; border-radius:15px; border:2.5px solid #ffffff; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:14px; box-shadow: 0 4px 12px rgba(52,199,89,0.4);">🏠</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        L.marker([s.latitude, s.longitude], { icon })
          .bindPopup('<div style="font-size:14px; font-weight:700; color:#1c1c1e;">' + s.name + '</div><div style="font-size:11px; margin-top:4px;"><span style="background:#EBF9EE; color:#34C759; padding:2px 8px; border-radius:10px; font-weight:700; font-size:10px;">' + (s.status || 'OPEN').toUpperCase() + '</span> &bull; <b style="color:#1c1c1e;">' + (s.current_occupancy || 0) + '/' + (s.max_capacity || 100) + ' evacuees</b></div>')
          .addTo(map);
      }
    });

    const reports = ${safeReports};
    reports.forEach(r => {
      if (r.latitude && r.longitude) {
        const color = r.flood_depth_level === 'chest' || r.flood_depth_level === 'above_head' ? '#FF3B30' : r.flood_depth_level === 'waist' ? '#FF9500' : '#FFCC00';
        const icon = L.divIcon({
          className: 'apple-pin',
          html: '<div style="background:' + color + '; width:28px; height:28px; border-radius:14px; border:2.5px solid #ffffff; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:13px; box-shadow: 0 4px 12px ' + color + '66;">💧</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker([r.latitude, r.longitude], { icon })
          .bindPopup('<div style="font-size:13px; font-weight:700; color:#1c1c1e;">Barangay ' + (r.barangay_name || 'Cebu Area') + '</div><div style="font-size:11px; color:#8e8e93; margin-top:2px;">Water Depth: <b style="color:' + color + '; font-weight:800;">' + (r.flood_depth_level || 'Knee').toUpperCase() + '</b></div><div style="font-size:12px; color:#3a3a3c; margin-top:4px; line-height:1.4;">' + (r.description || '') + '</div>')
          .addTo(map);
      }
    });
  </script>
</body>
</html>
    `;
  }, [reports, shelters, showHazards]);

  return (
    <View style={[styles.container, style]}>
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
    height: '100%',
    backgroundColor: '#F2F2F7',
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
