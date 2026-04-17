"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const reportSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    userRole: { type: String, enum: ['CLIENT', 'LAWYER'], required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
    adminReply: { type: String, default: '' },
    repliedAt: { type: Date },
}, { timestamps: true });
exports.Report = (0, mongoose_1.model)('Report', reportSchema);
