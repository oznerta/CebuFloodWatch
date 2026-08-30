import { query } from '../config/db.js';
import { FloodDepth } from '@cebufloodwatch/shared';
import { getIO } from './socket.js';

const DEPTH_SEVERITY_ORDER: Record<FloodDepth, number> = {
  ankle: 1,
  knee: 2,
  waist: 3,
  chest: 4,
  above_head: 5,
};

export interface IncidentClusterSummary {
  id: string;
  barangay_id: string;
  barangay_name: string;
  report_count: number;
  max_depth_level: FloodDepth;
  centroid_lat: number;
  centroid_lng: number;
  summary_description: string;
  status: 'active' | 'responding' | 'resolved';
  first_reported_at: string;
  last_reported_at: string;
  reports?: any[];
}

/**
 * Recomputes spatial proximity clusters (150m threshold) across active/pending reports.
 */
export async function recomputeIncidentClusters(): Promise<IncidentClusterSummary[]> {
  try {
    // 1. Fetch unclustered or active reports from PostGIS within recent 24h
    const sql = `
      SELECT 
        r.id, r.barangay_id, b.name as barangay_name,
        r.flood_depth_level, r.description, r.photo_url,
        ST_Y(r.location_geom) as latitude,
        ST_X(r.location_geom) as longitude,
        r.created_at, r.status
      FROM citizen_reports r
      LEFT JOIN barangays b ON r.barangay_id = b.id
      WHERE r.status != 'rejected'
        AND r.created_at >= NOW() - interval '24 hours'
      ORDER BY r.created_at DESC
    `;

    const reportsRes = await query(sql);
    const reports = reportsRes.rows;

    if (reports.length === 0) return getFallbackClusters();

    // Group reports by spatial proximity (< 150m) using simple greedy clustering
    const clusters: IncidentClusterSummary[] = [];
    const visited = new Set<string>();

    for (const rep of reports) {
      if (visited.has(rep.id)) continue;

      const group = [rep];
      visited.add(rep.id);

      for (const other of reports) {
        if (visited.has(other.id)) continue;

        // Haversine distance check
        const dist = calculateDistanceMeters(
          rep.latitude,
          rep.longitude,
          other.latitude,
          other.longitude
        );

        if (dist <= 150) {
          group.push(other);
          visited.add(other.id);
        }
      }

      // Compute cluster metrics
      let maxDepth: FloodDepth = 'ankle';
      let maxDepthVal = 0;
      let totalLat = 0;
      let totalLng = 0;

      group.forEach((item) => {
        totalLat += item.latitude;
        totalLng += item.longitude;
        const depthVal = DEPTH_SEVERITY_ORDER[item.flood_depth_level as FloodDepth] || 1;
        if (depthVal > maxDepthVal) {
          maxDepthVal = depthVal;
          maxDepth = item.flood_depth_level as FloodDepth;
        }
      });

      const centroidLat = totalLat / group.length;
      const centroidLng = totalLng / group.length;

      const summaryDescription =
        group.length > 1
          ? `Consolidated incident from ${group.length} citizen reports. Peak flood depth reached ${maxDepth.toUpperCase()}. Primary reports indicate: "${group[0].description}".`
          : group[0].description || `Citizen reported flood depth: ${maxDepth}.`;

      clusters.push({
        id: `cluster_${rep.id}`,
        barangay_id: rep.barangay_id || null,
        barangay_name: rep.barangay_name || 'Unassigned Area',
        report_count: group.length,
        max_depth_level: maxDepth,
        centroid_lat: centroidLat,
        centroid_lng: centroidLng,
        summary_description: summaryDescription,
        status: 'active',
        first_reported_at: group[group.length - 1].created_at,
        last_reported_at: group[0].created_at,
        reports: group,
      });
    }

    return clusters;
  } catch (error) {
    return getFallbackClusters();
  }
}

export function getFallbackClusters(): IncidentClusterSummary[] {
  return [];
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
