import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { lawyerSpecialtyController } from './lawyerSpecialties.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createLawyerSpecialtyZod, updateLawyerSpecialtyZod } from './lawyerSpecialties.validation';
import { multerUpload } from '../../config/multer.config';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────

router.get('/suggest', lawyerSpecialtyController.suggestSpecialties);
router.get('/', lawyerSpecialtyController.getAllLawyerSpecialties);
router.get('/by-category/:categoryId', lawyerSpecialtyController.getByCategory);

// ── Lawyer (self) ────────────────────────────────────────────────────────────

router.get('/my-specialties', checkAuth(ERole.LAWYER), lawyerSpecialtyController.getMySpecialties);

router.post(
  '/',
  checkAuth(ERole.LAWYER),
  multerUpload.single('icon'),
  validateRequest(createLawyerSpecialtyZod),
  lawyerSpecialtyController.createLawyerSpecialty,
);

router.patch(
  '/:id',
  checkAuth(ERole.LAWYER),
  validateRequest(updateLawyerSpecialtyZod),
  lawyerSpecialtyController.updateLawyerSpecialty,
);

router.delete(
  '/:id',
  checkAuth(ERole.LAWYER, ERole.SUPER_ADMIN),
  lawyerSpecialtyController.deleteLawyerSpecialty,
);

// ── Admin ────────────────────────────────────────────────────────────────────

router.post(
  '/admin/create',
  checkAuth(ERole.SUPER_ADMIN),
  multerUpload.single('icon'),
  lawyerSpecialtyController.adminCreateSpecialty,
);

router.put(
  '/admin/:id',
  checkAuth(ERole.SUPER_ADMIN),
  lawyerSpecialtyController.adminUpdateSpecialty,
);

router.delete(
  '/admin/:id',
  checkAuth(ERole.SUPER_ADMIN),
  lawyerSpecialtyController.adminDeleteSpecialty,
);

// Get single — must be LAST to avoid shadowing named routes
router.get('/:id', lawyerSpecialtyController.getSingleLawyerSpecialty);

export const lawyerSpecialtiesRoute = router;
