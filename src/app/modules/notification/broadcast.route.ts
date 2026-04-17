import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { multerUpload } from '../../config/multer.config';
import { broadcastController } from './broadcast.controller';

const router = Router();

router.get('/', checkAuth(ERole.SUPER_ADMIN), broadcastController.getAll);
router.post('/', checkAuth(ERole.SUPER_ADMIN), multerUpload.single('image'), broadcastController.create);
router.patch('/:id', checkAuth(ERole.SUPER_ADMIN), multerUpload.single('image'), broadcastController.update);
router.post('/:id/send', checkAuth(ERole.SUPER_ADMIN), broadcastController.send);
router.delete('/:id', checkAuth(ERole.SUPER_ADMIN), broadcastController.remove);

export const broadcastRoute = router;
