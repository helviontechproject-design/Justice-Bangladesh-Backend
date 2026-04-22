"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantConsultancyRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const instantConsultancy_controller_1 = require("./instantConsultancy.controller");
const multer_config_1 = require("../../config/multer.config");
const router = (0, express_1.Router)();
// Client: step 1 — upload docs + initiate bKash payment → returns bkashURL
router.post('/init-payment', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), multer_config_1.multerUpload.array('documents', 5), instantConsultancy_controller_1.instantConsultancyController.initPayment);
// Client: step 2 — execute payment + create request (called after bKash redirect)
router.post('/request', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), multer_config_1.multerUpload.array('documents', 5), instantConsultancy_controller_1.instantConsultancyController.createRequest);
// Client: check status of their request (poll every 3s)
router.get('/request/:requestId/status', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), instantConsultancy_controller_1.instantConsultancyController.getRequestStatus);
// Client: cancel request
router.delete('/request/:requestId', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), instantConsultancy_controller_1.instantConsultancyController.cancelRequest);
// Lawyer: poll for pending requests matching their categories
router.get('/pending', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), instantConsultancy_controller_1.instantConsultancyController.getPendingForLawyer);
// Lawyer: accept a request
router.post('/accept/:requestId', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), instantConsultancy_controller_1.instantConsultancyController.acceptRequest);
// Admin: all requests
router.get('/admin/all', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), instantConsultancy_controller_1.instantConsultancyController.adminGetAll);
// Admin: settings
router.get('/admin/settings', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), instantConsultancy_controller_1.instantConsultancyController.getSettings);
router.patch('/admin/settings', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), instantConsultancy_controller_1.instantConsultancyController.updateSettings);
// Public: get active items (app)
router.get('/items', instantConsultancy_controller_1.instantConsultancyController.getItems);
// Admin: item CRUD
router.get('/admin/items', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), instantConsultancy_controller_1.instantConsultancyController.getAllItems);
router.post('/admin/items', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), instantConsultancy_controller_1.instantConsultancyController.createItem);
router.patch('/admin/items/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), instantConsultancy_controller_1.instantConsultancyController.updateItem);
router.delete('/admin/items/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), instantConsultancy_controller_1.instantConsultancyController.deleteItem);
exports.instantConsultancyRoute = router;
