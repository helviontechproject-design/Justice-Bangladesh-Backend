"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = void 0;
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderRole: {
        type: String,
        enum: ['CLIENT', 'LAWYER'],
        required: true,
    },
    contentType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text',
    },
    reactions: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }, emoji: String, _id: false,
        }
    ],
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    content: {
        type: String,
        trim: true,
        maxlength: 5000,
    },
    imageOrFileUrl: {
        type: String,
        trim: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
    readAt: {
        type: Date,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.MessageModel = (0, mongoose_1.model)('Message', MessageSchema);
