"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantConsultancyItemModel = exports.InstantConsultancySettingsModel = exports.InstantConsultancyModel = void 0;
const mongoose_1 = require("mongoose");
const instantConsultancy_interface_1 = require("./instantConsultancy.interface");
const instantConsultancySchema = new mongoose_1.Schema({
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ClientProfile', required: true },
    lawyerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LawyerProfile', default: null },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    appointmentType: { type: String, enum: ['Audio Call', 'Video Call'], default: 'Audio Call' },
    note: { type: String, trim: true },
    documents: [{ type: String }],
    channelName: { type: String },
    status: {
        type: String,
        enum: Object.values(instantConsultancy_interface_1.InstantConsultancyStatus),
        default: instantConsultancy_interface_1.InstantConsultancyStatus.WAITING,
    },
    fee: { type: Number, default: instantConsultancy_interface_1.INSTANT_CONSULTATION_FEE },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    bkashPaymentID: { type: String },
    bkashTrxID: { type: String },
}, { timestamps: true });
const instantConsultancySettingsSchema = new mongoose_1.Schema({
    fee: { type: Number, default: instantConsultancy_interface_1.INSTANT_CONSULTATION_FEE },
    durationMinutes: { type: Number, default: 10 },
    isEnabled: { type: Boolean, default: true },
}, { timestamps: true });
exports.InstantConsultancyModel = (0, mongoose_1.model)('InstantConsultancy', instantConsultancySchema);
exports.InstantConsultancySettingsModel = (0, mongoose_1.model)('InstantConsultancySettings', instantConsultancySettingsSchema);
const instantConsultancyItemSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    fee: { type: Number, required: true },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
}, { timestamps: true });
exports.InstantConsultancyItemModel = (0, mongoose_1.model)('InstantConsultancyItem', instantConsultancyItemSchema);
