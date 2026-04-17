"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = require("mongoose");
const payment_interface_1 = require("./payment.interface");
const paymentSchema = new mongoose_1.Schema({
    lawyerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LawyerProfile',
        required: true,
    },
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ClientProfile',
        required: true,
    },
    appointmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    type: {
        type: String,
        enum: Object.values(payment_interface_1.PaymentType),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(payment_interface_1.PaymentStatus),
        default: payment_interface_1.PaymentStatus.UNPAID,
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    paymentGatewayData: {
        type: String,
    },
    invoiceUrl: {
        type: String,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Payment = (0, mongoose_1.model)('Payment', paymentSchema);
