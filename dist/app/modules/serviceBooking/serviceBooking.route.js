"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceBookingRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const serviceBooking_controller_1 = require("./serviceBooking.controller");
const multer_config_1 = require("../../config/multer.config");
const router = (0, express_1.Router)();
// Client: submit application with documents
router.post('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), multer_config_1.multerUpload.array('documents', 10), serviceBooking_controller_1.serviceBookingController.createApplication);
// Client: my applications
router.get('/my', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), serviceBooking_controller_1.serviceBookingController.getMyApplications);
// Public: track by code
router.get('/track/:trackingCode', serviceBooking_controller_1.serviceBookingController.trackApplication);
// Service stats (public)
router.get('/stats/:serviceId', serviceBooking_controller_1.serviceBookingController.getServiceStats);
// Admin: all applications
router.get('/admin/all', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), serviceBooking_controller_1.serviceBookingController.adminGetAllApplications);
// Admin: single application details
router.get('/admin/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), serviceBooking_controller_1.serviceBookingController.adminGetSingleApplication);
// Admin: update status (with optional rejectReason)
router.patch('/admin/:id/status', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), serviceBooking_controller_1.serviceBookingController.adminUpdateStatus);
exports.serviceBookingRoute = router;
