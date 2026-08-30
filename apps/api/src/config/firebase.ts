import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp: admin.app.App | null = null;

export function initFirebaseAdmin(): admin.app.App | null {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`🔥 Firebase Admin SDK successfully initialized for project '${serviceAccount.project_id}'`);
      return firebaseApp;
    }

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log(`🔥 Firebase Admin SDK initialized from environment variables for project '${process.env.FIREBASE_PROJECT_ID}'`);
      return firebaseApp;
    }

    console.log('ℹ️ Firebase Admin SDK running in simulated mode (no service account found).');
    return null;
  } catch (err: any) {
    console.warn('⚠️ Failed to initialize Firebase Admin SDK:', err.message);
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
