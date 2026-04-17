"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientReview = void 0;
const mongoose_1 = require("mongoose");
const clientReviewSchema = new mongoose_1.Schema({
    clientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ClientProfile',
        required: false,
    },
    lawyerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LawyerProfile',
        required: false,
    },
    serviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Service',
        required: false,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        trim: true,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.ClientReview = (0, mongoose_1.model)('ClientReview', clientReviewSchema);
