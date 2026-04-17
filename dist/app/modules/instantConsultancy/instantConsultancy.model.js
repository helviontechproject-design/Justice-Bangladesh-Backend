"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantConsultancyModel = void 0;
const mongoose_1 = require("mongoose");
const instantConsultancy_interface_1 = require("./instantConsultancy.interface");
const instantConsultancySchema = new mongoose_1.Schema({
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ClientProfile', required: true },
    lawyerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LawyerProfile', default: null },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    callType: { type: String, enum: ['audio'], default: 'audio' },
    note: { type: String, trim: true },
    channelName: { type: String },
    status: {
        type: String,
        enum: Object.values(instantConsultancy_interface_1.InstantConsultancyStatus),
        default: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING,
    },
    fee: { type: Number, default: instantConsultancy_interface_1.INSTANT_CONSULTATION_FEE },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    bkashPaymentID: { type: String },
}, { timestamps: true });
exports.InstantConsultancyModel = (0, mongoose_1.model)('InstantConsultancy', instantConsultancySchema);
