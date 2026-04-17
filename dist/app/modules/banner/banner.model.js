"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Banner = void 0;
const mongoose_1 = require("mongoose");
const bannerSchema = new mongoose_1.Schema({
    ImageUrl: {
        type: String,
        required: true,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    target: {
        type: String,
        enum: ['client', 'lawyer', 'all'],
        default: 'all',
    },
}, {
    timestamps: true,
});
exports.Banner = (0, mongoose_1.model)('Banner', bannerSchema);
