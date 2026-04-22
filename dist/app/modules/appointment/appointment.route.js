"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const appointment_controller_1 = require("./appointment.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const appointment_validation_1 = require("./appointment.validation");
const multer_config_1 = require("../../config/multer.config");
const router = (0, express_1.Router)();
// Create appointment (authenticated CLIENT only)
router.post('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), multer_config_1.multerUpload.fields([{ name: 'documents', maxCount: 10 }]), appointment_controller_1.appointmentController.createAppointment);
// Get my appointments (authenticated)
router.get('/my-appointments', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), appointment_controller_1.appointmentController.getMyAppointments);
// Get appointment statistics (SUPER_ADMIN only)
router.get('/stats', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), appointment_controller_1.appointmentController.getAppointmentStats);
// Get all appointments (SUPER_ADMIN only)
router.get('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), appointment_controller_1.appointmentController.getAllAppointments);
// Get single appointment by ID (authenticated users - own only)
router.get('/:id', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), appointment_controller_1.appointmentController.getSingleAppointment);
// Update appointment (CLIENT only - own only)
router.patch('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), (0, validateRequest_1.validateRequest)(appointment_validation_1.updateAppointmentZod), appointment_controller_1.appointmentController.updateAppointment);
// Update appointment status (LAWYER or CLIENT)
router.patch('/:id/status', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER, user_interface_1.ERole.CLIENT), (0, validateRequest_1.validateRequest)(appointment_validation_1.updateAppointmentStatusZod), appointment_controller_1.appointmentController.updateAppointmentStatus);
// Update payment status (SUPER_ADMIN only)
router.patch('/:id/payment-status', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(appointment_validation_1.updatePaymentStatusZod), appointment_controller_1.appointmentController.updatePaymentStatus);
// Delete appointment (CLIENT only - own pending appointments)
router.delete('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), appointment_controller_1.appointmentController.deleteAppointment);
// Reschedule appointment (CLIENT only)
router.patch('/:id/reschedule', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), appointment_controller_1.appointmentController.rescheduleAppointment);
// Dev: confirm payment (no real gateway)
router.post('/:id/confirm-payment-dev', appointment_controller_1.appointmentController.confirmPaymentDev);
// Cancel appointment with refund (CLIENT or LAWYER)
router.post('/:id/cancel', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT, user_interface_1.ERole.LAWYER), appointment_controller_1.appointmentController.cancelAppointmentWithRefund);
// // lawyer dashboard appointment api
// router.get(
//   '/lawyer-todays-appointments',
//   checkAuth(ERole.LAWYER),
//   appointmentController.getTodaysAppointments
// );
exports.appointmentRoute = router;
