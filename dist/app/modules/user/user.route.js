"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("./user.interface");
const user_controller_1 = require("./user.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const user_validation_1 = require("./user.validation");
const multer_config_1 = require("../../config/multer.config");
const router = (0, express_1.Router)();
router.get('/me', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), user_controller_1.userController.getMe);
router.get('/all-users', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), user_controller_1.userController.getAllUsers);
// update user
router.patch('/update-user', multer_config_1.multerUpload.single('profile'), (0, validateRequest_1.validateRequest)(user_validation_1.updateUserSchema), (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), user_controller_1.userController.updateUser);
router.patch('/fcm-token', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), user_controller_1.userController.updateFcmToken);
exports.userRoute = router;
