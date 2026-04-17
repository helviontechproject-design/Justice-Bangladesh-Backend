import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { bkashController } from './bkash.controller';

const router = Router();

// Client: initiate bKash payment → returns bkashURL
router.post('/create', checkAuth(ERole.CLIENT), bkashController.createPayment);

// Client: execute after bKash redirect
router.post('/execute', checkAuth(ERole.CLIENT), bkashController.executePayment);

// Query payment status
router.get('/query/:paymentID', checkAuth(ERole.CLIENT), bkashController.queryPayment);

export const bkashRoute = router;
