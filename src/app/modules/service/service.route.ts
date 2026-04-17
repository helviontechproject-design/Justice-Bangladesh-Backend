import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { multerUpload } from '../../config/multer.config';
import { validateRequest } from '../../middlewares/validateRequest';
import { serviceZ, updateServiceZ } from './service.validation';
import { serviceController } from './service.controller';

const router = Router();

// Create new service (only SUPER_ADMIN) — supports icon + image
router.post(
  '/',
  checkAuth(ERole.SUPER_ADMIN),
  multerUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]),
  validateRequest(serviceZ),
  serviceController.createService
);

// Get featured services (public)
router.get('/featured', serviceController.getFeaturedServices);

// Get all services (public)
router.get('/', serviceController.getAllCategories);

// Get single service by id or slug
router.get('/:id', serviceController.getSingleService);

// Update service (only SUPER_ADMIN) — supports icon + image
router.patch(
  '/:id',
  checkAuth(ERole.SUPER_ADMIN),
  multerUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]),
  validateRequest(updateServiceZ),
  serviceController.updateService
);

// Delete service (only SUPER_ADMIN)
router.delete(
  '/:id',
  checkAuth(ERole.SUPER_ADMIN),
  serviceController.deleteService
);

export const serviceRoute = router;
