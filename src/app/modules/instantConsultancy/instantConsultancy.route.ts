import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { instantConsultancyController } from './instantConsultancy.controller';

const router = Router();

// Client: create instant consultancy request
router.post('/request', checkAuth(ERole.CLIENT), instantConsultancyController.createRequest);

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

export const instantConsultancyRoute = router;
