import express from 'express';
import { settingsController } from './settings.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import { settingsValidation } from './settings.validation';

const router = express.Router();

// Get platform settings (public - no auth required)
router.get('/', settingsController.getPlatformSettings);

// Update platform settings (super admin only - no validation middleware, direct to controller)
router.patch(
  '/',
  checkAuth('SUPER_ADMIN'),
  settingsController.updatePlatformSettings
);

export const settingsRoutes = router;

