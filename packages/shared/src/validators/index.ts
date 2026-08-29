import { z } from 'zod';

export const floodDepthEnum = z.enum(['ankle', 'knee', 'waist', 'chest', 'above_head']);
export const reportStatusEnum = z.enum(['pending', 'verified', 'resolved', 'rejected']);
export const shelterStatusEnum = z.enum(['open', 'full', 'closed']);
export const userRoleEnum = z.enum(['admin', 'barangay_focal', 'first_responder', 'citizen']);
export const alertSeverityEnum = z.enum(['advisory', 'watch', 'warning', 'critical']);
export const alertStatusEnum = z.enum(['draft', 'approved', 'published', 'archived']);

// Citizen Report submission schema
export const createReportSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  flood_depth_level: floodDepthEnum,
  description: z.string().max(1000).optional().default(''),
  photo_url: z.string().url().nullable().optional(),
  barangay_id: z.string().uuid().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// Evacuation Center update schema
export const updateShelterSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  address: z.string().min(5).max(255).optional(),
  max_capacity: z.number().int().positive().optional(),
  current_occupancy: z.number().int().min(0).optional(),
  status: shelterStatusEnum.optional(),
  supply_notes: z.string().max(1000).nullable().optional(),
  contact_person: z.string().max(100).nullable().optional(),
  contact_number: z.string().max(30).nullable().optional(),
});

export type UpdateShelterInput = z.infer<typeof updateShelterSchema>;

// Road Closure Toggle schema
export const toggleRoadBlockSchema = z.object({
  is_blocked: z.boolean(),
  block_reason: z.string().max(500).nullable().optional(),
});

export type ToggleRoadBlockInput = z.infer<typeof toggleRoadBlockSchema>;

// AI Alert Drafter Input schema
export const draftAlertSchema = z.object({
  raw_notes: z.string().min(5).max(2000),
  barangay_id: z.string().uuid().nullable().optional(),
  severity_hint: alertSeverityEnum.optional(),
});

export type DraftAlertInput = z.infer<typeof draftAlertSchema>;

// Publish Alert schema
export const publishAlertSchema = z.object({
  title_en: z.string().min(3).max(200),
  title_tl: z.string().min(3).max(200),
  body_en: z.string().min(10).max(1000),
  body_tl: z.string().min(10).max(1000),
  severity: alertSeverityEnum,
  barangay_id: z.string().uuid().nullable().optional(),
});

export type PublishAlertInput = z.infer<typeof publishAlertSchema>;

// Safety Broadcast schema
export const safetyBroadcastSchema = z.object({
  status: z.enum(['safe', 'needs_assistance']),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  message: z.string().max(300).optional(),
});

export type SafetyBroadcastInput = z.infer<typeof safetyBroadcastSchema>;
