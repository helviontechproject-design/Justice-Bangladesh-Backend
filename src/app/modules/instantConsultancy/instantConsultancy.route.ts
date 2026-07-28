import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { instantConsultancyController } from './instantConsultancy.controller';
import { multerUpload } from '../../config/multer.config';

const router = Router();

// Client: step 1 — upload docs + initiate PayStation payment → returns payment URL
router.post(
  '/init-payment',
  checkAuth(ERole.CLIENT),
  multerUpload.array('documents', 5),
  instantConsultancyController.initPayment,
);

// PayStation callback: verify payment status (PUBLIC - no auth, PayStation calls this)
router.get('/callback', instantConsultancyController.paymentCallback);

// Client: step 2 — create request after payment (called after PayStation payment completion)
router.post('/request', checkAuth(ERole.CLIENT), multerUpload.array('documents', 5), instantConsultancyController.createRequest);

// Client: check status of their request (poll every 3s)
router.get('/request/:requestId/status', checkAuth(ERole.CLIENT), instantConsultancyController.getRequestStatus);

// Client: cancel request
router.delete('/request/:requestId', checkAuth(ERole.CLIENT), instantConsultancyController.cancelRequest);

// Lawyer: poll for pending requests matching their categories
router.get('/pending', checkAuth(ERole.LAWYER), instantConsultancyController.getPendingForLawyer);

// Lawyer: accept a request
router.post('/accept/:requestId', checkAuth(ERole.LAWYER), instantConsultancyController.acceptRequest);

// Admin: all requests
router.get('/admin/all', checkAuth(ERole.SUPER_ADMIN), instantConsultancyController.adminGetAll);

// Admin: settings
router.get('/admin/settings', checkAuth(ERole.SUPER_ADMIN), instantConsultancyController.getSettings);
router.patch('/admin/settings', checkAuth(ERole.SUPER_ADMIN), instantConsultancyController.updateSettings);

// Public: get active items (app)
router.get('/items', instantConsultancyController.getItems);

// Admin: item CRUD
router.get('/admin/items', checkAuth(ERole.SUPER_ADMIN), instantConsultancyController.getAllItems);
router.post('/admin/items', checkAuth(ERole.SUPER_ADMIN), instantConsultancyController.createItem);
router.patch('/admin/items/:id', checkAuth(ERole.SUPER_ADMIN), instantConsultancyController.updateItem);
router.delete('/admin/items/:id', checkAuth(ERole.SUPER_ADMIN), instantConsultancyController.deleteItem);

export const instantConsultancyRoute = router;
