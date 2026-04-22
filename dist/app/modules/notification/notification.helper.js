"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationHelper = void 0;
const notification_model_1 = require("./notification.model");
const notification_interface_1 = require("./notification.interface");
const user_interface_1 = require("../user/user.interface");
class NotificationHelperClass {
    /**
     * Create a single notification
     */
    createNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield notification_model_1.Notification.create({
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    relatedEntityId: data.relatedEntityId || null,
                    relatedEntityType: data.relatedEntityType || null,
                    priority: data.priority || notification_interface_1.NotificationPriority.MEDIUM,
                    actionUrl: data.actionUrl || null,
                    isRead: false,
                });
                console.log(`✅ Notification created: ${data.type} for user ${data.userId}`);
            }
            catch (error) {
                console.error('❌ Error creating notification:', error);
            }
        });
    }
    /**
     * Create multiple notifications at once
     */
    createBulkNotifications(notifications) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notificationDocs = notifications.map(data => ({
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    relatedEntityId: data.relatedEntityId || null,
                    relatedEntityType: data.relatedEntityType || null,
                    priority: data.priority || notification_interface_1.NotificationPriority.MEDIUM,
                    actionUrl: data.actionUrl || null,
                    isRead: false,
                }));
                yield notification_model_1.Notification.insertMany(notificationDocs);
                console.log(`✅ ${notifications.length} notifications created`);
            }
            catch (error) {
                console.error('❌ Error creating bulk notifications:', error);
            }
        });
    }
    // ==================== APPOINTMENT NOTIFICATIONS ====================
    /**
     * Notify lawyer when a new appointment is created
     */
    notifyAppointmentCreated(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const clientName = ((_b = (_a = appointment.clientId) === null || _a === void 0 ? void 0 : _a.profileInfo) === null || _b === void 0 ? void 0 : _b.name) || 'A client';
            const appointmentDate = appointment.appointmentDate
                ? new Date(appointment.appointmentDate).toLocaleDateString()
                : 'soon';
            yield this.createNotification({
                userId: appointment.lawyerId,
                type: notification_interface_1.NotificationType.BOOKING_CREATED,
                title: '🎉 New Appointment Request',
                message: `${clientName} has requested an appointment for ${appointmentDate}. Case type: ${appointment.caseType}. Please review and confirm.`,
                relatedEntityId: appointment._id,
                relatedEntityType: 'appointment',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
        });
    }
    /**
     * Notify client when appointment is confirmed
     */
    notifyAppointmentConfirmed(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const lawyerName = ((_b = (_a = appointment.lawyerId) === null || _a === void 0 ? void 0 : _a.profileInfo) === null || _b === void 0 ? void 0 : _b.name) || 'Your lawyer';
            const appointmentDate = appointment.appointmentDate
                ? new Date(appointment.appointmentDate).toLocaleDateString()
                : 'your scheduled date';
            yield this.createNotification({
                userId: appointment.clientId,
                type: notification_interface_1.NotificationType.BOOKING_CONFIRMED,
                title: '✅ Appointment Confirmed!',
                message: `Great news! ${lawyerName} has confirmed your appointment for ${appointmentDate}. Get ready for your consultation!`,
                relatedEntityId: appointment._id,
                relatedEntityType: 'appointment',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
        });
    }
    /**
     * Notify client when appointment is declined/rejected
     */
    notifyAppointmentDeclined(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const lawyerName = ((_b = (_a = appointment.lawyerId) === null || _a === void 0 ? void 0 : _a.profileInfo) === null || _b === void 0 ? void 0 : _b.name) || 'The lawyer';
            yield this.createNotification({
                userId: appointment.clientId,
                type: notification_interface_1.NotificationType.BOOKING_DECLINED,
                title: '❌ Appointment Declined',
                message: `Unfortunately, ${lawyerName} has declined your appointment request. Please try another lawyer or time slot.`,
                relatedEntityId: appointment._id,
                relatedEntityType: 'appointment',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
        });
    }
    /**
     * Notify both client and lawyer when appointment is cancelled
     */
    sendAppointmentReminder(appointment, timeLabel) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const lawyerName = ((_b = (_a = appointment.lawyerId) === null || _a === void 0 ? void 0 : _a.profile_Details) === null || _b === void 0 ? void 0 : _b.fast_name) || 'your lawyer';
            const clientName = ((_d = (_c = appointment.clientId) === null || _c === void 0 ? void 0 : _c.profileInfo) === null || _d === void 0 ? void 0 : _d.fast_name) || 'your client';
            const appointmentDate = appointment.appointmentDate
                ? new Date(appointment.appointmentDate).toLocaleDateString()
                : 'soon';
            const notifications = [
                {
                    userId: appointment.clientId._id || appointment.clientId,
                    type: notification_interface_1.NotificationType.BOOKING_CONFIRMED,
                    title: `⏰ Appointment Reminder`,
                    message: `Reminder: Your appointment with ${lawyerName} is in ${timeLabel} on ${appointmentDate}.`,
                    relatedEntityId: appointment._id,
                    relatedEntityType: 'appointment',
                    priority: notification_interface_1.NotificationPriority.HIGH,
                },
                {
                    userId: appointment.lawyerId._id || appointment.lawyerId,
                    type: notification_interface_1.NotificationType.BOOKING_CONFIRMED,
                    title: `⏰ Appointment Reminder`,
                    message: `Reminder: Your appointment with ${clientName} is in ${timeLabel} on ${appointmentDate}.`,
                    relatedEntityId: appointment._id,
                    relatedEntityType: 'appointment',
                    priority: notification_interface_1.NotificationPriority.HIGH,
                },
            ];
            yield this.createBulkNotifications(notifications);
        });
    }
    notifyAppointmentRescheduled(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const lawyerName = ((_b = (_a = appointment.lawyerId) === null || _a === void 0 ? void 0 : _a.profile_Details) === null || _b === void 0 ? void 0 : _b.fast_name) || 'your lawyer';
            const clientName = ((_d = (_c = appointment.clientId) === null || _c === void 0 ? void 0 : _c.profileInfo) === null || _d === void 0 ? void 0 : _d.fast_name) || 'the client';
            const newDate = appointment.appointmentDate
                ? new Date(appointment.appointmentDate).toLocaleDateString()
                : 'a new date';
            const notifications = [
                {
                    userId: appointment.clientId._id || appointment.clientId,
                    type: notification_interface_1.NotificationType.BOOKING_CONFIRMED,
                    title: '🔄 Appointment Rescheduled',
                    message: `Your appointment with ${lawyerName} has been rescheduled to ${newDate} at ${appointment.selectedTime}.`,
                    relatedEntityId: appointment._id,
                    relatedEntityType: 'appointment',
                    priority: notification_interface_1.NotificationPriority.HIGH,
                },
                {
                    userId: appointment.lawyerId._id || appointment.lawyerId,
                    type: notification_interface_1.NotificationType.BOOKING_CONFIRMED,
                    title: '🔄 Appointment Rescheduled',
                    message: `${clientName} has rescheduled their appointment to ${newDate} at ${appointment.selectedTime}.`,
                    relatedEntityId: appointment._id,
                    relatedEntityType: 'appointment',
                    priority: notification_interface_1.NotificationPriority.HIGH,
                },
            ];
            yield this.createBulkNotifications(notifications);
        });
    }
    notifyAppointmentCancelled(appointment, cancelledByUserId, refundAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const clientName = ((_b = (_a = appointment.clientId) === null || _a === void 0 ? void 0 : _a.profileInfo) === null || _b === void 0 ? void 0 : _b.name) || 'The client';
            const lawyerName = ((_d = (_c = appointment.lawyerId) === null || _c === void 0 ? void 0 : _c.profileInfo) === null || _d === void 0 ? void 0 : _d.name) || 'The lawyer';
            const cancelledByClient = ((_e = appointment.clientId._id) === null || _e === void 0 ? void 0 : _e.toString()) === cancelledByUserId ||
                appointment.clientId.toString() === cancelledByUserId;
            const notifications = [];
            notifications.push({
                userId: appointment.clientId._id || appointment.clientId,
                type: notification_interface_1.NotificationType.BOOKING_CANCELLED,
                title: '🚫 Appointment Cancelled',
                message: cancelledByClient
                    ? `You have cancelled your appointment. ${refundAmount && refundAmount > 0 ? `৳${refundAmount} refund will be processed to your wallet.` : appointment.payment_Status === 'PAID' ? 'Refund is being processed.' : ''}`
                    : `Your appointment has been cancelled by ${lawyerName}.`,
                relatedEntityId: appointment._id,
                relatedEntityType: 'appointment',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
            notifications.push({
                userId: appointment.lawyerId._id || appointment.lawyerId,
                type: notification_interface_1.NotificationType.BOOKING_CANCELLED,
                title: '🚫 Appointment Cancelled',
                message: cancelledByClient
                    ? `${clientName} has cancelled their appointment.`
                    : `You have cancelled the appointment with ${clientName}.`,
                relatedEntityId: appointment._id,
                relatedEntityType: 'appointment',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
            yield this.createBulkNotifications(notifications);
        });
    }
    /**
     * Notify both client and lawyer when appointment is completed
     */
    notifyAppointmentCompleted(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const lawyerName = ((_b = (_a = appointment.lawyerId) === null || _a === void 0 ? void 0 : _a.profileInfo) === null || _b === void 0 ? void 0 : _b.name) || 'your lawyer';
            const clientName = ((_d = (_c = appointment.clientId) === null || _c === void 0 ? void 0 : _c.profileInfo) === null || _d === void 0 ? void 0 : _d.name) || 'the client';
            const notifications = [];
            notifications.push({
                userId: appointment.clientId._id || appointment.clientId,
                type: notification_interface_1.NotificationType.BOOKING_COMPLETED,
                title: '🎊 Appointment Completed!',
                message: `Your appointment with ${lawyerName} has been completed. We hope it was helpful! Please leave a review.`,
                relatedEntityId: appointment._id,
                relatedEntityType: 'appointment',
                priority: notification_interface_1.NotificationPriority.MEDIUM,
            });
            notifications.push({
                userId: appointment.lawyerId._id || appointment.lawyerId,
                type: notification_interface_1.NotificationType.BOOKING_COMPLETED,
                title: '🎊 Appointment Completed!',
                message: `Your appointment with ${clientName} has been marked as completed. Great job!`,
                relatedEntityId: appointment._id,
                relatedEntityType: 'appointment',
                priority: notification_interface_1.NotificationPriority.MEDIUM,
            });
            yield this.createBulkNotifications(notifications);
        });
    }
    // ==================== PAYMENT NOTIFICATIONS ====================
    /**
     * Notify client and lawyer when payment is successful
     */
    notifyPaymentSuccess(payment, appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const lawyerName = ((_b = (_a = appointment.lawyerId) === null || _a === void 0 ? void 0 : _a.profileInfo) === null || _b === void 0 ? void 0 : _b.name) || 'the lawyer';
            const amount = payment.amount;
            const notifications = [];
            notifications.push({
                userId: appointment.clientId._id || appointment.clientId,
                type: notification_interface_1.NotificationType.PAYMENT_SUCCESS,
                title: '💳 Payment Successful',
                message: `Your payment of ${amount} BDT was successful. Your appointment with ${lawyerName} is now pending confirmation.`,
                relatedEntityId: payment._id,
                relatedEntityType: 'payment',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
            notifications.push({
                userId: appointment.lawyerId._id || appointment.lawyerId,
                type: notification_interface_1.NotificationType.PAYMENT_SUCCESS,
                title: '💰 Payment Received',
                message: `Payment of ${amount} BDT received for appointment. Please confirm the appointment.`,
                relatedEntityId: payment._id,
                relatedEntityType: 'payment',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
            yield this.createBulkNotifications(notifications);
        });
    }
    /**
     * Notify client when payment fails
     */
    notifyPaymentFailed(payment, appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createNotification({
                userId: appointment.clientId,
                type: notification_interface_1.NotificationType.PAYMENT_FAILED,
                title: '❌ Payment Failed',
                message: `Payment for your appointment failed. Please try again or use a different payment method.`,
                relatedEntityId: payment._id,
                relatedEntityType: 'payment',
                priority: notification_interface_1.NotificationPriority.URGENT,
            });
        });
    }
    /**
     * Notify client when payment is refunded
     */
    notifyPaymentRefunded(payment, appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            const refundAmount = payment.amount;
            yield this.createNotification({
                userId: appointment.clientId,
                type: notification_interface_1.NotificationType.PAYMENT_REFUNDED,
                title: '💵 Refund Processed',
                message: `Refund of ${refundAmount} BDT has been processed for your cancelled appointment. The amount will be credited to your account shortly.`,
                relatedEntityId: payment._id,
                relatedEntityType: 'payment',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
        });
    }
    // ==================== REVIEW NOTIFICATIONS ====================
    /**
     * Notify lawyer when they receive a review
     */
    notifyLawyerReviewReceived(review, lawyer) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const clientName = ((_b = (_a = review.clientId) === null || _a === void 0 ? void 0 : _a.profileInfo) === null || _b === void 0 ? void 0 : _b.name) || 'A client';
            const rating = review.rating;
            yield this.createNotification({
                userId: lawyer._id,
                type: notification_interface_1.NotificationType.REVIEW_RECEIVED_LAWYER,
                title: '⭐ New Review Received',
                message: `${clientName} left you a ${rating}-star review. Check it out!`,
                relatedEntityId: review._id,
                relatedEntityType: 'review',
                priority: notification_interface_1.NotificationPriority.MEDIUM,
            });
        });
    }
    // ==================== PAYOUT NOTIFICATIONS ====================
    /**
     * Notify admin when lawyer requests payout
     */
    notifyPayoutRequested(payout, lawyer) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const lawyerName = ((_a = lawyer.profileInfo) === null || _a === void 0 ? void 0 : _a.name) || 'A lawyer';
            const amount = payout.amount;
            const netAmount = payout.netAmount;
            const platformFee = payout.platformFee;
            const User = require('../user/user.model').UserModel;
            const admins = yield User.find({ role: user_interface_1.ERole.SUPER_ADMIN, isDeleted: false }).select('_id');
            const notifications = admins.map((admin) => ({
                userId: admin._id,
                type: notification_interface_1.NotificationType.PAYOUT_REQUESTED,
                title: '💼 New Payout Request',
                message: `${lawyerName} requested a payout of ${amount} BDT. Net amount: ${netAmount} BDT (Platform fee: ${platformFee} BDT).`,
                relatedEntityId: payout._id,
                relatedEntityType: 'payout',
                priority: notification_interface_1.NotificationPriority.HIGH,
            }));
            if (notifications.length > 0) {
                yield this.createBulkNotifications(notifications);
            }
        });
    }
    /**
     * Notify lawyer when payout is sent
     */
    notifyPayoutSent(payout) {
        return __awaiter(this, void 0, void 0, function* () {
            const netAmount = payout.netAmount;
            const platformFee = payout.platformFee;
            yield this.createNotification({
                userId: payout.lawyerId,
                type: notification_interface_1.NotificationType.PAYOUT_PROCESSED,
                title: '✅ Payout Sent',
                message: `Your payout of ${netAmount} BDT has been sent and is on its way to your account. (Platform fee: ${platformFee} BDT deducted)`,
                relatedEntityId: payout._id,
                relatedEntityType: 'payout',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
        });
    }
    /**
     * Notify lawyer when payout is processed
     */
    notifyPayoutProcessed(payout) {
        return __awaiter(this, void 0, void 0, function* () {
            const netAmount = payout.netAmount;
            const platformFee = payout.platformFee;
            yield this.createNotification({
                userId: payout.lawyerId,
                type: notification_interface_1.NotificationType.PAYOUT_PROCESSED,
                title: '✅ Payout Processed',
                message: `Your payout of ${netAmount} BDT has been successfully processed and sent to your account. (Platform fee: ${platformFee} BDT deducted)`,
                relatedEntityId: payout._id,
                relatedEntityType: 'payout',
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
        });
    }
    /**
     * Notify lawyer when payout fails
     */
    notifyPayoutFailed(payout) {
        return __awaiter(this, void 0, void 0, function* () {
            const reason = payout.failureReason || 'Unknown reason';
            const amount = payout.amount;
            yield this.createNotification({
                userId: payout.lawyerId,
                type: notification_interface_1.NotificationType.PAYOUT_FAILED,
                title: '❌ Payout Failed',
                message: `Your payout request of ${amount} BDT failed. Reason: ${reason}. The amount has been returned to your wallet.`,
                relatedEntityId: payout._id,
                relatedEntityType: 'payout',
                priority: notification_interface_1.NotificationPriority.URGENT,
            });
        });
    }
    /**
     * Notify lawyer when payout is cancelled
     */
    notifyPayoutCancelled(payout) {
        return __awaiter(this, void 0, void 0, function* () {
            const amount = payout.amount;
            yield this.createNotification({
                userId: payout.lawyerId,
                type: notification_interface_1.NotificationType.PAYOUT_CANCELLED,
                title: '🚫 Payout Cancelled',
                message: `Your payout request of ${amount} BDT has been cancelled. The amount has been returned to your wallet.`,
                relatedEntityId: payout._id,
                relatedEntityType: 'payout',
                priority: notification_interface_1.NotificationPriority.MEDIUM,
            });
        });
    }
    // ==================== ACCOUNT NOTIFICATIONS ====================
    /**
     * Notify user when account is verified
     */
    notifyAccountVerified(userId, userName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createNotification({
                userId,
                type: notification_interface_1.NotificationType.ACCOUNT_VERIFIED,
                title: '✅ Account Verified',
                message: `Congratulations ${userName}! Your account has been verified. You now have full access to all features.`,
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
        });
    }
    /**
     * Notify user when account status changes
     */
    notifyAccountStatusChanged(userId, newStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            const statusMessages = {
                ACTIVE: 'Your account has been activated. You can now access all features.',
                INACTIVE: 'Your account has been set to inactive.',
                BLOCKED: 'Your account has been blocked. Please contact support for more information.',
            };
            yield this.createNotification({
                userId,
                type: notification_interface_1.NotificationType.ACCOUNT_STATUS_CHANGED,
                title: '🔔 Account Status Updated',
                message: statusMessages[newStatus] || `Your account status has been changed to ${newStatus}.`,
                priority: newStatus === 'BLOCKED' ? notification_interface_1.NotificationPriority.URGENT : notification_interface_1.NotificationPriority.HIGH,
            });
        });
    }
    /**
     * Notify user when password is reset successfully
     */
    notifyPasswordResetSuccess(userId, userName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createNotification({
                userId,
                type: notification_interface_1.NotificationType.PASSWORD_RESET_SUCCESS,
                title: '🔐 Password Reset Successful',
                message: `Hi ${userName}, your password has been reset successfully. If you didn't make this change, please contact support immediately.`,
                priority: notification_interface_1.NotificationPriority.HIGH,
            });
        });
    }
}
exports.NotificationHelper = new NotificationHelperClass();
