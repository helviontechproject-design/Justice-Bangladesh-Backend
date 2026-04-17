import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { notificationServices } from './notification.service';

const getUserNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).userId;
  const result = await notificationServices.getUserNotifications(userId, req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.user as any).userId;
  const result = await notificationServices.markAsRead(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification marked as read',
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).userId;
  const result = await notificationServices.markAllAsRead(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All notifications marked as read',
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.user as any).userId;
  await notificationServices.deleteNotification(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification deleted successfully',
    data: null,
  });
});

const sendToUsers = catchAsync(async (req: Request, res: Response) => {
  const { userIds, title, body, data } = req.body;

  if (!userIds || !title || !body) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'userIds, title, and body are required',
      data: null,
    });
  }

  const result = await notificationServices.sendToUsers(
    userIds,
    title,
    body,
    data
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification sent to users successfully',
    data: result,
  });
});

const sendToAll = catchAsync(async (req: Request, res: Response) => {
  const { title, body, data } = req.body;

  if (!title || !body) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'title and body are required',
      data: null,
    });
  }

  const result = await notificationServices.sendToAll(title, body, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification sent to all users successfully',
    data: result,
  });
});

const sendToTopic = catchAsync(async (req: Request, res: Response) => {
  const { topic, title, body, data } = req.body;

  if (!topic || !title || !body) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'topic, title, and body are required',
      data: null,
    });
  }

  const result = await notificationServices.sendToTopic(
    topic,
    title,
    body,
    data
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification sent to topic successfully',
    data: result,
  });
});

const saveFCMToken = catchAsync(async (req: Request, res: Response) => {
  const { fcmToken } = req.body;
  const userId = (req.user as any).userId;

  if (!fcmToken) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'FCM token is required',
      data: null,
    });
  }

  const result = await notificationServices.saveFCMToken(userId, fcmToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'FCM token saved successfully',
    data: result,
  });
});

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).userId;
  const result = await notificationServices.getUserNotifications(
    userId,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

export const notificationController = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  saveFCMToken,
  sendToUsers,
  sendToAll,
  sendToTopic,
  getMyNotifications,
};
