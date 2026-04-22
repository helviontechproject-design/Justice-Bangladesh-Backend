"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.messaging = exports.admin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const getFirebasePrivateKey = () => {
    var _a;
    // Option 1: Base64-encoded key (recommended for Hostinger)
    const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    if (base64Key) {
        return Buffer.from(base64Key.trim(), 'base64').toString('utf8');
    }
    // Option 2: Raw key — strip all possible encoding artifacts
    const raw = (_a = process.env.FIREBASE_PRIVATE_KEY) !== null && _a !== void 0 ? _a : '';
    return raw
        .replace(/&quot;/g, '') // HTML-encoded quotes
        .replace(/^"|"$/g, '') // surrounding double quotes
        .replace(/^'|'$/g, '') // surrounding single quotes
        .replace(/\\n/g, '\n'); // literal \n to real newline
};
// Initialize Firebase Admin SDK
try {
    const privateKey = getFirebasePrivateKey();
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        throw new Error('FIREBASE_PRIVATE_KEY is missing or malformed. Set FIREBASE_PRIVATE_KEY_BASE64 in your environment.');
    }
    const firebaseCredentials = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: (_a = process.env.FIREBASE_AUTH_URI) !== null && _a !== void 0 ? _a : 'https://accounts.google.com/o/oauth2/auth',
        token_uri: (_b = process.env.FIREBASE_TOKEN_URI) !== null && _b !== void 0 ? _b : 'https://oauth2.googleapis.com/token',
    };
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(firebaseCredentials),
    });
    console.log('Firebase Admin SDK initialized successfully');
}
catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
}
// Get messaging service
const messaging = firebase_admin_1.default.messaging();
exports.messaging = messaging;
