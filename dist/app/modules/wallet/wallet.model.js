"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModel = void 0;
const mongoose_1 = require("mongoose");
// Wallet Schema
const walletSchema = new mongoose_1.Schema({
    lawyerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    payableBalance: {
        type: Number,
        default: 0,
    },
    pendingBalance: {
        type: Number,
        default: 0,
    },
    totalEarned: {
        type: Number,
        default: 0,
    },
    totalPlatformFee: {
        type: Number,
        default: 0,
    },
    totalReceived: {
        type: Number,
        default: 0,
    },
    transactions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Payment',
        },
    ],
}, {
    timestamps: true,
    versionKey: false,
});
// Wallet Model
exports.WalletModel = (0, mongoose_1.model)('Wallet', walletSchema);
