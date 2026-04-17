"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const availability_controller_1 = require("./availability.controller");
const router = (0, express_1.Router)();
// Create/Set availability (lawyer only)
router.post('/set-update-availability', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), availability_controller_1.availabilityController.setAvailability);
// Get lawyer's own availability (must come before /:id)
router.get('/my-availability', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), availability_controller_1.availabilityController.getMyAvailability);
// Admin: get availability by lawyerId
router.get('/admin/lawyer/:lawyerId', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), availability_controller_1.availabilityController.getAvailabilityByLawyerId);
// Admin: set availability for a lawyer
router.post('/admin/set', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), availability_controller_1.availabilityController.adminSetAvailability);
// Get all availability (public or filtered by lawyerId)
router.get('/get-availability', availability_controller_1.availabilityController.getAvailability);
// Get availability by ID
router.get('/:id', availability_controller_1.availabilityController.getAvailabilityById);
// Delete availability (lawyer only - their own)
router.delete('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), availability_controller_1.availabilityController.deleteAvailability);
exports.availabilityRoute = router;
