"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientProfileModel = void 0;
const mongoose_1 = require("mongoose");
const lawyer_interface_1 = require("../lawyer/lawyer.interface");
const ProfileDetailsSchema = new mongoose_1.Schema({
    fast_name: { type: String },
    last_name: { type: String },
    email: { type: String },
    phone: { type: String },
    photo: { type: String },
    paypal_Email: { type: String },
    street_address: { type: String },
    district: { type: String },
}, { _id: false });
// ===== Main Schema =====
const ClientProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    profileInfo: { type: ProfileDetailsSchema },
    address: { type: String },
    gender: { type: String, enum: Object.values(lawyer_interface_1.EGender) },
    savedLawyers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'LawyerProfile' }],
}, {
    timestamps: true,
});
// ===== Model =====
exports.ClientProfileModel = (0, mongoose_1.model)('ClientProfile', ClientProfileSchema);
