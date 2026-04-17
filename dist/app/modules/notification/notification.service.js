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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationServices = void 0;
const notification_model_1 = require("./notification.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const user_model_1 = require("../user/user.model");
const firebase_notification_service_1 = __importDefault(require("../../services/firebase-notification.service"));
const mongoose_1 = require("mongoose");
const getUserNotifications = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const notifications = notification_model_1.Notification.find({ userId });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(notifications, query);
    const allNotifications = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([
        allNotifications.build().exec(),
        queryBuilder.getMeta(),
    ]);
    const count = yield notification_model_1.Notification.countDocuments({ userId, isRead: false });
    return {
        data,
        meta: Object.assign(Object.assign({}, meta), { unreadCount: count }),
    };
});
const markAsRead = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findById(id);
    if (!notification) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
    }
    if (notification.userId.toString() !== userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You can only mark your own notifications as read');
    }
    notification.isRead = true;
    yield notification.save();
    return notification;
});
const markAllAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield notification_model_1.Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
});
const deleteNotification = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findById(id);
    if (!notification) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
    }
    if (notification.userId.toString() !== userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You can only delete your own notifications');
    }
    yield notification_model_1.Notification.findByIdAndDelete(id);
    return notification;
});
const saveFCMToken = (userId, fcmToken) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.UserModel.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    if (!user.fcmTokens) {
        user.fcmTokens = [];
    }
    if (!user.fcmTokens.includes(fcmToken)) {
        user.fcmTokens.push(fcmToken);
    }
    yield user.save();
    return user;
});
const sendToUsers = (userIds, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.UserModel.find({ _id: { $in: userIds } });
        if (users.length === 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No users found');
        }
        // Collect all FCM tokens
        const allTokens = [];
        for (const user of users) {
            if (user.fcmTokens && user.fcmTokens.length > 0) {
                allTokens.push(...user.fcmTokens);
            }
        }
        if (allTokens.length === 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No FCM tokens found for the selected users');
        }
        // Send push notification
        const result = yield firebase_notification_service_1.default.sendNotification({
            title,
            body,
            fcmTokens: allTokens,
            data,
        });
        // Save to database
        for (const userId of userIds) {
            const notification = new notification_model_1.Notification({
                userId: new mongoose_1.Types.ObjectId(userId),
                title,
                message: body,
                type: 'ACCOUNT_VERIFIED',
                isRead: false,
            });
            yield notification.save();
        }
        return result;
    }
    catch (error) {
        throw error;
    }
});
const sendToAll = (title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.UserModel.find({ isDeleted: false });
        if (users.length === 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No users found');
        }
        // Collect all FCM tokens
        const allTokens = [];
        for (const user of users) {
            if (user.fcmTokens && user.fcmTokens.length > 0) {
                allTokens.push(...user.fcmTokens);
            }
        }
        if (allTokens.length === 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No FCM tokens found for any users');
        }
        // Send push notification
        const result = yield firebase_notification_service_1.default.sendNotification({
            title,
            body,
            fcmTokens: allTokens,
            data,
        });
        return result;
    }
    catch (error) {
        throw error;
    }
});
const sendToTopic = (topic, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield firebase_notification_service_1.default.sendNotificationToTopic({
            title,
            body,
            topic,
            data,
        });
        return result;
    }
    catch (error) {
        throw error;
    }
});
exports.notificationServices = {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    saveFCMToken,
    sendToUsers,
    sendToAll,
    sendToTopic,
};
