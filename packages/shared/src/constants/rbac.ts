import { UserRole } from '../types/index.js';

export type ActionPermission =
  | 'view_dashboard'
  | 'submit_report'
  | 'manage_road_closures'
  | 'update_shelter_status'
  | 'draft_alerts'
  | 'publish_alerts'
  | 'manage_users'
  | 'view_all_barangays'
  | 'export_compliance';

export const RBAC_PERMISSIONS_MATRIX: Record<UserRole, ActionPermission[]> = {
  admin: [
    'view_dashboard',
    'submit_report',
    'manage_road_closures',
    'update_shelter_status',
    'draft_alerts',
    'publish_alerts',
    'manage_users',
    'view_all_barangays',
    'export_compliance',
  ],
  barangay_focal: [
    'view_dashboard',
    'submit_report',
    'manage_road_closures',
    'update_shelter_status',
    'draft_alerts',
  ],
  first_responder: [
    'view_dashboard',
    'submit_report',
    'update_shelter_status',
  ],
  citizen: [
    'submit_report',
  ],
};

export function hasPermission(role: UserRole, permission: ActionPermission): boolean {
  const permissions = RBAC_PERMISSIONS_MATRIX[role] || [];
  return permissions.includes(permission);
}
