import { Notification } from './notification.model';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { UserModel } from '../user/user.model';
import FirebaseNotificationService from '../../services/firebase-notification.service';
import { Types } from 'mongoose';

const getUserNotifications = async (userId: string, query: Record<string, string>) => {
  const notifications = Notification.find({ userId });
  const queryBuilder = new QueryBuilder(notifications, query);
  const allNotifications = queryBuilder.filter().sort().paginate();

  const [data, meta] = await Promise.all([
    allNotifications.build().exec(),
    queryBuilder.getMeta(),
  ]);

  const count = await Notification.countDocuments({ userId, isRead: false });

  return {
    data,
    meta: { ...meta, unreadCount: count },
  };
};

const markAsRead = async (id: string, userId: string) => {
  const notification = await Notification.findById(id);

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  if (notification.userId.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only mark your own notifications as read');
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

const markAllAsRead = async (userId: string) => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  return { message: 'All notifications marked as read' };
};

const deleteNotification = async (id: string, userId: string) => {
  const notification = await Notification.findById(id);

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  if (notification.userId.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only delete your own notifications');
  }

  await Notification.findByIdAndDelete(id);
  return notification;
};

const saveFCMToken = async (userId: string, fcmToken: string) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.fcmTokens) {
    user.fcmTokens = [];
  }

  if (!user.fcmTokens.includes(fcmToken)) {
    user.fcmTokens.push(fcmToken);
  }

  await user.save();
  return user;
};

const sendToUsers = async (
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    const users = await UserModel.find({ _id: { $in: userIds } });

    if (users.length === 0) {
      throw new AppError(httpStatus.NOT_FOUND, 'No users found');
    }

    // Collect all FCM tokens
    const allTokens: string[] = [];
    for (const user of users) {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        allTokens.push(...user.fcmTokens);
      }
    }

    if (allTokens.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'No FCM tokens found for the selected users'
      );
    }

    // Send push notification
    const result = await FirebaseNotificationService.sendNotification({
      title,
      body,
      fcmTokens: allTokens,
      data,
    });

    // Save to database
    for (const userId of userIds) {
      const notification = new Notification({
        userId: new Types.ObjectId(userId),
        title,
        message: body,
        type: 'ACCOUNT_VERIFIED',
        isRead: false,
      });
      await notification.save();
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const sendToAll = async (
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    const users = await UserModel.find({ isDeleted: false });

    if (users.length === 0) {
      throw new AppError(httpStatus.NOT_FOUND, 'No users found');
    }

    // Collect all FCM tokens
    const allTokens: string[] = [];
    for (const user of users) {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        allTokens.push(...user.fcmTokens);
      }
    }

    if (allTokens.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'No FCM tokens found for any users'
      );
    }

    // Send push notification
    const result = await FirebaseNotificationService.sendNotification({
      title,
      body,
      fcmTokens: allTokens,
      data,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

const sendToTopic = async (
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    const result = await FirebaseNotificationService.sendNotificationToTopic({
      title,
      body,
      topic,
      data,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

export const notificationServices = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  saveFCMToken,
  sendToUsers,
  sendToAll,
  sendToTopic,
};
