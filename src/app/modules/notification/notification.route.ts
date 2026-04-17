import { Router } from 'express';
import { notificationController } from './notification.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// Get user notifications with pagination and filters
router.get(
  '/',
  checkAuth(...Object.values(ERole)),
  notificationController.getUserNotifications
);

// Get my notifications
router.get(
  '/my-notifications',
  checkAuth(...Object.values(ERole)),
  notificationController.getMyNotifications
);

// Mark single notification as read
router.patch(
  '/:id/read',
  checkAuth(...Object.values(ERole)),
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch(
  '/read-all',
  checkAuth(...Object.values(ERole)),
  notificationController.markAllAsRead
);

// Delete a notification
router.delete(
  '/:id',
  checkAuth(...Object.values(ERole)),
  notificationController.deleteNotification
);

// Send notification to specific users
router.post(
  '/send-to-users',
  checkAuth(ERole.SUPER_ADMIN, ERole.LAWYER),
  notificationController.sendToUsers
);

// Send notification to all users
router.post(
  '/send-to-all',
  checkAuth(ERole.SUPER_ADMIN),
  notificationController.sendToAll
);

// Send notification to topic
router.post(
  '/send-to-topic',
  checkAuth(ERole.SUPER_ADMIN),
  notificationController.sendToTopic
);

// Save FCM Token
router.post(
  '/save-fcm-token',
  checkAuth(...Object.values(ERole)),
  notificationController.saveFCMToken
);

export const notificationRoute = router;
