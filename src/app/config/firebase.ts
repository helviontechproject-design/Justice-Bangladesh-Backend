import admin from 'firebase-admin';
import { envVars } from './env';

const parseFirebasePrivateKey = (key: string | undefined): string => {
  if (!key) return '';
  // Strip surrounding quotes and HTML-encoded quotes (&quot;)
  let parsed = key
    .replace(/^&quot;|&quot;$/g, '')
    .replace(/^"|"$/g, '')
    .replace(/^'|'$/g, '');
  // Replace literal \n with actual newlines
  parsed = parsed.replace(/\\n/g, '\n');
  return parsed;
};

// Initialize Firebase Admin SDK
try {
  const firebaseCredentials = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: parseFirebasePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
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
