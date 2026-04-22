import { Router } from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { appointmentController } from './appointment.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createAppointmentZod,
  updateAppointmentStatusZod,
  updateAppointmentZod,
  updatePaymentStatusZod,
} from './appointment.validation';
import { multerUpload } from '../../config/multer.config';

const router = Router();

// Create appointment (authenticated CLIENT only)
router.post(
  '/',
  checkAuth(ERole.CLIENT),
  multerUpload.fields([{ name: 'documents', maxCount: 10 }]),
  appointmentController.createAppointment
);

// Get my appointments (authenticated)
router.get(
  '/my-appointments',
  checkAuth(...Object.values(ERole)),
  appointmentController.getMyAppointments
);

// Get appointment statistics (SUPER_ADMIN only)
router.get(
  '/stats',
  checkAuth(ERole.SUPER_ADMIN),
  appointmentController.getAppointmentStats
);

// Get all appointments (SUPER_ADMIN only)
router.get(
  '/',
  checkAuth(ERole.SUPER_ADMIN),
  appointmentController.getAllAppointments
);

// Get single appointment by ID (authenticated users - own only)
router.get(
  '/:id',
  checkAuth(...Object.values(ERole)),
  appointmentController.getSingleAppointment
);

// Update appointment (CLIENT only - own only)
router.patch(
  '/:id',
  checkAuth(ERole.CLIENT),
  validateRequest(updateAppointmentZod),
  appointmentController.updateAppointment
);

// Update appointment status (LAWYER or CLIENT)
router.patch(
  '/:id/status',
  checkAuth(ERole.LAWYER, ERole.CLIENT),
  validateRequest(updateAppointmentStatusZod),
  appointmentController.updateAppointmentStatus
);

// Update payment status (SUPER_ADMIN only)
router.patch(
  '/:id/payment-status',
  checkAuth(ERole.SUPER_ADMIN),
  validateRequest(updatePaymentStatusZod),
  appointmentController.updatePaymentStatus
);

// Delete appointment (CLIENT only - own pending appointments)
router.delete(
  '/:id',
  checkAuth(ERole.CLIENT),
  appointmentController.deleteAppointment
);

// Reschedule appointment (CLIENT only)
router.patch(
  '/:id/reschedule',
  checkAuth(ERole.CLIENT),
  appointmentController.rescheduleAppointment
);

// Dev: confirm payment (no real gateway)
router.post(
  '/:id/confirm-payment-dev',
  appointmentController.confirmPaymentDev
);

// Cancel appointment with refund (CLIENT or LAWYER)
router.post(
  '/:id/cancel',
  checkAuth(ERole.CLIENT, ERole.LAWYER),
  appointmentController.cancelAppointmentWithRefund
);







// // lawyer dashboard appointment api

// router.get(
//   '/lawyer-todays-appointments',
//   checkAuth(ERole.LAWYER),
//   appointmentController.getTodaysAppointments
// );

export const appointmentRoute = router;
