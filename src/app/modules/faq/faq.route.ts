import express from 'express';
import { faqController } from './faq.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = express.Router();

router.get('/', faqController.getAll);
router.get('/admin', checkAuth(ERole.SUPER_ADMIN), faqController.getAllAdmin);
router.post('/', checkAuth(ERole.SUPER_ADMIN), faqController.create);
router.patch('/:id', checkAuth(ERole.SUPER_ADMIN), faqController.update);
router.delete('/:id', checkAuth(ERole.SUPER_ADMIN), faqController.remove);

export const faqRoute = router;
