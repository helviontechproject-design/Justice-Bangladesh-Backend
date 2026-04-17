"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Policy = void 0;
const mongoose_1 = require("mongoose");
const policySchema = new mongoose_1.Schema({
    type: { type: String, enum: ['terms', 'privacy', 'payment', 'refund', 'about'], required: true },
    role: { type: String, enum: ['CLIENT', 'LAWYER'], required: true },
    content: { type: String, required: true, default: '' },
}, { timestamps: true });
policySchema.index({ type: 1, role: 1 }, { unique: true });
exports.Policy = (0, mongoose_1.model)('Policy', policySchema);
