import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { serviceBookingController } from './serviceBooking.controller';
import { multerUpload } from '../../config/multer.config';

const router = Router();

// Client: submit application with documents
router.post('/', checkAuth(ERole.CLIENT), multerUpload.array('documents', 10), serviceBookingController.createApplication);

// Client: my applications
router.get('/my', checkAuth(ERole.CLIENT), serviceBookingController.getMyApplications);

// Public: track by code
router.get('/track/:trackingCode', serviceBookingController.trackApplication);

// Service stats (public)
router.get('/stats/:serviceId', serviceBookingController.getServiceStats);

// Admin: all applications
router.get('/admin/all', checkAuth(ERole.SUPER_ADMIN), serviceBookingController.adminGetAllApplications);

// Admin: single application details
router.get('/admin/:id', checkAuth(ERole.SUPER_ADMIN), serviceBookingController.adminGetSingleApplication);

// Admin: update status (with optional rejectReason)
router.patch('/admin/:id/status', checkAuth(ERole.SUPER_ADMIN), serviceBookingController.adminUpdateStatus);

export const serviceBookingRoute = router;
