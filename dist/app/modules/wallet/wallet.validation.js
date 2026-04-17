"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWalletZod = void 0;
const zod_1 = require("zod");
exports.updateWalletZod = zod_1.z.object({
    balance: zod_1.z.number().min(0, 'Balance cannot be negative').optional(),
    pendingBalance: zod_1.z.number().min(0, 'Pending balance cannot be negative').optional(),
    totalEarned: zod_1.z.number().min(0, 'Total earned cannot be negative').optional(),
});
