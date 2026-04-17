import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { ERole } from "../user/user.interface";
import { walletController } from "./wallet.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import {updateWalletZod } from "./wallet.validation";

const router = Router()

// Get my wallet (LAWYER only)
router.get(
  '/my-wallet',
  checkAuth(ERole.LAWYER),
  walletController.getMyWallet
);

// Get all wallets (SUPER_ADMIN only)
router.get(
  '/',
  checkAuth(ERole.SUPER_ADMIN),
  walletController.getAllWallets
);

// Get wallet by lawyer ID (SUPER_ADMIN only)
router.get(
  '/lawyer/:lawyerId',
  checkAuth(ERole.SUPER_ADMIN),
  walletController.getWalletByLawyerId
);

// Get wallet by ID (SUPER_ADMIN only)
router.get(
  '/:id',
  checkAuth(ERole.SUPER_ADMIN),
  walletController.getWalletById
);

// Update wallet (SUPER_ADMIN only)
router.patch(
  '/:id',
  checkAuth(ERole.SUPER_ADMIN),
  validateRequest(updateWalletZod),
  walletController.updateWallet
);



export const walletRoute = router;