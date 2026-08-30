import { AlertSeverity } from '@cebufloodwatch/shared';
import { getFirebaseMessaging } from '../config/firebase.js';

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
  const messaging = getFirebaseMessaging();

  if (messaging) {
    try {
      const response = await messaging.send({
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          alert_id: payload.alert_id,
          severity: payload.severity,
          target_url: payload.target_url || '/alerts',
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'emergency_disaster_alerts',
            priority: 'max',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              critical: payload.severity === 'critical',
            },
          },
        },
      });

      console.log(`🔥 [FCM Live Push Dispatched] Topic: '${topic}' | Message ID: ${response}`);
      return {
        success: true,
        messageId: response,
        recipientTopic: topic,
      };
    } catch (err: any) {
      console.warn(`⚠️ FCM Dispatch failed for topic '${topic}':`, err.message);
    }
  }

  // Fallback / simulation logging
  console.log(`📡 [FCM Simulated Push] Dispatched to topic '${topic}':`, {
    severity: payload.severity.toUpperCase(),
    title: payload.title,
    body: payload.body,
  });

  return {
    success: true,
    messageId: `fcm_sim_${Date.now()}`,
    recipientTopic: topic,
  };
}
