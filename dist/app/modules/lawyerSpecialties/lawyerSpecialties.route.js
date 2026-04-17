"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lawyerSpecialtiesRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const lawyerSpecialties_controller_1 = require("./lawyerSpecialties.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const lawyerSpecialties_validation_1 = require("./lawyerSpecialties.validation");
const multer_config_1 = require("../../config/multer.config");
const router = (0, express_1.Router)();
// ── Public ──────────────────────────────────────────────────────────────────
router.get('/suggest', lawyerSpecialties_controller_1.lawyerSpecialtyController.suggestSpecialties);
router.get('/', lawyerSpecialties_controller_1.lawyerSpecialtyController.getAllLawyerSpecialties);
router.get('/by-category/:categoryId', lawyerSpecialties_controller_1.lawyerSpecialtyController.getByCategory);
// ── Lawyer (self) ────────────────────────────────────────────────────────────
router.get('/my-specialties', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), lawyerSpecialties_controller_1.lawyerSpecialtyController.getMySpecialties);
router.post('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), multer_config_1.multerUpload.single('icon'), (0, validateRequest_1.validateRequest)(lawyerSpecialties_validation_1.createLawyerSpecialtyZod), lawyerSpecialties_controller_1.lawyerSpecialtyController.createLawyerSpecialty);
router.patch('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), (0, validateRequest_1.validateRequest)(lawyerSpecialties_validation_1.updateLawyerSpecialtyZod), lawyerSpecialties_controller_1.lawyerSpecialtyController.updateLawyerSpecialty);
router.delete('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER, user_interface_1.ERole.SUPER_ADMIN), lawyerSpecialties_controller_1.lawyerSpecialtyController.deleteLawyerSpecialty);
// ── Admin ────────────────────────────────────────────────────────────────────
router.post('/admin/create', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), multer_config_1.multerUpload.single('icon'), lawyerSpecialties_controller_1.lawyerSpecialtyController.adminCreateSpecialty);
router.put('/admin/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), lawyerSpecialties_controller_1.lawyerSpecialtyController.adminUpdateSpecialty);
router.delete('/admin/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), lawyerSpecialties_controller_1.lawyerSpecialtyController.adminDeleteSpecialty);
// Get single — must be LAST to avoid shadowing named routes
router.get('/:id', lawyerSpecialties_controller_1.lawyerSpecialtyController.getSingleLawyerSpecialty);
exports.lawyerSpecialtiesRoute = router;
