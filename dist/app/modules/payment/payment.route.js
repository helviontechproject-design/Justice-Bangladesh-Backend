"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const payment_controller_1 = require("./payment.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const payment_validation_1 = require("./payment.validation");
const router = (0, express_1.Router)();
// Create payment (Client only)
router.post("/recreate-payment/:paymentId", (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), payment_controller_1.paymentController.reCreatePayment);
router.post("/success", payment_controller_1.paymentController.successPayment);
router.post("/fail", payment_controller_1.paymentController.failPayment);
router.post("/cancel", payment_controller_1.paymentController.cancelPayment);
router.post("/validate-payment", payment_controller_1.paymentController.validatePayment);
// Get my payments (authenticated users - lawyers and clients)
router.get("/my-payments", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), payment_controller_1.paymentController.getMyPayments);
// Get payment statistics (SUPER_ADMIN only)
router.get("/stats", (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), payment_controller_1.paymentController.getPaymentStats);
// Get payment by transaction ID (SUPER_ADMIN only)
router.get("/transaction/:transactionId", (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), payment_controller_1.paymentController.getPaymentByTransactionId);
// Get all payments (SUPER_ADMIN only)
router.get("/", (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), payment_controller_1.paymentController.getAllPayments);
// Get single payment by ID (SUPER_ADMIN only)
router.get("/:id", (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), payment_controller_1.paymentController.getSinglePayment);
// Update payment (SUPER_ADMIN only)
router.patch("/:id", (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(payment_validation_1.updatePaymentZod), payment_controller_1.paymentController.updatePayment);
// Update payment status (SUPER_ADMIN only)
router.patch("/:id/status", (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(payment_validation_1.updatePaymentStatusZod), payment_controller_1.paymentController.updatePaymentStatus);
// Delete payment (SUPER_ADMIN only)
router.delete("/:id", (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), payment_controller_1.paymentController.deletePayment);
exports.paymentRoute = router;
