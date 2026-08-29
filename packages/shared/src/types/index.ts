/**
 * CebuFloodWatch — Core Domain Types
 */

export type UserRole = 'admin' | 'barangay_focal' | 'first_responder' | 'citizen';

export type RiskLevel = 'low' | 'medium' | 'high' | 'severe';

export type FloodDepth = 'ankle' | 'knee' | 'waist' | 'chest' | 'above_head';

export type ReportStatus = 'pending' | 'verified' | 'resolved' | 'rejected';

export type ShelterStatus = 'open' | 'full' | 'closed';

export type AlertSeverity = 'advisory' | 'watch' | 'warning' | 'critical';

export type AlertStatus = 'draft' | 'approved' | 'published' | 'archived';

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  full_name: string;
  role: UserRole;
  barangay_id: string | null;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Barangay {
  id: string;
  name: string;
  psgc_code: string;
  risk_level: RiskLevel;
  center_lat: number;
  center_lon: number;
  created_at: string;
}

export interface CitizenReport {
  id: string;
  user_id: string | null;
  barangay_id: string;
  incident_cluster_id?: string | null;
  latitude: number;
  longitude: number;
  flood_depth_level: FloodDepth;
  description: string;
  photo_url: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  user_name?: string;
  barangay_name?: string;
}

export interface IncidentCluster {
  id: string;
  barangay_id: string;
  centroid_lat: number;
  centroid_lon: number;
  summary_en: string;
  summary_tl: string;
  confidence_score: number;
  report_count: number;
  status: 'active' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface EvacuationCenter {
  id: string;
  barangay_id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  max_capacity: number;
  current_occupancy: number;
  status: ShelterStatus;
  supply_notes: string | null;
  contact_person: string | null;
  contact_number: string | null;
  created_at: string;
  updated_at: string;
  barangay_name?: string;
}

export interface RoadSegment {
  id: string;
  barangay_id: string;
  name: string;
  coordinates: [number, number][]; // LineString [[lon, lat], ...]
  is_blocked: boolean;
  block_reason: string | null;
  blocked_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  barangay_name?: string;
}

export interface CorridorStep {
  instruction: string;
  distance_meters: number;
  landmark?: string;
}

export interface EvacuationCorridor {
  id: string;
  origin_barangay_id: string;
  destination_shelter_id: string;
  route_name: string;
  coordinates: [number, number][];
  corridor_steps: CorridorStep[];
  is_active: boolean;
  is_penalized: boolean;
  shelter_name?: string;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  author_id: string;
  barangay_id: string | null; // null = citywide
  severity: AlertSeverity;
  title_en: string;
  title_tl: string;
  body_en: string;
  body_tl: string;
  raw_prompt_input?: string | null;
  is_ai_drafted: boolean;
  status: AlertStatus;
  fcm_message_id?: string | null;
  published_at: string | null;
  created_at: string;
  author_name?: string;
  barangay_name?: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string;
  relationship: string;
  created_at: string;
}

export interface SafetyBroadcast {
  id: string;
  user_id: string;
  status: 'safe' | 'needs_assistance';
  latitude?: number;
  longitude?: number;
  message?: string;
  broadcasted_at: string;
  user_name?: string;
}

export interface DashboardStats {
  active_reports_count: number;
  open_shelters_count: number;
  total_shelter_capacity: number;
  total_shelter_occupancy: number;
  blocked_roads_count: number;
  active_alerts_count: number;
}
