import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: string;
  DB_URL: string;
  NODE_ENV: 'development' | 'production';
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_EXPIRES: string;
  BCRYPT_SALT_ROUND: number;
  ADMIN_PASSWORD: string;
  ADMIN_EMAIL: string;
  ADMIN_NAME: string;
  ADMIN_PHONE: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CALLBACK_URL: string;
  EXPRESS_SESSION: string;
  FRONTEND_URL: string;
  EMAIL_SENDER: {
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_PORT: string;
    SMTP_HOST: string;
    SMTP_FROM: string;
  };
  SSL: {
    STORE_ID: string;
    STORE_PASS: string;
    SSL_PAYMENT_API: string;
    SSL_VALIDATION_API: string;
    SSL_SUCCESS_FRONTEND_URL: string;
    SSL_FAIL_FRONTEND_URL: string;
    SSL_CANCEL_FRONTEND_URL: string;
    SSL_SUCCESS_BACKEND_URL: string;
    SSL_FAIL_BACKEND_URL: string;
    SSL_CANCEL_BACKEND_URL: string;
    SSL_IPN_URL: string;
  };
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  META_WHATSAPP: {
    ACCESS_TOKEN: string;
    PHONE_NUMBER_ID: string;
  };
  FIREBASE: {
    FIREBASE_PROJECT_ID: string;
    FIREBASE_PRIVATE_KEY_ID: string;
    FIREBASE_PRIVATE_KEY: string;
    FIREBASE_CLIENT_EMAIL: string;
    FIREBASE_CLIENT_ID: string;
  };
  AGORA_APP_ID: string;
  AGORA_APP_CERTIFICATE: string;
}

const envVariables = (): EnvConfig => {
  // Core variables — server cannot start without these
  const requiredEnvVariables: string[] = [
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
  const optionalEnvVariables: string[] = [
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
    PORT: process.env.PORT as string,
    DB_URL: process.env.DB_URL as string,
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
    BCRYPT_SALT_ROUND: Number(process.env.BCRYPT_SALT_ROUND),
    ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,
    ADMIN_NAME: process.env.ADMIN_NAME as string,
    ADMIN_PHONE: process.env.ADMIN_PHONE as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    EXPRESS_SESSION: process.env.EXPRESS_SESSION as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    EMAIL_SENDER: {
      SMTP_USER: process.env.SMTP_USER as string,
      SMTP_PASS: process.env.SMTP_PASS as string,
      SMTP_PORT: process.env.SMTP_PORT as string,
      SMTP_HOST: process.env.SMTP_HOST as string,
      SMTP_FROM: process.env.SMTP_FROM as string,
    },
    SSL: {
      STORE_ID: process.env.SSL_STORE_ID as string,
      STORE_PASS: process.env.SSL_STORE_PASS as string,
      SSL_PAYMENT_API: process.env.SSL_PAYMENT_API as string,
      SSL_VALIDATION_API: process.env.SSL_VALIDATION_API as string,
      SSL_SUCCESS_FRONTEND_URL: process.env.SSL_SUCCESS_FRONTEND_URL as string,
      SSL_FAIL_FRONTEND_URL: process.env.SSL_FAIL_FRONTEND_URL as string,
      SSL_CANCEL_FRONTEND_URL: process.env.SSL_CANCEL_FRONTEND_URL as string,
      SSL_SUCCESS_BACKEND_URL: process.env.SSL_SUCCESS_BACKEND_URL as string,
      SSL_FAIL_BACKEND_URL: process.env.SSL_FAIL_BACKEND_URL as string,
      SSL_CANCEL_BACKEND_URL: process.env.SSL_CANCEL_BACKEND_URL as string,
      SSL_IPN_URL: process.env.SSL_IPN_URL as string,
    },
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    },
    META_WHATSAPP: {
      ACCESS_TOKEN: process.env.META_WHATSAPP_ACCESS_TOKEN as string,
      PHONE_NUMBER_ID: process.env.META_WHATSAPP_PHONE_NUMBER_ID as string,
    },
    FIREBASE: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID as string,
      FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID as string,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY as string,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL as string,
      FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID as string,
    },
    AGORA_APP_ID: process.env.AGORA_APP_ID as string,
    AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE as string,
  };
};

export const envVars = envVariables();
