import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { lawyerController } from './lawyer.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { updateLawyerSchema } from './lawyer.validation';
import { multerUpload } from '../../config/multer.config';

const router = Router();

// ===== PUBLIC =====
router.get('/popular', lawyerController.getPopularLawyers);
router.get('/', lawyerController.getAllLawyers);

// ===== CLIENT =====
router.get('/saved/my-lawyers', checkAuth(ERole.CLIENT), lawyerController.getMySavedLawyers);
router.post('/save/:id', checkAuth(ERole.CLIENT), lawyerController.saveLawyerByClient);
router.delete('/save/:id', checkAuth(ERole.CLIENT), lawyerController.removeSavedLawyer);

// ===== ADMIN =====
router.get('/admin/all', checkAuth(ERole.SUPER_ADMIN), lawyerController.adminGetAllLawyers);
router.patch('/admin/:id/ban', checkAuth(ERole.SUPER_ADMIN), lawyerController.adminBanLawyer);
router.patch('/admin/:id/verify', checkAuth(ERole.SUPER_ADMIN), lawyerController.adminVerifyLawyer);
router.delete('/admin/:id', checkAuth(ERole.SUPER_ADMIN), lawyerController.adminDeleteLawyer);
router.put('/admin/:id', checkAuth(ERole.SUPER_ADMIN), multerUpload.single('profilePhoto'), lawyerController.adminUpdateLawyer);

// ===== LAWYER SELF UPDATE =====
router.patch(
  '/update-lawyer/:id',
  checkAuth(ERole.LAWYER, ERole.SUPER_ADMIN),
  multerUpload.single('bar_council_certificate'),
  validateRequest(updateLawyerSchema),
  lawyerController.updateLawyer
);

// ===== PUBLIC dynamic (must be last) =====
router.get('/:id', lawyerController.getLawyerbyId);

export const lawyerRoute = router;
