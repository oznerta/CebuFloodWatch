import admin from 'firebase-admin';
import { config } from './env.js';

let firebaseApp: admin.app.App | null = null;

/**
 * 12-Factor Compliant Firebase Admin SDK Initialization
 * Strictly reads secrets from environment variables (process.env.FIREBASE_*)
 */
export function initFirebaseAdmin(): admin.app.App | null {
  if (firebaseApp) return firebaseApp;

  try {
    const { projectId, clientEmail, privateKey } = config.firebase;

    if (projectId && clientEmail && privateKey) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      console.log(`🔥 [Firebase Admin SDK] Successfully initialized from environment variables for project '${projectId}'`);
      return firebaseApp;
    }

    console.log('ℹ️ [Firebase Admin SDK] Running in simulated mode (no environment variables configured).');
    return null;
  } catch (err: any) {
    console.warn('⚠️ [Firebase Admin SDK] Failed to initialize from environment:', err.message);
    return null;
  }
}

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  const app = initFirebaseAdmin();
  if (app) {
    return admin.messaging(app);
  }
  return null;
}
