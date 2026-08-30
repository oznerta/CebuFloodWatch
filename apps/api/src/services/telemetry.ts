import { HydrologicalSensorStation } from '@cebufloodwatch/shared';

// Runtime store for real IoT River Telemetry Stations
const SENSOR_STATIONS: HydrologicalSensorStation[] = [];

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

  const alert1 = reading.alert_level_1_meters || 1.5;
  const crit = reading.critical_overflow_meters || 2.2;
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
      station_name: reading.station_name || `Sensor Node ${stationId}`,
      river_basin: reading.river_basin || 'Cebu River Basin',
      barangay_name: reading.barangay_name || 'Cebu City',
      latitude: reading.latitude || 10.3157,
      longitude: reading.longitude || 123.8854,
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
