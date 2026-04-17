"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envVars = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envVariables = () => {
    // Core variables — server cannot start without these
    const requiredEnvVariables = [
        'PORT',
        'DB_URL',
        'NODE_ENV',
        'JWT_ACCESS_SECRET',
        'JWT_ACCESS_EXPIRES',
        'BCRYPT_SALT_ROUND',
        'ADMIN_EMAIL',
        'ADMIN_PASSWORD',
        'ADMIN_PHONE',
        'ADMIN_NAME',
        'JWT_REFRESH_SECRET',
        'JWT_REFRESH_EXPIRES',
        'EXPRESS_SESSION',
        'FRONTEND_URL',
    ];
    // Optional variables — warn but do not crash if missing
    const optionalEnvVariables = [
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CALLBACK_URL',
        'SMTP_PASS',
        'SMTP_PORT',
        'SMTP_HOST',
        'SMTP_USER',
        'SMTP_FROM',
        'SSL_STORE_ID',
        'SSL_STORE_PASS',
        'SSL_PAYMENT_API',
        'SSL_VALIDATION_API',
        'SSL_SUCCESS_FRONTEND_URL',
        'SSL_FAIL_FRONTEND_URL',
        'SSL_CANCEL_FRONTEND_URL',
        'SSL_SUCCESS_BACKEND_URL',
        'SSL_FAIL_BACKEND_URL',
        'SSL_CANCEL_BACKEND_URL',
        'SSL_IPN_URL',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        // OTP disabled temporarily for development — Twilio vars optional
        'META_WHATSAPP_ACCESS_TOKEN',
        'META_WHATSAPP_PHONE_NUMBER_ID',
        // Firebase optional for development
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_CLIENT_ID',
        'AGORA_APP_ID',
        'AGORA_APP_CERTIFICATE',
    ];
    requiredEnvVariables.forEach(key => {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
    });
    optionalEnvVariables.forEach(key => {
        if (!process.env[key]) {
            console.warn(`[ENV] Optional variable not set: ${key}`);
        }
    });
    return {
        PORT: process.env.PORT,
        DB_URL: process.env.DB_URL,
        NODE_ENV: process.env.NODE_ENV,
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
        JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES,
        BCRYPT_SALT_ROUND: Number(process.env.BCRYPT_SALT_ROUND),
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        ADMIN_NAME: process.env.ADMIN_NAME,
        ADMIN_PHONE: process.env.ADMIN_PHONE,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
        EXPRESS_SESSION: process.env.EXPRESS_SESSION,
        FRONTEND_URL: process.env.FRONTEND_URL,
        EMAIL_SENDER: {
            SMTP_USER: process.env.SMTP_USER,
            SMTP_PASS: process.env.SMTP_PASS,
            SMTP_PORT: process.env.SMTP_PORT,
            SMTP_HOST: process.env.SMTP_HOST,
            SMTP_FROM: process.env.SMTP_FROM,
        },
        SSL: {
            STORE_ID: process.env.SSL_STORE_ID,
            STORE_PASS: process.env.SSL_STORE_PASS,
            SSL_PAYMENT_API: process.env.SSL_PAYMENT_API,
            SSL_VALIDATION_API: process.env.SSL_VALIDATION_API,
            SSL_SUCCESS_FRONTEND_URL: process.env.SSL_SUCCESS_FRONTEND_URL,
            SSL_FAIL_FRONTEND_URL: process.env.SSL_FAIL_FRONTEND_URL,
            SSL_CANCEL_FRONTEND_URL: process.env.SSL_CANCEL_FRONTEND_URL,
            SSL_SUCCESS_BACKEND_URL: process.env.SSL_SUCCESS_BACKEND_URL,
            SSL_FAIL_BACKEND_URL: process.env.SSL_FAIL_BACKEND_URL,
            SSL_CANCEL_BACKEND_URL: process.env.SSL_CANCEL_BACKEND_URL,
            SSL_IPN_URL: process.env.SSL_IPN_URL,
        },
        CLOUDINARY: {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
        },
        META_WHATSAPP: {
            ACCESS_TOKEN: process.env.META_WHATSAPP_ACCESS_TOKEN,
            PHONE_NUMBER_ID: process.env.META_WHATSAPP_PHONE_NUMBER_ID,
        },
        FIREBASE: {
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
            FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
            FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
            FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
        },
        AGORA_APP_ID: process.env.AGORA_APP_ID,
        AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE,
    };
};
exports.envVars = envVariables();
