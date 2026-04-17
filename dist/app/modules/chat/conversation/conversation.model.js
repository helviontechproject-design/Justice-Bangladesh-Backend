"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = void 0;
const mongoose_1 = require("mongoose");
const ConversationSchema = new mongoose_1.Schema({
    appointmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
        unique: true,
    },
    lawyerUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    clientUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastMessageAt: {
        type: Date,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.ConversationModel = (0, mongoose_1.model)('Conversation', ConversationSchema);
