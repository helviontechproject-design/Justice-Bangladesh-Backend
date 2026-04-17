import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { categoryController } from './category.controller';
import { multerUpload } from '../../config/multer.config';
import { validateRequest } from '../../middlewares/validateRequest';
import { categoryZ, updateCategoryZ } from './category.validation';

const router = Router();




router.post(
  '/',
  checkAuth(ERole.SUPER_ADMIN),
  multerUpload.single('image'),
  validateRequest(categoryZ),
  categoryController.createCategory
);

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getSingleCategory);

router.patch(
  '/:id',
  checkAuth(ERole.SUPER_ADMIN),
  multerUpload.single('image'),
  validateRequest(updateCategoryZ),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  checkAuth(ERole.SUPER_ADMIN),
  categoryController.deleteCategory
);

export const categoryRoute = router;
