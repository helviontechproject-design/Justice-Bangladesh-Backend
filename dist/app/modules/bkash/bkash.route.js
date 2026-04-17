"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bkashRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const bkash_controller_1 = require("./bkash.controller");
const router = (0, express_1.Router)();
// Client: initiate bKash payment → returns bkashURL
router.post('/create', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), bkash_controller_1.bkashController.createPayment);
// Client: execute after bKash redirect
router.post('/execute', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), bkash_controller_1.bkashController.executePayment);
// Query payment status
router.get('/query/:paymentID', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.CLIENT), bkash_controller_1.bkashController.queryPayment);
exports.bkashRoute = router;
