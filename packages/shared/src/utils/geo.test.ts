import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateHaversineDistance, formatDistance, CEBU_CITY_BOUNDS } from './geo.js';
import { hasPermission } from '../constants/rbac.js';
import { createReportSchema } from '../validators/index.js';

describe('CebuFloodWatch Core Logic Tests', () => {
  it('calculates Haversine spatial distance accurately', () => {
    // Cebu City Hall (10.2931, 123.9018) to Mabolo Church (10.3265, 123.9180)
    const dist = calculateHaversineDistance(10.2931, 123.9018, 10.3265, 123.918);
    // Expected ~4.0km (4000m +- 500m)
    assert.ok(dist > 3500 && dist < 4500, `Distance was ${dist}m, expected ~4000m`);
    assert.strictEqual(formatDistance(dist), '4.1 km');
  });

  it('validates spatial bounds for Metro Cebu geofence', () => {
    const lat = 10.3157;
    const lon = 123.8854;
    const isInside =
      lat >= CEBU_CITY_BOUNDS.minLat &&
      lat <= CEBU_CITY_BOUNDS.maxLat &&
      lon >= CEBU_CITY_BOUNDS.minLon &&
      lon <= CEBU_CITY_BOUNDS.maxLon;

    assert.strictEqual(isInside, true);
  });

  it('enforces RBAC permission hierarchy correctly', () => {
    // Admin has global rights
    assert.strictEqual(hasPermission('admin', 'publish_alerts'), true);
    assert.strictEqual(hasPermission('admin', 'manage_road_closures'), true);
    assert.strictEqual(hasPermission('admin', 'export_compliance'), true);

    // Barangay Focal has localized rights but cannot publish global citywide alerts without admin signoff
    assert.strictEqual(hasPermission('barangay_focal', 'draft_alerts'), true);
    assert.strictEqual(hasPermission('barangay_focal', 'publish_alerts'), false);

    // Citizen can only submit reports
    assert.strictEqual(hasPermission('citizen', 'submit_report'), true);
    assert.strictEqual(hasPermission('citizen', 'manage_road_closures'), false);
    assert.strictEqual(hasPermission('citizen', 'publish_alerts'), false);
  });

  it('validates report creation schemas with Zod', () => {
    const validReport = {
      latitude: 10.3157,
      longitude: 123.8854,
      flood_depth_level: 'knee',
      description: 'Creek overflowing on driveway',
    };
    const parsed = createReportSchema.safeParse(validReport);
    assert.strictEqual(parsed.success, true);

    const invalidReport = {
      latitude: 99.0, // Out of range
      longitude: 123.8854,
      flood_depth_level: 'invalid_depth',
    };
    const parsedInvalid = createReportSchema.safeParse(invalidReport);
    assert.strictEqual(parsedInvalid.success, false);
  });
});
