"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const multer_config_1 = require("../../config/multer.config");
const validateRequest_1 = require("../../middlewares/validateRequest");
const service_validation_1 = require("./service.validation");
const service_controller_1 = require("./service.controller");
const router = (0, express_1.Router)();
// Create new service (only SUPER_ADMIN) — supports icon + image
router.post('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), multer_config_1.multerUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), (0, validateRequest_1.validateRequest)(service_validation_1.serviceZ), service_controller_1.serviceController.createService);
// Get featured services (public)
router.get('/featured', service_controller_1.serviceController.getFeaturedServices);
// Get all services (public)
router.get('/', service_controller_1.serviceController.getAllCategories);
// Get single service by id or slug
router.get('/:id', service_controller_1.serviceController.getSingleService);
// Update service (only SUPER_ADMIN) — supports icon + image
router.patch('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), multer_config_1.multerUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), (0, validateRequest_1.validateRequest)(service_validation_1.updateServiceZ), service_controller_1.serviceController.updateService);
// Delete service (only SUPER_ADMIN)
router.delete('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), service_controller_1.serviceController.deleteService);
exports.serviceRoute = router;
