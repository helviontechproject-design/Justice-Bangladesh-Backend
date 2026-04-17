"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notification_interface_1 = require("./notification.interface");
const NotificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: Object.values(notification_interface_1.NotificationType),
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    priority: {
        type: String,
        enum: Object.values(notification_interface_1.NotificationPriority),
        default: notification_interface_1.NotificationPriority.MEDIUM,
    },
    relatedEntityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null,
    },
    actionUrl: {
        type: String
    },
    imageUrl: {
        type: String,
        default: null,
    },
    relatedEntityType: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});
// Compound index for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
exports.Notification = (0, mongoose_1.model)('Notification', NotificationSchema);
