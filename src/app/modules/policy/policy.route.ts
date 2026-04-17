import express from 'express';
import { policyController } from './policy.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = express.Router();

router.get('/', policyController.get);
router.get('/all', policyController.getAll);
router.put('/', checkAuth(ERole.SUPER_ADMIN), policyController.upsert);

export const policyRoute = router;
