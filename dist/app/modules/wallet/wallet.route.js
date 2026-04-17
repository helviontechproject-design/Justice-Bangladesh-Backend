"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRoute = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const wallet_controller_1 = require("./wallet.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const wallet_validation_1 = require("./wallet.validation");
const router = (0, express_1.Router)();
// Get my wallet (LAWYER only)
router.get('/my-wallet', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.LAWYER), wallet_controller_1.walletController.getMyWallet);
// Get all wallets (SUPER_ADMIN only)
router.get('/', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), wallet_controller_1.walletController.getAllWallets);
// Get wallet by lawyer ID (SUPER_ADMIN only)
router.get('/lawyer/:lawyerId', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), wallet_controller_1.walletController.getWalletByLawyerId);
// Get wallet by ID (SUPER_ADMIN only)
router.get('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), wallet_controller_1.walletController.getWalletById);
// Update wallet (SUPER_ADMIN only)
router.patch('/:id', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(wallet_validation_1.updateWalletZod), wallet_controller_1.walletController.updateWallet);
exports.walletRoute = router;
