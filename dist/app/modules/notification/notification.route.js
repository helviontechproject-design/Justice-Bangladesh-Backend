"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoute = void 0;
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const router = (0, express_1.Router)();
// Get user notifications with pagination and filters
router.get('/', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), notification_controller_1.notificationController.getUserNotifications);
// Get my notifications
router.get('/my-notifications', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), notification_controller_1.notificationController.getMyNotifications);
// Mark single notification as read
router.patch('/:id/read', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), notification_controller_1.notificationController.markAsRead);
// Mark all notifications as read
router.patch('/read-all', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), notification_controller_1.notificationController.markAllAsRead);
// Delete a notification
router.delete('/:id', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), notification_controller_1.notificationController.deleteNotification);
// Send notification to specific users
router.post('/send-to-users', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN, user_interface_1.ERole.LAWYER), notification_controller_1.notificationController.sendToUsers);
// Send notification to all users
router.post('/send-to-all', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), notification_controller_1.notificationController.sendToAll);
// Send notification to topic
router.post('/send-to-topic', (0, checkAuth_1.checkAuth)(user_interface_1.ERole.SUPER_ADMIN), notification_controller_1.notificationController.sendToTopic);
// Save FCM Token
router.post('/save-fcm-token', (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.ERole)), notification_controller_1.notificationController.saveFCMToken);
exports.notificationRoute = router;
