import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { multerUpload } from '../../config/multer.config';
import { blogController } from './blog.controller';

const router = Router();

router.get('/', blogController.getAllBlogs);
router.get('/admin/all', checkAuth(ERole.SUPER_ADMIN), blogController.getAllBlogsAdmin);
router.post('/create', checkAuth(ERole.SUPER_ADMIN), multerUpload.single('imageUrl'), blogController.createBlog);
router.patch('/update/:id', checkAuth(ERole.SUPER_ADMIN), multerUpload.single('imageUrl'), blogController.updateBlog);
router.delete('/delete/:id', checkAuth(ERole.SUPER_ADMIN), blogController.deleteBlog);

export const blogRoute = router;
