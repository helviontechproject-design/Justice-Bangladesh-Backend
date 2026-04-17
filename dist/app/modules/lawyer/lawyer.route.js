"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lawyerRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const lawyer_controller_1 = require("./lawyer.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const lawyer_validation_1 = require("./lawyer.validation");
const multer_config_1 = require("../../config/multer.config");
const router = (0, express_1.Router)();
// ===== PUBLIC =====
router.get('/popular', lawyer_controller_1.lawyerController.getPopularLawyers);
router.get('/', lawyer_controller_1.lawyerController.getAllLawyers);
// ===== CLIENT =====
router.get('/saved/my-lawyers', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), lawyer_controller_1.lawyerController.getMySavedLawyers);
router.post('/save/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), lawyer_controller_1.lawyerController.saveLawyerByClient);
router.delete('/save/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), lawyer_controller_1.lawyerController.removeSavedLawyer);
// ===== ADMIN =====
router.get('/admin/all', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), lawyer_controller_1.lawyerController.adminGetAllLawyers);
router.patch('/admin/:id/ban', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), lawyer_controller_1.lawyerController.adminBanLawyer);
router.patch('/admin/:id/verify', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), lawyer_controller_1.lawyerController.adminVerifyLawyer);
router.delete('/admin/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), lawyer_controller_1.lawyerController.adminDeleteLawyer);
router.put('/admin/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), multer_config_1.multerUpload.single('profilePhoto'), lawyer_controller_1.lawyerController.adminUpdateLawyer);
// ===== LAWYER SELF UPDATE =====
router.patch('/update-lawyer/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER, user_interface_1.ERole.SUPER_ADMIN), multer_config_1.multerUpload.single('bar_council_certificate'), (0, validateRequest_1.validateRequest)(lawyer_validation_1.updateLawyerSchema), lawyer_controller_1.lawyerController.updateLawyer);
// ===== PUBLIC dynamic (must be last) =====
router.get('/:id', lawyer_controller_1.lawyerController.getLawyerbyId);
exports.lawyerRoute = router;
