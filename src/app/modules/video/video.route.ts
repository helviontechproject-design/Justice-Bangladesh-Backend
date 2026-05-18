import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { videoController } from './video.controller';

const router = Router();

router.get('/', videoController.getAllVideos);
router.get('/admin/all', checkAuth(ERole.SUPER_ADMIN), videoController.getAllVideosAdmin);
router.post('/create', checkAuth(ERole.SUPER_ADMIN), videoController.createVideo);
router.patch('/update/:id', checkAuth(ERole.SUPER_ADMIN), videoController.updateVideo);
router.delete('/delete/:id', checkAuth(ERole.SUPER_ADMIN), videoController.deleteVideo);

export const videoRoute = router;
