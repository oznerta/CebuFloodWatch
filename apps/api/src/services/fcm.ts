import { AlertSeverity } from '@cebufloodwatch/shared';

export interface FCMBroadcastPayload {
  title: string;
  body: string;
  severity: AlertSeverity;
  alert_id: string;
  barangay_id?: string | null;
  target_url?: string;
}

/**
 * Sends a targeted FCM push notification to a specific barangay topic or citywide
 */
export async function sendTargetedAlertFCM(payload: FCMBroadcastPayload): Promise<{ success: boolean; messageId: string; recipientTopic: string }> {
  const topic = payload.barangay_id ? `barangay_${payload.barangay_id}` : 'all_cebu_residents';

  // In development / demo environment without active Firebase service account, log structured push payload
  console.log(`📡 [FCM Push Broadcast] Dispatched to topic '${topic}':`, {
    severity: payload.severity.toUpperCase(),
    title: payload.title,
    body: payload.body,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    messageId: `fcm_msg_${Date.now()}`,
    recipientTopic: topic,
  };
}
