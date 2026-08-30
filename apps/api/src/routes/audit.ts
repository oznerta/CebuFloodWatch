import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { recomputeIncidentClusters } from '../services/clustering.js';
import { DisasterAuditExport } from '@cebufloodwatch/shared';

export const auditRouter = Router();

// GET /api/v1/audit/export - Generate structured compliance audit export for OCD-7 & CDRRMO
auditRouter.get(
  '/export',
  authenticate,
  requireRole('admin', 'barangay_focal'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const format = (req.query.format as string) || 'json';

      // Aggregate live data from PostGIS tables
      const [reportsRes, sheltersRes, alertsRes, roadsRes, clusters] = await Promise.all([
        query(`
          SELECT 
            r.id, r.user_id, r.barangay_id, b.name as barangay_name,
            r.flood_depth_level, r.description, r.photo_url, r.status,
            r.created_at, r.updated_at
          FROM public.citizen_reports r
          LEFT JOIN public.barangays b ON r.barangay_id = b.id
          ORDER BY r.created_at DESC
          LIMIT 200
        `),
        query(`
          SELECT 
            e.id, e.barangay_id, b.name as barangay_name, e.name, e.address,
            e.max_capacity, e.current_occupancy, e.status, e.supply_notes,
            e.contact_person, e.contact_number, e.created_at, e.updated_at
          FROM public.evacuation_centers e
          LEFT JOIN public.barangays b ON e.barangay_id = b.id
          ORDER BY e.name ASC
        `),
        query(`
          SELECT 
            a.id, a.barangay_id, b.name as barangay_name, a.severity,
            a.title_en, a.title_tl, a.body_en, a.body_tl, a.status,
            a.published_at, a.created_at
          FROM public.alerts a
          LEFT JOIN public.barangays b ON a.barangay_id = b.id
          ORDER BY a.created_at DESC
          LIMIT 100
        `),
        query(`
          SELECT 
            r.id, r.barangay_id, b.name as barangay_name, r.name,
            r.is_blocked, 
            CASE WHEN r.is_blocked THEN 'impassable' ELSE 'passable' END as status,
            r.block_reason, r.blocked_at, r.created_at, r.updated_at
          FROM public.road_segments r
          LEFT JOIN public.barangays b ON r.barangay_id = b.id
          ORDER BY r.name ASC
        `),
        recomputeIncidentClusters(),
      ]);

      const allReports = reportsRes.rows;
      const verifiedReports = allReports.filter((r) => r.status === 'verified');
      const shelters = sheltersRes.rows;
      const alerts = alertsRes.rows;
      const roads = roadsRes.rows;

      const auditPayload: DisasterAuditExport = {
        export_timestamp: new Date().toISOString(),
        jurisdiction: 'Metro Cebu (Cebu City, Mandaue, Talisay)',
        reporting_agency: 'Cebu Disaster Risk Reduction & Management Office (CDRRMO) / OCD-7',
        audit_summary: {
          total_citizen_reports: allReports.length,
          verified_flood_events: verifiedReports.length,
          total_incident_clusters: clusters.length,
          active_evacuation_centers: shelters.filter((s: any) => s.status === 'open').length,
          total_hosted_evacuees: shelters.reduce((acc: number, s: any) => acc + (s.current_occupancy || 0), 0),
          published_emergency_alerts: alerts.filter((a: any) => a.status === 'published').length,
          blocked_road_corridors: roads.filter((r: any) => r.is_blocked === true).length,
        },
        incident_clusters: clusters,
        verified_reports: verifiedReports,
        evacuation_centers: shelters,
        alerts: alerts,
        road_blockages: roads,
      };

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="cebufloodwatch_ocd7_audit.csv"');
        const csvLines = [
          'Record Type,ID,Location/Name,Severity/Status,Details,Timestamp',
          ...clusters.map((c) => `Incident Cluster,${c.id},${c.barangay_name || 'Cebu Area'},${c.max_depth_level},"${(c.summary_description || '').replace(/"/g, '""')}",${c.last_reported_at}`),
          ...shelters.map((s: any) => `Evacuation Center,${s.id},"${(s.name || '').replace(/"/g, '""')}",${s.status},Occupancy: ${s.current_occupancy || 0}/${s.max_capacity || 0},${s.updated_at || s.created_at || new Date().toISOString()}`),
          ...alerts.map((a: any) => `Emergency Alert,${a.id},${a.barangay_name || 'Citywide'},${a.severity},"${(a.title_en || '').replace(/"/g, '""')}",${a.published_at || a.created_at}`),
          ...roads.map((r: any) => `Road Corridor,${r.id},"${(r.name || '').replace(/"/g, '""')}",${r.status},"${(r.block_reason || 'Open').replace(/"/g, '""')}",${r.updated_at || r.created_at}`),
        ];
        res.send(csvLines.join('\n'));
        return;
      }

      res.setHeader('Content-Disposition', 'attachment; filename="cebufloodwatch_ocd7_audit.json"');
      res.json({
        success: true,
        data: auditPayload,
      });
    } catch (error) {
      next(error);
    }
  }
);

