import express from 'express';
import { settingsController } from './settings.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import { settingsValidation } from './settings.validation';

const router = express.Router();

// Get platform settings (public - no auth required)
router.get('/', settingsController.getPlatformSettings);

// Update platform settings (super admin only - requires authentication and super_admin role)
router.patch(
  '/',
  checkAuth('SUPER_ADMIN'),
  validateRequest(settingsValidation.updatePlatformSettingsSchema),
  settingsController.updatePlatformSettings
);

export const settingsRoutes = router;
