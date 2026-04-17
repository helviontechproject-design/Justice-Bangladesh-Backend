import admin from 'firebase-admin';
import { envVars } from './env';

const getFirebasePrivateKey = (): string => {
  // Prefer Base64-encoded key (FIREBASE_PRIVATE_KEY_BASE64) to avoid env encoding issues
  const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (base64Key) {
    return Buffer.from(base64Key, 'base64').toString('utf8');
  }
  // Fallback: raw key with \n replacement
  const raw = process.env.FIREBASE_PRIVATE_KEY ?? '';
  return raw.replace(/\\n/g, '\n');
};

// Initialize Firebase Admin SDK
try {
  const firebaseCredentials = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: getFirebasePrivateKey(),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI ?? 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.FIREBASE_TOKEN_URI ?? 'https://oauth2.googleapis.com/token',
  };

  admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials as any),
  });

  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error);
}

// Get messaging service
const messaging = admin.messaging();

export { admin, messaging };
