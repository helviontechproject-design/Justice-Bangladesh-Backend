"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payout = void 0;
const mongoose_1 = require("mongoose");
const payout_interface_1 = require("./payout.interface");
const PayoutSchema = new mongoose_1.Schema({
    lawyerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    platformFee: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    netAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'BDT',
    },
    status: {
        type: String,
        enum: Object.values(payout_interface_1.PayoutStatus),
        default: payout_interface_1.PayoutStatus.PENDING,
        index: true,
    },
    providerPayoutId: {
        type: String,
        default: null,
    },
    paymentMethod: {
        type: String,
        default: null,
    },
    accountDetails: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
    },
    failureReason: {
        type: String,
        default: null,
    },
    requestedAt: {
        type: Date,
        default: Date.now,
    },
    processedAt: {
        type: Date,
        default: null,
    },
    bookingIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Booking',
        },
    ],
}, {
    timestamps: true,
});
exports.Payout = (0, mongoose_1.model)('Payout', PayoutSchema);
