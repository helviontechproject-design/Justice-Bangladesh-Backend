import { BroadcastNotification } from './broadcast.model';
import { Notification } from './notification.model';
import { NotificationType, NotificationPriority } from './notification.interface';
import { UserModel } from '../user/user.model';
import { ERole } from '../user/user.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes } from 'http-status-codes';
import { sendFCMToTokens } from '../../utils/fcm';
import { ERecipientType } from './broadcast.interface';

const createBroadcast = async (payload: { title: string; description?: string; imageUrl?: string; recipientType?: string }) => {
  const broadcast = await BroadcastNotification.create({
    ...payload,
    recipientType: payload.recipientType || ERecipientType.ALL,
    deliveryCount: 0,
  });
  return broadcast;
};

const sendBroadcast = async (id: string) => {
  const broadcast = await BroadcastNotification.findById(id);
  if (!broadcast) throw new AppError(StatusCodes.NOT_FOUND, 'Broadcast not found');

  // Filter users based on recipient type
  let roleFilter: string[] = [];
  if (broadcast.recipientType === ERecipientType.LAWYERS) {
    roleFilter = [ERole.LAWYER];
  } else if (broadcast.recipientType === ERecipientType.CLIENTS) {
    roleFilter = [ERole.CLIENT];
  } else {
    roleFilter = [ERole.LAWYER, ERole.CLIENT]; // ALL (excluding SUPER_ADMIN)
  }

  const users = await UserModel.find(
    { isDeleted: false, role: { $in: roleFilter } }
  ).select('_id fcmTokens role');

  const notifications = users.map((user) => ({
    userId: user._id,
    type: NotificationType.ACCOUNT_STATUS_CHANGED,
    title: broadcast.title,
    message: broadcast.description || broadcast.title,
    imageUrl: broadcast.imageUrl || null,
    priority: NotificationPriority.MEDIUM,
    isRead: false,
  }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  // Send FCM push notifications
  const fcmTokens: string[] = [];
  for (const user of users) {
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      fcmTokens.push(...user.fcmTokens);
    }
  }

  if (fcmTokens.length > 0) {
    await sendFCMToTokens(
      fcmTokens,
      broadcast.title,
      broadcast.description || broadcast.title,
      broadcast.imageUrl,
      { type: 'BROADCAST' },
    );
  }

  // Update delivery count and sent time
  broadcast.deliveryCount = fcmTokens.length;
  broadcast.sentAt = new Date();
  await broadcast.save();

  return broadcast;
};

const getAllBroadcasts = async () => {
  return BroadcastNotification.find().sort({ createdAt: -1 });
};

const updateBroadcast = async (id: string, payload: { title?: string; description?: string; imageUrl?: string; recipientType?: string }) => {
  const broadcast = await BroadcastNotification.findByIdAndUpdate(id, payload, { new: true });
  if (!broadcast) throw new AppError(StatusCodes.NOT_FOUND, 'Broadcast not found');
  return broadcast;
};

const deleteBroadcast = async (id: string) => {
  const broadcast = await BroadcastNotification.findByIdAndDelete(id);
  if (!broadcast) throw new AppError(StatusCodes.NOT_FOUND, 'Broadcast not found');
  return broadcast;
};

export const broadcastService = {
  createBroadcast,
  sendBroadcast,
  getAllBroadcasts,
  updateBroadcast,
  deleteBroadcast,
};
