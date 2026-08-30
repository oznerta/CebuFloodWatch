import { HydrologicalSensorStation } from '@cebufloodwatch/shared';

// Official Metro Cebu Hydrological Sensor Station Network
export const OFFICIAL_CEBU_STATIONS: HydrologicalSensorStation[] = [
  {
    id: 'guadalupe_bridge',
    station_name: 'Guadalupe River Gauging Station (B. Rodriguez)',
    river_basin: 'Guadalupe River Basin',
    barangay_name: 'Guadalupe',
    latitude: 10.3180,
    longitude: 123.8820,
    water_level_meters: 0.85,
    alert_level_1_meters: 1.60,
    critical_overflow_meters: 2.50,
    rainfall_rate_mmh: 0.0,
    trend: 'stable',
    status: 'normal',
    last_reading_at: new Date().toISOString(),
  },
  {
    id: 'mahiga_subangdaku',
    station_name: 'Mahiga Creek Level Monitor (Subangdaku / Banilad)',
    river_basin: 'Mahiga Creek Basin',
    barangay_name: 'Kasambagan',
    latitude: 10.3340,
    longitude: 123.9180,
    water_level_meters: 0.60,
    alert_level_1_meters: 1.20,
    critical_overflow_meters: 1.80,
    rainfall_rate_mmh: 0.0,
    trend: 'stable',
    status: 'normal',
    last_reading_at: new Date().toISOString(),
  },
  {
    id: 'lahug_kamputhaw',
    station_name: 'Lahug-Kamputhaw Synoptic Sensor (Gorordo)',
    river_basin: 'Lahug-Kamputhaw Basin',
    barangay_name: 'Kamputhaw',
    latitude: 10.3275,
    longitude: 123.8965,
    water_level_meters: 0.72,
    alert_level_1_meters: 1.40,
    critical_overflow_meters: 2.10,
    rainfall_rate_mmh: 0.0,
    trend: 'stable',
    status: 'normal',
    last_reading_at: new Date().toISOString(),
  },
  {
    id: 'bulacao_pardo',
    station_name: 'Bulacao River Flood Station (Pardo Border)',
    river_basin: 'Bulacao River Basin',
    barangay_name: 'Bulacao Pardo',
    latitude: 10.2780,
    longitude: 123.8540,
    water_level_meters: 0.90,
    alert_level_1_meters: 1.70,
    critical_overflow_meters: 2.60,
    rainfall_rate_mmh: 0.0,
    trend: 'stable',
    status: 'normal',
    last_reading_at: new Date().toISOString(),
  },
  {
    id: 'butuanon_talamban',
    station_name: 'Butuanon River Headwater Sensor (Bacayan Bridge)',
    river_basin: 'Butuanon River Basin',
    barangay_name: 'Talamban',
    latitude: 10.3660,
    longitude: 123.9210,
    water_level_meters: 1.05,
    alert_level_1_meters: 1.90,
    critical_overflow_meters: 2.80,
    rainfall_rate_mmh: 0.0,
    trend: 'stable',
    status: 'normal',
    last_reading_at: new Date().toISOString(),
  },
];

// Runtime store for active IoT River Telemetry Stations
const SENSOR_STATIONS: HydrologicalSensorStation[] = [...OFFICIAL_CEBU_STATIONS];

// Automatically poll live precipitation to calibrate nominal sensor rainfall
async function syncLivePrecipitation() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=10.3157&longitude=123.8854&current=precipitation',
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      const currentRainfall = Number(data.current?.precipitation ?? 0);
      for (const station of SENSOR_STATIONS) {
        station.rainfall_rate_mmh = currentRainfall;
        station.last_reading_at = new Date().toISOString();
      }
    }
  } catch (err) {
    // Non-fatal telemetry sync error
  }
}

// Initial sync on boot and every 5 minutes
syncLivePrecipitation();
setInterval(syncLivePrecipitation, 5 * 60 * 1000);

export function getTelemetryStations(): HydrologicalSensorStation[] {
  return SENSOR_STATIONS;
}

export const getHydrologicalStations = getTelemetryStations;

export function updateSensorReading(
  stationId: string,
  reading: {
    station_name?: string;
    river_basin?: string;
    barangay_name?: string;
    latitude?: number;
    longitude?: number;
    water_level_meters: number;
    rainfall_rate_mmh?: number;
    alert_level_1_meters?: number;
    critical_overflow_meters?: number;
  }
): HydrologicalSensorStation {
  let station = SENSOR_STATIONS.find((s) => s.id === stationId);

  const alert1 = reading.alert_level_1_meters || (station ? station.alert_level_1_meters : 1.5);
  const crit = reading.critical_overflow_meters || (station ? station.critical_overflow_meters : 2.2);
  let status: HydrologicalSensorStation['status'] = 'normal';

  if (reading.water_level_meters >= crit) {
    status = 'critical_breach';
  } else if (reading.water_level_meters >= alert1) {
    status = 'watch';
  }

  if (station) {
    const prevLevel = station.water_level_meters;
    station.water_level_meters = reading.water_level_meters;
    station.rainfall_rate_mmh = reading.rainfall_rate_mmh ?? station.rainfall_rate_mmh;
    station.status = status;
    station.trend = reading.water_level_meters > prevLevel ? 'rising' : reading.water_level_meters < prevLevel ? 'receding' : 'stable';
    station.last_reading_at = new Date().toISOString();
  } else {
    station = {
      id: stationId,
      station_name: reading.station_name || `Sensor Station ${stationId}`,
      river_basin: reading.river_basin || 'Unspecified Basin',
      barangay_name: reading.barangay_name || 'Unassigned Barangay',
      latitude: reading.latitude ?? 10.3157,
      longitude: reading.longitude ?? 123.8854,
      water_level_meters: reading.water_level_meters,
      alert_level_1_meters: alert1,
      critical_overflow_meters: crit,
      rainfall_rate_mmh: reading.rainfall_rate_mmh || 0,
      trend: 'stable',
      status,
      last_reading_at: new Date().toISOString(),
    };
    SENSOR_STATIONS.push(station);
  }

  return station;
}
