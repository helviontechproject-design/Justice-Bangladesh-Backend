"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceBookingModel = void 0;
const mongoose_1 = require("mongoose");
const serviceBooking_interface_1 = require("./serviceBooking.interface");
const documentSchema = new mongoose_1.Schema({ label: String, url: String, originalName: String }, { _id: false });
const serviceBookingSchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true },
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ClientProfile', required: true },
    trackingCode: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: Object.values(serviceBooking_interface_1.ServiceBookingStatus),
        default: serviceBooking_interface_1.ServiceBookingStatus.PENDING,
    },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    transactionId: { type: String, trim: true },
    applicantName: { type: String, required: true, trim: true },
    applicantPhone: { type: String, required: true, trim: true },
    documents: { type: [documentSchema], default: [] },
    rejectReason: { type: String, trim: true },
}, { timestamps: true });
exports.ServiceBookingModel = (0, mongoose_1.model)('ServiceBooking', serviceBookingSchema);
