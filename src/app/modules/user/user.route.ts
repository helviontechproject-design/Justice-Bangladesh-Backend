import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { ERole } from "./user.interface";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { updateUserSchema } from "./user.validation";
import { multerUpload } from "../../config/multer.config";





const router = Router()

router.get('/me', checkAuth(...Object.values(ERole)), userController.getMe);
router.get('/all-users', checkAuth(ERole.SUPER_ADMIN), userController.getAllUsers);



// update user

router.patch('/update-user', multerUpload.single('profile'), validateRequest(updateUserSchema), checkAuth(...Object.values(ERole)), userController.updateUser)

router.patch('/fcm-token', checkAuth(...Object.values(ERole)), userController.updateFcmToken)



export const  userRoute = router


