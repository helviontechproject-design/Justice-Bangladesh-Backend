import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { statsController } from './stats.controller';

const router = Router();


router.get(
  '/admin',
  checkAuth(ERole.SUPER_ADMIN),
  statsController.getAdminStats
);


router.get(
  '/lawyer',
  checkAuth(ERole.LAWYER),
  statsController.getLawyerStats
);


router.get(
  '/client',
  checkAuth(ERole.CLIENT),
  statsController.getClientStats
);

export const statsRoute = router;
