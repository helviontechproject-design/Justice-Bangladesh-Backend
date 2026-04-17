import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { ERole } from "../user/user.interface";
import { paymentController } from "./payment.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createPaymentZod,
  updatePaymentStatusZod,
  updatePaymentZod,
} from "./payment.validation";

const router = Router();

// Create payment (Client only)

router.post(
  "/recreate-payment/:paymentId",
  checkAuth(ERole.CLIENT),
  paymentController.reCreatePayment,
);

router.post("/success", paymentController.successPayment);
router.post("/fail", paymentController.failPayment);
router.post("/cancel", paymentController.cancelPayment);
router.post("/validate-payment", paymentController.validatePayment);

// Get my payments (authenticated users - lawyers and clients)
router.get(
  "/my-payments",
  checkAuth(...Object.values(ERole)),
  paymentController.getMyPayments,
);

// Get payment statistics (SUPER_ADMIN only)
router.get(
  "/stats",
  checkAuth(ERole.SUPER_ADMIN),
  paymentController.getPaymentStats,
);

// Get payment by transaction ID (SUPER_ADMIN only)
router.get(
  "/transaction/:transactionId",
  checkAuth(ERole.SUPER_ADMIN),
  paymentController.getPaymentByTransactionId,
);

// Get all payments (SUPER_ADMIN only)
router.get("/", checkAuth(ERole.SUPER_ADMIN), paymentController.getAllPayments);

// Get single payment by ID (SUPER_ADMIN only)
router.get(
  "/:id",
  checkAuth(ERole.SUPER_ADMIN),
  paymentController.getSinglePayment,
);

// Update payment (SUPER_ADMIN only)
router.patch(
  "/:id",
  checkAuth(ERole.SUPER_ADMIN),
  validateRequest(updatePaymentZod),
  paymentController.updatePayment,
);

// Update payment status (SUPER_ADMIN only)
router.patch(
  "/:id/status",
  checkAuth(ERole.SUPER_ADMIN),
  validateRequest(updatePaymentStatusZod),
  paymentController.updatePaymentStatus,
);

// Delete payment (SUPER_ADMIN only)
router.delete(
  "/:id",
  checkAuth(ERole.SUPER_ADMIN),
  paymentController.deletePayment,
);

export const paymentRoute = router;
