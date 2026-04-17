"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastNotification = void 0;
const mongoose_1 = require("mongoose");
const broadcast_interface_1 = require("./broadcast.interface");
const BroadcastNotificationSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String },
    recipientType: { type: String, enum: Object.values(broadcast_interface_1.ERecipientType), default: broadcast_interface_1.ERecipientType.ALL },
    deliveryCount: { type: Number, default: 0 },
    sentAt: { type: Date, default: null },
}, { timestamps: true });
exports.BroadcastNotification = (0, mongoose_1.model)('BroadcastNotification', BroadcastNotificationSchema);
