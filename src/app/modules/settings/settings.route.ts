import express from 'express';
import { settingsController } from './settings.controller';
import { checkAuth } from '../../middlewares/checkAuth';

const router = express.Router();

// Get platform settings (public - no auth required)
router.get('/', settingsController.getPlatformSettings);

// Update platform settings (super admin only)
router.patch(
  '/',
  checkAuth('SUPER_ADMIN'),
  settingsController.updatePlatformSettings
);

// One-time migration: add missing fields to existing MongoDB document
router.post('/migrate', settingsController.migrateSettings);

export const settingsRoutes = router;

