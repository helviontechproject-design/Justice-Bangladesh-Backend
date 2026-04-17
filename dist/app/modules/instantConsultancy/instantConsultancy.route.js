"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantConsultancyRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const instantConsultancy_controller_1 = require("./instantConsultancy.controller");
const router = (0, express_1.Router)();
// Client: create instant consultancy request
router.post('/request', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), instantConsultancy_controller_1.instantConsultancyController.createRequest);
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
exports.instantConsultancyRoute = router;
