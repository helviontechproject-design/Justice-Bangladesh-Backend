import express from 'express';
import cookieParser from 'cookie-parser';
import { router } from './app/routes';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import './app/config/passport';
import passport from 'passport';
import expressSession from 'express-session';
import { envVars } from './app/config/env';
import notFound from './app/middlewares/notFound';
import cron from 'node-cron';
import { appointmentService } from './app/modules/appointment/appointment.service';
import cors from 'cors';

const app = express();

// Allow multiple origins: production Vercel URL + local dev
const allowedOrigins = [
  envVars.FRONTEND_URL,
  'https://justice-bangladesh-admin.vercel.app',
  'https://admin.justicebangladesh.com/',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://10.0.2.2:5000',
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.json());
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));

// Enable cron on traditional servers (Hostinger) or when explicitly enabled
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  cron.schedule('* * * * *', async () => {
    await appointmentService.cancelUnpaidAppointments();
  });
}

app.use('/api/v1', router);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'WelCome to Law Firm API',
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
