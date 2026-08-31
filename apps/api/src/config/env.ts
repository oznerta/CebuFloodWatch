import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: required('DATABASE_URL'),
  geminiApiKey: process.env.GEMINI_API_KEY,
  webClientUrl: process.env.WEB_CLIENT_URL || 'http://localhost:3000',
  adminInitialEmail: required('ADMIN_INITIAL_EMAIL'),
  adminInitialPassword: required('ADMIN_INITIAL_PASSWORD'),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
};
