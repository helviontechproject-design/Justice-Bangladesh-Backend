"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.failPayoutZodSchema = exports.processPayoutZodSchema = exports.requestPayoutZodSchema = void 0;
const zod_1 = require("zod");
exports.requestPayoutZodSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Amount must be positive').min(100, 'Minimum payout amount is 100 BDT'),
    paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
    accountDetails: zod_1.z.object({
        accountNumber: zod_1.z.string().min(1, 'Account number is required'),
        accountName: zod_1.z.string().min(1, 'Account name is required'),
        bankName: zod_1.z.string().optional(),
        branchName: zod_1.z.string().optional(),
        mobileNumber: zod_1.z.string().optional(),
    }),
});
exports.processPayoutZodSchema = zod_1.z.object({
    providerPayoutId: zod_1.z.string().optional(),
});
exports.failPayoutZodSchema = zod_1.z.object({
    failureReason: zod_1.z.string().min(1, 'Failure reason is required'),
});
