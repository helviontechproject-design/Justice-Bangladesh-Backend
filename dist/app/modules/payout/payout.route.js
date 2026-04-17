"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutRoute = void 0;
const express_1 = require("express");
const payout_controller_1 = require("./payout.controller");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const router = (0, express_1.Router)();
// ==================== Lawyer Routes ====================
router.post('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), payout_controller_1.payoutController.requestPayout);
router.get('/my-payouts', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), payout_controller_1.payoutController.getMyPayouts);
router.patch('/:id/cancel', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), payout_controller_1.payoutController.cancelPayout);
// ==================== Admin Routes ====================
// Retrieves all payout requests across all lawyers for admin management
router.get('/admin/all', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), payout_controller_1.payoutController.getAllPayouts);
// Marks a payout as processed and completes the transaction
router.patch('/:id/process', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), payout_controller_1.payoutController.processPayout);
// Marks a payout as failed (e.g., due to invalid bank details or processing errors)
router.patch('/:id/fail', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), payout_controller_1.payoutController.failPayout);
exports.payoutRoute = router;
