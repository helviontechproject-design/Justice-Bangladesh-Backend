import { Types } from 'mongoose';
import { Notification } from './notification.model';
import { NotificationType, NotificationPriority } from './notification.interface';
import { ERole } from '../user/user.interface';

interface CreateNotificationData {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string | Types.ObjectId;
  relatedEntityType?: string;
  priority?: NotificationPriority;
  actionUrl?: string;
}

class NotificationHelperClass {
  /**
   * Create a single notification
   */
  async createNotification(data: CreateNotificationData): Promise<void> {
    try {
      await Notification.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedEntityId: data.relatedEntityId || null,
        relatedEntityType: data.relatedEntityType || null,
        priority: data.priority || NotificationPriority.MEDIUM,
        actionUrl: data.actionUrl || null,
        isRead: false,
      });
      console.log(`✅ Notification created: ${data.type} for user ${data.userId}`);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }

  /**
   * Create multiple notifications at once
   */
  async createBulkNotifications(notifications: CreateNotificationData[]): Promise<void> {
    try {
      const notificationDocs = notifications.map(data => ({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedEntityId: data.relatedEntityId || null,
        relatedEntityType: data.relatedEntityType || null,
        priority: data.priority || NotificationPriority.MEDIUM,
        actionUrl: data.actionUrl || null,
        isRead: false,
      }));

      await Notification.insertMany(notificationDocs);
      console.log(`✅ ${notifications.length} notifications created`);
    } catch (error) {
      console.error('❌ Error creating bulk notifications:', error);
    }
  }

  // ==================== APPOINTMENT NOTIFICATIONS ====================

  /**
   * Notify lawyer when a new appointment is created
   */
  async notifyAppointmentCreated(appointment: any): Promise<void> {
    const clientName = appointment.clientId?.profileInfo?.name || 'A client';
    const appointmentDate = appointment.appointmentDate 
      ? new Date(appointment.appointmentDate).toLocaleDateString() 
      : 'soon';

    await this.createNotification({
      userId: appointment.lawyerId,
      type: NotificationType.BOOKING_CREATED,
      title: '🎉 New Appointment Request',
      message: `${clientName} has requested an appointment for ${appointmentDate}. Case type: ${appointment.caseType}. Please review and confirm.`,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify client when appointment is confirmed
   */
  async notifyAppointmentConfirmed(appointment: any): Promise<void> {
    const lawyerName = appointment.lawyerId?.profileInfo?.name || 'Your lawyer';
    const appointmentDate = appointment.appointmentDate 
      ? new Date(appointment.appointmentDate).toLocaleDateString() 
      : 'your scheduled date';

    await this.createNotification({
      userId: appointment.clientId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: '✅ Appointment Confirmed!',
      message: `Great news! ${lawyerName} has confirmed your appointment for ${appointmentDate}. Get ready for your consultation!`,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify client when appointment is declined/rejected
   */
  async notifyAppointmentDeclined(appointment: any): Promise<void> {
    const lawyerName = appointment.lawyerId?.profileInfo?.name || 'The lawyer';

    await this.createNotification({
      userId: appointment.clientId,
      type: NotificationType.BOOKING_DECLINED,
      title: '❌ Appointment Declined',
      message: `Unfortunately, ${lawyerName} has declined your appointment request. Please try another lawyer or time slot.`,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify both client and lawyer when appointment is cancelled
   */
  async sendAppointmentReminder(appointment: any, timeLabel: string): Promise<void> {
    const lawyerName = appointment.lawyerId?.profile_Details?.fast_name || 'your lawyer';
    const clientName = appointment.clientId?.profileInfo?.fast_name || 'your client';
    const appointmentDate = appointment.appointmentDate
      ? new Date(appointment.appointmentDate).toLocaleDateString()
      : 'soon';

    const notifications: CreateNotificationData[] = [
      {
        userId: appointment.clientId._id || appointment.clientId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: `⏰ Appointment Reminder`,
        message: `Reminder: Your appointment with ${lawyerName} is in ${timeLabel} on ${appointmentDate}.`,
        relatedEntityId: appointment._id,
        relatedEntityType: 'appointment',
        priority: NotificationPriority.HIGH,
      },
      {
        userId: appointment.lawyerId._id || appointment.lawyerId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: `⏰ Appointment Reminder`,
        message: `Reminder: Your appointment with ${clientName} is in ${timeLabel} on ${appointmentDate}.`,
        relatedEntityId: appointment._id,
        relatedEntityType: 'appointment',
        priority: NotificationPriority.HIGH,
      },
    ];

    await this.createBulkNotifications(notifications);
  }

  async notifyAppointmentRescheduled(appointment: any): Promise<void> {
    const lawyerName = appointment.lawyerId?.profile_Details?.fast_name || 'your lawyer';
    const clientName = appointment.clientId?.profileInfo?.fast_name || 'the client';
    const newDate = appointment.appointmentDate
      ? new Date(appointment.appointmentDate).toLocaleDateString()
      : 'a new date';

    const notifications: CreateNotificationData[] = [
      {
        userId: appointment.clientId._id || appointment.clientId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: '🔄 Appointment Rescheduled',
        message: `Your appointment with ${lawyerName} has been rescheduled to ${newDate} at ${appointment.selectedTime}.`,
        relatedEntityId: appointment._id,
        relatedEntityType: 'appointment',
        priority: NotificationPriority.HIGH,
      },
      {
        userId: appointment.lawyerId._id || appointment.lawyerId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: '🔄 Appointment Rescheduled',
        message: `${clientName} has rescheduled their appointment to ${newDate} at ${appointment.selectedTime}.`,
        relatedEntityId: appointment._id,
        relatedEntityType: 'appointment',
        priority: NotificationPriority.HIGH,
      },
    ];

    await this.createBulkNotifications(notifications);
  }

  async notifyAppointmentCancelled(appointment: any, cancelledByUserId: string, refundAmount?: number): Promise<void> {
    const clientName = appointment.clientId?.profileInfo?.name || 'The client';
    const lawyerName = appointment.lawyerId?.profileInfo?.name || 'The lawyer';
    
    const cancelledByClient = appointment.clientId._id?.toString() === cancelledByUserId || 
                              appointment.clientId.toString() === cancelledByUserId;

    const notifications: CreateNotificationData[] = [];

    notifications.push({
      userId: appointment.clientId._id || appointment.clientId,
      type: NotificationType.BOOKING_CANCELLED,
      title: '🚫 Appointment Cancelled',
      message: cancelledByClient
        ? `You have cancelled your appointment. ${refundAmount && refundAmount > 0 ? `৳${refundAmount} refund will be processed to your wallet.` : appointment.payment_Status === 'PAID' ? 'Refund is being processed.' : ''}`
        : `Your appointment has been cancelled by ${lawyerName}.`,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      priority: NotificationPriority.HIGH,
    });

    notifications.push({
      userId: appointment.lawyerId._id || appointment.lawyerId,
      type: NotificationType.BOOKING_CANCELLED,
      title: '🚫 Appointment Cancelled',
      message: cancelledByClient
        ? `${clientName} has cancelled their appointment.`
        : `You have cancelled the appointment with ${clientName}.`,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      priority: NotificationPriority.HIGH,
    });

    await this.createBulkNotifications(notifications);
  }

  /**
   * Notify both client and lawyer when appointment is completed
   */
  async notifyAppointmentCompleted(appointment: any): Promise<void> {
    const lawyerName = appointment.lawyerId?.profileInfo?.name || 'your lawyer';
    const clientName = appointment.clientId?.profileInfo?.name || 'the client';

    const notifications: CreateNotificationData[] = [];

    notifications.push({
      userId: appointment.clientId._id || appointment.clientId,
      type: NotificationType.BOOKING_COMPLETED,
      title: '🎊 Appointment Completed!',
      message: `Your appointment with ${lawyerName} has been completed. We hope it was helpful! Please leave a review.`,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      priority: NotificationPriority.MEDIUM,
    });

    notifications.push({
      userId: appointment.lawyerId._id || appointment.lawyerId,
      type: NotificationType.BOOKING_COMPLETED,
      title: '🎊 Appointment Completed!',
      message: `Your appointment with ${clientName} has been marked as completed. Great job!`,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      priority: NotificationPriority.MEDIUM,
    });

    await this.createBulkNotifications(notifications);
  }

  // ==================== PAYMENT NOTIFICATIONS ====================

  /**
   * Notify client and lawyer when payment is successful
   */
  async notifyPaymentSuccess(payment: any, appointment: any): Promise<void> {
    const lawyerName = appointment.lawyerId?.profileInfo?.name || 'the lawyer';
    const amount = payment.amount;

    const notifications: CreateNotificationData[] = [];

    notifications.push({
      userId: appointment.clientId._id || appointment.clientId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: '💳 Payment Successful',
      message: `Your payment of ${amount} BDT was successful. Your appointment with ${lawyerName} is now pending confirmation.`,
      relatedEntityId: payment._id,
      relatedEntityType: 'payment',
      priority: NotificationPriority.HIGH,
    });

    notifications.push({
      userId: appointment.lawyerId._id || appointment.lawyerId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: '💰 Payment Received',
      message: `Payment of ${amount} BDT received for appointment. Please confirm the appointment.`,
      relatedEntityId: payment._id,
      relatedEntityType: 'payment',
      priority: NotificationPriority.HIGH,
    });

    await this.createBulkNotifications(notifications);
  }

  /**
   * Notify client when payment fails
   */
  async notifyPaymentFailed(payment: any, appointment: any): Promise<void> {
    await this.createNotification({
      userId: appointment.clientId,
      type: NotificationType.PAYMENT_FAILED,
      title: '❌ Payment Failed',
      message: `Payment for your appointment failed. Please try again or use a different payment method.`,
      relatedEntityId: payment._id,
      relatedEntityType: 'payment',
      priority: NotificationPriority.URGENT,
    });
  }

  /**
   * Notify client when payment is refunded
   */
  async notifyPaymentRefunded(payment: any, appointment: any): Promise<void> {
    const refundAmount = payment.amount;

    await this.createNotification({
      userId: appointment.clientId,
      type: NotificationType.PAYMENT_REFUNDED,
      title: '💵 Refund Processed',
      message: `Refund of ${refundAmount} BDT has been processed for your cancelled appointment. The amount will be credited to your account shortly.`,
      relatedEntityId: payment._id,
      relatedEntityType: 'payment',
      priority: NotificationPriority.HIGH,
    });
  }

  // ==================== REVIEW NOTIFICATIONS ====================

  /**
   * Notify lawyer when they receive a review
   */
  async notifyLawyerReviewReceived(review: any, lawyer: any): Promise<void> {
    const clientName = review.clientId?.profileInfo?.name || 'A client';
    const rating = review.rating;

    await this.createNotification({
      userId: lawyer._id,
      type: NotificationType.REVIEW_RECEIVED_LAWYER,
      title: '⭐ New Review Received',
      message: `${clientName} left you a ${rating}-star review. Check it out!`,
      relatedEntityId: review._id,
      relatedEntityType: 'review',
      priority: NotificationPriority.MEDIUM,
    });
  }

  // ==================== PAYOUT NOTIFICATIONS ====================

  /**
   * Notify admin when lawyer requests payout
   */
  async notifyPayoutRequested(payout: any, lawyer: any): Promise<void> {
    const lawyerName = lawyer.profileInfo?.name || 'A lawyer';
    const amount = payout.amount;
    const netAmount = payout.netAmount;
    const platformFee = payout.platformFee;

    const User = require('../user/user.model').UserModel;
    const admins = await User.find({ role: ERole.SUPER_ADMIN, isDeleted: false }).select('_id');

    const notifications: CreateNotificationData[] = admins.map((admin: any) => ({
      userId: admin._id,
      type: NotificationType.PAYOUT_REQUESTED,
      title: '💼 New Payout Request',
      message: `${lawyerName} requested a payout of ${amount} BDT. Net amount: ${netAmount} BDT (Platform fee: ${platformFee} BDT).`,
      relatedEntityId: payout._id,
      relatedEntityType: 'payout',
      priority: NotificationPriority.HIGH,
    }));

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  /**
   * Notify lawyer when payout is sent
   */
  async notifyPayoutSent(payout: any): Promise<void> {
    const netAmount = payout.netAmount;
    const platformFee = payout.platformFee;

    await this.createNotification({
      userId: payout.lawyerId,
      type: NotificationType.PAYOUT_PROCESSED,
      title: '✅ Payout Sent',
      message: `Your payout of ${netAmount} BDT has been sent and is on its way to your account. (Platform fee: ${platformFee} BDT deducted)`,
      relatedEntityId: payout._id,
      relatedEntityType: 'payout',
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify lawyer when payout is processed
   */
  async notifyPayoutProcessed(payout: any): Promise<void> {
    const netAmount = payout.netAmount;
    const platformFee = payout.platformFee;

    await this.createNotification({
      userId: payout.lawyerId,
      type: NotificationType.PAYOUT_PROCESSED,
      title: '✅ Payout Processed',
      message: `Your payout of ${netAmount} BDT has been successfully processed and sent to your account. (Platform fee: ${platformFee} BDT deducted)`,
      relatedEntityId: payout._id,
      relatedEntityType: 'payout',
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify lawyer when payout fails
   */
  async notifyPayoutFailed(payout: any): Promise<void> {
    const reason = payout.failureReason || 'Unknown reason';
    const amount = payout.amount;

    await this.createNotification({
      userId: payout.lawyerId,
      type: NotificationType.PAYOUT_FAILED,
      title: '❌ Payout Failed',
      message: `Your payout request of ${amount} BDT failed. Reason: ${reason}. The amount has been returned to your wallet.`,
      relatedEntityId: payout._id,
      relatedEntityType: 'payout',
      priority: NotificationPriority.URGENT,
    });
  }

  /**
   * Notify lawyer when payout is cancelled
   */
  async notifyPayoutCancelled(payout: any): Promise<void> {
    const amount = payout.amount;

    await this.createNotification({
      userId: payout.lawyerId,
      type: NotificationType.PAYOUT_CANCELLED,
      title: '🚫 Payout Cancelled',
      message: `Your payout request of ${amount} BDT has been cancelled. The amount has been returned to your wallet.`,
      relatedEntityId: payout._id,
      relatedEntityType: 'payout',
      priority: NotificationPriority.MEDIUM,
    });
  }

  // ==================== ACCOUNT NOTIFICATIONS ====================

  /**
   * Notify user when account is verified
   */
  async notifyAccountVerified(userId: string | Types.ObjectId, userName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.ACCOUNT_VERIFIED,
      title: '✅ Account Verified',
      message: `Congratulations ${userName}! Your account has been verified. You now have full access to all features.`,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify user when account status changes
   */
  async notifyAccountStatusChanged(userId: string | Types.ObjectId, newStatus: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      ACTIVE: 'Your account has been activated. You can now access all features.',
      INACTIVE: 'Your account has been set to inactive.',
      BLOCKED: 'Your account has been blocked. Please contact support for more information.',
    };

    await this.createNotification({
      userId,
      type: NotificationType.ACCOUNT_STATUS_CHANGED,
      title: '🔔 Account Status Updated',
      message: statusMessages[newStatus] || `Your account status has been changed to ${newStatus}.`,
      priority: newStatus === 'BLOCKED' ? NotificationPriority.URGENT : NotificationPriority.HIGH,
    });
  }

  /**
   * Notify user when password is reset successfully
   */
  async notifyPasswordResetSuccess(userId: string | Types.ObjectId, userName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.PASSWORD_RESET_SUCCESS,
      title: '🔐 Password Reset Successful',
      message: `Hi ${userName}, your password has been reset successfully. If you didn't make this change, please contact support immediately.`,
      priority: NotificationPriority.HIGH,
    });
  }
}

export const NotificationHelper = new NotificationHelperClass();
