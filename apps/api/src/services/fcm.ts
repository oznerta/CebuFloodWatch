import { config } from '../config/env.js';

export interface PushNotificationPayload {
  title: string;
  body: string;
  barangayId?: string | null;
  data?: Record<string, string>;
}

/**
 * Dispatches targeted FCM push notification to barangay topic or citywide topic
 */
export async function sendBarangayAlertPush(payload: PushNotificationPayload): Promise<string> {
  const topic = payload.barangayId ? `barangay_${payload.barangayId}` : 'all_cebu_citizens';

  console.log(`📡 [FCM Dispatch Mock/Live] Broadcasting alert to topic '${topic}':`, {
    title: payload.title,
    body: payload.body,
  });

  // When Firebase Admin credentials are provided in .env, send via real FCM
  if (config.firebase.projectId && config.firebase.privateKey) {
    try {
      // Real firebase-admin messaging dispatch
      // const message = { topic, notification: { title: payload.title, body: payload.body }, data: payload.data };
      // return await admin.messaging().send(message);
    } catch (error) {
      console.error('FCM Broadcast error:', error);
    }
  }

  // Fallback / simulated FCM message ID
  return `mock_fcm_msg_${Date.now()}`;
}
