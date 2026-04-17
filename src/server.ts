import { Server } from 'http';
import mongoose from 'mongoose';
import { envVars } from './app/config/env';
import app from './app';
import { createAdmin } from './app/utils/createAdmin';
import http from 'http';
import { seedServices } from './app/utils/seedServices';
import { seedPlatformSettings } from './app/utils/seedPlatformSettings';

let server: Server;

let isConnected = false;

const connectToDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(envVars.DB_URL);
    isConnected = true;
    console.log('Connected to DB!');
  } catch (error) {
    console.log('DB connection error:', error);
    throw error;
  }
};

const bootstrap = async () => {
  await connectToDB();
  await createAdmin();
  await seedPlatformSettings();
  await seedServices();

  if (process.env.VERCEL !== '1') {
    server = http.createServer(app);
    const port = Number(envVars.PORT) || 5000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server is Listening to port ${port}`);
    });
  }
};

bootstrap();

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down the server gracefully...');
  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received (e.g. Ctrl+C). Shutting down the server gracefully...');
  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('unhandledRejection', err => {
  console.log('Unhandled Promise Rejection detected. Shutting down the server...', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', err => {
  console.log('Uncaught Exception detected. Shutting down the server...', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Export app for Vercel serverless deployment
export default app;

