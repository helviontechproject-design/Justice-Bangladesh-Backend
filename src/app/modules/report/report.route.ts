import express from 'express';
import { reportController } from './report.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = express.Router();

router.post('/', checkAuth(...Object.values(ERole)), reportController.create);
router.get('/my', checkAuth(...Object.values(ERole)), reportController.getMyReports);
router.get('/', checkAuth(ERole.SUPER_ADMIN), reportController.getAll);
router.patch('/:id/reply', checkAuth(ERole.SUPER_ADMIN), reportController.reply);

export const reportRoute = router;
