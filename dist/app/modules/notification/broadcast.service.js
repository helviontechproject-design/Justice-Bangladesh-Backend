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
exports.broadcastService = void 0;
const broadcast_model_1 = require("./broadcast.model");
const notification_model_1 = require("./notification.model");
const notification_interface_1 = require("./notification.interface");
const user_model_1 = require("../user/user.model");
const user_interface_1 = require("../user/user.interface");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const fcm_1 = require("../../utils/fcm");
const broadcast_interface_1 = require("./broadcast.interface");
const createBroadcast = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const broadcast = yield broadcast_model_1.BroadcastNotification.create(Object.assign(Object.assign({}, payload), { recipientType: payload.recipientType || broadcast_interface_1.ERecipientType.ALL, deliveryCount: 0 }));
    return broadcast;
});
const sendBroadcast = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const broadcast = yield broadcast_model_1.BroadcastNotification.findById(id);
    if (!broadcast)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Broadcast not found');
    // Filter users based on recipient type
    let roleFilter = [];
    if (broadcast.recipientType === broadcast_interface_1.ERecipientType.LAWYERS) {
        roleFilter = [user_interface_1.ERole.LAWYER];
    }
    else if (broadcast.recipientType === broadcast_interface_1.ERecipientType.CLIENTS) {
        roleFilter = [user_interface_1.ERole.CLIENT];
    }
    else {
        roleFilter = [user_interface_1.ERole.LAWYER, user_interface_1.ERole.CLIENT]; // ALL (excluding SUPER_ADMIN)
    }
    const users = yield user_model_1.UserModel.find({ isDeleted: false, role: { $in: roleFilter } }).select('_id fcmTokens role');
    const notifications = users.map((user) => ({
        userId: user._id,
        type: notification_interface_1.NotificationType.ACCOUNT_STATUS_CHANGED,
        title: broadcast.title,
        message: broadcast.description || broadcast.title,
        imageUrl: broadcast.imageUrl || null,
        priority: notification_interface_1.NotificationPriority.MEDIUM,
        isRead: false,
    }));
    if (notifications.length > 0) {
        yield notification_model_1.Notification.insertMany(notifications);
    }
    // Send FCM push notifications
    const fcmTokens = [];
    for (const user of users) {
        if (user.fcmTokens && user.fcmTokens.length > 0) {
            fcmTokens.push(...user.fcmTokens);
        }
    }
    if (fcmTokens.length > 0) {
        yield (0, fcm_1.sendFCMToTokens)(fcmTokens, broadcast.title, broadcast.description || broadcast.title, broadcast.imageUrl, { type: 'BROADCAST' });
    }
    // Update delivery count and sent time
    broadcast.deliveryCount = fcmTokens.length;
    broadcast.sentAt = new Date();
    yield broadcast.save();
    return broadcast;
});
const getAllBroadcasts = () => __awaiter(void 0, void 0, void 0, function* () {
    return broadcast_model_1.BroadcastNotification.find().sort({ createdAt: -1 });
});
const updateBroadcast = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const broadcast = yield broadcast_model_1.BroadcastNotification.findByIdAndUpdate(id, payload, { new: true });
    if (!broadcast)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Broadcast not found');
    return broadcast;
});
const deleteBroadcast = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const broadcast = yield broadcast_model_1.BroadcastNotification.findByIdAndDelete(id);
    if (!broadcast)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Broadcast not found');
    return broadcast;
});
exports.broadcastService = {
    createBroadcast,
    sendBroadcast,
    getAllBroadcasts,
    updateBroadcast,
    deleteBroadcast,
};
