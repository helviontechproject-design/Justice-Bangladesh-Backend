import { Router } from 'express';
import { payoutController } from './payout.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// ==================== Lawyer Routes ====================
router.post('/', checkAuth(ERole.LAWYER), payoutController.requestPayout);
router.get('/my-payouts', checkAuth(ERole.LAWYER), payoutController.getMyPayouts);
router.patch('/:id/cancel', checkAuth(ERole.LAWYER), payoutController.cancelPayout);

// ==================== Admin Routes ====================
// Retrieves all payout requests across all lawyers for admin management
router.get('/admin/all', checkAuth(ERole.SUPER_ADMIN), payoutController.getAllPayouts);

// Marks a payout as processed and completes the transaction
router.patch('/:id/process', checkAuth(ERole.SUPER_ADMIN), payoutController.processPayout);

// Marks a payout as failed (e.g., due to invalid bank details or processing errors)
router.patch('/:id/fail', checkAuth(ERole.SUPER_ADMIN), payoutController.failPayout);

// Admin cancel payout with reason
router.patch('/:id/admin-cancel', checkAuth(ERole.SUPER_ADMIN), payoutController.adminCancelPayout);

export const payoutRoute = router;
